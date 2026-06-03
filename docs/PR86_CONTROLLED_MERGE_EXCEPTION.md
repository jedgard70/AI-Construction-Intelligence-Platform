# PR86 Controlled Merge Exception

Date: 2026-06-03

PR: `#86 fix: repair Supabase preview leads foundation`

Merge commit on `origin/main`: `772532b`

## Decision

PR #86 was merged by explicit controlled exception without a green Supabase Preview check.

Squash merge title:

```text
fix: repair Supabase preview leads foundation
```

## Reason For Exception

The merge was authorized because:

- `Build & Type Check` was green;
- PR #86 was `MERGEABLE`;
- the scope was minimal and limited to:
  - `docs/PR_FIX_SUPABASE_PREVIEW_LEADS_FOUNDATION.md`;
  - `supabase/migrations/20260529010150_preview_chain_leads_foundation.sql`;
- no functional code was changed;
- no package file was changed;
- no Revenue/Auth/UI implementation was changed;
- Supabase Preview did not fail with a SQL migration error.

## Supabase Preview State

Initial Supabase Preview blocker:

```text
Maximum number of concurrent branches reached. You can update this limit in Project Integrations Settings.
```

Action taken:

- removed the obsolete Supabase Preview branch for merged PR #49;
- retriggered PR #86 checks with an empty commit because direct GitHub check rerun returned `HTTP 401`.

Final Supabase Preview state before merge:

```text
This git branch is not associated with any Supabase Branch. You can open a PR to create a new branch.
```

This is an operational branch-association/provisioning blocker, not a SQL migration-chain failure.

## Cost Constraint

Manual Supabase Branch creation via connector reported an hourly cost:

```text
0.01344 per hour
```

No paid/manual Supabase Branch was created because the owner explicitly chose not to create one at this time.

## Validation

Validation before merge:

- remote `Build & Type Check`: success;
- local `npm run build`: passed;
- PR files: only the two allowed files.

## Follow-Up

PR #84 must be revalidated against `origin/main` after `772532b`.

If Supabase Preview runs on PR #84, it may reveal whether the `public.leads` foundation repair is sufficient or whether the next historical migration-chain gap appears.
