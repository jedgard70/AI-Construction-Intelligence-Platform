# Pacote Storage — Auditoria e Plano de Implementacao

## Base

- Repositorio: `jedgard70/AI-Construction-Intelligence-Platform`
- Branch base: `main`
- Base commit informado: `de7d79c2cf54e6c41677971a04986bf5ac144d76`
- Contexto anterior: Help AI Advanced PR1-PR7 concluido e publicado em producao
- Escopo desta fase: auditoria e planejamento Storage

## Regras operacionais preservadas

- Nao criar clone.
- Nao usar pasta paralela.
- Nao mexer em Ebook.
- Nao mexer em Revit.
- Nao mexer no patch CRM/Revenue preservado.
- Nao misturar com Help AI.
- Nao pedir token/secret no chat.
- Nao apagar nada.
- Trabalhar em PRs separados.
- Abrir PR automatico quando o conector permitir.
- Auditar antes de merge.
- Squash and merge somente se aprovado.

## Objetivo geral do pacote

Fechar Storage real da plataforma, cobrindo:

- upload de arquivos;
- bucket privado `project-files`;
- tabela `documents` como metadata operacional;
- signed URLs server-side;
- integracao com `/nova-analise` e `/projeto/[id]`;
- RLS e policies seguras;
- validacao E2E com usuario real quando ambiente seguro estiver disponivel.

## Auditoria do estado atual

### 1. Supabase Storage

Resultado observado no Supabase conectado:

- Existe schema `storage` com `storage.buckets` e `storage.objects`.
- Existe 1 bucket configurado.
- Foram encontradas policies em `storage.objects` para o bucket `project-files`.
- `storage.objects` esta com RLS habilitado.
- A tabela `storage.objects` esta vazia no momento da auditoria conectada.

### 2. Bucket `project-files`

Estado observado:

- Bucket `project-files` existe.
- O bucket deve permanecer privado.
- Acesso externo deve ocorrer apenas por signed URL emitida por API server-side.

Risco observado:

- As policies em `storage.objects` parecem tentar validar projeto pelo path `projects/<project_id>/...`, mas ha condicoes que precisam ser revisadas em PR de foundation para evitar comparacao incorreta entre `projects.id` e tokens derivados de outro campo.

### 3. Tabela `documents`

Estado observado:

- A tabela `documents` existe no Supabase conectado.
- A aplicacao ja insere metadata em `documents` em fluxos existentes.
- Campos usados pelo app incluem:
  - `project_id`
  - `user_id`
  - `uploaded_by`
  - `name`
  - `file_name`
  - `file_path`
  - `file_size_kb`
  - `mime_type`
  - `category`
  - `status`
  - `ai_summary`
  - `ai_tags`
  - `ai_entities`
  - `created_at`

Ponto critico:

- A metadata existe, mas o upload real para o bucket ainda nao esta fechado ponta a ponta.

### 4. Migrations existentes

Estado observado no repositorio:

- Existem migrations antigas em `acip-migrations/acip-migrations/supabase/migrations`.
- A migration de projetos cobre `projects`, `project_members`, `bim_documents`, ocorrencias e KPIs.
- O setup completo (`SUPABASE_SETUP_COMPLETO.sql`) contem estrutura ampla e RLS, mas nao deve ser tratado como unica fonte operacional para o pacote Storage.

Conclusao:

- PR STORAGE-1 deve adicionar migration idempotente especifica para Storage, sem depender de scripts monoliticos.

### 5. APIs Storage existentes

Busca no repositorio nao identificou endpoints dedicados:

- `pages/api/storage/upload`
- `pages/api/storage/signed-url`
- `pages/api/storage/project-files`

Conclusao:

- APIs Storage precisam ser implementadas em PR STORAGE-2.

### 6. `/nova-analise`

Estado observado:

- A tela ja aceita arquivo local no formulario.
- Valida extensoes permitidas.
- Cria projeto no Supabase.
- Cria registro em `documents` com `file_path` calculado em `projects/<project_id>/intake/...`.
- Registra `storage_bucket: project-files` e `storage_status: prepared_pending_bucket` em `ai_entities`.

Gap:

- Nao foi identificado upload real do arquivo para Supabase Storage nessa tela.

Conclusao:

- `/nova-analise` esta preparada para metadata, mas precisa chamar API server-side de upload no PR STORAGE-3.

### 7. `/projeto/[id]` / Project Workspace

Estado observado:

- A pagina carrega projeto, documentos e eventos.
- A aba `Arquivos` lista documentos do projeto por `project_id`.
- A UI exibe nome, categoria e status.

Gap:

- Nao foi identificado botao/acao de download via signed URL.
- A listagem nao deve expor path privado.

Conclusao:

- PR STORAGE-3 deve integrar listagem via API segura e download via signed URL.

### 8. RLS / policies

Estado observado:

- RLS existe em `projects`, `documents`, `project_members`, `clients` e `storage.objects`.
- Algumas policies sao amplas demais para Storage operacional real.

Riscos identificados:

- `documents_select` / `documents_select_authenticated` permitem leitura para qualquer autenticado.
- `projects_select_authenticated` permite leitura ampla para qualquer autenticado.
- `project_members` possui policy ampla para autenticados e leitura anonima em ambiente conectado.
- Policies duplicadas podem causar permissao efetiva mais permissiva que o desejado.

Conclusao:

- PR STORAGE-1 deve endurecer RLS de `documents` e storage access sem quebrar fluxo existente.
- O endurecimento precisa considerar compatibilidade com Owner/Admin/roles atuais e com projetos criados por `created_by`, `owner_id`, `manager_id`, `coordinator_id` e `project_members`.

### 9. Signed URL

Estado observado:

- Nao foi encontrado endpoint de signed URL.
- Nao foi identificado fluxo server-side para gerar signed URL controlada.

Conclusao:

- PR STORAGE-2 deve criar endpoint server-side para signed URL, validando token e acesso ao projeto/documento antes de chamar Supabase Storage.

### 10. Upload real

Estado observado:

- Existe metadata preparada.
- Nao foi identificado upload real para bucket `project-files` em `/nova-analise` ou API dedicada.

Conclusao:

- PR STORAGE-2 deve implementar API de upload.
- PR STORAGE-3 deve integrar UI.

### 11. Download controlado

Estado observado:

- Nao ha fluxo completo documentado/implementado para download via signed URL.

Conclusao:

- Download direto por storage path privado nao deve ser exposto.
- UI deve solicitar signed URL ao backend e abrir somente URL temporaria autorizada.

### 12. Vinculo `project_id` / `client_id` / `user_id`

Estado observado:

- `/nova-analise` cria projeto com `client_id` e `created_by`.
- O documento e registrado com `project_id`, `user_id`, `uploaded_by` e `file_path`.
- `/projeto/[id]` lista documentos por `project_id`.

Gap:

- Falta validar acesso ao projeto no backend antes de upload/list/download.

Conclusao:

- PR STORAGE-2 deve centralizar validacao de acesso a projeto.

## Decisao de caminho seguro

A auditoria confirma caminho seguro para seguir, desde que a implementacao seja dividida em PRs limpos:

1. Primeiro foundation/RLS/bucket/documents idempotente.
2. Depois APIs server-side.
3. Depois UI.
4. Por fim E2E e docs finais.

Nao e seguro pular direto para UI antes de endurecer RLS e APIs.

## Plano por PR

### PR STORAGE-1 — Database / Storage Foundation

Branch:

- `feature/storage-foundation`

Escopo permitido:

- `supabase/migrations/*storage*.sql`
- `docs/PR_STORAGE_1_FOUNDATION.md`

Objetivo:

- Garantir bucket privado `project-files`.
- Garantir estrutura minima de `documents` sem duplicar tabela.
- Adicionar colunas faltantes via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Criar indices relevantes.
- Endurecer RLS e policies para `documents` e `storage.objects`.
- Evitar policies amplas que liberem qualquer autenticado indevidamente.

Criterios de aceite:

- Migration idempotente.
- Bucket privado.
- Policies por projeto/owner/role.
- Nenhum schema de Ebook/Revit/CRM alterado.
- Build passa.
- Se possivel, migration aplicada em Supabase linked ou validada por SQL seguro.

### PR STORAGE-2 — Storage APIs

Branch:

- `feature/storage-apis`

Escopo permitido:

- `pages/api/storage/*`
- `pages/api/projects/*` somente se necessario
- `lib/*` helper storage somente se necessario
- `docs/PR_STORAGE_2_APIS.md`

Objetivo:

- Criar APIs para upload, signed URL e listagem por projeto.
- Validar Authorization Bearer JWT.
- Validar acesso ao projeto antes de qualquer operacao.
- Usar service role apenas server-side, sem expor secrets.
- Registrar metadata em `documents`.
- Nao expor storage path privado para usuario sem autorizacao.

Endpoints previstos:

- `POST /api/storage/upload`
- `POST /api/storage/signed-url`
- `GET /api/storage/project-files?project_id=`
- `DELETE /api/storage/file` apenas se seguro; caso contrario manter planejado.

Criterios de aceite:

- Sem token retorna 401.
- Token invalido retorna 401.
- Usuario sem acesso ao projeto retorna 403/404 seguro.
- Upload com token valido cria objeto e metadata.
- Signed URL so e emitida para documento autorizado.
- Build passa.

### PR STORAGE-3 — UI / Project Workspace Integration

Branch:

- `feature/storage-ui-project-workspace`

Escopo permitido:

- `pages/nova-analise.tsx`
- `pages/projeto/[id].tsx`
- `components/*` somente se necessario para uploader/lista
- `docs/PR_STORAGE_3_UI_PROJECT_WORKSPACE.md`

Objetivo:

- Integrar upload real na UI.
- `/nova-analise` deve enviar arquivo para API Storage ao criar projeto/analise.
- `/projeto/[id]` deve mostrar arquivos do projeto via API segura.
- Download deve usar signed URL.
- UI nao deve expor path privado.
- Erros devem ser claros.

Criterios de aceite:

- Build passa.
- `/nova-analise` renderiza.
- `/projeto/[id]` renderiza.
- Upload real validado quando credenciais seguras estiverem disponiveis.
- Download por signed URL validado quando credenciais seguras estiverem disponiveis.

### PR STORAGE-4 — E2E Storage Validation + Docs

Branch:

- `feature/storage-e2e-validation`

Escopo permitido:

- `docs/PR_STORAGE_4_E2E_VALIDATION.md`
- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/PACOTE_MASTER_002_INDEX.md`
- Ajustes minimos se E2E revelar bug real

Objetivo:

Validar ponta a ponta:

1. login real;
2. nova analise/projeto;
3. upload arquivo;
4. metadata `documents`;
5. project workspace;
6. signed URL;
7. download controlado.

Criterios de aceite:

- Owner acessa.
- Admin/usuario acessa apenas projetos permitidos.
- Guest bloqueado.
- Arquivo privado nao abre sem signed URL.
- Signed URL expira/controlada.
- IDs reais documentados sem expor tokens ou secrets.
- Build passa.

## Riscos principais

1. Policies duplicadas podem manter permissao aberta mesmo apos nova policy restritiva.
2. `/nova-analise` hoje cria metadata antes de upload; a ordem precisa ser revisada para evitar registro orfao.
3. Projetos podem usar colunas historicas diferentes (`created_by`, `owner_id`, `manager_id`, `coordinator_id`).
4. Alguns fluxos legados podem depender de leitura ampla de `documents`.
5. Delete de arquivo e perigoso; deve ficar fora ate validacao segura.

## Recomendacoes tecnicas

- Implementar helper server-side de autorizacao de projeto.
- Preferir retorno 404/403 sem vazar existencia de projeto/documento.
- Paths de storage padronizados:
  - `projects/<project_id>/intake/<timestamp>-<safe_name>`
  - `projects/<project_id>/files/<timestamp>-<safe_name>`
- Nunca retornar service role ou storage path privado desnecessariamente.
- Signed URL com expiracao curta.
- Metadata `documents` deve conter bucket, path, tamanho, mime, uploader e project/client/user quando aplicavel.
- Delete fisico deve ser postergado ou protegido por checklist e soft-delete em metadata.

## Checklist de aceite do pacote Storage

- [ ] Bucket `project-files` privado e idempotente.
- [ ] `documents` com schema minimo e RLS segura.
- [ ] Upload real via API server-side.
- [ ] Signed URL via API server-side.
- [ ] Listagem por projeto validando acesso.
- [ ] UI `/nova-analise` integrada ao upload real.
- [ ] UI `/projeto/[id]` integrada a listagem/download.
- [ ] Guest bloqueado.
- [ ] Usuario sem permissao bloqueado.
- [ ] Owner/Admin validado conforme escopo permitido.
- [ ] Build aprovado em todos os PRs.
- [ ] E2E final documentado.

## Status apos Fase 0

- Auditoria inicial: concluida.
- Caminho seguro para seguir: confirmado.
- Proximo PR recomendado: STORAGE-1 (`feature/storage-foundation`).
- Storage operacional real: ainda nao; depende de STORAGE-1 a STORAGE-4.
