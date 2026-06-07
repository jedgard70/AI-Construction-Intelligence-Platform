# CP4 Rebuild - Studio Copilot Experience

## Status

Planning document only.

CP4 must be rebuilt. The current merged implementation from PR #134 is not the accepted final CP4 product direction.

## Decision

The minimum UX baseline for CP4 is the **Studio 3D / Humanizacao** reference.

CP4 must not continue patching the old Welcome cockpit with panels, route cards, or dashboard-like blocks. The rebuild must start clean from the current `main` branch and use the Studio 3D / Humanizacao experience as the minimum product bar.

## Product Truth

Apex Copilot is the primary intelligence.

The experience must feel like a real chat conversation, not like a dashboard analysis panel. Apex Copilot must speak to the user after upload, continue naturally, and guide the construction workflow step by step.

Cards, route grids, department grids, and static local "analysis" blocks are not the intelligence. They may exist only as small supporting chat chips or buttons after Apex Copilot responds.

## Workspace Layout

The CP4 rebuild should use a studio workspace layout:

- **Left:** uploaded file, file settings, context, metadata, and intake controls.
- **Center:** Apex Copilot live analysis and chat conversation.
- **Right:** result, viewer, generated output, preview, or deliverable state.

The uploaded file must remain visible while Apex Copilot speaks.

The user should not have to hunt through cards to understand what happened. The Copilot message is the main answer.

## Required Conversation Behavior

After upload:

1. The file appears visibly in the workspace.
2. Apex Copilot automatically sends a chat message.
3. The message explains:
   - "I received this..."
   - "I understand it as..."
   - "Here are the best construction paths..."
   - "What do you want to do next?"
4. The user can answer naturally.
5. Apex Copilot continues through the chat.

Suggested actions can appear only as compact chat chips/buttons, such as:

- Create render
- Humanize plan
- Review BIM model
- Prepare budget
- Review contract
- Send to field workflow

## Real Preview And Viewer Requirements

The preview/result area must show real visible outputs whenever possible.

- Images and floor plans: show the actual image.
- PDF: show document preview or extracted text when available.
- IFC: must load the actual uploaded IFC in a real web 3D viewer.
- RVT: do not fake a browser viewer. Revit files require conversion to IFC or glTF before preview.
- DWG, DXF, and SKP: do not fake a viewer. These require a converter/viewer strategy before preview.
- Unknown files: accept the file, show metadata, and ask the user what the goal is.

The interface must never claim that a proprietary model is viewable when no converter/viewer is actually present.

## First Implementation Priority

CP4 rebuild should begin with:

1. Image/planta upload and real image preview.
2. Apex Copilot automatic live chat analysis.
3. PDF/document intake with safe preview/extraction or graceful fallback.
4. Visible result/output area.
5. Compact chat chips for next actions.

IFC viewer is required for the BIM checkpoint, but it must be implemented as a real uploaded-file viewer, not placeholder blocks.

## Generated Output Requirement

The right/result area must eventually show generated or derived outputs, such as:

- Humanized plan preview
- Render brief/result
- BIM model viewer
- Contract review summary
- Budget draft
- Field report/RDO draft
- Marketing package preview

If no generated output exists yet, the UI must say what will appear there and what the user must provide next. It must not leave the user with only a filename.

## What Not To Do

- Do not use card grids as the main intelligence.
- Do not present deterministic route copy as if it were AI.
- Do not patch the old cockpit further as the main CP4 path.
- Do not fake IFC, RVT, DWG, DXF, or SKP viewing.
- Do not require the user to pick a department before Apex Copilot speaks.
- Do not mix this rebuild with Supabase, migrations, Vercel config, or AI Gateway setup.

## Implementation Rule

The next CP4 implementation must start clean from latest `main`.

It should use the Studio 3D / Humanizacao reference as the product baseline, then rebuild the workspace around:

- real uploaded-file visibility,
- Apex Copilot live chat,
- real preview/viewer/result area,
- small chat chips for next steps,
- honest conversion strategy for formats that cannot be viewed directly.

## Acceptance Target

- Upload image/planta: image appears, Apex Copilot analyzes automatically, result area is ready for output.
- Upload PDF: document appears or fallback is clear, Apex Copilot continues conversationally.
- Upload IFC: actual uploaded IFC appears in a real 3D viewer.
- Upload RVT: Apex Copilot explains conversion to IFC/glTF is required.
- Upload DWG/DXF/SKP: Apex Copilot explains converter/viewer strategy is required.
- No dashboard card grid as primary response.
- Apex Copilot chat is the center of the product.
