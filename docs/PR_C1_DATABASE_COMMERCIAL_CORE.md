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

## Migrations incorporadas

1. `20260529010201_master002_s1_crm_core.sql`
2. `20260530010101_master002_s2_services_catalog.sql`
3. `20260530010201_master002_s3_proposal_engine.sql`
4. `20260530010301_master002_s4_contract_engine.sql`

## Migrations ignoradas

1. `supabase/migrations/20260529010101_prepare_project_files_storage.sql`
- Motivo: fora do escopo C1 (storage).

2. `supabase/migrations/20260530010401_master002_s5_revenue_engine.sql`
- Motivo: fora do escopo C1 (Revenue Engine).

## Hardening de idempotencia aplicado

As migrations S1-S4 foram ajustadas para ambientes parcialmente provisionados com os seguintes padroes:

1. `CREATE TABLE IF NOT EXISTS` para todas as tabelas-alvo.
2. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para reconciliar colunas faltantes.
3. `ALTER TABLE ... ALTER COLUMN` para defaults e `NOT NULL` esperados.
4. `CREATE INDEX IF NOT EXISTS` para indices de consulta e unicidade.
5. `DROP POLICY IF EXISTS` antes de `CREATE POLICY` para recriacao segura de RLS.
6. Constraints e FKs em blocos `DO $$ ... $$` com checagem em `pg_constraint`.
7. Sem inclusao de tipos/enum novos (nao necessario para este escopo).

## Tratamento de ambiente parcial

As migrations agora suportam cenarios em que tabelas ja existem, mas incompletas:

- adicionam colunas ausentes sem quebrar execucao;
- aplicam constraints/checks/FKs somente quando ausentes;
- reaplicam politica RLS de forma deterministica;
- mantem semantica funcional de S1-S4 sem duplicar estruturas.

## Risco de duplicacao

Checagem nas 4 migrations C1:

- `revenue_records`
- `revenue_installments`
- `revenue_events`
- `project-files`
- `storage.buckets`

Resultado: sem ocorrencia.

Conclusao: C1 nao duplica tabelas de revenue e nao reaplica migration de storage.

## Validacoes executadas

1. Build:
- `npm run build -- --webpack` -> passou.

2. Inspecao textual das migrations:
- `ADD COLUMN IF NOT EXISTS` presente em S1-S4;
- `CREATE INDEX IF NOT EXISTS` presente em S1-S4;
- politicas RLS com `DROP POLICY IF EXISTS` + `CREATE POLICY`;
- constraints/FKs/checks com blocos seguros de existencia.

3. Escopo de diff:
- somente os 5 arquivos permitidos no PR C1.

## Riscos remanescentes

1. `ALTER COLUMN ... SET NOT NULL` requer dados existentes compativeis (sem nulos) no ambiente alvo.
2. Se houver constraints antigas semanticamente diferentes e com nomes diferentes, pode exigir migracao corretiva posterior.
3. O PR C1 nao cobre Revenue S5 por decisao de escopo.

## Compatibilidade com main

- `origin/main` nao contem essas 4 migrations comerciais.
- C1 preserva separacao por fase S1-S4 e prepara base para PR C2.

## Recomendacao para PR C2

1. APIs CRM ausentes em `main` (`pages/api/crm/*`).
2. UI CRM ausente em `main` (`pages/crm/services.tsx`, `pages/crm/proposals/*`, `pages/crm/contracts/*`).
3. Revenue Engine em bloco proprio, sem misturar Foundation/UX.
