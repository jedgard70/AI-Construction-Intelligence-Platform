-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 003: Tabela profiles
-- Estende auth.users do Supabase com dados específicos da plataforma.
-- ══════════════════════════════════════════════════════════════════════════════

create table public.profiles (
  -- ── Identidade ──────────────────────────────────────────────────────────────
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  full_name       text,
  avatar_url      text,
  phone           text,

  -- ── Role e empresa ───────────────────────────────────────────────────────────
  role            public.user_role     not null default 'engenheiro_campo',
  response_format public.response_format not null default 'operational_responses',
  company         text,
  department      text,
  registration_id text,           -- CREA / CAU do profissional

  -- ── Preferências de acesso ───────────────────────────────────────────────────
  is_active       boolean not null default true,
  requires_2fa    boolean not null default false,
  remember_session boolean not null default true,

  -- ── Controle de sessão ───────────────────────────────────────────────────────
  last_login      timestamptz,
  last_ip         inet,
  failed_attempts int     not null default 0,
  locked_until    timestamptz,       -- bloqueio após tentativas excessivas

  -- ── Metadados ────────────────────────────────────────────────────────────────
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is
  'Perfis de usuário da plataforma ACIP. Cada linha corresponde a um auth.users.';
comment on column public.profiles.role is
  'Papel do usuário conforme definido em user_roles do CORE_SYSTEM.json';
comment on column public.profiles.registration_id is
  'Número de registro profissional (CREA, CAU etc.)';

-- ── Índices ───────────────────────────────────────────────────────────────────
create index idx_profiles_role     on public.profiles(role);
create index idx_profiles_company  on public.profiles(company);
create index idx_profiles_active   on public.profiles(is_active);
create index idx_profiles_email    on public.profiles using gin (email gin_trgm_ops);

-- ── Trigger: updated_at automático ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── Trigger: cria perfil automaticamente ao registrar usuário ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
