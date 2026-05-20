import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

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

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
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

      // Modo demo — sem Supabase configurado
      if (!sb) {
        setProfile({
          id: 'demo',
          email: 'demo@constructai.com.br',
          full_name: 'Usuário Demo',
          role: 'diretor_executivo',
          company: 'ConstructAI Demo',
          avatar_url: null,
          is_active: true,
        })
        setLoading(false)
        return
      }

      try {
        // Verifica sessão ativa — sem sessão, entra em modo demo
        const { data: { session } } = await sb.auth.getSession()
        if (!session) {
          setProfile({
            id: 'demo',
            email: 'demo@constructai.com.br',
            full_name: 'Usuário Demo',
            role: 'diretor_executivo',
            company: 'ConstructAI Demo',
            avatar_url: null,
            is_active: true,
          })
          setLoading(false)
          return
        }

        // Busca perfil com role
        const { data: prof, error } = await sb
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !prof) {
          // Perfil ainda não criado (novo usuário) — usa dados do auth
          setProfile({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata?.full_name ?? null,
            role: 'engenheiro_campo',
            company: null,
            avatar_url: null,
            is_active: true,
          })
        } else {
          setProfile(prof as Profile)
        }
      } catch {
        // Erro de rede ou configuração — modo demo
        setProfile({
          id: 'demo',
          email: 'demo@constructai.com.br',
          full_name: 'Usuário Demo',
          role: 'diretor_executivo',
          company: 'ConstructAI Demo',
          avatar_url: null,
          is_active: true,
        })
      } finally {
        setLoading(false)
      }
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

  return <DashboardByRole profile={profile!} />
}
