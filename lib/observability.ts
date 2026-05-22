/**
 * Observability layer — OpenTelemetry-compatible metrics and traces.
 * Tracks: agent_latency, token_usage, hallucination_rate, task_success_rate,
 * cost_per_workflow, decision_accuracy.
 *
 * Remote flush: LangSmith (LANGCHAIN_API_KEY) or generic OTLP (OTEL_ENDPOINT).
 * Local persistence: /tmp/acip-observability.json survives between requests.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'

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

const PERSISTENCE_FILE = '/tmp/acip-observability.json'
const TRACES: Map<string, WorkflowTrace> = new Map()
const METRIC_COUNTERS: Map<string, number> = new Map()
const HISTOGRAMS: Map<string, number[]> = new Map()

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadPersistedData() {
  try {
    if (!existsSync(PERSISTENCE_FILE)) return
    const raw = readFileSync(PERSISTENCE_FILE, 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data.traces)) {
      data.traces.forEach((t: WorkflowTrace) => TRACES.set(t.traceId, t))
    }
    if (data.counters) {
      Object.entries(data.counters).forEach(([k, v]) => METRIC_COUNTERS.set(k, v as number))
    }
    if (data.histograms) {
      Object.entries(data.histograms).forEach(([k, v]) => HISTOGRAMS.set(k, v as number[]))
    }
  } catch {}
}

function persistData() {
  try {
    const allTraces = Array.from(TRACES.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 200)
    writeFileSync(PERSISTENCE_FILE, JSON.stringify({
      traces: allTraces,
      counters: Object.fromEntries(METRIC_COUNTERS),
      histograms: Object.fromEntries(HISTOGRAMS),
      updatedAt: new Date().toISOString(),
    }), 'utf-8')
  } catch {}
}

// Load on module init (runs once per server process)
loadPersistedData()

// ─── Remote flush — LangSmith ─────────────────────────────────────────────────

async function flushToLangSmith(trace: WorkflowTrace): Promise<void> {
  const apiKey = process.env.LANGCHAIN_API_KEY
  if (!apiKey) return

  const baseUrl = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com'

  try {
    // Parent run (workflow)
    await fetch(`${baseUrl}/runs`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: trace.traceId,
        name: trace.description,
        run_type: 'chain',
        start_time: new Date(trace.startedAt).getTime(),
        end_time: trace.finishedAt ? new Date(trace.finishedAt).getTime() : undefined,
        inputs: { workflow_id: trace.workflowId },
        outputs: {
          status: trace.status,
          total_tokens: trace.totalInputTokens + trace.totalOutputTokens,
          total_cost_usd: trace.totalCostUSD,
          success_rate: trace.taskSuccessRate,
        },
        extra: { tenant_id: trace.tenantId, span_count: trace.spans.length },
        tags: ['acip', trace.workflowId, trace.tenantId ?? 'default'].filter(Boolean),
      }),
    })

    // Child runs (spans)
    for (const span of trace.spans) {
      await fetch(`${baseUrl}/runs`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: span.spanId,
          parent_run_id: span.parentSpanId ?? trace.traceId,
          name: `${span.agentId} — ${span.taskType}`,
          run_type: 'llm',
          start_time: new Date(span.startedAt).getTime(),
          end_time: span.finishedAt ? new Date(span.finishedAt).getTime() : undefined,
          inputs: { task_type: span.taskType, model: span.model },
          outputs: { success: span.success, confidence: span.confidenceScore },
          extra: {
            model: span.model, provider: span.provider,
            tokens: { input: span.inputTokens, output: span.outputTokens },
            cost_usd: span.costUSD,
            hallucination: span.hallucinationDetected,
            duration_ms: span.durationMs,
            project_id: span.projectId,
            ...span.metadata,
          },
          error: span.success ? null : 'Agent execution failed',
          tags: [span.taskType, span.provider, span.model].filter(Boolean),
        }),
      })
    }
  } catch {
    // LangSmith flush failure is silent — observability must not break the app
  }
}

// ─── Remote flush — generic OTLP HTTP ─────────────────────────────────────────

async function flushToOTLP(trace: WorkflowTrace): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) return

  const spans = trace.spans.map(s => ({
    traceId: s.traceId,
    spanId: s.spanId,
    parentSpanId: s.parentSpanId,
    name: `${s.agentId}/${s.taskType}`,
    startTimeUnixNano: new Date(s.startedAt).getTime() * 1_000_000,
    endTimeUnixNano: s.finishedAt ? new Date(s.finishedAt).getTime() * 1_000_000 : undefined,
    attributes: [
      { key: 'llm.model', value: { stringValue: s.model } },
      { key: 'llm.provider', value: { stringValue: s.provider } },
      { key: 'llm.input_tokens', value: { intValue: s.inputTokens } },
      { key: 'llm.output_tokens', value: { intValue: s.outputTokens } },
      { key: 'llm.cost_usd', value: { doubleValue: s.costUSD } },
      { key: 'llm.success', value: { boolValue: s.success } },
      { key: 'acip.tenant_id', value: { stringValue: s.tenantId ?? '' } },
    ],
    status: { code: s.success ? 1 : 2 },
  }))

  try {
    await fetch(`${endpoint}/v1/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans }] }] }),
    })
  } catch {}
}

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

  trace.finishedAt = new Date().toISOString()
  trace.totalDurationMs = Date.now() - new Date(trace.startedAt).getTime()
  trace.status = status

  if (trace.spans.length > 0) {
    const ok = trace.spans.filter(s => s.success).length
    trace.taskSuccessRate = ok / trace.spans.length
    trace.hallucinationRate = trace.spans.filter(s => s.hallucinationDetected).length / trace.spans.length
  }

  incrementCounter('total_workflows')
  if (status === 'completed') incrementCounter('successful_workflows')
  recordMetric('workflow_duration_ms', trace.totalDurationMs)
  recordMetric('workflow_cost_usd', trace.totalCostUSD)

  // Persist locally, then flush remotely (fire-and-forget)
  persistData()
  flushToLangSmith(trace).catch(() => {})
  flushToOTLP(trace).catch(() => {})

  return trace
}

// ─── Single-span helper (used by API routes) ──────────────────────────────────

export function recordApiCall(opts: {
  agentId: string
  taskType: string
  model: string
  provider: 'anthropic' | 'google' | 'openai'
  startedAt: Date
  inputTokens: number
  outputTokens: number
  costUSD: number
  success: boolean
  metadata?: Record<string, unknown>
}): void {
  const traceId = startTrace(`api_${opts.provider}`, `${opts.agentId} — ${opts.taskType}`).traceId
  const span: Omit<AgentSpan, 'traceId' | 'spanId'> = {
    agentId: opts.agentId,
    taskType: opts.taskType,
    model: opts.model,
    provider: opts.provider,
    startedAt: opts.startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - opts.startedAt.getTime(),
    inputTokens: opts.inputTokens,
    outputTokens: opts.outputTokens,
    costUSD: opts.costUSD,
    success: opts.success,
    hallucinationDetected: false,
    confidenceScore: opts.success ? 1.0 : 0.0,
    metadata: opts.metadata ?? {},
  }
  addSpan(traceId, span)
  endTrace(traceId, opts.success ? 'completed' : 'failed')
}

// ─── Metric Counters ──────────────────────────────────────────────────────────

export function incrementCounter(key: string, by = 1): void {
  METRIC_COUNTERS.set(key, (METRIC_COUNTERS.get(key) ?? 0) + by)
}

export function recordMetric(key: string, value: number): void {
  const existing = HISTOGRAMS.get(key) ?? []
  existing.push(value)
  if (existing.length > 1000) existing.shift()
  HISTOGRAMS.set(key, existing)
}

// ─── Metrics Snapshot ─────────────────────────────────────────────────────────

export interface MetricsSnapshot {
  counters: Record<string, number>
  histograms: Record<string, {
    count: number; min: number; max: number; avg: number; p50: number; p95: number; p99: number
  }>
  derived: {
    agent_latency_avg_ms: number
    token_usage_total: number
    hallucination_rate: number
    task_success_rate: number
    cost_per_workflow_avg_usd: number
    decision_accuracy: number
    total_cost_usd: number
  }
  remoteFlush: {
    langsmith: boolean
    otlp: boolean
  }
  capturedAt: string
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)]
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
  const allTraces = Array.from(TRACES.values())

  return {
    counters,
    histograms,
    derived: {
      agent_latency_avg_ms: histograms['workflow_duration_ms']?.avg ?? 0,
      token_usage_total: allTraces.reduce((s, t) => s + t.totalInputTokens + t.totalOutputTokens, 0),
      hallucination_rate: totalSpans > 0 ? (counters.hallucination_events ?? 0) / totalSpans : 0,
      task_success_rate: totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0,
      cost_per_workflow_avg_usd: histograms['workflow_cost_usd']?.avg ?? 0,
      decision_accuracy: totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0,
      total_cost_usd: allTraces.reduce((s, t) => s + t.totalCostUSD, 0),
    },
    remoteFlush: {
      langsmith: !!process.env.LANGCHAIN_API_KEY,
      otlp: !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    capturedAt: new Date().toISOString(),
  }
}

// ─── Prometheus exposition format ─────────────────────────────────────────────

export function toPrometheusText(snapshot: MetricsSnapshot): string {
  return [
    `# HELP acip_agent_latency_ms Average agent workflow latency`,
    `# TYPE acip_agent_latency_ms gauge`,
    `acip_agent_latency_ms ${snapshot.derived.agent_latency_avg_ms}`,
    `# HELP acip_token_usage_total Total tokens consumed`,
    `# TYPE acip_token_usage_total counter`,
    `acip_token_usage_total ${snapshot.derived.token_usage_total}`,
    `# HELP acip_total_cost_usd Total USD spent on LLM APIs`,
    `# TYPE acip_total_cost_usd counter`,
    `acip_total_cost_usd ${snapshot.derived.total_cost_usd.toFixed(6)}`,
    `# HELP acip_hallucination_rate Fraction of spans with hallucinations`,
    `# TYPE acip_hallucination_rate gauge`,
    `acip_hallucination_rate ${snapshot.derived.hallucination_rate}`,
    `# HELP acip_task_success_rate Fraction of workflows completed successfully`,
    `# TYPE acip_task_success_rate gauge`,
    `acip_task_success_rate ${snapshot.derived.task_success_rate}`,
    `# HELP acip_cost_per_workflow_usd Average USD cost per workflow`,
    `# TYPE acip_cost_per_workflow_usd gauge`,
    `acip_cost_per_workflow_usd ${snapshot.derived.cost_per_workflow_avg_usd}`,
    `# HELP acip_total_workflows Total workflows executed`,
    `# TYPE acip_total_workflows counter`,
    `acip_total_workflows ${snapshot.counters.total_workflows ?? 0}`,
  ].join('\n')
}

export function getRecentTraces(limit = 20): WorkflowTrace[] {
  return Array.from(TRACES.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
}

export function getTrace(traceId: string): WorkflowTrace | undefined {
  return TRACES.get(traceId)
}
