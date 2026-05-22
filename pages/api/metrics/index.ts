/**
 * GET /api/metrics              — JSON snapshot (tokens, custo, latência, traces)
 * GET /api/metrics?format=prometheus — Prometheus text exposition
 * GET /api/metrics?format=langsmith  — LangSmith-compatible run list
 * GET /api/metrics?traceId=xxx  — trace individual
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getMetrics, toPrometheusText, getRecentTraces, getTrace } from '../../../lib/observability'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { format, traceId, limit } = req.query

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
        parent_run_id: s.parentSpanId ?? t.traceId,
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
    remoteFlush: snapshot.remoteFlush,
    _links: {
      prometheus: '/api/metrics?format=prometheus',
      langsmith:  '/api/metrics?format=langsmith',
    },
  })
}
