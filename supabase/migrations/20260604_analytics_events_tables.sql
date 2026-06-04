-- Minimal private analytics events table.
-- Phase 1 intentionally stores only explicit platform events, no IP, no user agent,
-- no Apex AI message bodies, no file contents, and no tokens or secrets.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null default 'user' check (user_role in ('owner', 'admin', 'user', 'client')),
  event_type text not null check (event_type in (
    'login_success',
    'dashboard_view',
    'apex_ai_open',
    'mission_control_view',
    'owner_command_view'
  )),
  event_name text,
  page_path text,
  module text,
  metadata jsonb default null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_user_role on public.analytics_events(user_role);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at);
create index if not exists idx_analytics_events_module on public.analytics_events(module);

alter table public.analytics_events enable row level security;

create policy "owner_read_all_analytics_events" on public.analytics_events
  for select
  using (
    exists (
      select 1
      from auth.users
      where auth.users.id = auth.uid()
        and auth.users.user_metadata->>'role' = 'owner'
    )
  );

create policy "authenticated_insert_own_analytics_events" on public.analytics_events
  for insert
  with check (user_id = auth.uid());

create policy "no_update_analytics_events" on public.analytics_events
  for update using (false);

create policy "no_delete_analytics_events" on public.analytics_events
  for delete using (false);
