import { useEffect, useState } from 'react'

interface DashboardData {
  today_visitors: number
  today_events: number
  modules: Record<string, number>
  top_pages: Array<{ path: string; views: number }>
  recent_events: Array<{ user: string; event: string; at: string }>
}

export default function AnalyticsDashboard({ accessToken }: { accessToken?: string | null }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        if (!accessToken) {
          setError('Owner-only access required')
          setLoading(false)
          return
        }

        const response = await fetch('/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (response.status === 403) {
          setError('Owner-only access required')
          setLoading(false)
          return
        }
        if (!response.ok) {
          setError('Failed to load analytics')
          setLoading(false)
          return
        }
        const result: DashboardData = await response.json()
        setData(result)
        setLoading(false)
      } catch (err) {
        setError('Error loading analytics')
        console.error('Analytics fetch error:', err)
        setLoading(false)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [accessToken])

  if (loading) {
    return (
      <div style={{ padding: '24px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)' }}>
        <div style={{ color: 'var(--apx-muted)' }}>Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)', color: '#f0a500' }}>
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard label="Today's Visitors" value={data.today_visitors} />
        <MetricCard label="Tracked Events" value={data.today_events} />
      </div>

      {/* Modules Breakdown */}
      <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Modules</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {Object.entries(data.modules)
            .sort(([, a], [, b]) => b - a)
            .map(([module, count]) => (
              <div key={module} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--apx-text)' }}>{module}</span>
                <span style={{ color: 'var(--apx-muted)' }}>{count} events</span>
              </div>
            ))}
        </div>
      </div>

      {/* Top Pages */}
      <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Top Pages</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {data.top_pages.map(({ path, views }) => (
            <div key={path} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--apx-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {path}
              </span>
              <span style={{ color: 'var(--apx-muted)', marginLeft: '8px' }}>{views}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Recent Events</h3>
        <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
          {data.recent_events.length === 0 ? (
            <div style={{ color: 'var(--apx-muted)' }}>No recent events</div>
          ) : (
            data.recent_events.map((event, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apx-text)' }}>
                <div>
                  <span>{event.user}</span>
                  <span style={{ color: 'var(--apx-muted)', marginLeft: '8px' }}>— {event.event}</span>
                </div>
                <span style={{ color: 'var(--apx-muted)' }}>{event.at}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--apx-surface)', border: '1px solid var(--apx-border)' }}>
      <div style={{ fontSize: '12px', color: 'var(--apx-muted)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--apx-text)' }}>{value}</div>
    </div>
  )
}
