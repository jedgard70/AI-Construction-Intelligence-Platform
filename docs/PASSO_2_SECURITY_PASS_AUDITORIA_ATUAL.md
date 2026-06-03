# Passo 2 - Security PASS - Auditoria Atual

Data: 2026-06-02

Base:
- Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`
- Branch base auditada: `main`
- Base remota: `origin/main`
- Commit base: `6080fb8c1df5816d0d453fd22cbc78a1daf2c673`
- Projeto Supabase vinculado observado nos documentos anteriores: `stjhkxwylqtihzflspqe`

Escopo desta etapa:
- auditoria real do Security Advisor;
- nenhuma correcao aplicada;
- nenhuma migration criada ou alterada;
- nenhum codigo, UI, package, Revenue/Auth funcional, Ebook ou Revit alterado.

## Fontes lidas antes da auditoria

- `docs/APEX_ENGINE_HANDOFF_CURRENT_STATE.md`
- `docs/MASTERPLAN_8_PASSOS_FINALIZACAO_APEX.md`
- `docs/QA_SUPABASE_SECURITY.md`
- `docs/PR_C_SECURITY_P0_REMAINING_PLAN.md`

## Comando de auditoria real

CLI Supabase:

```text
npx supabase --version
2.104.0
```

Advisor executado:

```text
npx supabase db advisors --linked --type security --output-format json --fail-on none
```

Observacao:
- `npx supabase status` tentou inspecionar Docker local e falhou por ausencia/permissao de Docker.
- Isso nao bloqueou a auditoria remota, porque o advisor foi executado explicitamente com `--linked`.

## Advisor atual

Resultado agregado do advisor remoto:

| Lint | Nivel | Quantidade |
| --- | --- | ---: |
| `auth_allow_anonymous_sign_ins` | WARN | 54 |
| `function_search_path_mutable` | WARN | 5 |
| `anon_security_definer_function_executable` | WARN | 4 |
| `authenticated_security_definer_function_executable` | WARN | 4 |
| `extension_in_public` | WARN | 1 |
| `auth_leaked_password_protection` | WARN | 1 |
| Total | WARN | 69 |

Leitura objetiva:
- nao houve achado `ERROR` no advisor atual;
- o gate de seguranca ainda nao pode ser declarado `PASS`, porque restam 69 achados `WARN` de seguranca;
- o P0 operacional do programa continua aberto por exposicao anonima/policies, funcoes privilegiadas executaveis e configuracoes globais de Auth/extensao.

## `auth_allow_anonymous_sign_ins`

Total atual: 54 achados.

Tabelas apontadas pelo advisor:

- `public.agent_events` - `{agent_events_select_all}`
- `public.archvis_gallery` - `{ag_select}`
- `public.archvis_materials` - `{am_select}`
- `public.archvis_projects` - `{ap_delete,ap_select,ap_update}`
- `public.archvis_renders` - `{archvis_renders_delete_scoped,archvis_renders_select_scoped,archvis_renders_update_scoped}`
- `public.bim3d_analyses` - `{bim3d_analyses_select_authenticated}`
- `public.brand_assets` - `{brand_assets_delete_elevated,brand_assets_select_elevated,brand_assets_update_elevated}`
- `public.brand_beachhead` - `{bb_select}`
- `public.brand_competitors` - `{bc_select}`
- `public.brand_messages` - `{bm_select}`
- `public.brand_personas` - `{bp_select}`
- `public.brand_pricing` - `{bpr_select}`
- `public.brand_taglines` - `{bt_select}`
- `public.brand_value_props` - `{bvp_select}`
- `public.budget_items` - `{budget_select_financial_roles,budget_update_roles}`
- `public.clash_items` - `{clash_items_delete,clash_items_select,clash_items_update}`
- `public.clients` - `{clients_delete_own,clients_select_own,clients_update_own}`
- `public.compliance_checks` - `{compliance_checks_delete_elevated,compliance_checks_select_elevated,compliance_checks_update_elevated}`
- `public.contract_items` - `{contract_items_select_scoped,contract_items_write_scoped}`
- `public.contracts` - `{contracts_delete_scoped,contracts_select_scoped,contracts_update_scoped}`
- `public.daily_reports` - `{"Users manage own reports"}`
- `public.director_assets` - `{da_delete,da_select,da_update}`
- `public.director_projects` - `{dp_delete,dp_select,dp_update}`
- `public.director_reviews` - `{dr_delete,dr_select,dr_update}`
- `public.documents` - `{documents_approve_roles,documents_delete,documents_delete_scoped,documents_select,documents_select_authenticated,documents_select_scoped,documents_update,documents_update_scoped}`
- `public.due_diligence` - `{due_diligence_delete_elevated,due_diligence_select_elevated,due_diligence_update_elevated}`
- `public.floor_plans` - `{floor_plans_delete_scoped,floor_plans_select_scoped,floor_plans_update_scoped}`
- `public.investments` - `{"Users manage own investments"}`
- `public.kpi_snapshots` - `{kpi_select_roles}`
- `public.leads` - `{"Users manage own leads"}`
- `public.opportunities` - `{opportunities_delete_scoped,opportunities_select_scoped,opportunities_update_scoped}`
- `public.opportunity_services` - `{opportunity_services_delete_scoped,opportunity_services_select_scoped,opportunity_services_update_scoped}`
- `public.permit_checklist` - `{permit_checklist_delete,permit_checklist_select,permit_checklist_update}`
- `public.pipeline_stages` - `{pipeline_stages_manage_elevated,pipeline_stages_select_authenticated}`
- `public.platform_layers` - `{pl_select}`
- `public.platform_modules` - `{pm_select}`
- `public.profiles` - `{profiles_select_diretor,profiles_select_own,profiles_update_own}`
- `public.project_members` - `{project_members_delete_managers,project_members_select_scoped,project_members_update_managers}`
- `public.projects` - `{projects_delete_diretor,projects_delete_own,projects_select_authenticated,projects_select_own,projects_update_managers,projects_update_own}`
- `public.prompt_versions` - `{prompt_versions_select_authenticated}`
- `public.proposal_items` - `{proposal_items_select_scoped,proposal_items_write_scoped}`
- `public.proposals` - `{proposals_select_scoped,proposals_update_scoped}`
- `public.quality_nci` - `{nci_select_roles,nci_update_roles}`
- `public.rdo_records` - `{"Users manage own rdos"}`
- `public.rdo_reports` - `{rdo_reports_delete_scoped,rdo_reports_select_scoped,rdo_reports_update_scoped}`
- `public.revenue_events` - `{revenue_events_select_scoped}`
- `public.revenue_installments` - `{revenue_installments_select_scoped,revenue_installments_write_scoped}`
- `public.revenue_records` - `{revenue_records_delete_own,revenue_records_select_own,revenue_records_update_own}`
- `public.services_catalog` - `{services_catalog_manage_elevated,services_catalog_select_authenticated}`
- `public.video_analyses` - `{video_analyses_delete_scoped,video_analyses_select_scoped,video_analyses_update_scoped}`
- `public.video_projects` - `{video_projects_select_authenticated}`
- `public.work_sessions` - `{"Users manage own sessions"}`
- `public.workflow_tasks` - `{workflow_tasks_delete,workflow_tasks_select,workflow_tasks_update}`
- `storage.objects` - `{project_files_delete_project_managers,project_files_delete_scoped,project_files_select_project_access,project_files_select_scoped,project_files_update_project_access,project_files_update_scoped}`

Leitura objetiva:
- este e o maior bloco restante;
- inclui tabelas de produto, governanca, ArchVis, BIM/video, storage, CRM e Revenue;
- Revenue/Auth nao devem ser alterados de forma ampla nesta etapa sem PR dedicado e justificativa explicita de seguranca.

## `anon_security_definer_function_executable`

Total atual: 4 achados.

Funcoes apontadas:

- `public.current_role_acip()`
- `public.get_my_role()`
- `public.handle_new_user()`
- `public.rls_auto_enable()`

Detalhe do advisor:
- essas funcoes `SECURITY DEFINER` podem ser executadas pela role `anon` via `/rest/v1/rpc/...`;
- a remediacao recomendada pelo advisor e revogar `EXECUTE`, trocar para `SECURITY INVOKER` ou mover a funcao para fora do schema exposto se nao for intencional.

Leitura objetiva:
- este deve ser tratado antes do bloco massivo de policies anonimas, porque e pequeno, de alto impacto e mais facil de validar;
- `handle_new_user()` tambem aparece em `function_search_path_mutable`, entao precisa de cuidado para nao quebrar fluxo de Auth.

## `authenticated_security_definer_function_executable`

Total atual: 4 achados.

Funcoes apontadas:

- `public.current_role_acip()`
- `public.get_my_role()`
- `public.handle_new_user()`
- `public.rls_auto_enable()`

Leitura objetiva:
- o mesmo conjunto esta executavel por usuarios autenticados;
- a decisao deve ser feita funcao por funcao, separando funcoes RPC de uso de produto de funcoes internas/trigger;
- nao assumir que todas podem virar `SECURITY INVOKER`.

## `function_search_path_mutable`

Total atual: 5 achados.

Funcoes apontadas:

- `public.claim_pending_tasks`
- `public.handle_new_user`
- `public.set_nci_sequence`
- `public.has_project_access`
- `public.set_updated_at`

Leitura objetiva:
- bloco pequeno e apropriado para PR isolado;
- provavel correcao futura: fixar `search_path` de forma explicita em cada funcao;
- `handle_new_user` cruza Auth e tambem aparece como security-definer executable, entao deve ser validada com cuidado.

## Outros achados atuais

### `extension_in_public`

- `pg_trgm` instalado no schema `public`.

Leitura objetiva:
- tratar em PR separado, porque mover extensao pode afetar indices, funcoes ou queries que dependem de `pg_trgm`.

### `auth_leaked_password_protection`

- Leaked password protection esta desabilitado.

Leitura objetiva:
- e configuracao de Auth, nao migration SQL comum;
- deve ser decidido em conjunto com a estrategia de Auth PASS ou em sub-PR de Security com documentacao explicita.

## Decisao recomendada

Decisao recomendada para o Passo 2:

1. Nao tentar corrigir os 69 achados em lote.
2. Priorizar blocos pequenos e verificaveis antes de mexer em policies amplas.
3. Tratar funcoes `SECURITY DEFINER` executaveis como primeiro pacote de correcao, porque o conjunto e pequeno e tem impacto direto no schema exposto.
4. Em seguida tratar `function_search_path_mutable`, possivelmente no mesmo PR apenas se a revisao confirmar baixo risco e nenhum conflito com `handle_new_user`.
5. Separar `auth_allow_anonymous_sign_ins` por dominio/tabela, evitando Revenue/Auth amplo salvo quando a policy especifica exigir.
6. Adiar `extension_in_public` e `auth_leaked_password_protection` para PRs proprios ou decisao explicita, porque envolvem configuracao/impacto transversal.

## Ordem recomendada dos PRs

### PR Security 2.A - Auditoria atual

Escopo:
- este documento;
- nenhuma migration;
- nenhuma correcao.

Objetivo:
- congelar a fotografia real do advisor atual.

### PR Security 2.B - SECURITY DEFINER executable functions

Escopo candidato:
- `public.current_role_acip()`
- `public.get_my_role()`
- `public.rls_auto_enable()`
- avaliar `public.handle_new_user()` com cuidado por ser Auth/trigger.

Objetivo:
- remover `anon_security_definer_function_executable`;
- reduzir ou justificar `authenticated_security_definer_function_executable`.

Validacao obrigatoria:
- `npx supabase db advisors --linked --type security --output-format json --fail-on none`;
- teste de funcoes/RPC afetadas quando aplicavel.

### PR Security 2.C - Function search_path

Escopo candidato:
- `public.claim_pending_tasks`
- `public.handle_new_user`
- `public.set_nci_sequence`
- `public.has_project_access`
- `public.set_updated_at`

Objetivo:
- zerar `function_search_path_mutable`.

Validacao obrigatoria:
- advisor remoto;
- build local;
- teste minimo de fluxo afetado por `handle_new_user` se a funcao for alterada.

### PR Security 2.D+ - Anonymous access policies por dominio

Ordem sugerida:

1. Tabelas internas/governanca sem Revenue/Auth direto.
2. Storage/documents/projetos.
3. CRM comercial sem mexer em regra de negocio ampla.
4. Revenue apenas com escopo documentado de seguranca.
5. ArchVis/BIM/video se ainda estiverem dentro do Passo 2 e nao contaminarem Ebook/Revit.

Objetivo:
- reduzir `auth_allow_anonymous_sign_ins` sem quebrar fluxos existentes.

### PR Security 2.E - Configuracoes globais

Escopo candidato:
- `auth_leaked_password_protection`;
- decisao sobre anonymous sign-ins;
- `extension_in_public`.

Objetivo:
- fechar achados transversais depois que os blocos de schema/policies estiverem controlados.

## Status final desta auditoria

- Security PASS ainda nao atingido.
- Advisor real executado com sucesso contra o projeto vinculado.
- Restam 69 achados `WARN`.
- Nenhuma correcao foi aplicada nesta etapa.
- Proxima acao recomendada: abrir PR de correcao pequeno para funcoes `SECURITY DEFINER` executaveis, com validacao remota apos a migration.

