export type ArchvisA1Template = {
  title: string
  client: string
  project: string
  heroImageLabel: string
  secondaryImageLabels: string[]
  concept: string
  materials: string
  observations: string
  apexSignature: string
}

export function createDefaultA1Template(params: { client?: string; project?: string }): ArchvisA1Template {
  return {
    title: 'Prancha A1 — Visualizacao Arquitetonica IA',
    client: params.client || 'Cliente Apex',
    project: params.project || 'Projeto',
    heroImageLabel: 'Imagem principal (Render Final)',
    secondaryImageLabels: [
      'Imagem secundaria 01',
      'Imagem secundaria 02',
      'Imagem secundaria 03',
    ],
    concept: 'Conceito arquitetonico aprovado com direcao comercial premium.',
    materials: 'Concreto aparente, vidro, madeira tecnologica, paisagismo frontal.',
    observations: 'Validar versao final para exportacao PDF A1 e apresentacao comercial.',
    apexSignature: 'Apex Global — AI Construction Intelligence Platform',
  }
}

export const ARCHVIS_COMMERCIAL_PACKAGES = [
  {
    code: 'ARCHVIS-001',
    name: 'Fachada IA Premium',
    description: 'Conceito visual premium com preview + refinamento orientado por direcao criativa.',
  },
  {
    code: 'ARCHVIS-002',
    name: 'Render + Prancha A1',
    description: 'Render final de alto impacto com composicao em prancha A1 para apresentacao.',
  },
  {
    code: 'ARCHVIS-003',
    name: 'Apresentacao Imobiliaria',
    description: 'Pacote visual comercial para venda, captacao e comunicacao executiva.',
  },
]
