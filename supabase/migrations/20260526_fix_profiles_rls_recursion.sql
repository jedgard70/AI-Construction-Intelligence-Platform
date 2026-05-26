-- Fix RLS recursion in profiles policies.
--
-- Original production error:
--   infinite recursion detected in policy for relation "profiles"
--
-- Cause:
--   The previous profiles_select_diretor policy queried public.profiles
--   from inside a SELECT policy on public.profiles itself. That made Postgres
--   evaluate the same RLS policy recursively.
--
-- get_my_role() also needs SECURITY DEFINER so project policies that call it
-- can read the authenticated user's role without recursively applying profiles
-- RLS again.
--
-- This migration does not alter table schema.
-- This migration does not alter existing data.
-- This file is only a reviewable migration artifact; it is not executed automatically.

begin;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.profiles
  where id = auth.uid()
$$;

revoke all on function public.get_my_role() from public;
grant execute on function public.get_my_role() to authenticated;

drop policy if exists profiles_select_diretor on public.profiles;

create policy profiles_select_diretor
on public.profiles
for select
to authenticated
using (
  public.get_my_role() = 'diretor_executivo'
);

commit;

-- Rollback plan:
-- 1. Recreate the previous profiles_select_diretor policy if needed.
-- 2. Restore previous get_my_role() definition if needed.
-- 3. Re-test login/profile/project update.
-- Note: exact previous policy/function definition should be copied from Supabase audit before rollback.
