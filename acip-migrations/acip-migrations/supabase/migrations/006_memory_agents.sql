-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 006: Memory System + Agentes IA
-- Baseado em memory_system, cognitive_architecture e investment_intelligence
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 6.1  Memória de curto prazo (por projeto / sessão) ────────────────────────
create table public.memory_short_term (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,

  type        public.memory_type not null,
  key         text not null,          -- identificador semântico
  content     jsonb not null,         -- dados do contexto

  -- TTL: session + 30 dias (conforme CORE_SYSTEM memory_system.short_term.ttl)
  expires_at  timestamptz not null default (now() + interval '30 days'),
  accessed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

comment on table public.memory_short_term is
  'Memória de curto prazo da IA: contexto de projeto ativo. TTL = sessão + 30 dias (LRU).';

create index idx_memory_st_project  on public.memory_short_term(project_id);
create index idx_memory_st_user     on public.memory_short_term(user_id);
create index idx_memory_st_expires  on public.memory_short_term(expires_at);
create index idx_memory_st_content  on public.memory_short_term using gin(content);

-- Job de limpeza (roda via pg_cron ou Supabase Edge Function agendada)
create or replace function public.purge_expired_memory()
returns int language plpgsql as $$
declare
  deleted int;
begin
  delete from public.memory_short_term where expires_at < now();
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;


-- ── 6.2  Memória de longo prazo (repositório enterprise) ─────────────────────
create table public.memory_long_term (
  id          uuid primary key default uuid_generate_v4(),

  -- Pode ser vinculada a um projeto ou ser global
  project_id  uuid references public.projects(id) on delete set null,

  type        public.memory_type not null,
  key         text not null,
  title       text not null,
  content     jsonb not null,

  -- Promoção de short_term (promotion_rules.trigger = project_closed)
  promoted_from uuid references public.memory_short_term(id),
  promoted_at   timestamptz,
  promoted_by   uuid references public.profiles(id),

  -- Qualidade e revisão
  review_status text not null default 'pendente',  -- pendente | aprovado | arquivado
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,

  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.memory_long_term is
  'Repositório permanente de conhecimento enterprise. TTL = permanente, revisão manual.';

create index idx_memory_lt_project on public.memory_long_term(project_id);
create index idx_memory_lt_type    on public.memory_long_term(type);
create index idx_memory_lt_tags    on public.memory_long_term using gin(tags);
create index idx_memory_lt_content on public.memory_long_term using gin(content);

create trigger trg_memory_lt_updated_at
  before update on public.memory_long_term
  for each row execute procedure public.set_updated_at();


-- ── 6.3  Agentes IA (ai_agents do investment_intelligence) ───────────────────
create table public.ai_agents (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  role        text not null,
  module      text not null,          -- ex: 'investment_intelligence', 'bim_intelligence'
  description text,
  config      jsonb not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.ai_agents is
  'Catálogo de agentes IA disponíveis na plataforma ACIP';

-- Seed dos agentes de investment_intelligence
insert into public.ai_agents (name, role, module) values
  ('ROI Analyst',               'Especialista em retorno financeiro',            'investment_intelligence'),
  ('Valuation Advisor',         'Especialista em valuation imobiliário',         'investment_intelligence'),
  ('Capital Raising Strategist','Especialista em captação de recursos',          'investment_intelligence'),
  ('Market Intelligence Agent', 'Analista de mercado imobiliário',              'investment_intelligence'),
  ('Investor Pitch Assistant',  'Geração de narrativa e apresentações',          'investment_intelligence'),
  ('BIM Clash Detector',        'Análise de interferências em modelos BIM',      'bim_intelligence'),
  ('Structural Validator',      'Validação estrutural conforme ABNT',            'bim_intelligence'),
  ('Risk Predictor',            'Predição de riscos de prazo, custo e qualidade','cognitive_architecture'),
  ('Safety Monitor',            'Monitoramento contínuo de NR-18 / NR-35',      'field_operations');


-- ── 6.4  Logs de execução de agentes IA ──────────────────────────────────────
create table public.ai_agent_executions (
  id          uuid primary key default uuid_generate_v4(),
  agent_id    uuid not null references public.ai_agents(id),
  project_id  uuid references public.projects(id) on delete set null,
  triggered_by uuid references public.profiles(id),

  input       jsonb,
  output      jsonb,
  status      text not null default 'pending',  -- pending | running | success | failed | timeout
  error_msg   text,
  retry_count int  not null default 0,           -- retry_policy.retry_attempts = 3

  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int
);

create index idx_agent_exec_agent   on public.ai_agent_executions(agent_id);
create index idx_agent_exec_project on public.ai_agent_executions(project_id);
create index idx_agent_exec_status  on public.ai_agent_executions(status);
