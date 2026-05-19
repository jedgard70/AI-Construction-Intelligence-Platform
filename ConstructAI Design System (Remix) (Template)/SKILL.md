---
name: constructai-design
description: Use this skill to generate well-branded interfaces and assets for ConstructAI / Construction Intelligence Platform v5.3 (operated by Apex Global Ltda), either for production or for throwaway prototypes, mocks, slides, and explorations. Contains design guidelines, color and type tokens, brand voice, asset references, and a React-based UI kit for prototyping role-adaptive construction-intelligence dashboards.
user-invocable: true
---

Read `README.md` in this skill first — it covers the dual-surface brand (dark login splash + light app dashboard), the role-aware design language, the pt-BR voice, and the emoji-as-iconography conventions. Then explore the other files:

- `colors_and_type.css` — every token (CSS vars + semantic styles). Copy this into any artifact you build.
- `assets/logo_apex_nova.jpeg` — the Apex Global mark.
- `preview/` — small design-system cards (colors, type, components) you can lift as reference snippets.
- `ui_kits/constructai_app/` — React (Babel-in-browser) recreation of login + dashboard, with `LoginView.jsx`, `SidebarNav.jsx`, `DashboardPieces.jsx`, `HelpButton.jsx`, `DashboardView.jsx`. Copy components and tokens; don't reuse production logic.

If creating visual artifacts (slides, mocks, throwaway prototypes), **copy assets out** of this skill folder and create self-contained static HTML files using the tokens. The app surface uses `Geist` for body and the login surface uses `Sora` for display; both are on Google Fonts. The "machine voice" register (loaders, version chips, project codes) uses `Geist Mono` at `letter-spacing: 2px`. Use the **earthy semantic palette** (`#3B6D11` success / `#A32D2D` danger / `#BA7517` warning) with `${color}18` soft fills for chips. Default card = `1px #e5e8f0` border, `12px` radius, **no shadow**. Reserve shadows for floating layers (modal, panel, FAB).

If working on production code, you can copy assets and read the rules here to become an expert in designing for the brand — but always cross-check against the original codebase at https://github.com/jedgard70/AI-Construction-Intelligence-Platform when in doubt.

If the user invokes this skill without other guidance, ask what they want to build or design, ask some clarifying questions (what role, what surface — dashboard or login or print, what flow), and act as an expert designer who outputs HTML artifacts or production-ready React code depending on the need. Default to **Portuguese (pt-BR)** for any visible copy; only switch if asked.
