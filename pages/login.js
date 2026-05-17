import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [supabase, setSupabase] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (supabaseUrl && supabaseAnonKey) {
          import('@supabase/supabase-js').then(({ createClient }) => {
            const client = createClient(supabaseUrl, supabaseAnonKey)
            setSupabase(client)
            client.auth.getSession().then(({ data: { session } }) => {
              if (session) router.replace('/dashboard.html')
              else setChecking(false)
            })
          })
        } else {
          setDemoMode(true)
          setChecking(false)
        }
      })
      .catch(() => {
        setDemoMode(true)
        setChecking(false)
      })
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (demoMode || !supabase) {
      router.replace('/dashboard.html')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(translateError(authError.message))
      setLoading(false)
    } else {
      router.replace('/dashboard.html')
    }
  }

  function translateError(msg) {
    if (msg.includes('Invalid login')) return 'E-mail ou senha incorretos.'
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
    if (msg.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
    return 'Erro ao entrar. Tente novamente.'
  }

  if (checking) {
    return (
      <div style={{ background: '#0a0d12', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#f0a500', fontFamily: 'monospace', fontSize: '14px' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Login — Construction Intelligence Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0a0d12; }
        input { transition: border-color 0.2s; }
        input:focus { outline: none; border-color: #f0a500 !important; }
        button:hover:not(:disabled) { opacity: 0.9; }
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0d12', fontFamily: "'Sora', sans-serif" }}>

        {/* Left branding panel */}
        <div className="left-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', background: 'linear-gradient(160deg, #0a0d12 0%, #111520 60%, #0f1a2e 100%)', borderRight: '1px solid #1e2535' }}>
          <div style={{ maxWidth: '460px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
              <div style={{ width: '42px', height: '42px', background: '#f0a500', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏗</div>
              <div>
                <div style={{ color: '#e8ecf5', fontSize: '15px', fontWeight: 600 }}>Construction Intelligence Platform</div>
                <div style={{ color: '#f0a500', fontSize: '10px', fontWeight: 600, letterSpacing: '2px', fontFamily: 'monospace' }}>v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE</div>
              </div>
            </div>

            <h1 style={{ color: '#e8ecf5', fontSize: '34px', fontWeight: 700, lineHeight: 1.25, marginBottom: '16px' }}>
              IA Especializada em<br />Construção Civil
            </h1>
            <p style={{ color: '#6b7a99', fontSize: '15px', lineHeight: 1.75, marginBottom: '44px' }}>
              8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real.
            </p>

            {[
              { icon: '🏢', label: 'BIM Intelligence', desc: 'Clash detection · Coordenação 3D/4D/5D/6D/7D' },
              { icon: '📊', label: 'EVM Analytics', desc: 'CPI, SPI, EAC, VAC, TCPI em tempo real' },
              { icon: '🛡', label: 'Conformidade NR', desc: 'NR-6, NR-10, NR-18, NR-33, NR-35 automático' },
              { icon: '🤖', label: 'Multi-Agent AI', desc: '8 especialistas cognitivos simultâneos' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '22px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(240,165,0,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div>
                <div style={{ paddingTop: '2px' }}>
                  <div style={{ color: '#e8ecf5', fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>{f.label}</div>
                  <div style={{ color: '#6b7a99', fontSize: '13px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right login panel */}
        <div className="right-panel" style={{ width: '460px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>

            <div style={{ marginBottom: '36px' }}>
              <h2 style={{ color: '#e8ecf5', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Entrar na plataforma</h2>
              <p style={{ color: '#6b7a99', fontSize: '14px' }}>
                {demoMode
                  ? '⚡ Modo demonstração — clique em Entrar para acessar.'
                  : 'Use suas credenciais corporativas para acessar.'}
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#fca5a5', fontSize: '13px' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#9ca3c4', fontSize: '12px', fontWeight: 600, marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  required={!demoMode}
                  disabled={demoMode}
                  style={{ width: '100%', background: '#111520', border: '1px solid #1e2535', borderRadius: '8px', padding: '12px 14px', color: '#e8ecf5', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ color: '#9ca3c4', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Senha</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={demoMode ? '••••••••' : 'Sua senha'}
                    required={!demoMode}
                    disabled={demoMode}
                    style={{ width: '100%', background: '#111520', border: '1px solid #1e2535', borderRadius: '8px', padding: '12px 44px 12px 14px', color: '#e8ecf5', fontSize: '14px', fontFamily: 'inherit' }}
                  />
                  {!demoMode && (
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a99', fontSize: '16px', padding: '4px' }}
                    >
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                <span style={{ color: '#6b7a99', fontSize: '12px' }}>
                  Esqueceu a senha? Contate o administrador.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: loading ? '#7a5200' : '#f0a500', color: '#0a0d12', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}
              >
                {loading ? 'Verificando credenciais...' : 'Entrar →'}
              </button>
            </form>

            <div style={{ marginTop: '28px', padding: '14px 16px', background: '#111520', borderRadius: '8px', border: '1px solid #1e2535', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <span style={{ color: '#6b7a99', fontSize: '12px' }}>Sessão criptografada · Dados protegidos · LGPD compliant</span>
            </div>

            {demoMode && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(240,165,0,0.08)', borderRadius: '8px', border: '1px solid rgba(240,165,0,0.2)' }}>
                <div style={{ color: '#f0a500', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>⚡ Modo Demonstração</div>
                <div style={{ color: '#9ca3c4', fontSize: '12px' }}>Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel para ativar autenticação completa.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
