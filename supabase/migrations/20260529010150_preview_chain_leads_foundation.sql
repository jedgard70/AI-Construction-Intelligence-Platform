-- Supabase Preview migration-chain repair for public.leads.
--
-- 20260529010201_master002_s1_crm_core.sql adds a foreign key from
-- public.opportunities(lead_id) to public.leads(id), but the official
-- supabase/migrations chain did not create public.leads before that point.
-- This foundation keeps the repair narrow and idempotent.

begin;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid()
);

alter table public.leads add column if not exists owner_id uuid references public.profiles(id);
alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists empresa text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists telefone text;
alter table public.leads add column if not exists valor numeric(18,2);
alter table public.leads add column if not exists tipo text default 'residencial';
alter table public.leads add column if not exists etapa text default 'Prospecção';
alter table public.leads add column if not exists origem text default 'Indicação';
alter table public.leads add column if not exists probabilidade int default 50;
alter table public.leads add column if not exists proxima_acao text;
alter table public.leads add column if not exists data_contato date;
alter table public.leads add column if not exists notas text;
alter table public.leads add column if not exists created_at timestamptz default now();
alter table public.leads add column if not exists updated_at timestamptz default now();

update public.leads
set
  name = coalesce(nullif(trim(name), ''), 'Unnamed Lead'),
  tipo = coalesce(nullif(trim(tipo), ''), 'residencial'),
  etapa = coalesce(nullif(trim(etapa), ''), 'Prospecção'),
  origem = coalesce(nullif(trim(origem), ''), 'Indicação'),
  probabilidade = coalesce(probabilidade, 50),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or btrim(name) = ''
  or tipo is null
  or btrim(tipo) = ''
  or etapa is null
  or btrim(etapa) = ''
  or origem is null
  or btrim(origem) = ''
  or probabilidade is null
  or created_at is null
  or updated_at is null;

alter table public.leads alter column name set not null;
alter table public.leads alter column tipo set default 'residencial';
alter table public.leads alter column etapa set default 'Prospecção';
alter table public.leads alter column etapa set not null;
alter table public.leads alter column origem set default 'Indicação';
alter table public.leads alter column probabilidade set default 50;
alter table public.leads alter column created_at set default now();
alter table public.leads alter column created_at set not null;
alter table public.leads alter column updated_at set default now();
alter table public.leads alter column updated_at set not null;

create index if not exists idx_leads_owner on public.leads(owner_id);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_etapa on public.leads(etapa);
create index if not exists idx_leads_created_at on public.leads(created_at);

alter table public.leads enable row level security;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

commit;
