-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 011: Revenue Engine
-- PACOTE MASTER 002-S5
-- Fluxo: Contract signed → Revenue record → Installments → Payment → Dashboard
-- ══════════════════════════════════════════════════════════════════════════════

-- ── ENUMs ─────────────────────────────────────────────────────────────────────

create type if not exists public.revenue_status as enum (
  'forecast',
  'contracted',
  'invoiced',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

create type if not exists public.installment_status as enum (
  'pending',
  'paid',
  'overdue',
  'cancelled'
);

create type if not exists public.revenue_currency as enum (
  'BRL',
  'USD',
  'EUR'
);

-- ── 11.1  Revenue Records ─────────────────────────────────────────────────────
-- Nasce de um contrato assinado; suporta forecast pré-contrato.

create table if not exists public.revenue_records (
  id                  uuid primary key default gen_random_uuid(),

  -- Relacionamentos (todos opcionais para suportar forecast)
  contract_id         uuid,   -- FK lógica: contracts.id (tabela pode não existir ainda)
  proposal_id         uuid,   -- FK lógica: proposals.id
  opportunity_id      uuid,   -- FK lógica: opportunities.id
  client_id           uuid references public.clients(id) on delete set null,
  project_id          uuid references public.projects(id) on delete set null,

  -- Identificação
  title               text not null,
  description         text,
  reference_code      text unique,  -- ex: REV-2026-001

  -- Status do ciclo de receita
  status              public.revenue_status not null default 'forecast',

  -- Moeda
  currency            public.revenue_currency not null default 'BRL',

  -- Valores
  amount_forecast     numeric(18,2) not null default 0,   -- previsto (pré-contrato)
  amount_contracted   numeric(18,2) not null default 0,   -- contratado (pós-assinatura)
  amount_invoiced     numeric(18,2) not null default 0,   -- faturado
  amount_received     numeric(18,2) not null default 0,   -- recebido

  -- Datas
  expected_close_date date,                               -- previsão de fechamento
  contract_signed_date date,                              -- data de assinatura
  first_invoice_date  date,
  last_payment_date   date,

  -- Parcelamento
  installments_count  int not null default 1,
  installments_generated boolean not null default false,

  -- Auditoria/histórico (append-only via trigger ou application layer)
  change_log          jsonb not null default '[]',

  -- Metadados
  tags                text[] not null default '{}',
  notes               text,
  metadata            jsonb not null default '{}',

  -- Controle
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.revenue_records is
  'Registros de receita do ciclo commercial: forecast → contracted → invoiced → paid';

create index if not exists idx_revenue_records_status      on public.revenue_records(status);
create index if not exists idx_revenue_records_client      on public.revenue_records(client_id);
create index if not exists idx_revenue_records_project     on public.revenue_records(project_id);
create index if not exists idx_revenue_records_contract    on public.revenue_records(contract_id);
create index if not exists idx_revenue_records_currency    on public.revenue_records(currency);
create index if not exists idx_revenue_records_close_date  on public.revenue_records(expected_close_date);
create index if not exists idx_revenue_records_signed_date on public.revenue_records(contract_signed_date);
create index if not exists idx_revenue_records_tags        on public.revenue_records using gin(tags);
create index if not exists idx_revenue_records_created_by  on public.revenue_records(created_by);

create or replace trigger trg_revenue_records_updated_at
  before update on public.revenue_records
  for each row execute procedure public.set_updated_at();


-- ── 11.2  Revenue Installments ────────────────────────────────────────────────

create table if not exists public.revenue_installments (
  id                  uuid primary key default gen_random_uuid(),
  revenue_record_id   uuid not null references public.revenue_records(id) on delete cascade,

  installment_number  int not null,
  due_date            date not null,

  -- Valores
  currency            public.revenue_currency not null default 'BRL',
  amount              numeric(18,2) not null,
  amount_paid         numeric(18,2) not null default 0,

  -- Status
  status              public.installment_status not null default 'pending',

  -- Pagamento
  paid_date           date,
  payment_method      text,   -- pix, ted, boleto, cheque, dinheiro, outro

  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (revenue_record_id, installment_number)
);

comment on table public.revenue_installments is
  'Parcelas de um registro de receita com controle de pagamento individual';

create index if not exists idx_rev_inst_record   on public.revenue_installments(revenue_record_id);
create index if not exists idx_rev_inst_due_date on public.revenue_installments(due_date);
create index if not exists idx_rev_inst_status   on public.revenue_installments(status);

create or replace trigger trg_revenue_installments_updated_at
  before update on public.revenue_installments
  for each row execute procedure public.set_updated_at();


-- ── 11.3  Revenue Events (auditoria imutável) ─────────────────────────────────

create table if not exists public.revenue_events (
  id                  uuid primary key default gen_random_uuid(),
  revenue_record_id   uuid not null references public.revenue_records(id) on delete cascade,
  installment_id      uuid references public.revenue_installments(id) on delete set null,

  event_type          text not null,   -- status_changed | installment_paid | amount_updated
                                       -- | contract_signed | invoice_issued | note_added
  from_status         text,
  to_status           text,
  amount_delta        numeric(18,2),   -- variação de valor, se aplicável
  payload             jsonb not null default '{}',

  performed_by        uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

comment on table public.revenue_events is
  'Log de eventos imutável para auditoria do ciclo de receita';

create index if not exists idx_rev_events_record  on public.revenue_events(revenue_record_id);
create index if not exists idx_rev_events_type    on public.revenue_events(event_type);
create index if not exists idx_rev_events_created on public.revenue_events(created_at desc);


-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.revenue_records      enable row level security;
alter table public.revenue_installments enable row level security;
alter table public.revenue_events       enable row level security;

-- Revenue Records: leitura por autenticados, gestão por gestor_financeiro/diretor
create policy "revenue_records: autenticados leem"
  on public.revenue_records for select
  using (auth.uid() is not null);

create policy "revenue_records: gestor/diretor criam"
  on public.revenue_records for insert
  with check (
    auth.uid() is not null and
    public.current_role_acip() in ('gestor_financeiro', 'diretor_executivo')
  );

create policy "revenue_records: gestor/diretor atualizam"
  on public.revenue_records for update
  using (
    auth.uid() is not null and
    public.current_role_acip() in ('gestor_financeiro', 'diretor_executivo')
  );

create policy "revenue_records: somente diretor deleta"
  on public.revenue_records for delete
  using (public.current_role_acip() = 'diretor_executivo');

-- Installments: seguem o record
create policy "revenue_installments: autenticados leem"
  on public.revenue_installments for select
  using (auth.uid() is not null);

create policy "revenue_installments: gestor/diretor gerenciam"
  on public.revenue_installments for all
  using (
    auth.uid() is not null and
    public.current_role_acip() in ('gestor_financeiro', 'diretor_executivo')
  );

-- Events: leitura por autenticados, inserção por gestor/diretor, imutável
create policy "revenue_events: autenticados leem"
  on public.revenue_events for select
  using (auth.uid() is not null);

create policy "revenue_events: gestor/diretor registram"
  on public.revenue_events for insert
  with check (
    auth.uid() is not null and
    public.current_role_acip() in ('gestor_financeiro', 'diretor_executivo')
  );

create policy "revenue_events: imutável — sem update"
  on public.revenue_events for update
  using (false);

create policy "revenue_events: imutável — sem delete"
  on public.revenue_events for delete
  using (false);
