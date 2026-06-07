# CP4 Living Agents Workspace Status

## Status

SUPERSEDED.

The previous CP4 direction based on local deterministic "Living Agents" cards is no longer the active product direction.

## Decision

CP4 is now **Apex AI Live Construction Intelligence**, led by **Apex Copilot**.

The required product is not a static local routing result, card grid, or fake deterministic intelligence layer.

Apex Copilot must behave as the live conversational construction assistant inside the platform. After upload, it must respond like ChatGPT, specialized for construction, BIM, render, budgets, contracts, permits, field operations, marketing, and project delivery.

## What Remains Useful

The CP3 smart routing work remains useful as support context:

- File type and extension detection.
- Objective card selection.
- Construction route hints.
- Suggested next paths.
- EN/PT cockpit labels.
- Image preview and HEIC fallback.

These are support signals only. They are not the main intelligence.

## What Is Replaced

The following are no longer the primary CP4 experience:

- Static local "Apex AI understood" copy.
- Living Agents cards as the main answer.
- Deterministic fake analysis as final product.
- Department-first selection before the assistant speaks.

## Active CP4 Direction

See:

- `docs/CP4_APEX_AI_LIVE_CONSTRUCTION_INTELLIGENCE.md`

Active CP4 implementation must:

- Keep universal file intake.
- Keep preview when possible.
- Call the existing AI/chat backend for the primary assistant response.
- Send file metadata, user objective, routing context, and construction-specialized prompt.
- Let Apex Copilot speak first.
- Show supporting routes/actions only after the Copilot response.

## Hard Rule

Cards, modules, departments, and agents are secondary actions.

Apex Copilot leads the conversation.
