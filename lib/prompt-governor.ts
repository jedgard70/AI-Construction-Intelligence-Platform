/**
 * Prompt Governance — versioning, A/B testing, rollback, and optimization pipeline.
 * All prompts used by agents are registered here so they can be:
 *   - versioned (each change gets a new semver tag)
 *   - tested (compare output quality across versions)
 *   - rolled back (revert to any prior version instantly)
 *   - optimized (track which versions perform best)
 */

export interface PromptVersion {
  id: string
  promptKey: string
  version: string          // semver: "1.0.0"
  content: string
  systemContent?: string
  description: string
  author?: string
  createdAt: string
  metrics: PromptMetrics
  active: boolean
  tags: string[]
}

export interface PromptMetrics {
  uses: number
  avgLatencyMs: number
  avgConfidence: number
  hallucinationRate: number
  successRate: number
  avgOutputTokens: number
  lastUsedAt?: string
}

// In-memory prompt registry
const PROMPT_REGISTRY: Map<string, PromptVersion[]> = new Map()

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerPrompt(
  promptKey: string,
  content: string,
  description: string,
  options: {
    version?: string
    systemContent?: string
    author?: string
    tags?: string[]
    setActive?: boolean
  } = {}
): PromptVersion {
  const existing = PROMPT_REGISTRY.get(promptKey) ?? []
  const lastVersion = existing[existing.length - 1]?.version ?? '0.0.0'
  const version = options.version ?? bumpVersion(lastVersion)

  const pv: PromptVersion = {
    id: `${promptKey}_${version}_${Date.now()}`,
    promptKey,
    version,
    content,
    systemContent: options.systemContent,
    description,
    author: options.author,
    createdAt: new Date().toISOString(),
    metrics: { uses: 0, avgLatencyMs: 0, avgConfidence: 0, hallucinationRate: 0, successRate: 0, avgOutputTokens: 0 },
    active: options.setActive !== false,
    tags: options.tags ?? [],
  }

  // Deactivate previous active version if this is being set active
  if (pv.active) {
    existing.forEach(p => { p.active = false })
  }

  existing.push(pv)
  PROMPT_REGISTRY.set(promptKey, existing)
  return pv
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export function getActivePrompt(promptKey: string): PromptVersion | null {
  const versions = PROMPT_REGISTRY.get(promptKey) ?? []
  return versions.find(p => p.active) ?? versions[versions.length - 1] ?? null
}

export function getPromptVersion(promptKey: string, version: string): PromptVersion | null {
  return PROMPT_REGISTRY.get(promptKey)?.find(p => p.version === version) ?? null
}

export function listPromptVersions(promptKey: string): PromptVersion[] {
  return PROMPT_REGISTRY.get(promptKey) ?? []
}

export function listAllPromptKeys(): string[] {
  return Array.from(PROMPT_REGISTRY.keys())
}

// ─── Rollback ─────────────────────────────────────────────────────────────────

export function rollback(promptKey: string, toVersion: string): PromptVersion | null {
  const versions = PROMPT_REGISTRY.get(promptKey)
  if (!versions) return null

  const target = versions.find(p => p.version === toVersion)
  if (!target) return null

  versions.forEach(p => { p.active = false })
  target.active = true
  return target
}

// ─── Usage Metrics Update ─────────────────────────────────────────────────────

export function recordPromptUse(
  promptKey: string,
  result: {
    latencyMs: number
    confidence: number
    hallucinationDetected: boolean
    success: boolean
    outputTokens: number
  }
): void {
  const prompt = getActivePrompt(promptKey)
  if (!prompt) return

  const m = prompt.metrics
  const n = m.uses
  // Rolling average
  m.uses = n + 1
  m.avgLatencyMs = (m.avgLatencyMs * n + result.latencyMs) / (n + 1)
  m.avgConfidence = (m.avgConfidence * n + result.confidence) / (n + 1)
  m.hallucinationRate = (m.hallucinationRate * n + (result.hallucinationDetected ? 1 : 0)) / (n + 1)
  m.successRate = (m.successRate * n + (result.success ? 1 : 0)) / (n + 1)
  m.avgOutputTokens = (m.avgOutputTokens * n + result.outputTokens) / (n + 1)
  m.lastUsedAt = new Date().toISOString()
}

// ─── Optimization Scoring ─────────────────────────────────────────────────────

export function scorePromptPerformance(pv: PromptVersion): number {
  const m = pv.metrics
  if (m.uses < 5) return 0  // Not enough data

  return (
    m.successRate * 0.35 +
    m.avgConfidence * 0.30 +
    (1 - m.hallucinationRate) * 0.25 +
    Math.max(0, 1 - m.avgLatencyMs / 5000) * 0.10
  )
}

export function getBestVersion(promptKey: string): PromptVersion | null {
  const versions = PROMPT_REGISTRY.get(promptKey) ?? []
  if (!versions.length) return null
  return versions
    .filter(p => p.metrics.uses >= 5)
    .sort((a, b) => scorePromptPerformance(b) - scorePromptPerformance(a))[0] ?? null
}

export function getOptimizationReport(): Record<string, {
  promptKey: string
  activeVersion: string
  bestVersion: string | null
  recommendation: string
}> {
  const report: ReturnType<typeof getOptimizationReport> = {}
  for (const key of Array.from(PROMPT_REGISTRY.keys())) {
    const active = getActivePrompt(key)
    const best = getBestVersion(key)
    const isBestActive = !best || best.version === active?.version
    report[key] = {
      promptKey: key,
      activeVersion: active?.version ?? 'none',
      bestVersion: best?.version ?? null,
      recommendation: isBestActive
        ? 'Versão ativa já é a melhor'
        : `Considerar rollback para v${best?.version} (score: ${scorePromptPerformance(best!).toFixed(2)})`,
    }
  }
  return report
}

// ─── Variable interpolation ───────────────────────────────────────────────────

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  )
}

// ─── Version helpers ──────────────────────────────────────────────────────────

function bumpVersion(v: string): string {
  const parts = v.split('.').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return '1.0.0'
  parts[2] += 1
  return parts.join('.')
}


// ─── Pre-register core platform prompts ──────────────────────────────────────

registerPrompt(
  'task_decomposition',
  `Você é um orquestrador de agentes de IA para construção civil.
Decompõe a tarefa a seguir em subtarefas menores que possam ser atribuídas a agentes especializados.

Tarefa: {{task}}
Contexto do projeto: {{context}}

Retorne JSON com a estrutura:
{
  "agents": [
    {
      "id": "string único snake_case",
      "name": "Nome do Agente",
      "role": "Especialização do agente",
      "userPrompt": "Prompt específico para este agente",
      "dependencies": ["ids de agentes que devem rodar antes"],
      "priority": 1-10,
      "taskType": "high_reasoning|fast|vision|document"
    }
  ],
  "description": "Resumo da estratégia de execução"
}

Máximo 6 agentes. Priorize paralelismo onde não há dependência real.`,
  'Decompõe tarefas em sub-agentes com dependências',
  { version: '1.0.0', tags: ['orchestrator', 'core'] }
)

registerPrompt(
  'conflict_resolution',
  `Você é o Executive_Board_AI, árbitro de conflitos entre agentes de construção civil.

Conflito: {{conflict_type}}
Contexto: {{context}}
Regra aplicável: {{rule}}

Resolva o conflito e retorne JSON:
{
  "decision": "decisão final",
  "rationale": "justificativa técnica",
  "risk_flags": ["riscos identificados"],
  "recommended_actions": ["ações recomendadas"]
}`,
  'Resolução de conflitos multi-agente via protocolo de consenso ponderado',
  { version: '1.0.0', tags: ['conflict', 'core'] }
)

registerPrompt(
  'knowledge_rerank',
  `Você é um sistema de reranking de documentos.
Consulta do usuário: {{query}}

Avalie a relevância de cada trecho abaixo para a consulta (0.0 a 1.0):
{{chunks}}

Retorne JSON:
{
  "rankings": [
    {"id": "chunk_id", "relevance": 0.0-1.0, "reason": "motivo breve"}
  ]
}`,
  'Reranking de chunks de conhecimento via LLM',
  { version: '1.0.0', tags: ['knowledge', 'retrieval'] }
)
