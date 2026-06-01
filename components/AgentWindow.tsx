import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'

type AgentFinding = {
  title: string
  severity: 'baixa' | 'media' | 'alta'
  detail: string
}

type AgentAction = {
  id: string
  label: string
  description: string
  status: 'proposta' | 'dry_run' | 'executada' | 'bloqueada'
  result?: string
}

type AgentArtifact = {
  name: string
  type: string
  content: string
}

type AgentTurn = {
  message: string
  findings: AgentFinding[]
  actions: AgentAction[]
  artifacts: AgentArtifact[]
}

type Props = {
  moduleKey: string
  title: string
  defaultMessage: string
  projectId?: string | null
  context?: Record<string, unknown>
  accent?: string
  dark?: boolean
}

function normalizeOutput(raw: string): AgentTurn {
  const text = raw?.trim() || 'Analise concluida sem retorno textual.'
  return {
    message: text,
    findings: [
      {
        title: 'Analise concluida',
        severity: 'media',
        detail: text.slice(0, 280),
      },
    ],
    actions: [
      {
        id: `act_${Date.now()}`,
        label: 'Criar tarefa de revisao',
        description: 'Registrar uma tarefa interna para revisar os achados do agente antes de alterar o projeto.',
        status: 'proposta',
      },
    ],
    artifacts: [
      {
        name: `relatorio-${Date.now()}.md`,
        type: 'markdown',
        content: text,
      },
    ],
  }
}

function safeProjectId(value: unknown) {
  if (typeof value !== 'string') return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null
}

export default function AgentWindow({
  moduleKey,
  title,
  defaultMessage,
  projectId,
  context = {},
  accent = '#185FA5',
  dark = false,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(defaultMessage)
  const [turns, setTurns] = useState<AgentTurn[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const resolvedProjectId = useMemo(() => {
    return projectId || safeProjectId(router.query.project_id) || safeProjectId(router.query.id)
  }, [projectId, router.query.id, router.query.project_id])

  useEffect(() => {
    async function loadHistory() {
      if (!resolvedProjectId) return
      const sb = getSupabase()
      if (!sb) return

      const { data } = await sb
        .from('agent_events')
        .select('payload,summary,created_at')
        .eq('project_id', resolvedProjectId)
        .eq('source_agent', `AgentWindow_${moduleKey}`)
        .order('created_at', { ascending: true })
        .limit(10)

      const loaded = (data ?? [])
        .map((row: any) => row?.payload?.agent_window_turn)
        .filter(Boolean) as AgentTurn[]

      if (loaded.length) setTurns(loaded)
    }

    loadHistory()
  }, [moduleKey, resolvedProjectId])

  async function persistTurn(turn: AgentTurn, prompt: string) {
    if (!resolvedProjectId) return
    const sb = getSupabase()
    if (!sb) return

    const { data: sessionData } = await sb.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return

    const res = await fetch('/api/agent-events/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_id: resolvedProjectId,
        source_agent: `AgentWindow_${moduleKey}`,
        event_type: 'documento_processado',
        priority: 'medio',
        status: 'pendente',
        summary: `${title}: ${turn.message.slice(0, 140)}`,
        payload: {
          prompt,
          module_key: moduleKey,
          agent_window_turn: turn,
        },
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) setNotice(`Historico local exibido. Supabase nao registrou o evento: ${data?.error || 'erro desconhecido'}`)
  }

  async function runAgent() {
    setRunning(true)
    setError('')
    setNotice('')

    try {
      const mode =
        typeof context?.mode === 'string'
          ? context.mode
          : typeof context?.action === 'string'
          ? context.action
          : 'analyze'

      const lightweightPrompt = [
        `module: ${moduleKey}`,
        `page: ${router.pathname}`,
        `project_id: ${resolvedProjectId ?? 'none'}`,
        `action: ${mode}`,
        `question: ${message}`,
      ].join('\n')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 900,
          messages: [
            {
              role: 'user',
              content: lightweightPrompt,
            },
          ],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || 'Falha ao consultar o Help AI.')
      }

      const output = data?.content?.[0]?.text || JSON.stringify(data, null, 2)
      const turn = normalizeOutput(output)
      if (turn.message.toLowerCase().includes('bloqueado por governanca')) {
        setNotice('Resposta bloqueada por governanca Apex para este contexto.')
      }
      setTurns(prev => [...prev, turn])
      await persistTurn(turn, message)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao consultar agente.'
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError('Sem conexao com o servidor do Help AI. Verifique rede/API e tente novamente.')
      } else {
        setError(msg)
      }
    } finally {
      setRunning(false)
    }
  }

  async function executeAction(action: AgentAction, dryRun: boolean) {
    setError('')
    setNotice('')

    try {
      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: action.id,
          type: 'task_creation',
          category: 'routine',
          description: action.description,
          requestedBy: `AgentWindow_${moduleKey}`,
          projectId: resolvedProjectId ?? undefined,
          dryRun,
          payload: {
            title: action.label,
            module: moduleKey,
            project_id: resolvedProjectId,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao executar acao.')

      const status = dryRun ? 'dry_run' : 'executada'
      setTurns(prev => prev.map(turn => ({
        ...turn,
        actions: turn.actions.map(item => item.id === action.id
          ? { ...item, status, result: JSON.stringify(data.results?.[0] ?? data) }
          : item),
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar acao.')
    }
  }

  const colors = {
    bg: dark ? '#101827' : '#ffffff',
    fg: dark ? '#e5edf8' : '#182033',
    muted: dark ? '#93a4b8' : '#667085',
    border: dark ? '#263449' : '#d8e0ee',
    panel: dark ? '#162236' : '#f8fafc',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          zIndex: 20000,
          border: 0,
          borderRadius: 999,
          background: accent,
          color: '#fff',
          padding: '11px 16px',
          fontSize: 12,
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(0,0,0,.22)',
          cursor: 'pointer',
        }}
      >
        AI
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          right: 18,
          bottom: 70,
          width: 'min(460px, calc(100vw - 28px))',
          maxHeight: 'min(720px, calc(100vh - 96px))',
          zIndex: 20001,
          background: colors.bg,
          color: colors.fg,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          boxShadow: '0 18px 60px rgba(0,0,0,.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{title}</div>
              <div style={{ fontSize: 11, color: colors.muted }}>message · findings · actions · artifacts</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 0, background: 'transparent', color: colors.muted, cursor: 'pointer', fontSize: 18 }}>x</button>
          </div>

          <div style={{ padding: 14, overflowY: 'auto' }}>
            {error && <div style={{ background: '#fff1f1', color: '#9d1c1c', border: '1px solid #f1b5b5', borderRadius: 8, padding: 9, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            {notice && <div style={{ background: '#fff8e6', color: '#744c00', border: '1px solid #e8c36c', borderRadius: 8, padding: 9, fontSize: 12, marginBottom: 10 }}>{notice}</div>}

            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              style={{
                width: '100%',
                minHeight: 94,
                resize: 'vertical',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 10,
                background: colors.panel,
                color: colors.fg,
                fontFamily: 'inherit',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={runAgent}
              disabled={running || !message.trim()}
              style={{ width: '100%', marginTop: 10, border: 0, borderRadius: 8, padding: '10px 12px', background: accent, color: '#fff', fontWeight: 800, cursor: running ? 'wait' : 'pointer' }}
            >
              {running ? 'Analisando...' : 'Analisar com agente'}
            </button>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {turns.map((turn, index) => (
                <div key={`${turn.message.slice(0, 20)}-${index}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.panel, padding: 10 }}>
                  <div style={{ fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{turn.message}</div>

                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: colors.muted }}>Findings</div>
                  {turn.findings.map(finding => (
                    <div key={finding.title} style={{ fontSize: 11, padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                      <strong>{finding.title}</strong> · {finding.severity}<br />{finding.detail}
                    </div>
                  ))}

                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: colors.muted }}>Actions</div>
                  {turn.actions.map(action => (
                    <div key={action.id} style={{ fontSize: 11, paddingTop: 7 }}>
                      <strong>{action.label}</strong> · {action.status}
                      <div style={{ color: colors.muted, marginTop: 2 }}>{action.description}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => executeAction(action, true)} style={{ border: `1px solid ${colors.border}`, background: colors.bg, color: colors.fg, borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>Dry run</button>
                        <button onClick={() => executeAction(action, false)} style={{ border: 0, background: accent, color: '#fff', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>Executar</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: colors.muted }}>Artifacts</div>
                  {turn.artifacts.map(artifact => (
                    <details key={artifact.name} style={{ fontSize: 11, marginTop: 6 }}>
                      <summary>{artifact.name}</summary>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, lineHeight: 1.5, overflowX: 'auto' }}>{artifact.content}</pre>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
