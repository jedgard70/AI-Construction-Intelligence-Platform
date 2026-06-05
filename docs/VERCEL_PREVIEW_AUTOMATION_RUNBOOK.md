# Vercel Preview Automation Runbook

## Root Cause Found

The repository had two competing preview paths:

- The Vercel GitHub App, which creates the normal automatic PR Preview and reports the `Vercel` status context.
- A GitHub Actions Vercel CLI workflow, which also tried to deploy PR previews with `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.

That made GitHub show duplicate preview signals. On PR #126, the Vercel GitHub App reached `SUCCESS`, while the Actions workflow failed because the repository secret `VERCEL_TOKEN` exists but is invalid for the Vercel project/team. The duplicate workflow is now manual-only so it cannot break every PR while the GitHub App is already producing automatic previews.

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

- PR preview deploy runs automatically from the Vercel GitHub App.
- The Actions workflow `Deploy Preview (Vercel)` is manual-only with `workflow_dispatch`.
- If the manual workflow is run and Vercel configuration is missing, it fails clearly and prints only the missing variable/secret names.
- Secret values are never printed.
- If configuration exists and `VERCEL_TOKEN` is valid, the manual fallback workflow runs:
  - `vercel pull --environment=preview`
  - `vercel build`
  - `vercel deploy --prebuilt`
  - PR comment with the READY preview URL

## Owner Setup Steps If Permissions Are Missing

This is a one-time repository setup. The Owner should not need to repeat it for every PR.

### Option A - GitHub UI

1. Open the GitHub repository as `jedgard70` or another repository Admin.
2. Go to `Settings -> Secrets and variables -> Actions`.
3. In `Secrets`, create or verify:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. In `Variables`, create or verify:
   - `VERCEL_CONFIGURED` with value `true`
5. For normal PRs, use the automatic `Vercel` status from the GitHub App.
6. If the GitHub App is unavailable, run the fallback workflow manually:
   - Go to `Actions`.
   - Select `Deploy Preview (Vercel)`.
   - Click `Run workflow`.

### Option B - GitHub CLI

Authenticate once with an Admin account:

```powershell
gh auth login -h github.com
```

Then set the repository variable:

```powershell
gh variable set VERCEL_CONFIGURED --body true
```

If the secrets are missing, set them without printing values in chat or logs:

```powershell
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

Required account: `jedgard70` or another Admin of `jedgard70/AI-Construction-Intelligence-Platform`.

Required capability: manage repository Actions variables/secrets.

## Notes

- The previous executor could not list repo secrets or variables: GitHub returned `HTTP 401`.
- The first explicit workflow diagnosis showed `VERCEL_CONFIGURED` was missing.
- After setting `VERCEL_CONFIGURED=true`, the workflow reached `vercel pull` and failed with:

```text
Error: The token provided via `--token` argument is not valid. Please provide a valid token.
```

- This means the repository secret `VERCEL_TOKEN` exists, but its current value is invalid, expired, revoked, or not authorized for the Vercel project/team.
- Replace `VERCEL_TOKEN` once with a valid Vercel token from the correct Vercel account/team. Do not paste the token in chat.
- No Supabase action is required.
- No production deployment is required.
- Public website code now belongs in the separate `apex-global-website` repository.
- This repository is the private platform/app repository.
