/**
 * POST /api/actions/execute
 *
 * Action Execution Layer — executes agent-driven actions with:
 * - Human approval gates for sensitive operations
 * - Dry-run mode for preview
 * - Capability enforcement per action type
 * - Audit trail
 *
 * Supported action types:
 *   api_calls, workflow_execution, database_updates, task_creation,
 *   erp_actions, notification_dispatch
 *
 * Human approval required for:
 *   financial_transactions, contract_signature, critical_project_changes
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveTenantId, hasFeature } from '../../../lib/tenant'
import { govern, DEFAULT_GOVERNANCE } from '../../../lib/governance'

export const config = { api: { bodyParser: { sizeLimit: '512kb' } } }

export type ActionType =
  | 'api_call'
  | 'workflow_execution'
  | 'database_update'
  | 'task_creation'
  | 'erp_action'
  | 'notification_dispatch'

export type ActionCategory =
  | 'financial_transaction'
  | 'contract_signature'
  | 'critical_project_change'
  | 'routine'

const HUMAN_APPROVAL_CATEGORIES: ActionCategory[] = [
  'financial_transaction',
  'contract_signature',
  'critical_project_change',
]

export interface Action {
  id: string
  type: ActionType
  category: ActionCategory
  description: string
  payload: Record<string, unknown>
  requestedBy: string    // agent ID or user ID
  projectId?: string
  dryRun?: boolean
}

export interface ActionResult {
  actionId: string
  status: 'executed' | 'pending_approval' | 'blocked' | 'dry_run'
  result?: unknown
  approvalId?: string
  blockedReason?: string
  executedAt?: string
  durationMs?: number
}

// In-memory approval queue
const APPROVAL_QUEUE: Map<string, {
  action: Action
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
}> = new Map()

// Audit log
const AUDIT_LOG: Array<{
  actionId: string
  type: ActionType
  category: ActionCategory
  status: ActionResult['status']
  requestedBy: string
  tenantId: string
  timestamp: string
  durationMs?: number
}> = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tenantId = resolveTenantId(req.headers as Record<string, string | string[] | undefined>)

  // GET: list pending approvals
  if (req.method === 'GET') {
    const pending = Array.from(APPROVAL_QUEUE.values())
      .filter(q => !q.approvedBy)
      .map(q => ({ ...q.action, requestedAt: q.requestedAt }))
    return res.status(200).json({ pending, auditLog: AUDIT_LOG.slice(-50) })
  }

  // PATCH: approve a pending action
  if (req.method === 'PATCH') {
    const { approvalId, approved, approvedBy = 'human_reviewer' } = req.body
    const pending = APPROVAL_QUEUE.get(approvalId)
    if (!pending) return res.status(404).json({ error: 'Aprovação não encontrada' })

    if (!approved) {
      APPROVAL_QUEUE.delete(approvalId)
      AUDIT_LOG.push({
        actionId: pending.action.id, type: pending.action.type,
        category: pending.action.category, status: 'blocked',
        requestedBy: pending.action.requestedBy, tenantId,
        timestamp: new Date().toISOString(),
      })
      return res.status(200).json({ status: 'rejected', actionId: pending.action.id })
    }

    const start = Date.now()
    const result = await executeAction(pending.action, tenantId)
    pending.approvedBy = approvedBy
    pending.approvedAt = new Date().toISOString()
    APPROVAL_QUEUE.delete(approvalId)

    AUDIT_LOG.push({
      actionId: pending.action.id, type: pending.action.type,
      category: pending.action.category, status: 'executed',
      requestedBy: pending.action.requestedBy, tenantId,
      timestamp: new Date().toISOString(), durationMs: Date.now() - start,
    })

    return res.status(200).json({ status: 'executed', result, approvedBy, actionId: pending.action.id })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!hasFeature(tenantId, 'action_execution') && tenantId !== 'default') {
    return res.status(403).json({ error: 'action_execution not available on this plan' })
  }

  const actions: Action[] = Array.isArray(req.body) ? req.body : [req.body]
  const results: ActionResult[] = []
  const start = Date.now()

  for (const action of actions) {
    if (!action.id || !action.type || !action.category) {
      results.push({ actionId: action.id ?? 'unknown', status: 'blocked', blockedReason: 'id, type e category são obrigatórios' })
      continue
    }

    // Governance check — evaluate if AI output justifying this action is trustworthy
    const govResult = govern(
      action.description,
      action.payload,
      ['description'],
      '',
      DEFAULT_GOVERNANCE
    )

    if (govResult.outcome === 'block_execution') {
      const result: ActionResult = {
        actionId: action.id,
        status: 'blocked',
        blockedReason: `Confiança insuficiente (${(govResult.confidence * 100).toFixed(0)}%): ${govResult.reasoning}`,
      }
      results.push(result)
      AUDIT_LOG.push({ actionId: action.id, type: action.type, category: action.category, status: 'blocked', requestedBy: action.requestedBy, tenantId, timestamp: new Date().toISOString() })
      continue
    }

    // Human approval gate
    if (HUMAN_APPROVAL_CATEGORIES.includes(action.category) && !action.dryRun) {
      const approvalId = `apr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      APPROVAL_QUEUE.set(approvalId, { action, requestedAt: new Date().toISOString() })
      results.push({ actionId: action.id, status: 'pending_approval', approvalId })
      AUDIT_LOG.push({ actionId: action.id, type: action.type, category: action.category, status: 'pending_approval', requestedBy: action.requestedBy, tenantId, timestamp: new Date().toISOString() })
      continue
    }

    // Dry run
    if (action.dryRun) {
      results.push({
        actionId: action.id,
        status: 'dry_run',
        result: simulateAction(action),
        executedAt: new Date().toISOString(),
      })
      continue
    }

    // Execute
    try {
      const actionStart = Date.now()
      const result = await executeAction(action, tenantId)
      const dur = Date.now() - actionStart
      results.push({ actionId: action.id, status: 'executed', result, executedAt: new Date().toISOString(), durationMs: dur })
      AUDIT_LOG.push({ actionId: action.id, type: action.type, category: action.category, status: 'executed', requestedBy: action.requestedBy, tenantId, timestamp: new Date().toISOString(), durationMs: dur })
    } catch (err: unknown) {
      results.push({ actionId: action.id, status: 'blocked', blockedReason: err instanceof Error ? err.message : String(err) })
    }
  }

  return res.status(200).json({
    results,
    totalDurationMs: Date.now() - start,
    executedAt: new Date().toISOString(),
  })
}

// ─── Action Executors ─────────────────────────────────────────────────────────

async function executeAction(action: Action, tenantId: string): Promise<unknown> {
  switch (action.type) {
    case 'notification_dispatch':
      return dispatchNotification(action.payload, tenantId)
    case 'task_creation':
      return createTask(action.payload)
    case 'api_call':
      return externalApiCall(action.payload)
    case 'workflow_execution':
      return { workflowId: action.id, status: 'triggered', triggeredAt: new Date().toISOString() }
    case 'database_update':
      return { updated: true, table: action.payload.table, id: action.payload.id }
    case 'erp_action':
      return { erpAction: action.payload.action, status: 'queued', queuedAt: new Date().toISOString() }
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function dispatchNotification(payload: Record<string, unknown>, _tenantId: string): Promise<unknown> {
  const webhookUrl = process.env.SALES_WEBHOOK_URL
  if (webhookUrl && payload.channel === 'webhook') {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, dispatchedAt: new Date().toISOString() }),
    }).catch(() => {})
  }
  return { dispatched: true, channel: payload.channel ?? 'internal', recipient: payload.recipient }
}

async function createTask(payload: Record<string, unknown>): Promise<unknown> {
  return {
    taskId: `task_${Date.now()}`,
    title: payload.title,
    assignee: payload.assignee,
    dueDate: payload.dueDate,
    status: 'created',
    createdAt: new Date().toISOString(),
  }
}

async function externalApiCall(payload: Record<string, unknown>): Promise<unknown> {
  const url = payload.url as string
  if (!url || !url.startsWith('https://')) throw new Error('URL HTTPS obrigatória para api_call')
  const resp = await fetch(url, {
    method: (payload.method as string) ?? 'GET',
    headers: (payload.headers as Record<string, string>) ?? {},
    body: payload.body ? JSON.stringify(payload.body) : undefined,
  })
  return { status: resp.status, ok: resp.ok }
}

function simulateAction(action: Action): unknown {
  return {
    simulated: true,
    type: action.type,
    category: action.category,
    wouldExecute: !HUMAN_APPROVAL_CATEGORIES.includes(action.category),
    requiresApproval: HUMAN_APPROVAL_CATEGORIES.includes(action.category),
    payload: action.payload,
  }
}
