# PACOTE MASTER 002-A — Schema Supabase Final Consolidado

Data: 2026-05-29
Status: consolidado (sem gerar migrations SQL nesta etapa)

## Objetivo

Consolidar o modelo definitivo de CRM + Revenue Engine **sem duplicar** estruturas existentes de leads, vendas, CRM e contratos, incorporando:

1. Estágio `proposal_review` no pipeline.
2. Internacionalização de oportunidades (`country_code`, `market_region`).
3. Tipo de proposta (`proposal_type`).
4. Catálogo de serviços (`services_catalog`).
5. Venda de múltiplos serviços por oportunidade (`opportunity_services`).

## Princípios de Reaproveitamento (Sem Duplicação)

Tabelas existentes reutilizadas:

- `public.leads`
- `public.contracts`
- `public.projects`
- `public.clients`
- `public.documents`
- `public.agent_events`
- `public.project_members`
- `public.profiles`

Diretriz: **não recriar** tabelas equivalentes de CRM/Leads/Vendas/Contratos.

## Tabelas Novas (Definitivas)

### 1) `public.pipeline_stages`

Campos:

- `id uuid pk`
- `code text unique not null`
- `label text not null`
- `stage_order int not null`
- `is_closed boolean not null default false`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Estágios base:

- `prospecting`
- `qualification`
- `proposal`
- `proposal_review`
- `negotiation`
- `won`
- `lost`

### 2) `public.opportunities`

Campos:

- `id uuid pk`
- `lead_id uuid not null references leads(id)`
- `client_id uuid null references clients(id)`
- `project_id uuid null references projects(id)`
- `title text not null`
- `stage_id uuid not null references pipeline_stages(id)`
- `value numeric(15,2) null`
- `currency_code text not null default 'BRL'`
- `probability int not null default 0 check (probability between 0 and 100)`
- `status text not null default 'open' check (status in ('open','won','lost'))`
- `owner_user_id uuid null references profiles(id)`
- `close_date date null`
- `loss_reason text null`
- `country_code text not null default 'BR'`
- `market_region text not null default 'LATAM'`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 3) `public.opportunity_activities`

Campos:

- `id uuid pk`
- `opportunity_id uuid not null references opportunities(id) on delete cascade`
- `activity_type text not null`
- `summary text not null`
- `due_at timestamptz null`
- `done_at timestamptz null`
- `owner_user_id uuid null references profiles(id)`
- `created_by uuid not null references profiles(id)`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 4) `public.proposals`

Campos:

- `id uuid pk`
- `opportunity_id uuid not null references opportunities(id) on delete cascade`
- `contract_id uuid null references contracts(id)`
- `project_id uuid null references projects(id)`
- `document_id uuid null references documents(id)`
- `proposal_number text unique not null`
- `title text not null`
- `proposal_type text not null default 'service_package'`
- `status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired','converted'))`
- `total_value numeric(15,2) null`
- `currency_code text not null default 'BRL'`
- `valid_until date null`
- `created_by uuid not null references profiles(id)`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Domínio inicial recomendado para `proposal_type`:

- `service_package`
- `fixed_scope`
- `retainer`
- `change_order`
- `framework_agreement`

### 5) `public.services_catalog`

Campos:

- `id uuid pk`
- `service_code text unique not null`
- `name text not null`
- `description text null`
- `category text not null`
- `default_unit text not null default 'package'`
- `default_currency_code text not null default 'BRL'`
- `base_price numeric(15,2) null`
- `available_in_regions text[] not null default '{"LATAM","NA","EU"}'`
- `is_active boolean not null default true`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 6) `public.opportunity_services`

Campos:

- `id uuid pk`
- `opportunity_id uuid not null references opportunities(id) on delete cascade`
- `service_id uuid not null references services_catalog(id)`
- `quantity numeric(12,2) not null default 1`
- `unit text not null default 'package'`
- `unit_price numeric(15,2) not null default 0`
- `currency_code text not null default 'BRL'`
- `discount_pct numeric(5,2) not null default 0`
- `line_total numeric(15,2) null`
- `scope_notes text null`
- `is_primary boolean not null default false`
- `created_by uuid not null references profiles(id)`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique(opportunity_id, service_id)`

### 7) `public.campaign_runs`

Campos:

- `id uuid pk`
- `pipeline_run_id text unique not null`
- `project_id uuid null references projects(id)`
- `opportunity_id uuid null references opportunities(id)`
- `trigger_event text not null`
- `status text not null check (status in ('queued','running','completed','failed'))`
- `daily_budget numeric(12,2) null`
- `currency_code text not null default 'BRL'`
- `payload jsonb not null default '{}'`
- `created_by uuid null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 8) `public.campaign_dispatches`

Campos:

- `id uuid pk`
- `campaign_run_id uuid not null references campaign_runs(id) on delete cascade`
- `channel text not null`
- `destination text null`
- `dispatch_status text not null check (dispatch_status in ('success','failed','skipped'))`
- `response_code int null`
- `response_body jsonb null`
- `dispatched_at timestamptz not null default now()`

### 9) `public.lead_scores`

Campos:

- `id uuid pk`
- `lead_id uuid not null references leads(id) on delete cascade`
- `score int not null check (score between 0 and 100)`
- `tier text not null check (tier in ('hot','warm','cold'))`
- `next_action text null`
- `source text not null default 'api/sales/leads'`
- `raw_payload jsonb null`
- `created_at timestamptz not null default now()`

## Relacionamentos Consolidados

1. `leads 1:N opportunities`
2. `clients 1:N opportunities` (opcional)
3. `clients 1:N projects`
4. `pipeline_stages 1:N opportunities`
5. `opportunities 1:N opportunity_activities`
6. `opportunities 1:N proposals`
7. `opportunities N:N services_catalog` via `opportunity_services`
8. `proposals 0..1:1 contracts`
9. `proposals 0..1:1 documents`
10. `campaign_runs 1:N campaign_dispatches`
11. `leads 1:N lead_scores`

## Internacionalização (BR, EUA, Europa)

- `opportunities.country_code` define país da oportunidade.
- `opportunities.market_region` define região de mercado (`LATAM`, `NA`, `EU`).
- `currency_code` em `opportunities`, `proposals`, `opportunity_services`, `campaign_runs`.
- `services_catalog.available_in_regions` controla disponibilidade por região.

## RLS (Modelo Alvo)

### `pipeline_stages`, `services_catalog`

- `SELECT`: usuários autenticados.
- `INSERT/UPDATE/DELETE`: apenas papéis elevados (diretor/coordenador).

### `opportunities`, `opportunity_activities`, `proposals`, `opportunity_services`

- `SELECT`: owner, membro do projeto vinculado, ou papel elevado.
- `INSERT/UPDATE`: owner, membro autorizado, ou papel elevado.
- `DELETE`: owner (quando permitido) e papel elevado.

### `campaign_runs`, `campaign_dispatches`, `lead_scores`

- `SELECT`: owner + papéis elevados (+ membro de projeto quando houver vínculo).
- Escrita operacional preferencial via backend/service role.

## Ordem Planejada de Migrations (referência de implementação futura)

1. Estrutura: novas tabelas e constraints.
2. Catálogos: seed de `pipeline_stages` e `services_catalog`.
3. RLS: habilitação + políticas.
4. Backfill e compatibilidade para telas/APIs atuais.

## Situação Atual

- Modelo **definitivo consolidado** para o Pacote Master 002-A.
- Sem geração de SQL nesta etapa (conforme solicitado).
