# CP4 Living Agents Workspace Status

## Source Of Truth

CP4 starts from the GREEN CP3 Intelligent Intake Router.

The `/dashboard` cockpit already classifies user intent by file, text goal, and objective card. CP4 adds the first local Living Agents Workspace after the smart recommendation.

## Implemented

- Local deterministic Living Agents Workspace inside `components/WelcomeAnalysis.tsx`.
- No backend calls.
- No Supabase changes.
- No migrations.
- No AI Gateway changes.
- No Vercel config changes.
- Bilingual EN/PT agent cards using the existing cockpit language toggle.
- Agent ordering follows the top Smart Routing recommendation.

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
