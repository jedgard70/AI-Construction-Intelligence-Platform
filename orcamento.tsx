import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

const OrcamentoClient = dynamic(() => import('../components/OrcamentoClient'), { ssr: false })

export default function Orcamento() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const sb = getSupabase()
      if (!sb) {
        setProfile({ id:'demo', email:'demo@constructai.com.br', full_name:'Usuário Demo', role:'gestor_financeiro', company:'ConstructAI Demo', avatar_url:null, is_active:true })
        setLoading(false)
        return
      }
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof || { id: session.user.id, email: session.user.email, full_name: null, role: 'gestor_financeiro', company: null, avatar_url: null, is_active: true })
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:'14px', letterSpacing:'2px' }}>CARREGANDO...</span>
    </div>
  )

  return <OrcamentoClient profile={profile} />
}
