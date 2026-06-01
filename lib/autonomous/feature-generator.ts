import { AUTONOMOUS_BACKLOG, type AutonomousBacklogItem } from './model'

export type FeatureSpec = {
  id: string
  title: string
  module: string
  objective: string
  scope: string[]
  acceptanceCriteria: string[]
  risks: string[]
  needsApproval: boolean
}

const ROADMAP_DOC_SOURCES = [
  'docs/PACOTE_MASTER_STATUS_GERAL.md',
  'docs/ROADMAP_OFICIAL.md',
  'docs/PACOTE_MASTER_002_INDEX.md',
]

export function getBacklogPriorityList(): AutonomousBacklogItem[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const statusOrder = { running: 0, queued: 1, planned: 2, approved: 3, blocked: 4, done: 5, failed: 6 }
  return [...AUTONOMOUS_BACKLOG].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export function generateNextFeatureSpec(): FeatureSpec {
  const next = getBacklogPriorityList().find(item => item.status !== 'done' && item.status !== 'failed')
  const fallback = {
    id: 'PR-NEXT',
    title: 'Operational hardening',
    module: 'mission-control',
    priority: 'medium',
    status: 'planned',
    risk: 'low',
    approvalRequired: false,
    rationale: 'Padronizar fechamento de pendencias operacionais.',
  } satisfies AutonomousBacklogItem

  const selected = next ?? fallback
  return {
    id: selected.id,
    title: selected.title,
    module: selected.module,
    objective: selected.rationale,
    scope: [
      'Analisar impacto somente no modulo alvo',
      'Manter guardrails de governanca ativos',
      'Registrar validacao de build e smoke tests',
    ],
    acceptanceCriteria: [
      'Build local com webpack sem erro',
      'Rotas/API do modulo alvo respondendo',
      'Sem alteracoes fora do escopo autorizado',
    ],
    risks: [
      `Risco declarado no backlog: ${selected.risk}`,
      'Divergencia com estado atual de main',
      'Dependencias externas indisponiveis no ambiente local',
    ],
    needsApproval: selected.approvalRequired,
  }
}

export function getRoadmapSources() {
  return ROADMAP_DOC_SOURCES
}

export function getPrAuditTemplate() {
  return {
    scopeChecklist: [
      'Diff restrito ao escopo do PR',
      'Sem arquivos temporarios e sem segredos',
      'Sem alteracao em modulo proibido',
    ],
    forbiddenItems: [
      'tmp_*',
      'supabase/.temp/',
      'tokens/keys/segredos em texto',
      'migrations sem aprovacao explicita',
      'acoes destrutivas automatizadas',
    ],
    qualityChecks: [
      'npm run build -- --webpack',
      'Smoke test das rotas afetadas',
      'Documentacao do PR atualizada',
    ],
    mergeRiskGuide: [
      { level: 'low', condition: 'Escopo isolado, build verde, sem conflito' },
      { level: 'medium', condition: 'Escopo amplo ou dependencia externa instavel' },
      { level: 'high', condition: 'Conflito com main, regressao funcional ou seguranca' },
    ],
  }
}
