/**
 * Autonomous Governance Engine.
 * Confidence-based decision routing, self-validation, reflection loops,
 * and hallucination detection for AI agent outputs.
 */

export type DecisionOutcome = 'auto_execute' | 'human_review' | 'block_execution'

export interface GovernanceConfig {
  thresholds: {
    auto_execute: number   // default 0.92
    human_review: number   // default 0.75
    block_execution: number // default 0.50
  }
  self_validation: boolean
  reflection_loops: boolean
  hallucination_detection: boolean
  max_reflection_iterations: number
}

export const DEFAULT_GOVERNANCE: GovernanceConfig = {
  thresholds: {
    auto_execute: 0.92,
    human_review: 0.75,
    block_execution: 0.50,
  },
  self_validation: true,
  reflection_loops: true,
  hallucination_detection: true,
  max_reflection_iterations: 3,
}

export interface GovernanceResult {
  outcome: DecisionOutcome
  confidence: number
  validationPassed: boolean
  hallucinations: string[]
  reflectionCount: number
  reasoning: string
  approved: boolean
  requiresHumanId?: string
}

// ─── Confidence Scoring ───────────────────────────────────────────────────────

export interface ConfidenceSignals {
  completeness: number      // 0–1: did the agent return all required fields?
  consistency: number       // 0–1: is the output internally consistent?
  groundedness: number      // 0–1: is the output grounded in provided context?
  specificity: number       // 0–1: is the output specific (not vague)?
  format: number            // 0–1: does the output follow the expected schema?
}

export function computeConfidence(signals: Partial<ConfidenceSignals>): number {
  const weights: Record<keyof ConfidenceSignals, number> = {
    completeness: 0.30,
    consistency: 0.25,
    groundedness: 0.25,
    specificity: 0.10,
    format: 0.10,
  }
  let score = 0
  let totalWeight = 0
  for (const [key, weight] of Object.entries(weights) as [keyof ConfidenceSignals, number][]) {
    if (signals[key] != null) {
      score += (signals[key] as number) * weight
      totalWeight += weight
    }
  }
  return totalWeight > 0 ? score / totalWeight : 0.5
}

export function routeDecision(confidence: number, config: GovernanceConfig = DEFAULT_GOVERNANCE): DecisionOutcome {
  if (confidence >= config.thresholds.auto_execute) return 'auto_execute'
  if (confidence >= config.thresholds.human_review) return 'human_review'
  return 'block_execution'
}

// ─── Hallucination Detection ──────────────────────────────────────────────────

const HALLUCINATION_PATTERNS = [
  // Fabricated references
  /(?:according to|as stated in|per)\s+(?:the\s+)?(?:\w+\s+){1,4}(?:report|document|study|regulation)\s+(?:of|from|dated)\s+\d{4}/gi,
  // Impossible dates
  /\b(20[3-9]\d|2[1-9]\d{2})\b/g,
  // Overconfident unsupported claims
  /100%\s+(?:guaranteed|certain|sure|accurate)/gi,
  // Fabricated numbers in financial context
  /R\$\s*[\d.,]+\s*(?:bilh[oõ]es|trillion)/gi,
]

export function detectHallucinations(text: string, groundingContext?: string): string[] {
  const found: string[] = []

  for (const pattern of HALLUCINATION_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) found.push(...matches.slice(0, 2))
  }

  // Check for claims not grounded in context
  if (groundingContext) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? []
    const contextWords = new Set(groundingContext.toLowerCase().match(/\b\w{5,}\b/g) ?? [])
    for (const sentence of sentences) {
      const sentWords = sentence.toLowerCase().match(/\b\w{5,}\b/g) ?? []
      const overlap = sentWords.filter(w => contextWords.has(w)).length
      if (sentWords.length > 8 && overlap / sentWords.length < 0.1) {
        found.push(`Possível alegação não fundamentada: "${sentence.slice(0, 80).trim()}..."`)
      }
    }
  }

  return Array.from(new Set(found))
}

// ─── Self-Validation ──────────────────────────────────────────────────────────

export function validateSchema(
  output: Record<string, unknown>,
  requiredKeys: string[]
): { passed: boolean; missing: string[] } {
  const missing = requiredKeys.filter(k => !(k in output) || output[k] == null || output[k] === '')
  return { passed: missing.length === 0, missing }
}

export function validateConsistency(output: Record<string, unknown>): boolean {
  // Check numeric ranges make sense
  const numeric = Object.entries(output).filter(([, v]) => typeof v === 'number') as [string, number][]
  for (const [key, val] of numeric) {
    if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('confidence')) {
      if (val < 0 || val > 100) return false
    }
    if (key.toLowerCase().includes('score') && (val < 0 || val > 1)) return false
  }
  return true
}

// ─── Full Governance Check ────────────────────────────────────────────────────

export function govern(
  outputText: string,
  outputJson: Record<string, unknown> | null,
  requiredKeys: string[],
  groundingContext: string,
  config: GovernanceConfig = DEFAULT_GOVERNANCE
): GovernanceResult {
  const hallucinations = config.hallucination_detection
    ? detectHallucinations(outputText, groundingContext)
    : []

  const schemaCheck = outputJson
    ? validateSchema(outputJson, requiredKeys)
    : { passed: requiredKeys.length === 0, missing: requiredKeys }

  const consistencyOk = outputJson ? validateConsistency(outputJson) : true

  const signals: Partial<ConfidenceSignals> = {
    completeness: schemaCheck.passed ? 1.0 : Math.max(0, 1 - schemaCheck.missing.length * 0.2),
    consistency: consistencyOk ? 1.0 : 0.4,
    groundedness: hallucinations.length === 0 ? 1.0 : Math.max(0, 1 - hallucinations.length * 0.3),
    format: outputJson ? 1.0 : 0.6,
  }

  const confidence = computeConfidence(signals)
  const outcome = routeDecision(confidence, config)

  return {
    outcome,
    confidence,
    validationPassed: schemaCheck.passed && consistencyOk,
    hallucinations,
    reflectionCount: 0,
    reasoning: buildReasoning(signals, hallucinations, schemaCheck),
    approved: outcome === 'auto_execute',
    requiresHumanId: outcome === 'human_review' ? `review_${Date.now()}` : undefined,
  }
}

function buildReasoning(
  signals: Partial<ConfidenceSignals>,
  hallucinations: string[],
  schema: { passed: boolean; missing: string[] }
): string {
  const parts: string[] = []
  if (!schema.passed) parts.push(`Campos faltando: ${schema.missing.join(', ')}`)
  if (hallucinations.length > 0) parts.push(`${hallucinations.length} possível(is) alucinação(ões) detectada(s)`)
  if (signals.consistency === 0.4) parts.push('Inconsistência nos valores numéricos')
  if (parts.length === 0) parts.push('Validação concluída com sucesso')
  return parts.join('. ')
}
