import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'
import SafeEntryHome from '../components/SafeEntryHome'

const DashboardByRole = dynamic(
  () => import('../components/DashboardByRole'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh', background: '#0a0d12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          color: '#f0a500', fontFamily: 'monospace',
          fontSize: '14px', letterSpacing: '2px',
        }}>
          CARREGANDO...
        </span>
      </div>
    ),
  }
)

// ✅ OWNER/ADMIN: Only diretor_executivo sees global DashboardByRole
const AUTHORIZED_OWNER_ROLES = new Set(['diretor_executivo'])

// ✅ STAFF: Operational roles see SafeEntryHome (no global metrics/projects)
const AUTHORIZED_STAFF_ROLES = new Set([
  'gestor_financeiro',
  'coordenador_projetos',
  'engenheiro_campo',
  'gestor_qualidade',
  'investidor',
])

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string | null
  company: string | null
  avatar_url: string | null
  is_active: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    async function init() {
      const sb = getSupabase()

      if (!sb) {
        router.replace('/login')
        return
      }

      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: prof, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !prof) {
        // ✅ CORRIGIDO: Novo usuário NÃO recebe role automático
        setProfile({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? null,
          role: null,  // ← Null, não 'engenheiro_campo'
          company: null,
          avatar_url: null,
          is_active: false,  // Novo usuário não é "ativo" até aprovação
        })
      } else {
        setProfile(prof as Profile)
      }

      setLoading(false)
    }

    init()
  }, [router])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a0d12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        color: '#f0a500', fontFamily: 'monospace',
        fontSize: '14px', letterSpacing: '2px',
      }}>
        CARREGANDO...
      </span>
    </div>
  )

  if (!profile) return null

  // ✅ CONTROLE DE ACESSO:
  // Only diretor_executivo sees the global DashboardByRole with all metrics/projects
  console.log(`[DASHBOARD GATE] Email: ${profile.email}, Role: ${profile.role}, Decision: ${profile.role && AUTHORIZED_OWNER_ROLES.has(profile.role) ? 'DASHBOARD' : 'SAFEENTRY'}`)

  if (profile.role && AUTHORIZED_OWNER_ROLES.has(profile.role)) {
    return <DashboardByRole profile={profile!} />
  }

  // Everyone else (staff, clients, unknown roles) sees SafeEntryHome
  // Staff roles see it without global metrics/projects
  return <SafeEntryHome email={profile.email} fullName={profile.full_name} />
}
