# Apex Copilot Skill Registry

## Purpose

Apex Copilot is the construction intelligence layer inside Apex Global AI. It must lead the conversation, read the user's uploaded-file metadata and intent, choose the correct domain internally, and answer as a construction-specialized assistant.

The user should not have to choose a department before speaking to the platform. The platform can show supporting actions later, but the primary experience is a chat-first Apex Copilot conversation.

## Source

Requested source skill: `apex-copilot-construction-intelligence`.

No versioned local source file with that exact skill name was found in the platform repository during this integration pass. The registry was therefore implemented from the Owner-approved domain list and the current Apex Copilot product direction.

## Runtime Files

- `lib/apex-copilot/skill-registry.ts`
- `lib/apex-copilot/skill-router.ts`
- `lib/apex-copilot/system-prompt.ts`
- `pages/api/chat.js`
- `components/WelcomeAnalysis.tsx`

## Domains

The registry contains these skill domains:

- `file-intake`
- `archvis`
- `directcut`
- `bim-3d`
- `budget`
- `contracts`
- `field`
- `marketing`
- `interior-design`
- `website-design`
- `data-analysis`
- `coding-support`
- `academic-research`
- `visual-design`
- `negotiation`
- `tech-support`
- `writing-humanizer`
- `exploration`

Each skill defines:

- domain id
- title
- purpose
- trigger terms
- output style
- guardrail

## Routing Behavior

`selectApexCopilotSkill()` analyzes:

- uploaded file name
- MIME type
- extension
- typed user goal
- trigger words and construction-specific patterns

It returns one registry skill. If the input is incomplete or unclear, Apex Copilot falls back to `exploration` and asks focused follow-up questions instead of forcing a fake classification.

## Chat Integration

`/api/chat` now builds every response with:

- the existing server governance prompt
- the selected Apex Copilot skill system prompt
- the selected skill context
- any existing knowledge prompt

The API also returns `apex_skill` metadata so the Studio can show which domain handled the answer without making the user choose it first.

## Studio Behavior

The Apex Copilot Studio uses a white chat-first layout:

- upload is universal through `accept="*/*"`
- file upload immediately triggers Apex Copilot
- the main interface is a live conversation
- preview/output areas support the conversation
- quick actions are small chat chips, not the primary intelligence
- the floating Apex icon focuses the same Studio conversation on `/dashboard`

## Guardrails

- Do not claim deep parsing when only metadata is available.
- Do not fake IFC/RVT/DWG/DXF/SKP viewers or conversions.
- Do not claim generated renders, videos, budgets or legal outputs exist until a real output step runs.
- Do not expose secrets or credentials.
- Do not alter Supabase schema, RLS, migrations or Vercel configuration in this checkpoint.

## Status

This checkpoint integrates the registry and chat routing layer. It does not implement new database persistence, Supabase migrations, Vercel configuration, file conversion pipelines, or 3D model conversion.
