/**
 * GET/POST /api/agent-loop
 *
 * O CÉREBRO AUTÔNOMO da plataforma. Disparado pelo Vercel Cron a cada 5 min.
 * Também pode ser chamado manualmente via POST.
 *
 * Ciclo autônomo:
 *  1. Processa fila de tarefas pendentes (agent_tasks no Supabase)
 *  2. Monitora projetos ativos — orçamento, CPI, SPI, segurança
 *  3. Cria alertas automáticos para anomalias detectadas
 *  4. Gera relatório de status diário para projetos fully_autonomous
 *  5. Agenda RDO automático às 18h para projetos autônomos
 *
 * Zero dependências externas. Usa apenas: Supabase + Claude + Gemini.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getActiveProjects,
  claimPendingTasks,
  completeTask,
  failTask,
  createAlert,
  updateProjectAIContext,
  logAgentExecution,
  memoryGet,
  memorySet,
  enqueueTask,
} from '../../lib/supabase-store'
import type { ProjectSnapshot } from '../../lib/supabase-store'
import { route, callModel } from '../../lib/llm-router'
import { govern, DEFAULT_GOVERNANCE } from '../../lib/governance'
import { startTrace, addSpan, endTrace } from '../../lib/observability'
import { extractJson } from '../../lib/agent-graph'

export const config = { api: { bodyParser: false } }

const CRON_SECRET = process.env.CRON_SECRET ?? ''

interface LoopReport {
  cycleId: string
  projectsMonitored: number
  tasksProcessed: number
  alertsCreated: number
  errors: string[]
  startedAt: string
  finishedAt?: string
  durationMs?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel Cron envia Authorization: Bearer <CRON_SECRET>
  if (CRON_SECRET) {
    const auth = req.headers.authorization ?? ''
    if (req.method === 'GET' && auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const loopStart = Date.now()
  const trace = startTrace(`loop_${Date.now()}`, 'Autonomous Agent Loop')
  const cycleId = trace.traceId

  const report: LoopReport = {
    cycleId,
    projectsMonitored: 0,
    tasksProcessed: 0,
    alertsCreated: 0,
    errors: [],
    startedAt: new Date().toISOString(),
  }

  // ── 1. Processar fila de tarefas pendentes ──────────────────────────────────
  const pendingTasks = await claimPendingTasks(10)
  for (const task of pendingTasks) {
    const taskStart = Date.now()
    try {
      const result = await executeTask(task.task, task.task_type, task.context)
      await completeTask(task.id, result, ['autonomous_brain'], cycleId)
      await logAgentExecution({
        agentName: 'Risk Predictor',
        projectId: task.project_id,
        input: { task: task.task },
        output: result,
        status: 'success',
        durationMs: Date.now() - taskStart,
      })
      report.tasksProcessed++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await failTask(task.id, msg, task.retry_count, task.max_retries)
      report.errors.push(`task:${task.id}: ${msg}`)
    }
  }

  // ── 2. Monitorar projetos ativos ────────────────────────────────────────────
  const projects = await getActiveProjects()
  for (const project of projects) {
    try {
      const alerts = await monitorProject(project, cycleId)
      report.alertsCreated += alerts
      report.projectsMonitored++
    } catch (err: unknown) {
      report.errors.push(`project:${project.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── 3. Agendar tarefas recorrentes ──────────────────────────────────────────
  await scheduleRecurringTasks(projects)

  report.finishedAt = new Date().toISOString()
  report.durationMs = Date.now() - loopStart
  endTrace(cycleId, report.errors.length === 0 ? 'completed' : 'partial')
  await memorySet('last_loop_report', report)

  return res.status(200).json(report)
}

// ─── Monitor de Projeto ───────────────────────────────────────────────────────

async function monitorProject(project: ProjectSnapshot, cycleId: string): Promise<number> {
  let alertCount = 0

  // Verificar estouro ou proximidade do orçamento
  if (project.budget_total && project.budget_spent != null) {
    const spentPct = project.budget_spent / project.budget_total
    if (spentPct > 1.0) {
      await createAlert({
        project_id: project.id,
        type: 'budget_overrun',
        severity: 'critico',
        title: `Estouro de orçamento — ${project.name}`,
        description: `Orçamento excedido em ${((spentPct - 1) * 100).toFixed(1)}%. Gasto: R$ ${project.budget_spent.toLocaleString('pt-BR')} de R$ ${project.budget_total.toLocaleString('pt-BR')}`,
        data: { spent_pct: spentPct, budget_total: project.budget_total, budget_spent: project.budget_spent },
      })
      alertCount++
    } else if (spentPct > 0.9) {
      await createAlert({
        project_id: project.id,
        type: 'budget_overrun',
        severity: 'alto',
        title: `90% do orçamento atingido — ${project.name}`,
        description: `${(spentPct * 100).toFixed(1)}% do orçamento consumido. Restam R$ ${((1 - spentPct) * project.budget_total).toLocaleString('pt-BR')}.`,
        data: { spent_pct: spentPct },
      })
      alertCount++
    }
  }

  // Verificar CPI crítico (< 0.85 = ineficiência de custo grave)
  if (project.cpi != null && project.cpi < 0.85) {
    await createAlert({
      project_id: project.id,
      type: 'performance',
      severity: project.cpi < 0.70 ? 'critico' : 'alto',
      title: `CPI crítico — ${project.name}`,
      description: `CPI = ${project.cpi.toFixed(2)}. Projeto consumindo ${((1 / project.cpi - 1) * 100).toFixed(0)}% a mais que o planejado por unidade de trabalho.`,
      data: { cpi: project.cpi, spi: project.spi },
    })
    alertCount++
  }

  // Verificar SPI crítico (< 0.85 = atraso significativo)
  if (project.spi != null && project.spi < 0.85) {
    await createAlert({
      project_id: project.id,
      type: 'schedule_delay',
      severity: project.spi < 0.70 ? 'critico' : 'medio',
      title: `Atraso de cronograma — ${project.name}`,
      description: `SPI = ${project.spi.toFixed(2)}. Projeto executando apenas ${(project.spi * 100).toFixed(0)}% do planejado.`,
      data: { spi: project.spi, cpi: project.cpi },
    })
    alertCount++
  }

  // Verificar safety_index baixo (< 0.7 = risco NR)
  if (project.safety_index != null && project.safety_index < 0.7) {
    await createAlert({
      project_id: project.id,
      type: 'safety',
      severity: 'alto',
      title: `Safety Index baixo — ${project.name}`,
      description: `Índice de segurança = ${project.safety_index.toFixed(2)}. Verificar conformidade NR-18 e NR-35.`,
      data: { safety_index: project.safety_index },
    })
    alertCount++
  }

  // Para projetos fully_autonomous: gerar análise de IA diária
  if (project.execution_mode === 'fully_autonomous') {
    const reportKey = `ai_report_${project.id}_${todayStr()}`
    const alreadyGenerated = await memoryGet(reportKey)

    if (!alreadyGenerated) {
      const analysisResult = await generateAIAnalysis(project)
      if (analysisResult) {
        await memorySet(reportKey, { generatedAt: new Date().toISOString() })
        await updateProjectAIContext(project.id, {
          last_ai_analysis: analysisResult,
          last_analyzed_at: new Date().toISOString(),
          cycle_id: cycleId,
        })

        // Se IA identificou riscos críticos → criar alerta
        if (analysisResult.status === 'critical' || (analysisResult.risks as string[])?.length > 0) {
          await createAlert({
            project_id: project.id,
            type: 'anomaly',
            severity: analysisResult.status === 'critical' ? 'critico' : 'medio',
            title: `Análise IA: ${project.name} — ${analysisResult.status}`,
            description: (analysisResult.recommendations as string[])?.[0] ?? 'Ver análise completa no painel.',
            data: analysisResult as Record<string, unknown>,
            auto_action_taken: true,
            auto_action_result: { action: 'ai_analysis_stored', key: reportKey },
          })
          alertCount++
        }
      }
    }
  }

  return alertCount
}

// ─── Análise de IA para Projeto ───────────────────────────────────────────────

async function generateAIAnalysis(project: ProjectSnapshot): Promise<Record<string, unknown> | null> {
  const budgetPct = project.budget_total
    ? ((project.budget_spent ?? 0) / project.budget_total * 100).toFixed(1)
    : 'N/A'

  const decision = route('fast', `Analyze project ${project.name}`)
  const start = Date.now()

  try {
    const resp = await callModel(decision, {
      system: `Você é o Risk Predictor da plataforma ACIP. Analise o projeto de construção e retorne JSON. Seja conciso.`,
      messages: [{
        role: 'user',
        content: `Projeto: ${project.name}
Status: ${project.status}
Orçamento consumido: ${budgetPct}%
CPI: ${project.cpi ?? 'N/A'} | SPI: ${project.spi ?? 'N/A'}
Safety Index: ${project.safety_index ?? 'N/A'}

Retorne JSON:
{
  "status": "on_track|at_risk|critical",
  "health_score": 0-100,
  "risks": ["risco 1", "risco 2"],
  "recommendations": ["ação 1", "ação 2"],
  "priority_action": "ação mais urgente"
}`,
      }],
      maxTokens: 800,
    })

    const parsed = extractJson(resp.text)
    const govResult = govern(resp.text, parsed, ['status', 'recommendations'], '', DEFAULT_GOVERNANCE)

    addSpan(resp.modelKey ?? 'unknown', {
      agentId: 'Risk_Predictor',
      taskType: 'monitoring',
      model: decision.modelKey,
      provider: decision.config.provider,
      startedAt: new Date(Date.now() - (Date.now() - start)).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      inputTokens: resp.inputTokens ?? 0,
      outputTokens: resp.outputTokens ?? 0,
      costUSD: ((resp.inputTokens ?? 0) / 1000) * decision.config.costPer1kTokensUSD,
      success: true,
      hallucinationDetected: govResult.hallucinations.length > 0,
      confidenceScore: govResult.confidence,
      projectId: project.id,
      metadata: { type: 'autonomous_analysis' },
    } as Parameters<typeof addSpan>[1])

    return govResult.confidence >= 0.70 ? parsed : null
  } catch {
    return null
  }
}

// ─── Executor de Tarefa Genérica ──────────────────────────────────────────────

async function executeTask(
  task: string,
  taskType: string,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const isComplex = taskType === 'report' || taskType === 'analysis' || taskType === 'planning'
  const decision = route(isComplex ? 'high_reasoning' : 'fast', task)

  const resp = await callModel(decision, {
    system: `Você é um agente autônomo de construção civil da plataforma ACIP.
Execute a tarefa e retorne JSON estruturado.
Contexto: ${JSON.stringify(context).slice(0, 500)}`,
    messages: [{ role: 'user', content: task }],
    maxTokens: isComplex ? 2000 : 800,
  })

  const parsed = extractJson(resp.text)
  return parsed ?? { result: resp.text, model: decision.modelKey, executedAt: new Date().toISOString() }
}

// ─── Agendamento Recorrente ───────────────────────────────────────────────────

async function scheduleRecurringTasks(projects: ProjectSnapshot[]): Promise<void> {
  for (const project of projects) {
    if (project.execution_mode !== 'fully_autonomous') continue

    const rdoKey = `rdo_queued_${project.id}_${todayStr()}`
    const alreadyQueued = await memoryGet(rdoKey)
    if (alreadyQueued) continue

    // Agendar RDO automático para 18h
    const rdo18h = new Date()
    rdo18h.setHours(18, 0, 0, 0)
    if (rdo18h < new Date()) rdo18h.setDate(rdo18h.getDate() + 1)

    await enqueueTask({
      tenant_id: 'default',
      project_id: project.id,
      task: `Gere o Relatório Diário de Obra (RDO) para ${todayStr()} — Projeto: "${project.name}".
Inclua: atividades do dia, equipe, materiais, segurança, progresso e observações.
CPI: ${project.cpi ?? 'N/A'} | SPI: ${project.spi ?? 'N/A'} | Orçamento: ${
  project.budget_total ? ((project.budget_spent ?? 0) / project.budget_total * 100).toFixed(0) + '%' : 'N/A'
} consumido.
Retorne JSON: {date, project_name, activities, team_size, materials_used, safety_occurrences, progress_pct, notes}`,
      task_type: 'report',
      context: {
        project_id: project.id,
        project_name: project.name,
        cpi: project.cpi,
        spi: project.spi,
      },
      priority: 7,
      max_retries: 2,
      scheduled_for: rdo18h.toISOString(),
      triggered_by: 'system:agent_loop',
    })

    await memorySet(rdoKey, { scheduledFor: rdo18h.toISOString() })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
