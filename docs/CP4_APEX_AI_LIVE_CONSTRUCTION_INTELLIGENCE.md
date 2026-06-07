# CP4 - Apex AI Live Construction Intelligence

## Status

This document replaces the previous CP4 direction based on static local routing, cards, or deterministic "living agents" as the main experience.

CP4 is now defined as **Apex AI Live Construction Intelligence**, led by **Apex Copilot**.

Implementation is now authorized for the controlled CP4 branch `feature/cp4-apex-copilot-real-ai`. This document remains the product truth for that work.

## 1. Product Definition

Apex AI is the platform intelligence layer. The live assistant inside the platform is called **Apex Copilot**.

Apex Copilot is a real construction-specialized AI assistant. It must react live to any uploaded file, image, BIM/CAD model, PDF, spreadsheet, contract, photo, render, invoice, field record, video, archive, or unknown file.

The header and brand can remain **APEX GLOBAL AI**, but the conversational assistant that speaks with the client is **Apex Copilot**.

## 2. UX Rule

The main response after upload is not a card grid, local label, or department selector.

The primary experience is a live conversational assistant message from Apex Copilot. Cards, modules, agents, viewers, or route buttons may appear later as supporting actions, but they are not the primary intelligence.

Apex Copilot must lead the conversation after upload.

## 3. Required Live Behavior

When the user uploads a file, the platform must:

1. Show the file in the preview or viewer area whenever possible.
2. Have Apex Copilot immediately respond in natural language.
3. Explain what was received.
4. Explain what the file appears to be.
5. Recommend the best next paths.
6. Ask the user what they want to do next.

The expected conversation shape is:

- "I received this..."
- "I understand this as..."
- "Here are the best next paths..."
- "What do you want to do next?"

The user can answer naturally, and Apex Copilot continues the workflow.

## 4. Construction Intelligence Scope

Apex Copilot must be specialized for:

- ArchVis and render
- Humanized floor plans
- BIM, Revit, IFC, and CAD
- Clash detection
- Quantities and budget
- Physical-financial schedule
- Contracts and memorials
- Permits, compliance, and endorsements
- Field operations, RDO, teams, materials, and execution
- Marketing, website, social, and video
- Unknown or general construction intake

## 5. Viewer and Converter Requirement

The file intake must not stop at filename display. The long-term platform requires real preview, viewer, extraction, and conversion capability by file family.

- Images: show the real image preview.
- PDF: show document preview and extract text when possible.
- IFC: provide a real interactive web 3D viewer in the intake preview.
- RVT: do not fake browser viewing; explain that Revit conversion to IFC or glTF is required.
- DWG, DXF, and SKP: do not fake browser viewing; define a viewer or conversion strategy before claiming direct preview.
- Unknown files: accept the file, inspect metadata, and ask the user what the goal is.

Unknown files must not break the intake. They must remain part of the conversation.

## 6. AI Requirement

CP4 must not fake intelligence with deterministic copy as the final product.

Apex Copilot must connect to a real AI model, support file and context interpretation, and be construction-specialized through system prompt, tools, routing, and platform context.

The assistant must produce conversational responses. Local routing can support the experience, but it cannot replace the live assistant.

The primary interface is the Apex Copilot chat thread. Suggested routes may appear as small quick-reply chips after the assistant answer, but cards or grids cannot be the main response.

## 7. Future Technical Architecture

The target architecture may include:

- `/api/intake/upload`
- `/api/intake/analyze`
- `/api/apex-ai/chat`
- `/api/viewer/manifest`
- Storage layer
- File extraction layer
- BIM/CAD converter layer
- AI model routing layer
- Project context memory later

These are future technical directions, not approval to implement schema, storage, migrations, or backend changes in this document.

## 8. Checkpoint Split

CP4 should be split into controlled checkpoints:

- **CP4A - Live AI chat reaction for images, PDF, and text**
- **CP4B - Real file preview and viewer foundation**
- **CP4C - IFC viewer**
- **CP4D - RVT/CAD conversion strategy**
- **CP4E - Persistent project workspace**

Each checkpoint must be scoped, auditable, and approved before implementation.

## 9. Hard Rule

Do not fake intelligence with cards.

Do not make the user choose departments first.

Apex Copilot must lead the conversation.

Cards, modules, departments, and agents are secondary actions. The main product is live construction-specialized conversation after upload.
