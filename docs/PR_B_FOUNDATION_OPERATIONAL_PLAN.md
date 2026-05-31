# PR B — Foundation Operational Clean

**Data:** 31 de maio de 2026
**Branch:** `feature/pr-b-foundation-operational-clean`
**Base:** `origin/main`
**Fonte:** `recovery/fix-client-detail-truth-layer/`

---

## Objetivo

Restaurar a camada Foundation operacional da plataforma sem trazer CRM, Revenue, migrations, temporarios ou arquivos suspeitos.

---

## Arquivos incorporados

### Componentes

- `components/AgentWindow.tsx`
- `components/ApexCopilot.tsx`
- `components/layout/ApexShell.tsx`

### Paginas

- `pages/nova-analise.tsx`
- `pages/mission-control.tsx`
- `pages/projeto/[id].tsx`

### Integracoes pontuais do AgentWindow

- `pages/bim-3d.tsx`
- `pages/bim-ops.tsx`
- `pages/plantas.js`

### API

- `pages/api/agent-events/log.ts`

### Ajuste global controlado

- `pages/_app.tsx`

---

## Arquivos ignorados

- `pages/api/crm/*`
- `pages/crm/*`
- `supabase/migrations/*`
- `tmp_*.sql`
- `supabase/.temp/*`
- `ai-construction-intelligence-platform/`
- `pages/api/storage/signed-url.ts`
- `pages/api/sales/pipeline.ts`
- arquivos do Revenue Engine ja presentes em `main`

---

## Dependencias

Dependencias ja existentes em `main`:

- `lib/supabase.ts`
- `components/NewClientModal.js`
- `components/PrintShareModal.tsx`
- `pages/api/chat.js`
- `pages/api/agents/orchestrator.ts`
- `pages/api/actions/execute.ts`

Dependencia nova deste PR:

- `pages/api/agent-events/log.ts`

---

## Ajustes de escopo

O `ApexShell` foi ajustado para apontar apenas para rotas existentes em `main` ou adicionadas neste PR.

Links de CRM que pertencem a PR futuro foram removidos do menu:

- `/crm`
- `/crm/services`
- `/crm/proposals`

---

## Riscos

1. `pages/_app.tsx` ativa `ApexShell` e `ApexCopilot` globalmente em paginas autenticadas/operacionais.
2. `AgentWindow` depende de tabelas e permissoes de `agent_events`.
3. `/nova-analise` cria registros em `projects` e `documents`; a validacao completa exige usuario autenticado e Supabase real.
4. `/api/agent-events/log` exige Bearer token e `SUPABASE_SERVICE_ROLE_KEY` no servidor para gravacao real.
5. `pages/projeto/[id].tsx` passa a ler `documents` e `agent_events`; se RLS bloquear, a pagina deve continuar exibindo erro ou lista vazia conforme retorno.

---

## Validacoes

- `next build --webpack`
- smoke de `/nova-analise`
- smoke de `/mission-control`
- smoke de `/projeto/[id]`
- smoke de `/bim-3d`
- smoke de `/bim-ops`
- smoke de `/plantas`
- `POST /api/agent-events/log` sem token deve retornar `401`

Resultado local:

- `next build --webpack`: aprovado
- `/nova-analise`: `200`
- `/mission-control`: `200`
- `/projeto/00000000-0000-0000-0000-000000000000`: `200`
- `/bim-3d`: `200`
- `/bim-ops`: `200`
- `/plantas`: `200`
- `POST /api/agent-events/log` sem token: `401`

---

## Proximos PRs

- PR C — CRM/Revenue complementos, se ainda houver algo nao presente em `main`
- PR D — Hardening Supabase server-side
- PR E — complementos de Project Workspace e automacoes operacionais
- CLEANUP CHECK somente apos todos os PRs limpos serem incorporados em `main`
