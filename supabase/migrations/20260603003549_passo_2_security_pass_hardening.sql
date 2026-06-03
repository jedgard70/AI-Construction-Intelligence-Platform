-- Passo 2 - Security PASS hardening
--
-- Scope:
-- - address auth_allow_anonymous_sign_ins findings by denying Supabase
--   anonymous sign-in users in the policies reported by the remote advisor;
-- - preserve unauthenticated anon-key access where a policy intentionally
--   allowed it, because the guard only blocks JWTs with is_anonymous=true;
-- - leave auth_leaked_password_protection as a controlled Auth configuration
--   pending because it is not a SQL migration concern.
--
-- This migration does not change UI, package files, Ebook/Revit, or product
-- features. It does not disable Supabase Auth providers.

begin;

do $$
declare
  v_guard constant text := 'coalesce((auth.jwt() ->> ''is_anonymous'')::boolean, false) = false';
  r record;
  v_using text;
  v_check text;
  v_sql text;
begin
  create temporary table if not exists pg_temp.passo_2_target_policies (
    schemaname text not null,
    tablename text not null,
    policyname text not null,
    primary key (schemaname, tablename, policyname)
  ) on commit drop;

  insert into pg_temp.passo_2_target_policies (schemaname, tablename, policyname)
  values
    ('public','agent_events','agent_events_select_all'),
    ('public','archvis_gallery','ag_select'),
    ('public','archvis_materials','am_select'),
    ('public','archvis_projects','ap_delete'),
    ('public','archvis_projects','ap_select'),
    ('public','archvis_projects','ap_update'),
    ('public','archvis_renders','archvis_renders_delete_scoped'),
    ('public','archvis_renders','archvis_renders_select_scoped'),
    ('public','archvis_renders','archvis_renders_update_scoped'),
    ('public','bim3d_analyses','bim3d_analyses_select_authenticated'),
    ('public','brand_assets','brand_assets_delete_elevated'),
    ('public','brand_assets','brand_assets_select_elevated'),
    ('public','brand_assets','brand_assets_update_elevated'),
    ('public','brand_beachhead','bb_select'),
    ('public','brand_competitors','bc_select'),
    ('public','brand_messages','bm_select'),
    ('public','brand_personas','bp_select'),
    ('public','brand_pricing','bpr_select'),
    ('public','brand_taglines','bt_select'),
    ('public','brand_value_props','bvp_select'),
    ('public','budget_items','budget_select_financial_roles'),
    ('public','budget_items','budget_update_roles'),
    ('public','clash_items','clash_items_delete'),
    ('public','clash_items','clash_items_select'),
    ('public','clash_items','clash_items_update'),
    ('public','clients','clients_delete_own'),
    ('public','clients','clients_select_own'),
    ('public','clients','clients_update_own'),
    ('public','compliance_checks','compliance_checks_delete_elevated'),
    ('public','compliance_checks','compliance_checks_select_elevated'),
    ('public','compliance_checks','compliance_checks_update_elevated'),
    ('public','contract_items','contract_items_select_scoped'),
    ('public','contract_items','contract_items_write_scoped'),
    ('public','contracts','contracts_delete_scoped'),
    ('public','contracts','contracts_select_scoped'),
    ('public','contracts','contracts_update_scoped'),
    ('public','daily_reports','Users manage own reports'),
    ('public','director_assets','da_delete'),
    ('public','director_assets','da_select'),
    ('public','director_assets','da_update'),
    ('public','director_projects','dp_delete'),
    ('public','director_projects','dp_select'),
    ('public','director_projects','dp_update'),
    ('public','director_reviews','dr_delete'),
    ('public','director_reviews','dr_select'),
    ('public','director_reviews','dr_update'),
    ('public','documents','documents_approve_roles'),
    ('public','documents','documents_delete'),
    ('public','documents','documents_delete_scoped'),
    ('public','documents','documents_select'),
    ('public','documents','documents_select_authenticated'),
    ('public','documents','documents_select_scoped'),
    ('public','documents','documents_update'),
    ('public','documents','documents_update_scoped'),
    ('public','due_diligence','due_diligence_delete_elevated'),
    ('public','due_diligence','due_diligence_select_elevated'),
    ('public','due_diligence','due_diligence_update_elevated'),
    ('public','floor_plans','floor_plans_delete_scoped'),
    ('public','floor_plans','floor_plans_select_scoped'),
    ('public','floor_plans','floor_plans_update_scoped'),
    ('public','investments','Users manage own investments'),
    ('public','kpi_snapshots','kpi_select_roles'),
    ('public','leads','Users manage own leads'),
    ('public','opportunities','opportunities_delete_scoped'),
    ('public','opportunities','opportunities_select_scoped'),
    ('public','opportunities','opportunities_update_scoped'),
    ('public','opportunity_services','opportunity_services_delete_scoped'),
    ('public','opportunity_services','opportunity_services_select_scoped'),
    ('public','opportunity_services','opportunity_services_update_scoped'),
    ('public','permit_checklist','permit_checklist_delete'),
    ('public','permit_checklist','permit_checklist_select'),
    ('public','permit_checklist','permit_checklist_update'),
    ('public','pipeline_stages','pipeline_stages_manage_elevated'),
    ('public','pipeline_stages','pipeline_stages_select_authenticated'),
    ('public','platform_layers','pl_select'),
    ('public','platform_modules','pm_select'),
    ('public','profiles','profiles_select_diretor'),
    ('public','profiles','profiles_select_own'),
    ('public','profiles','profiles_update_own'),
    ('public','project_members','project_members_delete_managers'),
    ('public','project_members','project_members_select_scoped'),
    ('public','project_members','project_members_update_managers'),
    ('public','projects','projects_delete_diretor'),
    ('public','projects','projects_delete_own'),
    ('public','projects','projects_select_authenticated'),
    ('public','projects','projects_select_own'),
    ('public','projects','projects_update_managers'),
    ('public','projects','projects_update_own'),
    ('public','prompt_versions','prompt_versions_select_authenticated'),
    ('public','proposal_items','proposal_items_select_scoped'),
    ('public','proposal_items','proposal_items_write_scoped'),
    ('public','proposals','proposals_select_scoped'),
    ('public','proposals','proposals_update_scoped'),
    ('public','quality_nci','nci_select_roles'),
    ('public','quality_nci','nci_update_roles'),
    ('public','rdo_records','Users manage own rdos'),
    ('public','rdo_reports','rdo_reports_delete_scoped'),
    ('public','rdo_reports','rdo_reports_select_scoped'),
    ('public','rdo_reports','rdo_reports_update_scoped'),
    ('public','revenue_events','revenue_events_select_scoped'),
    ('public','revenue_installments','revenue_installments_select_scoped'),
    ('public','revenue_installments','revenue_installments_write_scoped'),
    ('public','revenue_records','revenue_records_delete_own'),
    ('public','revenue_records','revenue_records_select_own'),
    ('public','revenue_records','revenue_records_update_own'),
    ('public','services_catalog','services_catalog_manage_elevated'),
    ('public','services_catalog','services_catalog_select_authenticated'),
    ('public','video_analyses','video_analyses_delete_scoped'),
    ('public','video_analyses','video_analyses_select_scoped'),
    ('public','video_analyses','video_analyses_update_scoped'),
    ('public','video_projects','video_projects_select_authenticated'),
    ('public','work_sessions','Users manage own sessions'),
    ('public','workflow_tasks','workflow_tasks_delete'),
    ('public','workflow_tasks','workflow_tasks_select'),
    ('public','workflow_tasks','workflow_tasks_update'),
    ('storage','objects','project_files_delete_project_managers'),
    ('storage','objects','project_files_delete_scoped'),
    ('storage','objects','project_files_select_project_access'),
    ('storage','objects','project_files_select_scoped'),
    ('storage','objects','project_files_update_project_access'),
    ('storage','objects','project_files_update_scoped')
  on conflict do nothing;

  for r in
    select p.schemaname, p.tablename, p.policyname, p.qual, p.with_check
    from pg_policies p
    join pg_temp.passo_2_target_policies t
      on t.schemaname = p.schemaname
     and t.tablename = p.tablename
     and t.policyname = p.policyname
    order by p.schemaname, p.tablename, p.policyname
  loop
    v_using := null;
    v_check := null;

    if r.qual is not null then
      if r.qual ilike '%is_anonymous%' then
        v_using := r.qual;
      else
        v_using := format('(%s) and (%s)', r.qual, v_guard);
      end if;
    end if;

    if r.with_check is not null then
      if r.with_check ilike '%is_anonymous%' then
        v_check := r.with_check;
      else
        v_check := format('(%s) and (%s)', r.with_check, v_guard);
      end if;
    end if;

    v_sql := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);

    if v_using is not null then
      v_sql := v_sql || format(' using (%s)', v_using);
    end if;

    if v_check is not null then
      v_sql := v_sql || format(' with check (%s)', v_check);
    end if;

    if v_using is not null or v_check is not null then
      execute v_sql;
    end if;
  end loop;
end $$;

commit;
