-- PACOTE MASTER 002-S1
-- CRM Core: pipeline_stages + opportunities (idempotent for partial environments)

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid()
);

alter table public.pipeline_stages add column if not exists code text;
alter table public.pipeline_stages add column if not exists label text;
alter table public.pipeline_stages add column if not exists stage_order int;
alter table public.pipeline_stages add column if not exists is_closed boolean default false;
alter table public.pipeline_stages add column if not exists is_active boolean default true;
alter table public.pipeline_stages add column if not exists created_at timestamptz default now();
alter table public.pipeline_stages add column if not exists updated_at timestamptz default now();

update public.pipeline_stages
set
  code = coalesce(nullif(trim(code), ''), 'stage-' || left(id::text, 8)),
  label = coalesce(nullif(trim(label), ''), 'Unnamed Stage'),
  stage_order = coalesce(stage_order, 0),
  is_closed = coalesce(is_closed, false),
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  code is null
  or btrim(code) = ''
  or label is null
  or btrim(label) = ''
  or stage_order is null
  or is_closed is null
  or is_active is null
  or created_at is null
  or updated_at is null;

alter table public.pipeline_stages alter column code set not null;
alter table public.pipeline_stages alter column label set not null;
alter table public.pipeline_stages alter column stage_order set not null;
alter table public.pipeline_stages alter column is_closed set default false;
alter table public.pipeline_stages alter column is_closed set not null;
alter table public.pipeline_stages alter column is_active set default true;
alter table public.pipeline_stages alter column is_active set not null;
alter table public.pipeline_stages alter column created_at set default now();
alter table public.pipeline_stages alter column created_at set not null;
alter table public.pipeline_stages alter column updated_at set default now();
alter table public.pipeline_stages alter column updated_at set not null;

create unique index if not exists uq_pipeline_stages_code on public.pipeline_stages(code);
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
  id uuid primary key default gen_random_uuid()
);

alter table public.opportunities add column if not exists lead_id uuid;
alter table public.opportunities add column if not exists client_id uuid;
alter table public.opportunities add column if not exists project_id uuid;
alter table public.opportunities add column if not exists title text;
alter table public.opportunities add column if not exists stage_id uuid;
alter table public.opportunities add column if not exists value numeric(15,2);
alter table public.opportunities add column if not exists currency_code text default 'BRL';
alter table public.opportunities add column if not exists probability int default 0;
alter table public.opportunities add column if not exists status text default 'open';
alter table public.opportunities add column if not exists owner_user_id uuid default auth.uid();
alter table public.opportunities add column if not exists close_date date;
alter table public.opportunities add column if not exists loss_reason text;
alter table public.opportunities add column if not exists country_code text default 'BR';
alter table public.opportunities add column if not exists market_region text default 'LATAM';
alter table public.opportunities add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.opportunities add column if not exists created_at timestamptz default now();
alter table public.opportunities add column if not exists updated_at timestamptz default now();

update public.opportunities
set
  title = coalesce(nullif(trim(title), ''), 'Untitled Opportunity'),
  currency_code = coalesce(nullif(trim(currency_code), ''), 'BRL'),
  probability = coalesce(probability, 0),
  status = coalesce(nullif(trim(status), ''), 'open'),
  country_code = coalesce(nullif(trim(country_code), ''), 'BR'),
  market_region = coalesce(nullif(trim(market_region), ''), 'LATAM'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  title is null
  or btrim(title) = ''
  or currency_code is null
  or btrim(currency_code) = ''
  or probability is null
  or status is null
  or btrim(status) = ''
  or country_code is null
  or btrim(country_code) = ''
  or market_region is null
  or btrim(market_region) = ''
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.opportunities alter column title set not null;
alter table public.opportunities alter column currency_code set default 'BRL';
alter table public.opportunities alter column currency_code set not null;
alter table public.opportunities alter column probability set default 0;
alter table public.opportunities alter column probability set not null;
alter table public.opportunities alter column status set default 'open';
alter table public.opportunities alter column status set not null;
alter table public.opportunities alter column owner_user_id set default auth.uid();
alter table public.opportunities alter column country_code set default 'BR';
alter table public.opportunities alter column country_code set not null;
alter table public.opportunities alter column market_region set default 'LATAM';
alter table public.opportunities alter column market_region set not null;
alter table public.opportunities alter column metadata set default '{}'::jsonb;
alter table public.opportunities alter column metadata set not null;
alter table public.opportunities alter column created_at set default now();
alter table public.opportunities alter column created_at set not null;
alter table public.opportunities alter column updated_at set default now();
alter table public.opportunities alter column updated_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_probability_check')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ilike '%probability%0%100%'
     ) then
    alter table public.opportunities add constraint opportunities_probability_check check (probability between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_status_check')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ilike '%status%'
         and pg_get_constraintdef(c.oid) ilike '%open%'
         and pg_get_constraintdef(c.oid) ilike '%won%'
         and pg_get_constraintdef(c.oid) ilike '%lost%'
     ) then
    alter table public.opportunities add constraint opportunities_status_check check (status in ('open','won','lost'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_lead_id_fkey')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (lead_id)%REFERENCES public.leads(id)%'
     ) then
    alter table public.opportunities add constraint opportunities_lead_id_fkey foreign key (lead_id) references public.leads(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_client_id_fkey')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (client_id)%REFERENCES public.clients(id)%'
     ) then
    alter table public.opportunities add constraint opportunities_client_id_fkey foreign key (client_id) references public.clients(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_project_id_fkey')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (project_id)%REFERENCES public.projects(id)%'
     ) then
    alter table public.opportunities add constraint opportunities_project_id_fkey foreign key (project_id) references public.projects(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_stage_id_fkey')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (stage_id)%REFERENCES public.pipeline_stages(id)%'
     ) then
    alter table public.opportunities add constraint opportunities_stage_id_fkey foreign key (stage_id) references public.pipeline_stages(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_owner_user_id_fkey')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunities'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (owner_user_id)%REFERENCES public.profiles(id)%'
     ) then
    alter table public.opportunities add constraint opportunities_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id);
  end if;
end $$;

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
