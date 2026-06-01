-- STORAGE-1 FOUNDATION IMPLEMENTATION
-- Idempotent migration for private project files + documents metadata + RLS/policies.

create extension if not exists pgcrypto;

-- 1) Ensure private bucket exists and remains private.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do update
set public = false;

-- 2) Documents metadata table (idempotent / partial-safe).
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid()
);

alter table public.documents add column if not exists project_id uuid;
alter table public.documents add column if not exists owner_user_id uuid;
alter table public.documents add column if not exists created_by uuid default auth.uid();
alter table public.documents add column if not exists storage_bucket text default 'project-files';
alter table public.documents add column if not exists storage_path text;
alter table public.documents add column if not exists mime_type text;
alter table public.documents add column if not exists file_size bigint;
alter table public.documents add column if not exists original_name text;
alter table public.documents add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.documents add column if not exists created_at timestamptz default now();
alter table public.documents add column if not exists updated_at timestamptz default now();

update public.documents
set
  storage_bucket = coalesce(nullif(trim(storage_bucket), ''), 'project-files'),
  original_name = coalesce(nullif(trim(original_name), ''), nullif(regexp_replace(storage_path, '^.*/', ''), ''), 'unnamed-file'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now()),
  owner_user_id = coalesce(owner_user_id, created_by)
where
  storage_bucket is null
  or btrim(storage_bucket) = ''
  or original_name is null
  or btrim(original_name) = ''
  or metadata is null
  or created_at is null
  or updated_at is null
  or owner_user_id is null;

alter table public.documents alter column storage_bucket set default 'project-files';
alter table public.documents alter column storage_bucket set not null;
alter table public.documents alter column original_name set not null;
alter table public.documents alter column metadata set default '{}'::jsonb;
alter table public.documents alter column metadata set not null;
alter table public.documents alter column created_at set default now();
alter table public.documents alter column created_at set not null;
alter table public.documents alter column updated_at set default now();
alter table public.documents alter column updated_at set not null;

-- Optional/nullable for partial legacy data safety:
-- project_id, owner_user_id, created_by, storage_path, mime_type, file_size stay nullable.

create index if not exists idx_documents_project_id on public.documents(project_id);
create index if not exists idx_documents_owner_user_id on public.documents(owner_user_id);
create index if not exists idx_documents_created_by on public.documents(created_by);
create index if not exists idx_documents_storage_bucket on public.documents(storage_bucket);
create index if not exists idx_documents_storage_path on public.documents(storage_path);
create index if not exists idx_documents_created_at on public.documents(created_at desc);

-- Uniqueness for storage path inside the same bucket (when path is present).
create unique index if not exists uq_documents_bucket_path
  on public.documents(storage_bucket, storage_path)
  where storage_path is not null;

-- Defensive constraints/FKs only when referenced tables exist.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.documents'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%file_size >= 0%'
  ) then
    alter table public.documents
      add constraint documents_file_size_non_negative
      check (file_size is null or file_size >= 0);
  end if;

  if to_regclass('public.projects') is not null
     and not exists (
       select 1
       from pg_constraint c
       where c.conname = 'documents_project_id_fkey'
     )
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.documents'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (project_id)%REFERENCES public.projects(id)%'
     ) then
    alter table public.documents
      add constraint documents_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;

  if to_regclass('public.profiles') is not null
     and not exists (
       select 1
       from pg_constraint c
       where c.conname = 'documents_owner_user_id_fkey'
     )
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.documents'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (owner_user_id)%REFERENCES public.profiles(id)%'
     ) then
    alter table public.documents
      add constraint documents_owner_user_id_fkey
      foreign key (owner_user_id) references public.profiles(id) on delete set null;
  end if;

  if to_regclass('public.profiles') is not null
     and not exists (
       select 1
       from pg_constraint c
       where c.conname = 'documents_created_by_fkey'
     )
     and not exists (
       select 1
       from pg_constraint c
       where c.conrelid = 'public.documents'::regclass
         and c.contype = 'f'
         and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (created_by)%REFERENCES public.profiles(id)%'
     ) then
    alter table public.documents
      add constraint documents_created_by_fkey
      foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
end $$;

-- 3) RLS for documents.
alter table public.documents enable row level security;

drop policy if exists "documents_select_scoped" on public.documents;
create policy "documents_select_scoped"
  on public.documents for select
  to authenticated
  using (
    created_by = auth.uid()
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
    or (
      project_id is not null
      and exists (
        select 1
        from public.project_members pm
        where pm.project_id = documents.project_id
          and pm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "documents_insert_scoped" on public.documents;
create policy "documents_insert_scoped"
  on public.documents for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (
      project_id is null
      or exists (
        select 1
        from public.project_members pm
        where pm.project_id = documents.project_id
          and pm.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('diretor_executivo', 'coordenador_projetos')
      )
    )
  );

drop policy if exists "documents_update_scoped" on public.documents;
create policy "documents_update_scoped"
  on public.documents for update
  to authenticated
  using (
    created_by = auth.uid()
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  )
  with check (
    created_by = auth.uid()
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

drop policy if exists "documents_delete_scoped" on public.documents;
create policy "documents_delete_scoped"
  on public.documents for delete
  to authenticated
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('diretor_executivo', 'coordenador_projetos')
    )
  );

-- 4) Storage policies on storage.objects for private bucket project-files.
-- Expected path convention: projects/{project_id}/{document_id}/{filename}

drop policy if exists "project_files_select_scoped" on storage.objects;
create policy "project_files_select_scoped"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and split_part(name, '/', 1) = 'projects'
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id::text = split_part(name, '/', 2)
        and pm.user_id = auth.uid()
    )
  );

drop policy if exists "project_files_insert_scoped" on storage.objects;
create policy "project_files_insert_scoped"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and split_part(name, '/', 1) = 'projects'
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id::text = split_part(name, '/', 2)
        and pm.user_id = auth.uid()
    )
  );

drop policy if exists "project_files_update_scoped" on storage.objects;
create policy "project_files_update_scoped"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and split_part(name, '/', 1) = 'projects'
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id::text = split_part(name, '/', 2)
        and pm.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'project-files'
    and split_part(name, '/', 1) = 'projects'
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id::text = split_part(name, '/', 2)
        and pm.user_id = auth.uid()
    )
  );

drop policy if exists "project_files_delete_scoped" on storage.objects;
create policy "project_files_delete_scoped"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and split_part(name, '/', 1) = 'projects'
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id::text = split_part(name, '/', 2)
        and pm.user_id = auth.uid()
    )
  );
