import { buildArchvisPrompt, type ArchvisBriefInput, type ArchvisStylePreset } from './guided-flow'

export type ArchvisPromptCategory =
  | 'fachadas_conceituais_premium'
  | 'renderizacao_rapida'
  | 'refinamento_visual'
  | 'iluminacao_noturna'
  | 'paisagismo'
  | 'brutalista_moderna'
  | 'minimalista_sofisticada'
  | 'imagens_ultra_realistas'
  | 'videos_cinematograficos'
  | 'prancha_a1'

export type ArchvisPromptTemplate = {
  id: string
  title: string
  category: ArchvisPromptCategory
  stylePreset: ArchvisStylePreset
  objectiveHint: string
  template: string
}

export const ARCHVIS_PROMPTS: ArchvisPromptTemplate[] = [
  {
    id: 'archvis-premium-facade-01',
    title: 'Fachada Conceitual Premium',
    category: 'fachadas_conceituais_premium',
    stylePreset: 'luxo',
    objectiveHint: 'Valorizar fachada para venda de alto padrao',
    template: 'Gerar fachada conceitual premium com foco em percepcao de valor, acabamento nobre e composicao elegante.',
  },
  {
    id: 'archvis-fast-render-01',
    title: 'Renderizacao Rapida de Estudo',
    category: 'renderizacao_rapida',
    stylePreset: 'fachada_moderna',
    objectiveHint: 'Validacao rapida de conceito',
    template: 'Gerar estudo visual rapido e limpo para validacao inicial de fachada e volumetria.',
  },
  {
    id: 'archvis-refinement-01',
    title: 'Refinamento Visual Iterativo',
    category: 'refinamento_visual',
    stylePreset: 'minimalista_sofisticada',
    objectiveHint: 'Ajuste fino apos feedback',
    template: 'Refinar proposta mantendo conceito aprovado, elevando realismo, materiais e leitura de iluminacao.',
  },
  {
    id: 'archvis-night-01',
    title: 'Iluminacao Noturna Cinematica',
    category: 'iluminacao_noturna',
    stylePreset: 'noturna',
    objectiveHint: 'Destacar cena noturna para apresentacao',
    template: 'Criar cena noturna cinematografica com iluminacao arquitetonica e atmosfera premium.',
  },
  {
    id: 'archvis-landscaping-01',
    title: 'Paisagismo Frontal Comercial',
    category: 'paisagismo',
    stylePreset: 'paisagismo_frontal',
    objectiveHint: 'Valorizar fachada com paisagismo de entrada',
    template: 'Compor paisagismo frontal com especies ornamentais, escala correta e impacto visual comercial.',
  },
  {
    id: 'archvis-brutalist-01',
    title: 'Brutalista Moderna',
    category: 'brutalista_moderna',
    stylePreset: 'brutalista_moderna',
    objectiveHint: 'Linguagem brutalista contemporanea',
    template: 'Explorar brutalismo moderno com concreto aparente refinado, texturas e contraste controlado.',
  },
  {
    id: 'archvis-minimal-01',
    title: 'Minimalista Sofisticada',
    category: 'minimalista_sofisticada',
    stylePreset: 'minimalista_sofisticada',
    objectiveHint: 'Estetica minimalista de alto padrao',
    template: 'Produzir fachada minimalista sofisticada com linhas limpas, paleta neutra e materiais premium.',
  },
  {
    id: 'archvis-ultrareal-01',
    title: 'Imagem Ultra Realista',
    category: 'imagens_ultra_realistas',
    stylePreset: 'luxo',
    objectiveHint: 'Resultado fotorealista para marketing',
    template: 'Gerar imagem ultra realista com textura fisica fiel, reflexos naturais e acabamento de campanha.',
  },
  {
    id: 'archvis-cinematic-video-01',
    title: 'Video Cinematografico (Brief)',
    category: 'videos_cinematograficos',
    stylePreset: 'luxo',
    objectiveHint: 'Brief de direcao para animacao comercial',
    template: 'Definir direcao cinematografica para video de fachada com movimentos de camera e foco em narrativa visual.',
  },
  {
    id: 'archvis-a1-board-01',
    title: 'Prancha A1 Comercial',
    category: 'prancha_a1',
    stylePreset: 'fachada_moderna',
    objectiveHint: 'Montagem executiva para apresentacao',
    template: 'Estruturar prancha A1 com hero image, secundarios, conceito, materiais e assinatura Apex.',
  },
]

export function createArchvisBrief(input: ArchvisBriefInput) {
  return {
    prompt: buildArchvisPrompt(input),
    generated_at: new Date().toISOString(),
    style_preset: input.stylePreset,
  }
}
