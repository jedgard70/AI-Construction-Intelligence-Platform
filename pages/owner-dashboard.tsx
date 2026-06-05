import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'
import type { Profile } from './dashboard'

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
          CARREGANDO DASHBOARD...
        </span>
      </div>
    ),
  }
)

function ownerEmails() {
  return (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  return Boolean(
    profile.is_owner === true ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'diretor_executivo' ||
    ownerEmails().includes(String(profile.email || '').toLowerCase())
  )
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const sb = getSupabase()

      if (!sb) {
        router.replace('/login?redirect=%2Fowner-dashboard')
        return
      }

      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        router.replace('/login?redirect=%2Fowner-dashboard')
        return
      }

      const { data: prof, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const resolvedProfile: Profile = error || !prof
        ? {
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? null,
          role: 'engenheiro_campo',
          company: null,
          avatar_url: null,
          is_active: true,
        }
        : prof as Profile

      if (!isOwnerProfile(resolvedProfile)) {
        router.replace('/dashboard')
        return
      }

      setProfile(resolvedProfile)
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
        CARREGANDO DASHBOARD...
      </span>
    </div>
  )

  return <DashboardByRole profile={profile!} />
}
