# PR A — Governance Docs Clean

**Data:** 30 de maio de 2026
**Branch:** `feature/pr-a-governance-docs-clean`
**Base:** `origin/main`
**Fonte:** `recovery/fix-client-detail-truth-layer/`

---

## Objetivo

Consolidar somente documentacao e governanca util preservada da branch `fix/client-detail-truth-layer`, sem trazer codigo, migrations, temporarios ou arquivos de cache.

---

## Arquivos comparados

### Comparados contra `origin/main`

- `docs/CODEX_POLICY.md`
- `docs/APEX_GLOBAL_MASTER_PLAN.md`
- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/PACOTE_MASTER_002_INDEX.md`
- `docs/PACOTE_ORGANIZACAO_GOVERNANCA_APEX_GLOBAL.md`
- `docs/IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md`
- `docs/FIX_CLIENT_DETAIL_TRUTH_LAYER_RECOVERY_AUDIT.md`
- `Master.Package.Apex.original/`

---

## Arquivos incorporados

### Novos documentos em `docs/`

- `docs/APEX_GLOBAL_MASTER_PLAN.md`
- `docs/PACOTE_ORGANIZACAO_GOVERNANCA_APEX_GLOBAL.md`
- `docs/IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md`
- `docs/FIX_CLIENT_DETAIL_TRUTH_LAYER_RECOVERY_AUDIT.md`
- `docs/PR_A_GOVERNANCE_DOCS_CLEAN.md`

Motivo:

- ainda nao existiam em `origin/main`;
- sao documentos de governanca, arquitetura, master plan ou auditoria de recuperacao;
- nao incluem codigo, migrations ou artefatos temporarios.

### Atualizacao controlada

- `docs/CODEX_POLICY.md`

Motivo:

- `origin/main` ja possuia a politica base;
- a fonte preservada continha regras adicionais uteis;
- foram incorporadas apenas as secoes novas de workspace oficial, governanca documental, nao duplicacao e espelho documental.

### Espelho documental

- `Master.Package.Apex.original/00_INDEX/`
- `Master.Package.Apex.original/01_MASTER_001/`
- `Master.Package.Apex.original/02_MASTER_002/`
- `Master.Package.Apex.original/03_GOVERNANCA/`
- `Master.Package.Apex.original/04_ARQUITETURA_E_ROADMAP/`

Motivo:

- estrutura documental solicitada como espelho oficial;
- arquivos sao `.md`;
- nao contem codigo de runtime;
- arquivos S5 ja existentes em `main` foram preservados e nao removidos.

---

## Arquivos ignorados

- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/PACOTE_MASTER_002_INDEX.md`

Motivo:

- ja existem em `origin/main`;
- a versao atual da `main` contem o merge do PR #32 e esta mais atual para o S5;
- nao foram sobrescritos para evitar regressao documental.

---

## Itens explicitamente fora do PR

- codigo de aplicacao;
- `pages/`;
- `components/`;
- `lib/`;
- `database/`;
- `supabase/migrations/`;
- `supabase/.temp/`;
- `tmp_*.sql`;
- `ai-construction-intelligence-platform/`;
- `.next/`;
- `node_modules/`;
- arquivos de cache.

---

## Riscos remanescentes

1. Alguns documentos historicos do `Master.Package.Apex.original/02_MASTER_002/` representam planos anteriores ao merge do Revenue Engine.
2. Os documentos oficiais de status em `docs/` foram preservados da `main`, mas o espelho documental pode conter snapshots historicos para rastreabilidade.
3. O `CODEX_POLICY.md` agora reforca workspace unico e proibicao de clones; isso deve guiar os proximos PRs de desmontagem.

---

## Validacao esperada

- `git status` deve mostrar apenas documentacao e `Master.Package.Apex.original/`.
- Build deve continuar passando, pois nao ha alteracao de runtime.
- PR deve ser revisado como documentacao/governanca, sem migrations e sem codigo.
