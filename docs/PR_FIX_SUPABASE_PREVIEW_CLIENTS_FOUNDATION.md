# PR Fix Supabase Preview Clients Foundation

Date: 2026-06-03

Branch: `feature/fix-supabase-preview-clients-foundation`

## Objective

Repair the official Supabase migration chain so `public.clients` exists before `20260529010201_master002_s1_crm_core.sql`.

This PR is separate from PR #84 and does not expand the Security PASS package.

## Triggering Failure

After PR #86 repaired the `public.leads` blocker, PR #84 Supabase Preview advanced further and failed at:

```text
ERROR: relation "public.clients" does not exist (SQLSTATE 42P01)
```

The failing dependency is in:

```text
supabase/migrations/20260529010201_master002_s1_crm_core.sql
```

That migration adds:

```text
foreign key (client_id) references public.clients(id)
```

## Files Audited

- `supabase/migrations/*`
- `supabase/migrations/20260529010201_master002_s1_crm_core.sql`
- `SUPABASE_SETUP_COMPLETO.sql`
- `database/clients_table.sql`
- `database/*`
- `acip-migrations/*`
- app references under `pages`, `components`, and `lib`

## Findings

`public.clients` exists in setup/reference sources, but not in the official `supabase/migrations` replay chain before `20260529010201_master002_s1_crm_core.sql`.

Official migrations require at least `public.clients(id)` for:

- `opportunities_client_id_fkey` in `20260529010201_master002_s1_crm_core.sql`;
- `contracts_client_id_fkey` in `20260530010301_master002_s4_contract_engine.sql`;
- `revenue_records.client_id` in `20260531173000_master002_e2e_revenue_engine.sql`;
- policy hardening drops on `public.clients` in `20260602204551_qa_real_003_c2_policies_true_group_1.sql`.

Historical/setup references also use these basic client columns:

- `name`
- `email`
- `phone`
- `company`
- `document`
- `address`
- `city`
- `state`
- `notes`
- `owner_id`
- `created_at`
- `updated_at`

## Chosen Repair

Add a narrow foundation migration before `20260529010201_master002_s1_crm_core.sql`:

```text
supabase/migrations/20260529010160_preview_chain_clients_foundation.sql
```

The migration:

- creates `public.clients` only if missing;
- adds minimal historical columns idempotently;
- enables RLS on `public.clients`;
- adds minimal indexes for owner, email, and company;
- recreates the historical `updated_at` trigger using the existing `public.set_updated_at()` function from the earlier profiles foundation.

## What This PR Does Not Do

This PR does not:

- alter PR #84;
- alter PR #84 migrations;
- alter functional code;
- alter package files;
- alter Revenue/Auth/UI;
- create a new feature;
- seed demo clients;
- create `public.projects`;
- create `public.project_members`;
- create unrelated setup tables.

## Static Audit Of Next Probable Gaps

`20260529010201_master002_s1_crm_core.sql` also references:

- `public.projects`
- `public.project_members`

The same migration contains:

- `foreign key (project_id) references public.projects(id)`;
- RLS policy logic that selects from `public.project_members`.

Those objects appear in setup/legacy sources, but this PR intentionally does not create them because the requested repair is scoped to `public.clients` and should not add excess schema.

Therefore, after this PR fixes `public.clients`, Supabase Preview may reveal `public.projects` or `public.project_members` as the next historical replay-chain gap.

## Validation Plan

Required local validation:

```text
npm run build
```

Expected PR validation:

- Build & Type Check should pass.
- Supabase Preview should no longer fail on missing `public.clients`.
- If Supabase Preview fails later, the new error should be diagnosed as the next migration-chain gap.

## Merge Recommendation

Do not merge without audit.

Merge only after:

- Build & Type Check is green;
- Supabase Preview is green, if possible;
- if Supabase Preview does not run due infrastructure, confirm that it is not a SQL error before any controlled exception;
- PR diff remains limited to this report and the `public.clients` foundation migration.

After this PR is merged, revalidate PR #84 again.
