// ============================================================
// AI Executive Orchestrator — Rules Engine
// lib/orchestrator/rules.ts
//
// AVISO: Este módulo define regras, guardrails e classificação
// de risco para o orquestrador executivo. NÃO é o mesmo que
// pages/api/agents/orchestrator.ts (executor de agentes).
//
// Modo: advisor + guardrail + command generator
// NÃO executa ações automaticamente.
// ============================================================

export type Jurisdiction = 'BR' | 'PT' | 'US' | 'EU'

// ─── Risk Levels ────────────────────────────────────────────
export enum RiskLevel {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export const RISK_SCORE: Record<RiskLevel, number> = {
  [RiskLevel.LOW]:      10,
  [RiskLevel.MEDIUM]:   40,
  [RiskLevel.HIGH]:     75,
  [RiskLevel.CRITICAL]: 100,
}

// ─── Action Categories ──────────────────────────────────────
export enum ActionCategory {
  READ      = 'READ',      // Leituras, consultas, relatórios
  WRITE     = 'WRITE',     // Inserções, edições de dados
  DELETE    = 'DELETE',    // Exclusões de dados ou recursos
  DEPLOY    = 'DEPLOY',    // Deploy de código, infraestrutura
  MIGRATE   = 'MIGRATE',   // Migrations de banco de dados
  FINANCIAL = 'FINANCIAL', // Operações financeiras, pagamentos
  AUTH      = 'AUTH',      // Gestão de autenticação e permissões
  CONFIG    = 'CONFIG',    // Alteração de configurações de sistema
}

// ─── Default Risk per Category ──────────────────────────────
export const CATEGORY_DEFAULT_RISK: Record<ActionCategory, RiskLevel> = {
  [ActionCategory.READ]:      RiskLevel.LOW,
  [ActionCategory.WRITE]:     RiskLevel.MEDIUM,
  [ActionCategory.DELETE]:    RiskLevel.HIGH,
  [ActionCategory.DEPLOY]:    RiskLevel.HIGH,
  [ActionCategory.MIGRATE]:   RiskLevel.CRITICAL,
  [ActionCategory.FINANCIAL]: RiskLevel.CRITICAL,
  [ActionCategory.AUTH]:      RiskLevel.HIGH,
  [ActionCategory.CONFIG]:    RiskLevel.HIGH,
}

// ─── Blocked Actions (never auto-execute) ───────────────────
export const ALWAYS_BLOCKED: Set<string> = new Set([
  'drop_table',
  'truncate_table',
  'delete_all_records',
  'revoke_all_permissions',
  'delete_project',
  'delete_tenant',
  'modify_schema_production',
  'run_migration_production',
  'send_payment',
  'transfer_funds',
  'delete_user',
  'disable_auth',
])

// ─── Approval Thresholds ────────────────────────────────────
export const APPROVAL_THRESHOLDS = {
  auto_approve:  RiskLevel.LOW,
  requires_review: RiskLevel.MEDIUM,
  requires_approval: RiskLevel.HIGH,
  always_block: RiskLevel.CRITICAL,
} as const

// ─── Jurisdiction-specific Rules ────────────────────────────
export interface JurisdictionRule {
  language: string
  currency: string
  data_residency: string[]
  required_approvals: ActionCategory[]
  forbidden_auto_actions: ActionCategory[]
  notes: string
}

export const JURISDICTION_RULES: Record<Jurisdiction, JurisdictionRule> = {
  BR: {
    language: 'pt-BR',
    currency: 'BRL',
    data_residency: ['sa-east-1', 'brazil'],
    required_approvals: [
      ActionCategory.FINANCIAL,
      ActionCategory.DELETE,
      ActionCategory.MIGRATE,
      ActionCategory.AUTH,
    ],
    forbidden_auto_actions: [
      ActionCategory.FINANCIAL,
      ActionCategory.MIGRATE,
    ],
    notes: 'LGPD compliance required. All PII operations must be logged. Financial ops require 2-factor approval.',
  },
  PT: {
    language: 'pt-PT',
    currency: 'EUR',
    data_residency: ['eu-west-1', 'eu-central-1'],
    required_approvals: [
      ActionCategory.FINANCIAL,
      ActionCategory.DELETE,
      ActionCategory.MIGRATE,
      ActionCategory.AUTH,
      ActionCategory.CONFIG,
    ],
    forbidden_auto_actions: [
      ActionCategory.FINANCIAL,
      ActionCategory.MIGRATE,
      ActionCategory.DELETE,
    ],
    notes: 'GDPR/EU compliance required. Data must remain in EU. NIF required for financial ops.',
  },
  US: {
    language: 'en-US',
    currency: 'USD',
    data_residency: ['us-east-1', 'us-west-2'],
    required_approvals: [
      ActionCategory.FINANCIAL,
      ActionCategory.MIGRATE,
    ],
    forbidden_auto_actions: [
      ActionCategory.FINANCIAL,
    ],
    notes: 'SOC2 compliance recommended. PCI-DSS for financial operations.',
  },
  EU: {
    language: 'en-EU',
    currency: 'EUR',
    data_residency: ['eu-west-1', 'eu-central-1', 'eu-north-1'],
    required_approvals: [
      ActionCategory.FINANCIAL,
      ActionCategory.DELETE,
      ActionCategory.MIGRATE,
      ActionCategory.AUTH,
      ActionCategory.CONFIG,
    ],
    forbidden_auto_actions: [
      ActionCategory.FINANCIAL,
      ActionCategory.MIGRATE,
      ActionCategory.DELETE,
    ],
    notes: 'GDPR compliance required. Right to erasure must be supported. DPO review for mass data ops.',
  },
}

// ─── Risk Classification ─────────────────────────────────────
export interface RiskClassification {
  level: RiskLevel
  score: number
  requires_approval: boolean
  blocked: boolean
  reason: string
  jurisdiction_flags: string[]
}

export function classifyRisk(
  action: string,
  category: ActionCategory,
  jurisdiction: Jurisdiction = 'BR',
  target?: string,
): RiskClassification {
  const flags: string[] = []

  // Check if action is always blocked
  if (ALWAYS_BLOCKED.has(action)) {
    return {
      level: RiskLevel.CRITICAL,
      score: 100,
      requires_approval: true,
      blocked: true,
      reason: `Ação '${action}' está na lista de ações bloqueadas permanentemente.`,
      jurisdiction_flags: [`BLOCKED_ACTION:${action}`],
    }
  }

  // Get base risk from category
  let level = CATEGORY_DEFAULT_RISK[category]

  // Elevate risk for production targets
  if (target) {
    const prodPatterns = ['production', 'prod', 'main', 'master', 'live']
    if (prodPatterns.some(p => target.toLowerCase().includes(p))) {
      level = elevateRisk(level)
      flags.push('TARGET_IS_PRODUCTION')
    }
  }

  // Check jurisdiction rules
  const jRule = JURISDICTION_RULES[jurisdiction]
  if (jRule.forbidden_auto_actions.includes(category)) {
    level = elevateRisk(level)
    flags.push(`JURISDICTION_${jurisdiction}_FORBIDDEN_AUTO:${category}`)
  }
  if (jRule.required_approvals.includes(category)) {
    flags.push(`JURISDICTION_${jurisdiction}_REQUIRES_APPROVAL:${category}`)
  }

  const score = RISK_SCORE[level]
  const requires_approval = level !== RiskLevel.LOW
  const blocked = level === RiskLevel.CRITICAL

  return {
    level,
    score,
    requires_approval,
    blocked,
    reason: buildReason(action, category, level, flags),
    jurisdiction_flags: flags,
  }
}

function elevateRisk(current: RiskLevel): RiskLevel {
  const order = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : RiskLevel.CRITICAL
}

function buildReason(
  action: string,
  category: ActionCategory,
  level: RiskLevel,
  flags: string[],
): string {
  const parts = [`Categoria: ${category}`, `Nível: ${level}`]
  if (flags.length > 0) {
    parts.push(`Flags: ${flags.join(', ')}`)
  }
  return parts.join(' | ')
}
