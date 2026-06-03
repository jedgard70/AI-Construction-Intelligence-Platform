# Apex Engine Handoff - Current State

Data: 2026-06-03

Objetivo: permitir que qualquer motor de codigo assuma a plataforma sem depender de memoria de chat anterior.

## 1. Fonte oficial

- Repositorio oficial: `GitHub origin/main` (única fonte de verdade)
- Remote Git: `https://github.com/jedgard70/AI-Construction-Intelligence-Platform.git`
- Workspace oficial local: `/home/user/AI-Construction-Intelligence-Platform`
- Branch de desenvolvimento: `claude/tender-wright-kMmx4`
- Orchestração de checkpoints: `docs/HANDOFF_CHECKPOINT_FLOW_ATUAL.md` (referência central)

## 2. Estado Git

### PRs abertos

- PR #80: `docs: finalize controlled operational platform status`
  - Branch: `docs/finalize-controlled-operational-platform`
  - Base: `main`
  - Estado: aberto
  - URL: `https://github.com/jedgard70/AI-Construction-Intelligence-Platform/pull/80`

- PR #81: `docs: add Apex 8-step finalization masterplan`
  - Branch: `docs/apex-8-step-finalization-masterplan`
  - Base: `main`
  - Estado: aberto
  - URL: `https://github.com/jedgard70/AI-Construction-Intelligence-Platform/pull/81`

### PR fechado relevante

- PR #79: `fix: harden remaining permissive RLS policies`
  - Branch: `feature/security-policies-true-group3`
  - Base: `main`
  - Estado: fechado
  - Merge: nao mergeado
  - `mergedAt`: `null`
  - `mergeCommit`: `null`
  - Fechado em: `2026-06-02T23:10:44Z`
  - URL: `https://github.com/jedgard70/AI-Construction-Intelligence-Platform/pull/79`

### Branches relevantes locais

- `main`
- `docs/apex-8-step-finalization-masterplan`
- `docs/finalize-controlled-operational-platform`
- `feature/security-policies-true-group3`
- `feature/security-definer-views-hardening`
- `feature/security-policies-true-group1`
- `feature/security-policies-true-group2`
- `feature/security-policies-true-group4-clean`
- `feature/fix-owner-auth-apex-ai-layout`
- `qa/real-001-operational-validation`

### Branches remotas relevantes

- `origin/main`
- `origin/docs/apex-8-step-finalization-masterplan`
- `origin/docs/finalize-controlled-operational-platform`
- `origin/feature/security-definer-views-hardening`
- `origin/feature/security-policies-true-group1`
- `origin/feature/security-policies-true-group2`
- `origin/feature/security-policies-true-group3`
- `origin/feature/fix-owner-auth-apex-ai-layout`
- `origin/feature/002-s5-revenue-engine-clean`
- `origin/feature/pr-c1-database-commercial-core`
- `origin/feature/pr-c2a-apis-crm`
- `origin/feature/pr-c2b-ui-crm`

### Worktree conhecido

Estado observado antes da criacao deste arquivo:

- Branch atual de origem operacional: `main`, depois nova branch documental para este arquivo.
- Arquivo nao rastreado conhecido: `docs/VERCEL_FAILURE_DIAGNOSIS_PR80_PR81.md`
- Este arquivo de diagnostico Vercel existe localmente, mas deve ser tratado como artefato nao commitado enquanto nao houver decisao explicita.
- Nao apagar, mover, sobrescrever ou presumir descarte desse arquivo.

### Stashes conhecidos

- `stash@{0}`: `On main: controlled-platform-finalization preserve revenue-auth-qa local worktree`
- `stash@{1}`: `On feature/fix-package-lock-ci: wip-package-lock-ci`
- `stash@{2}`: `On feature/owner-command-chat: codex-operational-rules-docs`
- `stash@{3}`: `On feature/owner-command-chat: temp-owner-command-before-safety-gate`
- `stash@{4}`: `On feature/apex-safety-gate: temp-before-owner-command`

Nao aplicar stash sem ordem explicita.

## 3. Estado atual

### PR #80

- Aberto.
- Documental.
- Estado normal, aguardando revisao e merge quando apropriado.

### PR #81

- Aberto.
- Documental.
- Estado normal, aguardando revisao e merge quando apropriado.

### PR #79

- Fechado sem merge.
- Nao reabrir, nao recriar e nao reaproveitar sem ordem explicita.

### Security P0 restante

Fonte local de referencia:

- `docs/QA_SUPABASE_SECURITY.md`
- `docs/PR_C_SECURITY_P0_REMAINING_PLAN.md`

Estado resumido:

- Gate `Security P0` segue como `FAIL`.
- Houve hardening parcial e confirmacoes reais em alguns grupos.
- Restam achados relacionados a:
  - `Anonymous Access Policies`;
  - `auth_allow_anonymous_sign_ins`;
  - policies permissivas `USING (true)` / `WITH CHECK (true)` em tabelas de negocio;
  - itens P1/P2 documentados nos relatórios de seguranca.
- Nao executar migrations, advisor, Supabase CLI, SQL remoto ou alteracao de policies nesta retomada.

### Vercel failure pendente

- PR #80 e PR #81 estao `UNSTABLE` por falha Vercel pendente.
- A proxima acao unica desta retomada e diagnosticar Vercel desses PRs.
- Nao acionar redeploy, nao alterar configuracao Vercel e nao mexer em branch protection sem ordem explicita.

### Supabase migration chain pendente

Fonte local de referencia:

- `docs/MASTERPLAN_8_PASSOS_FINALIZACAO_APEX.md`
- `docs/QA_SUPABASE_SECURITY.md`

Estado resumido:

- Existe pendencia declarada de reconciliacao da migration chain do Supabase.
- Nao alterar migrations.
- Nao rodar Supabase.
- Nao tentar reconciliar chain nesta tarefa.

## 4. Proxima acao unica

Prosseguir para Checkpoint 3.5 — Storage Validation conforme documentado em `docs/HANDOFF_CHECKPOINT_FLOW_ATUAL.md`.

Validar 15 requirements de storage: bucket `project-files`, `documents` table metadata, upload/signed-url/list API endpoints, UI integration em `/nova-analise` e `/projeto/[id]`, storage_path exposure check, RLS policies, access control (Owner/member permitido, guest bloqueado), E2E testing com sessao autenticada, persistencia.

Criar `docs/CHECKLIST_3_5_STORAGE.md` com resultados de validacao.

Nenhuma outra acao deve ser misturada a essa retomada.

## 5. Regras absolutas

- Nao criar clone.
- Nao criar temp/archive/backup/recovery.
- Nao apagar nada.
- Nao usar image tool.
- Nao usar `gpt-image-2`.
- Nao misturar tarefas.
- Nao implementar feature nova.
- Nao alterar codigo.
- Nao alterar migrations.
- Nao alterar package.
- Nao mexer em Supabase.
- Nao mexer em Vercel.
- Nao mergear sem checks verdes.
- Nao aplicar stash sem ordem explicita.
- Nao resolver conflito por improviso.

## 6. Checklist de retomada para qualquer motor

Executar exatamente nesta ordem:

1. `git fetch origin`
2. `git checkout main`
3. `git pull --ff-only origin main`
4. `git status`
5. Verificar PRs abertos.
6. Ler este arquivo.
7. Executar somente a proxima acao unica.

## 7. Se houver duvida

Parar e reportar.

Nao improvisar.

