import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './components/LoginPage'

/*
  App.tsx — ponto de entrada.

  Lógica simples de guarda de rota:
  • Sessão ativa  → mostra o dashboard (substitua pelo seu roteador)
  • Sem sessão    → mostra LoginPage
  • Carregando    → spinner mínimo

  Para projetos com React Router, substitua a renderização condicional por
  <Routes> / <Navigate> normalmente — useAuth() funciona em qualquer lugar.
*/

export default function App() {
  const { user, session, loading } = useAuth()

  // Remove splash screen nativo se existir
  useEffect(() => {
    document.getElementById('app-splash')?.remove()
  }, [loading])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f2ee',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #e0ddd6',
          borderTopColor: '#BA7517',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} aria-label="Carregando" role="status" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Autenticado: exibe o dashboard ──────────────────────────────────────
  if (session && user) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f4f2ee',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}>
        <div style={{
          padding: '2rem 2.5rem',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #d8d4cc',
          textAlign: 'center',
          maxWidth: 400,
        }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: 20, fontWeight: 600, color: '#1a1a18' }}>
            ✅ Login realizado com sucesso!
          </p>
          <p style={{ margin: '0 0 1rem', fontSize: 13, color: '#6b6962' }}>
            {user.email} · {user.profile?.role ?? 'sem perfil'}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#9a9890' }}>
            Aqui entrará o seu dashboard — substitua este bloco<br />
            pelo componente de roteamento do seu projeto.
          </p>
        </div>
      </div>
    )
  }

  // ── Não autenticado: exibe o login ──────────────────────────────────────
  return <LoginPage />
}
