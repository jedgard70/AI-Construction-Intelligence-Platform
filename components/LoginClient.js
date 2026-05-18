'use client'
import { useState } from 'react'
import { createClient } from '@/frontend/lib/supabase'

const FEATURES = [
  { icon: '🏢', label: 'BIM Intelligence', desc: 'Clash detection · 3D/4D/5D/6D/7D' },
  { icon: '📊', label: 'EVM Analytics',    desc: 'CPI, SPI, EAC, VAC, TCPI em tempo real' },
  { icon: '🛡',  label: 'Conformidade NR',  desc: 'NR-6, NR-10, NR-18, NR-33, NR-35' },
  { icon: '🤖', label: 'Multi-Agent AI',   desc: '8 especialistas cognitivos simultâneos' },
]

export default function LoginClient() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      if (tab === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
      }
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message || 'Erro ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .lp-page { min-height:100vh; display:flex; background:#0a0d12; font-family:'Sora',sans-serif; }
        .lp-left { flex:1; display:flex; flex-direction:column; justify-content:center; padding:64px;
          background:linear-gradient(160deg,#0a0d12 0%,#111520 60%,#0f1a2e 100%);
          border-right:1px solid #1e2535; }
        .lp-right { width:480px; flex-shrink:0; display:flex; align-items:center; justify-content:center; padding:48px; }
        .lp-input { width:100%; background:#111520; border:1px solid #1e2535; border-radius:8px;
          padding:13px 14px; color:#e8ecf5; font-size:14px; font-family:inherit;
          transition:border-color .2s; box-sizing:border-box; outline:none; }
        .lp-input:focus { border-color:#f0a500; box-shadow:0 0 0 3px rgba(240,165,0,.12); }
        .lp-label { display:block; color:#9ca3c4; font-size:11px; font-weight:700;
          margin-bottom:7px; letter-spacing:.08em; text-transform:uppercase; }
        .lp-btn-gold { width:100%; background:#f0a500; color:#0a0d12; border:none; border-radius:8px;
          padding:14px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:opacity .15s; }
        .lp-btn-gold:hover { opacity:.9; }
        .lp-btn-gold:disabled { opacity:.6; cursor:not-allowed; }
        .lp-tab { flex:1; padding:9px; border-radius:6px; border:none; font-size:13px; font-weight:600;
          cursor:pointer; font-family:inherit; transition:all .15s; }
        @media(max-width:900px){ .lp-left{display:none!important} .lp-right{width:100%!important} }
      `}</style>

      <div className="lp-page">
        {/* Left — marketing panel */}
        <div className="lp-left">
          <div style={{ maxWidth:'460px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'52px' }}>
              <LpBrandMark />
              <div>
                <div style={{ color:'#e8ecf5', fontSize:'15px', fontWeight:600, letterSpacing:'-0.005em' }}>
                  Construction Intelligence Platform <span style={{ color:'#f0a500' }}>AI</span>
                </div>
                <div style={{ color:'#f0a500', fontSize:'10px', fontWeight:600,
                  letterSpacing:'2px', fontFamily:'monospace' }}>
                  v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE
                </div>
              </div>
            </div>

            <h1 style={{ color:'#e8ecf5', fontSize:'36px', fontWeight:700,
              lineHeight:1.2, marginBottom:'16px', fontFamily:'Sora,sans-serif' }}>
              IA Especializada em<br/>Construção Civil
            </h1>
            <p style={{ color:'#6b7a99', fontSize:'15px', lineHeight:1.75, marginBottom:'48px' }}>
              8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real.
            </p>

            {FEATURES.map(f => (
              <div key={f.label} style={{ display:'flex', gap:'16px', alignItems:'flex-start', marginBottom:'24px' }}>
                <div style={{ width:'38px', height:'38px', background:'rgba(240,165,0,.1)',
                  borderRadius:'9px', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{f.icon}</div>
                <div style={{ paddingTop:'3px' }}>
                  <div style={{ color:'#e8ecf5', fontSize:'14px', fontWeight:600, marginBottom:'3px' }}>{f.label}</div>
                  <div style={{ color:'#6b7a99', fontSize:'13px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — auth form */}
        <div className="lp-right">
          <div style={{ width:'100%', maxWidth:'380px' }}>
            <h2 style={{ color:'#e8ecf5', fontSize:'26px', fontWeight:700, marginBottom:'8px' }}>
              {tab === 'login' ? 'Entrar na plataforma' : 'Criar conta'}
            </h2>
            <p style={{ color:'#6b7a99', fontSize:'14px', marginBottom:'24px' }}>
              Acesso exclusivo para usuários autorizados.
            </p>

            <div style={{ display:'flex', gap:'4px', marginBottom:'28px',
              background:'#111520', padding:'4px', borderRadius:'8px' }}>
              {['login','signup'].map(t => (
                <button key={t} className="lp-tab" onClick={() => { setTab(t); setError('') }}
                  style={{ background: tab===t ? '#f0a500' : 'transparent',
                    color: tab===t ? '#0a0d12' : '#6b7a99' }}>
                  {t === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'18px' }}>
                <label className="lp-label">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" className="lp-input" required />
              </div>
              <div style={{ marginBottom:'26px' }}>
                <label className="lp-label">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha" className="lp-input" required />
              </div>
              {error && (
                <div style={{ marginBottom:'16px', padding:'10px 14px', background:'#FCEBEB',
                  border:'1px solid #F09595', borderRadius:'8px',
                  color:'#A32D2D', fontSize:'13px' }}>{error}</div>
              )}
              <button type="submit" className="lp-btn-gold" disabled={loading}>
                {loading ? 'CARREGANDO...' : tab === 'login' ? 'Entrar →' : 'Criar conta →'}
              </button>
            </form>

            <div style={{ marginTop:'24px', padding:'14px 16px', background:'#111520',
              borderRadius:'8px', border:'1px solid #1e2535',
              display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'16px' }}>🔒</span>
              <span style={{ color:'#6b7a99', fontSize:'12px' }}>Sessão criptografada · LGPD compliant</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function LpBrandMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48"
      style={{ display:'block', borderRadius:'11px',
        boxShadow:'0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 18px rgba(240,165,0,0.18)' }}>
      <defs>
        <linearGradient id="lp-bm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a500"/>
          <stop offset="100%" stopColor="#cf8b00"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#lp-bm)"/>
      <g stroke="#0a0d12" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="square">
        <line x1="6" y1="40" x2="42" y2="40"/>
        <line x1="12" y1="40" x2="12" y2="42"/>
        <line x1="24" y1="40" x2="24" y2="42"/>
        <line x1="36" y1="40" x2="36" y2="42"/>
      </g>
      <g fill="none" stroke="#0a0d12" strokeLinejoin="miter" strokeLinecap="square" strokeMiterlimit="8">
        <path d="M 9 40 L 24 10"      strokeWidth="3.4"/>
        <path d="M 39 40 L 24 10"     strokeWidth="3.4"/>
        <path d="M 15.5 27 L 32.5 27" strokeWidth="2.4"/>
        <path d="M 17 24 L 24 33 L 31 24" strokeWidth="1.6" strokeOpacity="0.55"/>
      </g>
      <circle cx="24" cy="10" r="5.2" fill="#A32D2D" fillOpacity="0.18"/>
      <circle cx="24" cy="10" r="3"   fill="#A32D2D"/>
      <circle cx="24" cy="10" r="1.2" fill="#ffe6a8"/>
      <g fill="#A32D2D" fillOpacity="0.55">
        <circle cx="14" cy="7" r="1"/>
        <circle cx="34" cy="7" r="1"/>
      </g>
    </svg>
  )
}
