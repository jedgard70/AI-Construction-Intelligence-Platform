-- QA-REAL-003 C.2
-- First small group of permissive RLS policies.
-- Scope: public.clients and public.contracts.

begin;

-- public.clients: remove blanket authenticated policies and rely on the existing own-scoped policies.
drop policy if exists "Authenticated users can insert clients" on public.clients;
drop policy if exists "Authenticated users can read clients" on public.clients;
drop policy if exists "Authenticated users can update clients" on public.clients;

-- public.contracts: remove the blanket ALL policy and keep scoped access.
drop policy if exists auth_all_contracts on public.contracts;
drop policy if exists contracts_delete_scoped on public.contracts;

create policy contracts_delete_scoped
on public.contracts
as permissive
for delete
to authenticated
using (
  (created_by = auth.uid())
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['diretor_executivo'::user_role, 'coordenador_projetos'::user_role])
  )
  or (
    project_id is not null
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id = contracts.project_id
        and pm.user_id = auth.uid()
    )
  )
);

commit;
