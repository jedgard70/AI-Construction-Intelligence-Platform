// ─── Roles definidos no CORE_SYSTEM v5.3 ─────────────────────────────────────
export type UserRole =
  | 'engenheiro_campo'
  | 'coordenador_projetos'
  | 'gestor_financeiro'
  | 'gestor_segurança'
  | 'gestor_qualidade'
  | 'gestor_sustentabilidade'
  | 'diretor_executivo'
  | 'investidor'
  | 'projetista_externo'
  | 'fiscal_contrato'
  | 'tecnico_segurança'
  | 'subempreiteiro'

export interface RoleConfig {
  id: UserRole
  label: string
  description: string
  icon: string
  permissions: string[]
  preferred_format: 'operational_responses' | 'technical_responses' | 'executive_responses' | 'investment_responses' | 'quality_responses'
}

export const ROLES: RoleConfig[] = [
  {
    id: 'engenheiro_campo',
    label: 'Eng. de Campo',
    description: 'Registro de ocorrências e RDO',
    icon: '🦺',
    permissions: ['leitura_bim', 'registro_ocorrências', 'aprovação_rdo'],
    preferred_format: 'operational_responses',
  },
  {
    id: 'coordenador_projetos',
    label: 'Coordenador',
    description: 'Cronograma, compras e relatórios',
    icon: '📅',
    permissions: ['leitura_bim', 'edição_cronograma', 'aprovação_compras', 'geração_relatorios'],
    preferred_format: 'technical_responses',
  },
  {
    id: 'gestor_financeiro',
    label: 'Gest. Financeiro',
    description: 'Orçamento, contratos e pagamentos',
    icon: '💲',
    permissions: ['leitura_orçamento', 'aprovação_pagamentos', 'controle_contratos'],
    preferred_format: 'executive_responses',
  },
  {
    id: 'gestor_segurança',
    label: 'Gest. Segurança',
    description: 'NRs, EPIs e planos de emergência',
    icon: '🔒',
    permissions: ['leitura_ocorrências', 'aprovação_plano_emergência', 'acesso_nr'],
    preferred_format: 'operational_responses',
  },
  {
    id: 'gestor_qualidade',
    label: 'Gest. Qualidade',
    description: 'NBR 15575, não conformidades',
    icon: '🔍',
    permissions: ['leitura_não_conformidades', 'aprovação_plano_qualidade', 'geração_relatorio_qualidade'],
    preferred_format: 'quality_responses',
  },
  {
    id: 'diretor_executivo',
    label: 'Diretor / C-Level',
    description: 'Acesso total e decisões estratégicas',
    icon: '👑',
    permissions: ['acesso_total', 'aprovação_estratégica', 'override_decisions'],
    preferred_format: 'executive_responses',
  },
  {
    id: 'investidor',
    label: 'Investidor',
    description: 'Dashboard de ROI e relatórios financeiros',
    icon: '📈',
    permissions: ['leitura_investment_dashboard', 'leitura_relatorio_roi'],
    preferred_format: 'investment_responses',
  },
  {
    id: 'fiscal_contrato',
    label: 'Fiscal de Contrato',
    description: 'Leitura de KPIs e aprovação de medições',
    icon: '📋',
    permissions: ['leitura_dashboards', 'leitura_kpis', 'aprovação_medicoes'],
    preferred_format: 'technical_responses',
  },
]

// ─── Database types (Supabase) ────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          company: string | null
          avatar_url: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
  }
}

// ─── Auth state ───────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  profile: Database['public']['Tables']['profiles']['Row'] | null
}
