export type AutonomousPriority = 'low' | 'medium' | 'high' | 'critical'
export type AutonomousStatus = 'queued' | 'planned' | 'blocked' | 'approved' | 'running' | 'done' | 'failed'
export type AutonomousRisk = 'low' | 'medium' | 'high' | 'critical'

export type AutonomousBacklogItem = {
  id: string
  title: string
  module: string
  priority: AutonomousPriority
  status: AutonomousStatus
  risk: AutonomousRisk
  approvalRequired: boolean
  rationale: string
}

export type ApprovalGuardrail = {
  key: string
  description: string
  approvalRequired: boolean
}

export const APPROVAL_GUARDRAILS: ApprovalGuardrail[] = [
  { key: 'destructive_actions', description: 'Ações destrutivas (delete/reset/move em massa)', approvalRequired: true },
  { key: 'production_deploy', description: 'Deploy crítico em produção', approvalRequired: true },
  { key: 'database_migration', description: 'Migrations de banco', approvalRequired: true },
  { key: 'external_publish', description: 'Publicação/envio externo', approvalRequired: true },
]

export const AUTONOMOUS_BACKLOG: AutonomousBacklogItem[] = [
  {
    id: 'PR-A',
    title: 'Autonomous Orchestrator Foundation',
    module: 'mission-control',
    priority: 'critical',
    status: 'running',
    risk: 'medium',
    approvalRequired: false,
    rationale: 'Fundação de autonomia com guardrails sem autoexecução destrutiva.',
  },
  {
    id: 'PR-B',
    title: 'Task Orchestrator',
    module: 'autonomous-api',
    priority: 'high',
    status: 'queued',
    risk: 'medium',
    approvalRequired: false,
    rationale: 'Planejamento e priorização de tarefas internas por módulo.',
  },
  {
    id: 'PR-C',
    title: 'Design Evolution Engine',
    module: 'design-system',
    priority: 'high',
    status: 'queued',
    risk: 'low',
    approvalRequired: false,
    rationale: 'Auditoria visual e plano de redesign sem mutação automática.',
  },
]

export function getNextAutonomousBlock() {
  return AUTONOMOUS_BACKLOG.find(item => item.status === 'running' || item.status === 'queued') ?? null
}

export function getApprovalRequiredActions() {
  return APPROVAL_GUARDRAILS.filter(g => g.approvalRequired)
}
