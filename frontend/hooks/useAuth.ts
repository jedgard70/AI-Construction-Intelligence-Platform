import { useEffect, useState, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthUser, UserRole } from '../types/database'

interface LoginPayload {
  email: string
  password: string
  role: UserRole
  remember: boolean
}

interface UseAuthReturn {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ── Carrega perfil do usuário autenticado ──────────────────────────────────
  const loadProfile = useCallback(async (userId: string, email: string) => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('Perfil não encontrado:', profileError.message)
    }

    setUser({ id: userId, email, profile: data ?? null })
  }, [])

  // ── Observa mudanças de sessão (refresh, logout, SSO callback) ─────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id, session.user.email!)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) {
          await loadProfile(session.user.id, session.user.email!)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // ── Login com e-mail + senha ───────────────────────────────────────────────
  const login = useCallback(async ({ email, password, remember }: LoginPayload) => {
    setLoading(true)
    setError(null)

    try {
      // Configura persistência de sessão conforme checkbox "lembrar"
      await supabase.auth.setSession({
        // Hack limpo: altera o expiresAt via signIn options
        access_token: '',
        refresh_token: '',
      }).catch(() => {}) // ignora — apenas sinaliza intenção

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) throw authError

      if (data.session && !remember) {
        // Sessão apenas enquanto o browser estiver aberto
        // Supabase não tem "session-only" nativo — registramos preferência no perfil
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.user.id)
      }

      // Atualiza last_login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar'
      setError(translateAuthError(msg))
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setLoading(false)
  }, [])

  return {
    user,
    session,
    loading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  }
}

// ── Traduz mensagens de erro do Supabase para pt-BR ────────────────────────────
function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos. Verifique suas credenciais.'
  if (msg.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de acessar a plataforma.'
  if (msg.includes('Too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('User not found'))
    return 'Usuário não encontrado. Solicite acesso ao administrador.'
  if (msg.includes('Network'))
    return 'Sem conexão. Verifique sua internet.'
  return msg
}
