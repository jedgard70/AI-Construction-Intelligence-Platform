-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 010: Autonomous Runtime Tables
-- Fila de tarefas autônomas, base de conhecimento RAG, governança de prompts
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 10.1  Fila de tarefas autônomas ──────────────────────────────────────────
-- Persiste tarefas entre cold starts do Vercel. O agent-loop as processa.
create table if not exists public.agent_tasks (
  id              text primary key default gen_random_uuid()::text,
  tenant_id       text not null default 'default',
  project_id      uuid references public.projects(id) on delete cascade,

  -- Definição da tarefa
  task            text not null,
  task_type       text not null default 'general',   -- general | monitoring | alert | report | action
  context         jsonb not null default '{}',
  priority        integer not null default 5,         -- 1 (baixo) … 10 (crítico)

  -- Execução
  status          text not null default 'pending',    -- pending | running | done | failed | cancelled
  agent_ids       text[] not null default '{}',       -- agentes que executaram
  result          jsonb,
  error           text,
  retry_count     integer not null default 0,
  max_retries     integer not null default 3,

  -- Agendamento
  scheduled_for   timestamptz not null default now(),
  recurring_cron  text,                               -- ex: '0 8 * * *' para diário às 8h
  next_run_at     timestamptz,

  -- Rastreabilidade
  triggered_by    text not null default 'system',     -- 'system' | 'user:uuid' | 'agent:name'
  trace_id        text,

  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  duration_ms     integer
);

create index idx_agent_tasks_status   on public.agent_tasks(status);
create index idx_agent_tasks_project  on public.agent_tasks(project_id);
create index idx_agent_tasks_sched    on public.agent_tasks(scheduled_for) where status = 'pending';
create index idx_agent_tasks_tenant   on public.agent_tasks(tenant_id);

comment on table public.agent_tasks is
  'Fila de tarefas autônomas processadas pelo agent-loop. Sobrevive a cold starts.';


-- ── 10.2  Base de conhecimento RAG ────────────────────────────────────────────
-- Documentos chunked com embeddings (JSONB). pg_trgm para full-text fallback.
create table if not exists public.knowledge_chunks (
  id          text primary key,
  doc_id      text not null,
  project_id  uuid references public.projects(id) on delete cascade,
  tenant_id   text not null default 'default',

  text        text not null,
  embedding   jsonb,            -- float[] como JSON array (768-dim Gemini)
  metadata    jsonb not null default '{}',
  token_count integer,

  created_at  timestamptz not null default now()
);

create index idx_knowledge_doc    on public.knowledge_chunks(doc_id);
create index idx_knowledge_tenant on public.knowledge_chunks(tenant_id);
create index idx_knowledge_text   on public.knowledge_chunks using gin(to_tsvector('portuguese', text));

comment on table public.knowledge_chunks is
  'Chunks de documentos com embeddings Gemini. Suporte a RAG semântico e full-text.';


-- ── 10.3  Versões de prompts ───────────────────────────────────────────────────
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
  metrics        jsonb not null default '{
    "uses": 0,
    "avgLatencyMs": 0,
    "avgConfidence": 0,
    "hallucinationRate": 0,
    "successRate": 0,
    "avgOutputTokens": 0
  }',
  created_at     timestamptz not null default now()
);

create index idx_prompt_key    on public.prompt_versions(prompt_key);
create index idx_prompt_active on public.prompt_versions(prompt_key, active) where active = true;

comment on table public.prompt_versions is
  'Versionamento de prompts de agentes. Suporte a rollback e A/B testing.';


-- ── 10.4  Alertas autônomos ────────────────────────────────────────────────────
create table if not exists public.autonomous_alerts (
  id          text primary key default gen_random_uuid()::text,
  project_id  uuid references public.projects(id) on delete cascade,
  tenant_id   text not null default 'default',

  type        text not null,             -- 'budget_overrun' | 'schedule_delay' | 'safety' | 'quality' | 'anomaly'
  severity    public.error_severity not null default 'medio',
  title       text not null,
  description text not null,
  data        jsonb not null default '{}',

  -- Ação autônoma tomada (se houver)
  auto_action_taken   boolean not null default false,
  auto_action_result  jsonb,

  -- Resolução
  status      text not null default 'open',  -- open | acknowledged | resolved | dismissed
  resolved_by text,
  resolved_at timestamptz,

  created_at  timestamptz not null default now()
);

create index idx_alerts_project on public.autonomous_alerts(project_id);
create index idx_alerts_status  on public.autonomous_alerts(status) where status = 'open';
create index idx_alerts_tenant  on public.autonomous_alerts(tenant_id);

comment on table public.autonomous_alerts is
  'Alertas gerados autonomamente pelo agent-loop com ações automáticas.';


-- ── 10.5  Estado do Digital Twin ──────────────────────────────────────────────
create table if not exists public.site_states (
  project_id            uuid primary key references public.projects(id) on delete cascade,
  elements              jsonb not null default '{}',
  iot_events            jsonb not null default '[]',
  overall_progress      numeric(5,2) not null default 0,
  active_alerts         jsonb not null default '[]',
  resource_utilization  jsonb not null default '{"workers":0,"equipment":0,"materials":0}',
  simulation_results    jsonb not null default '[]',
  last_sync             timestamptz not null default now()
);

comment on table public.site_states is
  'Estado em tempo real do Digital Twin por projeto.';


-- ── 10.6  Função: resgatar próximas tarefas para o agent-loop ─────────────────
create or replace function public.claim_pending_tasks(p_limit int default 10)
returns setof public.agent_tasks
language plpgsql as $$
begin
  return query
    update public.agent_tasks
    set status = 'running', started_at = now()
    where id in (
      select id from public.agent_tasks
      where status = 'pending'
        and scheduled_for <= now()
      order by priority desc, scheduled_for asc
      limit p_limit
      for update skip locked   -- suporte a múltiplos workers
    )
    returning *;
end;
$$;
