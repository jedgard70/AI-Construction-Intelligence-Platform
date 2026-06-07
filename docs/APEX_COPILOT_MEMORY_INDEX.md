# Apex Copilot Memory Index

## Purpose

This document defines how Apex Copilot uses project markdown memory inside the platform repository.

Apex Copilot must not dump every markdown file into every prompt. It must scan the repository documentation, classify it, and inject only compact, relevant memory for the selected skill/domain.

## Scope

The runtime memory loader scans only files inside this repository:

- `README.md`
- `docs/**/*.md`

It does not read files from `D:\AI-constr` root, personal folders, backups, Google Drive, Supabase, Vercel, or any path outside the platform repo.

Current local scan at integration time found:

- `175` markdown files under `docs/`
- `README.md`

## Runtime Files

- `lib/apex-copilot/memory-index.ts`
- `lib/apex-copilot/memory-loader.ts`
- `pages/api/chat.js`

## Categories

The memory index classifies repository docs into:

- master vision
- checkpoint status
- Apex Copilot behavior
- ArchVis / Humanizacao
- DirectCut / Video
- BIM / 3D / Viewer
- budget / quantity
- contracts / legal / permits
- field / operations
- marketing / website / portfolio
- technical architecture
- historical/superseded docs

## Current Truth Rules

Apex Copilot treats these as current operating direction:

- master vision docs
- checkpoint status docs
- Apex Copilot behavior docs
- active domain docs matching the selected skill
- technical architecture docs when the user asks about implementation or support

Historical, audit, PR-specific, cleanup, recovery, and superseded docs are indexed for provenance only. They are not treated as current truth in chat answers.

## Prompt Strategy

`/api/chat` now selects an Apex Copilot skill/domain, then asks the memory loader for compact context relevant to that domain.

The memory context includes:

- master direction summary
- hard product rules
- selected skill/domain
- count of current docs considered
- count of historical/superseded docs excluded from prompt truth
- up to eight relevant compact doc excerpts

This keeps the prompt compact and avoids sending full markdown files on every request.

## Hard Product Rules

Apex Copilot receives these rules as operating memory:

- No fake intelligence.
- Chat-first experience.
- Construction-specialized answers.
- Viewer and preview behavior must be honest.
- Cards, modules and chips are secondary only.
- English is primary; Portuguese is available by one-click/toggle or user context.

## Indexed Current Examples

Examples of docs that map into current operating memory include:

- `docs/APEX_GLOBAL_AI_MASTER_VISION.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/MASTERPLAN_8_PASSOS_FINALIZACAO_APEX.md`
- `docs/CP2_WELCOME_ANALISES_STATUS.md`
- `docs/CP3_PROJECT_INTAKE_STATUS.md`
- `docs/CP4_APEX_AI_LIVE_CONSTRUCTION_INTELLIGENCE.md`
- `docs/CP4_REBUILD_STUDIO_COPILOT_EXPERIENCE.md`
- `docs/APEX_COPILOT_SKILL_REGISTRY.md`
- `docs/APEX_COPILOT_ENGINE_ROUTER.md`
- `docs/copilot_knowledge/APEX_COPILOT_SYSTEM_CONTEXT.md`
- `docs/ARCHVIS_AI_OPERATING_SYSTEM.md`

## Historical Examples

Historical/superseded examples include:

- PR-specific reports such as `docs/PR*.md`
- audit reports such as `docs/AUDITORIA_*.md`
- cleanup/recovery reports
- old failure diagnoses and controlled-exception records

These docs can help explain history, but Apex Copilot must not use them as the active product direction when newer master/checkpoint documents conflict.

## Domain Routing

The selected Apex Copilot domain controls which memories are most relevant:

- `archvis`, `interior-design`, `visual-design`, `marketing` receive ArchVis/Humanizacao and visual docs.
- `directcut` receives video and DirectCut docs.
- `bim-3d` receives BIM, 3D, IFC, viewer and field coordination docs.
- `budget`, `data-analysis`, `negotiation` receive budget, quantity and finance docs.
- `contracts`, `writing-humanizer`, `negotiation` receive legal, contracts and permits docs.
- `field` receives RDO, jobsite, quality and operations docs.
- `website-design`, `marketing`, `visual-design` receive website, portfolio and brand docs.
- `coding-support`, `tech-support`, `exploration` receive architecture, status and governance docs.

## Limits

This checkpoint does not add database memory, Supabase persistence, Vercel configuration, file storage changes, vector search, embeddings, or external indexing. It is a repository-local markdown memory index for Apex Copilot runtime prompts.
