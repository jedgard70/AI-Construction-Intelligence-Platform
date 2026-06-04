# APEX COPILOT — PR SUPERVISOR
**Workflow for PR, Build, and Production Deployment**

**Date:** 2026-06-04  
**Status:** Checkpoint 0.1  
**Version:** 1.0

---

## PURPOSE

Apex Copilot supervises the entire PR lifecycle from branch creation through production deployment. Every step follows the Safety Gate rules.

The PR workflow is the enforcement mechanism for code quality, testing, and governance.

---

## PR LIFECYCLE

```
1. BRANCH
   ↓ Create from main, no force-push
2. COMMIT
   ↓ Changes committed with clear message + session link
3. PUSH
   ↓ Push to origin (never force)
4. PR OPEN
   ↓ Create PR to main with scope + acceptance criteria
5. CHECKS RUN
   ↓ GitHub Actions: build, lint, typecheck, tests
6. REVIEW (if needed)
   ↓ Code review, inline comments
7. CHECKS PASS
   ↓ All automated checks must pass (GREEN)
8. MERGE
   ↓ Merge via GitHub (never force-merge)
9. VERCEL PREVIEW
   ↓ Manual QA in Vercel preview
10. VERCEL PRODUCTION
    ↓ Manual QA in Vercel production (if applicable)
11. SUPABASE STATUS
    ↓ Check for RLS/data integrity issues
12. QA MANUAL
    ↓ QA team tests in production
13. MISSION CONTROL LOG
    ↓ Log to Mission Control for audit trail
14. CHECKPOINT CLOSURE
    ↓ Formal checkpoint closure
```

---

## STAGE DETAILS

### 1. BRANCH

**Rule:** Always create new branch from main. Never commit directly to main.

**Procedure:**
```bash
git fetch origin main
git checkout -b feature/checkpoint-name origin/main
```

**Requirements:**
- ✅ Branch name follows pattern: `feature/`, `fix/`, `docs/`, etc.
- ✅ Branch created from main
- ✅ No force-push allowed
- ✅ Branch tracking origin/main

**Example Branches:**
- `feature/response-actions`
- `fix/access-control-gate`
- `docs/checkpoint-manager`
- `refactor/dashboard-routing`

---

### 2. COMMIT

**Rule:** Clear, atomic commits with context and session link.

**Commit Message Format:**
```
type: brief description

Detailed explanation if needed.
Context about why this change.

Linked to: [checkpoint/PR/issue]
Session: https://claude.ai/code/session_[ID]
```

**Examples:**

✅ Good:
```
feat: add response action buttons (copy, speak, share)

Implement response action buttons with Web Speech API for text-to-speech.
Includes error handling for unsupported browsers and mobile responsiveness.

Acceptance criteria:
- Copy button copies to clipboard
- Speak button uses Web Speech API
- Share button uses Web Share API with fallback
- All buttons mobile responsive
- No breaking changes

Linked to: CP1, PR #123
Session: https://claude.ai/code/session_01C7tJZTigHCiiHU8bL1m7F5
```

❌ Bad:
```
fix: stuff
```

**Requirements:**
- ✅ Clear type prefix (feat, fix, docs, refactor, test)
- ✅ Descriptive subject (under 70 chars)
- ✅ Explain WHY (not just WHAT)
- ✅ Reference checkpoint/PR if applicable
- ✅ Include session link
- ✅ Atomic (one logical change per commit)

---

### 3. PUSH

**Rule:** Push to origin, never force-push.

**Procedure:**
```bash
git push -u origin feature/checkpoint-name
```

**Requirements:**
- ✅ Use `-u` flag to set upstream
- ✅ Push to origin (never force)
- ✅ Never `git push --force` or `git push -f`
- ✅ If conflict: rebase and re-push (never force)

---

### 4. PR OPEN

**Rule:** Create PR with detailed scope and acceptance criteria.

**PR Template:**
```markdown
## Summary

[2-3 bullet points about what changed and why]

## Checkpoint

[Link to CP#, PR#, issue]

## Objective

[What is the goal of this PR?]

## Scope

**In Scope:**
- [Item 1]
- [Item 2]

**Out of Scope:**
- [Item 1 explicitly excluded]

## Acceptance Criteria

- ✅ [Functional requirement]
- ✅ [Technical requirement]
- ✅ [Quality requirement]

## Testing

- [Unit tests: describe]
- [Manual QA: describe]
- [Edge cases tested: describe]

## Checklist

- ✅ Build passes
- ✅ Lint passes
- ✅ Tests pass
- ✅ No breaking changes
- ✅ Documentation updated

---

Session: https://claude.ai/code/session_[ID]
```

**Requirements:**
- ✅ Clear title (under 70 chars)
- ✅ Describe what, why, and how
- ✅ Link to checkpoint/issue
- ✅ List acceptance criteria
- ✅ Explain testing approach
- ✅ Include session link

---

### 5. CHECKS RUN

**GitHub Actions Automated Checks:**

All checks must pass:
- ✅ Build: `npm run build` succeeds
- ✅ Lint: `npm run lint` succeeds
- ✅ TypeScript: `npm run typecheck` succeeds (no type errors)
- ✅ Tests: `npm run test` passes (if applicable)
- ✅ Branch protection: PR requires review (if configured)

**If Checks Fail:**

1. **Diagnose:** Read error logs from GitHub Actions
2. **Fix:** Create new commit addressing the issue (NOT amend)
3. **Re-push:** Push new commit to same branch
4. **Re-check:** Checks re-run automatically
5. **Repeat:** Until all checks pass

❌ Never force-push to skip checks.  
❌ Never merge without checks passing.

---

### 6. REVIEW (if needed)

**Code Review:**

If PR requires review (branch protection):
- Author: Respond to inline comments
- Reviewer: Check for bugs, regressions, patterns
- Communication: Use PR comments for discussion

**For this project (Apex Copilot):**
- Owner reviews blocking operations
- Codex reviews code quality
- Claude reviews architecture/design

**Outcome:**
- ✅ Approved: Can merge
- ⚠️ Changes requested: Fix and re-request review
- ❌ Rejected: Close PR or redesign

---

### 7. CHECKS PASS

**All Checks Must Be GREEN:**

```
✅ Build         [PASS]
✅ Lint          [PASS]
✅ TypeScript    [PASS]
✅ Tests         [PASS]
✅ Branch checks [PASS]
```

**If Any Check Red:**
1. Investigate failure
2. Fix root cause
3. Create new commit (not amend)
4. Push and re-check

---

### 8. MERGE

**Rule:** Merge via GitHub UI (never force-merge), then delete branch.

**Procedure:**
1. Click "Merge pull request" button (NOT "Squash and merge")
2. Confirm merge
3. Delete branch (GitHub prompts for this)
4. Verify main is updated

**Requirements:**
- ✅ All checks PASS
- ✅ No conflicts
- ✅ Review approved (if required)
- ✅ Use standard merge (not squash/rebase)
- ✅ Delete branch after merge

**Why Standard Merge:**
- Preserves commit history
- Easier to revert if needed
- Shows merge commit + timestamp
- Better for audit trail

---

### 9. VERCEL PREVIEW

**Vercel automatically deploys PR:**

1. PR created → Vercel builds preview
2. Preview URL available in PR status
3. Click "View Preview" button
4. Manual QA in preview environment

**QA in Preview:**
- ✅ Feature works as expected
- ✅ No UI regressions
- ✅ Mobile responsive
- ✅ Performance acceptable
- ✅ No console errors

**If Issues Found:**
1. Create new commit addressing issue
2. Push to same branch
3. Preview auto-updates
4. Re-test in preview
5. Repeat until clean

---

### 10. VERCEL PRODUCTION

**Vercel auto-deploys main to production:**

1. PR merged to main
2. Vercel builds production deployment
3. Production deployment completes
4. Manual QA in production

**QA in Production:**
- ✅ Feature works in production
- ✅ Data consistency (Supabase)
- ✅ Performance in production load
- ✅ Monitor error logs (Sentry, etc.)
- ✅ No breaking changes to other features

**If Issues Found:**
1. If critical: revert merge (create revert PR)
2. If minor: fix in new PR
3. If data affected: investigate in Supabase

---

### 11. SUPABASE STATUS

**Check Supabase health:**

- ✅ Database responsive
- ✅ RLS policies working (data isolated)
- ✅ No migration errors
- ✅ No data corruption
- ✅ Logs clean (no auth errors)

**If Issues Found:**
- Investigate RLS policies
- Check for data integrity problems
- Escalate to Owner if schema issue

---

### 12. QA MANUAL

**QA Team Tests:**

- ✅ Feature complete and working
- ✅ All acceptance criteria met
- ✅ No regressions in other features
- ✅ Edge cases tested
- ✅ Documentation accurate
- ✅ Sign-off: QA approved

**QA Sign-off Template:**
```
✅ QA APPROVED

Feature: [Name]
Tested: [Date]
Platforms: Desktop (Chrome, Safari), Mobile (iOS, Android)
Issues found: [None | List with severity]
Sign-off: QA Team
Date: [Date]
```

---

### 13. MISSION CONTROL LOG

**Log to Mission Control (audit trail):**

```json
{
  "timestamp": "2026-06-07T16:30:00Z",
  "checkpoint": "CP1",
  "action": "merge",
  "branch": "feature/response-actions",
  "pr": "https://github.com/jedgard70/ai-construction-intelligence-platform/pull/...",
  "owner": "Owner (Apex Global AI)",
  "engine": "Codex",
  "commits": [
    "feat: add response action buttons",
    "feat: implement web speech API",
    "test: add action tests"
  ],
  "files_changed": 5,
  "build_status": "PASS",
  "checks": [
    "build: PASS",
    "lint: PASS",
    "typecheck: PASS",
    "tests: PASS"
  ],
  "vercel_preview": "deployed",
  "vercel_production": "deployed",
  "qa_status": "APPROVED",
  "result": "MERGED_TO_MAIN",
  "next_stage": "checkpoint_closure",
  "notes": "All criteria met, ready for closure"
}
```

---

### 14. CHECKPOINT CLOSURE

**Formal Checkpoint Completion:**

1. Create CHECKPOINT_[N]_COMPLETION_REPORT.md
2. Document deliverables (with ✅ checkmarks)
3. Key decisions made
4. Pending work for next checkpoint
5. Sign-off: Copilot + Owner timestamp

---

## RULES & PROHIBITIONS

### Always Required
- ✅ Create branch from main
- ✅ Commit with clear message + session link
- ✅ Push to origin (never force)
- ✅ Create PR with scope + acceptance
- ✅ Run build/lint/test locally
- ✅ All checks must pass before merge
- ✅ Manual QA in Vercel preview
- ✅ Merge via GitHub (standard merge)
- ✅ Delete branch after merge
- ✅ Log to Mission Control

### Absolutely Prohibited
- ❌ Direct commits to main
- ❌ Force-push to main
- ❌ Force-merge PR
- ❌ Skip checks and merge anyway
- ❌ Amend after push (create new commit)
- ❌ Merge without QA approval
- ❌ Delete branch before verifying main updated
- ❌ Bypass Safety Gate rules

---

## CONFLICT RESOLUTION

**If PR has conflicts with main:**

1. Fetch latest main: `git fetch origin main`
2. Rebase on main: `git rebase origin/main`
3. Resolve conflicts in editor
4. Run build/lint/test to verify
5. Force-push to branch: `git push -f origin feature/...`
6. Re-check in GitHub (conflicts should be gone)

**Never merge with conflicts. Always rebase clean.**

---

## TIMING & STATUS

**Expected Timeline:**

| Stage | Typical Duration |
|-------|------------------|
| Branch → Commit → Push | Minutes |
| PR Open → Checks Run | 5-15 minutes |
| Review (if needed) | 10 minutes - 1 hour |
| Vercel Preview Build | 2-5 minutes |
| Manual QA (preview) | 15-30 minutes |
| QA Approval → Merge | 5-10 minutes |
| Vercel Production Deploy | 2-5 minutes |
| Manual QA (production) | 15-30 minutes |
| Mission Control Log | Minutes |

**Total:** ~1-2 hours per PR (assuming no issues)

---

## SUPERVISION BY APEX COPILOT

Apex Copilot monitors:
1. ✅ All checks pass
2. ✅ No force-pushes
3. ✅ PR linked to checkpoint
4. ✅ Scope respected (no creep)
5. ✅ QA approved before merge
6. ✅ Mission Control logged
7. ✅ Branch deleted

**If issues found:** Escalate to Owner

---

## EXAMPLE: PR #123 RESPONSE ACTIONS

```
Branch: feature/response-actions (created from main)

Commits:
1. feat: add response action buttons component
   - Added ResponseActions.tsx
   - Added tests
   - Session link: https://claude.ai/...

2. feat: integrate web speech API
   - Web Speech API implementation
   - Browser compatibility check
   - Session link: https://claude.ai/...

3. test: add integration tests
   - Test copy/speak/share buttons
   - Test error handling
   - Session link: https://claude.ai/...

Push: git push -u origin feature/response-actions

PR Created:
- Title: "feat: add response action buttons (copy, speak, share)"
- Base: main
- Scope: In/Out detailed
- Acceptance Criteria: Listed
- Testing: Explained

Checks:
✅ build: PASS
✅ lint: PASS
✅ typecheck: PASS
✅ tests: PASS

Review: Approved

Vercel Preview: Deployed + QA tested
Vercel Production: Deployed + QA tested
QA Approval: ✅ APPROVED

Merge: Standard merge to main
Branch: Deleted

Mission Control: Logged

Result: COMPLETE — Ready for CP1 closure
```

---

**See:** APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md for Safety Gate.  
**See:** APEX_COPILOT_CHECKPOINT_MANAGER.md for checkpoint lifecycle.
