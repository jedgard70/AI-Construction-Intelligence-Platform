# APEX COPILOT — ENGINE ROUTER
**Decision Matrix for AI Engine Selection**

**Date:** 2026-06-04  
**Status:** Checkpoint 0.1  
**Version:** 1.0

---

## EXECUTIVE SUMMARY

Apex Copilot has access to 5 execution engines + Owner decision. Each engine excels at different tasks.

```
Task Type           → Engine Selection
Code refactor       → Codex (specialized code)
Code PR creation    → Codex (PR structure, commits)
Bug patch           → Codex (technical fix)
Audit/analysis      → Claude (comprehensive review)
Documentation       → Claude (structured writing)
UX/design review    → Claude (user perspective)
Validation/2nd op   → Qwen (quick alternative)
IDE/local coding    → GitHub Copilot (inline assistance)
Orchestration       → Apex Copilot (engine selection, supervision)
Final decision      → Owner (authority, approval)
```

---

## ENGINE CAPABILITIES

### 1. CODEX — Code Execution Engine

**Specialty:** Code changes, PRs, technical fixes, refactoring

**Strengths:**
- Excellent at code generation and refactoring
- Understands PR structure, commit messages, branch workflows
- Good at implementing specific features within defined scope
- Fast at syntax-level fixes
- Strong at following coding patterns/conventions

**Weaknesses:**
- Not ideal for open-ended analysis
- Can miss architectural/design implications
- Limited perspective on user experience
- Struggles with governance/policy decisions
- May create technically correct but conceptually wrong solutions

**When to use:**
- ✅ Implement feature from clear specification
- ✅ Fix bug with known root cause
- ✅ Refactor existing code for efficiency
- ✅ Create/update PR with code changes
- ✅ Run build/lint/tests
- ✅ Create branch, commit, push
- ✅ Update imports, function signatures
- ✅ Add type definitions

**When NOT to use:**
- ❌ Decide architecture (use Claude)
- ❌ Diagnose unclear problem (use Claude + Qwen)
- ❌ Write governance docs (use Claude)
- ❌ Review security model (use Claude)
- ❌ Make policy decisions (use Owner)

**Risk Level:** Medium (can introduce bugs in complex logic)

**Example Assignment:**
```
CHECKPOINT 1 — Response Action Buttons Implementation
Owner: Codex (code generation, PR creation)
Codex creates:
  - Branch: feature/response-actions
  - Files: ActionButtons.tsx, useActions.hook.ts
  - Tests: ActionButtons.test.ts
  - Commit: "feat: add response action buttons (copy, speak, share)"
  - PR to main with acceptance criteria
  - Build passes, all checks green
```

---

### 2. CLAUDE — Analysis & Audit Engine

**Specialty:** Analysis, audit, documentation, architecture review, UX design, governance

**Strengths:**
- Excellent at comprehensive analysis
- Strong at identifying gaps/risks in architecture
- Good at writing clear documentation
- Can review from multiple perspectives (user, developer, security)
- Strong at policy/governance decisions
- Good at finding non-obvious implications
- Can challenge assumptions

**Weaknesses:**
- Not specialized for code execution
- Slower at generating code
- May miss specific syntax/convention details
- Not ideal for rapid prototyping
- Requires more context to execute

**When to use:**
- ✅ Audit access control (RBAC, RLS, gates)
- ✅ Review architecture decisions
- ✅ Write governance/policy documents
- ✅ Analyze complex problems
- ✅ Design UX flows
- ✅ Review security model
- ✅ Investigate performance issues
- ✅ Assess design implications
- ✅ Write comprehensive documentation

**When NOT to use:**
- ❌ Rapid code fixes (use Codex)
- ❌ Quick syntax changes (use Codex)
- ❌ Create complex PR with many files (use Codex)
- ❌ Run builds/tests (use Codex)
- ❌ Push to repo (use Codex)

**Risk Level:** Low (analysis doesn't change code)

**Example Assignment:**
```
CHECKPOINT 0 — Source of Truth Documentation
Owner: Claude (analysis, documentation)
Claude creates:
  - APEX_ENTRY_FLOW_SOURCE_OF_TRUTH.md (430 lines)
  - APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md (548 lines)
  - APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md (155 lines)
  - Comprehensive governance framework
```

---

### 3. QWEN — Validation & Alternative Engine

**Specialty:** Second opinions, validation, quick alternatives, edge cases

**Strengths:**
- Fast at generating alternatives
- Good at catching edge cases
- Useful for validation/second opinion
- Can suggest different approaches
- Quick turn-around for questions

**Weaknesses:**
- Not specialized in any single area
- Can produce less polished output
- May not understand context deeply
- Better for critique than creation
- Risk of suggesting incomplete solutions

**When to use:**
- ✅ Get second opinion on solution
- ✅ Validate architecture decision
- ✅ Find alternative approach
- ✅ Identify edge cases
- ✅ Quick validation of concept
- ✅ Generate alternatives for Owner to choose

**When NOT to use:**
- ❌ Primary implementation (use Codex or Claude)
- ❌ Final decision authority (use Owner)
- ❌ Complex problem with many dependencies (use Claude)
- ❌ Production-critical code (use Codex + QA)

**Risk Level:** Medium (validation may miss real issues)

**Example Assignment:**
```
CHECKPOINT 2 — Welcome/Análises First Screen
Owner: Claude (primary)
Claude: Designs Welcome screen flow
Owner: Review design
Owner → Qwen: Get alternative layout design
Qwen: Suggests 2 alternatives
Owner: Chooses best option
Codex: Implements chosen option
```

---

### 4. GITHUB COPILOT — IDE/Local Assistance

**Specialty:** Real-time coding assistance in IDE, local context, inline suggestions

**Strengths:**
- Works in IDE in real-time
- Good at autocomplete/suggestions
- Understands local file context
- Fast for small fixes
- Good for exploration/prototyping

**Weaknesses:**
- Limited scope (single file/small context)
- No deep project understanding
- Not good for large refactors
- Can suggest incorrect patterns
- Limited visibility into requirements

**When to use:**
- ✅ Local development/prototyping
- ✅ Inline code suggestions
- ✅ Autocomplete
- ✅ Refactoring small functions
- ✅ Writing tests locally
- ✅ Quick fixes while developing

**When NOT to use:**
- ❌ As primary implementation engine (use Codex)
- ❌ For structured PR workflow (use Codex)
- ❌ For builds/tests/checks (use Codex)
- ❌ For analysis (use Claude)
- ❌ For final code review (use Claude + Codex)

**Risk Level:** Medium (local work, not deployed)

**Example:**
Developer locally uses GitHub Copilot to prototype.
When ready: Codex takes over for branch/PR/checks.

---

### 5. APEX COPILOT — Orchestrator

**Specialty:** Orchestration, engine selection, supervision, Mission Control logging

**Strengths:**
- Understands all engines' capabilities
- Selects right engine for task
- Supervises execution across engines
- Manages checkpoint lifecycle
- Logs to Mission Control
- Escalates blockers to Owner
- Maintains governance

**Weaknesses:**
- Doesn't execute code/analysis directly
- Depends on other engines
- Can't override Owner decisions
- No authority to merge/deploy

**When to use:**
- ✅ Receive Owner command
- ✅ Route to appropriate engine
- ✅ Generate handoff
- ✅ Monitor execution
- ✅ Log to Mission Control
- ✅ Escalate blockers
- ✅ Manage checkpoint progression

**When NOT to use:**
- ❌ Actually write code (use Codex)
- ❌ Perform analysis (use Claude)
- ❌ Make authority decisions (use Owner)
- ❌ Bypass Safety Gate (use Owner approval)

**Risk Level:** Low (orchestration, not execution)

**Apex Copilot Role in Checkpoint Execution:**
```
1. Owner sends command: "Execute CP1"
   ↓
2. Apex Copilot validates Owner identity
   ↓
3. Apex Copilot classifies risk (medium = require approval)
   ↓
4. Apex Copilot asks Owner for approval if blocking
   ↓
5. Apex Copilot selects engine (Claude for audit, Codex for code, etc.)
   ↓
6. Apex Copilot generates detailed handoff
   ↓
7. Selected engine executes
   ↓
8. Apex Copilot monitors execution
   ↓
9. If engine hits blocker → Apex Copilot escalates to Owner
   ↓
10. If execution succeeds → Apex Copilot logs to Mission Control
    ↓
11. Apex Copilot reports completion to Owner
```

---

### 6. OWNER — Authority & Final Decision

**Specialty:** Authority, final decisions, approval, governance

**Strengths:**
- Has authority to approve/block
- Can make business decisions
- Can override technical decisions
- Can authorize dangerous operations
- Responsible for outcomes

**Weaknesses:**
- Not specialized in execution
- Can't do detailed technical work
- Limited bandwidth for everyday tasks
- Should focus on decisions, not execution

**When to use:**
- ✅ Create/close checkpoint (authority)
- ✅ Approve blocking operations
- ✅ Authorize schema changes
- ✅ Authorize RLS changes
- ✅ Authorize production deploys
- ✅ Authorize deletion/data reset
- ✅ Override technical decisions
- ✅ Make governance decisions
- ✅ Sign off on completion

**When NOT to use:**
- ❌ Routine code changes (use Codex)
- ❌ Documentation (use Claude)
- ❌ Testing/validation (use QA team)
- ❌ For every decision (use engines for tactical decisions)

**Risk Level:** Low (authority only, not implementation)

**Example Authority Decision:**
```
Codex encounters Supabase schema change need.
Codex stops, reports to Apex Copilot.
Apex Copilot escalates to Owner:
"CP3 requires new table 'project_locations'.
Schema: país, estado, cidade, production_system.
RLS: Project members can read."

Owner reviews:
- Is this necessary? YES
- Does it violate constraints? NO
- Approval: APPROVED

Codex creates migration + applies it.
```

---

## ENGINE SELECTION FLOWCHART

```
Task arrives at Apex Copilot
  ↓
Is it code execution/PR/build? → YES → Use CODEX
  ↓ NO
Is it analysis/audit/docs/design? → YES → Use CLAUDE
  ↓ NO
Is it validation/2nd opinion? → YES → Use QWEN
  ↓ NO
Is it IDE/local prototyping? → YES → Use GITHUB COPILOT
  ↓ NO
Is it governance/authority decision? → YES → Use OWNER
  ↓ NO
Orchestrate across engines → Use APEX COPILOT
```

---

## MULTI-ENGINE CHECKPOINT EXAMPLE

**CHECKPOINT 7 — Jurídico / Contratos / Permits Internacional**

Multiple engines working together:

1. **Claude (Audit):** Analyze legal/compliance requirements for Brasil, EUA, Europa
   - Output: Legal requirements doc + template structure

2. **Claude (Design):** Design contract workflow UI
   - Output: Contract flow diagram + screen layout

3. **Codex (Implementation):** Build contract engine
   - Input: Claude's designs
   - Output: Code PR with contract generation + signature workflow

4. **Qwen (Validation):** Review contract engine against requirements
   - Input: Codex's code + Claude's requirements
   - Output: Issues found + suggestions

5. **Codex (Fixes):** Fix issues found by Qwen
   - Input: Qwen's feedback
   - Output: Updated PR with fixes

6. **Owner (Authority):** Approve legal compliance + production deploy
   - Input: Claude's audit + Codex's implementation
   - Decision: APPROVED for production

---

## RISK CLASSIFICATION + ENGINE SELECTION

| Risk | Task Type | Primary Engine | Secondary |
|------|-----------|----------------|-----------|
| 🟢 Low | Bug fix in non-critical path | Codex | None |
| 🟡 Medium | Feature add + testing | Codex | Qwen (validation) |
| 🔴 High | Core flow change | Claude (audit) + Codex (code) | Qwen (alt) |
| 🔴 Critical | Schema/RLS change | Claude (audit) | Owner (approval) |

---

## COMMUNICATION BETWEEN ENGINES

Engines communicate via:
1. **Handoff document** (context → objective → scope → deliverables)
2. **PR comments** (inline feedback)
3. **Escalation to Owner** (blockers)
4. **Mission Control log** (execution record)

---

## DECISION AUTHORITY

| Decision Type | Authority | Process |
|---------------|-----------|---------|
| Code quality | Codex + Code review | Review + approval |
| Architecture | Claude | Analysis + recommendation |
| Policy/Governance | Owner | Review + approval |
| Blocking operation | Owner | Explicit approval required |
| Engine selection | Apex Copilot | Route to appropriate engine |
| Checkpoint creation | Owner | Initiate via Mission Control |
| Checkpoint closure | Owner | Sign off on completion |

---

**See:** APEX_COPILOT_CHECKPOINT_MANAGER.md for checkpoint lifecycle.  
**See:** APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md for safety gates.
