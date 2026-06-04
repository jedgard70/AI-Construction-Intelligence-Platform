import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '../../../lib/supabase'
import { createServerClient } from '@supabase/ssr'

const VALID_EVENTS = new Set([
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Require authentication
  const supabase = getSupabase()
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { event_type, event_name, page_path, module, metadata, duration_seconds } = req.body

  // Validate event_type
  if (!event_type || !VALID_EVENTS.has(event_type)) {
    return res.status(400).json({ error: 'Invalid event type' })
  }

  try {
    // Get user role (from auth metadata or default to 'user')
    const user_role = session.user?.user_metadata?.role || 'user'

    // Insert event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: session.user.id,
        user_role,
        event_type,
        event_name,
        page_path,
        module,
        metadata: metadata || null,
        ip_address: req.headers['x-forwarded-for'] as string,
        user_agent: req.headers['user-agent'],
      })

    if (error) {
      console.error('Analytics tracking error:', error)
      // Don't expose error details to client
      return res.status(200).json({ ok: true })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Analytics API error:', err)
    return res.status(200).json({ ok: true })
  }
}
