# Auditoria D:\AI-constr — 23/05/2026

## Estrutura Raiz de D:\AI-constr

```
D:\AI-constr\
├── AI-Construction-Intelligence-Platform\   ← projeto Next.js principal (PRODUÇÃO)
├── instrucoes-claude\                        ← arquivos de teste (JPG, PDF, HTML)
└── PLATAFORMA_RELATORIO_v5.3.docx           ← relatório técnico gerado
```

---

## Dentro de AI-Construction-Intelligence-Platform\

### ✅ PASTA ATIVA — Código de Produção (manter)

| Pasta/Arquivo | Descrição |
|---|---|
| `pages/` | 15 módulos .tsx + 26+ rotas API — PRODUÇÃO |
| `components/` | Componentes React compartilhados |
| `lib/` | 10 bibliotecas core de infraestrutura |
| `styles/` | CSS global |
| `public/` | Assets estáticos |
| `database/` | SQL migrations e schema |
| `docs/` | FEATURE_BACKLOG.md, relatórios, templates |
| `.git/` | Repositório Git |
| `.vercel/` | Config Vercel |
| `node_modules/` | Dependências (não commitar) |

**Total de linhas ativas:** 24.020 (pages + components + lib)

---

### ⚠️ SUBPROJETOS ANINHADOS (separar para a raiz de D:\)

Estas são aplicações Next.js/Vite **independentes** que foram colocadas dentro do
projeto principal por engano. Não pertencem aqui.

| Pasta | Tipo | Arquivos | Recomendação |
|---|---|---|---|
| `director-cut/` | Next.js app (`ai-studio-applet`) | 27 | Mover para `D:\director-cut-app\` ou deletar (já integrado em `pages/director-cut.tsx`) |
| `archvis-pro/` | Next.js/Gemini app | 41 | Mover para `D:\archvis-pro-app\` ou deletar (já integrado em `pages/archvis.tsx`) |
| `acip-login/` | Vite app (login antigo) | 11 | Deletar — supersedido por `pages/login.js` |
| `acip-migrations/` | Supabase migrations antigas | 11 | Deletar — supersedido por `database/` |
| `landing-page-AI-Construction/` | HTML standalone (2.2MB) | 21 | Mover para `D:\landing-page\` — não é Next.js |

---

### 📋 ARQUIVOS DE PLANEJAMENTO/ARQUITETURA (arquivar)

JSON de arquitetura e planejamento criados nas sessões de design. Não são código
executável — são documentos de referência.

| Pasta | Arquivos | Conteúdo |
|---|---|---|
| `AGENTES/` | 4 JSON | Agent registry, orchestration design |
| `API/` | 2 JSON | API layer architecture docs |
| `INVESTOR/` | 2 JSON | Investor module + pitch workflow |
| `MODES/` | 4 JSON | System modes (BIM, Executive, Investor) |
| `MODULES/` | ~9 JSON | Module definitions (Automation, Engineering, Executive) |
| `PROMPTS/` | 1 JSON | Prompt registry design |
| `VISUAL/` | 17 JSON | Visual system, colors, neon demarcation |
| `agents/` | 10 JSON | Active agent registry + telemetry |
| `core/` | 15 JSON | CORE_SYSTEM v5.2, v5.3, governance, orchestration |

**Recomendação:** Mover tudo para `docs/architecture/` ou uma pasta `_design-docs/` na raiz do projeto.

---

### 🎨 DESIGN REFERENCES (manter para referência)

| Pasta | Arquivos | Conteúdo |
|---|---|---|
| `ConstructAI Design System (Remix) (Template)/` | 35 | Design system completo com SKILL.md |
| `frontend/` | 5 | Interface definitions, components, hooks |

---

### 📄 PAGES/ — Arquivos JS Ativos (não são duplicatas)

| Arquivo | Status |
|---|---|
| `pages/index.js` | ✅ Ativo — router/redirect principal |
| `pages/login.js` | ✅ Ativo — autenticação Supabase |
| `pages/jornada.js` | ✅ Ativo — módulo de jornada (Task #28) |
| `pages/plantas.js` | ✅ Ativo — análise de plantas |
| `pages/juridico/` | ✅ Ativo — 4 subpáginas do módulo jurídico |
| `pages/projeto/[id].tsx` | ✅ Ativo — detalhe de projeto dinâmico |
| `pages/cliente/[id].tsx` | ✅ Ativo — detalhe de cliente dinâmico |
| `pages/contratos/novo.js` | ✅ Ativo — criação de contrato |

**Nenhuma duplicata .js + .tsx encontrada nas páginas principais.**

---

### 🗑️ CANDIDATOS A REMOÇÃO

| Item | Motivo |
|---|---|
| `director-cut/` | App aninhado — já integrado em pages/director-cut.tsx |
| `archvis-pro/` | App aninhado — já integrado em pages/archvis.tsx |
| `acip-login/` | Login antigo (Vite) — substituído |
| `acip-migrations/` | Migrations antigas — substituídas |
| `.sixth/` | Pasta vazia |
| `core/CORE_SYSTEM.json` | Versão antiga (v5_2 e v5_3 existem) |
| `core/CORE_SYSTEM_v5_2.json` | Versão anterior ao v5_3 |

---

## Resumo Executivo

- **D:\AI-constr** tem 1 projeto principal + pasta de testes
- **Dentro do projeto:** 2 sub-apps aninhados, 1 landing page, ~70 JSONs de arquitetura
- **Zero duplicatas** de módulos .tsx (cada módulo existe uma única vez)
- **Ação imediata recomendada:** remover as 4 pastas aninhadas (director-cut, archvis-pro, acip-login, acip-migrations) — ~90 arquivos que não são usados pelo build do Next.js
- **Ação secundária:** mover os JSONs de arquitetura para `docs/architecture/`

