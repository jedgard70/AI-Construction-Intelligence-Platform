import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

let _sb = null

export default function LoginClient() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (supabaseUrl && supabaseAnonKey) {
          try {
            if (!_sb) _sb = createClient(supabaseUrl, supabaseAnonKey)
            _sb.auth.getSession().then(({ data }) => {
              if (data?.session) router.replace('/dashboard.html')
              else setReady(true)
            }).catch(() => setReady(true))
          } catch {
            setReady(true)
          }
        } else {
          setDemoMode(true)
          setReady(true)
        }
      })
      .catch(() => { setDemoMode(true); setReady(true) })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (demoMode || !_sb) { router.replace('/dashboard.html'); return }
    setLoading(true)
    setError('')
    const { error: err } = await _sb.auth.signInWithPassword({ email, password })
    if (err) { setError(xlate(err.message)); setLoading(false) }
    else router.replace('/dashboard.html')
  }

  function xlate(m) {
    if (m.includes('Invalid login')) return 'E-mail ou senha incorretos.'
    if (m.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
    if (m.includes('Too many')) return 'Muitas tentativas. Aguarde alguns minutos.'
    return 'Erro ao entrar. Tente novamente.'
  }

  /* ── styles ── */
  const s = {
    page: { minHeight:'100vh', display:'flex', background:'#0a0d12', fontFamily:"'Sora',sans-serif" },
    left: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'64px', background:'linear-gradient(160deg,#0a0d12 0%,#111520 60%,#0f1a2e 100%)', borderRight:'1px solid #1e2535' },
    right: { width:'480px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px' },
    logoBox: { width:'44px', height:'44px', background:'#f0a500', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' },
    featureBox: { width:'38px', height:'38px', background:'rgba(240,165,0,.1)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 },
    input: { width:'100%', background:'#111520', border:'1px solid #1e2535', borderRadius:'8px', padding:'13px 14px', color:'#e8ecf5', fontSize:'14px', fontFamily:'inherit' },
    inputPwd: { width:'100%', background:'#111520', border:'1px solid #1e2535', borderRadius:'8px', padding:'13px 46px 13px 14px', color:'#e8ecf5', fontSize:'14px', fontFamily:'inherit' },
    label: { display:'block', color:'#9ca3c4', fontSize:'11px', fontWeight:700, marginBottom:'7px', letterSpacing:'.08em', textTransform:'uppercase' },
    btnSubmit: { width:'100%', background:'#f0a500', color:'#0a0d12', border:'none', borderRadius:'8px', padding:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  }

  if (!ready) return (
    <div style={{ ...s.page, alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:'14px', letterSpacing:'2px' }}>CARREGANDO...</span>
    </div>
  )

  const features = [
    { icon:'🏢', label:'BIM Intelligence', desc:'Clash detection · 3D/4D/5D/6D/7D' },
    { icon:'📊', label:'EVM Analytics', desc:'CPI, SPI, EAC, VAC, TCPI em tempo real' },
    { icon:'🛡', label:'Conformidade NR', desc:'NR-6, NR-10, NR-18, NR-33, NR-35' },
    { icon:'🤖', label:'Multi-Agent AI', desc:'8 especialistas cognitivos simultâneos' },
  ]

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#0a0d12}input:focus{outline:none;border-color:#f0a500!important;box-shadow:0 0 0 3px rgba(240,165,0,.12)}@media(max-width:768px){.lp-left{display:none!important}.lp-right{width:100%!important}}`}</style>
      <div style={s.page}>

        {/* LEFT */}
        <div className="lp-left" style={s.left}>
          <div style={{ maxWidth:'460px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'52px' }}>
              <div style={s.logoBox}>🏗</div>
              <div>
                <div style={{ color:'#e8ecf5', fontSize:'15px', fontWeight:600 }}>Construction Intelligence Platform</div>
                <div style={{ color:'#f0a500', fontSize:'10px', fontWeight:600, letterSpacing:'2px', fontFamily:'monospace' }}>v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE</div>
              </div>
            </div>
            <h1 style={{ color:'#e8ecf5', fontSize:'36px', fontWeight:700, lineHeight:1.2, marginBottom:'16px' }}>IA Especializada em<br/>Construção Civil</h1>
            <p style={{ color:'#6b7a99', fontSize:'15px', lineHeight:1.75, marginBottom:'48px' }}>8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real.</p>
            {features.map(f => (
              <div key={f.label} style={{ display:'flex', gap:'16px', alignItems:'flex-start', marginBottom:'24px' }}>
                <div style={s.featureBox}>{f.icon}</div>
                <div style={{ paddingTop:'3px' }}>
                  <div style={{ color:'#e8ecf5', fontSize:'14px', fontWeight:600, marginBottom:'3px' }}>{f.label}</div>
                  <div style={{ color:'#6b7a99', fontSize:'13px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lp-right" style={s.right}>
          <div style={{ width:'100%', maxWidth:'380px' }}>
            <h2 style={{ color:'#e8ecf5', fontSize:'26px', fontWeight:700, marginBottom:'8px' }}>Entrar na plataforma</h2>
            <p style={{ color:'#6b7a99', fontSize:'14px', marginBottom:'32px' }}>
              {demoMode ? '⚡ Modo demo — clique em Entrar para acessar.' : 'Use suas credenciais corporativas.'}
            </p>

            {error && (
              <div style={{ background:'rgba(127,29,29,.3)', border:'1px solid #7f1d1d', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', color:'#fca5a5', fontSize:'13px' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'18px' }}>
                <label style={s.label}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required={!demoMode} disabled={demoMode} style={s.input} />
              </div>
              <div style={{ marginBottom:'26px' }}>
                <label style={s.label}>Senha</label>
                <div style={{ position:'relative' }}>
                  <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder={demoMode?'——————':'Sua senha'} required={!demoMode} disabled={demoMode} style={s.inputPwd} />
                  {!demoMode && (
                    <button type="button" onClick={()=>setShowPwd(!showPwd)}
                      style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7a99', fontSize:'18px', lineHeight:1, padding:'4px' }}>
                      {showPwd?'🙈':'👁'}
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ ...s.btnSubmit, opacity:loading?.7:1 }}>
                {loading ? 'Verificando...' : 'Entrar →'}
              </button>
            </form>

            <div style={{ marginTop:'24px', padding:'14px 16px', background:'#111520', borderRadius:'8px', border:'1px solid #1e2535', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'16px' }}>🔒</span>
              <span style={{ color:'#6b7a99', fontSize:'12px' }}>Sessão criptografada · LGPD compliant</span>
            </div>

            {demoMode && (
              <div style={{ marginTop:'14px', padding:'12px 16px', background:'rgba(240,165,0,.07)', borderRadius:'8px', border:'1px solid rgba(240,165,0,.2)' }}>
                <div style={{ color:'#f0a500', fontSize:'12px', fontWeight:600, marginBottom:'4px' }}>⚡ Modo Demonstração</div>
                <div style={{ color:'#9ca3c4', fontSize:'12px' }}>Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no Vercel para ativar autenticação real.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
