// ─── Roles definidos no CORE_SYSTEM.json ──────────────────────────────────────
export type UserRole =
  | 'engenheiro_campo'
  | 'coordenador_projetos'
  | 'gestor_financeiro'
  | 'diretor_executivo'

export interface RoleConfig {
  id: UserRole
  label: string
  description: string
  icon: string
  permissions: string[]
  preferred_format: 'operational_responses' | 'technical_responses' | 'executive_responses'
}

export const ROLES: RoleConfig[] = [
  {
    id: 'engenheiro_campo',
    label: 'Eng. de Campo',
    description: 'Registro de ocorrências e RDO',
    icon: 'ti-hard-hat',
    permissions: ['leitura_bim', 'registro_ocorrências', 'aprovação_rdo'],
    preferred_format: 'operational_responses',
  },
  {
    id: 'coordenador_projetos',
    label: 'Coordenador',
    description: 'Cronograma, compras e relatórios',
    icon: 'ti-calendar-stats',
    permissions: ['leitura_bim', 'edição_cronograma', 'aprovação_compras', 'geração_relatorios'],
    preferred_format: 'technical_responses',
  },
  {
    id: 'gestor_financeiro',
    label: 'Gest. Financeiro',
    description: 'Orçamento, contratos e pagamentos',
    icon: 'ti-coin',
    permissions: ['leitura_orçamento', 'aprovação_pagamentos', 'controle_contratos'],
    preferred_format: 'executive_responses',
  },
  {
    id: 'diretor_executivo',
    label: 'Diretor / C-Level',
    description: 'Acesso total e decisões estratégicas',
    icon: 'ti-crown',
    permissions: ['acesso_total', 'aprovação_estratégica', 'override_decisions'],
    preferred_format: 'executive_responses',
  },
]

// ─── Database types (gerado pelo Supabase CLI ou manual) ──────────────────────
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
