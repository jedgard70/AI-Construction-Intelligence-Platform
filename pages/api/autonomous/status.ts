/**
 * GET /api/autonomous/status
 * Painel de controle do sistema autônomo.
 *
 * Retorna:
 *  - Último relatório do loop
 *  - Alertas abertos
 *  - Próximas tarefas agendadas
 *  - Saúde geral do sistema
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { memoryGet, getOpenAlerts } from '../../../lib/supabase-store'
import { createClient } from '@supabase/supabase-js'
import { APPROVAL_GUARDRAILS, getNextAutonomousBlock } from '../../../lib/autonomous/model'

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const client = db()

  const [lastReport, openAlerts, pendingTasks, recentTasks] = await Promise.all([
    memoryGet('last_loop_report'),
    getOpenAlerts(),
    client ? client
      .from('agent_tasks')
      .select('id, task, task_type, priority, scheduled_for, project_id, triggered_by')
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })
      .limit(10)
      .then((r: { data: unknown }) => r.data ?? []) : Promise.resolve([]),
    client ? client
      .from('agent_tasks')
      .select('id, task, task_type, status, finished_at, duration_ms, result, error')
      .in('status', ['done', 'failed'])
      .order('finished_at', { ascending: false })
      .limit(10)
      .then((r: { data: unknown }) => r.data ?? []) : Promise.resolve([]),
  ])

  const alertsByType = (openAlerts as Array<{ type: string; severity: string }>).reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return res.status(200).json({
    system: {
      status: 'autonomous',
      cronSchedule: '*/5 * * * *',
      lastCycle: (lastReport as Record<string, unknown>)?.finishedAt ?? null,
      lastCycleDurationMs: (lastReport as Record<string, unknown>)?.durationMs ?? null,
    },
    governance: {
      destructiveActionsAllowed: false,
      criticalDeployAllowed: false,
      migrationWithoutApprovalAllowed: false,
      requiredApprovals: APPROVAL_GUARDRAILS,
    },
    execution: {
      nextRecommendedBlock: getNextAutonomousBlock(),
      mode: 'guided',
    },
    lastLoop: lastReport,
    alerts: {
      open: openAlerts.length,
      bySeverity: alertsByType,
      items: openAlerts.slice(0, 5),
    },
    tasks: {
      pending: (pendingTasks as unknown[]).length,
      upcoming: pendingTasks,
      recent: recentTasks,
    },
  })
}
