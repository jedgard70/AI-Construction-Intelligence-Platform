# QA Supabase Security

Data da execucao: 2026-06-02
Projeto Supabase: `stjhkxwylqtihzflspqe`
Fonte: Supabase Security Advisors

## Resumo

Status: `FAIL EM P0`

Hardening aplicado nesta sequencia:
- `20260602124000_qa_real_002_security_p0_hardening.sql`
- `20260602130500_qa_real_002_block_anonymous_sessions.sql`
- `20260602141910_qa_real_003_archvis_rls_hardening.sql`
- `20260602203314_qa_real_003_c1_security_definer_views_hardening.sql`
- `20260602204551_qa_real_003_c2_policies_true_group_1.sql`
- `20260602205509_qa_real_003_c2_policies_true_group_2.sql`
- `20260602211452_qa_real_003_c2_policies_true_group_3.sql`
- `qa_real_003_c2_policies_true_group_4`

Efeito confirmado no banco real:
- `public.archvis_renders` deixou de aparecer como `RLS Policy Always True`;
- `public.quality_nci_view` e `public.budget_items_view` deixaram de aparecer como `SECURITY DEFINER VIEW`;
- `public.clients`, `public.contracts`, `public.floor_plans`, `public.rdo_reports`, `public.video_analyses`, `public.brand_assets`, `public.compliance_checks` e `public.due_diligence` deixaram de aparecer como `rls_policy_always_true`;
- `public.bim3d_analyses`, `public.prompt_versions` e `public.video_projects` deixaram de aparecer como `rls_policy_always_true`.

## P0 restante por tipo

### `rls_policy_always_true`

Nenhum achado restante neste snapshot.

### `auth_allow_anonymous_sign_ins`

Persistem 39 tabelas:
- `public.agent_events`
- `public.archvis_gallery`
- `public.archvis_materials`
- `public.archvis_projects`
- `public.archvis_renders`
- `public.bim3d_analyses`
- `public.brand_assets`
- `public.director_projects`
- `public.director_reviews`
- `public.documents`
- `public.due_diligence`
- `public.floor_plans`
- `public.investments`
- `public.kpi_snapshots`
- `public.leads`
- `public.opportunities`
- `public.opportunity_services`
- `public.permit_checklist`
- `public.pipeline_stages`
- `public.platform_layers`
- `public.platform_modules`
- `public.profiles`
- `public.project_members`
- `public.projects`
- `public.prompt_versions`
- `public.proposal_items`
- `public.proposals`
- `public.quality_nci`
- `public.rdo_records`
- `public.rdo_reports`
- `public.revenue_events`
- `public.revenue_installments`
- `public.revenue_records`
- `public.services_catalog`
- `public.video_analyses`
- `public.video_projects`
- `public.work_sessions`
- `public.workflow_tasks`
- `storage.objects`

### `anon_security_definer_function_executable`

Persistem 4 funcoes:
- `public.current_role_acip()`
- `public.get_my_role()`
- `public.handle_new_user()`
- `public.rls_auto_enable()`

### `function_search_path_mutable`

Persistem 5 funcoes:
- `public.claim_pending_tasks`
- `public.handle_new_user`
- `public.set_nci_sequence`
- `public.has_project_access`
- `public.set_updated_at`

## Total de P0 restantes

Total contado neste snapshot: `48`

Quebra:
- `0` em `rls_policy_always_true`
- `39` em `auth_allow_anonymous_sign_ins`
- `4` em `anon_security_definer_function_executable`
- `5` em `function_search_path_mutable`

## Outros achados ainda presentes

Esses pontos continuam aparecendo no advisor, mas nao entram no total acima de P0 deste snapshot:
- `RLS Enabled No Policy` em `public.agent_memory`, `public.agent_tasks`, `public.autonomous_alerts`, `public.knowledge_chunks`, `public.site_states`
- `Extension in Public` para `public.pg_trgm`
- `Leaked Password Protection Disabled`

## Leitura objetiva

- O hardening por lotes anteriores funcionou e zerou os bloqueios `rls_policy_always_true`.
- O residuo P0 agora e dominado por `auth_allow_anonymous_sign_ins`.
- O proximo foco deve sair de `C.2 group 4` e entrar na decisao sobre `Allow anonymous sign-ins`.

## Recomendacao do proximo PR

Prioridade recomendada: tratar `Allow anonymous sign-ins`.

Motivo:
- e o maior grupo remanescente;
- impacta varias tabelas de negocio e storage;
- tende a exigir decisao de produto/seguranca, nao apenas mais um lote mecanico de policies.

Sequencia sugerida:
1. decidir se `Allow anonymous sign-ins` deve permanecer habilitado;
2. se permanecer, continuar revisao por modulo para reduzir `auth_allow_anonymous_sign_ins`;
3. se for desabilitado, reexecutar advisors e reavaliar o saldo real de P0;
4. depois disso, corrigir as funcoes com search path mutavel.
