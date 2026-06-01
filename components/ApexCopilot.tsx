import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

type Mode = 'manual' | 'supervisor' | 'status'
type Msg = { role: 'user' | 'assistant'; text: string }
type Pos = { x: number; y: number }

const STORAGE_KEY = 'apex_copilot_v2'
const MOBILE_BREAKPOINT = 820
const PANEL_WIDTH = 430
const PANEL_HEIGHT = 610
const MOBILE_MARGIN = 10

const INITIAL_ASSISTANT_MESSAGE: Msg = {
  role: 'assistant',
  text: 'Apex AI pronto. Posso orientar uso da plataforma, supervisionar uma acao ou resumir status atual.',
}

const MODE_LABEL: Record<Mode, string> = {
  manual: 'Manual',
  supervisor: 'Supervisor',
  status: 'Status',
}

export default function ApexCopilot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [viewport, setViewport] = useState({ w: 1280, h: 720 })
  const [position, setPosition] = useState<Pos | null>(null)
  const [dragging, setDragging] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([INITIAL_ASSISTANT_MESSAGE])

  const dragStart = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null)
  const isMobile = viewport.w <= MOBILE_BREAKPOINT

  const panelSize = useMemo(() => {
    if (isMobile) {
      return {
        width: Math.max(280, viewport.w - MOBILE_MARGIN * 2),
        height: Math.max(320, viewport.h - MOBILE_MARGIN * 2),
      }
    }
    return { width: PANEL_WIDTH, height: PANEL_HEIGHT }
  }, [isMobile, viewport.h, viewport.w])

  function clampPosition(next: Pos): Pos {
    const maxX = Math.max(0, viewport.w - panelSize.width - MOBILE_MARGIN)
    const maxY = Math.max(0, viewport.h - panelSize.height - MOBILE_MARGIN)
    return {
      x: Math.min(Math.max(MOBILE_MARGIN, next.x), maxX),
      y: Math.min(Math.max(MOBILE_MARGIN, next.y), maxY),
    }
  }

  function getDefaultPosition(): Pos {
    const x = Math.max(MOBILE_MARGIN, viewport.w - panelSize.width - 18)
    const y = Math.max(MOBILE_MARGIN, viewport.h - panelSize.height - 84)
    return clampPosition({ x, y })
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
      if (!raw) {
        setPosition(getDefaultPosition())
        return
      }
      const parsed = JSON.parse(raw) as { open?: boolean; minimized?: boolean; pos?: Pos }
      if (typeof parsed.open === 'boolean') setOpen(parsed.open)
      if (typeof parsed.minimized === 'boolean') setMinimized(parsed.minimized)
      if (parsed.pos && typeof parsed.pos.x === 'number' && typeof parsed.pos.y === 'number') {
        setPosition(clampPosition(parsed.pos))
      } else {
        setPosition(getDefaultPosition())
      }
    } catch {
      setPosition(getDefaultPosition())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  useEffect(() => {
    if (!mounted || !position) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, minimized, pos: position }))
  }, [mounted, minimized, open, position])

  useEffect(() => {
    if (!position) return
    setPosition(prev => (prev ? clampPosition(prev) : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelSize.height, panelSize.width, viewport.h, viewport.w])

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: MouseEvent) => {
      if (!dragStart.current || isMobile) return
      const deltaX = event.clientX - dragStart.current.mouseX
      const deltaY = event.clientY - dragStart.current.mouseY
      setPosition(
        clampPosition({
          x: dragStart.current.startX + deltaX,
          y: dragStart.current.startY + deltaY,
        })
      )
    }

    const onUp = () => {
      setDragging(false)
      dragStart.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, isMobile, panelSize.height, panelSize.width, viewport.h, viewport.w])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return

    setInput('')
    const nextMessages: Msg[] = [...messages, { role: 'user', text: question }]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!res.ok) {
        const serverError = data?.error?.message || 'API indisponivel no momento.'
        setMessages(prev => [...prev, { role: 'assistant', text: `Nao consegui concluir agora: ${serverError}` }])
        return
      }

      const reply = data?.content?.[0]?.text
      if (typeof reply === 'string' && reply.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', text: 'Nao consegui obter resposta valida do Copilot.' }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sem conexao com o servidor do Copilot. Verifique sua internet ou tente novamente em instantes.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function startDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (isMobile || !position) return
    dragStart.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      startX: position.x,
      startY: position.y,
    }
    setDragging(true)
  }

  function clearConversation() {
    setMessages([INITIAL_ASSISTANT_MESSAGE])
  }

  const quickActions = [
    { label: 'Status Master 001', text: 'Resuma o status atual do Pacote Master 001 e o proximo passo.' },
    { label: 'Como usar Nova Analise', text: 'Explique como usar a tela Nova Analise para criar um projeto automatico.' },
    { label: 'Abrir Mission Control', text: '' },
  ]

  return (
    <>
      <button
        onClick={() => {
          setOpen(v => !v)
          setMinimized(false)
        }}
        title="Apex AI Copilot"
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          zIndex: 30000,
          border: 0,
          borderRadius: 999,
          background: open ? '#1f3f5d' : '#0f4c81',
          color: '#fff',
          padding: '12px 16px',
          fontSize: 12,
          fontWeight: 900,
          boxShadow: '0 12px 30px rgba(0,0,0,.26)',
          cursor: 'pointer',
        }}
      >
        Apex AI
      </button>

      {open && position && (
        <div style={{
          position: 'fixed',
          left: isMobile ? MOBILE_MARGIN : position.x,
          top: isMobile ? MOBILE_MARGIN : position.y,
          width: panelSize.width,
          height: minimized ? (isMobile ? 64 : 56) : panelSize.height,
          zIndex: 30001,
          background: '#fff',
          border: '1px solid #d8e0ee',
          borderRadius: 10,
          boxShadow: '0 18px 60px rgba(0,0,0,.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Geist', system-ui, sans-serif",
          transition: dragging ? 'none' : 'height 140ms ease',
        }}>
          <div
            onMouseDown={startDrag}
            style={{
              padding: '10px 12px',
              background: '#0f4c81',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              cursor: isMobile ? 'default' : 'grab',
              userSelect: 'none',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Apex AI</div>
              <div style={{ fontSize: 10, opacity: .8 }}>Copilot da Plataforma</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setMinimized(v => !v)}
                style={{ border: 0, background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 14, borderRadius: 6, width: 28, height: 28, cursor: 'pointer' }}
                title={minimized ? 'Maximizar' : 'Minimizar'}
              >
                {minimized ? '+' : '−'}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ border: 0, background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 14, borderRadius: 6, width: 28, height: 28, cursor: 'pointer' }}
                title="Fechar"
              >
                x
              </button>
            </div>
          </div>

          {!minimized && <div style={{ display: 'flex', gap: 6, padding: 10, borderBottom: '1px solid #e2e8f0' }}>
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
          </div>}

          {!minimized && <div style={{ padding: 12, display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => action.text ? send(action.text) : router.push('/mission-control')}
                style={{ border: '1px solid #d8e0ee', background: '#f8fafc', color: '#0f4c81', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={clearConversation}
              style={{ border: '1px solid #d8e0ee', background: '#fff', color: '#334155', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Limpar conversa
            </button>
          </div>}

          {!minimized && <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', background: message.role === 'user' ? '#0f4c81' : '#f3f6fb', color: message.role === 'user' ? '#fff' : '#172033', borderRadius: 10, padding: '8px 10px', fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {message.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: '#667085' }}>Apex AI analisando...</div>}
          </div>}

          {!minimized && <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') send() }}
              placeholder={`Perguntar no modo ${MODE_LABEL[mode]}`}
              style={{ flex: 1, border: '1px solid #cfd6e4', borderRadius: 8, padding: '9px 10px', fontSize: 12 }}
            />
            <button onClick={() => send()} disabled={loading} style={{ border: 0, borderRadius: 8, background: '#0f4c81', color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}>
              Enviar
            </button>
          </div>}
        </div>
      )}
    </>
  )
}
