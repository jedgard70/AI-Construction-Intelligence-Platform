import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

const VALID_EVENTS = new Set([
  'login_success',
  'dashboard_view',
  'apex_ai_open',
  'mission_control_view',
  'owner_command_view',
])

const EVENT_DEFAULTS: Record<string, { page_path: string; module: string }> = {
  login_success: { page_path: '/login', module: 'auth' },
  dashboard_view: { page_path: '/dashboard', module: 'dashboard' },
  apex_ai_open: { page_path: '/apex-ai', module: 'apex-ai' },
  mission_control_view: { page_path: '/mission-control', module: 'mission-control' },
  owner_command_view: { page_path: '/owner-command', module: 'owner-command' },
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function cleanLabel(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed && trimmed.length <= 120 ? trimmed : fallback
}

function analyticsRole(role: unknown): 'owner' | 'admin' | 'user' | 'client' {
  if (role === 'owner' || role === 'admin' || role === 'client') return role
  return 'user'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  const user = await resolveOwnerContext(bearerToken)
  if (!user.userId || user.role === 'guest') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const eventType = typeof req.body?.event_type === 'string' ? req.body.event_type : ''
  if (!VALID_EVENTS.has(eventType)) {
    return res.status(400).json({ error: 'Invalid event type' })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const defaults = EVENT_DEFAULTS[eventType]
  const pagePath = cleanLabel(req.body?.page_path, defaults.page_path)
  const moduleName = cleanLabel(req.body?.module, defaults.module)
  const eventName = cleanLabel(req.body?.event_name, eventType)

  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: user.userId,
      user_role: analyticsRole(user.role),
      event_type: eventType,
      event_name: eventName,
      page_path: pagePath,
      module: moduleName,
      metadata: null,
    })

    if (error) {
      console.error('Analytics tracking error:', error)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Analytics API error:', err)
    return res.status(200).json({ ok: true })
  }
}
