drop policy if exists "anon_read_archvis_renders" on public.archvis_renders;
drop policy if exists "auth_all_archvis_renders" on public.archvis_renders;
drop policy if exists "deny_anonymous_sessions_archvis_renders" on public.archvis_renders;
drop policy if exists "archvis_renders_select_scoped" on public.archvis_renders;
drop policy if exists "archvis_renders_insert_scoped" on public.archvis_renders;
drop policy if exists "archvis_renders_update_scoped" on public.archvis_renders;
drop policy if exists "archvis_renders_delete_scoped" on public.archvis_renders;

create policy "deny_anonymous_sessions_archvis_renders"
on public.archvis_renders
as restrictive
for all
to authenticated
using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy "archvis_renders_select_scoped"
on public.archvis_renders
for select
to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    where p.id = archvis_renders.project_id
      and (
        p.created_by = auth.uid()
        or p.manager_id = auth.uid()
        or p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = archvis_renders.project_id
            and pm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.profiles pf
          where pf.id = auth.uid()
            and pf.role in ('diretor_executivo', 'coordenador_projetos')
        )
      )
  )
);

create policy "archvis_renders_insert_scoped"
on public.archvis_renders
for insert
to authenticated
with check (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    where p.id = archvis_renders.project_id
      and (
        p.created_by = auth.uid()
        or p.manager_id = auth.uid()
        or p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or exists (
          select 1
          from public.profiles pf
          where pf.id = auth.uid()
            and pf.role in ('diretor_executivo', 'coordenador_projetos')
        )
      )
  )
);

create policy "archvis_renders_update_scoped"
on public.archvis_renders
for update
to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    where p.id = archvis_renders.project_id
      and (
        p.created_by = auth.uid()
        or p.manager_id = auth.uid()
        or p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or exists (
          select 1
          from public.profiles pf
          where pf.id = auth.uid()
            and pf.role in ('diretor_executivo', 'coordenador_projetos')
        )
      )
  )
)
with check (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    where p.id = archvis_renders.project_id
      and (
        p.created_by = auth.uid()
        or p.manager_id = auth.uid()
        or p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or exists (
          select 1
          from public.profiles pf
          where pf.id = auth.uid()
            and pf.role in ('diretor_executivo', 'coordenador_projetos')
        )
      )
  )
);

create policy "archvis_renders_delete_scoped"
on public.archvis_renders
for delete
to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    where p.id = archvis_renders.project_id
      and (
        p.created_by = auth.uid()
        or p.manager_id = auth.uid()
        or p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or exists (
          select 1
          from public.profiles pf
          where pf.id = auth.uid()
            and pf.role in ('diretor_executivo', 'coordenador_projetos')
        )
      )
  )
);
