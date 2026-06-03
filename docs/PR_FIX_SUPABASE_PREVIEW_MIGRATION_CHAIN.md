# PR Fix Supabase Preview Migration Chain

Date: 2026-06-03

Branch: `feature/fix-supabase-preview-migration-chain`

## Objective

Repair the Supabase Preview migration chain without changing PR #84 or expanding Security PASS.

Observed failure in PR #84 Supabase Preview:

```text
ERROR: relation "public.profiles" does not exist (SQLSTATE 42P01)
At statement: 1
create or replace function public.get_my_role()
...
  from public.profiles
       ^
```

The failure happens before PR #84 migrations run.

## Files Audited

- `supabase/migrations/*`
- `supabase/migrations/20260526_fix_profiles_rls_recursion.sql`
- `acip-migrations/acip-migrations/supabase/migrations/003_profiles.sql`
- `SUPABASE_SETUP_COMPLETO.sql`
- related references in `database/*`

## Root Cause

The official `supabase/migrations` chain currently starts with:

- `20260526_fix_profiles_rls_recursion.sql`

That migration assumes `public.profiles` already exists:

- it creates `public.get_my_role()` reading `public.profiles`;
- it drops/creates a policy on `public.profiles`.

However, the `public.profiles` table creation lives in legacy/setup sources:

- `acip-migrations/acip-migrations/supabase/migrations/003_profiles.sql`
- `SUPABASE_SETUP_COMPLETO.sql`

It was not present in the official `supabase/migrations` replay chain before `20260526`.

## Chosen Repair

Add an early foundation migration before `20260526`:

- `supabase/migrations/20260525000000_preview_chain_profiles_foundation.sql`

This is the minimum safe repair because it makes the Preview chain reproducible from the start without editing PR #84 and without changing later Security PASS migrations.

## What The Migration Does

The migration idempotently creates the minimum platform foundation required by `20260526` and subsequent migrations:

- schema `extensions`;
- extensions:
  - `uuid-ossp`;
  - `pgcrypto`;
  - `pg_trgm` in schema `extensions`;
- enum `public.user_role`;
- enum `public.response_format`;
- table `public.profiles`;
- RLS enabled on `public.profiles`;
- indexes for profile role/company/active/email;
- function `public.set_updated_at()`;
- trigger `trg_profiles_updated_at`;
- function `public.handle_new_user()`;
- trigger `trg_on_auth_user_created`.

## Safety

The migration is idempotent:

- uses `create schema if not exists`;
- uses `create extension if not exists`;
- creates enums inside `do ... exception when duplicate_object`;
- uses `create table if not exists`;
- enables RLS on the public profile table;
- uses `alter table ... add column if not exists`;
- uses `create index if not exists`;
- drops/recreates only known triggers on the same target table.

It does not:

- destroy data;
- alter PR #84;
- alter PR #84 migrations;
- alter UI;
- alter package files;
- alter Revenue/Auth application flows;
- apply new Security PASS hardening;
- touch anonymous sign-ins, functions, or policies beyond recreating the historical profile bootstrap trigger in an idempotent foundation migration.

## Why Not Edit `20260526_fix_profiles_rls_recursion.sql`

Making `20260526` defensive would avoid the immediate error, but it would leave the Preview chain without the actual `public.profiles` foundation needed by later migrations.

Adding the missing foundation before `20260526` is more faithful to the historical schema and gives the preview database a real base state.

## Validation Performed

Local validation:

```text
npm run build
```

Expected PR validation:

- Supabase Preview should replay `20260525000000_preview_chain_profiles_foundation.sql` before `20260526_fix_profiles_rls_recursion.sql`.
- The previous `public.profiles` missing relation error should be removed.

## Relationship To PR #84

PR #84 remains unchanged.

This PR is a prerequisite repair for the Preview migration chain so PR #84 can later be rechecked and merged under the green-check rule.

## Merge Recommendation

Merge this PR first if:

- Build & Type Check is green;
- Supabase Preview no longer fails at `20260526_fix_profiles_rls_recursion.sql`;
- no new earlier chain failure appears.

After this PR is merged:

1. update PR #84 against the repaired `main`;
2. rerun PR #84 checks;
3. merge PR #84 only after checks are green or after an explicit later decision.
