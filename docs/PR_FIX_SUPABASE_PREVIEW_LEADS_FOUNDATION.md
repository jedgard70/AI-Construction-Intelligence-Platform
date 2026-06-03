# PR Fix Supabase Preview Leads Foundation

Date: 2026-06-03

Branch: `feature/fix-supabase-preview-leads-foundation`

## Objective

Repair the official Supabase migration chain so `public.leads` exists before any migration depends on it.

This PR is separate from PR #84 and does not expand the Security PASS package.

## Triggering Failure

After PR #85 repaired the earlier `public.profiles` blocker, PR #84 Supabase Preview advanced further and failed at:

```text
ERROR: relation "public.leads" does not exist (SQLSTATE 42P01)
```

The failing dependency is in:

```text
supabase/migrations/20260529010201_master002_s1_crm_core.sql
```

That migration adds:

```text
foreign key (lead_id) references public.leads(id)
```

## Files Audited

- `supabase/migrations/*`
- `supabase/migrations/20260529010201_master002_s1_crm_core.sql`
- `SUPABASE_SETUP_COMPLETO.sql`
- `database/*`
- `acip-migrations/*`
- app references under `pages`, `components`, and `lib`

## Findings

`public.leads` is created in `SUPABASE_SETUP_COMPLETO.sql`, but not in the official `supabase/migrations` replay chain before `20260529010201_master002_s1_crm_core.sql`.

The UI/API references expect the historical lead shape used by the setup file:

- `id`
- `owner_id`
- `name`
- `empresa`
- `email`
- `telefone`
- `valor`
- `tipo`
- `etapa`
- `origem`
- `probabilidade`
- `proxima_acao`
- `data_contato`
- `notas`
- `created_at`
- `updated_at`

## Chosen Repair

Add a narrow foundation migration before `20260529010201_master002_s1_crm_core.sql`:

```text
supabase/migrations/20260529010150_preview_chain_leads_foundation.sql
```

The migration:

- creates `public.leads` only if missing;
- adds the historical columns idempotently;
- enables RLS on `public.leads`;
- adds minimal indexes used for ownership, email lookup, pipeline stage, and ordering;
- recreates the historical `updated_at` trigger using the existing `public.set_updated_at()` function from the earlier profiles foundation.

## What This PR Does Not Do

This PR does not:

- alter PR #84;
- alter PR #84 migrations;
- alter functional code;
- alter package files;
- alter Revenue/Auth/UI;
- create a new feature;
- seed demo leads;
- create unrelated setup tables.

## Preview Chain Risk

Static audit shows `20260529010201_master002_s1_crm_core.sql` also references:

- `public.clients`
- `public.projects`
- `public.project_members`

Those objects also appear in setup/legacy sources. This PR intentionally does not create them because the requested repair is scoped to `public.leads` and should not add excess schema.

Therefore, after this PR fixes `public.leads`, Supabase Preview may reveal the next historical chain gap. If that happens, the next repair should be another isolated migration-chain PR, not an expansion of PR #84.

## Validation Plan

Required validation:

```text
npm run build
```

Expected PR validation:

- Build & Type Check should pass.
- Supabase Preview should no longer fail on missing `public.leads`.
- If Supabase Preview fails later, the new error should be diagnosed as the next migration-chain gap.

## Merge Recommendation

Merge only if:

- Build & Type Check is green;
- Supabase Preview is green, or an explicit decision accepts that the next replay-chain gap is outside this PR's scoped repair;
- the PR diff remains limited to this report and the `public.leads` foundation migration.

After this PR is merged, revalidate PR #84 again.
