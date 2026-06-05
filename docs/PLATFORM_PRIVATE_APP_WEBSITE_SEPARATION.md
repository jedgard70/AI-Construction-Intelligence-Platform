# Platform / Website Separation

## Decision

`AI-Construction-Intelligence-Platform` is the private platform/app repository.

`apex-global-website` is the public website/landing repository.

## Removed or Disabled From This Repository

- `landing-page-AI-Construction/`
  - Standalone public website assets and screenshots.
  - Removed because this content belongs to `apex-global-website`.
- `/us-brand`
  - Old internal/public marketing strategy route.
  - Removed from app navigation and route table.
- `/`
  - Old public landing page.
  - Disabled as public marketing page and redirected to `/login`.

## Preserved

- `/login`
  - Required secure platform entry.
- `/dashboard`
  - CP2 Welcome / Analises first screen.
- `/owner-dashboard`
  - Owner-only executive dashboard.
- `/nova-analise`
  - Active analysis/intake workflow.
- `/platform`
  - Preserved as internal platform map/indicators route for the private app.
- `ApexShell`
  - Preserved and updated to avoid links to removed public website routes.

## Operational Rule

Public website edits should go to `apex-global-website`.

Private app, authenticated workflow, dashboard, analyses, Owner control, and platform modules stay in `AI-Construction-Intelligence-Platform`.
