# APEX COPILOT — CODE SKILL
**Future Code Execution Capability with Safety Gates**

**Date:** 2026-06-04  
**Status:** Checkpoint 0.1 — FUTURE CAPABILITY  
**Version:** 1.0
**Note:** This document defines the future Code Skill. Currently (CP0-CP1), Codex executes code. Apex Copilot Code Skill will be implemented in CP16.

---

## PURPOSE

The Apex Copilot Code Skill enables Apex Copilot to directly execute code changes, create PRs, run builds, and manage deployments — all under strict Safety Gate rules and Owner control.

This is a future capability. Currently, code execution is delegated to Codex engine.

---

## VISION

```
Current State (CP0-CP15):
Owner → Apex Copilot → Codex Engine → Code execution

Future State (CP16+):
Owner → Apex Copilot Code Skill → Direct code execution
                 ↓ (with Safety Gate enforcement)
                 ↓ (with Owner-only dangerous operations)
                 ↓ (with temporary token revocation)
```

---

## CODE SKILL CAPABILITIES (Future)

### 1. Git Operations
- ✅ Create branch from main
- ✅ Commit with clear messages
- ✅ Push to origin (never force)
- ✅ Create PR with scope/acceptance criteria
- ✅ Merge PR via GitHub API
- ✅ Delete branch after merge

### 2. Build & Testing
- ✅ Run `npm run build`
- ✅ Run `npm run lint`
- ✅ Run `npm run test`
- ✅ Parse build output for errors
- ✅ Report results to Mission Control

### 3. File Operations
- ✅ Read files (read-only for diagnostics)
- ✅ Write files (with scope restriction)
- ✅ Delete files (Owner approval required)
- ✅ Create new files (within scope)
- ✅ Rename files (track in git)

### 4. Supabase Operations
- ✅ Run migrations (with Owner approval)
- ✅ Create new tables (with RLS policies)
- ✅ Add columns (with RLS validation)
- ✅ Create RLS policies (with validation)
- ❌ BLOCKED: Drop tables, drop columns, reset database, delete data

### 5. Vercel Integration
- ✅ Trigger preview deploy (via PR)
- ✅ Read preview logs
- ✅ Get preview URL
- ✅ Monitor preview health
- ✅ Trigger production deploy (Owner-only)

### 6. Deployment Supervision
- ✅ Wait for Vercel build
- ✅ Check deployment status
- ✅ Read runtime logs
- ✅ Report health to Mission Control
- ✅ Trigger rollback (Owner-only)

---

## CONNECTORS

### GitHub Connector
**Capabilities:**
- List branches, commits, PRs
- Create branches, commits, PRs
- Merge PRs
- Get PR status, checks, reviews
- Add labels, milestones
- Post comments

**Authentication:**
- GitHub App with scoped permissions
- Temporary OAuth token (revoked after use)
- Owner verifies before dangerous operations

**Never Access:**
- ❌ Secrets, API keys
- ❌ Private gists
- ❌ User email (unless authorized)

### Vercel Connector
**Capabilities:**
- List deployments
- Get deployment status
- Read build logs
- Get environment variables (public only)
- Trigger deployments
- Monitor analytics

**Authentication:**
- Vercel API token (temporary, revoked after use)
- Owner approval for production deploy

**Never Access:**
- ❌ Production secrets/env vars
- ❌ Third-party integrations without approval
- ❌ User data

### Supabase Connector
**Capabilities:**
- List tables, columns, policies
- Create new tables with RLS
- Add columns with types
- Create RLS policies
- Run migrations
- Read logs (public only)
- Get project status

**Authentication:**
- Supabase API key (temporary, revoked after use)
- Owner approval for schema changes
- RLS policies always validated before apply

**Never Access:**
- ❌ Drop tables/columns
- ❌ Reset database
- ❌ Delete user data
- ❌ Disable RLS
- ❌ Change admin policies

---

## SAFETY GATE (Non-negotiable)

### Risk Classification

The Code Skill must classify every operation:

```
🟢 LOW RISK
- Documentation only changes
- Lint/format fixes
- Test updates
- Adding console.log
→ Action: Auto-proceed after checks pass

🟡 MEDIUM RISK
- Feature implementation (clear scope)
- Bug fix (known root cause)
- Refactoring (no logic change)
- New files within scope
→ Action: Require Owner approval

🔴 HIGH RISK
- Core flow changes
- Authentication changes
- Data model changes
- RLS policy changes
- Dependencies added
→ Action: STOP and ask Owner (blocking)

🔴 CRITICAL RISK
- Supabase schema changes (add table/column)
- Deleting code/data
- Force-pushing
- Production deploys
- Disabling safety gates
→ Action: STOP, require explicit Owner approval

```

### Absolute Prohibitions (Never allowed)

The Code Skill has hard-coded prohibitions that CANNOT be overridden:

- ❌ DELETE / DROP / RESET without explicit Owner approval
- ❌ Force-push to main
- ❌ Direct commits to main (always branch)
- ❌ Bypass pre-commit hooks
- ❌ Commit secrets/tokens
- ❌ Disable RLS policies
- ❌ Drop tables or columns
- ❌ Reset/truncate database tables
- ❌ Disable SSH key validation
- ❌ Merge without all checks passing
- ❌ Force-merge without review
- ❌ Deploy production without Owner approval
- ❌ Allow shell commands outside controlled set

If Owner commands dangerous operation:
1. Code Skill stops
2. Reports to Owner: "This operation requires explicit approval"
3. Owner confirms: "Yes, [operation], approved"
4. Code Skill executes (logging to Mission Control)

---

## OWNER-ONLY OPERATIONS

Some operations require Owner explicit approval:

```
Owner must approve:
- ✅ Schema changes (new table/column)
- ✅ RLS policy changes
- ✅ Production deploys
- ✅ Deleting code/files
- ✅ Changes to Safety Gate itself
- ✅ Dependencies added
- ✅ Database migrations
- ✅ Rollbacks
```

**Approval Process:**

```
Code Skill: "Operation requires Owner approval"
Code Skill: Shows operation details (what, why, impact)
Code Skill: "Owner, approve? (yes/no/ask-qwen)"

Owner: "yes"
→ Code Skill executes, logs to Mission Control

Owner: "no"
→ Code Skill stops, waits for redesign

Owner: "ask-qwen"
→ Qwen provides alternative, Owner decides
```

---

## TEMPORARY TOKEN MANAGEMENT

All tokens are temporary and revoked after use.

### GitHub Token
- **Duration:** 5 minutes max per operation
- **Scope:** Code push, PR creation, merge only
- **Revocation:** Auto-revoked after operation completes or expires
- **Fallback:** If token expires mid-operation, retry up to 3 times

### Vercel Token
- **Duration:** 5 minutes max per deployment
- **Scope:** Trigger deploy, read logs only
- **Revocation:** Auto-revoked after operation completes
- **No production token:** Production deploys require Owner token entry

### Supabase Token
- **Duration:** 5 minutes max per migration
- **Scope:** Schema changes, read-only for diagnostics
- **Revocation:** Auto-revoked after operation
- **Validation:** All schema changes validated before apply

### Never Stored
- ❌ Tokens never persisted
- ❌ Tokens never logged to Mission Control (only operation result)
- ❌ Tokens never exposed in error messages
- ❌ Tokens cleared from memory after use

---

## COMMAND RESTRICTIONS

### Allowed Shell Commands

Code Skill can run ONLY these commands (Owner can't expand this list):

```bash
npm run build          # Build application
npm run lint           # Lint check
npm run test           # Test suite
npm run typecheck      # TypeScript check
git branch             # List branches
git checkout -b        # Create branch
git add [files]        # Stage files
git commit             # Commit changes
git push               # Push to origin
git fetch              # Fetch from origin
git log                # View history
git status             # Check status
find [patterns]        # Search for files
grep [pattern]         # Search file content
cd [directory]         # Change directory
ls / ls -la            # List files
cat [file]             # Read file content
```

### Prohibited Commands

These commands are NEVER allowed:

```bash
rm -rf                 # Recursive delete
git reset --hard       # Hard reset
git rebase -i          # Interactive rebase
git push --force       # Force push
git branch -D          # Force delete branch
docker run             # Run containers (no access)
curl [secrets]         # No external calls with secrets
bash -c [shell]        # No arbitrary shell
sudo                   # No privilege escalation
```

### Why These Restrictions

- **Safety:** Prevents accidental deletions, force-pushes, security breaches
- **Auditability:** Only commands in allowed list are logged
- **Containment:** Limits blast radius of mistakes
- **Owner Control:** Owner can add commands only with explicit approval (CP16 design review)

---

## EXECUTION FLOW

```
1. Owner sends command: "Execute CP1"
   ↓
2. Code Skill validates Owner identity (Bearer token)
   ↓
3. Code Skill loads checkpoint spec from APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md
   ↓
4. Code Skill classifies risk (MEDIUM → require approval)
   ↓
5. Code Skill asks Owner for explicit approval
   ↓
6. Owner approves: "yes"
   ↓
7. Code Skill gets temporary GitHub token (5 min)
   ↓
8. Code Skill creates branch: git checkout -b feature/...
   ↓
9. Code Skill makes code changes (from handoff spec)
   ↓
10. Code Skill runs build/lint/test (all must pass)
    ↓
11. Code Skill commits: git commit -m "..."
    ↓
12. Code Skill pushes: git push -u origin feature/...
    ↓
13. GitHub token auto-revoked
    ↓
14. Code Skill gets temporary GitHub token (new)
    ↓
15. Code Skill creates PR to main
    ↓
16. Code Skill waits for GitHub Actions (max 30 min)
    ↓
17. If checks fail → Code Skill fixes, new commit, re-check
    ↓
18. If checks pass → Code Skill reports: "Ready for review"
    ↓
19. If Owner approval needed → Code Skill waits
    ↓
20. Owner approves: "merge"
    ↓
21. Code Skill merges PR via GitHub API
    ↓
22. GitHub token auto-revoked
    ↓
23. Code Skill waits for Vercel (max 30 min)
    ↓
24. Vercel preview ready → Code Skill reports URL
    ↓
25. Owner/QA tests in preview
    ↓
26. QA approves: "QA passed"
    ↓
27. Code Skill logs to Mission Control
    ↓
28. Code Skill reports: "CP1 complete, ready for closure"
    ↓
29. Owner closes checkpoint
```

---

## ERROR HANDLING

### If Build Fails

```
Code Skill:
1. Parse error from npm run build
2. Identify issue (syntax, import, type error, etc.)
3. Create new commit fixing issue
4. Run build again
5. If passes → continue
6. If fails → try up to 3 times
7. If still fails → stop and report to Owner
```

### If Checks Fail

```
Code Skill:
1. Read GitHub Actions logs
2. Identify which check failed (lint, test, etc.)
3. Fix issue in code
4. Create new commit
5. Push and wait for checks
6. Repeat up to 3 times
7. If still failing → escalate to Owner
```

### If PR Conflicts

```
Code Skill:
1. Detect conflict with main
2. Rebase on latest main
3. Resolve conflicts (if auto-resolvable)
4. Run build/lint/test
5. Force-push to branch (OK for feature branch)
6. Re-check in GitHub
```

### If Token Expires

```
Code Skill:
1. Detect 401 error (unauthorized)
2. Request new temporary token
3. Retry operation (up to 3 times)
4. If still failing → stop and report
```

---

## LOGGING & AUDIT TRAIL

Every Code Skill operation logged to Mission Control:

```json
{
  "timestamp": "2026-06-07T16:30:00Z",
  "checkpoint": "CP1",
  "operation": "code_change",
  "owner": "Owner (Apex Global AI)",
  "risk_level": "MEDIUM",
  "owner_approval": true,
  "approval_timestamp": "2026-06-07T16:25:00Z",
  "branch": "feature/response-actions",
  "changes_made": [
    "src/components/ResponseActions.tsx (NEW)",
    "src/hooks/useActions.ts (NEW)",
    "src/pages/api/speak.ts (NEW)"
  ],
  "files_modified": 3,
  "commits": [
    "feat: add response action buttons",
    "feat: implement web speech api",
    "test: add action tests"
  ],
  "build_status": "PASS",
  "lint_status": "PASS",
  "test_status": "PASS",
  "typecheck_status": "PASS",
  "github_checks": "PASS",
  "pr_created": "https://github.com/.../pull/...",
  "pr_merged": true,
  "vercel_preview": "deployed",
  "vercel_production": "deployed",
  "qa_approval": true,
  "result": "SUCCESS",
  "session_id": "01C7tJZTigHCiiHU8bL1m7F5",
  "notes": "All criteria met, ready for closure"
}
```

---

## FUTURE DESIGN DECISIONS (CP16)

These design decisions will be finalized in CP16 implementation:

1. **Command Expansion:** Can Owner add new commands to allowed list? (Currently: NO)
2. **Retry Policy:** How many retries for failed checks? (Currently: 3)
3. **Token Expiry:** Exact token duration per operation? (Currently: 5 min)
4. **Conflict Resolution:** Auto-resolve merge conflicts? (Currently: ask Owner)
5. **Shell Access:** Ever allow shell-like access? (Currently: NO)
6. **Rollback:** Can Code Skill automatically rollback? (Currently: Owner-only)
7. **Parallel Operations:** Can Code Skill run multiple checkpoints? (Currently: NO)

---

## COMPARISON: Current vs Future

| Aspect | Current (CP0-CP15) | Future (CP16+) |
|--------|-------------------|----------------|
| Code Executor | Codex Engine | Code Skill |
| Orchestrator | Apex Copilot | Apex Copilot (same) |
| Owner Approval | For blocking operations | For all dangerous ops |
| Safety Gate | Enforced by humans | Enforced by code |
| Token Management | Engine responsible | Code Skill (automated) |
| Error Recovery | Manual (human fixes) | Automated (up to 3 retries) |
| Supervision | Apex Copilot monitors | Apex Copilot monitors |
| Audit Trail | Manual logging | Auto-logged to Mission Control |

---

## IMPLEMENTATION ROADMAP

**CP16 — Apex Copilot Code Skill**
- Duration: 4-5 days
- Status: Pending CP15 completion
- Owner: Claude (design) + Codex (implementation)
- Deliverables:
  - Code Skill implementation
  - GitHub Connector
  - Vercel Connector
  - Supabase Connector
  - Safety Gate enforcement
  - Mission Control logging
  - Full audit trail
  - Error handling
  - Token management
  - Training materials

---

**See:** APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md for detailed security model.  
**See:** APEX_COPILOT_CHECKPOINT_MANAGER.md for checkpoint lifecycle.  
**See:** APEX_COPILOT_PR_SUPERVISOR.md for PR workflow (Code Skill uses this).
