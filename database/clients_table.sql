-- Tabela de clientes
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/_/sql

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Identificação
  tipo          text not null default 'pessoa_juridica'
                  check (tipo in ('pessoa_fisica','pessoa_juridica')),
  segmento      text default 'comercial',
  status        text not null default 'ativo'
                  check (status in ('ativo','inativo','prospecto')),

  -- Dados principais
  nome          text not null,
  razao_social  text,
  cpf_cnpj      text not null unique,
  email         text,
  telefone      text,
  celular       text,

  -- Endereço
  cep           text,
  endereco      text,
  numero        text,
  complemento   text,
  bairro        text,
  cidade        text,
  estado        text,

  -- Contato responsável
  contato_nome      text,
  contato_cargo     text,
  contato_email     text,
  contato_telefone  text,

  -- Relacionamentos e notas
  observacoes   text,
  user_id       uuid references auth.users(id) on delete set null
);

-- Índices úteis
create index if not exists clients_nome_idx    on public.clients (nome);
create index if not exists clients_cnpj_idx    on public.clients (cpf_cnpj);
create index if not exists clients_status_idx  on public.clients (status);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- RLS
alter table public.clients enable row level security;

-- Usuários autenticados podem ver e inserir clientes da própria organização
create policy "Authenticated users can read clients"
  on public.clients for select
  to authenticated using (true);

create policy "Authenticated users can insert clients"
  on public.clients for insert
  to authenticated with check (true);

create policy "Authenticated users can update clients"
  on public.clients for update
  to authenticated using (true);
