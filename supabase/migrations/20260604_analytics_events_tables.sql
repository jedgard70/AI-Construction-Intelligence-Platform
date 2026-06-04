-- Analytics events and page views tables with RLS policies

-- Create analytics_events table
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null default 'user' check (user_role in ('owner', 'admin', 'user')),
  event_type text not null check (event_type in (
    'page_view',
    'login',
    'dashboard_view',
    'apex_ai_open',
    'apex_ai_send',
    'mission_control_view',
    'owner_command_view',
    'storage_upload',
    'crm_view',
    'proposal_view',
    'export_report'
  )),
  event_name text,
  page_path text,
  module text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for performance
create index idx_analytics_events_user_id on public.analytics_events(user_id);
create index idx_analytics_events_user_role on public.analytics_events(user_role);
create index idx_analytics_events_event_type on public.analytics_events(event_type);
create index idx_analytics_events_created_at on public.analytics_events(created_at);
create index idx_analytics_events_module on public.analytics_events(module);
create index idx_analytics_events_page_path on public.analytics_events(page_path);

-- RLS: Enable RLS on analytics_events
alter table public.analytics_events enable row level security;

-- RLS Policy 1: Owner can read all events
create policy "owner_read_all_events" on public.analytics_events
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.user_metadata->>'role' = 'owner'
    )
  );

-- RLS Policy 2: Admin can read non-owner events
create policy "admin_read_non_owner_events" on public.analytics_events
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.user_metadata->>'role' = 'admin'
    )
  )
  and user_role != 'owner';

-- RLS Policy 3: Users can only read their own events
create policy "user_read_own_events" on public.analytics_events
  for select
  using (user_id = auth.uid());

-- RLS Policy 4: Authenticated users can insert events
create policy "authenticated_insert_events" on public.analytics_events
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
    )
  );

-- Disable direct updates/deletes for analytics integrity
create policy "no_update_events" on public.analytics_events
  for update using (false);

create policy "no_delete_events" on public.analytics_events
  for delete using (false);

-- Optional: Create analytics_page_views table for detailed page tracking
create table if not exists public.analytics_page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_path text not null,
  referrer text,
  viewport_width integer,
  viewport_height integer,
  session_id text,
  created_at timestamp with time zone default now()
);

-- Create indexes
create index idx_analytics_page_views_user_id on public.analytics_page_views(user_id);
create index idx_analytics_page_views_page_path on public.analytics_page_views(page_path);
create index idx_analytics_page_views_created_at on public.analytics_page_views(created_at);
create index idx_analytics_page_views_session_id on public.analytics_page_views(session_id);

-- RLS: Enable RLS
alter table public.analytics_page_views enable row level security;

-- RLS Policies (same access pattern as analytics_events)
create policy "owner_read_all_page_views" on public.analytics_page_views
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.user_metadata->>'role' = 'owner'
    )
  );

create policy "admin_read_page_views" on public.analytics_page_views
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.user_metadata->>'role' = 'admin'
    )
  );

create policy "user_read_own_page_views" on public.analytics_page_views
  for select
  using (user_id = auth.uid());

create policy "authenticated_insert_page_views" on public.analytics_page_views
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
    )
  );

create policy "no_update_page_views" on public.analytics_page_views
  for update using (false);

create policy "no_delete_page_views" on public.analytics_page_views
  for delete using (false);
