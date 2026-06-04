# APEX COPILOT — HANDOFF GENERATOR
**Standard Template for Engine Handoff**

**Date:** 2026-06-04  
**Status:** Checkpoint 0.1  
**Version:** 1.0

---

## PURPOSE

When Apex Copilot routes work to an execution engine (Codex, Claude, Qwen), it generates a detailed handoff document that provides all context, constraints, and acceptance criteria.

The handoff is the contract between Apex Copilot and the engine. Both sides are bound by its terms.

---

## HANDOFF TEMPLATE

```markdown
# HANDOFF: [Checkpoint Name]
**Engine:** [Codex | Claude | Qwen]
**Risk Level:** [LOW | MEDIUM | HIGH | CRITICAL]
**Status:** [NEW | ONGOING | BLOCKED | COMPLETE]
**Date:** [YYYY-MM-DD]

---

## 1. CONTEXT

[Narrative context about why this work is needed, what problem it solves, what dependencies exist]

**Current State:**
- [State 1]
- [State 2]
- [State 3]

**Background:**
[Any relevant history, decisions, or constraints]

**Related Documents:**
- [Doc 1](link)
- [Doc 2](link)

---

## 2. OBJECTIVE

[Clear, specific, measurable outcome. 1-2 sentences.]

Example: "Implement response action buttons (copy, speak, share, menu) for Apex AI responses with Web Speech API integration and error handling."

---

## 3. SCOPE

**In Scope:**
- [Item 1]
- [Item 2]
- [Item 3]

**Out of Scope:**
- [Explicitly exclude items to prevent scope creep]

**Affected Files:**
- [src/components/ResponseActions.tsx]
- [src/hooks/useActions.ts]
- [src/pages/api/speak.ts]

---

## 4. ACCEPTANCE CRITERIA

**Functional:**
- ✅ [Feature works: describe expected behavior]
- ✅ [Feature works: edge case handled]
- ✅ [Feature integrates with existing system]

**Technical:**
- ✅ Build passes: `npm run build`
- ✅ Lint passes: `npm run lint`
- ✅ Tests pass: `npm run test`
- ✅ TypeScript: No errors
- ✅ All checks pass in GitHub Actions

**Quality:**
- ✅ Mobile responsive (tested on mobile)
- ✅ No regressions in other features
- ✅ Error handling for edge cases
- ✅ Accessibility (WCAG AA if applicable)

**Documentation:**
- ✅ Code comments for non-obvious logic
- ✅ TypeScript types documented
- ✅ PR description explains changes
- ✅ CHANGELOG updated (if applicable)

---

## 5. DELIVERABLES

**Commits:**
1. [feat: add response action buttons]
2. [feat: implement text-to-speech]
3. [test: add action button tests]

**PR:**
- Branch: `feature/response-actions`
- Title: `feat: add response action buttons (copy, speak, share)`
- Linked to: CP1, PR #123

**Testing:**
- Vercel preview deployed and tested
- Manual QA in Vercel preview: APPROVED
- No known bugs at delivery

---

## 6. CONSTRAINTS & PROHIBITIONS

**Must Do:**
- ✅ Use Web Speech API (browser-native)
- ✅ No breaking changes to existing components
- ✅ RLS policies enforced (no data leakage)
- ✅ Error handling for all edge cases

**Must NOT Do:**
- ❌ Don't change authentication flow
- ❌ Don't modify Supabase schema
- ❌ Don't use external speech service
- ❌ Don't add new dependencies without Owner approval
- ❌ Don't commit secrets/API keys
- ❌ Don't force-push to main

---

## 7. TESTING REQUIREMENTS

**Unit Tests:**
- [Test case 1: copy button works]
- [Test case 2: speak button respects lang preference]
- [Test case 3: error handling for unsupported browser]

**Integration Tests:**
- [Feature integrates with ResponsePanel]
- [RLS policies still enforced]
- [No data leakage]

**Manual QA:**
- [Desktop: Chrome, Firefox, Safari]
- [Mobile: iOS Safari, Chrome Android]
- [Edge case: unsupported browser fallback]

**Performance:**
- [Button response time < 100ms]
- [Speech synthesis doesn't block UI]

---

## 8. SUCCESS CRITERIA (Green/Yellow/Red)

### 🟢 GREEN — Success
- All acceptance criteria met
- Build: ✅ PASS
- All checks: ✅ PASS
- QA manual: ✅ APPROVED
- No regressions
- Ready to merge

**Action:** Merge PR, proceed to next stage

### 🟡 YELLOW — Warning
- Most criteria met
- Build: ✅ PASS
- One check failing (non-blocking)
- QA found minor issue (non-critical path)
- Fixable in new commit

**Action:** Fix issue, create new commit, re-test, then merge

### 🔴 RED — Failure
- Critical acceptance criteria NOT met
- Build: ❌ FAIL
- Multiple checks failing
- QA found critical bug
- Not mergeable as-is

**Action:** STOP, report to Apex Copilot + Owner, await decision on fix/revert/redesign

---

## 9. HANDOFF CHECKLIST

**Before Handing Off:**
- ✅ Context clearly explained
- ✅ Objective is specific and measurable
- ✅ Scope is closed (no creep room)
- ✅ Acceptance criteria are unambiguous
- ✅ Deliverables are clear
- ✅ Constraints are explicit
- ✅ Testing requirements defined
- ✅ Success rules are clear

**Engine Receiving Handoff:**
- ✅ Understand context
- ✅ Confirm objective is achievable
- ✅ Verify scope is manageable
- ✅ Acknowledge constraints
- ✅ Confirm testing approach
- ✅ Ask clarifying questions before starting

---

## 10. ESCALATION RULES

**Engine should escalate to Apex Copilot if:**

❌ **Scope has changed** — new requirements appeared
- Action: STOP, report to Apex Copilot, await decision

❌ **Build is broken** — dependency missing or broken import
- Action: DIAGNOSE, fix if possible, escalate if blocking other work

❌ **Acceptance criteria can't be met** — technical limitation
- Action: Report to Apex Copilot, propose alternative, await decision

❌ **Risk level should change** — discovered higher risk than expected
- Action: Report with evidence, await Owner decision

❌ **Time estimate exceeded** — taking much longer than expected
- Action: Report progress, new estimate, and blockers

❌ **Permission/approval required** — hit a gate (Supabase, production, secrets)
- Action: STOP, escalate to Owner

---

## EXAMPLE HANDOFF

```markdown
# HANDOFF: CP1 — Apex AI Response Actions
**Engine:** Codex
**Risk Level:** MEDIUM
**Status:** NEW
**Date:** 2026-06-04

---

## 1. CONTEXT

PR #123 (Apex AI Foundation) requires response action buttons so users can
interact with Apex Copilot responses. Currently, responses show but have no
interactive elements. Users need ability to copy, speak, share, and access
more options menu.

**Current State:**
- Apex AI responses display in ResponsePanel component
- No action buttons exist
- Web Speech API not used
- No text-to-speech capability

**Related Documents:**
- PR #123 (Apex AI Foundation)
- APEX_ENTRY_FLOW_SOURCE_OF_TRUTH.md (section: Apex AI Copilot)
- APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md (CP1: objectives)

---

## 2. OBJECTIVE

Implement response action buttons (copy, speak, share, menu) for Apex AI
responses with Web Speech API integration, error handling, and full mobile
responsiveness.

---

## 3. SCOPE

**In Scope:**
- Copy button (copy response to clipboard)
- Speak button (text-to-speech via Web Speech API)
- Share button (Web Share API + fallback to clipboard)
- More menu (format options, language selection)
- Error handling for unsupported browsers
- Mobile responsive design
- Accessibility (keyboard navigation)

**Out of Scope:**
- Authentication changes
- Database schema changes
- Response generation/AI backend
- Existing ResponsePanel refactoring
- New dependencies (use native Web APIs)

**Affected Files:**
- src/components/ResponseActions.tsx (NEW)
- src/components/ResponsePanel.tsx (update to include buttons)
- src/hooks/useActions.ts (NEW)
- src/styles/actions.css (NEW)
- src/pages/api/speak.ts (NEW, backend support)

---

## 4. ACCEPTANCE CRITERIA

**Functional:**
- ✅ Copy button copies full response to clipboard
- ✅ Speak button reads response aloud (respects language preference)
- ✅ Speak button disabled/hidden on unsupported browsers
- ✅ Share button opens native share dialog or copies
- ✅ More menu shows format options (copy as markdown, plain text, etc.)
- ✅ All buttons work on desktop and mobile

**Technical:**
- ✅ Build passes: `npm run build`
- ✅ Lint passes: `npm run lint`
- ✅ Tests pass: `npm run test`
- ✅ TypeScript: No errors
- ✅ GitHub Actions: All checks pass

**Quality:**
- ✅ Mobile responsive (iPhone, Android)
- ✅ Keyboard accessible (Tab, Enter)
- ✅ Error handling for browser compatibility
- ✅ No console errors/warnings
- ✅ No regressions in ResponsePanel

**Documentation:**
- ✅ Code comments explain Web Speech API usage
- ✅ TypeScript types documented
- ✅ PR description explains changes
- ✅ README updated if adding new patterns

---

## 5. DELIVERABLES

**Commits:**
1. feat: add response action buttons component
2. feat: implement web speech API integration
3. feat: add share functionality with fallback
4. test: add action button tests
5. docs: update PR description

**PR:**
- Branch: `feature/response-actions`
- Title: `feat: add response action buttons (copy, speak, share, menu)`
- Base: main
- Linked to: PR #123 (Apex AI Foundation)

**Testing:**
- Vercel preview: deployed and functional
- Manual QA: APPROVED (tested desktop + mobile)
- No known bugs

---

## 6. CONSTRAINTS & PROHIBITIONS

**Must Do:**
- ✅ Use Web Speech API (browser-native, no external service)
- ✅ Handle unsupported browsers gracefully
- ✅ Maintain RLS policies (no data exposure)
- ✅ Write TypeScript (no implicit any)
- ✅ Test edge cases

**Must NOT Do:**
- ❌ Don't call external speech API (cost, privacy)
- ❌ Don't change ResponsePanel internals (only add buttons)
- ❌ Don't modify Supabase schema
- ❌ Don't change authentication
- ❌ Don't add new npm dependencies
- ❌ Don't commit secrets/API keys
- ❌ Don't force-push

---

## 7. TESTING REQUIREMENTS

**Unit Tests:**
- Test copy button copies correct text
- Test speak button respects language
- Test unsupported browser fallback
- Test menu option selection

**Integration Tests:**
- Test with ResponsePanel
- Test RLS policies still enforced
- Test no data leakage

**Manual QA:**
- Desktop: Chrome, Firefox, Safari
- Mobile: iOS Safari, Chrome Android
- Edge case: unsupported browser (IE11 if applicable)

---

## 8. SUCCESS CRITERIA

### 🟢 GREEN
- All acceptance criteria met
- Build: ✅ PASS
- All checks: ✅ PASS
- QA manual: ✅ APPROVED
- Vercel preview tested
- Ready to merge

### 🟡 YELLOW
- Most criteria met
- One non-blocking check fails (fixable)
- QA found minor issue
- Fixable in new commit

### 🔴 RED
- Critical criteria NOT met
- Build ❌ FAIL
- QA found critical bug
- Not mergeable

---

## 9. QUESTIONS/CLARIFICATIONS

If engine has questions:
1. What language preference is stored in user profile?
2. Should More menu include export formats (PDF, etc.)?
3. Is Share button only for Web Share API or clipboard fallback?

---

## NEXT

After merge to main:
- Deploy to Vercel production
- Monitor for errors
- QA in production preview
- CP1 completion ready

Apex Copilot will supervise.
```

---

## HANDOFF LIFECYCLE

```
1. Apex Copilot creates handoff
   ↓
2. Engine receives handoff
   ↓
3. Engine clarifies questions (if any)
   ↓
4. Engine executes work
   ↓
5. If engine hits blocker → escalate to Apex Copilot
   ↓
6. If execution succeeds → report completion
   ↓
7. Apex Copilot supervises QA/tests/checks
   ↓
8. If all green → move to next stage
   ↓
9. If issues found → engine fixes in new commit
   ↓
10. Repeat until green
```

---

## HANDOFF DOCUMENT FORMAT

**File Location:**
- Store in PR description as part of commit message
- Reference in Mission Control log
- Archive in checkpoint completion report

**Accessibility:**
- Include in PR so reviewers understand scope
- Link to from APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md
- Include in checkpoint summary

---

**See:** APEX_COPILOT_CHECKPOINT_MANAGER.md for checkpoint lifecycle.  
**See:** APEX_COPILOT_ENGINE_ROUTER.md for engine selection.
