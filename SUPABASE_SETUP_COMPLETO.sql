-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — SCRIPT DE SETUP COMPLETO
-- Cole TODO este conteúdo no Supabase → SQL Editor → Run
-- Versão: 5.3.0  |  Inclui migrations 001–010 + tabelas extras (leads, checklists, bim_ops)
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- 001: EXTENSÕES
-- ──────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "pg_stat_statements";

-- ──────────────────────────────────────────────────────────────────────────────
-- 002: ENUMs (idempotente)
-- ──────────────────────────────────────────────────────────────────────────────
do $$ begin create type public.user_role as enum ('engenheiro_campo','coordenador_projetos','gestor_financeiro','diretor_executivo'); exception when duplicate_object then null; end $$;
do $$ begin create type public.response_format as enum ('operational_responses','technical_responses','executive_responses'); exception when duplicate_object then null; end $$;
do $$ begin create type public.priority_level as enum ('level_1_seguranca','level_2_viabilidade','level_3_precisao','level_4_financeiro','level_5_escalabilidade'); exception when duplicate_object then null; end $$;
do $$ begin create type public.project_status as enum ('planejamento','em_andamento','pausado','concluido','atrasado','cancelado'); exception when duplicate_object then null; end $$;
do $$ begin create type public.execution_mode as enum ('manual_assist','semi_autonomous','fully_autonomous'); exception when duplicate_object then null; end $$;
do $$ begin create type public.error_severity as enum ('baixo','medio','alto','critico'); exception when duplicate_object then null; end $$;
do $$ begin create type public.audit_action as enum ('login','logout','login_failed','password_reset','profile_update','role_change','project_create','project_update','project_delete','document_upload','bim_analysis','financial_report','permission_granted','permission_revoked','override_decision','ai_agent_trigger','error_critico','error_alto'); exception when duplicate_object then null; end $$;
do $$ begin create type public.bim_format as enum ('IFC','NWC','NWD','BCF','RCS','RCP','RVT','DWG'); exception when duplicate_object then null; end $$;
do $$ begin create type public.memory_type as enum ('project_memory','technical_knowledge_base','historical_decisions','construction_standards'); exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_channel as enum ('email','sms','push_notification','whatsapp','dashboard_log'); exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 003: PROFILES
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  full_name       text,
  avatar_url      text,
  phone           text,
  role            public.user_role     not null default 'engenheiro_campo',
  response_format public.response_format not null default 'operational_responses',
  company         text,
  department      text,
  registration_id text,
  is_active       boolean not null default true,
  requires_2fa    boolean not null default false,
  remember_session boolean not null default true,
  last_login      timestamptz,
  last_ip         inet,
  failed_attempts int     not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_role    on public.profiles(role);
create index if not exists idx_profiles_company on public.profiles(company);
create index if not exists idx_profiles_active  on public.profiles(is_active);
create index if not exists idx_profiles_email   on public.profiles using gin (email gin_trgm_ops);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────────
-- 004: ROLES & PERMISSIONS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.roles (
  id              public.user_role primary key,
  label           text not null,
  description     text,
  response_format public.response_format not null,
  priority_access int[] not null default '{}',
  context_priority text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.permissions (
  id          serial primary key,
  code        text not null unique,
  label       text not null,
  module      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id       public.user_role not null references public.roles(id) on delete cascade,
  permission_id int not null references public.permissions(id) on delete cascade,
  granted_by    uuid references public.profiles(id),
  granted_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_permissions (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  permission_id int not null references public.permissions(id) on delete cascade,
  granted       boolean not null default true,
  granted_by    uuid references public.profiles(id),
  expires_at    timestamptz,
  reason        text,
  granted_at    timestamptz not null default now(),
  primary key (user_id, permission_id)
);

create index if not exists idx_role_permissions_role on public.role_permissions(role_id);
create index if not exists idx_user_permissions_user on public.user_permissions(user_id);
create index if not exists idx_permissions_module    on public.permissions(module);

create or replace view public.v_user_permissions as
select p.id as user_id, p.email, p.role, pm.code as permission_code, pm.module,
  coalesce(up.granted, true) as granted, up.expires_at
from public.profiles p
join public.role_permissions rp on rp.role_id = p.role
join public.permissions pm on pm.id = rp.permission_id
left join public.user_permissions up on up.user_id = p.id and up.permission_id = pm.id
where p.is_active = true and (up.expires_at is null or up.expires_at > now());

create or replace function public.has_permission(p_user_id uuid, p_permission text)
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.v_user_permissions where user_id = p_user_id and permission_code = p_permission and granted = true);
$$;

-- Seed roles
insert into public.roles (id, label, description, response_format, priority_access, context_priority) values
  ('engenheiro_campo','Engenheiro de Campo','Registro de ocorrências, RDO e leitura BIM','operational_responses','{}',array['active_project','safety_alerts','daily_tasks']),
  ('coordenador_projetos','Coordenador de Projetos','Gestão de cronograma, compras e relatórios','technical_responses','{3}',array['active_project','critical_risks','resource_efficiency']),
  ('gestor_financeiro','Gestor Financeiro','Controle de orçamento, pagamentos e contratos','executive_responses','{4}',array['financial_performance','budget_variance','forecast']),
  ('diretor_executivo','Diretor / C-Level','Acesso total, decisões estratégicas','executive_responses','{3,4,5}',array['portfolio_status','critical_risks','executive_decisions'])
on conflict (id) do nothing;

-- Seed permissions
insert into public.permissions (code, label, module) values
  ('leitura_bim','Leitura de modelos BIM','bim'),('upload_bim','Upload de arquivos BIM','bim'),
  ('clash_detection','Clash detection','bim'),('quantity_takeoff','Extração de quantitativos','bim'),
  ('simulacao_4d','Simulação 4D','bim'),('analise_5d','Análise 5D','bim'),
  ('registro_ocorrencias','Registro de ocorrências','campo'),('aprovacao_rdo','Aprovação de RDO','campo'),
  ('checklist_seguranca','Checklist NR-18/NR-35','campo'),('edicao_cronograma','Edição de cronograma','projetos'),
  ('aprovacao_compras','Aprovação de compras','projetos'),('geracao_relatorios','Geração de relatórios','projetos'),
  ('create_project','Criação de projetos','projetos'),('delete_project','Exclusão de projetos','projetos'),
  ('leitura_orcamento','Leitura de orçamento','financeiro'),('aprovacao_pagamentos','Aprovação de pagamentos','financeiro'),
  ('controle_contratos','Controle de contratos','financeiro'),('roi_analysis','Análise de ROI','financeiro'),
  ('valuation','Valuation de ativos','financeiro'),('capital_raising','Estratégias de captação','financeiro'),
  ('gestao_usuarios','Gestão de usuários','admin'),('aprovacao_estrategica','Aprovação estratégica','admin'),
  ('override_decisions','Override de decisões','admin'),('acesso_total','Acesso total','admin'),
  ('configurar_agentes_ia','Configurar agentes IA','admin'),('visualizar_audit_log','Visualizar audit log','admin')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'engenheiro_campo', id from public.permissions where code in ('leitura_bim','registro_ocorrencias','aprovacao_rdo','checklist_seguranca')
  on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'coordenador_projetos', id from public.permissions where code in ('leitura_bim','upload_bim','clash_detection','quantity_takeoff','edicao_cronograma','aprovacao_compras','geracao_relatorios','create_project','leitura_orcamento','visualizar_audit_log')
  on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'gestor_financeiro', id from public.permissions where code in ('leitura_orcamento','aprovacao_pagamentos','controle_contratos','roi_analysis','valuation','capital_raising','geracao_relatorios','visualizar_audit_log')
  on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'diretor_executivo', id from public.permissions
  on conflict do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- 005: PROJETOS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  code            text unique,
  description     text,
  address         text,
  city            text,
  state           char(2),
  type            text default 'residencial',
  owner_id        uuid not null references public.profiles(id),
  coordinator_id  uuid references public.profiles(id),
  status          public.project_status not null default 'planejamento',
  execution_mode  public.execution_mode not null default 'semi_autonomous',
  start_date      date,
  end_date        date,
  actual_end_date date,
  budget_planned  numeric(18,2),
  budget_actual   numeric(18,2) not null default 0,
  budget_total    numeric(18,2),
  budget_spent    numeric(18,2) not null default 0,
  budget_forecast numeric(18,2),
  completion_pct  numeric(5,2) not null default 0,
  cpi             numeric(6,4),
  spi             numeric(6,4),
  eac             numeric(18,2),
  esg_score       numeric(5,2),
  safety_index    numeric(6,4),
  quality_index   numeric(6,4),
  bim_enabled     boolean not null default false,
  bim_coordinator text,
  ai_context      jsonb,
  ai_memory_ttl   timestamptz,
  tags            text[] not null default '{}',
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Garante colunas mesmo se a tabela já existia com schema antigo
alter table public.projects add column if not exists owner_id       uuid references public.profiles(id);
alter table public.projects add column if not exists coordinator_id uuid references public.profiles(id);
alter table public.projects add column if not exists client_id      uuid references public.clients(id);
alter table public.projects add column if not exists type           text default 'residencial';
alter table public.projects add column if not exists completion_pct numeric(5,2) not null default 0;
alter table public.projects add column if not exists budget_planned numeric(18,2);
alter table public.projects add column if not exists budget_actual  numeric(18,2) not null default 0;
alter table public.projects add column if not exists eac            numeric(18,2);
alter table public.projects add column if not exists esg_score      numeric(5,2);
alter table public.projects add column if not exists status         public.project_status not null default 'planejamento';
alter table public.projects add column if not exists execution_mode public.execution_mode not null default 'semi_autonomous';
alter table public.projects add column if not exists cpi            numeric(6,4);
alter table public.projects add column if not exists spi            numeric(6,4);
alter table public.projects add column if not exists safety_index   numeric(6,4);
alter table public.projects add column if not exists quality_index  numeric(6,4);
alter table public.projects add column if not exists bim_enabled    boolean not null default false;
alter table public.projects add column if not exists tags           text[] not null default '{}';
alter table public.projects add column if not exists metadata       jsonb not null default '{}';
alter table public.projects add column if not exists updated_at     timestamptz not null default now();

create index if not exists idx_projects_owner  on public.projects(owner_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_code   on public.projects(code);
create index if not exists idx_projects_tags   on public.projects using gin(tags);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();

-- Clientes
create table if not exists public.clients (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text,
  phone       text,
  company     text,
  document    text,
  address     text,
  city        text,
  state       char(2),
  notes       text,
  owner_id    uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_clients_owner on public.clients(owner_id);
drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients for each row execute procedure public.set_updated_at();

-- Vínculo projeto ↔ cliente
alter table public.projects add column if not exists client_id uuid references public.clients(id);

create table if not exists public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.user_role not null,
  joined_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists idx_project_members_user on public.project_members(user_id);

create table if not exists public.bim_documents (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  filename    text not null,
  format      public.bim_format not null,
  version     text,
  file_url    text not null,
  file_size   bigint,
  analysis_status text default 'pendente',
  analysis_result jsonb,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_bim_documents_project on public.bim_documents(project_id);

create table if not exists public.occurrences (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  reported_by     uuid not null references public.profiles(id),
  type            text not null,
  priority        public.priority_level not null default 'level_3_precisao',
  severity        public.error_severity not null default 'medio',
  title           text not null,
  description     text,
  location        text,
  norms_violated  text[],
  status          text not null default 'aberta',
  resolved_by     uuid references public.profiles(id),
  resolved_at     timestamptz,
  notified_via    public.notification_channel[],
  attachments     jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_occurrences_project  on public.occurrences(project_id);
create index if not exists idx_occurrences_severity on public.occurrences(severity);
create index if not exists idx_occurrences_status   on public.occurrences(status);

drop trigger if exists trg_occurrences_updated_at on public.occurrences;
create trigger trg_occurrences_updated_at before update on public.occurrences for each row execute procedure public.set_updated_at();

create table if not exists public.project_kpis (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  recorded_by uuid references public.profiles(id),
  period      date not null,
  cpi         numeric(6,4),
  spi         numeric(6,4),
  safety_index  numeric(6,4),
  quality_index numeric(6,4),
  budget_variance numeric(18,2),
  schedule_variance_days int,
  notes       text,
  created_at  timestamptz not null default now()
);

create unique index if not exists idx_project_kpis_unique on public.project_kpis(project_id, period);

-- ──────────────────────────────────────────────────────────────────────────────
-- 006: MEMORY SYSTEM + AGENTES IA
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.memory_short_term (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.memory_type not null,
  key         text not null,
  content     jsonb not null,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  accessed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_memory_st_project on public.memory_short_term(project_id);
create index if not exists idx_memory_st_expires on public.memory_short_term(expires_at);

create table if not exists public.memory_long_term (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references public.projects(id) on delete set null,
  type          public.memory_type not null,
  key           text not null,
  title         text not null,
  content       jsonb not null,
  promoted_from uuid references public.memory_short_term(id),
  promoted_at   timestamptz,
  promoted_by   uuid references public.profiles(id),
  review_status text not null default 'pendente',
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_memory_lt_project on public.memory_long_term(project_id);

create table if not exists public.ai_agents (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  role        text not null,
  module      text not null,
  description text,
  config      jsonb not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.ai_agents (name, role, module) values
  ('ROI Analyst','Especialista em retorno financeiro','investment_intelligence'),
  ('Valuation Advisor','Especialista em valuation imobiliário','investment_intelligence'),
  ('Capital Raising Strategist','Especialista em captação de recursos','investment_intelligence'),
  ('Market Intelligence Agent','Analista de mercado imobiliário','investment_intelligence'),
  ('Investor Pitch Assistant','Geração de narrativa e apresentações','investment_intelligence'),
  ('BIM Clash Detector','Análise de interferências em modelos BIM','bim_intelligence'),
  ('Structural Validator','Validação estrutural conforme ABNT','bim_intelligence'),
  ('Risk Predictor','Predição de riscos de prazo, custo e qualidade','cognitive_architecture'),
  ('Safety Monitor','Monitoramento contínuo de NR-18/NR-35','field_operations')
on conflict (name) do nothing;

create table if not exists public.ai_agent_executions (
  id          uuid primary key default uuid_generate_v4(),
  agent_id    uuid not null references public.ai_agents(id),
  project_id  uuid references public.projects(id) on delete set null,
  triggered_by uuid references public.profiles(id),
  input       jsonb,
  output      jsonb,
  status      text not null default 'pending',
  error_msg   text,
  retry_count int not null default 0,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int
);

create index if not exists idx_agent_exec_project on public.ai_agent_executions(project_id);
create index if not exists idx_agent_exec_status  on public.ai_agent_executions(status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 007: AUDIT LOG
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text,
  user_role   public.user_role,
  action      public.audit_action not null,
  description text,
  resource_type  text,
  resource_id    text,
  resource_label text,
  ip_address  inet,
  user_agent  text,
  session_id  text,
  old_data    jsonb,
  new_data    jsonb,
  severity    public.error_severity not null default 'baixo',
  notified    boolean not null default false,
  notified_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_user     on public.audit_log(user_id);
create index if not exists idx_audit_action   on public.audit_log(action);
create index if not exists idx_audit_created  on public.audit_log(created_at desc);

create or replace function public.log_audit(p_user_id uuid, p_action public.audit_action, p_description text default null, p_resource_type text default null, p_resource_id text default null, p_resource_label text default null, p_old_data jsonb default null, p_new_data jsonb default null, p_severity public.error_severity default 'baixo', p_ip_address inet default null, p_session_id text default null)
returns bigint language plpgsql security definer as $$
declare v_id bigint; v_email text; v_role public.user_role;
begin
  select email, role into v_email, v_role from public.profiles where id = p_user_id;
  insert into public.audit_log (user_id,user_email,user_role,action,description,resource_type,resource_id,resource_label,old_data,new_data,severity,ip_address,session_id)
  values (p_user_id,v_email,v_role,p_action,p_description,p_resource_type,p_resource_id,p_resource_label,p_old_data,p_new_data,p_severity,p_ip_address,p_session_id) returning id into v_id;
  return v_id;
end; $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 008: ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.current_role_acip()
returns public.user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.clients         enable row level security;
alter table public.project_members enable row level security;
alter table public.bim_documents   enable row level security;
alter table public.occurrences     enable row level security;
alter table public.audit_log       enable row level security;
alter table public.memory_short_term enable row level security;
alter table public.memory_long_term  enable row level security;
alter table public.roles           enable row level security;
alter table public.permissions     enable row level security;
alter table public.role_permissions enable row level security;

-- Profiles
drop policy if exists "profiles: leitura própria" on public.profiles;
create policy "profiles: leitura própria" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles: edição própria" on public.profiles;
create policy "profiles: edição própria" on public.profiles for update using (id = auth.uid());
drop policy if exists "profiles: diretor vê todos" on public.profiles;
create policy "profiles: diretor vê todos" on public.profiles for select using (public.current_role_acip() = 'diretor_executivo');

-- Projects
drop policy if exists "projects: membros podem ler" on public.projects;
create policy "projects: membros podem ler" on public.projects for select using (exists (select 1 from public.project_members where project_id = projects.id and user_id = auth.uid()) or owner_id = auth.uid());
drop policy if exists "projects: coordenador/diretor criam" on public.projects;
create policy "projects: coordenador/diretor criam" on public.projects for insert with check (public.current_role_acip() in ('coordenador_projetos','diretor_executivo'));
drop policy if exists "projects: owner/coordenador atualizam" on public.projects;
create policy "projects: owner/coordenador atualizam" on public.projects for update using (owner_id = auth.uid() or coordinator_id = auth.uid() or public.current_role_acip() = 'diretor_executivo');
drop policy if exists "projects: somente diretor deleta" on public.projects;
create policy "projects: somente diretor deleta" on public.projects for delete using (public.current_role_acip() = 'diretor_executivo');

-- Clients
drop policy if exists "clients: autenticados gerenciam" on public.clients;
create policy "clients: autenticados gerenciam" on public.clients for all using (auth.uid() is not null);

-- Audit log
drop policy if exists "audit: usuário vê o próprio" on public.audit_log;
create policy "audit: usuário vê o próprio" on public.audit_log for select using (user_id = auth.uid());
drop policy if exists "audit: gestores veem tudo" on public.audit_log;
create policy "audit: gestores veem tudo" on public.audit_log for select using (public.has_permission(auth.uid(), 'visualizar_audit_log'));
drop policy if exists "audit: imutável — sem delete" on public.audit_log;
create policy "audit: imutável — sem delete" on public.audit_log for delete using (false);

-- Memory
drop policy if exists "memory_st: usuário acessa a própria" on public.memory_short_term;
create policy "memory_st: usuário acessa a própria" on public.memory_short_term for all using (user_id = auth.uid());
drop policy if exists "memory_lt: qualquer membro do projeto lê" on public.memory_long_term;
create policy "memory_lt: qualquer membro do projeto lê" on public.memory_long_term for select using (project_id is null or exists (select 1 from public.project_members where project_id = memory_long_term.project_id and user_id = auth.uid()));

-- Roles/Permissions
drop policy if exists "roles: autenticados leem" on public.roles;
create policy "roles: autenticados leem" on public.roles for select using (auth.uid() is not null);
drop policy if exists "permissions: autenticados leem" on public.permissions;
create policy "permissions: autenticados leem" on public.permissions for select using (auth.uid() is not null);
drop policy if exists "role_permissions: autenticados leem" on public.role_permissions;
create policy "role_permissions: autenticados leem" on public.role_permissions for select using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────────────────────────
-- 009: SEED — 2 projetos e 2 clientes de exemplo (dados reais de aprendizado)
-- ──────────────────────────────────────────────────────────────────────────────

-- NOTA: estes dados serão vinculados ao seu usuário já cadastrado.
-- Execute isso DEPOIS de fazer login na plataforma pelo menos uma vez,
-- para que o trigger handle_new_user já tenha criado seu perfil.

-- Atualiza seu perfil para diretor_executivo
-- IMPORTANTE: só funciona se você já fez login na plataforma pelo menos uma vez
-- Se retornar 0 rows updated, faça login primeiro e rode só este bloco depois
do $$
begin
  update public.profiles
  set role = 'diretor_executivo', full_name = 'Dr. Edgard', company = 'JEDGARD Engenharia'
  where email = 'jedgard70@gmail.com';
  if not found then
    raise notice 'Perfil jedgard70@gmail.com não encontrado. Faça login na plataforma e rode este UPDATE manualmente.';
  end if;
end $$;

-- Cliente 1
insert into public.clients (id, name, email, phone, company, city, state, notes)
values
  ('cccccccc-0001-0000-0000-000000000001', 'Incorporadora Horizonte', 'contato@horizonte.com.br', '(11) 99999-0001', 'Horizonte Empreendimentos Ltda', 'São Paulo', 'SP', 'Cliente premium — projetos residenciais de alto padrão'),
  ('cccccccc-0002-0000-0000-000000000002', 'Prefeitura de Campinas', 'obras@campinas.sp.gov.br', '(19) 3232-0001', 'Prefeitura Municipal de Campinas', 'Campinas', 'SP', 'Contrato de infraestrutura urbana 2025–2027')
on conflict (id) do nothing;

-- Projeto 1
insert into public.projects (id, name, code, description, address, city, state, type, status, start_date, end_date, budget_planned, budget_actual, completion_pct, cpi, spi, bim_enabled, client_id,
  owner_id)
select
  'pppppppp-0001-0000-0000-000000000001',
  'Residencial Parque das Flores — Torre A',
  'OBR-2025-001',
  'Edifício residencial 18 pavimentos, 72 unidades, padrão médio-alto. BIM Level 2.',
  'Av. das Flores, 1200', 'São Paulo', 'SP', 'residencial',
  'em_andamento', '2025-03-01', '2026-08-31',
  12500000.00, 3250000.00, 26.0, 0.97, 0.91, true,
  'cccccccc-0001-0000-0000-000000000001',
  p.id
from public.profiles p where p.email = 'jedgard70@gmail.com'
on conflict (id) do nothing;

-- Projeto 2
insert into public.projects (id, name, code, description, address, city, state, type, status, start_date, end_date, budget_planned, budget_actual, completion_pct, cpi, spi, bim_enabled, client_id, owner_id)
select
  'pppppppp-0002-0000-0000-000000000002',
  'Viaduto Av. Andrade — Reforma Estrutural',
  'OBR-2025-002',
  'Reforço estrutural e impermeabilização de viaduto municipal. Normas DNIT/ABNT.',
  'Av. Andrade Neves s/n', 'Campinas', 'SP', 'infraestrutura',
  'planejamento', '2025-06-01', '2025-12-31',
  3800000.00, 0.00, 0.0, null, null, false,
  'cccccccc-0002-0000-0000-000000000002',
  p.id
from public.profiles p where p.email = 'jedgard70@gmail.com'
on conflict (id) do nothing;

-- Membros nos projetos
insert into public.project_members (project_id, user_id, role)
select 'pppppppp-0001-0000-0000-000000000001', p.id, 'diretor_executivo'
from public.profiles p where p.email = 'jedgard70@gmail.com'
on conflict do nothing;

insert into public.project_members (project_id, user_id, role)
select 'pppppppp-0002-0000-0000-000000000002', p.id, 'diretor_executivo'
from public.profiles p where p.email = 'jedgard70@gmail.com'
on conflict do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- 010: AUTONOMOUS RUNTIME + TABELAS EXTRAS (leads, checklists, bim_ops)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.agent_tasks (
  id              text primary key default gen_random_uuid()::text,
  tenant_id       text not null default 'default',
  project_id      uuid,
  task            text not null,
  task_type       text not null default 'general',
  context         jsonb not null default '{}',
  priority        integer not null default 5,
  status          text not null default 'pending',
  agent_ids       text[] not null default '{}',
  result          jsonb,
  error           text,
  retry_count     integer not null default 0,
  max_retries     integer not null default 3,
  scheduled_for   timestamptz not null default now(),
  recurring_cron  text,
  next_run_at     timestamptz,
  triggered_by    text not null default 'system',
  trace_id        text,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  duration_ms     integer
);

create index if not exists idx_agent_tasks_status  on public.agent_tasks(status);
create index if not exists idx_agent_tasks_project on public.agent_tasks(project_id);

create table if not exists public.knowledge_chunks (
  id          text primary key,
  doc_id      text not null,
  project_id  uuid,
  tenant_id   text not null default 'default',
  text        text not null,
  embedding   jsonb,
  metadata    jsonb not null default '{}',
  token_count integer,
  created_at  timestamptz not null default now()
);

create index if not exists idx_knowledge_fts on public.knowledge_chunks using gin(to_tsvector('portuguese', text));

create table if not exists public.prompt_versions (
  id             text primary key,
  prompt_key     text not null,
  version        text not null,
  content        text not null,
  system_content text,
  description    text,
  author         text,
  tags           text[] not null default '{}',
  active         boolean not null default false,
  metrics        jsonb not null default '{"uses":0,"avgLatencyMs":0,"avgConfidence":0,"hallucinationRate":0,"successRate":0,"avgOutputTokens":0}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_prompt_key    on public.prompt_versions(prompt_key);
create index if not exists idx_prompt_active on public.prompt_versions(prompt_key, active) where active = true;

create table if not exists public.autonomous_alerts (
  id                  text primary key default gen_random_uuid()::text,
  project_id          uuid,
  tenant_id           text not null default 'default',
  type                text not null,
  severity            public.error_severity not null default 'medio',
  title               text not null,
  description         text not null,
  data                jsonb not null default '{}',
  auto_action_taken   boolean not null default false,
  auto_action_result  jsonb,
  status              text not null default 'open',
  resolved_by         text,
  resolved_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists public.site_states (
  project_id            uuid primary key,
  elements              jsonb not null default '{}',
  iot_events            jsonb not null default '[]',
  overall_progress      numeric(5,2) not null default 0,
  active_alerts         jsonb not null default '[]',
  resource_utilization  jsonb not null default '{"workers":0,"equipment":0,"materials":0}',
  simulation_results    jsonb not null default '[]',
  last_sync             timestamptz not null default now()
);

create table if not exists public.agent_memory (
  key        text primary key,
  value      jsonb not null,
  project_id uuid,
  updated_at timestamptz not null default now()
);

create or replace function public.claim_pending_tasks(p_limit int default 10)
returns setof public.agent_tasks language plpgsql as $$
begin
  return query update public.agent_tasks set status='running', started_at=now()
  where id in (select id from public.agent_tasks where status='pending' and scheduled_for<=now() order by priority desc, scheduled_for asc limit p_limit for update skip locked)
  returning *;
end; $$;

-- ── LEADS (módulo Vendas) ─────────────────────────────────────────────────────
create table if not exists public.leads (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references public.profiles(id),
  name        text not null,
  empresa     text,
  email       text,
  telefone    text,
  valor       numeric(18,2),
  tipo        text default 'residencial',
  etapa       text not null default 'Prospecção',
  origem      text default 'Indicação',
  probabilidade int default 50,
  proxima_acao text,
  data_contato date,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.leads enable row level security;
drop policy if exists "leads: autenticados gerenciam" on public.leads;
create policy "leads: autenticados gerenciam" on public.leads for all using (auth.uid() is not null);

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at before update on public.leads for each row execute procedure public.set_updated_at();

-- Seed: 2 leads de exemplo
insert into public.leads (name, empresa, email, valor, tipo, etapa, origem, probabilidade, proxima_acao)
values
  ('Ricardo Monteiro', 'Construtora Monteiro', 'ricardo@monteiro.com.br', 2400000, 'comercial', 'Proposta', 'Indicação', 75, 'Apresentar proposta revisada'),
  ('Claudia Ramos', 'Ramos Incorporações', 'claudia@ramos.com.br', 890000, 'residencial', 'Negociação', 'LinkedIn', 60, 'Agendar visita ao terreno')
on conflict do nothing;

-- ── CHECKLISTS (módulo Qualidade) ────────────────────────────────────────────
create table if not exists public.checklists (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references public.projects(id) on delete set null,
  owner_id    uuid references public.profiles(id),
  titulo      text not null,
  categoria   text not null default 'Estrutura',
  norma       text,
  status      text not null default 'pendente',
  itens       jsonb not null default '[]',
  responsavel text,
  data_prev   date,
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.checklists enable row level security;
drop policy if exists "checklists: autenticados gerenciam" on public.checklists;
create policy "checklists: autenticados gerenciam" on public.checklists for all using (auth.uid() is not null);

drop trigger if exists trg_checklists_updated_at on public.checklists;
create trigger trg_checklists_updated_at before update on public.checklists for each row execute procedure public.set_updated_at();

-- Seed: 2 checklists de exemplo
insert into public.checklists (titulo, categoria, norma, status, responsavel, itens)
values
  ('Concretagem Fundações — Bloco A', 'Estrutura', 'NBR 6118', 'em_andamento', 'Eng. Luiz Costa',
   '[{"id":1,"item":"Verificar gabarito e formas","ok":true},{"id":2,"item":"Conferir armação conforme projeto","ok":true},{"id":3,"item":"Checar limpeza da cava","ok":false},{"id":4,"item":"Registrar slump test","ok":false}]'::jsonb),
  ('Instalações Elétricas — Pavimento Tipo', 'Elétrica', 'NBR 5410', 'pendente', 'Eng. Marta Silva',
   '[{"id":1,"item":"Conferir eletrodutos e caixas","ok":false},{"id":2,"item":"Verificar bitola dos cabos","ok":false},{"id":3,"item":"Testar continuidade dos circuitos","ok":false}]'::jsonb)
on conflict do nothing;

-- ── BIM / CLASH DETECTION (módulo BIM-Ops) ───────────────────────────────────
create table if not exists public.clash_items (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references public.projects(id) on delete cascade