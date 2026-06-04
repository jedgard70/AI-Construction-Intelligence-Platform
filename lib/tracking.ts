// Analytics tracking utilities
// Sends events to /api/analytics/track

export type EventType =
  | 'page_view'
  | 'login'
  | 'dashboard_view'
  | 'apex_ai_open'
  | 'apex_ai_send'
  | 'mission_control_view'
  | 'owner_command_view'
  | 'storage_upload'
  | 'crm_view'
  | 'proposal_view'
  | 'export_report'

const VALID_EVENTS = new Set<EventType>([
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
  'export_report',
])

const MODULE_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/apex-ai': 'apex-ai',
  '/mission-control': 'mission-control',
  '/owner-command': 'owner-command',
  '/crm': 'crm',
  '/storage': 'storage',
  '/proposals': 'proposals',
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
  metadata?: Record<string, any>
  duration?: number
}

export async function trackEvent(options: TrackEventOptions): Promise<void> {
  if (!VALID_EVENTS.has(options.type)) {
    console.warn(`Invalid event type: ${options.type}`)
    return
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: options.type,
        event_name: options.name,
        page_path: options.page_path,
        module: options.module,
        metadata: options.metadata,
        duration_seconds: options.duration,
      }),
    })
  } catch (err) {
    // Silently fail tracking - don't disrupt user experience
    console.debug('Failed to track event:', err)
  }
}

// Track page view with automatic module detection
export function trackPageView(path: string): void {
  const module = getModuleFromPath(path)
  trackEvent({
    type: 'page_view',
    page_path: path,
    module,
  })
}
