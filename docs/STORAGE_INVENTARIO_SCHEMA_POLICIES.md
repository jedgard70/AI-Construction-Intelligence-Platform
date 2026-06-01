# Storage — Inventario de Schema e Politicas

## Objetivo

Registrar o mapeamento real antes de qualquer migration de Storage.

Este documento e somente auditoria. Nenhuma alteracao de banco foi aplicada.

## Repositorio e branch

- Repositorio: `jedgard70/AI-Construction-Intelligence-Platform`
- Branch: `feature/storage-foundation`
- Base: `main` apos PR #47

## Tabelas e areas mapeadas

### Supabase Storage

- `storage.buckets`
- `storage.objects`

Estado conhecido:

- Storage ativo.
- Bucket `project-files` existente.
- Bucket deve permanecer privado.
- Objetos devem ser acessados somente por API autorizada ou link temporario.

### Public schema

Tabelas relacionadas ao Storage:

- `public.documents`
- `public.projects`
- `public.project_members`
- `public.profiles`
- `public.clients`

## Documents

Uso atual no app:

- `/nova-analise` cria metadata de documento.
- `/projeto/[id]` lista documentos por projeto.
- `/documentos` usa documentos como camada de inteligencia documental.

Indices confirmados:

- `documents_pkey`
- `idx_documents_project`
- `idx_documents_category`
- `idx_documents_status`
- `idx_documents_expires`

RLS:

- RLS ligado.
- Force RLS nao confirmado como ligado.

Risco:

- Ha regras legadas amplas que permitem leitura para usuarios autenticados.
- Antes de upload real, o acesso deve ser restrito por projeto, usuario ou uploader.

## Projects

Colunas relevantes para autorizacao:

- `id`
- `created_by`
- `owner_id`
- `manager_id`
- `coordinator_id`
- `client_id`

Uso:

- projeto e criado em `/nova-analise`.
- projeto e aberto em `/projeto/[id]`.

Risco:

- Ha regra legada ampla para leitura por usuario autenticado.
- Para Storage multiusuario, leitura ampla de projeto enfraquece a seguranca dos documentos vinculados.

## Project Members

Uso esperado:

- vincular usuarios a projetos.
- servir como base de permissao de acesso a arquivos por projeto.

Risco:

- Ha regra ampla para usuarios autenticados e leitura anonima detectada no ambiente conectado.
- Deve ser revisada antes de API Storage.

## Profiles

Uso esperado:

- identificar usuario e papel operacional.
- permitir elevacao controlada para perfis como diretor executivo e coordenador de projetos.

Risco:

- Qualquer elevacao deve ser restrita a perfis ativos.

## Clients

Uso esperado:

- vinculo comercial/operacional do projeto.
- contexto de propriedade indireta.

Risco:

- Ha regras sobrepostas, algumas amplas para autenticados.
- O pacote Storage nao deve alterar clients diretamente sem necessidade.

## Padrao de path recomendado

Para evitar ambiguidade nas regras de Storage:

- `projects/<project_id>/intake/<timestamp>-<safe_file_name>`
- `projects/<project_id>/files/<timestamp>-<safe_file_name>`

Regras:

- `project_id` deve ser UUID.
- O path privado nao deve ser exibido livremente na UI.
- Download deve usar link temporario emitido por API.

## Autorizacao recomendada

Uma verificacao central deve considerar acesso valido quando o usuario for:

- criador do projeto;
- owner do projeto;
- manager do projeto;
- coordinator do projeto;
- membro do projeto;
- perfil ativo com papel elevado explicitamente permitido.

## API futura deve validar

- Authorization Bearer presente.
- Token valido.
- Projeto existe e usuario tem acesso.
- Documento pertence ao projeto autorizado.
- Path pertence ao bucket `project-files` e ao projeto correto.

## Itens fora do escopo neste inventario

- Ebook.
- Revit.
- CRM/Revenue.
- Help AI.
- Delete fisico de arquivos.
- Aplicacao de migration em producao.

## Conclusao

O Storage nao comeca do zero, mas ainda nao e operacional real ponta a ponta.

Antes de upload e signed URL, a etapa correta e uma foundation conservadora com governanca de acesso por projeto.
