export type ArchvisStylePreset =
  | 'fachada_moderna'
  | 'minimalista_sofisticada'
  | 'brutalista_moderna'
  | 'luxo'
  | 'noturna'
  | 'paisagismo_frontal'

export type ArchvisFlowStatus =
  | 'referencia_recebida'
  | 'preview_gerado'
  | 'refinamento_em_andamento'
  | 'aprovado'
  | 'prancha_a1_pronta'

export type ArchvisBriefInput = {
  stylePreset: ArchvisStylePreset
  objective: string
  propertyStandard: string
  lighting: string
  landscaping: string
  materials: string
  observations?: string
}

const STYLE_GUIDE: Record<ArchvisStylePreset, string> = {
  fachada_moderna: 'fachada contemporanea limpa, volumes equilibrados, linhas horizontais elegantes',
  minimalista_sofisticada: 'minimalismo sofisticado com paleta neutra, geometria precisa e acabamentos premium',
  brutalista_moderna: 'brutalismo moderno com concreto aparente refinado, composicao robusta e iluminacao dramatica',
  luxo: 'arquitetura de alto padrao com materiais nobres, composicao imponente e detalhamento premium',
  noturna: 'cena noturna cinematografica com iluminacao cenica, contraste controlado e atmosfera elegante',
  paisagismo_frontal: 'paisagismo frontal valorizando acesso principal, especies ornamentais e composicao harmonica',
}

export function buildArchvisPrompt(input: ArchvisBriefInput): string {
  const lines = [
    'Gerar visualizacao arquitetonica de alta qualidade com foco comercial.',
    `Direcao criativa: ${STYLE_GUIDE[input.stylePreset]}.`,
    `Objetivo: ${input.objective}.`,
    `Padrao do imovel: ${input.propertyStandard}.`,
    `Iluminacao: ${input.lighting}.`,
    `Paisagismo: ${input.landscaping}.`,
    `Materiais predominantes: ${input.materials}.`,
    'Priorizar composicao frontal, proporcao realista, leitura de materiais e acabamento premium.',
    'Evitar artefatos, distorcoes de perspectiva e excesso de elementos.',
  ]
  if (input.observations?.trim()) {
    lines.push(`Observacoes adicionais: ${input.observations.trim()}.`)
  }
  return lines.join('\n')
}
