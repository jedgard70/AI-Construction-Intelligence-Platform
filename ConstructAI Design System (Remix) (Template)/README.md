# ConstructAI Design System

> Foundations, components, and brand voice for **Construction Intelligence Platform v5.3** — the AI-native operating system for Brazilian civil-construction portfolios, operated by **Apex Global Ltda** under the technical responsibility of Eng. José Edgard de Oliveira (CREA 5071162007).

The product is internally branded **ConstructAI** in-app and **Construction Intelligence Platform** on the marketing surface; the legal/operating entity is **Apex Global Ltda** (CNPJ 45.239.918/0001-26, Promissão / SP). The design system has to serve all three: a technical SaaS dashboard, an enterprise login splash, and printable legal artifacts (contracts, memorials).

---

## What this system covers

ConstructAI is a single Next.js app (Pages Router, Supabase, Recharts, Tailwind + shadcn/ui scaffold) with **role-adaptive** surfaces:

| Surface              | Audience                                | Visual mode                       |
|----------------------|-----------------------------------------|-----------------------------------|
| `/login`             | Authorized engineering teams            | **Dark**, near-black + amber gold |
| `/dashboard` (×6 roles) | Diretor · Financeiro · Coordenador · Eng. Campo · Qualidade · Investidor | **Light** app, blue + earthy semantic palette |
| `/orcamento`         | Financeiro, Diretor                     | Light app — heavy chart density   |
| `/juridico`          | Eng. responsible, admin                 | Light app + monospace print blocks |
| Help / Manual_Assistant_AI | All users                         | Floating blue panel, fixed FAB    |

Eight cognitive agents power the back end: **BIM Coordinator, Construction Planner, Cost Controller, Risk Analysis, Safety Monitor, Investment Analyst, Quality Control, Doc Intelligence**.

Two satellite apps share the brand and are linked from the sidebar but live in separate Vercel deployments — **ArchVis Pro** (image generation, accented in `--success`) and **Director Cut** (video, accented in `--purple`).

---

## Sources used to build this system

- **Codebase** (mounted locally): `AI-Construction-Intelligence-Platform/` — Next.js 16, React 18, Tailwind 3 with `shadcn-ui` + `@base-ui/react`, Recharts, Supabase, `lucide-react`.
- **GitHub**: <https://github.com/jedgard70/AI-Construction-Intelligence-Platform> — public repo, default branch `main`. Three related private repos exist on the same account (`Arch-Vis-Pro`, `ArchVis-Pro`, `Directorcut`) and are linked from the in-app sidebar.
- **Brand asset**: `public/logo_apex_nova.jpeg` — Apex Global mark (blue rooftop chevron + red diagonal slash on navy field).
- **Embedded copy & business data**: pulled directly from `components/LoginClient.js`, `components/DashboardByRole.tsx`, `components/OrcamentoClient.tsx`, `components/JuridicoClient.tsx`, `components/HelpButton.js`, `components/NewProjectModal.js`.

If you have access, **read the repo above** — there's a lot of role-specific copy and KPI logic that did not get lifted verbatim into this system.

---

## Index of files

```
.
├── README.md                ← you are here
├── SKILL.md                 ← agent-skill manifest (download to use in Claude Code)
├── colors_and_type.css      ← all design tokens (CSS vars + semantic styles)
├── assets/
│   └── logo_apex_nova.jpeg  ← brand mark
├── preview/                 ← design-system cards (auto-shown in Design System tab)
└── ui_kits/
    └── constructai_app/     ← React recreations of the dashboard, login, etc.
```

---

## CONTENT FUNDAMENTALS

### Language

**Portuguese (pt-BR), always.** Every visible string ships in pt-BR — there is no localization layer. English appears only as **engineering acronyms** (BIM, EVM, CPI, SPI, EAC, VAC, TCPI, NOI, TIR, ESG, ROI) and as the **agent class names** (`Cost_Controller_AI`, `Construction_Planner_AI`). Mixing is intentional and reads as "Brazilian construction engineer who lives inside Primavera/Procore."

### Tone

Direct, didactic, slightly authoritative. The product talks to professionals — Diretor Executivo, Engenheiro de Campo, Gestor de Qualidade — who already speak fluent NR-18 and Art. 618. It does not over-explain.

The Manual_Assistant_AI system prompt instructs the chatbot to be _"direto, amigável e didático"_ and to **always close with**: _"Posso ajudar com mais alguma dúvida sobre a plataforma?"_

### Address & casing

- **Você**, not _tu_. Tutorials use imperative: _"Clique para enviar RG…"_, _"Tire sua dúvida sobre a plataforma…"_
- **Sentence-cased** UI labels. Not Title Cased. _"Novo projeto"_, _"Atualizar"_, _"Conta para recebimento"_.
- **UPPERCASE eyebrows** at `var(--tracking-wider)` for section labels, KPI captions, and field labels — e.g. _"PRINCIPAL"_, _"PERGUNTAS FREQUENTES"_, _"NOME COMPLETO"_, _"CONTRATANTE"_. These act as taxonomic markers, never as shouting.
- **Monospace + spaced caps** is the system's "machine voice": loaders read `CARREGANDO...` and `CARREGANDO DASHBOARD...` in amber at `letter-spacing: 2px`. The version tag reads `v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE` in the same mono register.

### Numbers, money, dates

- BRL formatting uses `Intl.NumberFormat('pt-BR', …, notation:'compact')` for KPIs: **R$ 12,4 mi**. Full form appears in tooltips.
- Decimals use comma: _"4,2%"_, _"22,1%"_, _"CPI 0,81"_.
- KPI deltas append a meta in plain language: _"Meta ≥70"_, _"Meta ≤7 dias"_, _"WACC+5%: 14,2% ✓"_.
- Dates use long pt-BR: _"sábado, 18 de maio de 2026"_.

### Specific examples (lift these verbatim when prototyping)

- **Hero headline (login)**: _"IA Especializada em Construção Civil"_ (two lines, `<br/>` after _"em"_).
- **Hero subhead**: _"8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real."_
- **Feature row labels**: _"BIM Intelligence"_, _"EVM Analytics"_, _"Conformidade NR"_, _"Multi-Agent AI"_.
- **Footnote / trust line**: _"Sessão criptografada · LGPD compliant"_.
- **Alert priorities (always lowercase noun)**: `critico`, `alto`, `medio`. Rendered UPPERCASE in chips.
- **Project status (lowercase keys → Title Case label)**: `em_andamento → Em andamento`, `atrasado → Atrasado`, `planejamento → Planejamento`, `pausado → Pausado`, `concluido → Concluído`, `cancelado → Cancelado`.
- **Agent alert (medium priority)**: _"Memorial Torre B: 3 inconsistências de armadura identificadas (págs 47, 89, 112)."_ — Specific page numbers. Specific document. No hedging.
- **Agent alert (critical)**: _"Torre B: aço A572 +22% acima do SINAPI. Substituto sugerido: HEA."_

### Emoji

**Used heavily as inline glyph icons**, never decoratively. They function as visual taxonomy:
- 🏗 for the brand mark itself, construction, projects.
- 👑 💲 📅 🦺 🔍 📈 — one emoji per **role** (Diretor / Financeiro / Coordenador / Eng. Campo / Qualidade / Investidor).
- 📊 📈 💰 🏢 🛡 🤖 🌱 — KPI prefixes.
- 🔴 🟡 ⚠ ✓ ✅ ↑ ↓ — status indicators (used as a sub-system to color).
- 📎 🔒 📧 🙈 👁 🔄 — UI affordances.
- 📋 🔍 📐 🔨 — contract type icons in Jurídico.

A future iconography pass (Lucide is already installed) should replace these with stroked glyphs, but **today emoji is canonical**. See `ICONOGRAPHY` below.

### Voice — what to avoid

- No casual exclamations ("Awesome!", "Great!"), no AI-isms ("Let me help you with that").
- No marketing fluff in-app — copy is operational. The marketing register lives **only** on `/login`.
- Never localize the acronyms (don't say "ICP" for CPI).

---

## VISUAL FOUNDATIONS

### The two surfaces

ConstructAI runs **two parallel visual identities** that share tokens but not aesthetics:

**1. Marketing / Login (dark)** — `#0a0d12` background with a 160° linear gradient through `#111520 → #0f1a2e`, **Sora** as the type family, **amber `#f0a500`** as the action color. Hairline 1 px borders in `#1e2535`. Generous breathing room (`padding: 64px` on the left panel). One thin amber accent line behind the version tag.

**2. App (light)** — `#f4f5f7` page, white cards (`#ffffff`) with **1 px `#e5e8f0` borders and no shadow**. **Geist** as the type family. Density-first: 12 px page padding, 14 px card padding, 11–13 px copy. **Blue `#185FA5`** is the primary action; an **earthy semantic palette** (oxide green / oxide red / ochre / desaturated purple) carries status.

### Color system

- **Brand blue `#185FA5`** is the workhorse: primary buttons, links, nav active state, Curva-S "Previsto" stroke, every CTA in the app. Hover deepens to `#0C447C`. Active rows tint to `#EFF4FF`.
- **Amber `#f0a500`** is reserved — it is the **login CTA** and the **system-mono voice** (loaders, version chips, `Hoje` reference line on charts). It never appears as an app primary action.
- **Earthy semantic palette** — these are slightly **desaturated, brick/oxide-toned** (not Material Design saturation). Success is moss `#3B6D11`, danger is brick `#A32D2D`, warning is ochre `#BA7517`, info is the brand blue. Each has a `~12 %` soft fill for chips/cards: `#EAF3DE`, `#FCEBEB`, `#FAEEDA`, `#EFF4FF`.
- **Role accents** — six distinct hues (purple/green/blue/ochre/red/brown) tag user roles in avatars and side accents. They are pulled from the semantic palette, not arbitrary.
- **Logo red `#A32D2D`** doubles as the semantic danger. The logo's navy `#1a2a4a` is **darker** than the login background `#0a0d12` (the logo sits on a true navy field; the login is near-black). Don't confuse them.

### Typography

- **Geist** (300/400/500/600/700) — app body. Tight, geometric, neutral. Numerals are tabular-ish and look correct in dense tables.
- **Sora** (300/400/500/600/700) — login and any "marketing" or hero context. Slightly more expressive than Geist; sets the brand's tone of voice.
- **Geist Mono** — anywhere the system "speaks": `CARREGANDO...`, version chips, project codes (`OBR-2026-001`), contract preview blocks (`whiteSpace: 'pre-wrap'; fontFamily: 'monospace'`), the dashed signature rules in Jurídico.

The app's scale is **deliberately small**: 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 22 px, with KPI numerals at 22 px / 600. Headings rarely exceed 16 px in the app surface; 26–36 px is reserved for login. Lock to the scale in `colors_and_type.css`.

### Spacing & density

4 px base unit. Cards use `padding: 14–16 px`. KPI cards are a 4-column equal grid with `gap: 12 px`. The Curva-S + Alerts row is **`1.6fr 1fr`**, not 1:1 — the chart deserves more room. Tables zebra-stripe `#fff` / `#fafbfd`, hover row goes to `#EFF4FF`.

### Backgrounds

No imagery. No textures. No noise. The marketing surface is **pure gradient on near-black**; the app surface is **flat gray with white cards**. The only photographic asset in the entire repo is `logo_apex_nova.jpeg` — and even that is shown inside an 80×52 rounded rect, not full-bleed.

### Borders, radii, shadows

- **Hairline borders** are the foundation: `1 px solid var(--app-border)` on every card, input, modal, table cell separator. The dark surface uses `1 px solid var(--dark-border)` to the same effect.
- **Radii** are quiet and consistent: **8 px** for inputs/buttons (`--radius-md`), **12 px** for cards (`--radius-xl`), **16 px** for the modal and help panel, **20 px** for status pills, full-round for avatars.
- **Shadows are reserved** for floating layers only — modals (`0 16px 48px rgba(0,0,0,0.20)`), help panel (`0 8px 40px rgba(0,0,0,0.18)`), the help-button FAB (`0 4px 16px rgba(24,95,165,0.40)`, a **colored** shadow that ties the FAB to the brand). Cards never have shadow. Inputs never have shadow.

### Hover, press, focus states

- **Hover (nav row / chip)** — background flips from transparent to `--brand-blue-tint` (`#EFF4FF`); text from `--fg-3` (`#5a6282`) to `--brand-blue`.
- **Hover (table row)** — background to `--brand-blue-tint`.
- **Hover (primary button)** — Tailwind/shadcn pattern: `hover:bg-primary/80` (80 % opacity drop). For raw hex, deepen to `--brand-blue-deep`.
- **Press / active** — shadcn buttons translate `1 px` down (`active:translate-y-px`); no scale, no shadow.
- **Focus (dark surface)** — `border-color: var(--brand-amber); box-shadow: var(--shadow-cta);` (a 3 px amber halo at 12 % alpha).
- **Focus (light surface)** — the shadcn ring (`focus-visible:ring-3 focus-visible:ring-ring/50`) translates to a 3 px blue halo at 18 %; use `--shadow-focus`.
- **Disabled** — `opacity: 0.5` and `cursor: not-allowed`. Inputs gain `--app-surface-4` (`#f0f2f7`) as a "locked" fill, distinct from default `--app-surface-2` (`#f8f9fc`).

### Animation

Almost none. Transitions are utilitarian, 100–200 ms easing, and almost always on `color`/`background-color`/`border-color` — never on size, position, or shadow. There is no bouncing, no spring physics, no parallax, no entrance choreography. The system feels like a control panel because it _is_ one.

The two motion exceptions are (a) the help panel toggling open with a soft fade and (b) the New Project modal veil at `rgba(0,0,0,0.45)`. Both feel instant, not animated.

### Transparency & blur

- Two transparency families are used routinely:
  - **Semantic tints**: `${color}08` (3 % background) and `${color}33` (20 % border) for alert cards.
  - **Brand-on-brand**: `rgba(240,165,0,0.07)` and `rgba(240,165,0,0.20)` for the "Modo Demonstração" callout on login.
- **No backdrop-blur**. Modals use a flat `rgba(0,0,0,0.45)` veil. There is no glassmorphism.

### Charts (Recharts)

Always **AreaChart** for time series (Curva-S). Each series gets its own `linearGradient` with `stopOpacity` 0.12 → 0 from top to bottom. The three canonical stops:
- **Previsto (PV)** — `#185FA5`, solid 2 px stroke.
- **Agregado (EV)** — `#3B6D11`, solid 2.5 px stroke (slightly heavier to denote the "earned" line).
- **Realizado (AC)** — `#A32D2D`, **dashed `5 3`** stroke. The dash is intentional: it visually marks "actual" as a more variable signal.

A vertical `ReferenceLine` at the current period in **ochre `#BA7517`** with label `Hoje` (dashed `4 2`) anchors the user. Axis ticks are 9–10 px in `--fg-4`. Tooltips: 11–12 px, 1 px border, 8 px radius. Grid: `strokeDasharray: 3 3`, stroke `#f0f2f7`.

### Layout rules

- Sidebar is **220 px fixed-width**, white, with a 1 px right border. It does not collapse. The role/user box pins to the bottom inside `border-top: 1px solid #e5e8f0`.
- Topbar is **48–56 px**, white, sticky (`position: sticky; top: 0; z-index: 10`), with `border-bottom: 1px solid #e5e8f0`.
- Main content scrolls inside `overflow-y: auto` with a **4 px scrollbar** (`::-webkit-scrollbar { width: 4px }`) themed in `#d0d5e0`.
- KPI grids are always **`repeat(N, minmax(0, 1fr))` with `gap: 10–12 px`**; never use `auto-fit`.
- Modal max-width 560 px, max-height `90vh`, centered.

### Card recipe

```css
background: #fff;
border: 1px solid #e5e8f0;
border-radius: 12px;
padding: 14px 16px;     /* or 16px 20px for "section" cards */
/* no box-shadow */
```

That's the entire card system. Layer alert-state by tinting the border (`${semantic}33`) and the background (`${semantic}08`). The optional pseudo-illegal but-common variant adds a 3 px left border (`borderLeft: '3px solid #185FA5'`) for a "preview" or "warn note" block — see Jurídico.

### Status chips / pills

```css
font-size: 10–11px;
font-weight: 600;
padding: 3px 9px;
border-radius: 20px;
background: ${color}18;   /* ~9 % alpha */
color: ${color};
text-transform: uppercase;     /* for priority */
letter-spacing: 0.06em;        /* for priority */
```

For project status, casing is `Title Case` and there's no uppercase rule. For agent alert priority, casing IS uppercase + tracked. Both share the radius.

---

## ICONOGRAPHY

**Today: emoji as a glyph system.** Tomorrow (planned): `lucide-react` (already in `package.json` at `^1.16.0`).

### What's actually in the codebase

| Surface              | Icon system used                          |
|----------------------|-------------------------------------------|
| Logo                 | One raster: `logo_apex_nova.jpeg` (1024 × 1024 JPEG, navy field, blue chevron + red diagonal). |
| All UI affordances   | Inline emoji (`🏗 📊 📈 💰 🛡 🤖 ⚠ ✅ 🔴 🦺 👑 …`) |
| Database schema      | `database/supabase-schema-nzjmsehppnsyihwcmmgd.svg` — internal documentation only, not a UI asset. |
| Loaders, version     | Mono text glyphs (no spinner): `CARREGANDO...`, `v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE`. |
| Arrows in copy       | Unicode: `→ ← ↑ ↓ ↩` |
| Bullets in lists     | Unicode: `▪` and `·` |

### Rules

1. **Emoji are typographic, not decorative.** They sit inline at body size (12–22 px), single-glyph, never colored, never inside a colored circle (except role avatars).
2. **One emoji per concept.** 🏗 = construction / project. 🤖 = agent / AI. ⚠ = warning. 🔴 = open NCI. Don't substitute.
3. **Unicode shapes** (`▪ · → ↑ ↓ ✓`) are preferred for navigation and motion arrows because they inherit current color and weight.
4. **Logo usage** — the Apex Global mark appears (a) on the login left panel in an **44 × 44 amber rounded-rect** with `🏗` overlaid (not the real logo — a stand-in), (b) in the Jurídico module on contract printouts at `height: 52` in actual JPEG form, and (c) in the dashboard sidebar as a **32 × 32 blue rounded square** with `🏗`. The mark is rarely shown at its full design; it's shorthanded with the construction emoji on a brand-colored chip almost everywhere.

### Substitution flag

> ⚠ The codebase ships **no SVG icon set and no icon font** beyond `lucide-react`'s npm presence (which is imported nowhere). The next iteration should adopt Lucide at 1.5 px stroke, 16 px / 20 px sizes, and replace every inline emoji with the appropriate stroked glyph. Until then, **emoji is canonical** and any mock built off this system should use the exact emoji documented above to read as "ConstructAI."

### Asks for the user

- A vector version of the Apex Global logo (the JPEG is a raster on a JPEG-compressed navy field; an `.svg` with transparent ground would let us use the mark on light surfaces).
- Confirmation on the Lucide-vs-emoji direction.
- Updated webfonts if Geist / Sora aren't the licensed faces (today they're loaded from Google Fonts and likely fine).

---

## UI kits

| Kit                          | Path                                  | What's inside                                      |
|------------------------------|---------------------------------------|----------------------------------------------------|
| ConstructAI App              | `ui_kits/constructai_app/`            | Login, role-adaptive Dashboard, KPI grid, Curva-S chart, Projects table, Agent Alerts, Help FAB. Interactive click-through. |

See each kit's own `README.md` for the component inventory.

---

## What might be wrong, what's missing

- **Fonts substituted from Google Fonts.** The codebase loads Geist + Sora from `fonts.googleapis.com`. If Apex Global has licensed `.ttf` / `.woff2` files, drop them in `fonts/` and update `colors_and_type.css`.
- **No real icon system.** Documented as `emoji + lucide-react (planned)`. Flagged above.
- **No marketing-website mocks.** The codebase is the product itself; there is no separate marketing site. Login _is_ the marketing surface.
- **No mobile mockups.** The login has a `@media(max-width:768px)` rule that hides the left panel, but everything else is desktop-only by design.
- **The "ConstructAI" wordmark is text, not a graphic.** It's typeset in Geist 600 in the sidebar — no rendered logo for this name exists.

---
