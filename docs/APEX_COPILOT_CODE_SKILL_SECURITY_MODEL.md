# APEX COPILOT — CODE SKILL SAFETY GATE
**Security Model for Apex Copilot Code Execution**

**Date:** 2026-06-04  
**Status:** Checkpoint 0  
**Version:** 1.0

---

## SAFETY GATE RULES

### Absolute Prohibitions
- ❌ DELETE / DROP / RESET without Owner approval
- ❌ Force push to main
- ❌ Direct commits to main (always branch)
- ❌ Bypass pre-commit hooks
- ❌ Commit secrets/tokens
- ❌ Supabase migrations without approval
- ❌ Production deploys without checks

### Always Required
- ✅ Create branch from main
- ✅ Make changes on branch
- ✅ Run `npm run build` (must pass)
- ✅ Run `npm run lint` (must pass)
- ✅ Run `npm test` (if applicable)
- ✅ Open PR to main
- ✅ Verify all checks pass (GitHub Actions, TypeScript, ESLint)
- ✅ Wait for Owner approval (if blocking)
- ✅ Merge PR (not force-push)
- ✅ Log action to Mission Control

### Approval Required For
- 🔴 Any Supabase schema change
- 🔴 Any Supabase RLS policy change
- 🔴 Any production deploy
- 🔴 Database migrations
- 🔴 Deleting code/files (not refactoring)
- 🔴 Changes to auth flow
- 🔴 Changes to Safety Gate itself

### Execution Flow
```
Owner Command
  ↓
Copilot validates Owner identity (Bearer token)
  ↓
Copilot classifies risk (low/medium/high/critical)
  ↓
If High/Critical → ask Owner for explicit approval
  ↓
Create new branch (git checkout -b...)
  ↓
Make changes
  ↓
Run build/lint/test (local)
  ↓
Commit with message + session link
  ↓
Push to origin (never force)
  ↓
Open PR to main
  ↓
Wait for checks (GitHub Actions)
  ↓
If checks fail → diagnose + fix + new commit
  ↓
If checks pass → trigger merge (if Owner approved)
  ↓
Log completion to Mission Control
```

---

## RISK CLASSIFICATION

| Risk | Condition | Action |
|------|-----------|--------|
| 🟢 Low | Small bug fix, documentation | Auto-proceed after checks |
| 🟡 Medium | Feature add, module change | Ask Owner, proceed if approved |
| 🔴 High | Core flow change, auth change | Stop and ask Owner (blocking) |
| 🔴 Critical | Schema change, RLS change | Stop, require explicit approval |

---

## REPO AUTHORIZATION

**Authorized Repos:**
- AI-Construction-Intelligence-Platform
- apex-global-website
- Additional repos (future, Owner approval required)

**Unauthorized Repos:**
- Any fork or unofficial repo
- Third-party repos (never)

---

## SUPABASE PROTECTION

### Migrations
- Allowed: Create new tables, add columns, add functions, add RLS policies (with approval)
- Blocked: Drop tables, drop columns, reset database, delete data

### RLS Policies
- Allowed: Add new policies (with approval), strengthen security
- Blocked: Remove security policies, weaken constraints

### Data
- Query: Yes (read-only for diagnostics)
- Insert: Only via application logic
- Delete: Never (data destructive)
- Reset: Blocked (requires Owner + explicit override)

---

## GITHUB SAFETY

- **Branch protection:** main requires PR review
- **No direct commits** to main
- **All PRs require** checks to pass
- **Force-push blocked** on main
- **Signed commits** (if configured)

---

## VERCEL INTEGRATION

- **Preview deploys:** Auto-triggered by PR
- **Production deploys:** Manual, after merge to main, Owner approval
- **Rollback:** Owner-only

---

## MISSION CONTROL LOGGING

Every action logged:
```
{
  timestamp: "2026-06-04T14:30:00Z",
  owner_email: "owner@apex.com",
  action: "code_change",
  branch: "feature/fix-xyz",
  files_changed: 3,
  build_status: "PASS",
  checks: ["typecheck: PASS", "lint: PASS", "test: PASS"],
  pr_url: "https://github.com/...",
  result: "MERGED",
  risk_level: "MEDIUM"
}
```

---

**See:** APEX_COPILOT_CODE_SKILL.md for implementation details.
