# PR85 Supabase Preview Diagnosis

Date: 2026-06-03

PR: `#85 fix: repair Supabase preview migration chain`

Diagnosed Supabase check SHA: `d9dd8b022a8455f76a5b753c64f86da06adc91af`

## Objective

Diagnose whether the Supabase Preview result on PR #85 is a manual/legacy cancellation or a real migration-chain error.

No code, migration, PR #84, or merge action was changed during this diagnosis.

## Supabase Preview Check On Diagnosed SHA

GitHub check-run observed on `d9dd8b022a8455f76a5b753c64f86da06adc91af`:

- name: `Supabase Preview`
- app: `supabase`
- status: `completed`
- conclusion: `cancelled`
- started at: `2026-06-03T09:13:24Z`
- completed at: `2026-06-03T09:13:23Z`
- annotations: `[]`
- details URL: `https://supabase.com/dashboard/project/stjhkxwylqtihzflspqe/settings/integrations`

Exact check-run output summary:

```text
Maximum number of concurrent branches reached. You can update this limit in Project Integrations Settings.
```

## Cancellation Classification

This is not a SQL migration error.

It is also not proven to be a manual dashboard cancellation. The exposed Supabase check-run output identifies an automatic operational cancellation caused by the project integration branch limit:

```text
Maximum number of concurrent branches reached.
```

Because the check was cancelled by Supabase before executing a preview branch replay, there are no migration logs, SQL statement logs, or annotations showing a database failure.

## Migration Ordering

The PR #85 migration is ordered before the old failing migration:

```text
20260525000000_preview_chain_profiles_foundation.sql
20260526_fix_profiles_rls_recursion.sql
```

Static repository verification:

- `20260525000000_preview_chain_profiles_foundation.sql` creates `public.profiles`.
- `20260525000000_preview_chain_profiles_foundation.sql` enables RLS on `public.profiles`.
- `20260526_fix_profiles_rls_recursion.sql` later creates `public.get_my_role()` and reads from `public.profiles`.

Therefore, if Supabase Preview replays migrations in filename order, `public.profiles` is created before `20260526_fix_profiles_rls_recursion.sql`.

## Does `public.profiles` Exist In Replay?

Supabase Preview did not execute the replay, so this cannot be confirmed from Supabase runtime logs on PR #85.

From static migration-chain analysis, yes: the new `20260525000000` foundation migration creates `public.profiles` before the `20260526` migration that depends on it.

## New Error After `profiles`

No new error after `profiles` is visible.

Reason: the Supabase Preview check was cancelled before the migration replay started. The only exposed Supabase output is the concurrent branch limit message.

## Other Checks

PR #85 remote checks observed on the diagnosed SHA:

- `Build & Type Check`: success
- `Deploy to Vercel Preview`: success/skipped depending on duplicate workflow run
- `Vercel Preview Comments`: success
- `Vercel` status context: failure with `Canceled from the Vercel Dashboard`
- `Supabase Preview`: cancelled due concurrent branch limit

PR #85 mergeability:

- GitHub reports `MERGEABLE`.

After this diagnosis document was added to PR #85, the PR head moved forward. On the subsequent observed head, GitHub exposed successful `Build & Type Check` runs and Vercel-related checks, but no `Supabase Preview` check-run was present in the commit check-run payload at the time of observation. Therefore, the only Supabase Preview diagnostic payload available for PR #85 remains the cancelled check above.

## Decision

Decision: **A. Preview cancelado/legado -> pode mergear #85**, with precision:

- the cancellation is operational/automatic due Supabase concurrent branch limit;
- it is not a real migration-chain failure;
- it does not show the previous `relation "public.profiles" does not exist` error;
- it does not show any new error after `profiles`;
- PR #85 is structurally the right repair for the known chain ordering issue.

## Recommended Next Action

Safe objective recommendation:

1. If the process accepts external Supabase Preview cancellation caused by branch quota, PR #85 can be merged.
2. If a green Supabase Preview check is mandatory, free or raise the Supabase Preview branch limit in Project Integrations Settings, then rerun PR #85 checks.
3. Do not change PR #84 until PR #85 is merged or an explicit later decision is made.
