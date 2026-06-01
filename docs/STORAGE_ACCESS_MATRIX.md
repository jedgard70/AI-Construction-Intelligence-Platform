# Storage — Matriz de Acesso e Hardening

## Objetivo

Definir a matriz de acesso que deve orientar o STORAGE-1 Foundation antes de qualquer migration de hardening.

Este documento nao altera banco, codigo, API ou UI.

## Principio geral

Nenhum arquivo de projeto deve ser acessivel apenas por usuario autenticado.

O acesso deve depender de vinculo explicito com o projeto ou papel elevado autorizado.

## Perfis considerados

| Perfil | Acesso esperado a arquivos |
| --- | --- |
| Guest / sem sessao | Nenhum acesso. Deve receber 401/login. |
| Usuario autenticado sem projeto | Nenhum acesso ao projeto/arquivo. Deve receber 403 ou 404 seguro. |
| Criador do projeto | Pode listar/upload/download arquivos do proprio projeto. |
| Owner do projeto | Pode listar/upload/download arquivos do projeto. |
| Manager do projeto | Pode listar/upload/download arquivos do projeto. |
| Coordinator do projeto | Pode listar/upload/download arquivos do projeto. |
| Membro em project_members | Pode listar/download conforme escopo do projeto. Upload pode depender do papel. |
| Diretor executivo ativo | Pode acessar arquivos por governanca executiva. |
| Coordenador de projetos ativo | Pode acessar arquivos por governanca operacional. |
| Admin sem relacao com projeto | Nao deve acessar arquivos privados automaticamente. |

## Matriz por operacao

| Operacao | Guest | Autenticado sem acesso | Membro do projeto | Owner/Manager/Coordinator | Papel elevado ativo |
| --- | --- | --- | --- | --- | --- |
| Listar documentos | Bloquear | Bloquear | Permitir | Permitir | Permitir |
| Ver metadata | Bloquear | Bloquear | Permitir | Permitir | Permitir |
| Upload | Bloquear | Bloquear | Permitir se papel autorizado | Permitir | Permitir |
| Gerar link temporario | Bloquear | Bloquear | Permitir | Permitir | Permitir |
| Download via link temporario | Bloquear | Bloquear | Permitir | Permitir | Permitir |
| Atualizar metadata | Bloquear | Bloquear | Restrito | Permitir | Permitir |
| Apagar metadata | Bloquear | Bloquear | Bloquear por padrao | Restrito | Restrito |
| Apagar objeto fisico | Bloquear | Bloquear | Bloquear | Bloquear por padrao | Somente com decisao explicita |

## Regras para Documents

A tabela `documents` deve aceitar acesso quando uma das condicoes for verdadeira:

- `documents.project_id` aponta para projeto acessivel pelo usuario;
- `documents.user_id` e o usuario autenticado;
- `documents.uploaded_by` e o usuario autenticado;
- usuario possui papel elevado ativo e aprovado.

Nao deve haver leitura global por qualquer autenticado.

## Regras para Projects

A tabela `projects` deve evitar leitura global por qualquer autenticado quando o objetivo for proteger arquivos e documentos.

Acesso esperado por projeto:

- `created_by = auth.uid()`;
- `owner_id = auth.uid()`;
- `manager_id = auth.uid()`;
- `coordinator_id = auth.uid()`;
- existe linha em `project_members`;
- papel elevado ativo explicitamente permitido.

## Regras para Project Members

`project_members` deve ser usado como tabela de autorizacao, nao como tabela publica.

Riscos a remover em hardening posterior:

- leitura anonima;
- all access para qualquer autenticado.

Acesso recomendado:

- usuario ve sua propria participacao;
- usuario com acesso ao projeto ve membros do projeto;
- papeis elevados ativos podem gerenciar membros.

## Regras para Storage Objects

Bucket: `project-files`.

Padrao de path:

- `projects/<project_id>/intake/<filename>`
- `projects/<project_id>/files/<filename>`

Regras:

- primeiro segmento deve ser `projects`;
- segundo segmento deve ser UUID de projeto;
- usuario precisa ter acesso ao projeto;
- UI nao deve depender de acesso direto ao path privado;
- API deve emitir link temporario apos validar documento e projeto.

## Signed URL

A signed URL deve ser gerada apenas no backend.

Fluxo esperado:

1. Usuario chama API com token valido.
2. API valida token.
3. API carrega metadata do documento.
4. API valida acesso ao projeto.
5. API gera link temporario curto.
6. API retorna somente a URL temporaria.

## Delete

Delete fisico deve ficar fora do primeiro ciclo operacional.

Recomendacao:

- STORAGE-2 pode omitir endpoint DELETE.
- Se necessario, iniciar com soft delete em metadata.
- Delete fisico deve exigir papel elevado e confirmacao operacional.

## Impacto por modulo

Nao alterar:

- Ebook;
- Revit;
- CRM/Revenue;
- Help AI.

Ajustes futuros permitidos somente nos PRs especificos:

- STORAGE-1: schema/policies/documentacao.
- STORAGE-2: APIs Storage.
- STORAGE-3: UI em nova analise e projeto.
- STORAGE-4: E2E e docs finais.

## Decisao

A migration do STORAGE-1 deve ser conservadora e revisada antes de aplicacao.

O pacote nao deve seguir para upload real enquanto a matriz de acesso nao estiver refletida no banco e nas APIs.
