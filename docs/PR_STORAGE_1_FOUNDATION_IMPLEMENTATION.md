# PR STORAGE-1 FOUNDATION IMPLEMENTATION

Data: 2026-06-01  
Branch: `feature/storage-foundation-implementation`  
Base: `origin/main` atualizado após PR #47

## 1) Objetivo executado

Implementação real do STORAGE-1 Foundation com:
- migration idempotente;
- bucket privado `project-files`;
- consolidação de metadata em `public.documents`;
- RLS/policies de `documents`;
- policies em `storage.objects` para acesso por projeto.

## 2) Arquivos alterados

1. `supabase/migrations/20260601101000_storage_foundation_documents.sql`
2. `docs/PR_STORAGE_1_FOUNDATION_IMPLEMENTATION.md`

## 3) Migration criada

Arquivo:
- `supabase/migrations/20260601101000_storage_foundation_documents.sql`

Escopo implementado:
- `insert ... on conflict` para garantir bucket `project-files` privado (`public=false`);
- `create table if not exists public.documents`;
- `alter table ... add column if not exists` para campos de metadata:
  - `project_id`
  - `owner_user_id`
  - `created_by`
  - `storage_bucket`
  - `storage_path`
  - `mime_type`
  - `file_size`
  - `original_name`
  - `metadata`
  - `created_at`
  - `updated_at`
- backfill defensivo para defaults/NULLs críticos;
- índices úteis para consulta e lookup;
- constraints/FKs defensivas com checagem de existência;
- `enable row level security` em `public.documents`;
- policies `documents_*_scoped`;
- policies `project_files_*_scoped` em `storage.objects` para bucket `project-files`.

## 4) Comandos executados

1. `git status --short --branch`
2. `git fetch origin`
3. `git checkout main`
4. `git pull --ff-only origin main`
5. `git checkout -b feature/storage-foundation-implementation`
6. `npm run build -- --webpack`
7. `npx supabase link --project-ref stjhkxwylqtihzflspqe`
8. `npx supabase db push --linked`
9. `npx supabase migration list --linked`
10. Queries de validação via `npx supabase db query --linked`

## 5) Resultados

### 5.1 Build
- `npm run build -- --webpack` ✅ passou.

### 5.2 Push de migration
- `npx supabase db push --linked` ✅ aplicado com sucesso.
- Migration list confirma remoto com:
  - `20260601101000_storage_foundation_documents`.

### 5.3 Bucket
Query executada:
- `select id, name, public from storage.buckets where id = 'project-files';`

Resultado:
- `id=project-files`, `name=project-files`, `public=false` ✅

### 5.4 Tabela documents
Query executada para colunas-alvo em `information_schema.columns`.

Resultado confirmado:
- `project_id`
- `owner_user_id`
- `created_by`
- `storage_bucket` (NOT NULL)
- `storage_path`
- `mime_type`
- `file_size`
- `original_name` (NOT NULL)
- `metadata` (NOT NULL)
- `created_at` (NOT NULL)
- `updated_at` (NOT NULL)

### 5.5 Policies/RLS
Policies `*_scoped` confirmadas:
- `documents_select_scoped`
- `documents_insert_scoped`
- `documents_update_scoped`
- `documents_delete_scoped`
- `project_files_select_scoped`
- `project_files_insert_scoped`
- `project_files_update_scoped`
- `project_files_delete_scoped`

## 6) Ajuste técnico durante execução

Falha inicial de idempotência detectada:
- FK `documents_project_id_fkey` já existia no remoto com variação legada.

Correção aplicada:
- hardening das checagens por `conname` + `pg_get_constraintdef` antes de `add constraint`.
- reaplicação da migration com sucesso.

## 7) Riscos remanescentes

1. Existem policies legadas adicionais em `documents` e `storage.objects` além das `*_scoped`; precisa harmonização final para evitar sobreposição lógica.
2. Fluxo de API Storage ainda não implementado neste PR (escopo proposital para STORAGE-2).
3. Teste E2E de upload/download assinado ainda pendente para próximo pacote.

## 8) Pendências para STORAGE-2 (APIs)

1. Implementar endpoints de signed URL (upload/download) com validação de membership por `project_id`.
2. Garantir contrato API alinhado a `documents` + `storage_path`.
3. Executar E2E autenticado:
- `/nova-analise` -> upload -> `documents` -> `/projeto/[id]`.
4. Revisão final de políticas legadas vs `*_scoped`.

## 9) Confirmação de escopo

Não houve alteração em:
- CRM
- Revenue
- Help AI
- Ebook
- Revit
- `package.json` / `package-lock`
- UI
- APIs Storage (ainda não)

Patch preservado (não tocado):
- `recovery/pre-pr2-crm-revenue-local/crm-revenue-local.patch`
