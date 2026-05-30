import { createClient } from '@supabase/supabase-js'

function requireAuth(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return false
  return auth.slice(7).length > 0
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const DEMO_DASHBOARD = {
  demo: true,
  kpis: {
    forecast:        { amount: 9275000, count: 3, currency: 'BRL' },
    contracted:      { amount: 8895000, count: 4, currency: 'BRL' },
    invoiced:        { amount: 7045000, count: 3, currency: 'BRL' },
    received:        { amount: 3560000, count: 4, currency: 'BRL' },
    overdue:         { amount:   47500, count: 1, currency: 'BRL' },
    cancelled:       { amount:       0, count: 0, currency: 'BRL' },
  },
  conversion: {
    forecast_to_contracted:  96.0,
    contracted_to_invoiced:  79.2,
    invoiced_to_paid:        50.5,
  },
  by_status: [
    { status: 'forecast',       count: 1, total: 380000 },
    { status: 'contracted',     count: 1, total: 1850000 },
    { status: 'invoiced',       count: 1, total: 4200000 },
    { status: 'partially_paid', count: 1, total: 2750000 },
    { status: 'overdue',        count: 1, total: 95000 },
    { status: 'paid',           count: 0, total: 0 },
    { status: 'cancelled',      count: 0, total: 0 },
  ],
  by_currency: [
    { currency: 'BRL', count: 5, total: 9275000 },
  ],
  upcoming_installments: [
    { id: 'inst-d-001', revenue_record_id: 'rev-demo-001', installment_number: 7,
      due_date: '2026-06-15', amount: 154167, status: 'pending', currency: 'BRL',
      revenue_title: 'Contrato Residencial Edifício Horizonte' },
    { id: 'inst-d-002', revenue_record_id: 'rev-demo-004', installment_number: 6,
      due_date: '2026-06-20', amount: 343750, status: 'pending', currency: 'BRL',
      revenue_title: 'Marina Residencial — Gestão de Obras' },
    { id: 'inst-d-003', revenue_record_id: 'rev-demo-002', installment_number: 4,
      due_date: '2026-06-30', amount: 700000, status: 'pending', currency: 'BRL',
      revenue_title: 'Complexo Turístico — Fase 1' },
  ],
  overdue_installments: [
    { id: 'inst-d-010', revenue_record_id: 'rev-demo-005', installment_number: 2,
      due_date: '2026-04-01', amount: 47500, status: 'overdue', currency: 'BRL',
      revenue_title: 'Auditoria Técnica — Galpão Logístico', days_overdue: 59 },
  ],
  generated_at: new Date().toISOString(),
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized — Bearer token required' })
  }

  const sb = getSupabaseService()

  if (!sb) {
    return res.status(200).json(DEMO_DASHBOARD)
  }

  try {
    // Agrega KPIs por status
    const { data: byStatus, error: stErr } = await sb
      .from('revenue_records')
      .select('status, currency, amount_forecast, amount_contracted, amount_invoiced, amount_received')

    if (stErr) throw stErr

    const kpis = {
      forecast:        { amount: 0, count: 0 },
      contracted:      { amount: 0, count: 0 },
      invoiced:        { amount: 0, count: 0 },
      received:        { amount: 0, count: 0 },
      overdue:         { amount: 0, count: 0 },
      cancelled:       { amount: 0, count: 0 },
    }

    const statusTotals = {}
    for (const r of byStatus || []) {
      kpis.forecast.amount   += Number(r.amount_forecast   || 0)
      kpis.contracted.amount += Number(r.amount_contracted || 0)
      kpis.invoiced.amount   += Number(r.amount_invoiced   || 0)
      kpis.received.amount   += Number(r.amount_received   || 0)

      if (!statusTotals[r.status]) statusTotals[r.status] = { count: 0, total: 0 }
      statusTotals[r.status].count++
      statusTotals[r.status].total += Number(r.amount_contracted || r.amount_forecast || 0)

      if (r.status === 'overdue') {
        kpis.overdue.count++
        kpis.overdue.amount += Number(r.amount_invoiced - r.amount_received || 0)
      }
      if (r.status === 'cancelled') {
        kpis.cancelled.count++
        kpis.cancelled.amount += Number(r.amount_contracted || 0)
      }
    }
    kpis.forecast.count   = byStatus?.filter(r => r.status === 'forecast').length || 0
    kpis.contracted.count = byStatus?.filter(r => ['contracted','invoiced','partially_paid'].includes(r.status)).length || 0
    kpis.invoiced.count   = byStatus?.filter(r => ['invoiced','partially_paid'].includes(r.status)).length || 0
    kpis.received.count   = byStatus?.filter(r => r.status === 'paid').length || 0

    // Parcelas próximas (7 dias)
    const today = new Date()
    const in7d  = new Date(today); in7d.setDate(today.getDate() + 7)

    const { data: upcoming } = await sb
      .from('revenue_installments')
      .select('*, revenue_records(title)')
      .eq('status', 'pending')
      .gte('due_date', today.toISOString().slice(0,10))
      .lte('due_date', in7d.toISOString().slice(0,10))
      .order('due_date')
      .limit(10)

    const { data: overdueInst } = await sb
      .from('revenue_installments')
      .select('*, revenue_records(title)')
      .eq('status', 'overdue')
      .order('due_date')
      .limit(10)

    // Conversão
    const total = byStatus?.length || 0
    const contracted = byStatus?.filter(r => r.status !== 'forecast' && r.status !== 'cancelled').length || 0
    const invoiced   = byStatus?.filter(r => ['invoiced','partially_paid','paid'].includes(r.status)).length || 0
    const paid       = byStatus?.filter(r => r.status === 'paid').length || 0

    const conversion = {
      forecast_to_contracted: total > 0 ? ((contracted / total) * 100).toFixed(1) : 0,
      contracted_to_invoiced: contracted > 0 ? ((invoiced / contracted) * 100).toFixed(1) : 0,
      invoiced_to_paid:       invoiced > 0 ? ((paid / invoiced) * 100).toFixed(1) : 0,
    }

    return res.status(200).json({
      kpis,
      conversion,
      by_status: Object.entries(statusTotals).map(([status, v]) => ({ status, ...v })),
      upcoming_installments: (upcoming || []).map(i => ({
        ...i, revenue_title: i.revenue_records?.title
      })),
      overdue_installments: (overdueInst || []).map(i => ({
        ...i,
        revenue_title: i.revenue_records?.title,
        days_overdue: Math.floor((today - new Date(i.due_date)) / 86400000),
      })),
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
