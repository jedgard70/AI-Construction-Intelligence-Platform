import { useState, FormEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

type Lang = 'en' | 'pt'

const STRINGS: Record<Lang, any> = {
  en: {
    brandHeading: 'Operational Intelligence for Construction & Business',
    brandDesc: 'AI-powered platform for construction, BIM, EVM and executive intelligence.',
    tabLogin: 'Sign in',
    tabSignup: 'Create account',
    formLoginTitle: 'Sign in to the platform',
    formSignupTitle: 'Create your account',
    formLoginSub: 'Enter your credentials to access.',
    formSignupSub: 'Fill in the fields to create your access.',
    emailLabel: 'EMAIL',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: '••••••••••',
    btnLogin: 'Sign in →',
    btnSignup: 'Create account →',
    btnLoading: 'Authenticating…',
    errorInvalid: 'Email or password incorrect.',
    errorEmpty: 'Enter email and password.',
    errorServer: 'Server configuration incomplete. Contact support.',
    errorNetwork: 'Connection error. Try again.',
    successSignup: 'Account created! Check your email to confirm registration.',
    ownerMessage: 'Sign in with your authenticated account to access Owner Command Chat.',
    accessNote: 'Authorized users only',
    eyeShow: 'Show password',
    eyeHide: 'Hide password',
  },
  pt: {
    brandHeading: 'Inteligência Operacional para Construção e Negócios',
    brandDesc: 'Plataforma de IA para construção, BIM, EVM e inteligência executiva.',
    tabLogin: 'Entrar',
    tabSignup: 'Criar conta',
    formLoginTitle: 'Entrar na plataforma',
    formSignupTitle: 'Criar sua conta',
    formLoginSub: 'Insira suas credenciais para acessar.',
    formSignupSub: 'Preencha os campos para criar seu acesso.',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'nome@empresa.com.br',
    passwordLabel: 'SENHA',
    passwordPlaceholder: '••••••••••',
    btnLogin: 'Entrar →',
    btnSignup: 'Criar conta →',
    btnLoading: 'Autenticando…',
    errorInvalid: 'E-mail ou senha incorretos.',
    errorEmpty: 'Preencha e-mail e senha.',
    errorServer: 'Configuração do servidor incompleta. Contate o suporte.',
    errorNetwork: 'Erro de conexão. Tente novamente.',
    successSignup: 'Conta criada! Verifique seu e-mail para confirmar o cadastro.',
    ownerMessage: 'Faça login com sua conta autenticada para acessar o Owner Command Chat.',
    accessNote: 'Acesso restrito a usuários autorizados',
    eyeShow: 'Mostrar senha',
    eyeHide: 'Ocultar senha',
  },
}

const FEATURES = [
  { icon: '⬡', label: 'Inteligência BIM',       sub: 'IFC, RVT, NWD, DWG · Clash Detection' },
  { icon: '◈', label: 'Gestão EVM',              sub: 'CPI, SPI, EAC, VAC em tempo real' },
  { icon: '⬡', label: 'Normas ABNT / NR',        sub: 'NR-18, NR-35, NR-10, NR-6' },
  { icon: '◈', label: 'IA Multi-Agente',          sub: '8 especialistas cognitivos simultâneos' },
]

export default function LoginClient() {
  const router = useRouter()
  const redirectTarget =
    typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')
      ? router.query.redirect
      : '/dashboard'
  const ownerRequired = router.query.reason === 'owner-auth-required'
  const [lang, setLang]         = useState<Lang>('en')
  const [tab, setTab]           = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const t = STRINGS[lang]

  async function handleSubmit(e: FormEvent | KeyboardEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError(t.errorEmpty)
      return
    }
    const supabase = getSupabase()
    if (!supabase) {
      setError(t.errorServer)
      return
    }
    setLoading(true)
    setError('')
    try {
      if (tab === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message === 'Invalid login credentials'
            ? t.errorInvalid
            : authError.message)
          setLoading(false)
          return
        }
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
        setError('')
        alert(t.successSignup)
        setLoading(false)
        return
      }
      // Full page navigation so the browser sends the fresh session cookie
      // to middleware — avoids the flicker/redirect loop
      window.location.href = redirectTarget
    } catch (err: unknown) {
      setError(t.errorNetwork)
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit(e)
  }

  return (
    <div className="acip-wrapper">
      <div className="acip-card">

        {/* ── Painel esquerdo — branding ── */}
        <aside className="acip-brand">
          <div className="acip-logo-row">
            <div className="acip-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#0f4c81" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/>
              </svg>
            </div>
            <div>
              <p className="acip-logo-title">APEX GLOBAL AI</p>
              <p className="acip-logo-sub">v5.3 · Enterprise</p>
            </div>
          </div>

          <div>
            <h1 className="acip-brand-heading">
              {t.brandHeading}
            </h1>
            <p className="acip-brand-desc">
              {t.brandDesc}
            </p>
          </div>

          <div className="acip-features">
            {FEATURES.map(f => (
              <div key={f.label} className="acip-feat-item">
                <span className="acip-feat-icon">{f.icon}</span>
                <div>
                  <p className="acip-feat-label">{f.label}</p>
                  <p className="acip-feat-sub">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="acip-footer">
            © 2026 Apex Global AI
          </p>
        </aside>

        {/* ── Painel direito — formulário ── */}
        <main className="acip-form">

          {/* Language selector */}
          <div className="acip-lang-selector">
            <button
              type="button"
              className={`acip-lang-btn ${lang === 'en' ? 'acip-lang-btn--active' : ''}`}
              onClick={() => setLang('en')}>
              EN
            </button>
            <span className="acip-lang-sep">|</span>
            <button
              type="button"
              className={`acip-lang-btn ${lang === 'pt' ? 'acip-lang-btn--active' : ''}`}
              onClick={() => setLang('pt')}>
              PT
            </button>
          </div>

          {/* Tab login / criar conta */}
          <div className="acip-tabs">
            {(['login', 'signup'] as const).map(tabType => (
              <button key={tabType} type="button"
                className={`acip-tab ${tab === tabType ? 'acip-tab--active' : ''}`}
                onClick={() => { setTab(tabType); setError('') }}>
                {tabType === 'login' ? t.tabLogin : t.tabSignup}
              </button>
            ))}
          </div>

          <h2 className="acip-form-title">
            {tab === 'login' ? t.formLoginTitle : t.formSignupTitle}
          </h2>
          <p className="acip-form-sub">
            {tab === 'login'
              ? t.formLoginSub
              : t.formSignupSub}
          </p>

          {ownerRequired && tab === 'login' && (
            <div className="acip-info">{t.ownerMessage}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* E-mail */}
            <div className="acip-field">
              <label htmlFor="email" className="acip-field-label">{t.emailLabel}</label>
              <div className="acip-input-wrap">
                <span className="acip-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input id="email" type="email" autoComplete="email"
                  placeholder={t.emailPlaceholder} className="acip-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required disabled={loading} />
              </div>
            </div>

            {/* Password */}
            <div className="acip-field">
              <label htmlFor="password" className="acip-field-label">{t.passwordLabel}</label>
              <div className="acip-input-wrap">
                <span className="acip-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input id="password" type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password" placeholder={t.passwordPlaceholder}
                  className="acip-input acip-input--pwd"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required disabled={loading} />
                <button type="button" className="acip-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? t.eyeHide : t.eyeShow}>
                  {showPwd
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="acip-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Button */}
            <button type="submit" className="acip-btn-primary" disabled={loading}>
              {loading
                ? <><span className="acip-spinner" /> {t.btnLoading}</>
                : tab === 'login' ? t.btnLogin : t.btnSignup
              }
            </button>
          </form>

          <p className="acip-access-note">
            {t.accessNote}
          </p>
        </main>
      </div>

      <style>{CSS}</style>
    </div>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --apex-blue:    #0f4c81;
  --apex-blue-dk: #0a3860;
  --apex-blue-lt: #edf3ff;
  --radius:       10px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.acip-wrapper {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f3f8;
  padding: 2rem;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.acip-card {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #d6e2f0;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
}

/* ── Painel esquerdo ── */
.acip-brand {
  background: linear-gradient(135deg, #0f4c81 0%, #0a3860 100%);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  justify-content: space-between;
}

.acip-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.acip-logo-icon {
  width: 36px; height: 36px;
  background: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.acip-logo-title {
  font-size: 13px;
  font-weight: 600;
  color: #f0ece3;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.acip-logo-sub {
  font-size: 10px;
  color: #6e6c65;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.acip-brand-heading {
  font-size: 24px;
  font-weight: 600;
  color: #f0ece3;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin-bottom: 0.5rem;
}

.acip-brand-desc {
  font-size: 13px;
  color: #9a9890;
  line-height: 1.65;
}

.acip-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acip-feat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.08);
  border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.12);
}

.acip-feat-icon {
  font-size: 16px;
  color: var(--apex-blue-lt);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.acip-feat-label {
  font-size: 12px;
  font-weight: 500;
  color: #d8d4ca;
  margin-bottom: 1px;
}

.acip-feat-sub {
  font-size: 11px;
  color: #6e6c65;
}

.acip-footer {
  font-size: 11px;
  color: #4e4c47;
}

/* ── Painel direito ── */
.acip-form {
  background: #ffffff;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
}

.acip-lang-selector {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 1.5rem;
}

.acip-lang-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #9a9890;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.05em;
}

.acip-lang-btn:hover {
  color: #6b6962;
}

.acip-lang-btn--active {
  color: var(--apex-blue);
}

.acip-lang-sep {
  color: #d6e2f0;
  font-size: 12px;
}

.acip-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 1.5rem;
  background: #f0f3f8;
  padding: 4px;
  border-radius: 8px;
}

.acip-tab {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  background: transparent;
  color: #9a9890;
  transition: all 0.15s;
}

.acip-tab--active {
  background: #fff;
  color: #1a1a18;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

.acip-form-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a18;
  letter-spacing: -0.01em;
  margin-bottom: 0.25rem;
}

.acip-form-sub {
  font-size: 13px;
  color: #6b6962;
  margin-bottom: 1.5rem;
}

.acip-field {
  margin-bottom: 1rem;
}

.acip-field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #9a9890;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.acip-input-wrap { position: relative; }

.acip-input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #b0ada6;
  display: flex;
  pointer-events: none;
}

.acip-input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a18;
  background: #f9fafc;
  border: 1px solid #d6e2f0;
  border-radius: var(--radius);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.acip-input:focus {
  border-color: var(--apex-blue);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(15,76,129,0.12);
}

.acip-input--pwd { padding-right: 38px; }

.acip-eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #b0ada6;
  padding: 4px;
  display: flex;
  align-items: center;
}
.acip-eye-btn:hover { color: #6b6962; }

.acip-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff3f3;
  border: 1px solid #f5b8b8;
  border-radius: var(--radius);
  font-size: 12px;
  color: #a32d2d;
  margin-bottom: 1rem;
}

.acip-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(15,76,129,.08);
  border: 1px solid rgba(15,76,129,.22);
  border-radius: var(--radius);
  font-size: 12px;
  color: #0a3860;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.acip-btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--apex-blue);
  border: none;
  border-radius: var(--radius);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, transform 0.1s;
  margin-top: 0.25rem;
}
.acip-btn-primary:hover:not(:disabled) { background: var(--apex-blue-dk); }
.acip-btn-primary:active:not(:disabled) { transform: scale(0.98); }
.acip-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.acip-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: acip-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes acip-spin { to { transform: rotate(360deg); } }

.acip-demo-note {
  margin-top: 1rem;
  padding: 10px 14px;
  background: rgba(15,76,129,.08);
  border: 1px solid rgba(15,76,129,.25);
  border-radius: var(--radius);
  font-size: 12px;
  color: #0a3860;
  line-height: 1.5;
}

.acip-access-note {
  margin-top: auto;
  padding-top: 1.5rem;
  font-size: 11px;
  color: #9a9890;
  text-align: center;
}

@media (max-width: 640px) {
  .acip-card {
    grid-template-columns: 1fr;
    max-width: 420px;
  }
  .acip-brand {
    display: none;
  }
  .acip-form {
    padding: 2rem 1.5rem;
  }
}
`
