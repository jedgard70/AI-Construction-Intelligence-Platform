-- QA-REAL-003 C.2
-- Third small group of permissive RLS policies.
-- Scope: public.brand_assets, public.compliance_checks, public.due_diligence.

begin;

drop policy if exists auth_all_brand_assets on public.brand_assets;
drop policy if exists brand_assets_select_elevated on public.brand_assets;
drop policy if exists brand_assets_insert_elevated on public.brand_assets;
drop policy if exists brand_assets_update_elevated on public.brand_assets;
drop policy if exists brand_assets_delete_elevated on public.brand_assets;

create policy brand_assets_select_elevated
on public.brand_assets
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy brand_assets_insert_elevated
on public.brand_assets
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy brand_assets_update_elevated
on public.brand_assets
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy brand_assets_delete_elevated
on public.brand_assets
as permissive
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

drop policy if exists auth_all_compliance_checks on public.compliance_checks;
drop policy if exists compliance_checks_select_elevated on public.compliance_checks;
drop policy if exists compliance_checks_insert_elevated on public.compliance_checks;
drop policy if exists compliance_checks_update_elevated on public.compliance_checks;
drop policy if exists compliance_checks_delete_elevated on public.compliance_checks;

create policy compliance_checks_select_elevated
on public.compliance_checks
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy compliance_checks_insert_elevated
on public.compliance_checks
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy compliance_checks_update_elevated
on public.compliance_checks
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy compliance_checks_delete_elevated
on public.compliance_checks
as permissive
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

drop policy if exists auth_all_due_diligence on public.due_diligence;
drop policy if exists due_diligence_select_elevated on public.due_diligence;
drop policy if exists due_diligence_insert_elevated on public.due_diligence;
drop policy if exists due_diligence_update_elevated on public.due_diligence;
drop policy if exists due_diligence_delete_elevated on public.due_diligence;

create policy due_diligence_select_elevated
on public.due_diligence
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy due_diligence_insert_elevated
on public.due_diligence
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy due_diligence_update_elevated
on public.due_diligence
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

create policy due_diligence_delete_elevated
on public.due_diligence
as permissive
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
);

commit;
