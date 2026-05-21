/**
 * GET /api/metrics        — JSON metrics snapshot (agent_latency, token_usage, etc.)
 * GET /api/metrics?format=prometheus — Prometheus text exposition
 *
 * Tracks: agent_latency, token_usage, hallucination_rate, task_success_rate,
 *         cost_per_workflow, decision_accuracy.
 * OpenTelemetry-compatible span metadata. LangSmith trace export via ?format=langsmith.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getMetrics, toPrometheusText, getRecentTraces, getTrace } from '../../../lib/observability'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { format, traceId, limit } = req.query

  // Single trace
  if (traceId) {
    const trace = getTrace(traceId as string)
    if (!trace) return res.status(404).json({ error: 'Trace not found' })
    return res.status(200).json(trace)
  }

  const snapshot = getMetrics()

  if (format === 'prometheus') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4')
    return res.status(200).send(toPrometheusText(snapshot))
  }

  if (format === 'langsmith') {
    const traces = getRecentTraces(Number(limit ?? 20))
    const runs = traces.flatMap(t =>
      t.spans.map(s => ({
        id: s.spanId,
        parent_run_id: s.parentSpanId,
        name: `${s.agentId} (${s.taskType})`,
        run_type: 'llm',
        start_time: s.startedAt,
        end_time: s.finishedAt,
        extra: {
          model: s.model, provider: s.provider,
          tokens: { input: s.inputTokens, output: s.outputTokens },
          cost_usd: s.costUSD, confidence: s.confidenceScore,
          hallucination: s.hallucinationDetected, tenant_id: s.tenantId,
        },
        error: s.success ? null : 'Agent execution failed',
        tags: [s.taskType, s.provider, s.tenantId ?? 'default'].filter(Boolean),
      }))
    )
    return res.status(200).json({ runs, total: runs.length })
  }

  return res.status(200).json({
    metrics: snapshot,
    recentTraces: getRecentTraces(Number(limit ?? 10)),
  })
}
