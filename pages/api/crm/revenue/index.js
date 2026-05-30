import { createClient } from '@supabase/supabase-js'

const DEMO_RECORDS = [
  {
    id: 'rev-demo-001',
    title: 'Contrato Residencial Edifício Horizonte',
    reference_code: 'REV-2026-001',
    status: 'contracted',
    currency: 'BRL',
    amount_forecast: 1850000,
    amount_contracted: 1850000,
    amount_invoiced: 925000,
    amount_received: 462500,
    contract_signed_date: '2026-03-15',
    expected_close_date: '2026-12-31',
    installments_count: 12,
    client_id: null,
    project_id: null,
    tags: ['residencial', 'SP'],
    notes: 'Contrato de incorporação — 12 parcelas mensais',
    created_at: '2026-03-15T00:00:00Z',
  },
  {
    id: 'rev-demo-002',
    title: 'Complexo Turístico — Fase 1',
    reference_code: 'REV-2026-002',
    status: 'invoiced',
    currency: 'BRL',
    amount_forecast: 4200000,
    amount_contracted: 4200000,
    amount_invoiced: 4200000,
    amount_received: 1400000,
    contract_signed_date: '2026-01-10',
    expected_close_date: '2026-09-30',
    installments_count: 6,
    client_id: null,
    project_id: null,
    tags: ['turismo', 'NE'],
    notes: 'Contrato de gestão de obra — 6 parcelas bimestrais',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'rev-demo-003',
    title: 'Consultoria BIM — Retrofit Corporativo',
    reference_code: 'REV-2026-003',
    status: 'forecast',
    currency: 'BRL',
    amount_forecast: 380000,
    amount_contracted: 0,
    amount_invoiced: 0,
    amount_received: 0,
    contract_signed_date: null,
    expected_close_date: '2026-07-01',
    installments_count: 3,
    client_id: null,
    project_id: null,
    tags: ['bim', 'consultoria'],
    notes: 'Proposta enviada — aguardando assinatura',
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'rev-demo-004',
    title: 'Marina Residencial — Gestão de Obras',
    reference_code: 'REV-2026-004',
    status: 'partially_paid',
    currency: 'BRL',
    amount_forecast: 2750000,
    amount_contracted: 2750000,
    amount_invoiced: 2750000,
    amount_received: 1650000,
    contract_signed_date: '2025-11-20',
    expected_close_date: '2026-08-31',
    installments_count: 8,
    client_id: null,
    project_id: null,
    tags: ['residencial', 'marina'],
    notes: '5 de 8 parcelas pagas',
    created_at: '2025-11-20T00:00:00Z',
  },
  {
    id: 'rev-demo-005',
    title: 'Auditoria Técnica — Galpão Logístico',
    reference_code: 'REV-2026-005',
    status: 'overdue',
    currency: 'BRL',
    amount_forecast: 95000,
    amount_contracted: 95000,
    amount_invoiced: 95000,
    amount_received: 47500,
    contract_signed_date: '2026-02-01',
    expected_close_date: '2026-04-30',
    installments_count: 2,
    client_id: null,
    project_id: null,
    tags: ['auditoria', 'industrial'],
    notes: 'Parcela 2/2 em atraso desde 01/04/2026',
    created_at: '2026-02-01T00:00:00Z',
  },
]

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

export default async function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized — Bearer token required' })
  }

  const sb = getSupabaseService()

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!sb) {
      return res.status(200).json({ demo: true, data: DEMO_RECORDS, total: DEMO_RECORDS.length })
    }

    const { status, currency, client_id, project_id, limit = 50, offset = 0 } = req.query

    let q = sb.from('revenue_records')
      .select('*, clients(nome), projects(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (status) q = q.eq('status', status)
    if (currency) q = q.eq('currency', currency)
    if (client_id) q = q.eq('client_id', client_id)
    if (project_id) q = q.eq('project_id', project_id)

    const { data, error, count } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data, total: count })
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      title, description, reference_code, status = 'forecast',
      currency = 'BRL', amount_forecast = 0, amount_contracted = 0,
      amount_invoiced = 0, amount_received = 0,
      expected_close_date, contract_signed_date,
      installments_count = 1, client_id, project_id,
      contract_id, proposal_id, opportunity_id,
      tags = [], notes, metadata = {}
    } = req.body

    if (!title?.trim()) {
      return res.status(400).json({ error: 'O campo "title" é obrigatório.' })
    }

    if (!sb) {
      const demo = {
        id: `rev-${Date.now()}`,
        title: title.trim(),
        description, reference_code,
        status, currency,
        amount_forecast: Number(amount_forecast),
        amount_contracted: Number(amount_contracted),
        amount_invoiced: Number(amount_invoiced),
        amount_received: Number(amount_received),
        expected_close_date: expected_close_date || null,
        contract_signed_date: contract_signed_date || null,
        installments_count: Number(installments_count),
        installments_generated: false,
        client_id: client_id || null,
        project_id: project_id || null,
        contract_id: contract_id || null,
        proposal_id: proposal_id || null,
        opportunity_id: opportunity_id || null,
        tags, notes, metadata,
        change_log: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return res.status(201).json({ demo: true, data: demo })
    }

    const { data, error } = await sb.from('revenue_records').insert({
      title: title.trim(), description, reference_code,
      status, currency,
      amount_forecast: Number(amount_forecast),
      amount_contracted: Number(amount_contracted),
      amount_invoiced: Number(amount_invoiced),
      amount_received: Number(amount_received),
      expected_close_date: expected_close_date || null,
      contract_signed_date: contract_signed_date || null,
      installments_count: Number(installments_count),
      client_id: client_id || null,
      project_id: project_id || null,
      contract_id: contract_id || null,
      proposal_id: proposal_id || null,
      opportunity_id: opportunity_id || null,
      tags, notes, metadata,
    }).select().single()

    if (error) return res.status(500).json({ error: error.message })

    // Registra evento de criação
    await sb.from('revenue_events').insert({
      revenue_record_id: data.id,
      event_type: 'record_created',
      to_status: data.status,
      payload: { title: data.title, amount_forecast: data.amount_forecast },
    })

    return res.status(201).json({ data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
