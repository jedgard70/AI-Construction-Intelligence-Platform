'use client'
import { useState } from 'react'
import { supabase } from '@/frontend/lib/supabase'

export default function ForgotPasswordClient() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!supabase) throw new Error('Supabase não configurado')
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      })
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .fp-page  { min-height:100vh; display:flex; align-items:center; justify-content:center;
                    background:#0a0d12; font-family:'Sora',sans-serif; padding:24px; }
        .fp-card  { width:100%; max-width:400px; }
        .fp-input { width:100%; background:#111520; border:1px solid #1e2535; border-radius:8px;
                    padding:13px 14px; color:#e8ecf5; font-size:14px; font-family:inherit;
                    transition:border-color .2s; box-sizing:border-box; outline:none; }
        .fp-input:focus { border-color:#f0a500; box-shadow:0 0 0 3px rgba(240,165,0,.12); }
        .fp-btn   { width:100%; background:#f0a500; color:#0a0d12; border:none; border-radius:8px;
                    padding:14px; font-size:15px; font-weight:700; cursor:pointer;
                    font-family:inherit; transition:opacity .15s; }
        .fp-btn:hover    { opacity:.9; }
        .fp-btn:disabled { opacity:.6; cursor:not-allowed; }
        .fp-link  { color:#f0a500; font-size:13px; text-decoration:none; cursor:pointer;
                    background:none; border:none; font-family:inherit; }
        .fp-link:hover { text-decoration:underline; }
      ` }} />

      <div className="fp-page">
        <div className="fp-card">

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <div style={{ width:44, height:44, borderRadius:10,
              background:'linear-gradient(135deg,#f0a500,#d4891a)',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:22, marginBottom:14 }}>🏗</div>
            <div style={{ color:'#e8ecf5', fontSize:'13px', fontWeight:600, letterSpacing:'-0.005em' }}>
              Construction Intelligence Platform <span style={{ color:'#f0a500' }}>AI</span>
            </div>
          </div>

          {sent ? (
            /* ── Confirmação ── */
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
              <h2 style={{ color:'#e8ecf5', fontSize:'22px', fontWeight:700, marginBottom:10 }}>
                E-mail enviado!
              </h2>
              <p style={{ color:'#6b7a99', fontSize:'14px', lineHeight:1.7, marginBottom:28 }}>
                Verifique sua caixa de entrada em <strong style={{ color:'#e8ecf5' }}>{email}</strong>.
                Clique no link do e-mail para redefinir sua senha.
              </p>
              <p style={{ color:'#6b7a99', fontSize:'12px', marginBottom:28 }}>
                Não recebeu? Verifique o spam ou{' '}
                <button className="fp-link" onClick={() => setSent(false)}>
                  tente novamente
                </button>
              </p>
              <a href="/login" className="fp-btn" style={{ display:'block', textAlign:'center', textDecoration:'none', padding:'14px', borderRadius:8, background:'#f0a500', color:'#0a0d12', fontWeight:700 }}>
                Voltar ao login
              </a>
            </div>
          ) : (
            /* ── Formulário ── */
            <>
              <h2 style={{ color:'#e8ecf5', fontSize:'24px', fontWeight:700, marginBottom:8 }}>
                Esqueceu a senha?
              </h2>
              <p style={{ color:'#6b7a99', fontSize:'14px', lineHeight:1.7, marginBottom:28 }}>
                Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display:'block', color:'#9ca3c4', fontSize:'11px', fontWeight:700,
                  marginBottom:7, letterSpacing:'.08em', textTransform:'uppercase' }}>
                  E-mail
                </label>
                <input
                  className="fp-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ marginBottom:20 }}
                />

                {error && (
                  <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)',
                    borderRadius:8, padding:'10px 14px', color:'#f87171', fontSize:'13px',
                    marginBottom:16 }}>
                    {error}
                  </div>
                )}

                <button className="fp-btn" type="submit" disabled={loading || !email}>
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>

              <div style={{ textAlign:'center', marginTop:24 }}>
                <a href="/login" className="fp-link">← Voltar ao login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
