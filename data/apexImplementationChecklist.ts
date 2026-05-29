export type ChecklistStatus = 'done' | 'in_progress' | 'pending'

export type ChecklistItem = {
  id: string
  label: string
  status: ChecklistStatus
  percent: number
}

export type ChecklistSection = {
  id: string
  title: string
  percent: number
  items: ChecklistItem[]
}

export const apexImplementationChecklist: ChecklistSection[] = [
  {
    id: 'auditoria',
    title: 'A. Auditoria da plataforma',
    percent: 70,
    items: [
      { id: 'github', label: 'GitHub localizado e auditado', status: 'done', percent: 100 },
      { id: 'vercel', label: 'Vercel localizado e producao identificada', status: 'done', percent: 100 },
      { id: 'supabase', label: 'Supabase localizado com 48 tabelas', status: 'done', percent: 100 },
      { id: 'core', label: 'CORE_SYSTEM v5.3 localizado', status: 'done', percent: 100 },
      { id: 'rotas', label: 'Rotas e telas completas mapeadas', status: 'in_progress', percent: 35 },
    ],
  },
  {
    id: 'fluxo-unico',
    title: 'B. Fluxo unico de entrada',
    percent: 15,
    items: [
      { id: 'nova-analise-page', label: 'Pagina Nova Analise criada', status: 'in_progress', percent: 60 },
      { id: 'upload-unico', label: 'Upload unico imagem/documento/BIM', status: 'in_progress', percent: 35 },
      { id: 'cliente-projeto-auto', label: 'Cliente + projeto automatico', status: 'pending', percent: 0 },
      { id: 'classificacao', label: 'Classificacao automatica de arquivo/servico/jurisdicao', status: 'pending', percent: 0 },
      { id: 'redirecionamento', label: 'Redirecionamento para modulo existente', status: 'pending', percent: 0 },
    ],
  },
  {
    id: 'cliente-projeto',
    title: 'C. Cliente -> projeto automatico',
    percent: 20,
    items: [
      { id: 'clients-table', label: 'Tabela clients existe', status: 'done', percent: 100 },
      { id: 'projects-table', label: 'Tabela projects existe', status: 'done', percent: 100 },
      { id: 'relation', label: 'Relacao cliente/projeto existe', status: 'done', percent: 100 },
      { id: 'auto-create', label: 'Upload gera projeto automaticamente', status: 'pending', percent: 0 },
    ],
  },
  {
    id: 'apex-copilot',
    title: 'N. Apex AI Copilot / Mission Control',
    percent: 15,
    items: [
      { id: 'component', label: 'Componente ApexCopilot criado', status: 'in_progress', percent: 70 },
      { id: 'floating', label: 'Botao flutuante global', status: 'in_progress', percent: 60 },
      { id: 'checklist', label: 'Checklist visivel no copilot', status: 'in_progress', percent: 70 },
      { id: 'context', label: 'Contexto do projeto atual', status: 'pending', percent: 0 },
      { id: 'live-integrations', label: 'Integracao viva com GitHub/Supabase/Vercel', status: 'pending', percent: 0 },
    ],
  },
  {
    id: 'growth',
    title: 'O. Growth & Revenue',
    percent: 10,
    items: [
      { id: 'crm-saas', label: 'CRM de venda da plataforma', status: 'pending', percent: 0 },
      { id: 'site', label: 'Site comercial da EA Construction Platform', status: 'pending', percent: 0 },
      { id: 'seo', label: 'SEO e conteudo', status: 'pending', percent: 0 },
      { id: 'ads', label: 'Google Ads / Meta Ads', status: 'pending', percent: 0 },
    ],
  },
]

export function getOverallProgress() {
  if (!apexImplementationChecklist.length) return 0
  const total = apexImplementationChecklist.reduce((sum, section) => sum + section.percent, 0)
  return Math.round(total / apexImplementationChecklist.length)
}
