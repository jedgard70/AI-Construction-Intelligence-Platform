# CP4 Living Agents Workspace Status

## Source Of Truth

CP4 starts from the GREEN CP3 Intelligent Intake Router.

The `/dashboard` cockpit already classifies user intent by file, text goal, and objective card. CP4 adds the first local Living Agents Workspace after the smart recommendation.

## Implemented

- Automatic local Apex AI reaction after upload.
- Uploaded files immediately trigger preview when possible, smart routing, interpretation, and recommended next steps.
- Local deterministic Living Agents Workspace inside `components/WelcomeAnalysis.tsx`.
- No backend calls.
- No Supabase changes.
- No migrations.
- No AI Gateway changes.
- No Vercel config changes.
- Bilingual EN/PT agent cards using the existing cockpit language toggle.
- Agent ordering follows the top Smart Routing recommendation.

## Automatic Intake Reaction

- The file input accepts any file type with `accept="*/*"`.
- Unknown extensions are accepted and do not block upload, Smart Routing, or the Living Agents Workspace.
- Image files (`PNG`, `JPG`, `JPEG`, `WEBP`, `GIF`) show a large preview and receive a visual/architectural interpretation.
- BIM/CAD files (`RVT`, `IFC`, `DWG`, `DXF`, `SKP`) show a premium file placeholder and route to BIM / 3D / Clash, Quantity / Budget, ArchVis, or Field coordination as appropriate.
- PDF, DOC/DOCX, spreadsheet and CSV files show a premium placeholder and classify toward legal/contracts, budget, invoice, report or proposal workflows.
- Unknown files show a generic intelligent placeholder and the guidance:
  - EN: `File received. Apex AI will inspect the filename, extension and your objective to decide the best route.`
  - PT: `Arquivo recebido. A Apex AI irá analisar o nome, a extensão e seu objetivo para decidir o melhor caminho.`
- Unknown files still offer next actions:
  - Ask Apex AI
  - Describe objective
  - Send to technical review
  - Build marketing path
  - Review as document
- `Start analysis` remains available as a manual fallback, but it is not required after upload.
- `Talk to Apex AI` opens the same global floating Apex AI assistant.

## Agents

- ArchVis Render Agent
- BIM / Clash Agent
- Budget / Quantity Agent
- Contract / Legal Agent
- Marketing Agent
- Field Operations Agent
- DirectCut Video Agent

## Agent Card Structure

Each agent card shows:

- agent name
- category
- what it does
- accepted inputs
- expected outputs
- what looks correct
- what needs attention
- primary next action

## Routing Behavior

- ArchVis / Render recommends ArchVis Render Agent first.
- BIM / 3D / Clash recommends BIM / Clash Agent first.
- Quantity / Budget recommends Budget / Quantity Agent first.
- Contract / Legal / Permits recommends Contract / Legal Agent first.
- Marketing / Website / Social recommends Marketing Agent first.
- Field Operations / Jobsite recommends Field Operations Agent first.
- DirectCut / Video / Timelapse recommends DirectCut Video Agent first.

## Current Limitation

CP4 is a local visual/demo workspace only.

It does not execute agents, persist agent events, create projects, write to storage, call backend services, or run model/provider workflows.

## QA Checklist

- Uploading an image shows the image preview and Apex AI interpretation immediately.
- Uploading an RVT file shows BIM/Revit interpretation immediately.
- Uploading an IFC file shows BIM / Clash route automatically.
- Uploading PDF/DOCX/XLSX/CSV classifies into the appropriate document, legal or budget path.
- Uploading any random file extension does not fail.
- Unknown files show file name, size, type/extension and Apex AI guidance.
- Unknown files still suggest next steps.
- User is never left with only a filename.
- User does not need to click `Start analysis` after upload.
- `Start analysis` asks for a file or goal when no input exists.
- `Talk to Apex AI` opens the same floating assistant.
- Selecting `Create render` shows ArchVis Render Agent first.
- Typing `check IFC clashes` shows BIM / Clash Agent first.
- Typing `generate budget` shows Budget / Quantity Agent first.
- Typing `make a construction timelapse` shows DirectCut Video Agent first.
- Agent cards explain what they do and what output the user should expect.
- EN/PT toggle updates agent card labels and content.
- CP3 cockpit layout is preserved.
- Smart Routing remains local and deterministic.
- HEIC/HEIF fallback remains intact.
- Build passes.

## Status

GREEN when PR preview/build passes and Owner QA confirms the Living Agents Workspace behavior.
