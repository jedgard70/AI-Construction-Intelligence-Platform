-- PACOTE MASTER 002-S2
-- Services Catalog + Opportunity Services

create table if not exists public.services_catalog (
  id uuid primary key default gen_random_uuid(),
  service_code text not null unique,
  name text not null,
  description text,
  category text not null,
  default_unit text not null default 'package',
  default_currency_code text not null default 'BRL',
  base_price numeric(15,2),
  available_in_regions text[] not null default '{"LATAM","NA","EU"}',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_catalog_category on public.services_catalog(category);
create index if not exists idx_services_catalog_active on public.services_catalog(is_active);
create index if not exists idx_services_catalog_regions on public.services_catalog using gin(available_in_regions);

create table if not exists public.opportunity_services (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  service_id uuid not null references public.services_catalog(id),
  quantity numeric(12,2) not null default 1,
  unit text not null default 'package',
  unit_price numeric(15,2) not null default 0,
  currency_code text not null default 'BRL',
  discount_pct numeric(5,2) not null default 0 check (discount_pct between 0 and 100),
  line_total numeric(15,2),
  scope_notes text,
  is_primary boolean not null default false,
  created_by uuid not null references public.profiles(id) default auth.uid(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(opportunity_id, service_id)
);

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
