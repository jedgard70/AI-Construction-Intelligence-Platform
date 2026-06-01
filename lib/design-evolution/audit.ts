export type DesignAuditPriority = 'low' | 'medium' | 'high'
export type DesignAuditRisk = 'low' | 'medium' | 'high'

export type DesignAuditItem = {
  screen: string
  problem: string
  priority: DesignAuditPriority
  suggestedImprovement: string
  risk: DesignAuditRisk
}

export const DESIGN_AUDIT_ITEMS: DesignAuditItem[] = [
  {
    screen: '/mission-control',
    problem: 'Densidade alta de informações sem hierarquia progressiva por blocos.',
    priority: 'high',
    suggestedImprovement: 'Separar cards por trilha operacional (Core, Design, Feature) com foco em leitura sequencial.',
    risk: 'low',
  },
  {
    screen: '/dashboard',
    problem: 'Mistura de contexto estratégico e operacional em uma única área visual.',
    priority: 'medium',
    suggestedImprovement: 'Criar seção fixa de prioridades do dia com ações rápidas por papel.',
    risk: 'low',
  },
  {
    screen: '/projeto/[id]',
    problem: 'Múltiplas áreas de decisão competindo por atenção no primeiro viewport.',
    priority: 'high',
    suggestedImprovement: 'Reduzir carga inicial com agrupamento por intenção: status, risco, ação recomendada.',
    risk: 'medium',
  },
  {
    screen: '/crm/revenue',
    problem: 'KPIs e tabela podem saturar tela menor sem progressão de leitura.',
    priority: 'medium',
    suggestedImprovement: 'Introduzir resumo compacto no topo e detalhes por expansão progressiva.',
    risk: 'low',
  },
]

export function buildDesignAuditSummary() {
  const high = DESIGN_AUDIT_ITEMS.filter(i => i.priority === 'high').length
  const medium = DESIGN_AUDIT_ITEMS.filter(i => i.priority === 'medium').length
  const low = DESIGN_AUDIT_ITEMS.filter(i => i.priority === 'low').length

  return {
    total: DESIGN_AUDIT_ITEMS.length,
    high,
    medium,
    low,
    nextRecommendedScreens: DESIGN_AUDIT_ITEMS
      .filter(i => i.priority === 'high')
      .map(i => i.screen)
      .slice(0, 3),
  }
}
