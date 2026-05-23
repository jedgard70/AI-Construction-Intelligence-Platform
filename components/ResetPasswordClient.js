'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/frontend/lib/supabase'

export default function ResetPasswordClient() {
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    // Supabase redireciona com #access_token=... no hash
    // o cliente detecta automaticamente ao inicializar
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Forçar leitura do hash na URL
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== password2) { setError('As senhas não coincidem.'); return }
    if (password.length < 8)    { setError('Senha deve ter pelo menos 8 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      if (!supabase) throw new Error('Supabase não configurado')
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 2500)
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .rp-page  { min-height:100vh; display:flex; align-items:center; justify-content:center;
                    background:#0a0d12; font-family:'Sora',sans-serif; padding:24px; }
        .rp-card  { width:100%; max-width:400px; }
        .rp-input { width:100%; background:#111520; border:1px solid #1e2535; border-radius:8px;
                    padding:13px 14px; color:#e8ecf5; font-size:14px; font-family:inherit;
                    transition:border-color .2s; box-sizing:border-box; outline:none; }
        .rp-input:focus { border-color:#f0a500; box-shadow:0 0 0 3px rgba(240,165,0,.12); }
        .rp-btn   { width:100%; background:#f0a500; color:#0a0d12; border:none; border-radius:8px;
                    padding:14px; font-size:15px; font-weight:700; cursor:pointer;
                    font-family:inherit; transition:opacity .15s; }
        .rp-btn:hover    { opacity:.9; }
        .rp-btn:disabled { opacity:.6; cursor:not-allowed; }
        .label    { display:block; color:#9ca3c4; font-size:11px; font-weight:700;
                    margin-bottom:7px; letter-spacing:.08em; text-transform:uppercase; }
      ` }} />

      <div className="rp-page">
        <div className="rp-card">

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ width:44, height:44, borderRadius:10,
              background:'linear-gradient(135deg,#f0a500,#d4891a)',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:22, marginBottom:14 }}>🏗</div>
            <div style={{ color:'#e8ecf5', fontSize:'13px', fontWeight:600 }}>
              Construction Intelligence Platform <span style={{ color:'#f0a500' }}>AI</span>
            </div>
          </div>

          {done ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
              <h2 style={{ color:'#e8ecf5', fontSize:'22px', fontWeight:700, marginBottom:10 }}>
                Senha redefinida!
              </h2>
              <p style={{ color:'#6b7a99', fontSize:'14px', lineHeight:1.7 }}>
                Sua senha foi alterada com sucesso.<br/>
                Redirecionando para o dashboard…
              </p>
            </div>
          ) : !ready ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ color:'#6b7a99', fontSize:'14px' }}>Verificando link…</div>
              <p style={{ color:'#6b7a99', fontSize:'13px', marginTop:16 }}>
                Se este link expirou,{' '}
                <a href="/forgot-password"
                  style={{ color:'#f0a500', textDecoration:'none' }}>
                  solicite um novo
                </a>.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ color:'#e8ecf5', fontSize:'24px', fontWeight:700, marginBottom:8 }}>
                Nova senha
              </h2>
              <p style={{ color:'#6b7a99', fontSize:'14px', marginBottom:28 }}>
                Escolha uma senha forte com pelo menos 8 caracteres.
              </p>

              <form onSubmit={handleSubmit}>
                <label className="label">Nova senha</label>
                <input className="rp-input" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={8} style={{ marginBottom:16 }} />

                <label className="label">Confirmar nova senha</label>
                <input className="rp-input" type="password" placeholder="••••••••"
                  value={password2} onChange={e => setPassword2(e.target.value)}
                  required minLength={8} style={{ marginBottom:20 }} />

                {error && (
                  <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)',
                    borderRadius:8, padding:'10px 14px', color:'#f87171', fontSize:'13px',
                    marginBottom:16 }}>
                    {error}
                  </div>
                )}

                <button className="rp-btn" type="submit" disabled={loading || !password || !password2}>
                  {loading ? 'Salvando...' : 'Definir nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
