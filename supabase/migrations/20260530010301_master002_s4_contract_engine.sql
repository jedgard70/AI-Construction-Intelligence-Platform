-- PACOTE MASTER 002-S4
-- Contract Engine: contracts + contract_items

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid()
);

alter table public.contracts add column if not exists proposal_id uuid;
alter table public.contracts add column if not exists opportunity_id uuid;
alter table public.contracts add column if not exists client_id uuid;
alter table public.contracts add column if not exists project_id uuid;
alter table public.contracts add column if not exists contract_code text;
alter table public.contracts add column if not exists title text;
alter table public.contracts add column if not exists status text default 'draft';
alter table public.contracts add column if not exists version_number int default 1;
alter table public.contracts add column if not exists parent_contract_id uuid;
alter table public.contracts add column if not exists signed_at timestamptz;
alter table public.contracts add column if not exists effective_start_date date;
alter table public.contracts add column if not exists effective_end_date date;
alter table public.contracts add column if not exists total_value numeric(15,2);
alter table public.contracts add column if not exists currency_code text default 'BRL';
alter table public.contracts add column if not exists terms_markdown text;
alter table public.contracts add column if not exists pdf_path text;
alter table public.contracts add column if not exists created_by uuid default auth.uid();
alter table public.contracts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.contracts add column if not exists created_at timestamptz not null default now();
alter table public.contracts add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_contracts_code_unique on public.contracts(contract_code) where contract_code is not null;
create index if not exists idx_contracts_proposal on public.contracts(proposal_id);
create index if not exists idx_contracts_opportunity on public.contracts(opportunity_id);
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_contracts_project on public.contracts(project_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_code on public.contracts(contract_code);

create table if not exists public.contract_items (
  id uuid primary key default gen_random_uuid()
);

alter table public.contract_items add column if not exists contract_id uuid;
alter table public.contract_items add column if not exists proposal_item_id uuid;
alter table public.contract_items add column if not exists service_code text;
alter table public.contract_items add column if not exists service_name text;
alter table public.contract_items add column if not exists quantity numeric(12,2) default 1;
alter table public.contract_items add column if not exists unit text default 'package';
alter table public.contract_items add column if not exists unit_price numeric(15,2) default 0;
alter table public.contract_items add column if not exists currency_code text default 'BRL';
alter table public.contract_items add column if not exists discount_pct numeric(5,2) default 0;
alter table public.contract_items add column if not exists line_total numeric(15,2);
alter table public.contract_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.contract_items add column if not exists created_at timestamptz not null default now();
alter table public.contract_items add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_contract_items_contract on public.contract_items(contract_id);
create index if not exists idx_contract_items_service_code on public.contract_items(service_code);

alter table public.contracts enable row level security;
alter table public.contract_items enable row level security;

drop policy if exists "contracts_select_scoped" on public.contracts;
create policy "contracts_select_scoped"
  on public.contracts for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
    or (
      project_id is not null and exists (
        select 1 from public.project_members pm
        where pm.project_id = contracts.project_id and pm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "contracts_insert_scoped" on public.contracts;
create policy "contracts_insert_scoped"
  on public.contracts for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "contracts_update_scoped" on public.contracts;
create policy "contracts_update_scoped"
  on public.contracts for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

drop policy if exists "contract_items_select_scoped" on public.contract_items;
create policy "contract_items_select_scoped"
  on public.contract_items for select
  to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_items.contract_id
        and (
          c.created_by = auth.uid()
          or exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
          or (
            c.project_id is not null and exists (
              select 1 from public.project_members pm where pm.project_id = c.project_id and pm.user_id = auth.uid()
            )
          )
        )
    )
  );

drop policy if exists "contract_items_write_scoped" on public.contract_items;
create policy "contract_items_write_scoped"
  on public.contract_items for all
  to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_items.contract_id
        and (
          c.created_by = auth.uid()
          or exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_items.contract_id
        and (
          c.created_by = auth.uid()
          or exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  );
