import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Fallback: use anon key if service key not configured
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return res.status(200).json({ demo: true, message: 'Modo demo — projeto criado localmente.' })
  }

  // Service role client bypasses RLS (no infinite recursion in profiles policy)
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    name, code, type, city, state,
    start_date, end_date_planned,
  } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome do projeto é obrigatório.' })
  }

  const { data, error } = await sb.from('projects').insert({
    name:             name.trim(),
    code:             code?.trim() || null,
    type:             type || 'edificacao_residencial',
    city:             city?.trim() || null,
    state:            state || null,
    start_date:       start_date || null,
    end_date_planned: end_date_planned || null,
    status:           'planejamento',
    budget_planned:   0,
    budget_actual:    0,
    completion_pct:   0,
  }).select().single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ data })
}
