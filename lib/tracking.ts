import { getSupabase } from './supabase'

export type EventType =
  | 'login'
  | 'login_success'
  | 'dashboard_view'
  | 'apex_ai_open'
  | 'mission_control_view'
  | 'owner_command_view'

type PersistedEventType = Exclude<EventType, 'login'>

const EVENT_ALIASES: Record<string, PersistedEventType> = {
  login: 'login_success',
}

const VALID_EVENTS = new Set<PersistedEventType>([
  'login_success',
  'dashboard_view',
  'apex_ai_open',
  'mission_control_view',
  'owner_command_view',
])

const MODULE_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/apex-ai': 'apex-ai',
  '/mission-control': 'mission-control',
  '/owner-command': 'owner-command',
}

export function getModuleFromPath(path: string): string {
  for (const [route, module] of Object.entries(MODULE_MAP)) {
    if (path.startsWith(route)) return module
  }
  return 'unknown'
}

export interface TrackEventOptions {
  type: EventType
  name?: string
  page_path?: string
  module?: string
}

export async function trackEvent(options: TrackEventOptions): Promise<void> {
  const eventType = EVENT_ALIASES[options.type] || options.type
  if (!VALID_EVENTS.has(eventType as PersistedEventType)) {
    console.warn(`Invalid analytics event type: ${options.type}`)
    return
  }

  try {
    const supabase = getSupabase()
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
    const accessToken = data.session?.access_token
    if (!accessToken) return

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        event_name: options.name,
        page_path: options.page_path,
        module: options.module,
      }),
    })
  } catch (err) {
    // Silently fail tracking - don't disrupt user experience
    console.debug('Failed to track event:', err)
  }
}

// Kept for compatibility. Global automatic page tracking is disabled in _app.
export function trackPageView(path: string): void {
  const module = getModuleFromPath(path)
  if (module === 'unknown') return
}
