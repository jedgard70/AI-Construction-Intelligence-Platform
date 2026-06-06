# CP3 Intelligent Intake Router Status

## Source Of Truth

CP3 follows `docs/APEX_GLOBAL_AI_MASTER_VISION.md`.

CP3 is not a form. CP3 is the first visual/intelligent router of the platform.

## Implemented In PR #127

- Clean first screen:
  - `APEX GLOBAL AI`
  - `Welcome`
  - `Attach a file or talk to Apex AI to begin.`
- EN/PT toggle on the Welcome / Analises surface.
- Three main actions:
  - Attach document / Anexar documento
  - Talk to Apex AI / Falar com Apex AI
  - Start analysis / Iniciar analise
- Large preview area for image/file intake.
- Any file type accepted by the file picker.
- Objective cards:
  - Create render / Criar render
  - Analyze BIM/CAD / Analisar BIM/CAD
  - Estimate cost / Gerar orcamento
  - Review contract / Revisar contrato
  - Build marketing / Criar marketing
  - Route field work / Encaminhar obra
- Intention question:
  - `What do you want to do with this?`
  - `O que voce deseja fazer com isso?`
- Local pre-analysis by file type and user intention.
- Intelligent route suggestions.
- Demonstrative live-agent cards.
- Owner dashboard remains separate and owner-only.
- CP3.1D guided cockpit shell:
  - `/dashboard` no longer shows the left sidebar by default.
  - A top-left hamburger button opens navigation only when clicked.
  - Welcome / Analises uses the full page width.
  - Other platform pages keep the normal sidebar layout.
- CP3.1E approved cockpit layout:
  - Header shows hamburger, `APEX GLOBAL AI`, EN/PT toggle, and user/profile block.
  - Left hero keeps the red vertical accent line, guidance copy, three actions, and three trust/status items.
  - Right panel is a large upload/preview area with file status and waiting status.
  - Objective cards and intent box remain below the hero.
- CP3.1F final reference alignment:
  - `/dashboard` uses near-full viewport width instead of a narrow centered container.
  - Header removes the small subtitle and uses a larger `APEX GLOBAL AI` wordmark.
  - Objective cards use colored icons, larger spacing, and subtle premium shadows.
  - Upload panel is wider and aligned with the hero row.
  - Executive Dashboard appears only as the lower-right Owner action.

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
- `/dashboard` opens without left sidebar visible.
- Hamburger/menu button is visible in the top-left header.
- Clicking the hamburger reveals navigation.
- Header shows `APEX GLOBAL AI`, EN/PT toggle, and user/profile block.
- Header uses the approved large `APEX GLOBAL AI` wordmark without the extra small subtitle.
- No confusing client/location/service form on first screen.
- EN/PT toggle is visible and switches primary labels.
- File upload opens from `Anexar documento`.
- Image upload shows large preview.
- Non-image upload shows large file placeholder.
- Objective cards are visible before analysis.
- Objective cards have colored icons and premium spacing.
- Clicking an objective card fills intention and runs classification.
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
