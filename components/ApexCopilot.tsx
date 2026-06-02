import { useRouter } from 'next/router'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { getSupabase } from '../lib/supabase'

type Mode = 'manual' | 'supervisor' | 'status'
type Msg = { role: 'user' | 'assistant'; text: string }
type Pos = { x: number; y: number }
type DragTarget = 'launcher' | 'panel' | null

type StoredState = {
  launcherPos?: Pos
  panelPos?: Pos
  open?: boolean
  minimized?: boolean
  fullscreen?: boolean
}

type ChatContext = {
  role: string
  owner: boolean
  email: string | null
}

const STORAGE_KEY = 'apex_copilot_v3'
const MOBILE_BREAKPOINT = 820
const PANEL_WIDTH = 430
const PANEL_HEIGHT = 610
const FULLSCREEN_MARGIN = 18
const MOBILE_MARGIN = 10
const LAUNCHER_WIDTH = 98
const LAUNCHER_HEIGHT = 48
const DRAG_THRESHOLD = 6

const INITIAL_ASSISTANT_MESSAGE: Msg = {
  role: 'assistant',
  text: 'Apex AI pronto. Posso orientar uso da plataforma, supervisionar uma acao ou resumir status atual.',
}

const MODE_LABEL: Record<Mode, string> = {
  manual: 'Manual',
  supervisor: 'Supervisor',
  status: 'Status',
}

function readAssistantText(payload: any): string {
  if (typeof payload?.content?.[0]?.text === 'string' && payload.content[0].text.trim()) {
    return payload.content[0].text.trim()
  }
  if (typeof payload?.reply === 'string' && payload.reply.trim()) {
    return payload.reply.trim()
  }
  return ''
}

export default function ApexCopilot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [viewport, setViewport] = useState({ w: 1280, h: 720 })
  const [launcherPos, setLauncherPos] = useState<Pos | null>(null)
  const [panelPos, setPanelPos] = useState<Pos | null>(null)
  const [dragging, setDragging] = useState<DragTarget>(null)
  const [mode, setMode] = useState<Mode>('manual')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([INITIAL_ASSISTANT_MESSAGE])
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [chatContext, setChatContext] = useState<ChatContext>({
    role: 'guest',
    owner: false,
    email: null,
  })

  const dragStart = useRef<{
    pointerX: number
    pointerY: number
    startX: number
    startY: number
    target: DragTarget
    moved: boolean
  } | null>(null)
  const suppressLauncherClick = useRef(false)

  const isMobile = viewport.w <= MOBILE_BREAKPOINT

  const panelSize = useMemo(() => {
    if (fullscreen) {
      const margin = isMobile ? MOBILE_MARGIN : FULLSCREEN_MARGIN
      return {
        width: Math.max(280, viewport.w - margin * 2),
        height: Math.max(320, viewport.h - margin * 2),
      }
    }
    if (isMobile) {
      return {
        width: Math.max(280, viewport.w - MOBILE_MARGIN * 2),
        height: Math.max(320, viewport.h - MOBILE_MARGIN * 2),
      }
    }
    return { width: PANEL_WIDTH, height: PANEL_HEIGHT }
  }, [fullscreen, isMobile, viewport.h, viewport.w])

  function getLauncherDefaultPosition(): Pos {
    return {
      x: Math.max(MOBILE_MARGIN, viewport.w - LAUNCHER_WIDTH - 18),
      y: Math.max(MOBILE_MARGIN, viewport.h - LAUNCHER_HEIGHT - 18),
    }
  }

  function clampLauncherPosition(next: Pos): Pos {
    const maxX = Math.max(MOBILE_MARGIN, viewport.w - LAUNCHER_WIDTH - MOBILE_MARGIN)
    const maxY = Math.max(MOBILE_MARGIN, viewport.h - LAUNCHER_HEIGHT - MOBILE_MARGIN)
    return {
      x: Math.min(Math.max(MOBILE_MARGIN, next.x), maxX),
      y: Math.min(Math.max(MOBILE_MARGIN, next.y), maxY),
    }
  }

  function clampPanelPosition(next: Pos): Pos {
    if (fullscreen) {
      const margin = isMobile ? MOBILE_MARGIN : FULLSCREEN_MARGIN
      return { x: margin, y: margin }
    }

    const margin = isMobile ? MOBILE_MARGIN : MOBILE_MARGIN
    const maxX = Math.max(margin, viewport.w - panelSize.width - margin)
    const maxY = Math.max(margin, viewport.h - panelSize.height - margin)
    return {
      x: Math.min(Math.max(margin, next.x), maxX),
      y: Math.min(Math.max(margin, next.y), maxY),
    }
  }

  function getPanelDefaultPosition(): Pos {
    return clampPanelPosition({
      x: Math.max(MOBILE_MARGIN, viewport.w - panelSize.width - 18),
      y: Math.max(MOBILE_MARGIN, viewport.h - panelSize.height - 84),
    })
  }

  function persistState(next?: Partial<StoredState>) {
    if (!mounted) return
    const payload: StoredState = {
      launcherPos: launcherPos || undefined,
      panelPos: panelPos || undefined,
      open,
      minimized,
      fullscreen,
      ...next,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  useEffect(() => {
    setMounted(true)
    const syncViewport = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    }
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const defaults = {
        launcherPos: getLauncherDefaultPosition(),
        panelPos: getPanelDefaultPosition(),
      }

      if (!raw) {
        setLauncherPos(defaults.launcherPos)
        setPanelPos(defaults.panelPos)
        return
      }

      const parsed = JSON.parse(raw) as StoredState
      setOpen(Boolean(parsed.open))
      setMinimized(Boolean(parsed.minimized))
      setFullscreen(Boolean(parsed.fullscreen))
      setLauncherPos(
        parsed.launcherPos && typeof parsed.launcherPos.x === 'number' && typeof parsed.launcherPos.y === 'number'
          ? clampLauncherPosition(parsed.launcherPos)
          : defaults.launcherPos,
      )
      setPanelPos(
        parsed.panelPos && typeof parsed.panelPos.x === 'number' && typeof parsed.panelPos.y === 'number'
          ? clampPanelPosition(parsed.panelPos)
          : defaults.panelPos,
      )
    } catch {
      setLauncherPos(getLauncherDefaultPosition())
      setPanelPos(getPanelDefaultPosition())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    persistState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, launcherPos, panelPos, open, minimized, fullscreen])

  useEffect(() => {
    if (!launcherPos || !panelPos) return
    setLauncherPos(prev => (prev ? clampLauncherPosition(prev) : prev))
    setPanelPos(prev => (prev ? clampPanelPosition(prev) : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelSize.height, panelSize.width, viewport.h, viewport.w, fullscreen])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    let active = true

    async function syncSession() {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (!active) return
      setAuthToken(session?.access_token || null)
      setChatContext(prev => ({
        ...prev,
        email: session?.user?.email || null,
      }))
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token || null)
      setChatContext(prev => ({
        ...prev,
        email: session?.user?.email || null,
      }))
    })

    syncSession().catch(() => {
      setAuthToken(null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: PointerEvent) => {
      if (!dragStart.current) return

      const deltaX = event.clientX - dragStart.current.pointerX
      const deltaY = event.clientY - dragStart.current.pointerY
      if (Math.abs(deltaX) >= DRAG_THRESHOLD || Math.abs(deltaY) >= DRAG_THRESHOLD) {
        dragStart.current.moved = true
      }

      if (dragStart.current.target === 'launcher') {
        setLauncherPos(
          clampLauncherPosition({
            x: dragStart.current.startX + deltaX,
            y: dragStart.current.startY + deltaY,
          }),
        )
        return
      }

      if (dragStart.current.target === 'panel' && !fullscreen) {
        setPanelPos(
          clampPanelPosition({
            x: dragStart.current.startX + deltaX,
            y: dragStart.current.startY + deltaY,
          }),
        )
      }
    }

    const onUp = () => {
      if (dragStart.current?.target === 'launcher' && dragStart.current.moved) {
        suppressLauncherClick.current = true
        window.setTimeout(() => {
          suppressLauncherClick.current = false
        }, 0)
      }
      setDragging(null)
      dragStart.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, fullscreen, viewport.h, viewport.w, panelSize.height, panelSize.width])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return

    setInput('')
    const nextMessages: Msg[] = [...messages, { role: 'user', text: question }]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 900,
          messages: [
            {
              role: 'user',
              content: `Modo: ${MODE_LABEL[mode]}\nPagina atual: ${router.pathname}\nPergunta: ${question}`,
            },
          ],
        }),
      })
      const data = await res.json()
      setChatContext({
        role: data?.apex_context?.role || (authToken ? 'user' : 'guest'),
        owner: Boolean(data?.apex_context?.is_owner),
        email: data?.apex_context?.email || chatContext.email || null,
      })

      if (!res.ok) {
        const serverError = data?.error?.message || 'API indisponivel no momento.'
        setMessages(prev => [...prev, { role: 'assistant', text: `Nao consegui concluir agora: ${serverError}` }])
        return
      }

      const reply = readAssistantText(data)
      if (reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', text: 'Nao consegui obter resposta valida do Copilot.' }])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sem conexao com o servidor do Copilot. Verifique sua internet ou tente novamente em instantes.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function beginDrag(
    event: ReactPointerEvent<HTMLElement>,
    target: DragTarget,
    currentPosition: Pos | null,
  ) {
    if (!currentPosition) return
    if (target === 'panel' && (isMobile || fullscreen)) return
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: currentPosition.x,
      startY: currentPosition.y,
      target,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(target)
  }

  function toggleOpenFromLauncher() {
    if (suppressLauncherClick.current) return
    setOpen(value => !value)
    setMinimized(false)
  }

  function clearConversation() {
    setMessages([INITIAL_ASSISTANT_MESSAGE])
  }

  const quickActions = [
    { label: 'Status Master 001', text: 'Resuma o status atual do Pacote Master 001 e o proximo passo.' },
    { label: 'Como usar Nova Analise', text: 'Explique como usar a tela Nova Analise para criar um projeto automatico.' },
    { label: 'Abrir Mission Control', text: '' },
  ]

  const activeLauncherPos = launcherPos || getLauncherDefaultPosition()
  const activePanelPos =
    fullscreen
      ? { x: isMobile ? MOBILE_MARGIN : FULLSCREEN_MARGIN, y: isMobile ? MOBILE_MARGIN : FULLSCREEN_MARGIN }
      : panelPos || getPanelDefaultPosition()

  const seatLabel = chatContext.owner ? 'Owner' : chatContext.role === 'guest' ? 'Guest' : chatContext.role

  return (
    <>
      <button
        onPointerDown={event => beginDrag(event, 'launcher', activeLauncherPos)}
        onClick={toggleOpenFromLauncher}
        title="Apex AI Copilot"
        style={{
          position: 'fixed',
          left: activeLauncherPos.x,
          top: activeLauncherPos.y,
          zIndex: 30000,
          border: 0,
          borderRadius: 999,
          background: open ? '#1f3f5d' : '#0f4c81',
          color: '#fff',
          padding: '12px 16px',
          minWidth: LAUNCHER_WIDTH,
          minHeight: LAUNCHER_HEIGHT,
          fontSize: 12,
          fontWeight: 900,
          boxShadow: '0 12px 30px rgba(0,0,0,.26)',
          cursor: dragging === 'launcher' ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        Apex AI
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            left: activePanelPos.x,
            top: activePanelPos.y,
            width: panelSize.width,
            height: minimized ? (isMobile ? 64 : 56) : panelSize.height,
            zIndex: 30001,
            background: '#fff',
            border: '1px solid #d8e0ee',
            borderRadius: fullscreen ? 20 : 10,
            boxShadow: '0 18px 60px rgba(0,0,0,.28)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Geist', system-ui, sans-serif",
            transition: dragging ? 'none' : 'height 140ms ease, width 140ms ease',
          }}
        >
          <div
            onPointerDown={event => beginDrag(event, 'panel', activePanelPos)}
            style={{
              padding: '10px 12px',
              background: '#0f4c81',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              cursor: fullscreen || isMobile ? 'default' : dragging === 'panel' ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Apex AI</div>
              <div style={{ fontSize: 10, opacity: 0.82 }}>
                {chatContext.owner ? 'Owner/Dr. Edgard ativo' : `Contexto ${seatLabel}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onPointerDown={event => event.stopPropagation()}
                onClick={() => setFullscreen(value => !value)}
                style={controlButtonStyle}
                title={fullscreen ? 'Sair do fullscreen' : 'Expandir'}
              >
                {fullscreen ? '⤢' : '⛶'}
              </button>
              <button
                onPointerDown={event => event.stopPropagation()}
                onClick={() => setMinimized(value => !value)}
                style={controlButtonStyle}
                title={minimized ? 'Maximizar' : 'Minimizar'}
              >
                {minimized ? '+' : '−'}
              </button>
              <button
                onPointerDown={event => event.stopPropagation()}
                onClick={() => setOpen(false)}
                style={controlButtonStyle}
                title="Fechar"
              >
                x
              </button>
            </div>
          </div>

          {!minimized && (
            <div style={{ display: 'flex', gap: 6, padding: 10, borderBottom: '1px solid #e2e8f0' }}>
              {(['manual', 'supervisor', 'status'] as Mode[]).map(item => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  style={{
                    flex: 1,
                    border: '1px solid #d8e0ee',
                    borderRadius: 7,
                    background: mode === item ? '#edf3ff' : '#fff',
                    color: mode === item ? '#0f4c81' : '#667085',
                    padding: '7px 8px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {MODE_LABEL[item]}
                </button>
              ))}
            </div>
          )}

          {!minimized && (
            <div style={{ padding: 12, display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => (action.text ? send(action.text) : router.push('/mission-control'))}
                  style={pillButtonStyle}
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={clearConversation}
                style={{
                  ...pillButtonStyle,
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 700,
                }}
              >
                Limpar conversa
              </button>
            </div>
          )}

          {!minimized && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    background: message.role === 'user' ? '#0f4c81' : '#f3f6fb',
                    color: message.role === 'user' ? '#fff' : '#172033',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 12,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.text}
                </div>
              ))}
              {loading && <div style={{ fontSize: 12, color: '#667085' }}>Apex AI analisando...</div>}
            </div>
          )}

          {!minimized && (
            <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') send()
                }}
                placeholder={`Perguntar no modo ${MODE_LABEL[mode]}`}
                style={{ flex: 1, border: '1px solid #cfd6e4', borderRadius: 8, padding: '9px 10px', fontSize: 12 }}
              />
              <button
                onClick={() => send()}
                disabled={loading}
                style={{
                  border: 0,
                  borderRadius: 8,
                  background: '#0f4c81',
                  color: '#fff',
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

const controlButtonStyle = {
  border: 0,
  background: 'rgba(255,255,255,.14)',
  color: '#fff',
  fontSize: 14,
  borderRadius: 6,
  width: 28,
  height: 28,
  cursor: 'pointer',
} as const

const pillButtonStyle = {
  border: '1px solid #d8e0ee',
  background: '#f8fafc',
  color: '#0f4c81',
  borderRadius: 999,
  padding: '6px 9px',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
} as const
