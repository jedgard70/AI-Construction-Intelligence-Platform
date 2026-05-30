# Recuperacao Limpa — Pacote Master 002-S5

**Data:** 30 de maio de 2026
**Branch limpa:** `feature/002-s5-revenue-engine-clean`
**Base:** `origin/main`
**Branch descartada:** `claude/api-key-env-priority-Wwjia`

---

## Regra de Recuperacao

A branch `claude/api-key-env-priority-Wwjia` nao foi mesclada e nao deve virar PR.
Ela foi usada somente como origem de leitura para recuperar os arquivos do escopo S5.

---

## Origem dos Artefatos

Arquivos localizados:

- `PACOTE_MASTER_002_S5_REVENUE_ENGINE.patch`
- `PACOTE_MASTER_002_S5_REVENUE_ENGINE.bundle`

Inspecao do patch:

- `git apply --stat` confirmou arquivos do Revenue Engine.
- `git apply --check` falhou e o patch nao foi aplicado.

Motivos do bloqueio:

- `docs/CODEX_POLICY.md` ja existia em `origin/main`.
- `next-env.d.ts` nao aplicava limpo sobre a base atual.

Inspecao do bundle:

- `git bundle list-heads` retornou `61e2e71032f5da139708eb0b871804f61e8946b3 HEAD`.
- Clone direto do bundle falhou por commit pre-requisito ausente.

Decisao:

- Nao forcar patch.
- Nao usar merge.
- Recuperar manualmente apenas os arquivos do escopo S5 a partir da referencia remota.

---

## Arquivos Recuperados

- `database/011_revenue_engine.sql`
- `pages/api/crm/revenue/index.js`
- `pages/api/crm/revenue/[id].js`
- `pages/api/crm/revenue/dashboard.js`
- `pages/crm/revenue.tsx`
- `docs/PACOTE_MASTER_002_S5_IMPLEMENTACAO.md`
- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/PACOTE_MASTER_002_INDEX.md`

---

## Validacao

Build:

- `next build --webpack`: passou.
- `/crm/revenue`: compilou como rota estatica.

Observacao operacional:

- O worktree limpo usou um junction temporario para `node_modules`, reaproveitando as dependencias ja instaladas no repositorio mestre.
- O `npm run build` puro com Turbopack falhou somente por limitacao do junction fora da raiz do projeto.
- Com dependencias locais normais, o bloqueio do Turbopack nao se aplica.

Smoke tests locais:

- `GET /api/crm/revenue` sem token: `401`
- `GET /api/crm/revenue/dashboard` sem token: `401`
- `GET /crm/revenue`: `200`

---

## Pendencias

- Aplicar `database/011_revenue_engine.sql` no Supabase apos aprovacao.
- Validar as politicas RLS em ambiente real.
- Conectar `/crm/revenue` ao menu principal.
- Criar rota futura de parcelas: `/api/crm/revenue/[id]/installments`.
- Revisar endurecimento da autenticacao das APIs Revenue para validar token real no servidor, nao apenas presenca de Bearer token.
- Evitar fallback de API server-side para chave publica quando `SUPABASE_SERVICE_ROLE_KEY` estiver ausente.

---

## Status

Recuperacao limpa concluida para commit e push na branch `feature/002-s5-revenue-engine-clean`.
