/**
 * POST /api/agents/orchestrator
 *
 * Graph-based agent orchestrator with:
 * - LLM task decomposition → execution DAG
 * - Parallel layer execution (dependency-resolved)
 * - Priority scheduling, fallback agents
 * - Per-agent governance (confidence thresholds)
 * - Memory routing between agents
 * - Multi-tenant isolation
 * - Observability traces
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { buildExecutionLayers, resolvePrompt, extractJson, routeMemory } from '../../../lib/agent-graph'
import type { AgentGraph, AgentNode } from '../../../lib/agent-graph'
import { govern, DEFAULT_GOVERNANCE } from '../../../lib/governance'
import { route, callModel, estimateComplexity } from '../../../lib/llm-router'
import { startTrace, addSpan, endTrace } from '../../../lib/observability'
import { resolveTenantId, hasFeature, checkTokenBudget, consumeTokens, tenantGetAll, tenantSet } from '../../../lib/tenant'
import { getActivePrompt, interpolate, recordPromptUse } from '../../../lib/prompt-governor'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

interface OrchestratorRequest {
  task: string
  context?: Record<string, unknown>
  project_id?: string
  agents?: Partial<AgentNode>[]   // Optional: provide pre-defined agents, skip decomposition
  governance?: {
    auto_execute_threshold?: number
    human_review_threshold?: number
  }
  options?: {
    max_agents?: number
    enable_reflection?: boolean
    memory_keys?: string[]
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const tenantId = resolveTenantId(req.headers as Record<string, string | string[] | undefined>)

  if (!hasFeature(tenantId, 'agent_orchestrator') && tenantId !== 'default') {
    return res.status(403).json({ error: 'agent_orchestrator feature not available on this plan' })
  }

  const body: OrchestratorRequest = req.body
  if (!body.task?.trim()) return res.status(400).json({ error: 'task é obrigatório' })

  const trace = startTrace(`orchestrator_${Date.now()}`, body.task, tenantId)
  const memory: Record<string, unknown> = {
    task: body.task,
    project_id: body.project_id ?? 'unknown',
    ...tenantGetAll(tenantId),
    ...(body.context ?? {}),
  }

  try {
    // ── Step 1: Decompose task into agent graph ────────────────────────────────
    let nodes: AgentNode[]

    if (body.agents?.length) {
      // Use caller-provided agent definitions
      nodes = body.agents.map((a, i) => ({
        id: a.id ?? `agent_${i}`,
        name: a.name ?? `Agent ${i}`,
        role: a.role ?? 'generic',
        userPrompt: a.userPrompt ?? body.task,
        dependencies: a.dependencies ?? [],
        priority: a.priority ?? 5,
        status: 'pending',
        model: a.model,
        maxTokens: a.maxTokens,
        fallbackId: a.fallbackId,
        maxRetries: a.maxRetries ?? 1,
      } as AgentNode))
    } else {
      nodes = await decomposeTask(body.task, body.context ?? {}, body.options?.max_agents ?? 6)
    }

    if (!nodes.length) {
      // Single-agent fallback
      nodes = [{
        id: 'primary_agent',
        name: 'Primary Agent',
        role: 'general',
        userPrompt: body.task,
        dependencies: [],
        priority: 10,
        status: 'pending',
        maxRetries: 2,
      }]
    }

    const graph: AgentGraph = {
      taskId: trace.traceId,
      description: body.task,
      nodes,
      memory,
    }

    // ── Step 2: Build execution layers ────────────────────────────────────────
    const layers = buildExecutionLayers(graph)
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // ── Step 3: Execute each layer in parallel ────────────────────────────────
    const govConfig = {
      ...DEFAULT_GOVERNANCE,
      thresholds: {
        auto_execute: body.governance?.auto_execute_threshold ?? 0.92,
        human_review: body.governance?.human_review_threshold ?? 0.75,
        block_execution: 0.50,
      },
    }

    const humanReviewQueue: Array<{ nodeId: string; reviewId: string; output: string }> = []

    for (const layer of layers) {
      await Promise.all(layer.map(async (nodeId) => {
        const node = nodeMap.get(nodeId)!
        node.status = 'running'
        node.startedAt = new Date().toISOString()

        const resolvedPrompt = resolvePrompt(node.userPrompt, memory, Object.fromEntries(nodeMap))
        const routeDecision = route(
          (node as AgentNode & { taskType?: string }).taskType as never ?? 'fast',
          resolvedPrompt,
          node.systemPrompt,
        )

        if (!checkTokenBudget(tenantId, node.maxTokens ?? 2000)) {
          node.status = 'failed'
          node.error = 'Token budget exceeded for this tenant'
          node.finishedAt = new Date().toISOString()
          return
        }

        let retries = 0
        const maxRetries = node.maxRetries ?? 1

        while (retries <= maxRetries) {
          try {
            const inferStart = Date.now()
            const resp = await callModel(routeDecision, {
              system: node.systemPrompt ?? buildDefaultSystem(node.role, body.project_id),
              messages: [{ role: 'user', content: resolvedPrompt }],
              maxTokens: node.maxTokens ?? 1500,
            })

            node.output = resp.text
            node.outputJson = extractJson(resp.text) ?? undefined
            node.finishedAt = new Date().toISOString()
            node.durationMs = Date.now() - new Date(node.startedAt!).getTime()

            // Governance check
            const govResult = govern(
              resp.text,
              node.outputJson ?? null,
              [],
              JSON.stringify(body.context ?? {}),
              govConfig
            )

            consumeTokens(tenantId, (resp.inputTokens ?? 0) + (resp.outputTokens ?? 0))

            addSpan(trace.traceId, {
              agentId: nodeId,
              taskType: node.role,
              model: routeDecision.modelKey,
              provider: routeDecision.config.provider,
              startedAt: node.startedAt!,
              finishedAt: node.finishedAt,
              durationMs: node.durationMs,
              inputTokens: resp.inputTokens ?? 0,
              outputTokens: resp.outputTokens ?? 0,
              costUSD: ((resp.inputTokens ?? 0) / 1000) * routeDecision.config.costPer1kTokensUSD,
              success: true,
              hallucinationDetected: govResult.hallucinations.length > 0,
              confidenceScore: govResult.confidence,
              tenantId,
              projectId: body.project_id,
              metadata: { nodeId, layer: layers.indexOf(layer) },
            })

            if (govResult.outcome === 'human_review') {
              humanReviewQueue.push({ nodeId, reviewId: govResult.requiresHumanId!, output: resp.text })
            }

            node.status = govResult.outcome === 'block_execution' ? 'failed' : 'done'

            // Route memory for downstream agents
            routeMemory(node, memory, body.options?.memory_keys)
            tenantSet(tenantId, `last_${nodeId}`, node.output)

            recordPromptUse('task_decomposition', {
              latencyMs: Date.now() - inferStart,
              confidence: govResult.confidence,
              hallucinationDetected: govResult.hallucinations.length > 0,
              success: node.status === 'done',
              outputTokens: resp.outputTokens ?? 0,
            })

            break // Success — exit retry loop
          } catch (err: unknown) {
            retries++
            if (retries > maxRetries) {
              node.status = 'failed'
              node.error = err instanceof Error ? err.message : String(err)
              node.finishedAt = new Date().toISOString()
              node.durationMs = Date.now() - new Date(node.startedAt!).getTime()

              addSpan(trace.traceId, {
                agentId: nodeId, taskType: node.role,
                model: routeDecision.modelKey, provider: routeDecision.config.provider,
                startedAt: node.startedAt!, finishedAt: node.finishedAt, durationMs: node.durationMs,
                inputTokens: 0, outputTokens: 0, costUSD: 0,
                success: false, hallucinationDetected: false, confidenceScore: 0,
                tenantId, projectId: body.project_id,
                metadata: { error: node.error, retries },
              })
            }
            // Exponential backoff: 200ms, 400ms
            if (retries <= maxRetries) await sleep(200 * Math.pow(2, retries - 1))
          }
        }
      }))
    }

    // ── Step 4: Finalize ──────────────────────────────────────────────────────
    const doneNodes = nodes.filter(n => n.status === 'done')
    const failedNodes = nodes.filter(n => n.status === 'failed')
    const status = failedNodes.length === 0 ? 'completed' : doneNodes.length > 0 ? 'partial' : 'failed'

    endTrace(trace.traceId, status)

    // Synthesize final output from last done node (or consensus)
    const finalNode = doneNodes[doneNodes.length - 1]

    return res.status(200).json({
      status,
      taskId: trace.traceId,
      description: body.task,
      layers,
      nodes: Object.fromEntries(nodeMap),
      finalOutput: finalNode?.output ?? null,
      finalOutputJson: finalNode?.outputJson ?? null,
      humanReviewQueue: humanReviewQueue.length > 0 ? humanReviewQueue : undefined,
      memory: Object.fromEntries(
        Object.entries(memory).filter(([k]) => !k.startsWith('_'))
      ),
      stats: {
        total: nodes.length,
        done: doneNodes.length,
        failed: failedNodes.length,
        layers: layers.length,
      },
      executedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    endTrace(trace.traceId, 'failed')
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Orchestrator error' })
  }
}

// ─── Task Decomposition via LLM ───────────────────────────────────────────────

async function decomposeTask(
  task: string,
  context: Record<string, unknown>,
  maxAgents: number
): Promise<AgentNode[]> {
  const promptTemplate = getActivePrompt('task_decomposition')
  const promptContent = promptTemplate
    ? interpolate(promptTemplate.content, {
        task,
        context: JSON.stringify(context).slice(0, 800),
      })
    : `Decompose this construction task into ${maxAgents} specialized agents. Return JSON with agents array. Task: ${task}`

  const complexity = estimateComplexity(task)
  const decision = route(
    complexity === 'high' ? 'high_reasoning' : 'fast',
    promptContent
  )

  try {
    const resp = await callModel(decision, {
      messages: [{ role: 'user', content: promptContent }],
      maxTokens: 1500,
    })

    const parsed = extractJson(resp.text)
    if (!parsed?.agents || !Array.isArray(parsed.agents)) return []

    return (parsed.agents as Partial<AgentNode>[]).slice(0, maxAgents).map((a, i) => ({
      id: a.id ?? `agent_${i}`,
      name: a.name ?? `Agent ${i}`,
      role: a.role ?? 'generic',
      userPrompt: a.userPrompt ?? task,
      dependencies: Array.isArray(a.dependencies) ? a.dependencies : [],
      priority: typeof a.priority === 'number' ? a.priority : 5,
      status: 'pending' as const,
      maxRetries: 1,
    }))
  } catch {
    return []
  }
}

function buildDefaultSystem(role: string, projectId?: string): string {
  return `Você é um agente especializado em construção civil com papel: ${role}.
${projectId ? `Projeto em contexto: ${projectId}.` : ''}
Responda de forma técnica, concisa e em português do Brasil.
Quando solicitado, retorne JSON válido sem markdown.`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
