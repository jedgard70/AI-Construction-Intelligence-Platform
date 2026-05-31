-- PACOTE MASTER 002-E2E
-- Revenue Engine minimal operational migration for Supabase cloud

do $$
begin
  if not exists (select 1 from pg_type where typname = 'revenue_status') then
    create type public.revenue_status as enum (
      'forecast',
      'contracted',
      'invoiced',
      'partially_paid',
      'paid',
      'overdue',
      'cancelled'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'installment_status') then
    create type public.installment_status as enum ('pending', 'paid', 'overdue', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'revenue_currency') then
    create type public.revenue_currency as enum ('BRL', 'USD', 'EUR');
  end if;
end $$;

create table if not exists public.revenue_records (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid,
  proposal_id uuid,
  opportunity_id uuid,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  reference_code text unique,
  status public.revenue_status not null default 'forecast',
  currency public.revenue_currency not null default 'BRL',
  amount_forecast numeric(18,2) not null default 0,
  amount_contracted numeric(18,2) not null default 0,
  amount_invoiced numeric(18,2) not null default 0,
  amount_received numeric(18,2) not null default 0,
  expected_close_date date,
  contract_signed_date date,
  first_invoice_date date,
  last_payment_date date,
  installments_count int not null default 1,
  installments_generated boolean not null default false,
  change_log jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_installments (
  id uuid primary key default gen_random_uuid(),
  revenue_record_id uuid not null references public.revenue_records(id) on delete cascade,
  installment_number int not null,
  due_date date not null,
  currency public.revenue_currency not null default 'BRL',
  amount numeric(18,2) not null,
  amount_paid numeric(18,2) not null default 0,
  status public.installment_status not null default 'pending',
  paid_date date,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (revenue_record_id, installment_number)
);

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  revenue_record_id uuid not null references public.revenue_records(id) on delete cascade,
  installment_id uuid references public.revenue_installments(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  amount_delta numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_revenue_records_status on public.revenue_records(status);
create index if not exists idx_revenue_records_client on public.revenue_records(client_id);
create index if not exists idx_revenue_records_project on public.revenue_records(project_id);
create index if not exists idx_revenue_records_contract on public.revenue_records(contract_id);
create index if not exists idx_revenue_records_created_by on public.revenue_records(created_by);
create index if not exists idx_revenue_installments_record on public.revenue_installments(revenue_record_id);
create index if not exists idx_revenue_installments_due on public.revenue_installments(due_date);
create index if not exists idx_revenue_events_record on public.revenue_events(revenue_record_id);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    if not exists (select 1 from pg_trigger where tgname = 'trg_revenue_records_updated_at') then
      create trigger trg_revenue_records_updated_at
        before update on public.revenue_records
        for each row execute procedure public.set_updated_at();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'trg_revenue_installments_updated_at') then
      create trigger trg_revenue_installments_updated_at
        before update on public.revenue_installments
        for each row execute procedure public.set_updated_at();
    end if;
  end if;
end $$;

alter table public.revenue_records enable row level security;
alter table public.revenue_installments enable row level security;
alter table public.revenue_events enable row level security;

drop policy if exists "revenue_records_select_own" on public.revenue_records;
create policy "revenue_records_select_own"
  on public.revenue_records for select
  using (created_by = auth.uid());

drop policy if exists "revenue_records_insert_own" on public.revenue_records;
create policy "revenue_records_insert_own"
  on public.revenue_records for insert
  with check (auth.uid() is not null and (created_by is null or created_by = auth.uid()));

drop policy if exists "revenue_records_update_own" on public.revenue_records;
create policy "revenue_records_update_own"
  on public.revenue_records for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "revenue_records_delete_own" on public.revenue_records;
create policy "revenue_records_delete_own"
  on public.revenue_records for delete
  using (created_by = auth.uid());

drop policy if exists "revenue_installments_select_scoped" on public.revenue_installments;
create policy "revenue_installments_select_scoped"
  on public.revenue_installments for select
  using (
    exists (
      select 1
      from public.revenue_records rr
      where rr.id = revenue_installments.revenue_record_id
        and rr.created_by = auth.uid()
    )
  );

drop policy if exists "revenue_installments_write_scoped" on public.revenue_installments;
create policy "revenue_installments_write_scoped"
  on public.revenue_installments for all
  using (
    exists (
      select 1
      from public.revenue_records rr
      where rr.id = revenue_installments.revenue_record_id
        and rr.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.revenue_records rr
      where rr.id = revenue_installments.revenue_record_id
        and rr.created_by = auth.uid()
    )
  );

drop policy if exists "revenue_events_select_scoped" on public.revenue_events;
create policy "revenue_events_select_scoped"
  on public.revenue_events for select
  using (
    exists (
      select 1
      from public.revenue_records rr
      where rr.id = revenue_events.revenue_record_id
        and rr.created_by = auth.uid()
    )
  );

drop policy if exists "revenue_events_insert_scoped" on public.revenue_events;
create policy "revenue_events_insert_scoped"
  on public.revenue_events for insert
  with check (
    exists (
      select 1
      from public.revenue_records rr
      where rr.id = revenue_events.revenue_record_id
        and rr.created_by = auth.uid()
    )
  );
