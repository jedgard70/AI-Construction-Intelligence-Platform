# Roadmap Rules

## Core sequence
Foundation -> CRM Core -> Services Catalog -> Proposal Engine -> UX Redesign -> Contract Engine -> Revenue Engine -> Analytics / Copilot Advanced.

## Current known package pattern
- 001: Foundation & Core Platform.
- 001-A/B: Hardening, storage, ENV, final validation.
- 002-A: Commercial schema.
- 002-B: Technical plan.
- 002-C: Execution plan.
- 002-S1: CRM Core.
- 002-S1A/S1B: hardening and auth/env.
- 002-S2: Services Catalog.
- 002-S3: Proposal Engine.
- 002-UX: UX plan.
- 002-UX-I: ApexShell, single sidebar/topbar.
- Next likely: 002-UX-II dashboards by profile, then 002-S4 Contract Engine, then 002-S5 Revenue Engine.

## Gate rules
1. Do not add more planning phases when a package is already reviewed and marked ready for implementation.
2. Do not implement if the plan lacks acceptance criteria, data model, API boundaries, and documentation update requirements.
3. Small validation/hardening packages are allowed when a blocker impacts multiple modules.
4. Keep authenticated E2E validation as a transversal requirement, but do not block all progress if the implementation is technically complete and the blocker is purely QA/auth environment.

## Percentage policy
- 100%: completed and validated, with docs updated.
- 95%: implemented, build passing, docs updated, E2E/QA still pending.
- 80-90%: implemented but hardening or integration still needed.
- 50-75%: partial foundation exists.
- Below 50%: planning/demo only.
