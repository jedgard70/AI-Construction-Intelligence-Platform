/**
 * POST /api/autonomous/task  — Enfileirar uma tarefa para o agent-loop processar
 * GET  /api/autonomous/task  — Listar tarefas (filtrando por status/project_id)
 *
 * O agent-loop processa automaticamente a cada 5 min.
 * Para processamento imediato, chame POST /api/agent-loop após enfileirar.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { enqueueTask } from '../../../lib/supabase-store'
import { classifyDestructiveRisk, requireOwnerApproval } from '../../../lib/safety/destructive-action-guard'
import { OFFICIAL_WORKSPACE_PATH } from '../../../lib/safety/workspace-guard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const {
      task,
      task_type = 'general',
      context = {},
      priority = 5,
      project_id,
      scheduled_for,
      recurring_cron,
      max_retries = 3,
      triggered_by = 'user',
    } = req.body

    if (!task?.trim()) return res.status(400).json({ error: 'task é obrigatória' })

    const contextPaths = Array.isArray(context?.paths)
      ? context.paths.filter((p: unknown) => typeof p === 'string')
      : []
    const riskReport = classifyDestructiveRisk(String(task), contextPaths)
    const ownerApproved = req.headers['x-owner-approval'] === 'true'
    const approval = requireOwnerApproval({ report: riskReport, ownerApproved })

    if (!approval.allowed) {
      return res.status(403).json({
        error: 'Apex Safety Gate bloqueou tarefa destrutiva sem aprovação do owner.',
        safetyGate: {
          risk: riskReport.risk,
          reasons: riskReport.reasons,
          officialWorkspace: OFFICIAL_WORKSPACE_PATH,
          requiredHeader: 'x-owner-approval: true',
        },
      })
    }

    const enqueued = await enqueueTask({
      tenant_id: req.headers['x-tenant-id'] as string || 'default',
      project_id,
      task,
      task_type,
      context,
      priority: Math.min(10, Math.max(1, Number(priority))),
      max_retries,
      recurring_cron,
      scheduled_for: scheduled_for ?? new Date().toISOString(),
      triggered_by,
    })

    if (!enqueued) {
      return res.status(500).json({ error: 'Falha ao enfileirar tarefa. Verifique SUPABASE configuração.' })
    }

    return res.status(201).json({
      message: 'Tarefa enfileirada. Será processada pelo agent-loop em até 5 minutos.',
      task: enqueued,
      tip: 'Chame POST /api/agent-loop para processamento imediato.',
      safetyGate: {
        risk: riskReport.risk,
        requiresOwnerApproval: riskReport.requiresOwnerApproval,
      },
    })
  }

  if (req.method === 'GET') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return res.status(200).json({ tasks: [], message: 'Supabase não configurado' })

    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, key, { auth: { persistSession: false } })
    const { status, project_id, limit = '20' } = req.query

    let q = client.from('agent_tasks').select().order('created_at', { ascending: false }).limit(Number(limit))
    if (status) q = q.eq('status', status as string)
    if (project_id) q = q.eq('project_id', project_id as string)

    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ tasks: data, total: data?.length ?? 0 })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
