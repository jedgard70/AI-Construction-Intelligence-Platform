import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '../../../lib/supabase'

interface DashboardData {
  today_visitors: number
  today_page_views: number
  modules: Record<string, number>
  top_pages: Array<{ path: string; views: number }>
  recent_events: Array<{
    user: string
    event: string
    at: string
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Owner-only check
  const user_role = session.user?.user_metadata?.role || 'user'
  if (user_role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden - Owner access required' })
  }

  try {
    const now = new Date()
    const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get today's visitors (unique users)
    const { data: visitors_data } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('created_at', today_start.toISOString())
      .select('DISTINCT user_id')

    const today_visitors = visitors_data?.length || 0

    // Get today's page views
    const { data: pageviews_data } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'page_view')
      .gte('created_at', today_start.toISOString())

    const today_page_views = pageviews_data?.length || 0

    // Get module breakdown
    const { data: modules_data } = await supabase
      .from('analytics_events')
      .select('module')
      .gte('created_at', today_start.toISOString())

    const modules: Record<string, number> = {}
    modules_data?.forEach(row => {
      if (row.module) {
        modules[row.module] = (modules[row.module] || 0) + 1
      }
    })

    // Get top pages (today)
    const { data: toppage_data } = await supabase
      .from('analytics_events')
      .select('page_path')
      .eq('event_type', 'page_view')
      .gte('created_at', today_start.toISOString())

    const pages: Record<string, number> = {}
    toppage_data?.forEach(row => {
      if (row.page_path) {
        pages[row.page_path] = (pages[row.page_path] || 0) + 1
      }
    })

    const top_pages = Object.entries(pages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }))

    // Get recent events (last 10, today)
    const { data: recent_data } = await supabase
      .from('analytics_events')
      .select('user_id, event_type, created_at')
      .gte('created_at', today_start.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user emails for recent events
    const recent_events = []
    for (const event of recent_data || []) {
      const { data: user_data } = await supabase.auth.admin.getUserById(event.user_id)
      const email = user_data?.user?.email || 'unknown'
      const time = new Date(event.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })

      recent_events.push({
        user: email,
        event: event.event_type,
        at: time,
      })
    }

    return res.status(200).json({
      today_visitors,
      today_page_views,
      modules,
      top_pages,
      recent_events,
    })
  } catch (err) {
    console.error('Dashboard analytics error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
