# PR C1 — Database Commercial Core

Data: 2026-05-31
Base: `origin/main`
Fonte auditada: `recovery/fix-client-detail-truth-layer/`

## Escopo do PR C1

Recuperar somente migrations comerciais para sustentar CRM, Services, Proposals e Contracts, sem alterar APIs/UI/Revenue Engine.

## Migrations comparadas

1. `supabase/migrations/20260529010201_master002_s1_crm_core.sql`
2. `supabase/migrations/20260530010101_master002_s2_services_catalog.sql`
3. `supabase/migrations/20260530010201_master002_s3_proposal_engine.sql`
4. `supabase/migrations/20260530010301_master002_s4_contract_engine.sql`

Comparacao adicional solicitada:

- `database/011_revenue_engine.sql` -> **nao encontrado em main/local de auditoria** (arquivo ausente no caminho esperado).

## Migrations incorporadas

Foram incorporadas para PR C1:

1. `20260529010201_master002_s1_crm_core.sql`
- Motivo: cria base de `pipeline_stages` e `opportunities` (CRM core).

2. `20260530010101_master002_s2_services_catalog.sql`
- Motivo: cria `services_catalog` e `opportunity_services` (camada comercial de servicos).

3. `20260530010201_master002_s3_proposal_engine.sql`
- Motivo: cria `proposals` e `proposal_items` (Proposal Engine).

4. `20260530010301_master002_s4_contract_engine.sql`
- Motivo: cria `contracts` e `contract_items` (Contract Engine).

## Migrations ignoradas

1. `supabase/migrations/20260529010101_prepare_project_files_storage.sql`
- Motivo: fora do escopo de C1 (storage `project-files`), já tratado em trilhas anteriores.

2. `supabase/migrations/20260530010401_master002_s5_revenue_engine.sql`
- Motivo: fora do escopo C1 (Revenue Engine). Mantido para bloco posterior.

## Risco de duplicacao

Checagem de palavras-chave de revenue/storage nas 4 migrations C1:

- `revenue_records`
- `revenue_installments`
- `revenue_events`
- `project-files`
- `storage.buckets`

Resultado: **sem ocorrência** nessas 4 migrations.

Conclusão: C1 não duplica tabelas de revenue nem reaplica storage bucket.

## Compatibilidade com main

- `origin/main` atualmente não contém essas 4 migrations comerciais.
- A incorporação preserva separação por fase S1-S4 e prepara base para complementos de CRM/Revenue em PR C2.

## Recomendação para PR C2

PR C2 deve focar em:

1. APIs CRM ausentes em `main` (`pages/api/crm/*` de opportunities/services/proposals/contracts).
2. UI CRM ausente em `main` (`pages/crm/services.tsx`, `pages/crm/proposals/*`, `pages/crm/contracts/*`).
3. Revenue Engine somente em bloco próprio, com validação de compatibilidade de schema e sem misturar Foundation/UX.
