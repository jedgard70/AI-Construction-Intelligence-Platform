# CP2 - Welcome / Análises as First Screen

Status: implemented for PR validation.

## Objective

Make `/dashboard` the first post-login experience for analyses/intake, not the executive dashboard.

## Implemented Scope

- Login continues to route users to `/dashboard`.
- `/dashboard` now renders the Welcome / Análises entry screen.
- The previous role dashboard is preserved at `/owner-dashboard`.
- Owner/director roles see the Dashboard Executivo button on the Welcome screen.
- Non-owner users do not see the Owner dashboard button.
- Direct access to `/owner-dashboard` redirects non-owner users back to `/dashboard`.
- Sidebar menu is reorganized into:
  - Produção
  - Vendas
  - Juridico / Contratos
  - Marketing
  - Diretoria
- Diretoria menu items are owner-only.

## Explicit Non-Scope

- No Supabase schema, RLS, migration, branch, or preview branch changes.
- No CP1 attachment/intake changes.
- No CRM, Financeiro, Juridico, Marketing, or Project Intake internal implementation.
- No production deploy.

## Validation Required

- Build and type check.
- Vercel Preview READY.
- Owner QA:
  - Owner login opens Welcome / Análises first.
  - Owner sees Dashboard Executivo button.
  - Dashboard Executivo opens from the Owner button.
  - Non-owner login opens Welcome / Análises first.
  - Non-owner does not see Diretoria or Dashboard Executivo button.
