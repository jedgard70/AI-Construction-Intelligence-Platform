import { useState, FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ROLES, UserRole } from '../types/database'

/* ─────────────────────────────────────────────────────────────────────────────
   LoginPage
   Corresponde exatamente ao visual aprovado.
   Uso: <LoginPage onSuccess={() => navigate('/dashboard')} />
───────────────────────────────────────────────────────────────────────────── */
interface LoginPageProps {
  onSuccess?: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, loading, error, clearError } = useAuth()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [remember, setRemember]   = useState(true)
  const [role, setRole]           = useState<UserRole>('coordenador_projetos')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await login({ email, password, role, remember })
    onSuccess?.()
  }

  return (
    <div className="acip-login-wrapper">
      <div className="acip-login-card">

        {/* ── LEFT: Branding ─────────────────────────────────────────── */}
        <aside className="acip-brand-panel">
          <div className="acip-logo-row">
            <div className="acip-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/>
              </svg>
            </div>
            <div>
              <p className="acip-logo-title">ACIP</p>
              <p className="acip-logo-sub">v5.1 Enterprise</p>
            </div>
          </div>

          <div>
            <h1 className="acip-brand-heading">
              AI Construction<br />Intelligence Platform
            </h1>
            <p className="acip-brand-desc">
              Ecossistema operacional inteligente para engenharia civil,
              BIM e inteligência executiva.
            </p>
          </div>

          <div className="acip-features">
            {FEATURES.map(f => (
              <div key={f.label} className="acip-feature-item">
                <div className="acip-feature-icon" aria-hidden="true">{f.icon}</div>
                <div>
                  <p className="acip-feature-label">{f.label}</p>
                  <p className="acip-feature-sub">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="acip-footer">
            © 2025 ACIP Enterprise · Todos os direitos reservados
          </p>
        </aside>

        {/* ── RIGHT: Formulário ──────────────────────────────────────── */}
        <main className="acip-form-panel">
          <h2 className="acip-form-title">Entrar na plataforma</h2>
          <p className="acip-form-subtitle">
            Selecione seu perfil e insira suas credenciais.
          </p>

          {/* Seletor de perfil */}
          <fieldset className="acip-fieldset">
            <legend className="acip-field-legend">PERFIL DE ACESSO</legend>
            <div className="acip-roles-grid">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`acip-role-tile ${role === r.id ? 'acip-role-tile--active' : ''}`}
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                  title={r.description}
                >
                  <i className={`ti ${r.icon} acip-role-icon`} aria-hidden="true" />
                  <span className="acip-role-label">{r.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <form onSubmit={handleSubmit} noValidate>

            {/* E-mail */}
            <div className="acip-field">
              <label htmlFor="email" className="acip-field-legend">
                E-MAIL CORPORATIVO
              </label>
              <div className="acip-input-wrap">
                <i className="ti ti-mail acip-input-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@empresa.com.br"
                  className="acip-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="acip-field">
              <div className="acip-field-row">
                <label htmlFor="password" className="acip-field-legend">SENHA</label>
                <a href="/forgot-password" className="acip-link">Esqueci a senha</a>
              </div>
              <div className="acip-input-wrap">
                <i className="ti ti-lock acip-input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="acip-input acip-input--pwd"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="acip-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Lembrar */}
            <div className="acip-remember">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="acip-checkbox"
              />
              <label htmlFor="remember" className="acip-remember-label">
                Manter conectado por 30 dias
              </label>
            </div>

            {/* Erro */}
            {error && (
              <div className="acip-error" role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              className="acip-btn-primary"
              disabled={loading || !email || !password}
            >
              {loading
                ? <><span className="acip-spinner" aria-hidden="true" /> Autenticando…</>
                : <><i className="ti ti-login" aria-hidden="true" /> Acessar plataforma</>
              }
            </button>

          </form>

          {/* SSO */}
          <div className="acip-divider"><span>ou</span></div>

          <button type="button" className="acip-btn-sso">
            <i className="ti ti-building" aria-hidden="true" />
            Entrar via SSO corporativo
          </button>

          <p className="acip-access-note">
            Acesso restrito a usuários autorizados ·{' '}
            <a href="/request-access" className="acip-link">Solicitar acesso</a>
          </p>
        </main>

      </div>

      {/* ── CSS ──────────────────────────────────────────────────────────── */}
      <style>{CSS}</style>
    </div>
  )
}

// ── Feature list (painel esquerdo) ────────────────────────────────────────────
const FEATURES = [
  { icon: '⬡', label: 'Inteligência BIM',     sub: 'IFC, RVT, NWD, DWG e mais' },
  { icon: '◈', label: 'Inteligência Financeira', sub: 'ROI, Valuation, Captação' },
  { icon: '⬡', label: 'Normas ABNT / NR',       sub: 'NR-18, NR-35, NR-10' },
  { icon: '◈', label: 'IA Multi-Agente',         sub: 'Decisão cognitiva adaptativa' },
]

// ── Estilos ───────────────────────────────────────────────────────────────────
const CSS = `
/* tokens */
:root {
  --acip-amber:     #BA7517;
  --acip-amber-dk:  #9a6010;
  --acip-amber-lt:  #faeeda;
  --acip-radius:    10px;
  --acip-gap:       1rem;
}

/* wrapper fullscreen */
.acip-login-wrapper {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f2ee;
  padding: 2rem;
  box-sizing: border-box;
  font-family: 'DM Sans', system-ui, sans-serif;
}

/* card container */
.acip-login-card {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #d8d4cc;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
}

/* ── BRAND PANEL ── */
.acip-brand-panel {
  background: #1a1a18;
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
  background: var(--acip-amber);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.acip-logo-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f0ece3;
  letter-spacing: 0.08em;
}

.acip-logo-sub {
  margin: 0;
  font-size: 10px;
  color: #7a786e;
  letter-spacing: 0.04em;
}

.acip-brand-heading {
  margin: 0 0 0.5rem;
  font-size: 24px;
  font-weight: 600;
  color: #f0ece3;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.acip-brand-desc {
  margin: 0;
  font-size: 13px;
  color: #9a9890;
  line-height: 1.6;
}

.acip-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.acip-feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #242420;
  border-radius: var(--acip-radius);
  border: 1px solid #2e2e2a;
}

.acip-feature-icon {
  font-size: 16px;
  color: var(--acip-amber);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.acip-feature-label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #d8d4ca;
}

.acip-feature-sub {
  margin: 0;
  font-size: 11px;
  color: #6e6c65;
}

.acip-footer {
  margin: 0;
  font-size: 11px;
  color: #4e4c47;
}

/* ── FORM PANEL ── */
.acip-form-panel {
  background: #ffffff;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.acip-form-title {
  margin: 0 0 0.25rem;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a18;
  letter-spacing: -0.01em;
}

.acip-form-subtitle {
  margin: 0 0 1.5rem;
  font-size: 13px;
  color: #6b6962;
}

/* fieldset */
.acip-fieldset {
  border: none;
  padding: 0;
  margin: 0 0 1.5rem;
}

.acip-field-legend {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #9a9890;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

/* roles grid */
.acip-roles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.acip-role-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--acip-radius);
  border: 1px solid #e0ddd6;
  background: #faf9f6;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.acip-role-tile:hover {
  border-color: var(--acip-amber);
  background: var(--acip-amber-lt);
}

.acip-role-tile--active {
  border: 2px solid var(--acip-amber);
  background: var(--acip-amber-lt);
}

.acip-role-icon {
  font-size: 18px;
  color: var(--acip-amber);
}

.acip-role-label {
  font-size: 11px;
  font-weight: 600;
  color: #1a1a18;
}

/* field */
.acip-field {
  margin-bottom: 1rem;
}

.acip-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.acip-input-wrap {
  position: relative;
}

.acip-input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #b0ada6;
  pointer-events: none;
}

.acip-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 10px 34px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a18;
  background: #faf9f6;
  border: 1px solid #d8d4cc;
  border-radius: var(--acip-radius);
  outline: none;
  transition: border-color 0.15s;
}

.acip-input:focus {
  border-color: var(--acip-amber);
  background: #fff;
}

.acip-input--pwd {
  padding-right: 38px;
}

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
  font-size: 16px;
}

.acip-eye-btn:hover { color: #6b6962; }

/* remember */
.acip-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.25rem;
}

.acip-checkbox { accent-color: var(--acip-amber); width: 14px; height: 14px; cursor: pointer; }

.acip-remember-label {
  font-size: 12px;
  color: #6b6962;
  cursor: pointer;
}

/* error */
.acip-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff3f3;
  border: 1px solid #f5b8b8;
  border-radius: var(--acip-radius);
  font-size: 12px;
  color: #a32d2d;
  margin-bottom: 1rem;
}

/* primary button */
.acip-btn-primary {
  width: 100%;
  padding: 11px;
  background: var(--acip-amber);
  border: none;
  border-radius: var(--acip-radius);
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
}

.acip-btn-primary:hover:not(:disabled) { background: var(--acip-amber-dk); }
.acip-btn-primary:active:not(:disabled) { transform: scale(0.98); }
.acip-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* spinner */
.acip-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: acip-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes acip-spin { to { transform: rotate(360deg); } }

/* divider */
.acip-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.25rem 0;
  color: #b0ada6;
  font-size: 11px;
}
.acip-divider::before,
.acip-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0ddd6;
}

/* SSO button */
.acip-btn-sso {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #d8d4cc;
  border-radius: var(--acip-radius);
  color: #1a1a18;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, border-color 0.15s;
}
.acip-btn-sso:hover { background: #faf9f6; border-color: #b0ada6; }

/* link */
.acip-link {
  font-size: 12px;
  color: var(--acip-amber);
  text-decoration: none;
}
.acip-link:hover { text-decoration: underline; }

/* access note */
.acip-access-note {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 11px;
  color: #9a9890;
}

/* ── Responsivo ── */
@media (max-width: 640px) {
  .acip-login-card { grid-template-columns: 1fr; }
  .acip-brand-panel { display: none; }
  .acip-login-wrapper { padding: 1rem; }
}
`
