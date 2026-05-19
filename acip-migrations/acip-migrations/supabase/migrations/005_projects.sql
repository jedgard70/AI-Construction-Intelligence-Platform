-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 005: Projetos
-- Núcleo operacional: obra, cronograma, BIM, KPIs e orçamento
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 5.1  Projetos ─────────────────────────────────────────────────────────────
create table public.projects (
  id              uuid primary key default uuid_generate_v4(),

  -- Identificação
  name            text        not null,
  code            text        unique,           -- código interno (ex: OBR-2025-001)
  description     text,
  address         text,
  city            text,
  state           char(2),                      -- UF

  -- Responsáveis
  owner_id        uuid        not null references public.profiles(id),
  coordinator_id  uuid        references public.profiles(id),

  -- Status e execução
  status          public.project_status    not null default 'planejamento',
  execution_mode  public.execution_mode    not null default 'semi_autonomous',

  -- Datas
  start_date      date,
  end_date        date,
  actual_end_date date,

  -- Financeiro (em R$)
  budget_total    numeric(18,2),
  budget_spent    numeric(18,2) not null default 0,
  budget_forecast numeric(18,2),

  -- KPIs base (kpi_definitions do CORE_SYSTEM)
  cpi             numeric(6,4),   -- Cost Performance Index
  spi             numeric(6,4),   -- Schedule Performance Index
  safety_index    numeric(6,4),   -- Índice de segurança NR
  quality_index   numeric(6,4),   -- Índice de qualidade

  -- BIM
  bim_enabled     boolean not null default false,
  bim_coordinator text,

  -- IA
  ai_context      jsonb,    -- snapshot do contexto ativo da IA para este projeto
  ai_memory_ttl   timestamptz,  -- memory_system.short_term.ttl = session + 30 dias

  -- Metadados
  tags            text[]   not null default '{}',
  metadata        jsonb    not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.projects is
  'Projetos de construção gerenciados pela plataforma ACIP';

-- Índices
create index idx_projects_owner      on public.projects(owner_id);
create index idx_projects_status     on public.projects(status);
create index idx_projects_code       on public.projects(code);
create index idx_projects_tags       on public.projects using gin(tags);
create index idx_projects_ai_context on public.projects using gin(ai_context);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();


-- ── 5.2  Membros do projeto ───────────────────────────────────────────────────
create table public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.user_role not null,
  joined_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index idx_project_members_user on public.project_members(user_id);


-- ── 5.3  Documentos BIM vinculados ────────────────────────────────────────────
create table public.bim_documents (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),

  filename    text not null,
  format      public.bim_format not null,
  version     text,
  file_url    text not null,         -- Storage URL (Supabase Storage)
  file_size   bigint,                -- bytes

  -- Resultado de análise IA
  analysis_status text default 'pendente',  -- pendente | processando | ok | erro
  analysis_result jsonb,

  uploaded_at timestamptz not null default now()
);

create index idx_bim_documents_project on public.bim_documents(project_id);
create index idx_bim_documents_format  on public.bim_documents(format);


-- ── 5.4  Ocorrências de campo (RDO / NR) ─────────────────────────────────────
create table public.occurrences (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  reported_by     uuid not null references public.profiles(id),

  type            text not null,     -- 'seguranca' | 'qualidade' | 'prazo' | 'financeiro'
  priority        public.priority_level not null default 'level_3_precisao',
  severity        public.error_severity not null default 'medio',
  title           text not null,
  description     text,
  location        text,

  -- Normas relacionadas
  norms_violated  text[],            -- ex: ['NR-18','NR-35']

  -- Status de resolução
  status          text not null default 'aberta',  -- aberta | em_andamento | resolvida
  resolved_by     uuid references public.profiles(id),
  resolved_at     timestamptz,

  -- Notificações disparadas
  notified_via    public.notification_channel[],

  attachments     jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_occurrences_project  on public.occurrences(project_id);
create index idx_occurrences_severity on public.occurrences(severity);
create index idx_occurrences_status   on public.occurrences(status);

create trigger trg_occurrences_updated_at
  before update on public.occurrences
  for each row execute procedure public.set_updated_at();


-- ── 5.5  KPIs históricos do projeto ──────────────────────────────────────────
create table public.project_kpis (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  recorded_by uuid references public.profiles(id),

  period      date not null,         -- data de referência do KPI
  cpi         numeric(6,4),
  spi         numeric(6,4),
  safety_index  numeric(6,4),
  quality_index numeric(6,4),
  budget_variance numeric(18,2),
  schedule_variance_days int,

  notes       text,
  created_at  timestamptz not null default now()
);

create index idx_project_kpis_project on public.project_kpis(project_id);
create index idx_project_kpis_period  on public.project_kpis(period);
create unique index idx_project_kpis_unique on public.project_kpis(project_id, period);
