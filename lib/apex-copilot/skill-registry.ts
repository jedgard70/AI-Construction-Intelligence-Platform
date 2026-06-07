export type ApexCopilotSkillDomain =
  | 'file-intake'
  | 'archvis'
  | 'directcut'
  | 'bim-3d'
  | 'budget'
  | 'contracts'
  | 'field'
  | 'marketing'
  | 'interior-design'
  | 'website-design'
  | 'data-analysis'
  | 'coding-support'
  | 'academic-research'
  | 'visual-design'
  | 'negotiation'
  | 'tech-support'
  | 'writing-humanizer'
  | 'exploration'

export type ApexCopilotSkill = {
  domain: ApexCopilotSkillDomain
  title: string
  purpose: string
  triggers: string[]
  outputStyle: string
  guardrail: string
}

export const APEX_COPILOT_SKILLS: Record<ApexCopilotSkillDomain, ApexCopilotSkill> = {
  'file-intake': {
    domain: 'file-intake',
    title: 'Universal File Intake',
    purpose: 'Accept any file, identify metadata, ask intent, and route safely without rejecting unknown formats.',
    triggers: ['upload', 'file', 'attachment', 'pdf', 'zip', 'unknown file', 'document'],
    outputStyle: 'Conversational intake summary with next questions and safe workflow choices.',
    guardrail: 'Do not claim deep parsing or viewer support when only metadata is available.',
  },
  archvis: {
    domain: 'archvis',
    title: 'ArchVis / Humanizacao',
    purpose: 'Transform plans, images, sketches and visual goals into render, humanized plan or presentation workflow.',
    triggers: ['render', 'humanize', 'floor plan', 'planta', 'facade', 'interior', 'archvis'],
    outputStyle: 'Visual production brief with style, camera, materials, audience and output prompt.',
    guardrail: 'Do not claim a generated render exists until visible output is produced.',
  },
  directcut: {
    domain: 'directcut',
    title: 'DirectCut / Video',
    purpose: 'Create video plan, script, shot list, timeline and delivery format for construction stories.',
    triggers: ['video', 'timelapse', 'shot list', 'script', 'reel', 'directcut', 'tour'],
    outputStyle: 'Structured production plan with scenes, duration, source assets and review steps.',
    guardrail: 'Do not pretend video rendering happened without a real render/export step.',
  },
  'bim-3d': {
    domain: 'bim-3d',
    title: 'BIM / 3D / Viewer',
    purpose: 'Guide BIM, Revit, IFC, CAD, clash review, quantity and 3D viewer workflows.',
    triggers: ['ifc', 'rvt', 'dwg', 'dxf', 'skp', 'bim', 'revit', 'clash', '3d model'],
    outputStyle: 'Technical BIM guidance with viewer status, conversion needs, risks and next action.',
    guardrail: 'IFC can be attempted in a browser viewer; RVT/DWG/DXF/SKP require conversion and must not be faked.',
  },
  budget: {
    domain: 'budget',
    title: 'Budget / Quantity',
    purpose: 'Prepare construction budget, quantity takeoff, cost assumptions, proposals and invoice review.',
    triggers: ['budget', 'orcamento', 'estimate', 'quantity', 'takeoff', 'invoice', 'spreadsheet', 'cost'],
    outputStyle: 'Estimate plan with scope, units, assumptions, exclusions and required evidence.',
    guardrail: 'Do not present estimates as final pricing without scope, units, region and approval.',
  },
  contracts: {
    domain: 'contracts',
    title: 'Contracts / Legal / Permits',
    purpose: 'Review contracts, permits, compliance, memorials, endorsements and signature workflows.',
    triggers: ['contract', 'contrato', 'permit', 'compliance', 'legal', 'signature', 'memorial'],
    outputStyle: 'Document classification with risk flags, missing data and next legal step.',
    guardrail: 'Do not provide legal advice as a lawyer; frame as operational review and escalation path.',
  },
  field: {
    domain: 'field',
    title: 'Field Operations',
    purpose: 'Handle jobsite, RDO, progress, quality, materials, crew and execution context.',
    triggers: ['field', 'jobsite', 'obra', 'rdo', 'progress', 'crew', 'material', 'quality'],
    outputStyle: 'Operational field record with evidence, responsibility, urgency and next action.',
    guardrail: 'Do not invent site facts not present in the user evidence.',
  },
  marketing: {
    domain: 'marketing',
    title: 'Construction Marketing',
    purpose: 'Create campaigns, portfolio narratives, social media, project positioning and sales material.',
    triggers: ['marketing', 'campaign', 'portfolio', 'social', 'sell', 'sales', 'brand'],
    outputStyle: 'Campaign plan with audience, offer, assets, channels and visual needs.',
    guardrail: 'Do not overpromise claims that are not supported by project evidence.',
  },
  'interior-design': {
    domain: 'interior-design',
    title: 'Interior Design',
    purpose: 'Guide interiors, finishes, moodboards, materials, furniture and spatial atmosphere.',
    triggers: ['interior', 'furniture', 'material', 'finish', 'moodboard', 'decor'],
    outputStyle: 'Interior concept with style, palette, materials, lighting and deliverables.',
    guardrail: 'Separate design direction from final construction specification.',
  },
  'website-design': {
    domain: 'website-design',
    title: 'Website Design',
    purpose: 'Plan construction websites, landing pages, service pages and digital presentations.',
    triggers: ['website', 'landing page', 'site', 'web builder', 'portfolio site'],
    outputStyle: 'Website plan with sections, visual hierarchy, copy, assets and CTA flow.',
    guardrail: 'Do not imply deployment or domain changes unless explicitly approved.',
  },
  'data-analysis': {
    domain: 'data-analysis',
    title: 'Data Analysis',
    purpose: 'Analyze spreadsheets, reports, KPIs, financial data, production metrics and trends.',
    triggers: ['data', 'spreadsheet', 'csv', 'kpi', 'dashboard', 'analysis', 'chart'],
    outputStyle: 'Analytical summary with patterns, anomalies, assumptions and recommended next checks.',
    guardrail: 'Do not expose sensitive rows or personal data unnecessarily.',
  },
  'coding-support': {
    domain: 'coding-support',
    title: 'Coding Support',
    purpose: 'Help with code, PRs, bugs, implementation plans and technical diagnostics.',
    triggers: ['code', 'bug', 'pr', 'github', 'build', 'typescript', 'api'],
    outputStyle: 'Engineering response with diagnosis, risk, exact files and next action.',
    guardrail: 'Do not execute destructive changes without explicit approval.',
  },
  'academic-research': {
    domain: 'academic-research',
    title: 'Academic Research',
    purpose: 'Support research, citations, summaries, papers, methods and evidence comparison.',
    triggers: ['research', 'paper', 'academic', 'citation', 'study', 'literature'],
    outputStyle: 'Research plan or synthesis with source needs, claims and caveats.',
    guardrail: 'Do not fabricate citations or current claims.',
  },
  'visual-design': {
    domain: 'visual-design',
    title: 'Visual Design',
    purpose: 'Plan visual identity, presentations, graphics, brand systems and creative assets.',
    triggers: ['visual', 'design', 'brand', 'presentation', 'graphic', 'layout'],
    outputStyle: 'Design direction with hierarchy, palette, assets, layout and production notes.',
    guardrail: 'Do not claim generated assets exist until actually produced.',
  },
  negotiation: {
    domain: 'negotiation',
    title: 'Negotiation',
    purpose: 'Prepare negotiation strategy, offers, objections, terms and client communication.',
    triggers: ['negotiate', 'proposal', 'client objection', 'price', 'terms', 'deal'],
    outputStyle: 'Negotiation brief with position, leverage, risks, scripts and fallback.',
    guardrail: 'Do not recommend deceptive or coercive tactics.',
  },
  'tech-support': {
    domain: 'tech-support',
    title: 'Tech Support',
    purpose: 'Troubleshoot access, upload, browser, preview, build and operational issues.',
    triggers: ['error', 'not working', 'login', 'upload failed', 'preview', 'support'],
    outputStyle: 'Step-by-step diagnostic with likely cause, checks and escalation.',
    guardrail: 'Do not ask for passwords, tokens or secrets.',
  },
  'writing-humanizer': {
    domain: 'writing-humanizer',
    title: 'Writing Humanizer',
    purpose: 'Rewrite copy, reports, emails, proposals and explanations in natural human tone.',
    triggers: ['rewrite', 'humanize text', 'email', 'report', 'copy', 'tone'],
    outputStyle: 'Clear rewritten text with preserved intent and appropriate tone.',
    guardrail: 'Do not hide authorship or create deceptive academic misconduct.',
  },
  exploration: {
    domain: 'exploration',
    title: 'Exploration',
    purpose: 'Explore unclear ideas, brainstorm routes, ask clarifying questions and map options.',
    triggers: ['idea', 'explore', 'what can we do', 'unknown', 'brainstorm'],
    outputStyle: 'Curious but decisive exploration with options and one recommended next step.',
    guardrail: 'Do not drift into unrelated modules before clarifying intent.',
  },
}

export const APEX_COPILOT_DEFAULT_DOMAIN: ApexCopilotSkillDomain = 'exploration'

export function getApexCopilotSkill(domain: ApexCopilotSkillDomain) {
  return APEX_COPILOT_SKILLS[domain] || APEX_COPILOT_SKILLS[APEX_COPILOT_DEFAULT_DOMAIN]
}
