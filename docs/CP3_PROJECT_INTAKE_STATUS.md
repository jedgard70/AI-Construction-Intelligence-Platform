# CP3 Intelligent Intake Router Status

## Source Of Truth

CP3 follows `docs/APEX_GLOBAL_AI_MASTER_VISION.md`.

CP3 is not a form. CP3 is the first visual/intelligent router of the platform.

## Implemented In PR #127

- Clean first screen:
  - `APEX GLOBAL AI`
  - `Welcome`
  - `Anexe seu arquivo ou fale com a Apex AI para iniciar.`
- Three main actions:
  - Anexar documento
  - Falar com Apex AI
  - Iniciar analise
- Large preview area for image/file intake.
- Any file type accepted by the file picker.
- Intention question:
  - `O que você deseja fazer com isso?`
- Local pre-analysis by file type and user intention.
- Intelligent route suggestions.
- Demonstrative live-agent cards.
- Owner dashboard remains separate and owner-only.

## Current Classifications

- Visual / render / planta / marketing image
- BIM / IFC / RVT / DWG / DXF / SKP
- Juridico / contrato / permit / compliance
- Financeiro / nota fiscal / orcamento / invoice
- Marketing / Design / DirectCut
- Obra / campo / RDO / qualidade
- Generic intake when intent is still unclear

## Current Routes

- ArchVis
- BIM / 3D
- Orcamento
- Juridico / Contratos
- Documentos
- Compliance
- CRM Revenue
- Marketing / Design
- DirectCut
- Obras / Campo
- Qualidade

## Demonstrative Agents

- Render Agent
- DirectCut Agent
- Marketing Agent
- BIM Agent
- Clash Agent
- Quantitativo Agent
- Legal Agent
- Compliance Agent
- Signature Agent
- Finance Agent
- Proposal Agent
- Audit Agent
- Field Agent
- Progress Agent
- Cost Agent
- Apex Router
- Document Agent
- Operations Agent

## Guardrails

- No Supabase schema changes.
- No migrations.
- No CP1 changes.
- No CP2 changes.
- No Analytics PR #119 changes.
- No Security PR #84 changes.
- No files outside the official repo.
- No deep OCR.
- No IFC/Revit/DWG parser.
- No real clash detection.
- No real budget generation.
- No real contract generation.

## Temporary Limitation

The CP3 result is a visual/local routing draft only.

It does not persist projects, clients, files, storage records, agent events, or intake state in Supabase.

## QA Checklist

- `/dashboard` opens clean Welcome / Analises first.
- No confusing client/location/service form on first screen.
- File upload opens from `Anexar documento`.
- Image upload shows large preview.
- Non-image upload shows large file placeholder.
- User sees intention question.
- `Identificar caminho` produces visual/technical analysis.
- Routes appear after analysis.
- Live-agent cards appear after analysis.
- IFC/RVT/DWG/DXF/SKP classify as BIM/CAD.
- Contract/legal text classifies as Juridico.
- Finance/invoice text classifies as Financeiro.
- Marketing/video text classifies as Marketing/DirectCut.
- Owner still sees Dashboard Executivo button.
- Non-owner does not see Owner dashboard button.
- Build passes.

## Status

YELLOW until Vercel Preview is READY and Owner QA confirms the corrected CP3 experience.
