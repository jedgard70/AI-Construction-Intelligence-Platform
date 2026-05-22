import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

const DashboardByRole = dynamic(
  () => import('../components/DashboardByRole'),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
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

const ROLES = [
  { v: 'diretor_executivo',    l: 'Diretor Executivo' },
  { v: 'gestor_financeiro',    l: 'Gestor Financeiro' },
  { v: 'coordenador_projetos', l: 'Coordenador de Projetos' },
  { v: 'engenheiro_campo',     l: 'Engenheiro de Campo' },
  { v: 'gestor_qualidade',     l: 'Gestor de Qualidade' },
  { v: 'investidor',           l: 'Investidor / Sócio' },
]

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#f0a500', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '2px' }}>
        CARREGANDO...
      </span>
    </div>
  )
}

function ProfileSetup({ onCreated }: { onCreated: (p: Profile) => void }) {
  const [nome, setNome]       = useState('')
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState(ROLES[0].v)
  const [empresa, setEmpresa] = useState('')
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    const profile: Profile = {
      id: crypto.randomUUID(),
      email: email.trim() || `${nome.toLowerCase().replace(/\s+/g, '.')}@local`,
      full_name: nome.trim(),
      role,
      company: empresa.trim() || null,
      avatar_url: null,
      is_active: true,
    }
    localStorage.setItem('atlas_profile', JSON.stringify(profile))
    onCreated(profile)
  }

  const s = {
    input: {
      width: '100%', padding: '10px 12px', borderRadius: 8,
      border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1a1a2e',
      outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14,
      fontFamily: 'inherit',
    },
    select: {
      width: '100%', padding: '10px 12px', borderRadius: 8,
      border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1a1a2e',
      background: '#fff', marginBottom: 14, boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
    },
    label: { fontSize: 12, fontWeight: 600 as const, color: '#4a5568', marginBottom: 4, display: 'block' as const },
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0a0d12 0%, #0f1a2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: '#185FA5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏗</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1f36' }}>Bem-vindo ao ConstructAI</div>
            <div style={{ fontSize: 12, color: '#8b93a7' }}>Configure seu perfil para começar</div>
          </div>
        </div>

        <label style={s.label}>Seu nome *</label>
        <input style={s.input} placeholder="Ex: Carlos Mendes" value={nome} onChange={e => setNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />

        <label style={s.label}>E-mail (opcional)</label>
        <input style={s.input} type="email" placeholder="carlos@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />

        <label style={s.label}>Seu cargo / função</label>
        <select style={s.select} value={role} onChange={e => setRole(e.target.value)}>
          {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
        </select>

        <label style={s.label}>Empresa (opcional)</label>
        <input style={s.input} placeholder="Ex: Mendes Incorporações Ltda" value={empresa} onChange={e => setEmpresa(e.target.value)} />

        {error && (
          <div style={{ fontSize: 12, color: '#e53e3e', background: '#FFF5F5', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '13px', background: '#185FA5', color: '#fff', border: 'none',
          borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {saving ? 'Salvando...' : '→ Entrar no Dashboard'}
        </button>

        <div style={{ marginTop: 14, fontSize: 11, color: '#b0b8c8', textAlign: 'center', lineHeight: 1.5 }}>
          Seus dados ficam salvos localmente no navegador.<br />
          Você pode alterar seu perfil a qualquer momento no dashboard.
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showSetup, setShowSetup]     = useState(false)

  useEffect(() => {
    async function init() {
      // 1. Perfil salvo localmente tem prioridade
      try {
        const saved = localStorage.getItem('atlas_profile')
        if (saved) {
          setProfile(JSON.parse(saved))
          setLoading(false)
          return
        }
      } catch {}

      const sb = getSupabase()

      // 2. Sem Supabase → pede configuração de perfil
      if (!sb) {
        setShowSetup(true)
        setLoading(false)
        return
      }

      // 3. Verifica sessão Supabase
      try {
        const { data: { session } } = await sb.auth.getSession()
        if (!session) {
          setShowSetup(true)
          setLoading(false)
          return
        }

        // 4. Busca perfil no banco
        const { data: prof, error } = await sb
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !prof) {
          const p: Profile = {
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata?.full_name ?? null,
            role: 'engenheiro_campo',
            company: null,
            avatar_url: null,
            is_active: true,
          }
          localStorage.setItem('atlas_profile', JSON.stringify(p))
          setProfile(p)
        } else {
          localStorage.setItem('atlas_profile', JSON.stringify(prof))
          setProfile(prof as Profile)
        }
      } catch {
        setShowSetup(true)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  function handleProfileCreated(p: Profile) {
    setProfile(p)
    setShowSetup(false)
  }

  if (loading) return <LoadingScreen />
  if (showSetup) return <ProfileSetup onCreated={handleProfileCreated} />
  return <DashboardByRole profile={profile!} />
}
