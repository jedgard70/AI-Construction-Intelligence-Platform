-- PACOTE MASTER 002-S2
-- Services Catalog + Opportunity Services (idempotent for partial environments)

create table if not exists public.services_catalog (
  id uuid primary key default gen_random_uuid()
);

alter table public.services_catalog add column if not exists service_code text;
alter table public.services_catalog add column if not exists name text;
alter table public.services_catalog add column if not exists description text;
alter table public.services_catalog add column if not exists category text;
alter table public.services_catalog add column if not exists default_unit text default 'package';
alter table public.services_catalog add column if not exists default_currency_code text default 'BRL';
alter table public.services_catalog add column if not exists base_price numeric(15,2);
alter table public.services_catalog add column if not exists available_in_regions text[] default '{"LATAM","NA","EU"}';
alter table public.services_catalog add column if not exists is_active boolean default true;
alter table public.services_catalog add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.services_catalog add column if not exists created_at timestamptz default now();
alter table public.services_catalog add column if not exists updated_at timestamptz default now();

update public.services_catalog
set
  service_code = coalesce(nullif(trim(service_code), ''), 'service-' || left(id::text, 8)),
  name = coalesce(nullif(trim(name), ''), 'Unnamed Service'),
  category = coalesce(nullif(trim(category), ''), 'general'),
  default_unit = coalesce(nullif(trim(default_unit), ''), 'package'),
  default_currency_code = coalesce(nullif(trim(default_currency_code), ''), 'BRL'),
  available_in_regions = coalesce(available_in_regions, '{"LATAM","NA","EU"}'),
  is_active = coalesce(is_active, true),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  service_code is null
  or btrim(service_code) = ''
  or name is null
  or btrim(name) = ''
  or category is null
  or btrim(category) = ''
  or default_unit is null
  or btrim(default_unit) = ''
  or default_currency_code is null
  or btrim(default_currency_code) = ''
  or available_in_regions is null
  or is_active is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.services_catalog alter column service_code set not null;
alter table public.services_catalog alter column name set not null;
alter table public.services_catalog alter column category set not null;
alter table public.services_catalog alter column default_unit set default 'package';
alter table public.services_catalog alter column default_unit set not null;
alter table public.services_catalog alter column default_currency_code set default 'BRL';
alter table public.services_catalog alter column default_currency_code set not null;
alter table public.services_catalog alter column available_in_regions set default '{"LATAM","NA","EU"}';
alter table public.services_catalog alter column available_in_regions set not null;
alter table public.services_catalog alter column is_active set default true;
alter table public.services_catalog alter column is_active set not null;
alter table public.services_catalog alter column metadata set default '{}'::jsonb;
alter table public.services_catalog alter column metadata set not null;
alter table public.services_catalog alter column created_at set default now();
alter table public.services_catalog alter column created_at set not null;
alter table public.services_catalog alter column updated_at set default now();
alter table public.services_catalog alter column updated_at set not null;

create unique index if not exists uq_services_catalog_code on public.services_catalog(service_code);
create index if not exists idx_services_catalog_category on public.services_catalog(category);
create index if not exists idx_services_catalog_active on public.services_catalog(is_active);
create index if not exists idx_services_catalog_regions on public.services_catalog using gin(available_in_regions);

create table if not exists public.opportunity_services (
  id uuid primary key default gen_random_uuid()
);

alter table public.opportunity_services add column if not exists opportunity_id uuid;
alter table public.opportunity_services add column if not exists service_id uuid;
alter table public.opportunity_services add column if not exists quantity numeric(12,2) default 1;
alter table public.opportunity_services add column if not exists unit text default 'package';
alter table public.opportunity_services add column if not exists unit_price numeric(15,2) default 0;
alter table public.opportunity_services add column if not exists currency_code text default 'BRL';
alter table public.opportunity_services add column if not exists discount_pct numeric(5,2) default 0;
alter table public.opportunity_services add column if not exists line_total numeric(15,2);
alter table public.opportunity_services add column if not exists scope_notes text;
alter table public.opportunity_services add column if not exists is_primary boolean default false;
alter table public.opportunity_services add column if not exists created_by uuid default auth.uid();
alter table public.opportunity_services add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.opportunity_services add column if not exists created_at timestamptz default now();
alter table public.opportunity_services add column if not exists updated_at timestamptz default now();

update public.opportunity_services
set
  quantity = coalesce(quantity, 1),
  unit = coalesce(nullif(trim(unit), ''), 'package'),
  unit_price = coalesce(unit_price, 0),
  currency_code = coalesce(nullif(trim(currency_code), ''), 'BRL'),
  discount_pct = coalesce(discount_pct, 0),
  is_primary = coalesce(is_primary, false),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  quantity is null
  or unit is null
  or btrim(unit) = ''
  or unit_price is null
  or currency_code is null
  or btrim(currency_code) = ''
  or discount_pct is null
  or is_primary is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.opportunity_services alter column quantity set default 1;
alter table public.opportunity_services alter column quantity set not null;
alter table public.opportunity_services alter column unit set default 'package';
alter table public.opportunity_services alter column unit set not null;
alter table public.opportunity_services alter column unit_price set default 0;
alter table public.opportunity_services alter column unit_price set not null;
alter table public.opportunity_services alter column currency_code set default 'BRL';
alter table public.opportunity_services alter column currency_code set not null;
alter table public.opportunity_services alter column discount_pct set default 0;
alter table public.opportunity_services alter column discount_pct set not null;
alter table public.opportunity_services alter column is_primary set default false;
alter table public.opportunity_services alter column is_primary set not null;
alter table public.opportunity_services alter column created_by set default auth.uid();
alter table public.opportunity_services alter column metadata set default '{}'::jsonb;
alter table public.opportunity_services alter column metadata set not null;
alter table public.opportunity_services alter column created_at set default now();
alter table public.opportunity_services alter column created_at set not null;
alter table public.opportunity_services alter column updated_at set default now();
alter table public.opportunity_services alter column updated_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunity_services_discount_pct_check')
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.opportunity_services'::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ilike '%discount_pct%0%100%'
     ) then
    alter table public.opportunity_services add constraint opportunity_services_discount_pct_check check (discount_pct between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunity_services_opportunity_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.opportunity_services'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (opportunity_id)%REFERENCES public.opportunities(id)%'
     ) then
    alter table public.opportunity_services add constraint opportunity_services_opportunity_id_fkey foreign key (opportunity_id) references public.opportunities(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunity_services_service_id_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.opportunity_services'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (service_id)%REFERENCES public.services_catalog(id)%'
     ) then
    alter table public.opportunity_services add constraint opportunity_services_service_id_fkey foreign key (service_id) references public.services_catalog(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunity_services_created_by_fkey')
     and not exists (
       select 1 from pg_constraint c
       where c.conrelid = 'public.opportunity_services'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (created_by)%REFERENCES public.profiles(id)%'
     ) then
    alter table public.opportunity_services add constraint opportunity_services_created_by_fkey foreign key (created_by) references public.profiles(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunity_services_opportunity_id_service_id_key') then
    alter table public.opportunity_services add constraint opportunity_services_opportunity_id_service_id_key unique (opportunity_id, service_id);
  end if;
end $$;

create index if not exists idx_opportunity_services_opp on public.opportunity_services(opportunity_id);
create index if not exists idx_opportunity_services_service on public.opportunity_services(service_id);
create index if not exists idx_opportunity_services_primary on public.opportunity_services(is_primary);

alter table public.services_catalog enable row level security;
alter table public.opportunity_services enable row level security;

drop policy if exists "services_catalog_select_authenticated" on public.services_catalog;
create policy "services_catalog_select_authenticated"
  on public.services_catalog for select
  to authenticated
  using (true);

drop policy if exists "services_catalog_manage_elevated" on public.services_catalog;
create policy "services_catalog_manage_elevated"
  on public.services_catalog for all
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

drop policy if exists "opportunity_services_select_scoped" on public.opportunity_services;
create policy "opportunity_services_select_scoped"
  on public.opportunity_services for select
  to authenticated
  using (
    exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_services.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
          or (
            o.project_id is not null
            and exists (
              select 1
              from public.project_members pm
              where pm.project_id = o.project_id
                and pm.user_id = auth.uid()
            )
          )
        )
    )
  );

drop policy if exists "opportunity_services_insert_scoped" on public.opportunity_services;
create policy "opportunity_services_insert_scoped"
  on public.opportunity_services for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (created_by is null or created_by = auth.uid())
    and exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_services.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  );

drop policy if exists "opportunity_services_update_scoped" on public.opportunity_services;
create policy "opportunity_services_update_scoped"
  on public.opportunity_services for update
  to authenticated
  using (
    exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_services.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_services.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  );

drop policy if exists "opportunity_services_delete_scoped" on public.opportunity_services;
create policy "opportunity_services_delete_scoped"
  on public.opportunity_services for delete
  to authenticated
  using (
    exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_services.opportunity_id
        and (
          o.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('diretor_executivo', 'coordenador_projetos')
          )
        )
    )
  );

insert into public.services_catalog (service_code, name, description, category, default_unit, default_currency_code, base_price, available_in_regions, is_active)
values
  ('permit_set_usa', 'Permit Set USA', 'Complete permit drawing package for US jurisdictions.', 'compliance', 'package', 'USD', 25000, '{"NA"}', true),
  ('render_4k', 'Render 4K', 'High-end exterior/interior photorealistic render package.', 'visualization', 'package', 'USD', 8500, '{"LATAM","NA","EU"}', true),
  ('technical_docs', 'Documentacao Tecnica', 'Technical documentation and detailing package.', 'documentation', 'package', 'BRL', 12000, '{"LATAM","NA","EU"}', true),
  ('marketing_package', 'Marketing Package', 'Launch materials, visuals and conversion assets.', 'marketing', 'package', 'USD', 10000, '{"LATAM","NA","EU"}', true)
on conflict (service_code) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  default_unit = excluded.default_unit,
  default_currency_code = excluded.default_currency_code,
  base_price = excluded.base_price,
  available_in_regions = excluded.available_in_regions,
  is_active = excluded.is_active;
