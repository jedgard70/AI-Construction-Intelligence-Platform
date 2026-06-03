import { createServerClient } from '@supabase/ssr'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, type CSSProperties } from 'react'
import { getSupabase } from '../lib/supabase'

type ContinuityState = {
  canView: boolean
  canContinue: boolean
  canApproveCritical: boolean
  scope: string
  reason: string
}

type PolicyState = {
  permissionSummary: string
  backendEnforced: boolean
  ownerContinuity: boolean
  ownerPrivateVisible: boolean
}

type OwnerCommandResponse = {
  success: boolean
  data?: {
    reply: string
    role: string
    owner: boolean
    continuity: ContinuityState
    policy: PolicyState
  }
  error?: {
    code: string
    message: string
  }
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ExecutionLog = {
  id: string
  command: string
  status: 'success' | 'error' | 'timeout'
  result?: string
  timestamp: string
  duration_ms: number
}

type OwnerCommandPageProps = {
  initialEmail: string | null
}

const initialContinuity: ContinuityState = {
  canView: false,
  canContinue: false,
  canApproveCritical: false,
  scope: 'denied',
  reason: 'Ainda nao avaliado pelo backend.',
}

const initialPolicy: PolicyState = {
  permissionSummary: 'Carregando politica do assento...',
  backendEnforced: true,
  ownerContinuity: false,
  ownerPrivateVisible: false,
}

export const getServerSideProps: GetServerSideProps<OwnerCommandPageProps> = async ({ req, res }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const loginDestination = {
    destination: '/login?redirect=%2Fowner-command&reason=owner-auth-required',
    permanent: false,
  }

  if (!url || !key) {
    return { redirect: loginDestination }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies
          ? Object.entries(req.cookies).map(([name, value]) => ({ name, value: value ?? '' }))
          : []
      },
      setAll(cookiesToSet) {
        const existing = res.getHeader('Set-Cookie')
        const base = Array.isArray(existing) ? existing : existing ? [String(existing)] : []
        const serialized = cookiesToSet.map(({ name, value, options }) => {
          const parts = [`${name}=${value}`]
          if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`)
          if (options?.domain) parts.push(`Domain=${options.domain}`)
          if (options?.path) parts.push(`Path=${options.path}`)
          if (options?.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`)
          if (options?.httpOnly) parts.push('HttpOnly')
          if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`)
          if (options?.secure) parts.push('Secure')
          return parts.join('; ')
        })
        res.setHeader('Set-Cookie', [...base, ...serialized])
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { redirect: loginDestination }
  }

  return {
    props: {
      initialEmail: session.user.email ?? null,
    },
  }
}

export default function OwnerCommandPage({ initialEmail }: OwnerCommandPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState(initialEmail)
  const [role, setRole] = useState('guest')
  const [isOwner, setIsOwner] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [continuity, setContinuity] = useState<ContinuityState>(initialContinuity)
  const [policy, setPolicy] = useState<PolicyState>(initialPolicy)
  const [error, setError] = useState<string | null>(null)
  const [threadVisibility, setThreadVisibility] = useState('owner_private')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [department, setDepartment] = useState('')
  const [allowedScopes, setAllowedScopes] = useState('')
  const [requiresOwnerApproval, setRequiresOwnerApproval] = useState(false)

  // Owner Executor states
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])
  const [executingCommand, setExecutingCommand] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState('health_check')
  const [listeningToMic, setListeningToMic] = useState(false)
  const [micSupported, setMicSupported] = useState(true)

  // Check Web Speech API support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicSupported(false)
    }
  }, [])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setError('Supabase Auth nao configurado no frontend.')
      setLoading(false)
      return
    }

    let active = true

    async function init() {
      const {
        data: { session },
      } = await sb.auth.getSession()

      if (!active) return

      const accessToken = session?.access_token || null
      const email = session?.user?.email || null
      setSessionToken(accessToken)
      setSessionEmail(email)

      if (!accessToken) {
        router.replace('/login?redirect=%2Fowner-command&reason=owner-auth-required')
        return
      }

      await evaluateContinuity(accessToken)
      if (active) {
        setLoading(false)
      }
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || null
      setSessionToken(accessToken)
      setSessionEmail(session?.user?.email || null)

      if (!accessToken) {
        router.replace('/login?redirect=%2Fowner-command&reason=owner-auth-required')
      }
    })

    init().catch(() => {
      if (!active) return
      setError('Falha ao validar a sessao do Owner Command Chat.')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router])

  async function evaluateContinuity(tokenOverride?: string) {
    const token = tokenOverride || sessionToken
    if (!token) return

    const params = new URLSearchParams()
    if (ownerUserId.trim()) params.set('owner_user_id', ownerUserId.trim())
    if (assignedTo.trim()) params.set('assigned_to', assignedTo.trim())
    if (department.trim()) params.set('department', department.trim())
    if (allowedScopes.trim()) params.set('allowed_scopes', allowedScopes.trim())
    if (threadVisibility.trim()) params.set('visibility', threadVisibility.trim())
    if (requiresOwnerApproval) params.set('requires_owner_approval', 'true')

    const query = params.toString()
    const response = await fetch(`/api/owner-command/chat${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = (await response.json()) as OwnerCommandResponse
    if (!response.ok || !data.success || !data.data) {
      setError(data.error?.message || 'Falha ao avaliar continuidade.')
      return
    }

    setError(null)
    setRole(data.data.role)
    setIsOwner(data.data.owner)
    setContinuity(data.data.continuity)
    setPolicy(data.data.policy)
  }

  async function submitMessage() {
    const trimmed = message.trim()
    if (!trimmed || !sessionToken) return

    setSubmitting(true)
    setError(null)

    const previousMessages = messages
    const nextMessages = [...previousMessages, { role: 'user' as const, content: trimmed }]
    setMessages(nextMessages)
    setMessage('')

    const response = await fetch('/api/owner-command/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        message: trimmed,
        history: previousMessages,
        threadContext: {
          ownerUserId: ownerUserId.trim() || null,
          assignedTo: assignedTo.trim() || null,
          department: department.trim() || null,
          allowedScopes: allowedScopes
            .split(',')
            .map(item => item.trim())
            .filter(Boolean),
          visibility: threadVisibility,
          requiresOwnerApproval,
        },
      }),
    })

    const data = (await response.json()) as OwnerCommandResponse
    if (!response.ok || !data.success || !data.data) {
      setMessages(previousMessages)
      setError(data.error?.message || 'Falha ao enviar mensagem.')
      setSubmitting(false)
      return
    }

    setRole(data.data.role)
    setIsOwner(data.data.owner)
    setContinuity(data.data.continuity)
    setPolicy(data.data.policy)
    setMessages([
      ...nextMessages,
      { role: 'assistant', content: data.data.reply },
    ])
    setSubmitting(false)
  }

  async function handleLogout() {
    const sb = getSupabase()
    if (!sb) {
      router.replace('/login?redirect=%2Fowner-command')
      return
    }

    setSigningOut(true)
    await sb.auth.signOut()
    router.replace('/login?redirect=%2Fowner-command')
  }

  // Start microphone input via Web Speech API
  function startMicrophoneInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Web Speech API nao suportado neste navegador')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setListeningToMic(true)
    }

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      if (transcript) {
        setMessage((prev) => prev + ' ' + transcript)
      }
    }

    recognition.onerror = (event: any) => {
      setError(`Erro microfone: ${event.error}`)
      setListeningToMic(false)
    }

    recognition.onend = () => {
      setListeningToMic(false)
    }

    recognition.start()
  }

  // Handle keyboard in textarea: Enter breaks line, Ctrl+Enter sends
  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      submitMessage()
    }
  }

  // Execute Owner command via API
  async function executeOwnerCommand() {
    if (!isOwner) {
      setError('Apenas Owner pode executar comandos')
      return
    }

    setExecutingCommand(true)
    const logId = `exec_${Date.now()}`

    try {
      const response = await fetch('/api/owner-command/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          command: selectedCommand,
        }),
      })

      const data = await response.json()

      const log: ExecutionLog = {
        id: logId,
        command: selectedCommand,
        status: data.result?.status || 'error',
        result: data.result?.result || data.error?.message,
        timestamp: new Date().toISOString(),
        duration_ms: data.result?.duration_ms || 0,
      }

      setExecutionLogs((prev) => [log, ...prev])

      if (!data.success) {
        setError(`Erro executando comando: ${data.error?.message}`)
      }
    } catch (err) {
      const log: ExecutionLog = {
        id: logId,
        command: selectedCommand,
        status: 'error',
        result: `Network error: ${err instanceof Error ? err.message : 'Unknown'}`,
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      }
      setExecutionLogs((prev) => [log, ...prev])
      setError(`Erro ao executar comando: ${err instanceof Error ? err.message : 'Desconhecido'}`)
    } finally {
      setExecutingCommand(false)
    }
  }

  // Copy log to clipboard
  function copyLogToClipboard() {
    const logText = executionLogs
      .map(
        (log) =>
          `[${log.timestamp}] ${log.command} (${log.status}) - ${log.duration_ms}ms\n${log.result || 'N/A'}`
      )
      .join('\n\n')

    navigator.clipboard
      .writeText(logText)
      .then(() => setError(null))
      .catch(() => setError('Erro ao copiar para clipboard'))
  }

  // Clear local logs
  function clearExecutionLogs() {
    setExecutionLogs([])
  }

  // Print or save as PDF
  function printLogs() {
    window.print()
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.lockShell}>
          <div style={styles.lockCard}>
            <p style={styles.eyebrow}>Owner Command</p>
            <h1 style={styles.lockTitle}>Validando sessao</h1>
            <p style={styles.copy}>
              Confirmando autenticacao Supabase e politicas do assento antes de liberar o console.
            </p>
          </div>
        </section>
      </main>
    )
  }

  if (!sessionToken && !loading) {
    return (
      <main style={styles.page}>
        <section style={styles.lockShell}>
          <div style={styles.lockCard}>
            <p style={styles.eyebrow}>Owner Command</p>
            <h1 style={styles.lockTitle}>Autenticacao obrigatoria</h1>
            <p style={styles.copy}>
              Esta rota exige sessao Supabase Auth valida. Entre com o email autorizado para continuar.
            </p>
            <Link href="/login?redirect=%2Fowner-command" style={styles.loginLink}>
              Entrar
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Owner Command</p>
            <h1 style={styles.title}>Continuity Console</h1>
            <p style={styles.subtitle}>
              Backend enforcement ativo para continuidade global do Owner e restricoes do segundo assento.
            </p>
            <p style={styles.sessionMeta}>
              Sessao autenticada: {sessionEmail || 'usuario autenticado'} {isOwner ? '· owner' : '· seat'}
            </p>
          </div>
          <div style={styles.badges}>
            <span style={styles.badge}>{role}</span>
            <span style={styles.badge}>{isOwner ? 'owner continuity' : continuity.scope}</span>
            <button type="button" onClick={handleLogout} disabled={signingOut} style={styles.ghostButton}>
              {signingOut ? 'Saindo...' : 'Logout'}
            </button>
          </div>
        </header>

        <section style={styles.grid}>
          <aside style={styles.panel}>
            <h2 style={styles.panelTitle}>Seat Policy</h2>
            <p style={styles.copy}>{policy.permissionSummary}</p>
            <p style={styles.copy}>Backend enforced: {policy.backendEnforced ? 'yes' : 'no'}</p>
            <p style={styles.copy}>Owner private visible: {policy.ownerPrivateVisible ? 'yes' : 'no'}</p>
            <p style={styles.copy}>Critical approval: {continuity.canApproveCritical ? 'allowed' : 'owner only'}</p>
          </aside>

          <aside style={styles.panel}>
            <h2 style={styles.panelTitle}>Thread Context</h2>
            <label style={styles.label}>
              Visibility
              <select value={threadVisibility} onChange={e => setThreadVisibility(e.target.value)} style={styles.input}>
                <option value="owner_private">owner_private</option>
                <option value="seat">seat</option>
                <option value="department">department</option>
                <option value="authorized">authorized</option>
                <option value="global">global</option>
              </select>
            </label>
            <label style={styles.label}>
              owner_user_id
              <input value={ownerUserId} onChange={e => setOwnerUserId(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.label}>
              assigned_to
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.label}>
              department
              <input value={department} onChange={e => setDepartment(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.label}>
              allowed_scopes
              <input value={allowedScopes} onChange={e => setAllowedScopes(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.toggle}>
              <input
                type="checkbox"
                checked={requiresOwnerApproval}
                onChange={e => setRequiresOwnerApproval(e.target.checked)}
              />
              requires owner approval
            </label>
            <button type="button" onClick={() => evaluateContinuity()} style={styles.secondaryButton}>
              Revalidate in Backend
            </button>
            <p style={styles.copy}>{continuity.reason}</p>
          </aside>
        </section>

        <section style={styles.chatCard}>
          <div style={styles.chatStream}>
            {messages.length === 0 ? (
              <p style={styles.empty}>
                Nenhuma mensagem ainda. O frontend nao envia system prompt; toda a politica de continuidade e aplicada no backend.
              </p>
            ) : (
              messages.map((entry, index) => (
                <article
                  key={`${entry.role}-${index}`}
                  style={entry.role === 'user' ? styles.userBubble : styles.assistantBubble}
                >
                  <strong style={styles.roleLabel}>{entry.role}</strong>
                  <p style={styles.bubbleText}>{entry.content}</p>
                </article>
              ))
            )}
          </div>

          {/* Owner Executor Section */}
          {isOwner && (
            <section style={styles.executorSection}>
              <h3 style={styles.sectionTitle}>🔴 Owner Executor</h3>
              <div style={styles.executorControls}>
                <select value={selectedCommand} onChange={(e) => setSelectedCommand(e.target.value)} style={styles.commandSelect}>
                  <option value="health_check">Health Check</option>
                  <option value="status_report">Status Report</option>
                  <option value="generate_handoff">Generate Handoff</option>
                  <option value="validate_module">Validate Module</option>
                  <option value="create_report">Create Report</option>
                </select>
                <button
                  type="button"
                  onClick={executeOwnerCommand}
                  disabled={executingCommand}
                  style={styles.executorButton}
                >
                  {executingCommand ? 'Executando...' : 'Executar'}
                </button>
              </div>

              {/* Execution Log */}
              {executionLogs.length > 0 && (
                <div style={styles.logContainer}>
                  <div style={styles.logHeader}>
                    <h4 style={styles.logTitle}>Log de Execução ({executionLogs.length})</h4>
                    <div style={styles.logActions}>
                      <button type="button" onClick={copyLogToClipboard} style={styles.logButton}>
                        📋 Copiar
                      </button>
                      <button type="button" onClick={printLogs} style={styles.logButton}>
                        🖨️ Imprimir
                      </button>
                      <button type="button" onClick={clearExecutionLogs} style={styles.logButton}>
                        🗑️ Limpar
                      </button>
                    </div>
                  </div>
                  <div style={styles.logContent}>
                    {executionLogs.map((log) => (
                      <div key={log.id} style={styles.logEntry}>
                        <div style={styles.logMeta}>
                          <span style={styles.logCommand}>[{log.command}]</span>
                          <span style={styles.logStatus(log.status)}>{log.status}</span>
                          <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span style={styles.logDuration}>{log.duration_ms}ms</span>
                        </div>
                        {log.result && <pre style={styles.logResult}>{log.result}</pre>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {!isOwner && (
            <div style={styles.blockedMessage}>
              <p>🔒 Owner Executor é acessível apenas para Owner (você não é Owner)</p>
            </div>
          )}

          <div style={styles.composer}>
            <div style={styles.textareaContainer}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Continue um fluxo operacional com enforcement backend... (Ctrl+Enter para enviar, Enter para quebra de linha)"
                style={styles.textarea}
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={startMicrophoneInput}
                  disabled={listeningToMic}
                  style={{
                    ...styles.micButton,
                    opacity: listeningToMic ? 0.6 : 1,
                  }}
                  title={listeningToMic ? 'Ouvindo...' : 'Clique para ditar (Web Speech API)'}
                >
                  {listeningToMic ? '🎤 Ouvindo...' : '🎤'}
                </button>
              )}
            </div>
            <button type="button" onClick={submitMessage} disabled={submitting || loading} style={styles.primaryButton}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </section>

        {error ? <p style={styles.error}>{error}</p> : null}
      </section>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(198,240,255,0.26), transparent 30%), linear-gradient(135deg, #08141f 0%, #132739 42%, #f0ede5 100%)',
    color: '#f7f4ed',
    padding: '32px 20px 56px',
  },
  shell: {
    maxWidth: 1120,
    margin: '0 auto',
    display: 'grid',
    gap: 20,
  },
  lockShell: {
    minHeight: 'calc(100vh - 88px)',
    display: 'grid',
    placeItems: 'center',
  },
  lockCard: {
    maxWidth: 520,
    background: 'rgba(7, 15, 24, 0.78)',
    border: '1px solid rgba(195, 228, 244, 0.18)',
    borderRadius: 28,
    padding: 28,
    display: 'grid',
    gap: 16,
    backdropFilter: 'blur(16px)',
  },
  lockTitle: {
    margin: 0,
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    lineHeight: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    background: 'rgba(7, 15, 24, 0.72)',
    border: '1px solid rgba(195, 228, 244, 0.18)',
    borderRadius: 24,
    padding: 24,
    backdropFilter: 'blur(16px)',
  },
  eyebrow: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.26em',
    fontSize: 12,
    color: '#8fd5ff',
  },
  title: {
    margin: '10px 0 8px',
    fontSize: 'clamp(2rem, 5vw, 4rem)',
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    maxWidth: 640,
    color: 'rgba(247, 244, 237, 0.78)',
  },
  sessionMeta: {
    margin: '10px 0 0',
    color: 'rgba(216, 242, 255, 0.88)',
    fontSize: 13,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  badges: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  badge: {
    alignSelf: 'flex-start',
    padding: '10px 14px',
    borderRadius: 999,
    background: 'rgba(143, 213, 255, 0.14)',
    border: '1px solid rgba(143, 213, 255, 0.3)',
    color: '#d8f2ff',
    fontSize: 13,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  ghostButton: {
    alignSelf: 'flex-start',
    border: '1px solid rgba(245, 209, 134, 0.28)',
    background: 'rgba(245, 209, 134, 0.12)',
    color: '#f6e2b3',
    padding: '10px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  panel: {
    background: 'rgba(7, 15, 24, 0.68)',
    border: '1px solid rgba(195, 228, 244, 0.18)',
    borderRadius: 24,
    padding: 20,
    display: 'grid',
    gap: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
  },
  copy: {
    margin: 0,
    color: 'rgba(247, 244, 237, 0.82)',
    lineHeight: 1.5,
  },
  label: {
    display: 'grid',
    gap: 6,
    fontSize: 13,
    color: '#cbe5f2',
  },
  input: {
    borderRadius: 14,
    border: '1px solid rgba(195, 228, 244, 0.18)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
    padding: '12px 14px',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: '#cbe5f2',
  },
  secondaryButton: {
    border: '1px solid rgba(143, 213, 255, 0.28)',
    background: 'rgba(143, 213, 255, 0.12)',
    color: '#e7f8ff',
    padding: '12px 16px',
    borderRadius: 14,
    cursor: 'pointer',
  },
  chatCard: {
    background: 'rgba(7, 15, 24, 0.76)',
    border: '1px solid rgba(195, 228, 244, 0.18)',
    borderRadius: 24,
    padding: 20,
    display: 'grid',
    gap: 18,
  },
  chatStream: {
    minHeight: 280,
    display: 'grid',
    gap: 14,
  },
  empty: {
    margin: 0,
    color: 'rgba(247, 244, 237, 0.72)',
    lineHeight: 1.6,
  },
  userBubble: {
    justifySelf: 'end',
    maxWidth: '78%',
    padding: 16,
    borderRadius: '22px 22px 6px 22px',
    background: 'linear-gradient(135deg, #8fd5ff, #1b7cb3)',
    color: '#041019',
  },
  assistantBubble: {
    justifySelf: 'start',
    maxWidth: '78%',
    padding: 16,
    borderRadius: '22px 22px 22px 6px',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#f7f4ed',
    border: '1px solid rgba(195, 228, 244, 0.16)',
  },
  roleLabel: {
    display: 'block',
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  bubbleText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.55,
  },
  composer: {
    display: 'grid',
    gap: 12,
  },
  textarea: {
    minHeight: 120,
    borderRadius: 18,
    border: '1px solid rgba(195, 228, 244, 0.18)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
    padding: 16,
    resize: 'vertical',
    fontFamily: 'monospace',
  },
  textareaContainer: {
    position: 'relative' as const,
    display: 'grid',
  },
  micButton: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 999,
    border: '1px solid rgba(195, 228, 244, 0.3)',
    background: 'rgba(143, 213, 255, 0.14)',
    color: '#d8f2ff',
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  executorSection: {
    background: 'rgba(7, 15, 24, 0.68)',
    border: '2px solid rgba(255, 69, 0, 0.4)',
    borderRadius: 24,
    padding: 20,
    display: 'grid',
    gap: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    color: '#ff5722',
    fontWeight: 700,
  },
  executorControls: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 12,
  },
  commandSelect: {
    borderRadius: 12,
    border: '1px solid rgba(195, 228, 244, 0.18)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  executorButton: {
    borderRadius: 12,
    border: 'none',
    background: '#ff5722',
    color: '#fff',
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  logContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    display: 'grid',
    gap: 12,
    maxHeight: 400,
    overflow: 'hidden',
    display: 'flex' as any,
    flexDirection: 'column' as any,
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTitle: {
    margin: 0,
    fontSize: 14,
    color: '#d8f2ff',
  },
  logActions: {
    display: 'flex',
    gap: 8,
  },
  logButton: {
    borderRadius: 6,
    border: 'none',
    background: 'rgba(143, 213, 255, 0.14)',
    color: '#d8f2ff',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  logContent: {
    overflowY: 'auto' as const,
    display: 'grid',
    gap: 8,
  },
  logEntry: {
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 12,
    borderLeft: '3px solid rgba(143, 213, 255, 0.3)',
    fontSize: 12,
  },
  logMeta: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  },
  logCommand: {
    color: '#d8f2ff',
    fontWeight: 700 as any,
  },
  logStatus: (status: string) => ({
    color: status === 'success' ? '#4caf50' : status === 'error' ? '#f44336' : '#ff9800',
    fontWeight: 700 as any,
  }),
  logTime: {
    color: 'rgba(215, 242, 255, 0.6)',
  },
  logDuration: {
    color: 'rgba(215, 242, 255, 0.6)',
    fontSize: 11,
  },
  logResult: {
    margin: 0,
    padding: 8,
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 4,
    color: '#4caf50',
    fontSize: 11,
    overflow: 'auto' as const,
    maxHeight: 150,
    fontFamily: 'monospace',
  },
  blockedMessage: {
    background: 'rgba(255, 69, 0, 0.1)',
    border: '1px solid rgba(255, 69, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#ff9999',
    textAlign: 'center' as const,
  },
  primaryButton: {
    justifySelf: 'start',
    border: 'none',
    background: 'linear-gradient(135deg, #f5d186, #ff8f5b)',
    color: '#17120a',
    padding: '13px 18px',
    borderRadius: 14,
    cursor: 'pointer',
    fontWeight: 700,
  },
  loginLink: {
    justifySelf: 'start',
    textDecoration: 'none',
    border: 'none',
    background: 'linear-gradient(135deg, #f5d186, #ff8f5b)',
    color: '#17120a',
    padding: '13px 18px',
    borderRadius: 14,
    fontWeight: 700,
  },
  error: {
    margin: 0,
    color: '#ffd7d7',
    background: 'rgba(130, 14, 32, 0.4)',
    border: '1px solid rgba(255, 169, 169, 0.24)',
    padding: '14px 16px',
    borderRadius: 16,
  },
}
