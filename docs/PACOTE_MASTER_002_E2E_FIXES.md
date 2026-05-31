# PACOTE MASTER 002-E2E FIXES

Data: 2026-05-31
Base: `origin/main` em `51a94a7069e1f9c30d36d552fa4daa16c03832a6`

## Escopo aplicado (minimo)

1. Contract Engine
- Ajustado `pages/api/crm/contracts.ts` para compatibilidade com schema legado:
  - Envia `titulo` junto com `title` no insert.
  - Mantem fallback automatico caso `titulo` nao exista.
  - Mapeia status de API para valores legados do banco:
    - `draft -> rascunho`
    - `active|signed|completed -> ativo`
    - `cancelled -> cancelado`

2. Revenue Engine
- Hardening nas APIs:
  - `pages/api/crm/revenue/index.js`
  - `pages/api/crm/revenue/[id].js`
  - `pages/api/crm/revenue/dashboard.js`
- Removidos fallbacks demo e validacao fraca.
- APIs agora usam `requireAuth` de `pages/api/crm/_auth.ts`:
  - JWT real obrigatorio.
  - Sem token -> `401`.
  - Token fake -> `401`.
- Padronizacao de erros com codigo estruturado:
  - `schema_not_ready` para `PGRST205`.

3. Migration oficial Supabase (preparada)
- Adicionada migration:
  - `supabase/migrations/20260531173000_master002_e2e_revenue_engine.sql`
- Inclui criacao idempotente de:
  - `revenue_records`
  - `revenue_installments`
  - `revenue_events`
  - enums e indices
  - RLS scoped por owner (`created_by = auth.uid()` e joins para tabelas filhas)

## Validacoes executadas

- `npm run build -- --webpack` -> `PASSOU`
- Revenue auth hardening (antes da instabilidade final do servidor local):
  - sem token -> `401`
  - token fake -> `401`

## Pendencias operacionais

1. Aplicacao da migration no cloud
- Tentativa com `npx supabase db push --linked` falhou:
  - `Cannot find project ref. Have you run supabase link?`
- Necessario executar:
  - `supabase link --project-ref stjhkxwylqtihzflspqe`
  - `supabase db push --linked`

2. Revalidacao E2E final obrigatoria apos push da migration
- `opportunity -> service -> proposal -> contract -> revenue`
- Confirmar criacao real em:
  - `contracts`
  - `revenue_records`
  - `revenue_events`

---

## Fechamento operacional (executado)

1. Migration aplicada no cloud:
- `supabase link --project-ref stjhkxwylqtihzflspqe` -> concluido
- `supabase db push --linked` -> concluiu aplicando `20260531173000_master002_e2e_revenue_engine.sql`

2. Revenue no Supabase real:
- `revenue_records` acessivel
- `revenue_installments` acessivel
- `revenue_events` acessivel

3. Revalidacao E2E com token real:
- `/api/crm/contracts` -> `201`
- `/api/crm/revenue` -> `201`
- `/api/crm/revenue/dashboard` -> `200`
- sem token em `/api/crm/revenue` -> `401`
- token fake em `/api/crm/revenue` -> `401`

4. IDs finais validados:
- `contract_id`: `68df1088-e5fe-4086-a111-b26a97e88669`
- `revenue_record_id`: `3f89bfc7-bd35-4868-aa7a-61538994e3d5`
