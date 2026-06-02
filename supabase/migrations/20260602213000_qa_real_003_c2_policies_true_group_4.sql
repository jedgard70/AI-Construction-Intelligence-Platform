-- QA-REAL-003 C.2
-- Fourth small group of permissive RLS policies.
-- Scope: public.bim3d_analyses, public.prompt_versions, public.video_projects.

begin;

drop policy if exists auth_all_bim3d_analyses on public.bim3d_analyses;
drop policy if exists bim3d_analyses_select_authenticated on public.bim3d_analyses;
drop policy if exists bim3d_analyses_insert_authenticated on public.bim3d_analyses;

create policy bim3d_analyses_select_authenticated
on public.bim3d_analyses
as permissive
for select
to authenticated
using (
  auth.uid() is not null
);

create policy bim3d_analyses_insert_authenticated
on public.bim3d_analyses
as permissive
for insert
to authenticated
with check (
  auth.uid() is not null
);

drop policy if exists service_role_all on public.prompt_versions;
drop policy if exists prompt_versions_select_authenticated on public.prompt_versions;

create policy prompt_versions_select_authenticated
on public.prompt_versions
as permissive
for select
to authenticated
using (
  auth.uid() is not null
);

drop policy if exists auth_all_video_projects on public.video_projects;
drop policy if exists video_projects_select_authenticated on public.video_projects;
drop policy if exists video_projects_insert_authenticated on public.video_projects;

create policy video_projects_select_authenticated
on public.video_projects
as permissive
for select
to authenticated
using (
  auth.uid() is not null
);

create policy video_projects_insert_authenticated
on public.video_projects
as permissive
for insert
to authenticated
with check (
  auth.uid() is not null
);

commit;
