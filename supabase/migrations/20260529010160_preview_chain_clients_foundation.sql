-- Supabase Preview migration-chain repair for public.clients.
--
-- 20260529010201_master002_s1_crm_core.sql adds a foreign key from
-- public.opportunities(client_id) to public.clients(id), but the official
-- supabase/migrations chain did not create public.clients before that point.
-- This foundation keeps the repair narrow and idempotent.

begin;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid()
);

alter table public.clients add column if not exists name text;
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists company text;
alter table public.clients add column if not exists document text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists city text;
alter table public.clients add column if not exists state char(2);
alter table public.clients add column if not exists notes text;
alter table public.clients add column if not exists owner_id uuid references public.profiles(id);
alter table public.clients add column if not exists created_at timestamptz default now();
alter table public.clients add column if not exists updated_at timestamptz default now();

update public.clients
set
  name = coalesce(nullif(trim(name), ''), 'Unnamed Client'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or btrim(name) = ''
  or created_at is null
  or updated_at is null;

alter table public.clients alter column name set not null;
alter table public.clients alter column created_at set default now();
alter table public.clients alter column created_at set not null;
alter table public.clients alter column updated_at set default now();
alter table public.clients alter column updated_at set not null;

create index if not exists idx_clients_owner on public.clients(owner_id);
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_clients_company on public.clients(company);

alter table public.clients enable row level security;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute procedure public.set_updated_at();

commit;
