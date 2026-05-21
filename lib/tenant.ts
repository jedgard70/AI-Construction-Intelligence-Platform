/**
 * Multi-tenant isolation layer.
 * Provides logical tenant isolation with per-tenant memory, agent configs,
 * KPIs, LLM policies, and license controls.
 *
 * Physical isolation (separate DB schemas/namespaces) is handled by Supabase
 * RLS policies scoped to tenant_id. This module manages the application layer.
 */

export type SubscriptionTier = 'enterprise' | 'construction_company' | 'investor' | 'white_label'

export interface TenantLicense {
  tenantId: string
  tier: SubscriptionTier
  seats: number
  usedSeats: number
  monthlyTokenBudget: number
  usedTokensThisMonth: number
  features: TenantFeature[]
  customAgents: string[]
  llmPolicy: TenantLLMPolicy
  kpis: TenantKPI[]
  active: boolean
  expiresAt?: string
  createdAt: string
}

export type TenantFeature =
  | 'agent_orchestrator'
  | 'knowledge_retrieval'
  | 'digital_twin'
  | 'multi_agent_consensus'
  | 'action_execution'
  | 'custom_agents'
  | 'white_label_branding'
  | 'advanced_analytics'
  | 'api_access'
  | 'sso'

export interface TenantLLMPolicy {
  preferredModel?: string
  allowedModels: string[]
  maxTokensPerRequest: number
  requireApprovalAboveTokens?: number
  provider?: 'anthropic' | 'gemini' | 'openai' | 'any'
  costLimitPerMonthUSD?: number
}

export interface TenantKPI {
  id: string
  name: string
  unit: string
  target?: number
  formula?: string    // JS expression referencing metric names
  display: 'number' | 'percent' | 'currency' | 'duration'
}

// Per-tenant in-memory memory store (isolated per tenant)
const TENANT_MEMORY: Map<string, Map<string, unknown>> = new Map()
const TENANT_LICENSES: Map<string, TenantLicense> = new Map()

// ─── Feature gates per tier ───────────────────────────────────────────────────

const TIER_FEATURES: Record<SubscriptionTier, TenantFeature[]> = {
  enterprise: [
    'agent_orchestrator', 'knowledge_retrieval', 'digital_twin',
    'multi_agent_consensus', 'action_execution', 'custom_agents',
    'white_label_branding', 'advanced_analytics', 'api_access', 'sso',
  ],
  construction_company: [
    'agent_orchestrator', 'knowledge_retrieval', 'action_execution',
    'advanced_analytics', 'api_access',
  ],
  investor: [
    'knowledge_retrieval', 'advanced_analytics',
  ],
  white_label: [
    'agent_orchestrator', 'knowledge_retrieval', 'digital_twin',
    'multi_agent_consensus', 'action_execution', 'custom_agents',
    'white_label_branding', 'advanced_analytics', 'api_access', 'sso',
  ],
}

const TIER_TOKEN_BUDGETS: Record<SubscriptionTier, number> = {
  enterprise: 50_000_000,
  construction_company: 10_000_000,
  investor: 2_000_000,
  white_label: 100_000_000,
}

// ─── License Management ───────────────────────────────────────────────────────

export function createTenantLicense(
  tenantId: string,
  tier: SubscriptionTier,
  seats = 5,
  llmPolicy?: Partial<TenantLLMPolicy>
): TenantLicense {
  const license: TenantLicense = {
    tenantId,
    tier,
    seats,
    usedSeats: 0,
    monthlyTokenBudget: TIER_TOKEN_BUDGETS[tier],
    usedTokensThisMonth: 0,
    features: TIER_FEATURES[tier],
    customAgents: [],
    llmPolicy: {
      allowedModels: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
      maxTokensPerRequest: tier === 'investor' ? 4000 : 16000,
      provider: 'any',
      ...llmPolicy,
    },
    kpis: defaultKPIsForTier(tier),
    active: true,
    createdAt: new Date().toISOString(),
  }
  TENANT_LICENSES.set(tenantId, license)
  return license
}

export function getTenantLicense(tenantId: string): TenantLicense | null {
  return TENANT_LICENSES.get(tenantId) ?? null
}

export function hasFeature(tenantId: string, feature: TenantFeature): boolean {
  const license = TENANT_LICENSES.get(tenantId)
  if (!license || !license.active) return false
  return license.features.includes(feature)
}

export function checkTokenBudget(tenantId: string, estimatedTokens: number): boolean {
  const license = TENANT_LICENSES.get(tenantId)
  if (!license) return true // No license = unrestricted (dev mode)
  return (license.usedTokensThisMonth + estimatedTokens) <= license.monthlyTokenBudget
}

export function consumeTokens(tenantId: string, tokens: number): void {
  const license = TENANT_LICENSES.get(tenantId)
  if (license) license.usedTokensThisMonth += tokens
}

// ─── Per-Tenant Memory (isolated) ─────────────────────────────────────────────

export function tenantSet(tenantId: string, key: string, value: unknown): void {
  if (!TENANT_MEMORY.has(tenantId)) TENANT_MEMORY.set(tenantId, new Map())
  TENANT_MEMORY.get(tenantId)!.set(key, value)
}

export function tenantGet(tenantId: string, key: string): unknown {
  return TENANT_MEMORY.get(tenantId)?.get(key) ?? null
}

export function tenantGetAll(tenantId: string): Record<string, unknown> {
  const map = TENANT_MEMORY.get(tenantId)
  if (!map) return {}
  return Object.fromEntries(map)
}

export function tenantClear(tenantId: string): void {
  TENANT_MEMORY.delete(tenantId)
}

// ─── Request isolation header helper ─────────────────────────────────────────

export function resolveTenantId(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['x-tenant-id'] ?? headers['x-organization-id'] ?? 'default'
  return Array.isArray(raw) ? raw[0] : (raw as string)
}

// ─── Default KPIs per tier ────────────────────────────────────────────────────

function defaultKPIsForTier(tier: SubscriptionTier): TenantKPI[] {
  const base: TenantKPI[] = [
    { id: 'task_success_rate', name: 'Taxa de Sucesso', unit: '%', target: 95, display: 'percent' },
    { id: 'agent_latency', name: 'Latência Média', unit: 'ms', target: 2000, display: 'duration' },
  ]
  if (tier === 'enterprise' || tier === 'white_label') {
    base.push(
      { id: 'cost_per_workflow', name: 'Custo por Fluxo', unit: 'USD', display: 'currency' },
      { id: 'hallucination_rate', name: 'Taxa de Alucinação', unit: '%', target: 2, display: 'percent' },
      { id: 'decision_accuracy', name: 'Precisão de Decisão', unit: '%', target: 90, display: 'percent' },
    )
  }
  if (tier === 'construction_company') {
    base.push(
      { id: 'projects_analyzed', name: 'Projetos Analisados', unit: 'un', display: 'number' },
      { id: 'rdo_generated', name: 'RDOs Gerados', unit: 'un', display: 'number' },
    )
  }
  if (tier === 'investor') {
    base.push(
      { id: 'roi_analyzed', name: 'ROIs Calculados', unit: 'un', display: 'number' },
    )
  }
  return base
}
