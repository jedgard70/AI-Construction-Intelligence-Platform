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

export default async function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized — Bearer token required' })
  }

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID obrigatório' })

  const sb = getSupabaseService()

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!sb) {
      return res.status(200).json({ demo: true, data: null, message: 'Supabase não configurado' })
    }

    const { data: record, error: recErr } = await sb
      .from('revenue_records')
      .select('*, clients(nome, email), projects(name, code)')
      .eq('id', id)
      .single()

    if (recErr) return res.status(404).json({ error: 'Registro não encontrado' })

    const { data: installments } = await sb
      .from('revenue_installments')
      .select('*')
      .eq('revenue_record_id', id)
      .order('installment_number')

    const { data: events } = await sb
      .from('revenue_events')
      .select('*')
      .eq('revenue_record_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    return res.status(200).json({ data: { ...record, installments: installments || [], events: events || [] } })
  }

  // ── PUT ────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const allowed = [
      'title', 'description', 'status', 'currency',
      'amount_forecast', 'amount_contracted', 'amount_invoiced', 'amount_received',
      'expected_close_date', 'contract_signed_date', 'first_invoice_date', 'last_payment_date',
      'installments_count', 'client_id', 'project_id', 'contract_id',
      'proposal_id', 'opportunity_id', 'tags', 'notes', 'metadata',
    ]

    const updates = {}
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' })
    }

    if (!sb) {
      return res.status(200).json({ demo: true, data: { id, ...updates, updated_at: new Date().toISOString() } })
    }

    // Captura status anterior para evento
    const { data: before } = await sb.from('revenue_records').select('status').eq('id', id).single()

    const { data, error } = await sb.from('revenue_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Registra evento se houve mudança de status
    if (updates.status && before?.status !== updates.status) {
      await sb.from('revenue_events').insert({
        revenue_record_id: id,
        event_type: 'status_changed',
        from_status: before?.status,
        to_status: updates.status,
        payload: { updated_fields: Object.keys(updates) },
      })
    }

    return res.status(200).json({ data })
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!sb) {
      return res.status(200).json({ demo: true, message: 'Registro removido (demo)' })
    }

    const { error } = await sb.from('revenue_records').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ message: 'Registro removido com sucesso' })
  }

  // ── POST /[id]/installments — gerar parcelas ───────────────────────────────
  // Nota: rota inline para manter simplicidade; mover para subrota se escalar
  return res.status(405).json({ error: 'Method not allowed' })
}
