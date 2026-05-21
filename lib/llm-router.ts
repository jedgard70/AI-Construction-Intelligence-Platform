/**
 * LLM Routing Engine.
 * Routes tasks to the optimal model based on complexity, task type, and cost policy.
 *
 * Supported backends: Claude (Anthropic), Gemini (Google), OpenAI (optional).
 * Complexity-based and cost-optimized routing.
 */

export type TaskType =
  | 'high_reasoning'   // Complex analysis, multi-step planning
  | 'fast'             // Simple Q&A, extraction, classification
  | 'vision'           // Image analysis, OCR, floor plan reading
  | 'embedding'        // Text vectorization
  | 'code'             // Code generation/review
  | 'document'         // Long document processing (PDFs, reports)

export type LLMProvider = 'anthropic' | 'gemini' | 'openai'

export interface ModelConfig {
  provider: LLMProvider
  model: string
  maxTokens: number
  costPer1kTokensUSD: number
  supportsVision: boolean
  supportsStreaming: boolean
  contextWindow: number
}

// Model registry — update as new models are released
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // Anthropic
  'claude-opus-4-7': {
    provider: 'anthropic', model: 'claude-opus-4-7',
    maxTokens: 32000, costPer1kTokensUSD: 0.075, supportsVision: true,
    supportsStreaming: true, contextWindow: 200000,
  },
  'claude-sonnet-4-6': {
    provider: 'anthropic', model: 'claude-sonnet-4-6',
    maxTokens: 16000, costPer1kTokensUSD: 0.015, supportsVision: true,
    supportsStreaming: true, contextWindow: 200000,
  },
  'claude-haiku-4-5-20251001': {
    provider: 'anthropic', model: 'claude-haiku-4-5-20251001',
    maxTokens: 8000, costPer1kTokensUSD: 0.001, supportsVision: true,
    supportsStreaming: true, contextWindow: 200000,
  },
  // Gemini
  'gemini-2.0-flash': {
    provider: 'gemini', model: 'gemini-2.0-flash',
    maxTokens: 8000, costPer1kTokensUSD: 0.0001, supportsVision: true,
    supportsStreaming: false, contextWindow: 1000000,
  },
  'gemini-2.0-flash-exp': {
    provider: 'gemini', model: 'gemini-2.0-flash-exp',
    maxTokens: 8000, costPer1kTokensUSD: 0, supportsVision: true,
    supportsStreaming: false, contextWindow: 1000000,
  },
}

// ─── Routing Policy ───────────────────────────────────────────────────────────

export interface RoutingPolicy {
  preferLowCost: boolean
  maxCostPer1kUSD?: number
  preferredProvider?: LLMProvider
  fallbackEnabled: boolean
}

export const DEFAULT_POLICY: RoutingPolicy = {
  preferLowCost: false,
  fallbackEnabled: true,
}

export interface RouteDecision {
  modelKey: string
  config: ModelConfig
  reason: string
  estimatedCostUSD?: number
  fallback?: string
}

export function estimateComplexity(prompt: string, systemPrompt?: string): 'high' | 'medium' | 'low' {
  const totalLen = (prompt + (systemPrompt ?? '')).length
  const hasMultiStep = /step|phase|sequence|first.*then|analyze.*then|compare/i.test(prompt)
  const hasReasoning = /why|explain|justify|analyze|evaluate|assess|critique/i.test(prompt)
  const hasCode = /```|function|class|import|export|def |SELECT|UPDATE/i.test(prompt)

  if (totalLen > 3000 || (hasMultiStep && hasReasoning) || hasCode) return 'high'
  if (totalLen > 800 || hasReasoning) return 'medium'
  return 'low'
}

export function route(
  taskType: TaskType,
  prompt: string,
  systemPrompt?: string,
  policy: RoutingPolicy = DEFAULT_POLICY,
  tenantConfig?: Record<string, string>
): RouteDecision {
  const complexity = estimateComplexity(prompt, systemPrompt)

  // Tenant override
  if (tenantConfig?.preferred_model && tenantConfig.preferred_model in MODEL_REGISTRY) {
    const config = MODEL_REGISTRY[tenantConfig.preferred_model]
    return { modelKey: tenantConfig.preferred_model, config, reason: 'Tenant override', fallback: 'claude-haiku-4-5-20251001' }
  }

  // Embedding tasks always go to Gemini (free, high quality)
  if (taskType === 'embedding') {
    return {
      modelKey: 'gemini-2.0-flash',
      config: MODEL_REGISTRY['gemini-2.0-flash'],
      reason: 'Embedding tasks routed to Gemini text-embedding-004',
      fallback: 'gemini-2.0-flash',
    }
  }

  // Cost optimization: use Haiku for simple tasks
  if (policy.preferLowCost || (policy.maxCostPer1kUSD && policy.maxCostPer1kUSD < 0.005)) {
    if (complexity === 'low' || taskType === 'fast') {
      const key = 'claude-haiku-4-5-20251001'
      return { modelKey: key, config: MODEL_REGISTRY[key], reason: 'Cost-optimized: low complexity → Haiku', fallback: 'gemini-2.0-flash' }
    }
  }

  // Vision tasks
  if (taskType === 'vision') {
    const key = 'claude-sonnet-4-6'
    return { modelKey: key, config: MODEL_REGISTRY[key], reason: 'Vision task → Sonnet (best image understanding)', fallback: 'gemini-2.0-flash' }
  }

  // High-reasoning / complex tasks
  if (taskType === 'high_reasoning' || complexity === 'high') {
    const key = 'claude-opus-4-7'
    return { modelKey: key, config: MODEL_REGISTRY[key], reason: 'High-complexity task → Opus (strongest reasoning)', fallback: 'claude-sonnet-4-6' }
  }

  // Fast / classification tasks
  if (taskType === 'fast' || complexity === 'low') {
    const key = 'claude-haiku-4-5-20251001'
    return { modelKey: key, config: MODEL_REGISTRY[key], reason: 'Fast task → Haiku (low latency, low cost)', fallback: 'gemini-2.0-flash' }
  }

  // Default: Sonnet (balanced)
  const key = 'claude-sonnet-4-6'
  return { modelKey: key, config: MODEL_REGISTRY[key], reason: 'Balanced task → Sonnet (cost/quality optimum)', fallback: 'claude-haiku-4-5-20251001' }
}

// ─── Unified Inference Call ───────────────────────────────────────────────────

export interface InferenceRequest {
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  maxTokens?: number
  jsonMode?: boolean
}

export interface InferenceResponse {
  text: string
  modelKey: string
  provider: LLMProvider
  inputTokens?: number
  outputTokens?: number
  durationMs: number
}

export async function callModel(
  decision: RouteDecision,
  req: InferenceRequest
): Promise<InferenceResponse> {
  const start = Date.now()
  const { config } = decision

  if (config.provider === 'anthropic') {
    return callAnthropic(decision, req, start)
  }
  if (config.provider === 'gemini') {
    return callGemini(decision, req, start)
  }
  throw new Error(`Provider ${config.provider} not supported`)
}

async function callAnthropic(decision: RouteDecision, req: InferenceRequest, start: number): Promise<InferenceResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const body: Record<string, unknown> = {
    model: decision.config.model,
    max_tokens: req.maxTokens ?? decision.config.maxTokens,
    messages: req.messages,
  }
  if (req.system) body.system = req.system

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    // Fallback to secondary model
    if (decision.fallback && decision.fallback !== decision.modelKey) {
      const fallbackDecision = { ...decision, modelKey: decision.fallback, config: MODEL_REGISTRY[decision.fallback] }
      return callModel(fallbackDecision, req)
    }
    throw new Error(`Anthropic ${resp.status}: ${JSON.stringify(err)}`)
  }

  const data = await resp.json()
  const text = data?.content?.[0]?.text ?? ''
  return {
    text,
    modelKey: decision.modelKey,
    provider: 'anthropic',
    inputTokens: data?.usage?.input_tokens,
    outputTokens: data?.usage?.output_tokens,
    durationMs: Date.now() - start,
  }
}

async function callGemini(decision: RouteDecision, req: InferenceRequest, start: number): Promise<InferenceResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const contents = req.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  if (req.system) {
    contents.unshift({ role: 'user', parts: [{ text: `[System] ${req.system}` }] })
  }

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${decision.config.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  )

  if (!resp.ok) throw new Error(`Gemini ${resp.status}`)
  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return {
    text,
    modelKey: decision.modelKey,
    provider: 'gemini',
    durationMs: Date.now() - start,
  }
}
