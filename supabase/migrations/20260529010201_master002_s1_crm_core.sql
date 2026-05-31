-- PACOTE MASTER 002-S1
-- CRM Core: pipeline_stages + opportunities

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  stage_order int not null,
  is_closed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipeline_stages_order on public.pipeline_stages(stage_order);
create index if not exists idx_pipeline_stages_active on public.pipeline_stages(is_active);

insert into public.pipeline_stages (code, label, stage_order, is_closed, is_active)
values
  ('prospecting', 'Prospecting', 10, false, true),
  ('qualification', 'Qualification', 20, false, true),
  ('proposal', 'Proposal', 30, false, true),
  ('proposal_review', 'Proposal Review', 40, false, true),
  ('negotiation', 'Negotiation', 50, false, true),
  ('won', 'Won', 60, true, true),
  ('lost', 'Lost', 70, true, true)
on conflict (code) do update
set
  label = excluded.label,
  stage_order = excluded.stage_order,
  is_closed = excluded.is_closed,
  is_active = excluded.is_active;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  client_id uuid references public.clients(id),
  project_id uuid references public.projects(id),
  title text not null,
  stage_id uuid not null references public.pipeline_stages(id),
  value numeric(15,2),
  currency_code text not null default 'BRL',
  probability int not null default 0 check (probability between 0 and 100),
  status text not null default 'open' check (status in ('open','won','lost')),
  owner_user_id uuid references public.profiles(id) default auth.uid(),
  close_date date,
  loss_reason text,
  country_code text not null default 'BR',
  market_region text not null default 'LATAM',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opportunities_lead on public.opportunities(lead_id);
create index if not exists idx_opportunities_stage on public.opportunities(stage_id);
create index if not exists idx_opportunities_owner on public.opportunities(owner_user_id);
create index if not exists idx_opportunities_status on public.opportunities(status);
create index if not exists idx_opportunities_region on public.opportunities(country_code, market_region);
create index if not exists idx_opportunities_project on public.opportunities(project_id);

alter table public.pipeline_stages enable row level security;
alter table public.opportunities enable row level security;

drop policy if exists "pipeline_stages_select_authenticated" on public.pipeline_stages;
create policy "pipeline_stages_select_authenticated"
  on public.pipeline_stages for select
  to authenticated
  using (true);

drop policy if exists "pipeline_stages_manage_elevated" on public.pipeline_stages;
create policy "pipeline_stages_manage_elevated"
  on public.pipeline_stages for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

drop policy if exists "opportunities_select_scoped" on public.opportunities;
create policy "opportunities_select_scoped"
  on public.opportunities for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
    or (
      project_id is not null
      and exists (
        select 1
        from public.project_members pm
        where pm.project_id = opportunities.project_id
          and pm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "opportunities_insert_scoped" on public.opportunities;
create policy "opportunities_insert_scoped"
  on public.opportunities for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (owner_user_id is null or owner_user_id = auth.uid())
  );

drop policy if exists "opportunities_update_scoped" on public.opportunities;
create policy "opportunities_update_scoped"
  on public.opportunities for update
  to authenticated
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

drop policy if exists "opportunities_delete_scoped" on public.opportunities;
create policy "opportunities_delete_scoped"
  on public.opportunities for delete
  to authenticated
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );
