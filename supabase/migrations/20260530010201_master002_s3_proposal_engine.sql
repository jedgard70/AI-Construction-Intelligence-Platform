-- PACOTE MASTER 002-S3
-- Proposal Engine: proposals + proposal_items

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  proposal_code text not null unique,
  title text not null,
  proposal_type text not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','approved','rejected','expired')),
  version_number int not null default 1,
  parent_proposal_id uuid null references public.proposals(id),
  total_value numeric(15,2) null,
  currency_code text not null default 'BRL',
  issued_at timestamptz null,
  valid_until date null,
  pdf_path text null,
  created_by uuid not null references public.profiles(id) default auth.uid(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_opportunity on public.proposals(opportunity_id);
create index if not exists idx_proposals_status on public.proposals(status);
create index if not exists idx_proposals_code on public.proposals(proposal_code);

create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  service_id uuid null references public.services_catalog(id),
  source_opportunity_service_id uuid null references public.opportunity_services(id),
  service_code text not null,
  service_name text not null,
  category text null,
  quantity numeric(12,2) not null default 1,
  unit text not null default 'package',
  unit_price numeric(15,2) not null default 0,
  currency_code text not null default 'BRL',
  discount_pct numeric(5,2) not null default 0,
  line_total numeric(15,2) null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposal_items_proposal on public.proposal_items(proposal_id);
create index if not exists idx_proposal_items_service on public.proposal_items(service_id);

alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;

drop policy if exists "proposals_select_scoped" on public.proposals;
create policy "proposals_select_scoped"
  on public.proposals for select
  to authenticated
  using (
    exists (
      select 1
      from public.opportunities o
      where o.id = proposals.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
          or (
            o.project_id is not null and exists (
              select 1 from public.project_members pm where pm.project_id = o.project_id and pm.user_id = auth.uid()
            )
          )
        )
    )
  );

drop policy if exists "proposals_insert_scoped" on public.proposals;
create policy "proposals_insert_scoped"
  on public.proposals for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "proposals_update_scoped" on public.proposals;
create policy "proposals_update_scoped"
  on public.proposals for update
  to authenticated
  using (
    created_by = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  )
  with check (
    created_by = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

drop policy if exists "proposal_items_select_scoped" on public.proposal_items;
create policy "proposal_items_select_scoped"
  on public.proposal_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.proposals p
      join public.opportunities o on o.id = p.opportunity_id
      where p.id = proposal_items.proposal_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1 from public.profiles pf where pf.id = auth.uid() and pf.role in ('diretor_executivo', 'coordenador_projetos')
          )
          or (
            o.project_id is not null and exists (
              select 1 from public.project_members pm where pm.project_id = o.project_id and pm.user_id = auth.uid()
            )
          )
        )
    )
  );

drop policy if exists "proposal_items_write_scoped" on public.proposal_items;
create policy "proposal_items_write_scoped"
  on public.proposal_items for all
  to authenticated
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_items.proposal_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from public.profiles pf where pf.id = auth.uid() and pf.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_items.proposal_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from public.profiles pf where pf.id = auth.uid() and pf.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  );
