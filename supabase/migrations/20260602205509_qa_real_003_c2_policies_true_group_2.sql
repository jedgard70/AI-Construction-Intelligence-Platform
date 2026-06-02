-- QA-REAL-003 C.2
-- Second small group of permissive RLS policies.
-- Scope: public.floor_plans, public.rdo_reports, public.video_analyses.

begin;

drop policy if exists auth_all_floor_plans on public.floor_plans;
drop policy if exists floor_plans_select_scoped on public.floor_plans;
drop policy if exists floor_plans_insert_scoped on public.floor_plans;
drop policy if exists floor_plans_update_scoped on public.floor_plans;
drop policy if exists floor_plans_delete_scoped on public.floor_plans;

create policy floor_plans_select_scoped
on public.floor_plans
as permissive
for select
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = floor_plans.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy floor_plans_insert_scoped
on public.floor_plans
as permissive
for insert
to authenticated
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = floor_plans.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy floor_plans_update_scoped
on public.floor_plans
as permissive
for update
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = floor_plans.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
)
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = floor_plans.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy floor_plans_delete_scoped
on public.floor_plans
as permissive
for delete
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = floor_plans.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

drop policy if exists auth_all_rdo_reports on public.rdo_reports;
drop policy if exists rdo_reports_select_scoped on public.rdo_reports;
drop policy if exists rdo_reports_insert_scoped on public.rdo_reports;
drop policy if exists rdo_reports_update_scoped on public.rdo_reports;
drop policy if exists rdo_reports_delete_scoped on public.rdo_reports;

create policy rdo_reports_select_scoped
on public.rdo_reports
as permissive
for select
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = rdo_reports.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy rdo_reports_insert_scoped
on public.rdo_reports
as permissive
for insert
to authenticated
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = rdo_reports.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy rdo_reports_update_scoped
on public.rdo_reports
as permissive
for update
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = rdo_reports.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
)
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = rdo_reports.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy rdo_reports_delete_scoped
on public.rdo_reports
as permissive
for delete
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = rdo_reports.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

drop policy if exists auth_all_video_analyses on public.video_analyses;
drop policy if exists video_analyses_select_scoped on public.video_analyses;
drop policy if exists video_analyses_insert_scoped on public.video_analyses;
drop policy if exists video_analyses_update_scoped on public.video_analyses;
drop policy if exists video_analyses_delete_scoped on public.video_analyses;

create policy video_analyses_select_scoped
on public.video_analyses
as permissive
for select
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = video_analyses.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy video_analyses_insert_scoped
on public.video_analyses
as permissive
for insert
to authenticated
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = video_analyses.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy video_analyses_update_scoped
on public.video_analyses
as permissive
for update
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = video_analyses.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
)
with check (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = video_analyses.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

create policy video_analyses_delete_scoped
on public.video_analyses
as permissive
for delete
to authenticated
using (
  project_id is not null
  and (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = video_analyses.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
    )
  )
);

commit;
