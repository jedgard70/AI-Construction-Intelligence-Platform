/**
 * Observability layer — OpenTelemetry-compatible metrics and traces.
 * Tracks: agent_latency, token_usage, hallucination_rate, task_success_rate,
 * cost_per_workflow, decision_accuracy.
 *
 * In production, flush metrics to Prometheus/Grafana via /api/metrics endpoint.
 * LangSmith traces attached as structured span metadata.
 */

export interface AgentSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  agentId: string
  taskType: string
  model: string
  provider: string
  startedAt: string
  finishedAt?: string
  durationMs?: number
  inputTokens: number
  outputTokens: number
  costUSD: number
  success: boolean
  hallucinationDetected: boolean
  confidenceScore: number
  tenantId?: string
  projectId?: string
  metadata: Record<string, unknown>
}

export interface WorkflowTrace {
  traceId: string
  workflowId: string
  description: string
  tenantId?: string
  startedAt: string
  finishedAt?: string
  totalDurationMs?: number
  spans: AgentSpan[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUSD: number
  successRate: number
  hallucinationRate: number
  taskSuccessRate: number
  status: 'running' | 'completed' | 'failed' | 'partial'
}

// In-memory trace store (flushed to external on flush())
const TRACES: Map<string, WorkflowTrace> = new Map()
const METRIC_COUNTERS: Map<string, number> = new Map()

// ─── Trace Management ─────────────────────────────────────────────────────────

export function startTrace(workflowId: string, description: string, tenantId?: string): WorkflowTrace {
  const trace: WorkflowTrace = {
    traceId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workflowId,
    description,
    tenantId,
    startedAt: new Date().toISOString(),
    spans: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUSD: 0,
    successRate: 0,
    hallucinationRate: 0,
    taskSuccessRate: 0,
    status: 'running',
  }
  TRACES.set(trace.traceId, trace)
  return trace
}

export function addSpan(traceId: string, span: Omit<AgentSpan, 'traceId' | 'spanId'>): AgentSpan {
  const trace = TRACES.get(traceId)
  const fullSpan: AgentSpan = {
    ...span,
    traceId,
    spanId: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  }
  if (trace) {
    trace.spans.push(fullSpan)
    trace.totalInputTokens += span.inputTokens
    trace.totalOutputTokens += span.outputTokens
    trace.totalCostUSD += span.costUSD
  }
  incrementCounter('total_spans')
  if (span.hallucinationDetected) incrementCounter('hallucination_events')
  if (!span.success) incrementCounter('agent_failures')
  return fullSpan
}

export function endTrace(traceId: string, status: WorkflowTrace['status']): WorkflowTrace | null {
  const trace = TRACES.get(traceId)
  if (!trace) return null

  const now = new Date().toISOString()
  trace.finishedAt = now
  trace.totalDurationMs = Date.now() - new Date(trace.startedAt).getTime()
  trace.status = status

  if (trace.spans.length > 0) {
    const successful = trace.spans.filter(s => s.success).length
    trace.taskSuccessRate = successful / trace.spans.length
    trace.hallucinationRate = trace.spans.filter(s => s.hallucinationDetected).length / trace.spans.length
  }

  incrementCounter('total_workflows')
  if (status === 'completed') incrementCounter('successful_workflows')
  recordMetric('workflow_duration_ms', trace.totalDurationMs)
  recordMetric('workflow_cost_usd', trace.totalCostUSD)

  return trace
}

// ─── Metric Counters ──────────────────────────────────────────────────────────

export function incrementCounter(key: string, by = 1): void {
  METRIC_COUNTERS.set(key, (METRIC_COUNTERS.get(key) ?? 0) + by)
}

const HISTOGRAMS: Map<string, number[]> = new Map()

export function recordMetric(key: string, value: number): void {
  const existing = HISTOGRAMS.get(key) ?? []
  existing.push(value)
  // Keep last 1000 samples
  if (existing.length > 1000) existing.shift()
  HISTOGRAMS.set(key, existing)
}

// ─── Metrics Snapshot ─────────────────────────────────────────────────────────

export interface MetricsSnapshot {
  counters: Record<string, number>
  histograms: Record<string, {
    count: number
    min: number
    max: number
    avg: number
    p50: number
    p95: number
    p99: number
  }>
  derived: {
    agent_latency_avg_ms: number
    token_usage_total: number
    hallucination_rate: number
    task_success_rate: number
    cost_per_workflow_avg_usd: number
    decision_accuracy: number
  }
  capturedAt: string
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export function getMetrics(): MetricsSnapshot {
  const counters = Object.fromEntries(METRIC_COUNTERS)
  const histograms: MetricsSnapshot['histograms'] = {}

  HISTOGRAMS.forEach((values, key) => {
    const sorted = [...values].sort((a, b) => a - b)
    histograms[key] = {
      count: sorted.length,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      avg: sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1),
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    }
  })

  const totalWorkflows = counters.total_workflows ?? 0
  const successfulWorkflows = counters.successful_workflows ?? 0
  const totalSpans = counters.total_spans ?? 0
  const hallucinations = counters.hallucination_events ?? 0

  return {
    counters,
    histograms,
    derived: {
      agent_latency_avg_ms: histograms['workflow_duration_ms']?.avg ?? 0,
      token_usage_total: Array.from(TRACES.values()).reduce((s, t) => s + t.totalInputTokens + t.totalOutputTokens, 0),
      hallucination_rate: totalSpans > 0 ? hallucinations / totalSpans : 0,
      task_success_rate: totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0,
      cost_per_workflow_avg_usd: histograms['workflow_cost_usd']?.avg ?? 0,
      decision_accuracy: totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0,
    },
    capturedAt: new Date().toISOString(),
  }
}

// ─── Prometheus exposition format ─────────────────────────────────────────────

export function toPrometheusText(snapshot: MetricsSnapshot): string {
  const lines: string[] = [
    `# HELP acip_agent_latency_ms Average agent workflow latency`,
    `# TYPE acip_agent_latency_ms gauge`,
    `acip_agent_latency_ms ${snapshot.derived.agent_latency_avg_ms}`,
    `# HELP acip_token_usage_total Total tokens consumed`,
    `# TYPE acip_token_usage_total counter`,
    `acip_token_usage_total ${snapshot.derived.token_usage_total}`,
    `# HELP acip_hallucination_rate Fraction of agent calls with hallucinations`,
    `# TYPE acip_hallucination_rate gauge`,
    `acip_hallucination_rate ${snapshot.derived.hallucination_rate}`,
    `# HELP acip_task_success_rate Fraction of workflows completed successfully`,
    `# TYPE acip_task_success_rate gauge`,
    `acip_task_success_rate ${snapshot.derived.task_success_rate}`,
    `# HELP acip_cost_per_workflow_usd Average USD cost per workflow`,
    `# TYPE acip_cost_per_workflow_usd gauge`,
    `acip_cost_per_workflow_usd ${snapshot.derived.cost_per_workflow_avg_usd}`,
  ]
  return lines.join('\n')
}

// ─── LangSmith-compatible span export ────────────────────────────────────────

export function toLangSmithRun(span: AgentSpan) {
  return {
    id: span.spanId,
    parent_run_id: span.parentSpanId,
    name: `${span.agentId} (${span.taskType})`,
    run_type: 'llm',
    start_time: span.startedAt,
    end_time: span.finishedAt,
    extra: {
      model: span.model,
      provider: span.provider,
      tokens: { input: span.inputTokens, output: span.outputTokens },
      cost_usd: span.costUSD,
      confidence: span.confidenceScore,
      hallucination: span.hallucinationDetected,
      tenant_id: span.tenantId,
      project_id: span.projectId,
      ...span.metadata,
    },
    error: span.success ? null : 'Agent execution failed',
    tags: [span.taskType, span.provider, span.tenantId ?? 'default'].filter(Boolean),
  }
}

// ─── Recent traces accessor ───────────────────────────────────────────────────

export function getRecentTraces(limit = 20): WorkflowTrace[] {
  return Array.from(TRACES.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
}

export function getTrace(traceId: string): WorkflowTrace | undefined {
  return TRACES.get(traceId)
}
