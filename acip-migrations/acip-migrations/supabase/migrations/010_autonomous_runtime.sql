-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 010: Autonomous Runtime
-- Cole este SQL inteiro no Supabase → SQL Editor → Run
-- Funciona com ou sem as migrations anteriores (001–009)
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensão necessária (já ativa se migration 001 foi rodada)
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Enum de severidade (idempotente — não recria se já existe)
do $$ begin
  create type public.error_severity as enum ('baixo', 'medio', 'alto', 'critico');
exception when duplicate_object then null;
end $$;

-- ── 10.1  Fila de tarefas autônomas ──────────────────────────────────────────
create table if not exists public.agent_tasks (
  id              text primary key default gen_random_uuid()::text,
  tenant_id       text        not null default 'default',
  project_id      uuid,                                    -- FK opcional (sem constraint rígida)

  task            text        not null,
  task_type       text        not null default 'general',
  context         jsonb       not null default '{}',
  priority        integer     not null default 5,

  status          text        not null default 'pending',
  agent_ids       text[]      not null default '{}',
  result          jsonb,
  error           text,
  retry_count     integer     not null default 0,
  max_retries     integer     not null default 3,

  scheduled_for   timestamptz not null default now(),
  recurring_cron  text,
  next_run_at     timestamptz,

  triggered_by    text        not null default 'system',
  trace_id        text,

  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  duration_ms     integer
);

create index if not exists idx_agent_tasks_status  on public.agent_tasks(status);
create index if not exists idx_agent_tasks_project on public.agent_tasks(project_id);
create index if not exists idx_agent_tasks_sched   on public.agent_tasks(scheduled_for)
  where status = 'pending';
create index if not exists idx_agent_tasks_tenant  on public.agent_tasks(tenant_id);


-- ── 10.2  Base de conhecimento RAG ───────────────────────────────────────────
create table if not exists public.knowledge_chunks (
  id          text        primary key,
  doc_id      text        not null,
  project_id  uuid,
  tenant_id   text        not null default 'default',
  text        text        not null,
  embedding   jsonb,
  metadata    jsonb       not null default '{}',
  token_count integer,
  created_at  timestamptz not null default now()
);

create index if not exists idx_knowledge_doc    on public.knowledge_chunks(doc_id);
create index if not exists idx_knowledge_tenant on public.knowledge_chunks(tenant_id);
create index if not exists idx_knowledge_fts
  on public.knowledge_chunks
  using gin(to_tsvector('portuguese', text));


-- ── 10.3  Versões de prompts ──────────────────────────────────────────────────
create table if not exists public.prompt_versions (
  id             text        primary key,
  prompt_key     text        not null,
  version        text        not null,
  content        text        not null,
  system_content text,
  description    text,
  author         text,
  tags           text[]      not null default '{}',
  active         boolean     not null default false,
  metrics        jsonb       not null default '{"uses":0,"avgLatencyMs":0,"avgConfidence":0,"hallucinationRate":0,"successRate":0,"avgOutputTokens":0}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_prompt_key    on public.prompt_versions(prompt_key);
create index if not exists idx_prompt_active on public.prompt_versions(prompt_key, active)
  where active = true;


-- ── 10.4  Alertas autônomos ───────────────────────────────────────────────────
create table if not exists public.autonomous_alerts (
  id                  text                   primary key default gen_random_uuid()::text,
  project_id          uuid,
  tenant_id           text                   not null default 'default',
  type                text                   not null,
  severity            public.error_severity  not null default 'medio',
  title               text                   not null,
  description         text                   not null,
  data                jsonb                  not null default '{}',
  auto_action_taken   boolean                not null default false,
  auto_action_result  jsonb,
  status              text                   not null default 'open',
  resolved_by         text,
  resolved_at         timestamptz,
  created_at          timestamptz            not null default now()
);

create index if not exists idx_alerts_project on public.autonomous_alerts(project_id);
create index if not exists idx_alerts_status  on public.autonomous_alerts(status)
  where status = 'open';
create index if not exists idx_alerts_tenant  on public.autonomous_alerts(tenant_id);


-- ── 10.5  Estado do Digital Twin ─────────────────────────────────────────────
create table if not exists public.site_states (
  project_id            uuid        primary key,
  elements              jsonb       not null default '{}',
  iot_events            jsonb       not null default '[]',
  overall_progress      numeric(5,2) not null default 0,
  active_alerts         jsonb       not null default '[]',
  resource_utilization  jsonb       not null default '{"workers":0,"equipment":0,"materials":0}',
  simulation_results    jsonb       not null default '[]',
  last_sync             timestamptz not null default now()
);


-- ── 10.6  Memória persistente de agentes (caso memory_long_term não exista) ───
create table if not exists public.agent_memory (
  key        text        primary key,
  value      jsonb       not null,
  project_id uuid,
  updated_at timestamptz not null default now()
);


-- ── 10.7  Função claim_pending_tasks (atômica, multi-worker safe) ─────────────
create or replace function public.claim_pending_tasks(p_limit int default 10)
returns setof public.agent_tasks
language plpgsql as $$
begin
  return query
    update public.agent_tasks
       set status     = 'running',
           started_at = now()
     where id in (
       select id
         from public.agent_tasks
        where status        = 'pending'
          and scheduled_for <= now()
        order by priority desc, scheduled_for asc
        limit p_limit
          for update skip locked
     )
    returning *;
end;
$$;
