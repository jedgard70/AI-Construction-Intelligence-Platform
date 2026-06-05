# CP3 Project Intake Status

## Scope

CP3 adds the first functional project intake flow inside Welcome / Analises.

The flow is intentionally local/draft-only. It does not create Supabase schema, migrations, RLS policies, projects, clients, or storage records.

## Current Flow

1. User opens `/dashboard`.
2. Welcome / Analises remains the first post-login screen.
3. User can attach any file or describe the request manually.
4. The intake draft asks:
   - new or existing client;
   - client name;
   - city, state/region, country;
   - desired service.
5. The local Apex intake classifier prepares:
   - provisional project code;
   - file/request classification;
   - initial operational destination;
   - suggested next module route.

## Classification

Initial classifications:

- Project / obra / planta / BIM / CAD
- Client document
- Legal / contract
- Finance / budget
- Marketing / design
- Generic file

## Routing

Initial routing:

- Brazil/default project work -> Producao Brasil
- USA project work -> Producao EUA
- Europe project work -> Producao Europa
- Legal/contract -> Juridico / Contratos
- Finance/budget -> Financeiro / Orcamento
- Marketing/design/video -> Marketing / Design/Web or DirectCut

## Temporary Draft Limitation

The generated project code is provisional and exists only in browser state during CP3.

Permanent persistence is intentionally deferred until a later database-approved checkpoint.

## Guardrails

- No Supabase schema changes.
- No RLS changes.
- No migrations.
- No CP1 rework.
- No Analytics PR #119 changes.
- No Security PR #84 changes.
- No deep OCR.
- No IFC/Revit/DWG parser.

## QA Checklist

- `/dashboard` opens Welcome / Analises first.
- `Anexar documento/projeto` opens file picker with any file type.
- `Iniciar analise` creates or refreshes an intake draft.
- Flow asks new/existing client.
- Flow asks client name.
- Flow asks city/state/country.
- Flow asks service.
- Draft shows provisional code.
- Draft shows classification.
- Draft shows destination module.
- Owner still sees Dashboard Executivo button.
- Non-owner does not see Owner control button.
- Build passes.

## Status

YELLOW until Vercel Preview is READY and Owner QA confirms the flow.
