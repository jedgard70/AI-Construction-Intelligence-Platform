-- Passo 2A - Security functions hardening
--
-- Scope:
-- - fix mutable search_path on the five functions reported by Supabase Advisor;
-- - remove direct anon/authenticated execution of SECURITY DEFINER functions in
--   the exposed public schema;
-- - keep public non-SECURITY-DEFINER wrappers for role helpers used by RLS;
-- - move pg_trgm out of public only when it is currently installed there.
--
-- This migration intentionally does not touch anonymous sign-in settings,
-- RLS policy roles, UI, package files, Revenue/Auth business logic, Ebook, or Revit.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_trgm'
      and n.nspname = 'public'
  ) then
    alter extension pg_trgm set schema extensions;
  end if;
end $$;

create or replace function private.current_role_acip()
returns public.user_role
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_role public.user_role;
begin
  set local row_security = off;

  select role
    into v_role
    from public.profiles
   where id = auth.uid();

  return v_role;
end;
$$;

revoke all on function private.current_role_acip() from public, anon;
grant execute on function private.current_role_acip() to authenticated, service_role;

create or replace function public.current_role_acip()
returns public.user_role
language sql
stable
security invoker
set search_path = private, public, auth
as $$
  select private.current_role_acip()
$$;

revoke all on function public.current_role_acip() from public, anon;
grant execute on function public.current_role_acip() to authenticated, service_role;

create or replace function private.get_my_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select role::text
  from public.profiles
  where id = auth.uid()
$$;

revoke all on function private.get_my_role() from public, anon;
grant execute on function private.get_my_role() to authenticated, service_role;

create or replace function public.get_my_role()
returns text
language sql
stable
security invoker
set search_path = private, public, auth
as $$
  select private.get_my_role()
$$;

revoke all on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

alter function public.rls_auto_enable()
  set search_path = pg_catalog;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
grant execute on function public.rls_auto_enable() to service_role;

alter function public.claim_pending_tasks(integer)
  set search_path = public, pg_catalog;

alter function public.has_project_access(uuid)
  set search_path = public, auth;

alter function public.set_nci_sequence()
  set search_path = public, pg_catalog;

alter function public.set_updated_at()
  set search_path = public, pg_catalog;

commit;
