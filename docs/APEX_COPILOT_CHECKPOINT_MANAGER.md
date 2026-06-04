# APEX COPILOT — CHECKPOINT MANAGER
**Framework for Checkpoint Lifecycle Management**

**Date:** 2026-06-04  
**Status:** Checkpoint 0.1  
**Version:** 1.0

---

## CHECKPOINT LIFECYCLE

Every checkpoint follows a strict, sequential lifecycle. Apex Copilot manages this workflow.

```
1. CREATE
   ↓ Owner creates checkpoint with objective
2. OBJECTIVE
   ↓ Clear, measurable outcome defined
3. SCOPE
   ↓ Closed scope, no scope creep allowed
4. PROHIBITED
   ↓ Explicit list of what NOT to do
5. 100% CRITERIA
   ↓ Define acceptance criteria (build green, QA approved, docs synced)
6. IMPLEMENT
   ↓ Copilot (via engine) executes within scope
7. VALIDATE
   ↓ Manual QA, feature testing, edge cases
8. CORRECT
   ↓ Fix bugs found during validation
9. PR
   ↓ Create pull request with scope + acceptance criteria
10. CHECKS
    ↓ Run build, lint, typecheck, tests (all must pass)
11. MERGE
    ↓ Merge only after all checks pass + Owner approval (if blocking)
12. TEST PREVIEW
    ↓ Manual QA in Vercel preview
13. TEST PRODUCTION
    ↓ Manual QA in Vercel production (if applicable)
14. DOCUMENTATION
    ↓ Update relevant docs (ROADMAP, master status, this checkpoint's docs)
15. STATUS SYNC
    ↓ Update APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md + master docs
16. CLOSURE
    ↓ Formal checkpoint closure with sign-off
17. NEXT CHECKPOINT
    ↓ Open next checkpoint if all blockers clear
```

---

## STAGE DEFINITIONS

### 1. CREATE
**Owner initiates checkpoint.**

- Owner sends command via Mission Control
- Copilot validates Owner identity (Bearer token)
- Checkpoint ID assigned (CP1, CP2, etc.)
- Status set to IN_PROGRESS

### 2. OBJECTIVE
**Clear, specific, measurable outcome.**

Example from CP1:
> Complete PR #123: Apex AI reads attachments, shows response actions, secure auth, green build, QA passes.

Non-examples (too vague):
- ❌ "Improve the dashboard"
- ❌ "Make it work"
- ❌ "Fix bugs"

### 3. SCOPE
**Closed, no creep.**

Example from CP1:
- Apex AI attachment analysis (image, PDF)
- Response action buttons (copy, speak, share, menu)
- Text-to-speech via Web Speech API
- File upload security + RLS
- Auth token validation
- Build MUST pass
- All checks MUST be green
- QA manual in Vercel preview

Out of scope:
- ❌ Schema changes
- ❌ Auth flow changes
- ❌ New migrations
- ❌ Breaking changes to existing dashboards

### 4. PROHIBITED
**Explicit list of what NOT to do.**

Example from CP1:
- ❌ No breaking changes to existing dashboards
- ❌ No schema changes
- ❌ No auth flow changes (only token validation)
- ❌ No Supabase policy changes
- ❌ No new migrations

### 5. 100% CRITERIA
**Acceptance criteria for checkpoint completion.**

Must include:
- ✅ Feature works (manual QA approved)
- ✅ Build passes (`npm run build`)
- ✅ Lint passes (`npm run lint`)
- ✅ Tests pass (if applicable)
- ✅ All checks pass (GitHub Actions, TypeScript)
- ✅ Vercel preview deployed
- ✅ QA manual sign-off
- ✅ Documentation updated
- ✅ Master status synced
- ✅ PR merged to main

**Rule:** NEVER declare 100% complete without all criteria met.

### 6. IMPLEMENT
**Execute within scope.**

- Copilot (via selected engine) makes changes
- Branch created from main
- Changes committed with clear messages
- Scope adhered to strictly
- No scope creep tolerated

### 7. VALIDATE
**Manual QA testing.**

- Test golden path (happy path)
- Test edge cases
- Test error conditions
- Verify no regressions in other features
- Document findings

### 8. CORRECT
**Fix bugs before closure.**

- Bugs found during validation → new commits
- Re-test fixes
- Repeat validation until clean
- No known bugs at closure

### 9. PR
**Create pull request.**

- Title: Checkpoint name + objective
- Body: objective, scope, prohibited, deliverables, acceptance criteria
- Link to APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md
- Reference issue if applicable

### 10. CHECKS
**All automated checks must pass.**

Required:
- ✅ GitHub Actions (TypeScript, ESLint, tests)
- ✅ Build succeeds (`npm run build`)
- ✅ Lint succeeds (`npm run lint`)
- ✅ Type checking succeeds
- ✅ Tests pass (if applicable)

If checks fail:
- Diagnose root cause
- Fix issue
- Create new commit (NOT amend)
- Push new commit
- Checks re-run automatically
- Repeat until all pass

### 11. MERGE
**Merge only when ready.**

Conditions for merge:
- ✅ All checks PASS
- ✅ Owner approved (if blocking)
- ✅ No force-push (always merge via GitHub)
- ✅ Branch deleted after merge
- ✅ Main should be clean

### 12. TEST PREVIEW
**Manual QA in Vercel preview.**

- Click "View Preview" on PR
- Test all new features
- Test integration with existing features
- Check mobile responsiveness
- Verify no visual regressions
- Document any issues found

If issues found:
- Fix in new commit
- Checks re-run
- Re-test in new preview

### 13. TEST PRODUCTION
**Manual QA in production (if applicable).**

Only for certain checkpoints (user-facing features, critical paths):
- Test in production environment
- Verify data consistency
- Check performance
- Monitor for errors

### 14. DOCUMENTATION
**Update all relevant docs.**

Update:
- APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md (mark CP as COMPLETE)
- CHECKPOINT_[N]_COMPLETION_REPORT.md (create if needed)
- Master.Package.Apex.original docs (sync references)
- README.md (if applicable)
- Code comments (if needed for non-obvious logic)

### 15. STATUS SYNC
**Synchronize master documents.**

Update:
- `Master.Package.Apex.original/00_INDEX/PACOTE_MASTER_STATUS_GERAL.md`
- `Master.Package.Apex.original/04_ARQUITETURA_E_ROADMAP/ROADMAP_OFICIAL.md`
- `Master.Package.Apex.original/03_GOVERNANCA/APEX_GLOBAL_MASTER_PLAN.md`
- Any other master docs referencing this checkpoint

### 16. CLOSURE
**Formal checkpoint closure.**

Create CHECKPOINT_[N]_COMPLETION_REPORT.md with:
- Checkpoint name + number
- Status: ✅ COMPLETE
- Duration: Actual time taken
- Deliverables: List with ✅ checkmarks
- Key decisions: Decisions locked in for future
- Pending work: What's left for next checkpoint
- Sign-off: Copilot + Owner timestamp

Example structure:
```
# CHECKPOINT 1 — COMPLETION REPORT
**Status:** ✅ COMPLETE
**Duration:** 3 days
**Date:** 2026-06-07

## DELIVERABLES
- ✅ Apex AI attachment analysis
- ✅ Response action buttons
- ✅ Text-to-speech implementation
- ✅ Build green
- ✅ QA approved
- ✅ Documentation updated

## KEY DECISIONS
1. Web Speech API for TTS (not external service)
2. Action buttons inline in response (not separate menu)
3. Speak button disabled on unsupported browsers

## NEXT: CHECKPOINT 2
CP2 ready to begin when CP1 complete.

## SIGN-OFF
Created: Apex Copilot
Approved: Owner (Apex Global AI)
Date: 2026-06-07 16:30 UTC
```

### 17. NEXT CHECKPOINT
**Open next checkpoint.**

If next checkpoint is unblocked:
- Create CP[N+1] branch
- Define objective + scope
- Start stage 1 (CREATE)

If next checkpoint is blocked:
- Document blocker in ROADMAP
- Mark as PENDING
- Set unblock conditions
- Monitor for unblock event

---

## DECISION GATES

### Blocking Gate
If checkpoint encounters:
- ❌ Feature doesn't work
- ❌ Build fails
- ❌ QA finds critical bugs
- ❌ Security issue discovered
- ❌ Major scope change required

**Action:** STOP, report to Owner, wait for decision.

### Non-Blocking Gate
If checkpoint encounters:
- 🟡 Minor bug (edge case, non-critical path)
- 🟡 Performance issue (non-critical feature)
- 🟡 Documentation gap

**Action:** Fix in new commit, continue.

---

## RESPONSIBILITIES

**Apex Copilot:**
- Manages lifecycle progression
- Selects appropriate engine
- Generates handoff
- Monitors execution
- Logs to Mission Control
- Escalates blockers to Owner

**Selected Engine** (Codex, Claude, Qwen):
- Executes within scope
- Creates branch, commits, PR
- Passes checks
- Validates in preview
- Reports completion

**Owner:**
- Creates checkpoint (initiates)
- Approves blocking decisions
- Signs off on completion
- Opens next checkpoint
- Reviews Mission Control logs

---

## CHECKPOINT NAMING

Format: `CP[number] — [objective in 4-6 words]`

Examples:
- CP0 — Source of Truth + Roadmap
- CP1 — PR #123 Apex AI Foundation
- CP2 — Welcome / Análises First Screen
- CP3 — Project Intake Automatic

---

## TIMELINE TRACKING

Each checkpoint records:
- Start date/time
- Estimated duration (from ROADMAP)
- Actual duration
- Any delays + reasons
- Blockers encountered
- Resolution time

Used for continuous improvement of estimates.

---

## MISSION CONTROL LOGGING

Every checkpoint transition logged:
```json
{
  "timestamp": "2026-06-04T14:30:00Z",
  "checkpoint": "CP1",
  "stage": "MERGE",
  "status": "COMPLETE",
  "duration_hours": 48,
  "pr_url": "https://github.com/.../pull/...",
  "owner_email": "owner@apex.com",
  "engine_used": "Claude",
  "checks_status": "PASS",
  "qa_approved": true,
  "build_status": "GREEN",
  "next_checkpoint": "CP2",
  "notes": "Successful completion, all criteria met"
}
```

---

## STATUS REFERENCE

| Status | Meaning | Action |
|--------|---------|--------|
| NOT_STARTED | Not yet initiated | Awaiting Owner command |
| IN_PROGRESS | Actively executing | Continue through stages |
| BLOCKED | Waiting on decision/unblock | Escalate to Owner |
| COMPLETE | All stages done, merged | Open next checkpoint |
| DEFERRED | Intentionally paused | Document reason, resume later |
| CANCELLED | Cancelled by Owner | Document reason |

---

**See:** APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md for checkpoint definitions.  
**See:** APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md for safety gates.
