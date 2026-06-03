-- Supabase Preview migration-chain repair.
--
-- The current official Supabase migration chain starts with
-- 20260526_fix_profiles_rls_recursion.sql, which assumes public.profiles
-- already exists. That table was present in legacy setup sources, but not in
-- supabase/migrations. This foundation migration restores the minimum
-- reproducible base before 20260526 without changing existing data.

begin;

create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

do $$
begin
  create type public.user_role as enum (
    'engenheiro_campo',
    'coordenador_projetos',
    'gestor_financeiro',
    'diretor_executivo'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.response_format as enum (
    'operational_responses',
    'technical_responses',
    'executive_responses'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  phone text,
  role public.user_role not null default 'engenheiro_campo',
  response_format public.response_format not null default 'operational_responses',
  company text,
  department text,
  registration_id text,
  is_active boolean not null default true,
  requires_2fa boolean not null default false,
  remember_session boolean not null default true,
  last_login timestamptz,
  last_ip inet,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role public.user_role not null default 'engenheiro_campo';
alter table public.profiles add column if not exists response_format public.response_format not null default 'operational_responses';
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists registration_id text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists requires_2fa boolean not null default false;
alter table public.profiles add column if not exists remember_session boolean not null default true;
alter table public.profiles add column if not exists last_login timestamptz;
alter table public.profiles add column if not exists last_ip inet;
alter table public.profiles add column if not exists failed_attempts int not null default 0;
alter table public.profiles add column if not exists locked_until timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_company on public.profiles(company);
create index if not exists idx_profiles_active on public.profiles(is_active);
create index if not exists idx_profiles_email on public.profiles using gin (email extensions.gin_trgm_ops);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

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

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
