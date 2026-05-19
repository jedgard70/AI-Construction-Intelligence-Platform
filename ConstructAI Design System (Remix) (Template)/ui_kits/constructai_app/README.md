# ConstructAI App — UI Kit

A high-fidelity recreation of the **Construction Intelligence Platform v5.3** product surface. Lifted directly from `components/LoginClient.js`, `components/DashboardByRole.tsx`, and `components/HelpButton.js` — same tokens, same layouts, same role logic. Inline styles match the production codebase verbatim where possible.

## Click-through

1. `index.html` opens on the **login splash** (dark surface, Sora, amber CTA).
2. Pressing **Entrar →** authenticates instantly (Modo Demonstração) and routes to the **role-adaptive dashboard**.
3. In the topbar there is a **role switcher** (Diretor / Financeiro / Coordenador / Eng. Campo / Qualidade / Investidor). The KPIs, the Curva-S panel, and the Agent-Alerts panel re-key off the role — the actual product logic.
4. The **floating help button** (?) opens the Manual_Assistant_AI chat panel. Sending a message returns a canned demo response.
5. **↩** in the sidebar logs out back to the login splash.

## Components

| File                     | Provides                                                                          |
|--------------------------|-----------------------------------------------------------------------------------|
| `LoginView.jsx`          | Dark two-column login with feature grid + tabbed Entrar / Criar conta form        |
| `SidebarNav.jsx`         | 220 px fixed sidebar, role-aware nav, cross-product links, user box, ROLE_INFO map|
| `DashboardPieces.jsx`    | `KpiGrid`, `CurvaSCard` (inline SVG), `AgentAlerts`, `ProjectsTable`, demo data, `kpisForRole()` helper |
| `HelpButton.jsx`         | FAB + 360 × 480 chat panel with FAQ pills                                         |
| `DashboardView.jsx`      | Composes sidebar + topbar + KPI grid + center row + projects table + Help FAB     |

## What's intentionally cut

- **Real Supabase auth** — login is a no-op `onLogin()` callback.
- **Recharts** — replaced by inline SVG that matches the exact stroke colors, gradients, and `Hoje` reference line of the production AreaChart. Looks identical, no dependency.
- **Modal stack** — `NewProjectModal` exists in the codebase but isn't wired into the demo. Tokens for it (`--radius-2xl`, `--shadow-modal`, `--gradient-modal-veil`) are in `colors_and_type.css`.
- **`/orcamento` and `/juridico`** — full screens are not recreated; the tokens, patterns, and a status-pill catalog from those screens are documented in `preview/` instead.

## Notes for designers using this kit

- Every color is a CSS var from `../../colors_and_type.css` — when copying components out, ship that stylesheet too.
- Emoji are the icon system today. Replace inline emoji with Lucide stroked glyphs in one place (search the `.jsx` files for the emoji you want to swap).
- Number/currency formatting uses `Intl.NumberFormat('pt-BR', …)`. Don't switch locales.
- The role switcher in the topbar is a **demo affordance** and is not in the real app — production reads `profile.role` from the Supabase `profiles` table.
