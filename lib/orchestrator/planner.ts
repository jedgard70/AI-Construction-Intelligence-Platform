// ============================================================
// AI Executive Orchestrator — Intent Planner
// lib/orchestrator/planner.ts
//
// Gera um plano de execução a partir de uma intenção em
// linguagem natural. Cada passo tem risco classificado e
// flag de aprovação obrigatória.
//
// NÃO executa nada — apenas gera o plano para revisão humana.
// ============================================================

import {
  ActionCategory,
  Jurisdiction,
  RiskLevel,
  classifyRisk,
  RiskClassification,
  ALWAYS_BLOCKED,
} from './rules'

// ─── Types ───────────────────────────────────────────────────
export interface PlanStep {
  id: string
  action: string
  category: ActionCategory
  target: string
  description: string
  estimated_impact: string
  risk: RiskClassification
  requires_approval: boolean
  order: number
}

export interface Plan {
  id: string
  intent: string
  jurisdiction: Jurisdiction
  steps: PlanStep[]
  overall_risk: RiskLevel
  overall_score: number
  blocked_steps: PlanStep[]
  requires_human_approval: boolean
  status: 'pending_approval' | 'approved' | 'rejected' | 'blocked'
  created_at: string
  context?: Record<string, unknown>
}

export interface PlannerContext {
  user_id?: string
  tenant_id?: string
  environment?: 'development' | 'staging' | 'production'
  dry_run?: boolean
  metadata?: Record<string, unknown>
}

// ─── Intent Pattern Matching ─────────────────────────────────
interface IntentPattern {
  patterns: RegExp[]
  category: ActionCategory
  action_template: string
  target_extractor: (intent: string) => string
  description_template: string
  impact_template: string
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    patterns: [/criar?\s+(novo\s+)?(cliente|client)/i, /add\s+client/i, /novo cliente/i],
    category: ActionCategory.WRITE,
    action_template: 'insert_client',
    target_extractor: () => 'table:clients',
    description_template: 'Inserir novo registro na tabela de clientes',
    impact_template: 'Cria 1 novo cliente no banco de dados',
  },
  {
    patterns: [/criar?\s+(novo\s+)?(projeto|project)/i, /add\s+project/i, /novo projeto/i],
    category: ActionCategory.WRITE,
    action_template: 'insert_project',
    target_extractor: () => 'table:projects',
    description_template: 'Inserir novo registro na tabela de projetos',
    impact_template: 'Cria 1 novo projeto no banco de dados',
  },
  {
    patterns: [/deletar?\s+(cliente|client)/i, /remover?\s+(cliente|client)/i, /excluir?\s+(cliente|client)/i],
    category: ActionCategory.DELETE,
    action_template: 'delete_client',
    target_extractor: (i) => `table:clients | filter: ${extractTarget(i)}`,
    description_template: 'Remover cliente(s) da base de dados',
    impact_template: 'Remove permanentemente registros de clientes',
  },
  {
    patterns: [/deletar?\s+(projeto|project)/i, /remover?\s+(projeto|project)/i],
    category: ActionCategory.DELETE,
    action_template: 'delete_project',
    target_extractor: (i) => `table:projects | filter: ${extractTarget(i)}`,
    description_template: 'Remover projeto(s) da base de dados',
    impact_template: 'Remove permanentemente registros de projetos',
  },
  {
    patterns: [/deploy/i, /publicar/i, /fazer\s+deploy/i],
    category: ActionCategory.DEPLOY,
    action_template: 'deploy_application',
    target_extractor: (i) => `env: ${extractTarget(i) || 'production'}`,
    description_template: 'Realizar deploy da aplicação',
    impact_template: 'Atualiza versão em produção — pode causar downtime',
  },
  {
    patterns: [/migra[çc][aã]o/i, /migration/i, /migrar?\s+banco/i, /alter\s+table/i],
    category: ActionCategory.MIGRATE,
    action_template: 'run_migration',
    target_extractor: () => 'database:production',
    description_template: 'Executar migration no banco de dados',
    impact_template: 'Altera estrutura do banco — irreversível sem backup',
  },
  {
    patterns: [/pagamento|payment|pagar|cobrar/i],
    category: ActionCategory.FINANCIAL,
    action_template: 'process_payment',
    target_extractor: (i) => `payment: ${extractTarget(i)}`,
    description_template: 'Processar operação financeira',
    impact_template: 'Movimenta valores financeiros reais',
  },
  {
    patterns: [/relat[oó]rio|report|exportar|export/i],
    category: ActionCategory.READ,
    action_template: 'generate_report',
    target_extractor: (i) => `report: ${extractTarget(i) || 'general'}`,
    description_template: 'Gerar relatório ou exportação de dados',
    impact_template: 'Apenas leitura — sem alterações no banco',
  },
  {
    patterns: [/listar?|list|buscar?|search|consultar?/i],
    category: ActionCategory.READ,
    action_template: 'query_data',
    target_extractor: (i) => `query: ${extractTarget(i) || 'general'}`,
    description_template: 'Consultar dados no sistema',
    impact_template: 'Apenas leitura — sem alterações',
  },
  {
    patterns: [/config|configura[çc][aã]o|settings/i],
    category: ActionCategory.CONFIG,
    action_template: 'update_config',
    target_extractor: (i) => `config: ${extractTarget(i)}`,
    description_template: 'Alterar configuração do sistema',
    impact_template: 'Pode afetar comportamento global da aplicação',
  },
  {
    patterns: [/permiss[aã]o|permission|acesso|access|usu[aá]rio|user/i],
    category: ActionCategory.AUTH,
    action_template: 'manage_auth',
    target_extractor: (i) => `auth: ${extractTarget(i)}`,
    description_template: 'Gerenciar permissões e autenticação',
    impact_template: 'Altera quem pode acessar o quê no sistema',
  },
]

function extractTarget(intent: string): string {
  // Simple extraction: find capitalized words or quoted strings
  const quoted = intent.match(/"([^"]+)"/)?.[1]
  if (quoted) return quoted
  const words = intent.split(/\s+/).filter(w => w.length > 3)
  return words[words.length - 1] ?? ''
}

// ─── Plan Generator ──────────────────────────────────────────
export function generatePlan(
  intent: string,
  context: PlannerContext = {},
  jurisdiction: Jurisdiction = 'BR',
): Plan {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const steps: PlanStep[] = []
  const blockedSteps: PlanStep[] = []
  let order = 1

  // Match intent to patterns
  let matched = false
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.patterns.some(rx => rx.test(intent))) {
      matched = true
      const action = pattern.action_template
      const target = pattern.target_extractor(intent)

      // Elevate risk for production env
      const effectiveTarget = context.environment === 'production'
        ? `${target} [PRODUCTION]`
        : target

      const risk = classifyRisk(action, pattern.category, jurisdiction, effectiveTarget)

      const step: PlanStep = {
        id: `step_${order}_${action}`,
        action,
        category: pattern.category,
        target: effectiveTarget,
        description: pattern.description_template,
        estimated_impact: pattern.impact_template,
        risk,
        requires_approval: risk.requires_approval,
        order: order++,
      }

      if (risk.blocked) {
        blockedSteps.push(step)
      } else {
        steps.push(step)
      }
      break
    }
  }

  // If no pattern matched, create a generic advisory step
  if (!matched) {
    const risk = classifyRisk('unknown_action', ActionCategory.WRITE, jurisdiction)
    const step: PlanStep = {
      id: `step_1_advisory`,
      action: 'advisory_review',
      category: ActionCategory.READ,
      target: 'intent: ' + intent.slice(0, 80),
      description: 'Intenção não reconhecida automaticamente — requer revisão humana',
      estimated_impact: 'Desconhecido — análise manual necessária',
      risk: { ...risk, level: RiskLevel.MEDIUM, requires_approval: true, blocked: false },
      requires_approval: true,
      order: 1,
    }
    steps.push(step)
  }

  // Calculate overall risk
  const allSteps = [...steps, ...blockedSteps]
  const maxScore = allSteps.reduce((max, s) => Math.max(max, s.risk.score), 0)
  const overall_risk = scoreToLevel(maxScore)
  const hasBlocked = blockedSteps.length > 0
  const requiresApproval = allSteps.some(s => s.requires_approval) || hasBlocked

  return {
    id: planId,
    intent,
    jurisdiction,
    steps,
    overall_risk,
    overall_score: maxScore,
    blocked_steps: blockedSteps,
    requires_human_approval: requiresApproval,
    status: hasBlocked ? 'blocked' : 'pending_approval',
    created_at: new Date().toISOString(),
    context: {
      environment: context.environment ?? 'development',
      dry_run: context.dry_run ?? true,
      tenant_id: context.tenant_id,
    },
  }
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 90) return RiskLevel.CRITICAL
  if (score >= 60) return RiskLevel.HIGH
  if (score >= 25) return RiskLevel.MEDIUM
  return RiskLevel.LOW
}
