# PACOTE STORAGE 1 — FOUNDATION SPEC

Data base do pacote: 2026-06-01  
Branch: `feature/storage-foundation`  
Escopo: somente especificação técnica e governança para execução local posterior.

## 1. Estado atual consolidado

### 1.1 Supabase Storage
- Bucket alvo: `project-files` (privado).
- Estratégia de acesso: somente signed URLs (sem exposição pública de bucket).
- Objeto físico: `storage.objects`.
- Metadata funcional: tabela `documents`.

### 1.2 Modelo de dados relacionado
- `projects`: entidade raiz do contexto do projeto.
- `project_members`: vínculo usuário-projeto (papel e escopo de acesso).
- `profiles`: identidade e papel global (owner/admin/member/guest conforme política vigente).
- `documents`: catálogo de arquivos e metadados (nome lógico, tipo, caminho, vínculo a projeto).
- `storage.objects`: arquivo físico real no bucket.

### 1.3 Integrações já mapeadas
- Fluxo `/nova-analise`: cria contexto inicial de projeto e precisa publicar documentos no bucket privado.
- Fluxo `/projeto/[id]`: lista, consulta e consome arquivos do projeto via signed URL.

## 2. Gaps identificados

1. Falta consolidação final de políticas de acesso em Storage para alinhar `documents` + `project_members`.
2. Falta contrato fechado para APIs de signed URL com checagem de ownership.
3. Falta migration idempotente única para reduzir risco de ambiente parcialmente provisionado.
4. Falta validação E2E autenticada real (fora deste ambiente remoto).

## 3. Matriz de acesso (alvo)

- Owner:
  - leitura/escrita em arquivos dos projetos sob governança da organização.
  - auditoria completa de metadata (`documents`) e geração de signed URLs.
- Admin:
  - leitura/escrita nos projetos onde possui vínculo autorizado.
  - sem acesso transversal fora do escopo de projeto permitido.
- Member/Collaborator:
  - leitura/escrita limitada por `project_members` + política de papel.
- Guest/sem token:
  - sem acesso a dados privados e sem geração de signed URLs.

## 4. Modelo de autorização (alvo)

1. Autenticação obrigatória antes de qualquer operação Storage privada.
2. Autorização por projeto:
   - validar `project_members` para o usuário autenticado.
   - validar vínculo do `document` ao `project_id` solicitado.
3. Operações de signed URL:
   - gerar URL com TTL curto.
   - negar quando usuário não for membro autorizado do projeto.
4. Service role:
   - uso somente server-side e nunca exposto ao browser.

## 5. Contrato funcional planejado de APIs Storage

- `POST /api/storage/signed-url` (download):
  - entrada: `document_id` ou `project_id + object_path`.
  - validações: auth, membership, ownership do documento.
  - saída: signed URL temporária.

- `POST /api/storage/upload-url` (opcional para fase seguinte):
  - entrada: metadados mínimos do arquivo + contexto do projeto.
  - saída: signed upload URL + instruções de persistência em `documents`.

Observação: a implementação de API fica para execução local; este pacote apenas congela a especificação.

## 6. RLS/Policies alvo

### 6.1 `documents`
- leitura: usuário autenticado com vínculo ativo no `project_id`.
- inserção/atualização: usuário autenticado autorizado no projeto.
- deleção: regra restrita (owner/admin ou política definida por projeto).

### 6.2 `storage.objects` (`project-files`)
- negar acesso público.
- permitir operações apenas via políticas atreladas ao usuário autenticado e contexto do projeto.
- path naming recomendado: `projects/{project_id}/{document_id}/{filename}`.

## 7. Riscos e controles

1. **Risco de vazamento por política ampla em Storage**  
   Controle: policies por projeto + testes negativos sem vínculo.
2. **Risco de inconsistência metadata x objeto físico**  
   Controle: fluxo transacional de criação em `documents` e confirmação de objeto.
3. **Risco de ambiente parcialmente provisionado**  
   Controle: migration idempotente (`IF NOT EXISTS`, checks em constraints/policies).
4. **Risco de uso incorreto de chave sensível**  
   Controle: frontend apenas anon/publishable; service role só backend.

## 8. Critérios de aceite do STORAGE-1 (documental)

- Especificação única consolidada publicada.
- Modelo de autorização explícito e validável.
- Dependências de execução local definidas (handoff).
- Sem implementação parcial enganosa neste ambiente remoto.

## 9. Plano para migration idempotente futura (execução local)

1. Criar/validar bucket `project-files` privado.
2. Criar/ajustar policies Storage com guardas idempotentes.
3. Reconciliar `documents` para vínculo consistente com `projects`.
4. Validar constraints e índices com `IF NOT EXISTS` ou `DO $$` defensivo.
5. Rodar testes de autorização (owner/admin/member/guest).
6. Validar fluxo completo `/nova-analise` -> upload -> `/projeto/[id]`.

## 10. Fora de escopo neste pacote

- Aplicação de migration.
- Build/teste E2E real com upload em Supabase.
- Alterações em CRM/Revenue.
- Alterações em Ebook/Revit.
