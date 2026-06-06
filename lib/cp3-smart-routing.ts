export type Cp32Language = 'en' | 'pt'

export type Cp32Objective =
  | 'visual'
  | 'bim'
  | 'legal'
  | 'finance'
  | 'marketing'
  | 'field'
  | 'generic'

export type Cp32RouteId =
  | 'archvis-render'
  | 'directcut-video'
  | 'bim-clash'
  | 'quantity-budget'
  | 'legal-permits'
  | 'marketing-social'
  | 'field-operations'
  | 'general-unknown'

export type Cp32SmartRoute = {
  routeId: Cp32RouteId
  title: Record<Cp32Language, string>
  confidence: number
  reason: Record<Cp32Language, string>
  recommendedNextAction: Record<Cp32Language, string>
  suggestedAgents: string[]
}

export type Cp32SmartRoutingInput = {
  fileName?: string
  fileType?: string
  goal?: string
  objective?: Cp32Objective
}

const ROUTE_LIBRARY: Record<Cp32RouteId, Omit<Cp32SmartRoute, 'confidence'>> = {
  'archvis-render': {
    routeId: 'archvis-render',
    title: {
      en: 'ArchVis / Render',
      pt: 'ArchVis / Render',
    },
    reason: {
      en: 'This looks like a visual sales asset. Apex recommends starting with ArchVis to create a render, humanized plan, facade study or presentation material.',
      pt: 'Isto parece um ativo visual de venda. A Apex recomenda iniciar pelo ArchVis para criar render, planta humanizada, estudo de fachada ou material de apresentacao.',
    },
    recommendedNextAction: {
      en: 'Open ArchVis with this file as the visual source.',
      pt: 'Abrir ArchVis com este arquivo como base visual.',
    },
    suggestedAgents: ['Render Agent', 'ArchVis Agent', 'Presentation Agent'],
  },
  'directcut-video': {
    routeId: 'directcut-video',
    title: {
      en: 'DirectCut / Video / Timelapse',
      pt: 'DirectCut / Video / Timelapse',
    },
    reason: {
      en: 'The request points to video, timelapse, tour or audiovisual storytelling. Apex recommends DirectCut to structure scenes and delivery format.',
      pt: 'A solicitacao aponta para video, timelapse, tour ou narrativa audiovisual. A Apex recomenda DirectCut para estruturar cenas e formato de entrega.',
    },
    recommendedNextAction: {
      en: 'Prepare a DirectCut brief with scenes, duration and target audience.',
      pt: 'Preparar um briefing DirectCut com cenas, duracao e publico alvo.',
    },
    suggestedAgents: ['DirectCut Agent', 'Scene Agent', 'Marketing Agent'],
  },
  'bim-clash': {
    routeId: 'bim-clash',
    title: {
      en: 'BIM / 3D / Clash',
      pt: 'BIM / 3D / Clash',
    },
    reason: {
      en: 'This looks like technical BIM/CAD work. Apex recommends BIM / 3D / Clash for model review, coordination and technical validation.',
      pt: 'Isto parece trabalho tecnico BIM/CAD. A Apex recomenda BIM / 3D / Clash para revisar modelo, compatibilizar e validar tecnicamente.',
    },
    recommendedNextAction: {
      en: 'Send the asset to BIM / 3D and prepare clash or model validation context.',
      pt: 'Enviar o ativo para BIM / 3D e preparar contexto de clash ou validacao do modelo.',
    },
    suggestedAgents: ['BIM Agent', 'Clash Agent', 'Model Review Agent'],
  },
  'quantity-budget': {
    routeId: 'quantity-budget',
    title: {
      en: 'Quantity / Budget',
      pt: 'Quantitativo / Orcamento',
    },
    reason: {
      en: 'The goal is cost, quantity, proposal or budget driven. Apex recommends the Quantity / Budget path to prepare quantities and commercial estimate.',
      pt: 'O objetivo envolve custo, quantitativo, proposta ou orcamento. A Apex recomenda a rota Quantitativo / Orcamento para preparar medidas e estimativa comercial.',
    },
    recommendedNextAction: {
      en: 'Start a budget draft and collect project scope, units and cost assumptions.',
      pt: 'Iniciar um rascunho de orcamento e coletar escopo, unidades e premissas de custo.',
    },
    suggestedAgents: ['Quantity Agent', 'Budget Agent', 'Proposal Agent'],
  },
  'legal-permits': {
    routeId: 'legal-permits',
    title: {
      en: 'Contract / Legal / Permits',
      pt: 'Contrato / Juridico / Permits',
    },
    reason: {
      en: 'This appears to be a contract, permit, compliance or legal-document workflow. Apex recommends routing it to Legal / Permits before execution.',
      pt: 'Isto parece um fluxo de contrato, permit, compliance ou documento juridico. A Apex recomenda encaminhar para Juridico / Permits antes da execucao.',
    },
    recommendedNextAction: {
      en: 'Classify the document type and prepare the legal checklist for the region.',
      pt: 'Classificar o tipo de documento e preparar o checklist juridico da regiao.',
    },
    suggestedAgents: ['Legal Agent', 'Compliance Agent', 'Permit Agent'],
  },
  'marketing-social': {
    routeId: 'marketing-social',
    title: {
      en: 'Marketing / Website / Social',
      pt: 'Marketing / Website / Social',
    },
    reason: {
      en: 'The intent is to sell, promote or publish the project. Apex recommends Marketing / Website / Social, with ArchVis as a strong supporting path when visual assets are needed.',
      pt: 'A intencao e vender, divulgar ou publicar o projeto. A Apex recomenda Marketing / Website / Social, com ArchVis como apoio forte quando forem necessarios ativos visuais.',
    },
    recommendedNextAction: {
      en: 'Prepare campaign, website or social content and decide which visual assets must be generated first.',
      pt: 'Preparar campanha, website ou conteudo social e decidir quais ativos visuais precisam ser gerados primeiro.',
    },
    suggestedAgents: ['Marketing Agent', 'Website Agent', 'Social Agent'],
  },
  'field-operations': {
    routeId: 'field-operations',
    title: {
      en: 'Field Operations / Jobsite',
      pt: 'Operacao de Obra / Campo',
    },
    reason: {
      en: 'The request belongs to jobsite execution, progress, RDO, quality or field coordination. Apex recommends Field Operations.',
      pt: 'A solicitacao pertence a execucao de obra, avanco, RDO, qualidade ou coordenacao de campo. A Apex recomenda Operacao de Obra.',
    },
    recommendedNextAction: {
      en: 'Open field operations context and capture location, crew, progress and evidence.',
      pt: 'Abrir contexto de campo e coletar local, equipe, avanco e evidencias.',
    },
    suggestedAgents: ['Field Agent', 'Progress Agent', 'Quality Agent'],
  },
  'general-unknown': {
    routeId: 'general-unknown',
    title: {
      en: 'General / Unknown',
      pt: 'Geral / Indefinido',
    },
    reason: {
      en: 'Apex received the input, but needs a clearer goal before choosing a specialized path.',
      pt: 'A Apex recebeu a entrada, mas precisa de um objetivo mais claro antes de escolher uma rota especializada.',
    },
    recommendedNextAction: {
      en: 'Ask one clarifying question about the desired outcome.',
      pt: 'Fazer uma pergunta de esclarecimento sobre o resultado desejado.',
    },
    suggestedAgents: ['Apex Router', 'Document Agent', 'Operations Agent'],
  },
}

function extensionFrom(fileName = '') {
  const clean = fileName.toLowerCase().split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function addScore(scores: Record<Cp32RouteId, number>, routeId: Cp32RouteId, amount: number) {
  scores[routeId] += amount
}

function scoreWords(text: string, patterns: Array<[RegExp, Cp32RouteId, number]>, scores: Record<Cp32RouteId, number>) {
  for (const [pattern, routeId, amount] of patterns) {
    if (pattern.test(text)) addScore(scores, routeId, amount)
  }
}

export function runCp32SmartRouting(input: Cp32SmartRoutingInput): Cp32SmartRoute[] {
  const fileName = input.fileName || ''
  const fileType = input.fileType || ''
  const goal = input.goal || ''
  const objective = input.objective || 'generic'
  const ext = extensionFrom(fileName)
  const text = `${fileName} ${fileType} ${goal}`.toLowerCase()
  const scores: Record<Cp32RouteId, number> = {
    'archvis-render': 0,
    'directcut-video': 0,
    'bim-clash': 0,
    'quantity-budget': 0,
    'legal-permits': 0,
    'marketing-social': 0,
    'field-operations': 0,
    'general-unknown': 0,
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext) || fileType.startsWith('image/')) {
    addScore(scores, 'archvis-render', 34)
    addScore(scores, 'marketing-social', 8)
  }
  if (['ifc', 'rvt', 'dwg', 'dxf', 'skp', 'nwd', 'nwc'].includes(ext)) {
    addScore(scores, 'bim-clash', 46)
    addScore(scores, 'quantity-budget', 16)
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || fileType.startsWith('video/')) {
    addScore(scores, 'directcut-video', 42)
    addScore(scores, 'marketing-social', 12)
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) addScore(scores, 'quantity-budget', 32)
  if (ext === 'pdf') {
    addScore(scores, 'legal-permits', 16)
    addScore(scores, 'quantity-budget', 8)
  }
  if (['doc', 'docx'].includes(ext)) addScore(scores, 'legal-permits', 18)
  if (['zip', 'rar', '7z'].includes(ext)) addScore(scores, 'general-unknown', 12)

  if (objective === 'visual') addScore(scores, 'archvis-render', 36)
  if (objective === 'bim') addScore(scores, 'bim-clash', 38)
  if (objective === 'finance') addScore(scores, 'quantity-budget', 36)
  if (objective === 'legal') addScore(scores, 'legal-permits', 36)
  if (objective === 'marketing') addScore(scores, 'marketing-social', 36)
  if (objective === 'field') addScore(scores, 'field-operations', 36)

  scoreWords(text, [
    [/(render|realistic|realista|fachada|facade|interior|humanizada|sales asset|visual sales|vend[aá]vel|presentation material|apresentacao visual|planta)/i, 'archvis-render', 40],
    [/(sell|sale|vender|venda|promote|divulgar|campaign|campanha|website|site|social|instagram|portfolio|portf[oó]lio|landing page|brand)/i, 'marketing-social', 36],
    [/(video|v[ií]deo|timelapse|time lapse|tour|reels|shorts|audiovisual|construction sequence|sequencia)/i, 'directcut-video', 42],
    [/(ifc|rvt|revit|bim|clash|interference|interfer[eê]ncia|coordination|compatibiliza|modelo|3d|cad|dwg|dxf)/i, 'bim-clash', 42],
    [/(budget|or[cç]amento|estimate|estimativa|quantity|quantitativo|invoice|nota fiscal|cost|custo|proposal|proposta|spreadsheet|planilha)/i, 'quantity-budget', 40],
    [/(contract|contrato|legal|jur[ií]dico|permit|permits|compliance|assinatura|signature|memorial|regulat[oó]rio|documentos? legais?)/i, 'legal-permits', 42],
    [/(jobsite|obra|campo|field|rdo|di[aá]rio|progress|avan[cç]o|crew|equipe|quality|qualidade|nci|medi[cç][aã]o|material)/i, 'field-operations', 38],
  ], scores)

  if (/(sell|vender|venda|promote|divulgar)/i.test(text) && /(project|projeto|house|casa|building|obra)/i.test(text)) {
    addScore(scores, 'marketing-social', 30)
    addScore(scores, 'archvis-render', 24)
  }

  const ranked = (Object.keys(scores) as Cp32RouteId[])
    .filter(routeId => routeId !== 'general-unknown')
    .sort((a, b) => scores[b] - scores[a])
    .filter(routeId => scores[routeId] > 0)

  const selected = ranked.length > 0 ? ranked.slice(0, 3) : ['general-unknown' as Cp32RouteId]
  const topScore = Math.max(...selected.map(routeId => scores[routeId]), 1)

  return selected.map((routeId, index) => ({
    ...ROUTE_LIBRARY[routeId],
    confidence: Math.max(42, Math.min(96, Math.round((scores[routeId] / topScore) * 88) - index * 4)),
  }))
}
