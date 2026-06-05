# Vercel Preview Automation Runbook

## Root Cause Found

The PR preview workflow had two paths:

- A real deploy job gated by `vars.VERCEL_CONFIGURED == 'true'`.
- A `skip-notice` job that succeeded when Vercel was not configured.

That made GitHub show a successful-looking deploy check even when no Vercel CLI deployment happened. At the same time, the Vercel GitHub App status could still report `Canceled from the Vercel Dashboard`, leaving PRs without a usable READY preview.

## Workflows Inspected

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-preview.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy.yml`

## Required GitHub Actions Configuration

Configure these in:

`GitHub repo -> Settings -> Secrets and variables -> Actions`

Secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Variable:

- `VERCEL_CONFIGURED=true`

## New Behavior

- PR preview deploy runs from `Deploy Preview (Vercel)`.
- The workflow can also be started manually with `workflow_dispatch`.
- If Vercel configuration is missing, the workflow fails clearly and prints only the missing variable/secret names.
- Secret values are never printed.
- If configuration exists, the workflow runs:
  - `vercel pull --environment=preview`
  - `vercel build`
  - `vercel deploy --prebuilt`
  - PR comment with the READY preview URL

## Owner Setup Steps If Permissions Are Missing

1. Open the GitHub repository.
2. Go to `Settings -> Secrets and variables -> Actions`.
3. In `Secrets`, create or verify:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. In `Variables`, create or verify:
   - `VERCEL_CONFIGURED` with value `true`
5. Re-run the workflow:
   - Open PR.
   - Go to `Checks`.
   - Select `Deploy Preview (Vercel)`.
   - Click `Re-run jobs`.

## Notes

- The current executor could not list repo secrets or variables: GitHub returned `HTTP 401`.
- No Supabase action is required.
- No production deployment is required.
