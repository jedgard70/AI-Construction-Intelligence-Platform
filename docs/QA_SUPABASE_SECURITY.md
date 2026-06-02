# QA Supabase Security

Data da execucao: 2026-06-02
Projeto Supabase: `stjhkxwylqtihzflspqe`
Fonte: Supabase Security Advisors

## Resumo

Status: `FAIL EM P0`

Hardening aplicado nesta rodada:
- migration `20260602124000_qa_real_002_security_p0_hardening.sql`
- migration `20260602130500_qa_real_002_block_anonymous_sessions.sql`
- migration `20260602141910_qa_real_003_archvis_rls_hardening.sql`

Essas migrations:
- trocaram politicas centrais de `projects`, `project_members`, `documents`, `revenue_*` para `authenticated`;
- adicionaram politicas `AS RESTRICTIVE` com `auth.jwt()->>'is_anonymous' = false`;
- endureceram tambem `storage.objects`.
- removeram de `public.archvis_renders` a policy `auth_all_archvis_renders` com `USING (true)` e `WITH CHECK (true)`;
- removeram tambem a leitura `anon` de `public.archvis_renders`;
- substituíram o acesso de `archvis_renders` por policies baseadas em `project_id`, membership e papeis elevados.

Evidencia remota desta rodada:
- `public.archvis_renders` deixou de aparecer no advisor como `RLS Policy Always True`;
- o projeto continua com achados de seguranca remotos em `SECURITY DEFINER VIEW` e em `Anonymous Access Policies`.

Mesmo apos a remediacao, os advisors continuaram retornando achados P0/P1 relevantes. Portanto o gate `Security P0` continua `FAIL`.

Atualizacao C.1 em preparacao:
- as views alvo do P0 restante foram identificadas como `public.quality_nci_view` e `public.budget_items_view`;
- a estrategia escolhida foi `security_invoker = true` para preservar o contrato da view e passar a respeitar RLS do chamador;
- a migration idempotente de hardening foi preparada em `supabase/migrations/20260602203314_qa_real_003_c1_security_definer_views_hardening.sql`;
- a confirmacao final foi executada no Supabase real e o advisor nao retornou mais os dois achados de `SECURITY DEFINER VIEW`.

Atualizacao C.2 em preparacao:
- o primeiro grupo pequeno de policies permissivas foi selecionado em `public.clients` e `public.contracts`;
- a estrategia e remover os fallbacks amplos mantendo o restante dos policies escopados ja existentes;
- a migration idempotente de C.2 foi preparada em `supabase/migrations/20260602204551_qa_real_003_c2_policies_true_group_1.sql`.
- confirmacao no Supabase real: `public.clients` e `public.contracts` nao aparecem mais como `rls_policy_always_true` no advisor.

Atualizacao C.2 grupo 2 em preparacao:
- o proximo grupo pequeno selecionado e `public.floor_plans`, `public.rdo_reports` e `public.video_analyses`;
- todas possuem `project_id`, permitindo substituir `auth_all_*` por policies escopadas por membership de projeto e papeis elevados;
- a migration idempotente foi preparada em `supabase/migrations/20260602205509_qa_real_003_c2_policies_true_group_2.sql`.
- confirmacao no Supabase real: `auth_all_floor_plans`, `auth_all_rdo_reports` e `auth_all_video_analyses` foram removidas e o advisor nao retorna mais `rls_policy_always_true` para essas tabelas.

## P0 ainda aberto

### Security Definer View

Confirmacao apos C.1:
- `public.quality_nci_view` nao aparece mais como `SECURITY DEFINER VIEW`;
- `public.budget_items_view` nao aparece mais como `SECURITY DEFINER VIEW`;
- o advisor de seguranca nao retornou os dois achados apos a migracao.

Historico anterior:
- `public.quality_nci_view`
- `public.budget_items_view`

Leitura objetiva:
- esses achados foram corrigidos com a migracao C.1;
- o gate de seguranca segue `FAIL` por outros motivos remanescentes, nao mais por essas duas views.

### Anonymous Access Policies

Continuam aparecendo nos advisors, entre outras, as tabelas:
- `public.documents`
- `public.project_members`
- `public.projects`
- `public.revenue_records`
- `public.revenue_installments`
- `public.revenue_events`
- `public.profiles`
- `public.proposals`
- `public.proposal_items`
- `public.opportunities`
- `public.opportunity_services`
- `public.pipeline_stages`
- `public.services_catalog`
- `storage.objects`

Leitura objetiva:
- o linter continua entendendo que politicas em papeis que incluem `authenticated` permanecem expostas a usuarios anonimos do Supabase;
- isso e coerente com a documentacao oficial: anonymous users tambem entram como `authenticated`;
- a propria documentacao do lint `0012_auth_allow_anonymous_sign_ins` deixa claro que o projeto precisa revisar essas policies ou desabilitar `Allow anonymous sign-ins`;
- mesmo com barreiras restritivas de `is_anonymous = false`, o advisor continua marcando as policies enquanto a configuracao global e outras policies do projeto permanecerem nesse estado.

### Politicas permissivas `USING/WITH CHECK true`

Achados ainda presentes em tabelas de negocio:
- `public.bim3d_analyses`
- `public.brand_assets`
- `public.clients`
- `public.compliance_checks`
- `public.contracts`
- `public.due_diligence`
- `public.floor_plans`
- `public.rdo_reports`
- `public.video_analyses`
- `public.video_projects`

## P1 aberto

- `function_search_path_mutable`:
  - `public.claim_pending_tasks`
  - `public.handle_new_user`
  - `public.set_nci_sequence`
  - `public.has_project_access`
  - `public.set_updated_at`
- `Leaked Password Protection Disabled`
- `Extension in Public` para `pg_trgm`

## P2 aberto

- `RLS Enabled No Policy`:
  - `public.agent_memory`
  - `public.agent_tasks`
  - `public.autonomous_alerts`
  - `public.knowledge_chunks`
  - `public.site_states`

## Conclusao objetiva

- Houve progresso real de hardening nesta rodada.
- `public.archvis_renders` foi corrigida com sucesso no banco real.
- Nao houve `PASS` de seguranca.
- Os bloqueios restantes para `PASS` sao:
  - `security_definer_view` em `quality_nci_view` e `budget_items_view`;
  - `auth_allow_anonymous_sign_ins` em varias policies com role `authenticated`;
  - varias policies ainda permissivas com `USING/WITH CHECK true` fora da excecao minima desta rodada.

## Proximo passo recomendado

1. Corrigir `public.quality_nci_view` e `public.budget_items_view` para remover `SECURITY DEFINER`.
2. Decidir se `Allow anonymous sign-ins` permanece habilitado no projeto.
3. Se permanecer habilitado, continuar revisao politica por politica ate zerar os achados `auth_allow_anonymous_sign_ins`.
4. Se nao for necessario, desabilitar `Allow anonymous sign-ins` em `Auth > Providers` e revalidar os advisors.
