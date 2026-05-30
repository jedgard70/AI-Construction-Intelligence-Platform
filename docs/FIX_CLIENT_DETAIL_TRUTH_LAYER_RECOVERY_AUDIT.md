# Fix Client Detail Truth Layer — Recovery Audit

**Data:** 30 de maio de 2026
**Workspace oficial:** `D:\AI-constr\AI-Construction-Intelligence-Platform`
**Branch auditada:** `fix/client-detail-truth-layer`
**Objetivo:** preservar o trabalho local e desmontar em PRs limpos, sem merge direto desta branch.

---

## 1. Preservacao realizada

Pasta criada:

`recovery/fix-client-detail-truth-layer/`

Arquivos gerados:

- `status.txt` — snapshot do `git status --short`
- `tracked.diff` — diff dos arquivos rastreados
- `untracked-files.txt` — lista completa dos arquivos nao rastreados
- `untracked-useful-files-selected.txt` — lista filtrada dos candidatos uteis
- `untracked-useful-files.zip` — archive dos candidatos uteis nao rastreados

Quantidade preservada no zip:

- 72 arquivos candidatos uteis

Itens excluidos do zip por regra:

- `supabase/.temp/`
- `tmp_*.sql`
- `ai-construction-intelligence-platform/`
- `node_modules/`
- `.next/`
- arquivos de cache

---

## 2. Estado da branch

Branch atual:

`fix/client-detail-truth-layer`

Situacao contra `origin/main`:

- `0` commits a frente
- `3` commits atras
- a branch em si nao contem commits novos pendentes
- o risco esta nas alteracoes locais nao commitadas

Build do estado local:

- `next build --webpack` passou
- rotas novas apareceram no build: `/nova-analise`, `/mission-control`, `/crm/*`, `/api/crm/*`, `/api/agent-events/log`, `/api/storage/signed-url`

---

## 3. Classificacao dos arquivos

### A. Preservar e reaproveitar

Arquivos e grupos com alto valor funcional:

- `components/AgentWindow.tsx`
- `components/ApexCopilot.tsx`
- `components/layout/ApexShell.tsx`
- `components/dashboard/UxRoleDashboard.tsx`
- `pages/nova-analise.tsx`
- `pages/mission-control.tsx`
- `pages/api/agent-events/log.ts`
- `pages/api/storage/signed-url.ts`
- `pages/projeto/[id].tsx` com abas de workspace do projeto
- integracoes `AgentWindow` em:
  - `pages/bim-3d.tsx`
  - `pages/bim-ops.tsx`
  - `pages/plantas.js`
- CRM core em:
  - `pages/api/crm/`
  - `pages/crm/`
- migrations oficiais em:
  - `supabase/migrations/20260529010101_prepare_project_files_storage.sql`
  - `supabase/migrations/20260529010201_master002_s1_crm_core.sql`
  - `supabase/migrations/20260530010101_master002_s2_services_catalog.sql`
  - `supabase/migrations/20260530010201_master002_s3_proposal_engine.sql`
  - `supabase/migrations/20260530010301_master002_s4_contract_engine.sql`
  - `supabase/migrations/20260530010401_master002_s5_revenue_engine.sql`
- documentos Master Package em `docs/PACOTE_MASTER_*.md`
- espelho documental `Master.Package.Apex.original/`

### B. Revisar antes de reaproveitar

Itens uteis, mas que exigem revisao antes de qualquer PR:

- `docs/PACOTE_MASTER_002_INDEX.md`
- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/ROADMAP_OFICIAL.md`

Motivo: esses documentos ja existem em `origin/main` apos o merge do PR #32. Devem ser comparados e integrados manualmente para evitar sobrescrita.

- `docs/CODEX_POLICY.md`

Motivo: contem regras novas de workspace unico, nao duplicacao e espelho documental. Conteudo util, mas deve ser revisado com a governanca ja existente.

- `pages/dashboard.tsx`

Motivo: troca o dashboard atual para `UxRoleDashboard` e carrega tabelas CRM novas. Deve entrar apenas junto com a foundation/UX correta.

- `pages/_app.tsx`

Motivo: injeta `ApexShell` e `ApexCopilot` globalmente. E funcional, mas altera a experiencia de todas as paginas.

- `lib/supabase-store.ts`
- `pages/api/autonomous/status.ts`
- `pages/api/autonomous/task.ts`
- `pages/api/chat.js`
- `pages/api/projects/create.js`

Motivo: endurecem uso server-side para exigir `SUPABASE_SERVICE_ROLE_KEY`. Correto do ponto de vista de seguranca, mas pode quebrar ambientes que ainda dependem de fallback.

### C. Ignorar/descartar

Itens que nao devem entrar em PR sem justificativa nova:

- `supabase/.temp/`
- `tmp_s2_apply.sql`
- `tmp_s3_rls.sql`
- `tmp_storage_schema.sql`
- arquivos de cache
- qualquer `node_modules/`
- qualquer `.next/`

### D. Risco alto

Itens que exigem cuidado especial:

- `pages/api/sales/pipeline.ts` deletado localmente

Risco: a delecao remove uma API existente. A rota ainda apareceu no build por outro arquivo/estado, mas a remocao nao deve entrar sem decisao explicita.

- `ai-construction-intelligence-platform/`

Risco: parece uma pasta aninhada/copia paralela dentro do repo. Foi excluida do zip e deve passar por auditoria separada antes de qualquer reaproveitamento.

- documentos duplicados que ja existem em `main`

Risco: `docs/PACOTE_MASTER_002_INDEX.md`, `docs/PACOTE_MASTER_STATUS_GERAL.md` e `docs/ROADMAP_OFICIAL.md` podem sobrescrever o estado oficial do PR #32 se forem aplicados sem merge manual.

- `supabase/migrations/20260530010401_master002_s5_revenue_engine.sql`

Risco: pode duplicar ou conflitar conceitualmente com `database/011_revenue_engine.sql` ja mergeado no PR #32. Precisa comparacao antes de aplicar.

---

## 4. Plano de desmontagem em PRs limpos

### PR A — Governanca/documentacao

Escopo:

- documentos Master Package ainda nao presentes em `main`
- ajustes em `docs/CODEX_POLICY.md`
- espelho `Master.Package.Apex.original/`

Regra:

- comparar manualmente docs duplicados contra `origin/main`
- nao sobrescrever status oficial do S5 ja mergeado

### PR B — Foundation operacional

Escopo:

- `components/AgentWindow.tsx`
- `components/ApexCopilot.tsx`
- `components/layout/ApexShell.tsx`
- `pages/nova-analise.tsx`
- `pages/mission-control.tsx`
- `pages/api/agent-events/log.ts`
- `pages/api/storage/signed-url.ts`

Validacoes:

- build
- smoke de `/nova-analise`
- smoke de `/mission-control`
- smoke de `/api/agent-events/log`

### PR C — CRM/Revenue complementos

Escopo:

- `pages/api/crm/`
- `pages/crm/`
- migrations S1-S4 e complementos que nao estejam em `main`

Regra:

- comparar com o Revenue Engine ja mergeado
- evitar duplicar tabelas ou rotas
- tratar `20260530010401_master002_s5_revenue_engine.sql` com cuidado, por possivel overlap com `database/011_revenue_engine.sql`

### PR D — Hardening Supabase server-side

Escopo:

- `lib/supabase-store.ts`
- `pages/api/autonomous/status.ts`
- `pages/api/autonomous/task.ts`
- `pages/api/chat.js`
- `pages/api/projects/create.js`

Objetivo:

- remover fallback para anon/publishable em rotas server-side sensiveis
- exigir `SUPABASE_SERVICE_ROLE_KEY` onde for necessario

Risco:

- pode alterar comportamento em ambientes sem service role configurada

### PR E — Project Workspace + AgentWindow BIM/Plantas

Escopo:

- `pages/projeto/[id].tsx`
- `pages/bim-3d.tsx`
- `pages/bim-ops.tsx`
- `pages/plantas.js`

Objetivo:

- workspace do projeto com abas
- eventos/documentos por projeto
- AgentWindow nos modulos BIM e Plantas

Validacoes:

- pagina `/projeto/[id]`
- `/bim-3d`
- `/bim-ops`
- `/plantas`
- persistencia de `agent_events`, se aplicavel

---

## 5. Recomendacao

Nao abrir PR da branch `fix/client-detail-truth-layer`.

Proximo passo recomendado:

1. Criar branch limpa baseada em `origin/main`.
2. Aplicar apenas o PR A a partir dos arquivos preservados.
3. Validar build e diff.
4. Repetir por PR, sempre com escopo pequeno.

O trabalho esta preservado em patch, lista e zip. Nenhum arquivo original foi apagado, movido, resetado ou sobrescrito.

---

## 6. CLEANUP CHECK pos-recuperacao

Apos concluir a recuperacao dos PRs limpos, executar obrigatoriamente um `CLEANUP CHECK`.

Objetivo:

- eliminar arquivos temporarios, pastas suspeitas, branches contaminadas e artefatos de recovery que nao forem mais necessarios;
- executar a limpeza somente apos confirmacao de que tudo util foi incorporado em `main`;
- nao apagar nada automaticamente;
- sempre pedir aprovacao explicita antes de excluir qualquer item.

Itens candidatos a revisao:

- `tmp_*.sql`
- `supabase/.temp/`
- `ai-construction-intelligence-platform/`
- branches contaminadas antigas
- patches/bundles temporarios ja aplicados
- recovery obsoleto

Regra operacional:

1. preservar primeiro
2. recuperar depois
3. limpar por ultimo
