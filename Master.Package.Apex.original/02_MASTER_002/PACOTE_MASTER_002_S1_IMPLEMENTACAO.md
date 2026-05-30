# PACOTE MASTER 002-S1 — IMPLEMENTACAO (CRM CORE)

Data: 2026-05-30
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Status S1B — ENV & AUTH HARDENING

- Status: **concluido (estabilizacao aplicada)**
- Escopo: auditoria e correcao de uso de chaves Supabase no frontend/backend, validacao de build e smoke tests de auth/CRM/workspace/storage.

## Auditoria de variaveis (arquivo/linha)

### NEXT_PUBLIC_SUPABASE_URL

- `lib/supabase.ts:8`
- `lib/supabase-store.ts:17`
- `pages/api/chat.js:39,43`
- `pages/api/agent-events/log.ts:36`
- `pages/api/autonomous/task.ts:53`
- `pages/api/autonomous/status.ts:17`
- `pages/api/config.js:4`
- `pages/api/storage/signed-url.ts:18`
- `pages/api/crm/_auth.ts:19`
- `pages/api/projects/create.js:6`

Finalidade: host base do projeto Supabase para clients browser/server.

### NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE

Frontend/browser:
- `lib/supabase.ts:10-11`
- `pages/api/crm/_auth.ts:10`
- `pages/api/agent-events/log.ts:21`
- `pages/api/storage/signed-url.ts:7`
- `pages/api/config.js:6-7`

Finalidade: autenticacao/session do usuario (chave publicavel).

### SUPABASE_SERVICE_ROLE_KEY

Backend/server-only:
- `lib/supabase-store.ts:18`
- `pages/api/chat.js:38`
- `pages/api/agent-events/log.ts:38`
- `pages/api/autonomous/task.ts:54`
- `pages/api/autonomous/status.ts:18`
- `pages/api/storage/signed-url.ts:20`
- `pages/api/projects/create.js:7`

Finalidade: operacoes server-side privilegiadas.

## Correcoes aplicadas

### ENV

- `.env.local` normalizado:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` agora espelha a chave publicavel (`sb_publishable_*`).
  - `SUPABASE_SERVICE_ROLE_KEY` preenchida com chave secreta (`sb_secret_*`).
  - removida duplicidade de `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Backend hardening (sem fallback publico)

Arquivos alterados:

1. `lib/supabase-store.ts`
- removido fallback para `NEXT_PUBLIC_*`; backend usa apenas `SUPABASE_SERVICE_ROLE_KEY`.

2. `pages/api/autonomous/status.ts`
- removido fallback para chave publica/anon.

3. `pages/api/autonomous/task.ts`
- removido fallback para chave publica/anon no `GET`.

4. `pages/api/chat.js`
- leitura de prompts agora exige `SUPABASE_SERVICE_ROLE_KEY`; retorna `503` se ausente.

5. `pages/api/projects/create.js`
- removido fallback para chave publica/anon; endpoint exige service role.

## Evidencias de validacao

### Build

- `npm run build`: **sucesso**.

### Auth/CRM/Workspace/Storage (smoke)

- `/crm` -> `307` redirect para login (guard de auth ativo).
- `GET /api/crm/pipeline-stages` sem token -> `401`.
- `GET /api/crm/opportunities` sem token -> `401`.
- `POST /api/projects/create` sem token -> `401`.
- `POST /api/storage/signed-url` sem token -> `401`.

### Tentativa de teste autenticado completo

- Bloqueio externo do provedor Auth ao tentar criar usuarios de QA via API com chave secreta (retorno: `Forbidden use of secret API key in browser`).
- Impacto: sem token real de usuario nao foi possivel fechar CRUD autenticado owner/non-owner nesta rodada.

## Riscos remanescentes

1. **Teste autenticado completo pendente** (CRM/workspace/storage com usuario real).
2. Necessidade de credencial de usuario de QA valida ou fluxo oficial de provisionamento de usuario teste.
3. Conflito legado de migration `20260529_prepare_project_files_storage.sql` continua pendente para normalizacao (fora do escopo S1B, ja documentado).

## Checklist S1B

- [x] Auditoria completa de uso das variaveis
- [x] Correcoes ENV frontend/backend
- [x] Remocao de fallback publico no backend
- [x] Build validado
- [x] Smoke tests CRM/workspace/storage executados
- [x] Documentacao oficial atualizada
- [ ] Teste autenticado completo com usuario real
