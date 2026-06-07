import {
  APEX_COPILOT_DEFAULT_DOMAIN,
  APEX_COPILOT_SKILLS,
  type ApexCopilotSkillDomain,
  getApexCopilotSkill,
} from './skill-registry'

export type ApexCopilotRoutingInput = {
  text?: string
  fileName?: string
  fileType?: string
}

function extensionFrom(fileName = '') {
  const clean = fileName.toLowerCase().split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function add(scores: Record<ApexCopilotSkillDomain, number>, domain: ApexCopilotSkillDomain, amount: number) {
  scores[domain] += amount
}

export function selectApexCopilotSkill(input: ApexCopilotRoutingInput) {
  const text = `${input.text || ''} ${input.fileName || ''} ${input.fileType || ''}`.toLowerCase()
  const ext = extensionFrom(input.fileName)
  const scores = Object.keys(APEX_COPILOT_SKILLS).reduce((acc, key) => {
    acc[key as ApexCopilotSkillDomain] = 0
    return acc
  }, {} as Record<ApexCopilotSkillDomain, number>)

  for (const skill of Object.values(APEX_COPILOT_SKILLS)) {
    for (const trigger of skill.triggers) {
      if (text.includes(trigger.toLowerCase())) add(scores, skill.domain, 8)
    }
  }

  if (input.fileName || input.fileType) add(scores, 'file-intake', 14)
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext) || input.fileType?.startsWith('image/')) {
    add(scores, 'archvis', 24)
    add(scores, 'visual-design', 10)
    add(scores, 'marketing', 5)
  }
  if (['ifc', 'rvt', 'dwg', 'dxf', 'skp', 'stl', 'obj', 'fbx', 'glb', 'gltf'].includes(ext)) add(scores, 'bim-3d', 30)
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || input.fileType?.startsWith('video/')) add(scores, 'directcut', 28)
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    add(scores, 'data-analysis', 18)
    add(scores, 'budget', 16)
  }
  if (['pdf', 'doc', 'docx'].includes(ext)) {
    add(scores, 'contracts', 8)
    add(scores, 'file-intake', 8)
  }
  if (['zip', 'rar', '7z'].includes(ext)) add(scores, 'file-intake', 16)

  const patterns: Array<[RegExp, ApexCopilotSkillDomain, number]> = [
    [/(render|humaniz|floor plan|planta|facade|fachada|interior|archvis)/i, 'archvis', 30],
    [/(video|timelapse|shot list|storyboard|directcut|tour|reel)/i, 'directcut', 30],
    [/(ifc|rvt|revit|bim|clash|dwg|dxf|skp|3d model|viewer|coordination)/i, 'bim-3d', 32],
    [/(budget|orcamento|orçamento|estimate|quantity|takeoff|invoice|cost|proposal)/i, 'budget', 28],
    [/(contract|contrato|permit|compliance|legal|signature|memorial|endorsement)/i, 'contracts', 28],
    [/(field|jobsite|obra|rdo|crew|material|quality|progress|site)/i, 'field', 26],
    [/(marketing|campaign|portfolio|social|sales|sell|brand)/i, 'marketing', 24],
    [/(website|landing page|web builder|site)/i, 'website-design', 24],
    [/(spreadsheet|csv|kpi|data|dashboard|chart|analysis)/i, 'data-analysis', 22],
    [/(code|bug|github|pull request|build|api|typescript|component)/i, 'coding-support', 24],
    [/(research|paper|citation|academic|literature|study)/i, 'academic-research', 22],
    [/(rewrite|humanize text|email|copy|tone|proposal text)/i, 'writing-humanizer', 20],
    [/(negotiate|negotiation|objection|terms|deal)/i, 'negotiation', 20],
    [/(error|not working|login|upload failed|support|troubleshoot)/i, 'tech-support', 20],
    [/(design|presentation|layout|visual identity|graphic)/i, 'visual-design', 18],
  ]

  for (const [pattern, domain, amount] of patterns) {
    if (pattern.test(text)) add(scores, domain, amount)
  }

  const selectedDomain = (Object.keys(scores) as ApexCopilotSkillDomain[])
    .sort((a, b) => scores[b] - scores[a])[0]

  return getApexCopilotSkill(scores[selectedDomain] > 0 ? selectedDomain : APEX_COPILOT_DEFAULT_DOMAIN)
}
