import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type EventPriority = 'critico' | 'alto' | 'medio' | 'baixo'
type EventStatus = 'pendente' | 'processando' | 'processado' | 'falhou' | 'dead_letter'

const EVENT_TYPES = new Set([
  'clash_detectado',
  'desvio_custo',
  'risco_identificado',
  'atraso_caminho_critico',
  'incidente_seguranca',
  'oportunidade_investimento',
  'nao_conformidade_qualidade',
  'documento_processado',
  'sinapi_atualizado',
  'desvio_esg',
])

function getPublicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

function getBearer(req: NextApiRequest) {
  const raw = req.headers.authorization || ''
  return raw.startsWith('Bearer ') ? raw.slice('Bearer '.length).trim() : ''
}

function cleanText(value: unknown, fallback: string, max = 240) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publicKey = getPublicKey()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const token = getBearer(req)

  if (!token) return res.status(401).json({ error: 'Authorization Bearer token obrigatorio.' })
  if (!url || !publicKey) return res.status(500).json({ error: 'Supabase publico nao configurado.' })

  if (!serviceKey) {
    return res.status(503).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor. Agent events exigem API server-side com service role.',
    })
  }

  const userClient = createClient(url, publicKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser(token)
  if (userErr || !userData.user) return res.status(401).json({ error: 'Sessao invalida.' })

  const body = req.body ?? {}
  const projectId = typeof body.project_id === 'string' && body.project_id ? body.project_id : null

  if (projectId) {
    const { error: projectErr } = await userClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectErr) {
      return res.status(403).json({ error: `Usuario sem acesso ao projeto informado: ${projectErr.message}` })
    }
  }

  const eventType = EVENT_TYPES.has(body.event_type) ? body.event_type : 'documento_processado'
  const priority = (['critico', 'alto', 'medio', 'baixo'].includes(body.priority) ? body.priority : 'medio') as EventPriority
  const status = (['pendente', 'processando', 'processado', 'falhou', 'dead_letter'].includes(body.status) ? body.status : 'pendente') as EventStatus

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from('agent_events')
    .insert({
      project_id: projectId,
      event_type: eventType,
      source_agent: cleanText(body.source_agent, 'Apex_Server_Agent', 120),
      target_agents: Array.isArray(body.target_agents) ? body.target_agents.slice(0, 12) : null,
      payload: typeof body.payload === 'object' && body.payload !== null ? body.payload : {},
      summary: cleanText(body.summary, 'Evento de agente registrado.', 500),
      priority,
      status,
      triggered_by: userData.user.id,
    })
    .select('id,project_id,event_type,source_agent,priority,status,created_at')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true, event: data })
}
