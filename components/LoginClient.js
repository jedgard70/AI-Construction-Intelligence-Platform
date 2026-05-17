import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

let _sb = null

const s = {
  page:      { minHeight:'100vh', display:'flex', background:'#0a0d12', fontFamily:"'Sora',sans-serif" },
  left:      { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'64px', background:'linear-gradient(160deg,#0a0d12 0%,#111520 60%,#0f1a2e 100%)', borderRight:'1px solid #1e2535' },
  right:     { width:'480px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px' },
  logoBox:   { width:'44px', height:'44px', background:'#f0a500', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' },
  featBox:   { width:'38px', height:'38px', background:'rgba(240,165,0,.1)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 },
  input:     { width:'100%', background:'#111520', border:'1px solid #1e2535', borderRadius:'8px', padding:'13px 14px', color:'#e8ecf5', fontSize:'14px', fontFamily:'inherit', transition:'border-color .2s' },
  inputPwd:  { width:'100%', background:'#111520', border:'1px solid #1e2535', borderRadius:'8px', padding:'13px 46px 13px 14px', color:'#e8ecf5', fontSize:'14px', fontFamily:'inherit', transition:'border-color .2s' },
  label:     { display:'block', color:'#9ca3c4', fontSize:'11px', fontWeight:700, marginBottom:'7px', letterSpacing:'.08em', textTransform:'uppercase' },
  btnGold:   { width:'100%', background:'#f0a500', color:'#0a0d12', border:'none', borderRadius:'8px', padding:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  btnGhost:  { width:'100%', background:'transparent', color:'#9ca3c4', border:'1px solid #1e2535', borderRadius:'8px', padding:'11px', fontSize:'13px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:'10px' },
  errBox:    { background:'rgba(127,29,29,.3)', border:'1px solid #7f1d1d', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', color:'#fca5a5', fontSize:'13px' },
  okBox:     { background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.3)', borderRadius:'8px', padding:'16px', marginBottom:'20px', color:'#86efac', fontSize:'13px', lineHeight:1.6 },
  tabRow:    { display:'flex', gap:'4px', marginBottom:'28px', background:'#111520', padding:'4px', borderRadius:'8px' },
  tab:       { flex:1, padding:'9px', borderRadius:'6px', border:'none', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' },
}

const FEATURES = [
  { icon:'🏢', label:'BIM Intelligence', desc:'Clash detection · 3D/4D/5D/6D/7D' },
  { icon:'📊', label:'EVM Analytics',    desc:'CPI, SPI, EAC, VAC, TCPI em tempo real' },
  { icon:'🛡', label:'Conformidade NR',  desc:'NR-6, NR-10, NR-18, NR-33, NR-35' },
  { icon:'🤖', label:'Multi-Agent AI',   desc:'8 especialistas cognitivos simultâneos' },
]

export default function LoginClient() {
  const router = useRouter()
  const [ready,     setReady]     = useState(false)
  const [demoMode,  setDemoMode]  = useState(false)
  const [tab,       setTab]       = useState('login')   // 'login' | 'signup'
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (supabaseUrl && supabaseAnonKey) {
          try {
            if (!_sb) _sb = createClient(supabaseUrl, supabaseAnonKey)
            _sb.auth.getSession()
              .then(({ data }) => { if (data?.session) router.replace('/dashboard.html'); else setReady(true) })
              .catch(() => setReady(true))
          } catch { setReady(true) }
        } else { setDemoMode(true); setReady(true) }
      })
      .catch(() => { setDemoMode(true); setReady(true) })
  }, [])

  /* ── LOGIN ── */
  async function handleLogin(e) {
    e.preventDefault()
    if (demoMode || !_sb) { router.replace('/dashboard.html'); return }
    setLoading(true); setError(''); setSuccess('')
    const { error: err } = await _sb.auth.signInWithPassword({ email, password })
    if (err) {
      if (err.message.includes('Email not confirmed')) {
        setNeedsConfirm(true)
        setError('E-mail ainda não confirmado. Verifique sua caixa de entrada ou reenvie o e-mail abaixo.')
      } else if (err.message.includes('Invalid login')) {
        setError('E-mail ou senha incorretos.')
      } else if (err.message.includes('Too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setError('Erro ao entrar. Tente novamente.')
      }
      setLoading(false)
    } else {
      router.replace('/dashboard.html')
    }
  }

  /* ── SIGNUP ── */
  async function handleSignup(e) {
    e.preventDefault()
    if (!_sb) return
    setLoading(true); setError(''); setSuccess('')
    const { error: err } = await _sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/dashboard.html' },
    })
    if (err) {
      setError(err.message.includes('already registered')
        ? 'Este e-mail já está cadastrado. Use a aba Entrar.'
        : 'Erro ao criar conta: ' + err.message)
    } else {
      setSuccess('✅ Conta criada! Verifique seu e-mail e clique no link de confirmação para ativar o acesso.')
    }
    setLoading(false)
  }

  /* ── REENVIAR CONFIRMAÇÃO ── */
  async function handleResend() {
    if (!_sb || !email) return
    setLoading(true); setError('')
    const { error: err } = await _sb.auth.resend({ type: 'signup', email })
    if (err) setError('Erro ao reenviar: ' + err.message)
    else setSuccess('📧 E-mail de confirmação reenviado! Verifique sua caixa de entrada.')
    setLoading(false)
  }

  if (!ready) return (
    <div style={{ ...s.page, alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:'14px', letterSpacing:'2px' }}>CARREGANDO...</span>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a0d12}
        input:focus{outline:none;border-color:#f0a500!important;box-shadow:0 0 0 3px rgba(240,165,0,.12)}
        @media(max-width:768px){.lp-left{display:none!important}.lp-right{width:100%!important}}
      `}</style>

      <div style={s.page}>

        {/* ── LEFT ── */}
        <div className="lp-left" style={s.left}>
          <div style={{ maxWidth:'460px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'52px' }}>
              <div style={s.logoBox}>🏗</div>
              <div>
                <div style={{ color:'#e8ecf5', fontSize:'15px', fontWeight:600 }}>Construction Intelligence Platform</div>
                <div style={{ color:'#f0a500', fontSize:'10px', fontWeight:600, letterSpacing:'2px', fontFamily:'monospace' }}>v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE</div>
              </div>
            </div>
            <h1 style={{ color:'#e8ecf5', fontSize:'36px', fontWeight:700, lineHeight:1.2, marginBottom:'16px' }}>
              IA Especializada em<br/>Construção Civil
            </h1>
            <p style={{ color:'#6b7a99', fontSize:'15px', lineHeight:1.75, marginBottom:'48px' }}>
              8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real.
            </p>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display:'flex', gap:'16px', alignItems:'flex-start', marginBottom:'24px' }}>
                <div style={s.featBox}>{f.icon}</div>
                <div style={{ paddingTop:'3px' }}>
                  <div style={{ color:'#e8ecf5', fontSize:'14px', fontWeight:600, marginBottom:'3px' }}>{f.label}</div>
                  <div style={{ color:'#6b7a99', fontSize:'13px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lp-right" style={s.right}>
          <div style={{ width:'100%', maxWidth:'380px' }}>

            <h2 style={{ color:'#e8ecf5', fontSize:'26px', fontWeight:700, marginBottom:'8px' }}>
              {tab === 'login' ? 'Entrar na plataforma' : 'Criar conta'}
            </h2>
            <p style={{ color:'#6b7a99', fontSize:'14px', marginBottom:'24px' }}>
              {demoMode ? '⚡ Modo demo — clique em Entrar para acessar.' : 'Acesso exclusivo para usuários autorizados.'}
            </p>

            {/* Tabs */}
            {!demoMode && (
              <div style={s.tabRow}>
                {['login','signup'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); setNeedsConfirm(false) }}
                    style={{ ...s.tab, background: tab===t ? '#f0a500' : 'transparent', color: tab===t ? '#0a0d12' : '#6b7a99' }}>
                    {t === 'login' ? 'Entrar' : 'Criar conta'}
                  </button>
                ))}
              </div>
            )}

            {error  && <div style={s.errBox}>⚠ {error}</div>}
            {success && <div style={s.okBox}>{success}</div>}

            <form onSubmit={tab === 'login' ? handleLogin : handleSignup}>
              <div style={{ marginBottom:'18px' }}>
                <label style={s.label}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required={!demoMode} disabled={demoMode} style={s.input} />
              </div>
              <div style={{ marginBottom:'26px' }}>
                <label style={s.label}>Senha {tab==='signup' && <span style={{ color:'#6b7a99', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(mín. 6 caracteres)</span>}</label>
                <div style={{ position:'relative' }}>
                  <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder={demoMode?'——————':'Sua senha'} required={!demoMode} disabled={demoMode}
                    minLength={tab==='signup'?6:undefined} style={s.inputPwd} />
                  {!demoMode && (
                    <button type="button" onClick={()=>setShowPwd(!showPwd)}
                      style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7a99', fontSize:'18px', lineHeight:1, padding:'4px' }}>
                      {showPwd?'🙈':'👁'}
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ ...s.btnGold, opacity: loading ? .65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar →' : 'Criar conta →'}
              </button>

              {/* Reenviar confirmação */}
              {needsConfirm && !loading && (
                <button type="button" onClick={handleResend} style={s.btnGhost}>
                  📧 Reenviar e-mail de confirmação
                </button>
              )}
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
