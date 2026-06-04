# APEX EXECUTABLE ROADMAP — CHECKPOINTS
**Apex Global AI Platform — Complete Checkpoint Roadmap**

**Date:** 2026-06-04  
**Status:** Active — Checkpoint 0  
**Version:** 1.0  
**Audience:** Architecture, Engineering, Product, Owner

---

## CRITICAL RULES FOR EVERY CHECKPOINT

1. **Objective** — Clear, specific, measurable
2. **Scope** — Closed, no scope creep
3. **Prohibited** — Explicit list of what NOT to do
4. **Implement** — Execute within scope
5. **Validate** — QA, manual testing
6. **Correct** — Fix bugs before closing
7. **PR** — Create pull request
8. **Checks** — Build, lint, typecheck must pass
9. **Merge** — Only after all checks green
10. **Test Production** — Verify in Vercel/preview
11. **Document** — Update relevant docs
12. **Sync Status** — Update master documents
13. **Close Checkpoint** — Formal closure
14. **Open Next** — Prepare next checkpoint

### Declaration Rule
**NEVER declare checkpoint 100% complete without:**
- Actual implementation (not mocked)
- Build/checks GREEN
- QA manual testing complete
- Documentation updated
- Master status synchronized
- Owner approval

---

## CHECKPOINT 0 — Source of Truth + Roadmap

**Status:** IN PROGRESS  
**Duration:** 1 day  
**Owner:** Owner (Apex Global AI)

### Objective
Consolidate all platform documentation, establish authoritative source of truth, create executable roadmap with all checkpoints, and synchronize governance.

### Scope
- Find + consolidate existing documentation
- Create source of truth documents
- Create executable roadmap (this document)
- Update all master references
- Sync to Master.Package.Apex.original
- NO code changes
- NO migrations
- NO Supabase schema changes

### Deliverables

✅ **Created:**
1. `docs/APEX_ENTRY_FLOW_SOURCE_OF_TRUTH.md` — Complete entry flow, modes, auth, menus, UX
2. `docs/APEX_EXECUTABLE_ROADMAP_CHECKPOINTS.md` — This document
3. `docs/APEX_COPILOT_CHECKPOINT_MANAGER.md` — Copilot checkpoint management
4. `docs/APEX_COPILOT_ENGINE_ROUTER.md` — Engine routing logic
5. `docs/APEX_COPILOT_HANDOFF_GENERATOR.md` — Handoff generation
6. `docs/APEX_COPILOT_PR_SUPERVISOR.md` — PR supervision
7. `docs/APEX_COPILOT_CODE_SKILL.md` — Code skill + branch/PR/merge
8. `docs/APEX_COPILOT_CODE_SKILL_SECURITY_MODEL.md` — Safety gate
9. `docs/CHECKLIST_APEX_COPILOT_ORCHESTRATION_TRAINING.md` — Training

✅ **Updated References:**
- Master.Package.Apex.original/03_GOVERNANCA/APEX_GLOBAL_MASTER_PLAN.md
- Master.Package.Apex.original/04_ARQUITETURA_E_ROADMAP/ROADMAP_OFICIAL.md
- Master.Package.Apex.original/00_INDEX/PACOTE_MASTER_STATUS_GERAL.md
- Master.Package.Apex.original/04_ARQUITETURA_E_ROADMAP/IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md
- Master.Package.Apex.original/02_MASTER_002/PACOTE_MASTER_002_INDEX.md

### Status
- 🟡 IN PROGRESS
- ✅ Documentation created
- ⏳ References being updated
- ⏳ Checkpoint 0 closure pending

### Next
→ **CHECKPOINT 1: PR #123 Apex AI Foundation**

---

## CHECKPOINT 1 — PR #123 Apex AI Foundation

**Status:** PENDING CHECKPOINT 0 CLOSE  
**Duration:** 2-3 days  
**Owner:** Claude Code / Owner  
**PR:** #123 (existing)

### Objective
Complete PR #123: Apex AI reads attachments, shows response actions, secure auth, green build, QA passes.

### Scope
- Apex AI attachment analysis (image, PDF)
- Response action buttons (copy, speak, share, menu)
- Text-to-speech via Web Speech API
- File upload security + RLS
- Auth token validation
- Build MUST pass
- All checks MUST be green
- QA manual in Vercel preview

### Prohibited
- No breaking changes to existing dashboards
- No schema changes
- No auth flow changes (only token validation)
- No Supabase policy changes
- No new migrations

### Deliverables
- ✅ Attachment upload working
- ✅ Image analysis via Claude Sonnet
- ✅ PDF text extraction
- ✅ Response action buttons visible
- ✅ Speak button (Web Speech API)
- ✅ Share button (Web Share API + clipboard fallback)
- ✅ More menu (copy, format options)
- ✅ Error handling
- ✅ Mobile responsive
- ✅ Build green
- ✅ All checks passing
- ✅ Vercel preview tested
- ✅ QA manual approved

### Expected Result
Apex Copilot can read attachments, analyze them with AI, show responses, and user can interact via action buttons.

### Acceptance Criteria
- Build: ✅ Green
- Tests: ✅ Passing (if applicable)
- Vercel Preview: ✅ Deployed
- QA Manual: ✅ Approved
- Documentation: ✅ Updated
- PR Status: ✅ Ready for merge

---

## CHECKPOINT 2 — Welcome / Análises as First Screen

**Status:** BLOCKED UNTIL CP1 COMPLETES  
**Duration:** 2-3 days  
**Owner:** Claude Code / Owner

### Objective
After login, all users see Welcome/Análises screen first. Owner sees additional "Controle Owner" button after scroll.

### Scope
- Modify dashboard routing logic
- Create/update SafeEntryHome → Welcome/Análises
- Add scroll-reveal "Controle Owner" button for Owner only
- Reorganize sidebar menu
- Dashboard Executivo no longer first screen
- All existing functionality preserved

### Prohibited
- Don't remove Dashboard Executivo (move it, don't delete)
- Don't change auth flow
- Don't change Supabase schema
- Don't break existing projects/data

### Deliverables
- ✅ Welcome/Análises is first screen
- ✅ All users see it (Owner + non-Owner)
- ✅ Apex AI Copilot available
- ✅ "Iniciar Atendimento" button works
- ✅ "Anexar Documento" works
- ✅ "Falar com Apex AI" opens Copilot
- ✅ Owner sees "Controle Owner / Dashboard Executivo" after scroll
- ✅ Non-Owner does NOT see owner button
- ✅ Sidebar reorganized per spec
- ✅ Build green
- ✅ QA approved

---

## CHECKPOINT 3 — Project Intake Automatic

**Status:** BLOCKED UNTIL CP2 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
File upload → Apex AI analysis → Project auto-created → Workspace opens

### Scope
- Attachment upload triggers Intake flow
- Apex AI reads + classifies document
- Auto-generate Project ID
- "Cliente novo ou existente?" question
- Collect location (país, estado, cidade)
- Create/link Cliente
- Create/link Projeto
- Route to Workspace

### Prohibited
- Don't change existing projects
- Don't alter CRM logic
- Don't change auth
- Don't modify Supabase schema (use migrations if needed)

### Deliverables
- ✅ Upload file → Apex AI analyzes
- ✅ Client decision question appears
- ✅ New client form (if needed)
- ✅ Project auto-created
- ✅ Location collected + stored
- ✅ Project ID generated
- ✅ Workspace ready
- ✅ Document linked to project
- ✅ Build green, QA approved

---

## CHECKPOINT 4 — Roteamento por Documento

**Status:** BLOCKED UNTIL CP3 COMPLETES  
**Duration:** 2-3 days  
**Owner:** Claude Code / Owner

### Objective
Apex AI classifies document → routes to correct workflow (financeiro, jurídico, produção, etc.)

### Scope
- Apex AI determines document type (nota fiscal, contrato, RG, planta, etc.)
- Routes to correct department/workflow
- Documents function as contextual button, not top-level menu
- Integration with existing modules

### Prohibited
- Don't break existing modules
- Don't change auth
- Don't modify schema without migration

### Document Type Routing
```
Nota Fiscal → Financeiro (Revenue Engine)
Contrato → Jurídico / Contratos (Contract Engine)
RG / Pessoal → CRM / Cliente
Planta / Técnico → Produção / Projeto
Memorial / Escopo → Jurídico + Produção
Foto de Obra → Campo / RDO
```

---

## CHECKPOINT 5 — Produção Internacional

**Status:** BLOCKED UNTIL CP4 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
Route projects to Produção Brasil, EUA, or Europa based on location + system.

### Scope
- Country/state/city classification
- Production system detection (wood frame, steel frame, alvenaria, etc.)
- Route to correct production module
- Load correct templates, permits, compliance

### Deliverables
- ✅ Project location determines routing
- ✅ Produção Brasil works
- ✅ Produção EUA works
- ✅ Produção Europa works
- ✅ Correct docs/templates loaded
- ✅ Build green, QA approved

---

## CHECKPOINT 6 — Vendas / CRM / Propostas

**Status:** BLOCKED UNTIL CP5 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
Client + project → lead → opportunity → proposal workflow.

### Scope
- CRM module functional
- Create/manage leads
- Create/manage opportunities
- Link to services
- Generate proposals

---

## CHECKPOINT 7 — Jurídico / Contratos / Permits Internacional

**Status:** BLOCKED UNTIL CP6 COMPLETES  
**Duration:** 4-5 days  
**Owner:** Claude Code / Owner

### Objective
Contract engine handles Brasil, EUA, Europa. Generates correct contracts, permits, compliance docs.

### Scope
- Contract templates by country + service
- Permits/licenses per jurisdiction
- Compliance rules per country
- Signature/document workflow
- Integration with project

---

## CHECKPOINT 8 — Financeiro Operacional

**Status:** BLOCKED UNTIL CP7 COMPLETES  
**Duration:** 2-3 days  
**Owner:** Claude Code / Owner

### Objective
Read note fiscal → link to project/client → create financial entry.

### Scope
- Document upload → Apex AI reads
- Extract: cliente, obra, categoria, valor, data
- Link to existing project
- Create revenue/expense entry
- Financial dashboard updated

---

## CHECKPOINT 9 — ArchVis / ArcVis Funcional

**Status:** BLOCKED UNTIL CP8 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
ArchVis module 100% functional with real project data.

### Scope
- Render/visualization module
- Load project files
- Generate 3D views
- Create renders/images
- Link to project + marketing

---

## CHECKPOINT 10 — DirectCut Funcional

**Status:** BLOCKED UNTIL CP9 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
DirectCut/Director Cut 100% functional for video/media.

### Scope
- Video editing module
- Project media management
- Export/share capabilities
- Link to project + marketing + social

---

## CHECKPOINT 11 — Design/Web Builder Funcional

**Status:** BLOCKED UNTIL CP10 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
Design/Web Builder creates landing pages, marketing materials, web content.

### Scope
- Web builder interface
- Template management
- Content creation
- Export to web

---

## CHECKPOINT 12 — Marketing / Web / Social

**Status:** BLOCKED UNTIL CP11 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
Project → marketing content → web + social posts.

### Scope
- Portfolio generation
- Social media post templates
- Content scheduling
- Integration with project

---

## CHECKPOINT 13 — Multi-tenant / Construtech

**Status:** BLOCKED UNTIL CP12 COMPLETES  
**Duration:** 4-5 days  
**Owner:** Claude Code / Owner

### Objective
External clients use platform for their own company (SaaS model).

### Scope
- Tenant isolation via RLS
- Client self-service workspace
- Own CRM, projects, marketing, financeiro
- White-label branding (if applicable)

---

## CHECKPOINT 14 — Mission Control / Controle Owner

**Status:** BLOCKED UNTIL CP13 COMPLETES  
**Duration:** 2-3 days  
**Owner:** Claude Code / Owner

### Objective
Owner dashboard for monitoring platform operations.

### Scope
- PR status, builds, deploys
- Vercel preview/production
- Supabase status, logs
- Mission Control events
- Real-time monitoring

---

## CHECKPOINT 15 — Apex Copilot Orchestrator

**Status:** BLOCKED UNTIL CP14 COMPLETES  
**Duration:** 3-4 days  
**Owner:** Claude Code / Owner

### Objective
Apex Copilot orchestrates checkpoint execution.

### Scope
- Receive Owner command
- Validate Owner
- Define checkpoint
- Choose engine
- Generate handoff
- Supervise execution
- Log to Mission Control

---

## CHECKPOINT 16 — Apex Copilot Code Skill

**Status:** BLOCKED UNTIL CP15 COMPLETES  
**Duration:** 4-5 days  
**Owner:** Claude Code / Owner

### Objective
Apex Copilot executes code with Safety Gate.

### Scope
- Create branch
- Modify files
- Build/test
- Open PR
- Merge if checks pass
- Supabase migrations (approval required)
- Mission Control logging

---

## CHECKPOINT FINAL — Auditoria Total / Produção

**Status:** BLOCKED UNTIL CP16 COMPLETES  
**Duration:** 5-7 days  
**Owner:** Owner + Quality Team

### Objective
Apex Global AI 100% operational in production.

### Scope
- Full end-to-end testing
- Security audit
- Performance audit
- Documentation complete
- SLAs defined
- Support procedures in place

### Verification
- ✅ Login works
- ✅ CRM works
- ✅ Attachments work
- ✅ Apex AI works
- ✅ Project Intake works
- ✅ Jurídico/Contratos works
- ✅ ArchVis works
- ✅ DirectCut works
- ✅ Design/Web Builder works
- ✅ Multi-tenant works
- ✅ Mission Control works
- ✅ Copilot works
- ✅ Build green
- ✅ All checks passing
- ✅ Zero P0/P1 bugs
- ✅ Documentation complete

---

## SUMMARY TABLE

| CP | Name | Status | Duration | Blocker |
|----|------|--------|----------|---------|
| 0 | Source of Truth + Roadmap | IN PROGRESS | 1d | None |
| 1 | PR #123 Apex AI Foundation | PENDING | 2-3d | CP0 |
| 2 | Welcome / Análises First Screen | PENDING | 2-3d | CP1 |
| 3 | Project Intake Automatic | PENDING | 3-4d | CP2 |
| 4 | Document Routing | PENDING | 2-3d | CP3 |
| 5 | International Production | PENDING | 3-4d | CP4 |
| 6 | Vendas / CRM / Propostas | PENDING | 3-4d | CP5 |
| 7 | Jurídico / Contracts / Permits | PENDING | 4-5d | CP6 |
| 8 | Financeiro Operacional | PENDING | 2-3d | CP7 |
| 9 | ArchVis Funcional | PENDING | 3-4d | CP8 |
| 10 | DirectCut Funcional | PENDING | 3-4d | CP9 |
| 11 | Design/Web Builder | PENDING | 3-4d | CP10 |
| 12 | Marketing / Web / Social | PENDING | 3-4d | CP11 |
| 13 | Multi-tenant / Construtech | PENDING | 4-5d | CP12 |
| 14 | Mission Control | PENDING | 2-3d | CP13 |
| 15 | Copilot Orchestrator | PENDING | 3-4d | CP14 |
| 16 | Copilot Code Skill | PENDING | 4-5d | CP15 |
| FINAL | Auditoria Total / Produção | PENDING | 5-7d | CP16 |

**Total Estimated Duration:** 50-65 days (7-9 weeks)

---

## STATUS TRACKING

- **Last Updated:** 2026-06-04
- **Responsible:** Owner (Apex Global AI)
- **Approver:** Owner
- **Version:** 1.0

---

**Reference:** See APEX_ENTRY_FLOW_SOURCE_OF_TRUTH.md for platform modes, UX flows, and security rules.
