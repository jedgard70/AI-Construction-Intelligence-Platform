-- PACOTE MASTER 002-S3
-- Proposal Engine: proposals + proposal_items (idempotent for partial environments)

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid()
);

alter table public.proposals add column if not exists opportunity_id uuid;
alter table public.proposals add column if not exists proposal_code text;
alter table public.proposals add column if not exists title text;
alter table public.proposals add column if not exists proposal_type text;
alter table public.proposals add column if not exists status text default 'draft';
alter table public.proposals add column if not exists version_number int default 1;
alter table public.proposals add column if not exists parent_proposal_id uuid;
alter table public.proposals add column if not exists total_value numeric(15,2);
alter table public.proposals add column if not exists currency_code text default 'BRL';
alter table public.proposals add column if not exists issued_at timestamptz;
alter table public.proposals add column if not exists valid_until date;
alter table public.proposals add column if not exists pdf_path text;
alter table public.proposals add column if not exists created_by uuid default auth.uid();
alter table public.proposals add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.proposals add column if not exists created_at timestamptz default now();
alter table public.proposals add column if not exists updated_at timestamptz default now();

update public.proposals
set
  proposal_code = coalesce(nullif(trim(proposal_code), ''), 'PROP-' || left(id::text, 8)),
  title = coalesce(nullif(trim(title), ''), 'Untitled Proposal'),
  proposal_type = coalesce(nullif(trim(proposal_type), ''), 'consulting'),
  status = coalesce(nullif(trim(status), ''), 'draft'),
  version_number = coalesce(version_number, 1),
  currency_code = coalesce(nullif(trim(currency_code), ''), 'BRL'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  proposal_code is null
  or btrim(proposal_code) = ''
  or title is null
  or btrim(title) = ''
  or proposal_type is null
  or btrim(proposal_type) = ''
  or status is null
  or btrim(status) = ''
  or version_number is null
  or currency_code is null
  or btrim(currency_code) = ''
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.proposals alter column proposal_code set not null;
alter table public.proposals alter column title set not null;
alter table public.proposals alter column proposal_type set not null;
alter table public.proposals alter column status set default 'draft';
alter table public.proposals alter column status set not null;
alter table public.proposals alter column version_number set default 1;
alter table public.proposals alter column version_number set not null;
alter table public.proposals alter column currency_code set default 'BRL';
alter table public.proposals alter column currency_code set not null;
alter table public.proposals alter column created_by set default auth.uid();
alter table public.proposals alter column metadata set default '{}'::jsonb;
alter table public.proposals alter column metadata set not null;
alter table public.proposals alter column created_at set default now();
alter table public.proposals alter column created_at set not null;
alter table public.proposals alter column updated_at set default now();
alter table public.proposals alter column updated_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proposals_status_check')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposals'::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ilike '%draft%'
         and pg_get_constraintdef(c.oid) ilike '%sent%'
         and pg_get_constraintdef(c.oid) ilike '%viewed%'
         and pg_get_constraintdef(c.oid) ilike '%approved%'
         and pg_get_constraintdef(c.oid) ilike '%rejected%'
         and pg_get_constraintdef(c.oid) ilike '%expired%'
     ) then
    alter table public.proposals add constraint proposals_status_check check (status in ('draft','sent','viewed','approved','rejected','expired'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_opportunity_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposals'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (opportunity_id)%REFERENCES public.opportunities(id)%'
     ) then
    alter table public.proposals add constraint proposals_opportunity_id_fkey foreign key (opportunity_id) references public.opportunities(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_parent_proposal_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposals'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (parent_proposal_id)%REFERENCES public.proposals(id)%'
     ) then
    alter table public.proposals add constraint proposals_parent_proposal_id_fkey foreign key (parent_proposal_id) references public.proposals(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_created_by_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposals'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (created_by)%REFERENCES public.profiles(id)%'
     ) then
    alter table public.proposals add constraint proposals_created_by_fkey foreign key (created_by) references public.profiles(id);
  end if;
end $$;

create unique index if not exists uq_proposals_code on public.proposals(proposal_code);
create index if not exists idx_proposals_opportunity on public.proposals(opportunity_id);
create index if not exists idx_proposals_status on public.proposals(status);
create index if not exists idx_proposals_code on public.proposals(proposal_code);

create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid()
);

alter table public.proposal_items add column if not exists proposal_id uuid;
alter table public.proposal_items add column if not exists service_id uuid;
alter table public.proposal_items add column if not exists source_opportunity_service_id uuid;
alter table public.proposal_items add column if not exists service_code text;
alter table public.proposal_items add column if not exists service_name text;
alter table public.proposal_items add column if not exists category text;
alter table public.proposal_items add column if not exists quantity numeric(12,2) default 1;
alter table public.proposal_items add column if not exists unit text default 'package';
alter table public.proposal_items add column if not exists unit_price numeric(15,2) default 0;
alter table public.proposal_items add column if not exists currency_code text default 'BRL';
alter table public.proposal_items add column if not exists discount_pct numeric(5,2) default 0;
alter table public.proposal_items add column if not exists line_total numeric(15,2);
alter table public.proposal_items add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.proposal_items add column if not exists created_at timestamptz default now();
alter table public.proposal_items add column if not exists updated_at timestamptz default now();

update public.proposal_items
set
  service_code = coalesce(nullif(trim(service_code), ''), 'service-item'),
  service_name = coalesce(nullif(trim(service_name), ''), 'Unnamed Service'),
  quantity = coalesce(quantity, 1),
  unit = coalesce(nullif(trim(unit), ''), 'package'),
  unit_price = coalesce(unit_price, 0),
  currency_code = coalesce(nullif(trim(currency_code), ''), 'BRL'),
  discount_pct = coalesce(discount_pct, 0),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  service_code is null
  or btrim(service_code) = ''
  or service_name is null
  or btrim(service_name) = ''
  or quantity is null
  or unit is null
  or btrim(unit) = ''
  or unit_price is null
  or currency_code is null
  or btrim(currency_code) = ''
  or discount_pct is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.proposal_items alter column service_code set not null;
alter table public.proposal_items alter column service_name set not null;
alter table public.proposal_items alter column quantity set default 1;
alter table public.proposal_items alter column quantity set not null;
alter table public.proposal_items alter column unit set default 'package';
alter table public.proposal_items alter column unit set not null;
alter table public.proposal_items alter column unit_price set default 0;
alter table public.proposal_items alter column unit_price set not null;
alter table public.proposal_items alter column currency_code set default 'BRL';
alter table public.proposal_items alter column currency_code set not null;
alter table public.proposal_items alter column discount_pct set default 0;
alter table public.proposal_items alter column discount_pct set not null;
alter table public.proposal_items alter column metadata set default '{}'::jsonb;
alter table public.proposal_items alter column metadata set not null;
alter table public.proposal_items alter column created_at set default now();
alter table public.proposal_items alter column created_at set not null;
alter table public.proposal_items alter column updated_at set default now();
alter table public.proposal_items alter column updated_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proposal_items_proposal_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposal_items'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (proposal_id)%REFERENCES public.proposals(id)%'
     ) then
    alter table public.proposal_items add constraint proposal_items_proposal_id_fkey foreign key (proposal_id) references public.proposals(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposal_items_service_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposal_items'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (service_id)%REFERENCES public.services_catalog(id)%'
     ) then
    alter table public.proposal_items add constraint proposal_items_service_id_fkey foreign key (service_id) references public.services_catalog(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposal_items_source_opportunity_service_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.proposal_items'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (source_opportunity_service_id)%REFERENCES public.opportunity_services(id)%'
     ) then
    alter table public.proposal_items add constraint proposal_items_source_opportunity_service_id_fkey foreign key (source_opportunity_service_id) references public.opportunity_services(id);
  end if;
end $$;

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
