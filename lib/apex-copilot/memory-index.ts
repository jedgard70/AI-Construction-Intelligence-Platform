import type { ApexCopilotSkillDomain } from './skill-registry'

export type ApexCopilotMemoryCategory =
  | 'master-vision'
  | 'checkpoint-status'
  | 'apex-copilot-behavior'
  | 'archvis-humanizacao'
  | 'directcut-video'
  | 'bim-3d-viewer'
  | 'budget-quantity'
  | 'contracts-legal-permits'
  | 'field-operations'
  | 'marketing-website-portfolio'
  | 'technical-architecture'
  | 'historical-superseded'

export type ApexCopilotMemoryDoc = {
  path: string
  title: string
  category: ApexCopilotMemoryCategory
  current: boolean
  domains: ApexCopilotSkillDomain[]
  reason: string
}

export const APEX_COPILOT_MEMORY_HARD_RULES = [
  'No fake intelligence: Apex Copilot must not pretend to parse, convert, render, view, generate, price or approve anything that did not actually happen.',
  'Chat-first: the primary intelligence is a live Apex Copilot conversation. Cards, modules and chips are secondary supporting actions.',
  'Construction-specialized: responses must stay grounded in construction, architecture, BIM/CAD, ArchVis, budgets, contracts, permits, field operations, marketing and delivery.',
  'Honest preview/viewer: images and supported previews can be shown; IFC viewer attempts must use the uploaded model; RVT/DWG/DXF/SKP require conversion strategy and must not be faked.',
  'EN primary with PT toggle: default product language is English unless the UI/user context asks for Portuguese.',
]

const categoryDomains: Record<ApexCopilotMemoryCategory, ApexCopilotSkillDomain[]> = {
  'master-vision': ['exploration', 'file-intake', 'archvis', 'bim-3d', 'directcut', 'budget', 'contracts', 'field', 'marketing'],
  'checkpoint-status': ['exploration', 'file-intake', 'tech-support'],
  'apex-copilot-behavior': ['exploration', 'file-intake', 'tech-support'],
  'archvis-humanizacao': ['archvis', 'interior-design', 'visual-design', 'marketing'],
  'directcut-video': ['directcut', 'marketing', 'visual-design'],
  'bim-3d-viewer': ['bim-3d', 'budget', 'field'],
  'budget-quantity': ['budget', 'data-analysis', 'negotiation'],
  'contracts-legal-permits': ['contracts', 'negotiation', 'writing-humanizer'],
  'field-operations': ['field', 'bim-3d', 'budget'],
  'marketing-website-portfolio': ['marketing', 'website-design', 'visual-design', 'writing-humanizer'],
  'technical-architecture': ['coding-support', 'tech-support', 'data-analysis', 'exploration'],
  'historical-superseded': ['exploration', 'tech-support'],
}

function normalized(value: string) {
  return value.toLowerCase().replace(/\\/g, '/')
}

function titleFromPath(filePath: string) {
  const name = filePath.split(/[\\/]/).pop() || filePath
  return name.replace(/\.md$/i, '').replace(/[_-]+/g, ' ')
}

function isHistorical(filePath: string) {
  const value = normalized(filePath)
  return (
    value.includes('deprecated') ||
    value.includes('superseded') ||
    value.includes('auditoria_') ||
    value.includes('audit') ||
    value.includes('cleanup') ||
    value.includes('recovery') ||
    value.includes('fix_') ||
    value.includes('pr84') ||
    value.includes('pr85') ||
    value.includes('pr86') ||
    value.includes('pr89') ||
    /docs\/pr\d+/i.test(value) ||
    /docs\/pr_[a-z0-9_]/i.test(value)
  )
}

export function classifyApexCopilotMemoryDoc(filePath: string): ApexCopilotMemoryDoc {
  const value = normalized(filePath)
  let category: ApexCopilotMemoryCategory = 'technical-architecture'
  let reason = 'Technical or operational platform document.'

  if (value.includes('master_vision') || value.includes('master_plan') || value.includes('roadmap_oficial')) {
    category = 'master-vision'
    reason = 'Defines the master vision, roadmap or platform direction.'
  } else if (value.includes('cp') || value.includes('checkpoint') || value.includes('status') || value.includes('handoff')) {
    category = 'checkpoint-status'
    reason = 'Records checkpoint state, status, handoff or execution rules.'
  } else if (value.includes('apex_copilot') || value.includes('copilot_knowledge') || value.includes('safety_gate')) {
    category = 'apex-copilot-behavior'
    reason = 'Defines Apex Copilot behavior, governance or knowledge rules.'
  } else if (value.includes('archvis') || value.includes('humanizacao') || value.includes('humanization') || value.includes('plantas')) {
    category = 'archvis-humanizacao'
    reason = 'Guides ArchVis, render, plant/humanization or visual production workflows.'
  } else if (value.includes('directcut') || value.includes('director-cut') || value.includes('video')) {
    category = 'directcut-video'
    reason = 'Guides DirectCut, video, shot list or media production workflows.'
  } else if (value.includes('bim') || value.includes('3d') || value.includes('viewer') || value.includes('revit') || value.includes('ifc')) {
    category = 'bim-3d-viewer'
    reason = 'Guides BIM, 3D, viewer, Revit, IFC or CAD workflows.'
  } else if (value.includes('orcamento') || value.includes('budget') || value.includes('quantity') || value.includes('revenue') || value.includes('finance')) {
    category = 'budget-quantity'
    reason = 'Guides budget, quantity, revenue, finance or cost workflows.'
  } else if (value.includes('juridico') || value.includes('legal') || value.includes('contract') || value.includes('permit') || value.includes('compliance')) {
    category = 'contracts-legal-permits'
    reason = 'Guides contracts, legal, permits, compliance or signature workflows.'
  } else if (value.includes('field') || value.includes('rdo') || value.includes('obra') || value.includes('qualidade')) {
    category = 'field-operations'
    reason = 'Guides field operations, jobsite, RDO, quality or execution workflows.'
  } else if (value.includes('marketing') || value.includes('website') || value.includes('portfolio') || value.includes('brand') || value.includes('web')) {
    category = 'marketing-website-portfolio'
    reason = 'Guides marketing, website, portfolio, brand or sales-material workflows.'
  }

  if (isHistorical(filePath)) {
    return {
      path: filePath,
      title: titleFromPath(filePath),
      category: 'historical-superseded',
      current: false,
      domains: categoryDomains['historical-superseded'],
      reason: 'Historical, audit, PR-specific, cleanup or superseded document. Use for provenance only, not current truth.',
    }
  }

  return {
    path: filePath,
    title: titleFromPath(filePath),
    category,
    current: category !== 'historical-superseded',
    domains: categoryDomains[category],
    reason,
  }
}

export function domainsForMemoryCategory(category: ApexCopilotMemoryCategory) {
  return categoryDomains[category]
}
