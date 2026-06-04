import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

interface DashboardData {
  today_visitors: number
  today_events: number
  modules: Record<string, number>
  top_pages: Array<{ path: string; views: number }>
  recent_events: Array<{
    user: string
    event: string
    at: string
  }>
}

type AnalyticsEventRow = {
  user_id: string
  event_type: string
  page_path: string | null
  module: string | null
  created_at: string
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  const user = await resolveOwnerContext(bearerToken)
  if (!user.userId || user.role === 'guest') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!user.isOwner) {
    return res.status(403).json({ error: 'Forbidden - Owner access required' })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data, error } = await supabase
      .from('analytics_events')
      .select('user_id,event_type,page_path,module,created_at')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Dashboard analytics query error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    const events = (data || []) as AnalyticsEventRow[]
    const modules: Record<string, number> = {}
    const pages: Record<string, number> = {}
    const uniqueUsers = new Set<string>()

    for (const event of events) {
      uniqueUsers.add(event.user_id)
      if (event.module) modules[event.module] = (modules[event.module] || 0) + 1
      if (event.page_path) pages[event.page_path] = (pages[event.page_path] || 0) + 1
    }

    const topPages = Object.entries(pages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }))

    const recentEvents = events.slice(0, 10).map(event => ({
      user: event.user_id.slice(0, 8),
      event: event.event_type,
      at: new Date(event.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))

    return res.status(200).json({
      today_visitors: uniqueUsers.size,
      today_events: events.length,
      modules,
      top_pages: topPages,
      recent_events: recentEvents,
    })
  } catch (err) {
    console.error('Dashboard analytics error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
