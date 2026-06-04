# Analytics Implementation - Phase 1 Minimal

Branch: `feat/analytics-platform-website`
Status: Draft, minimal private analytics only
Date: June 4, 2026

## Scope

This phase keeps analytics intentionally small and private. It tracks only explicit platform events needed for the Owner view in Mission Control.

Tracked events:
- `login_success`
- `dashboard_view`
- `apex_ai_open`
- `mission_control_view`
- `owner_command_view`

## Data Stored

Table: `analytics_events`

Stored fields:
- authenticated `user_id`
- resolved `user_role`
- `event_type`
- optional short `event_name`
- `page_path`
- `module`
- `created_at`

The API sets `metadata` to `null` in this phase.

## Data Not Stored

This phase explicitly does not collect:
- passwords
- tokens or API keys
- IP addresses
- user agent strings
- Apex AI message contents
- uploaded file contents
- private document contents
- public website visitor analytics
- detailed route/page-view tracking across all private pages

## Authentication And Authorization

API routes do not use the browser Supabase client.

`POST /api/analytics/track`:
- requires an `Authorization: Bearer <access_token>` header
- validates the token with the existing `lib/owner-auth.ts` flow
- creates a Supabase service-role client only after the user is authenticated
- accepts only the minimal event whitelist

`GET /api/analytics/dashboard`:
- requires an authenticated Bearer token
- allows full analytics reads only for Owner
- returns `403` for non-Owner users
- uses service role only after Owner authorization

## Database And RLS

Migration:
- `supabase/migrations/20260604_analytics_events_tables.sql`

Created table:
- `public.analytics_events`

RLS:
- Owner can select all analytics events.
- Authenticated users can insert only events where `user_id = auth.uid()`.
- Updates are blocked.
- Deletes are blocked.

No `analytics_page_views` table is created in this phase.

## Frontend Behavior

Global route tracking is disabled. `usePageTracking()` is retained as a no-op compatibility hook and is not called from `_app.tsx`.

Frontend tracking sends a Bearer token from the current Supabase browser session. If no session exists, tracking is skipped silently.

Legacy frontend calls using `type: 'login'` are mapped to the stored event type `login_success`.

## Mission Control

`AnalyticsDashboard` fetches `/api/analytics/dashboard` with the current Bearer token and displays:
- today's unique tracked users
- today's tracked event count
- module breakdown
- top tracked page paths
- recent event types with shortened user IDs

It does not fetch or display user emails.

## Remaining Before Ready For Review

- Confirm Supabase Preview applies the migration successfully.
- Confirm PR checks are green.
- Confirm Owner can view Mission Control analytics in preview.
- Confirm non-Owner users receive `403` from dashboard analytics.
