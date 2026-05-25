// ============================================================
// AI Executive Orchestrator — API Endpoint
// pages/api/orchestrator.ts
//
// IMPORTANTE: Este arquivo é diferente de:
//   pages/api/agents/orchestrator.ts  ← executor de agentes (NÃO MODIFICAR)
//
// Este endpoint é o orquestrador EXECUTIVO:
//   - Recebe uma intenção em linguagem natural
//   - Gera um plano com steps classificados por risco
//   - Retorna o plano para APROVAÇÃO HUMANA
//   - NÃO executa nada automaticamente
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { generatePlan, Plan } from '../../lib/orchestrator/planner'
import { Jurisdiction, RiskLevel } from '../../lib/orchestrator/rules'

// ─── Request / Response Types ────────────────────────────────
interface OrchestratorRequest {
  intent: string
  jurisdiction?: Jurisdiction
  environment?: 'development' | 'staging' | 'production'
  dry_run?: boolean
  tenant_id?: string
  metadata?: Record<string, unknown>
}

interface OrchestratorResponse {
  plan: Plan
  risk_summary: {
    overall_risk: RiskLevel
    overall_score: number
    total_steps: number
    blocked_steps: number
    steps_requiring_approval: number
  }
  blocked_actions: string[]
  requires_human_approval: boolean
  status: Plan['status']
  advisory: string
}

interface ErrorResponse {
  error: string
  code: string
}

// ─── Handler ─────────────────────────────────────────────────
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrchestratorResponse | ErrorResponse>,
) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  // Parse body
  const body = req.body as Partial<OrchestratorRequest>

  if (!body.intent || typeof body.intent !== 'string' || body.intent.trim().length === 0) {
    return res.status(400).json({ error: 'intent é obrigatório', code: 'MISSING_INTENT' })
  }

  const intent = body.intent.trim()
  const jurisdiction: Jurisdiction = body.jurisdiction ?? 'BR'
  const environment = body.environment ?? 'development'
  const dry_run = body.dry_run !== false // default true — never auto-execute

  // Validate jurisdiction
  const validJurisdictions: Jurisdiction[] = ['BR', 'PT', 'US', 'EU']
  if (!validJurisdictions.includes(jurisdiction)) {
    return res.status(400).json({
      error: `Jurisdição inválida: ${jurisdiction}. Use: BR, PT, US, EU`,
      code: 'INVALID_JURISDICTION',
    })
  }

  // Generate plan (pure — no side effects)
  let plan: Plan
  try {
    plan = generatePlan(
      intent,
      {
        tenant_id: body.tenant_id,
        environment,
        dry_run,
        metadata: body.metadata,
      },
      jurisdiction,
    )
  } catch (err) {
    console.error('[orchestrator] plan generation error:', err)
    return res.status(500).json({
      error: 'Erro ao gerar plano de execução',
      code: 'PLAN_GENERATION_ERROR',
    })
  }

  // Build response
  const blocked_actions = plan.blocked_steps.map(s => s.action)
  const steps_requiring_approval = [...plan.steps, ...plan.blocked_steps].filter(
    s => s.requires_approval,
  ).length

  const advisory = buildAdvisory(plan)

  const response: OrchestratorResponse = {
    plan,
    risk_summary: {
      overall_risk: plan.overall_risk,
      overall_score: plan.overall_score,
      total_steps: plan.steps.length + plan.blocked_steps.length,
      blocked_steps: plan.blocked_steps.length,
      steps_requiring_approval,
    },
    blocked_actions,
    requires_human_approval: plan.requires_human_approval,
    status: plan.status,
    advisory,
  }

  return res.status(200).json(response)
}

// ─── Advisory Message ────────────────────────────────────────
function buildAdvisory(plan: Plan): string {
  if (plan.status === 'blocked') {
    return `⛔ Plano BLOQUEADO: ${plan.blocked_steps.length} ação(ões) na lista de bloqueio permanente. Revisão manual obrigatória.`
  }
  if (plan.overall_risk === RiskLevel.CRITICAL) {
    return `🚨 Risco CRÍTICO detectado. Aprovação de administrador obrigatória antes de qualquer execução.`
  }
  if (plan.overall_risk === RiskLevel.HIGH) {
    return `⚠️ Risco ALTO. Revisão cuidadosa recomendada. Aprovação necessária para prosseguir.`
  }
  if (plan.overall_risk === RiskLevel.MEDIUM) {
    return `🔶 Risco MÉDIO. Verifique os passos antes de aprovar.`
  }
  return `✅ Risco BAIXO. Plano pode ser executado após revisão.`
}
