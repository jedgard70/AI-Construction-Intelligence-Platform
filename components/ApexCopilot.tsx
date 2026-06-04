import { useRouter } from 'next/router'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { getSupabase } from '../lib/supabase'

type Screen = 'manual' | 'supervisor' | 'status'
type Attachment = { id: string; name: string; type: string; size: number; preview?: string; file?: File }
type Msg = { role: 'user' | 'assistant'; text: string; attachments?: Attachment[] }
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
  text: 'Olá! Estou aqui para ajudar. Como posso assistir?',
}

const INITIAL_SUPERVISOR_MESSAGE: Msg = {
  role: 'assistant',
  text: 'Supervisor ativo. Pronto para supervisionar operações, acessar Mission Control, ou gerar handoff.',
}

const INITIAL_STATUS_MESSAGE: Msg = {
  role: 'assistant',
  text: 'Status da plataforma. Qual aspecto da operação você quer aprofundar?',
}

const SCREEN_LABEL: Record<Screen, string> = {
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

function validateAttachment(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não suportado. Use PNG, JPEG, WebP ou PDF.' }
  }
  const maxSizes = { 'application/pdf': 10 * 1024 * 1024, default: 5 * 1024 * 1024 }
  const maxSize = maxSizes[file.type as keyof typeof maxSizes] || maxSizes.default
  if (file.size > maxSize) {
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB` }
  }
  return { valid: true }
}

function initWebSpeech(): { recognition: any; supported: boolean } {
  if (typeof window === 'undefined') return { recognition: null, supported: false }
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return { recognition: null, supported: false }
  const recognition = new SpeechRecognition()
  recognition.lang = 'pt-BR'
  recognition.continuous = false
  recognition.interimResults = false
  return { recognition, supported: true }
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
  const [activeScreen, setActiveScreen] = useState<Screen>('manual')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualMessages, setManualMessages] = useState<Msg[]>([INITIAL_ASSISTANT_MESSAGE])
  const [supervisorMessages, setSupervisorMessages] = useState<Msg[]>([INITIAL_SUPERVISOR_MESSAGE])
  const [statusMessages, setStatusMessages] = useState<Msg[]>([INITIAL_STATUS_MESSAGE])
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [chatContext, setChatContext] = useState<ChatContext>({
    role: 'guest',
    owner: false,
    email: null,
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [listening, setListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

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
    const { recognition, supported } = initWebSpeech()
    if (supported && recognition) {
      recognitionRef.current = recognition
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setInput(prev => prev + (prev ? ' ' : '') + transcript)
        setListening(false)
      }
      recognition.onerror = () => {
        setListening(false)
      }
      recognition.onend = () => {
        setListening(false)
      }
      setMicSupported(true)
    }
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
    if (!question && attachments.length === 0 && loading) return

    setInput('')
    const nextMessages: Msg[] = activeScreen === 'manual'
      ? [...manualMessages, { role: 'user', text: question, attachments }]
      : activeScreen === 'supervisor'
      ? [...supervisorMessages, { role: 'user', text: question, attachments }]
      : [...statusMessages, { role: 'user', text: question, attachments }]

    if (activeScreen === 'manual') setManualMessages(nextMessages)
    else if (activeScreen === 'supervisor') setSupervisorMessages(nextMessages)
    else if (activeScreen === 'status') setStatusMessages(nextMessages)

    setLoading(true)
    setAttachments([])

    try {
      let attachmentAnalysis = ''
      console.log('[SEND] Attachments to analyze:', attachments.length)
      for (const att of attachments) {
        console.log('[ATTACHMENT] Processing:', att.name, 'type:', att.type, 'has file:', !!att.file)
        if (!att.file) {
          console.warn('[ATTACHMENT] No file object for', att.name)
          continue
        }
        try {
          const formData = new FormData()
          formData.append('file', att.file)
          const analysisHeaders: Record<string, string> = {}
          if (authToken) {
            analysisHeaders.Authorization = `Bearer ${authToken}`
          } else {
            console.warn('[ATTACHMENT] No auth token available')
          }
          console.log('[ATTACHMENT] Sending to analyze endpoint, token exists:', !!authToken)
          const analysisRes = await fetch('/api/chat/analyze-attachment', {
            method: 'POST',
            headers: analysisHeaders,
            body: formData,
          })
          console.log('[ATTACHMENT] Response status:', analysisRes.status, 'ok:', analysisRes.ok)
          if (analysisRes.ok) {
            const analysisData = await analysisRes.json()
            console.log('[ATTACHMENT] Analysis successful:', analysisData.analysis?.substring?.(0, 100))
            attachmentAnalysis += `\n\n[Análise de ${att.name}]\n${analysisData.analysis}`
          } else {
            const errorText = await analysisRes.text()
            console.error('[ATTACHMENT] Analysis failed:', analysisRes.status, errorText)
            const errorMsg = `Erro ao analisar ${att.name}: ${analysisRes.status} - ${analysisRes.statusText}`
            attachmentAnalysis += `\n\n[ERRO] ${errorMsg}`
          }
        } catch (err) {
          console.error('[ATTACHMENT_ANALYSIS] Error:', err)
        }
      }
      console.log('[SEND] Attachment analysis complete, length:', attachmentAnalysis.length)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const fullQuestion = question + attachmentAnalysis
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 900,
          messages: [
            {
              role: 'user',
              content: `Tela: ${SCREEN_LABEL[activeScreen]}\nPagina atual: ${router.pathname}\nPergunta: ${fullQuestion}`,
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
        const errorMsg = { role: 'assistant' as const, text: `Nao consegui concluir agora: ${serverError}` }
        if (activeScreen === 'manual') setManualMessages(prev => [...prev, errorMsg])
        else if (activeScreen === 'supervisor') setSupervisorMessages(prev => [...prev, errorMsg])
        else if (activeScreen === 'status') setStatusMessages(prev => [...prev, errorMsg])
        return
      }

      const reply = readAssistantText(data)
      const assistantMsg = { role: 'assistant' as const, text: reply || 'Nao consegui obter resposta valida do Copilot.' }
      if (activeScreen === 'manual') setManualMessages(prev => [...prev, assistantMsg])
      else if (activeScreen === 'supervisor') setSupervisorMessages(prev => [...prev, assistantMsg])
      else if (activeScreen === 'status') setStatusMessages(prev => [...prev, assistantMsg])
    } catch {
      const errorMsg = { role: 'assistant' as const, text: 'Sem conexao com o servidor do Copilot. Verifique sua internet ou tente novamente em instantes.' }
      if (activeScreen === 'manual') setManualMessages(prev => [...prev, errorMsg])
      else if (activeScreen === 'supervisor') setSupervisorMessages(prev => [...prev, errorMsg])
      else if (activeScreen === 'status') setStatusMessages(prev => [...prev, errorMsg])
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
    if (activeScreen === 'manual') setManualMessages([INITIAL_ASSISTANT_MESSAGE])
    else if (activeScreen === 'supervisor') setSupervisorMessages([INITIAL_SUPERVISOR_MESSAGE])
    else if (activeScreen === 'status') setStatusMessages([INITIAL_STATUS_MESSAGE])
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      alert('Nao foi possivel copiar para clipboard.')
    })
  }

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) {
      alert('SpeechSynthesis nao suportado neste navegador.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  function shareText(text: string) {
    if (!navigator.share) {
      copyToClipboard(text)
      return
    }
    navigator.share({
      title: 'Apex AI',
      text: text,
    }).catch(() => {
      copyToClipboard(text)
    })
  }

  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null)

  const getScreenButtons = () => {
    if (activeScreen === 'manual') {
      return [
        { label: 'Como usar', text: 'Explique como usar a plataforma Apex, seus modulos principais e como acessar cada recurso.' },
      ]
    }
    if (activeScreen === 'supervisor' && chatContext.owner) {
      return [
        { label: 'Mission Control', action: () => router.push('/mission-control') },
        { label: 'Owner Command', action: () => router.push('/owner-command') },
        { label: 'Owner Executor', action: () => router.push('/owner-command') },
      ]
    }
    if (activeScreen === 'status' && chatContext.owner) {
      return [
        { label: 'Foundation / Master 001', text: 'Qual e o status completo do Foundation e do Pacote Master 001?' },
        { label: 'Mission Control', text: 'Qual e o status da Mission Control e do operacional?' },
        { label: 'Storage', text: 'Como esta o sistema de Storage e dados?' },
      ]
    }
    return []
  }

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
            <div style={{ display: 'flex', gap: 0, padding: 0, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              {(['manual', 'supervisor', 'status'] as Screen[])
                .filter(screen => {
                  if (screen === 'manual') return true
                  return chatContext.owner
                })
                .map(screen => (
                <button
                  key={screen}
                  onClick={() => setActiveScreen(screen)}
                  style={{
                    flex: 'auto',
                    minWidth: '90px',
                    border: 'none',
                    borderBottom: activeScreen === screen ? '2px solid #0f4c81' : '2px solid transparent',
                    borderRadius: 0,
                    background: activeScreen === screen ? '#edf3ff' : '#fff',
                    color: activeScreen === screen ? '#0f4c81' : '#667085',
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: activeScreen === screen ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {SCREEN_LABEL[screen]}
                </button>
              ))}
            </div>
          )}

          {!minimized && (
            <div style={{ padding: 12, display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
              {getScreenButtons().map(btn => (
                <button
                  key={btn.label}
                  onClick={() => ('text' in btn && btn.text ? send(btn.text) : 'action' in btn && btn.action ? btn.action() : null)}
                  style={pillButtonStyle}
                >
                  {btn.label}
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
                Limpar tela
              </button>
            </div>
          )}

          {!minimized && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxWidth: fullscreen ? 960 : undefined,
              width: fullscreen ? '100%' : undefined,
              margin: fullscreen ? '0 auto' : undefined,
            }}>
              {(activeScreen === 'manual' ? manualMessages : activeScreen === 'supervisor' ? supervisorMessages : statusMessages).map((message, index) => (
                <div key={`${message.role}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
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
                  {message.attachments && message.attachments.length > 0 && (
                    <div style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', gap: 6 }}>
                      {message.attachments.map(att => (
                        <div key={att.id} style={{ fontSize: 10, padding: '4px 8px', background: '#e2e8f0', borderRadius: 6 }}>
                          📎 {att.name} ({(att.size / 1024).toFixed(0)}KB)
                        </div>
                      ))}
                    </div>
                  )}
                  {message.role === 'assistant' && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, position: 'relative', marginTop: 4 }}>
                      <button
                        onClick={() => {
                          if (message.text && message.text.trim()) {
                            copyToClipboard(message.text)
                          } else {
                            alert('Nada para copiar')
                          }
                        }}
                        title="Copiar resposta"
                        style={{
                          background: '#f0f5ff',
                          border: '1px solid #d8e0ee',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#0f4c81',
                          padding: '6px 8px',
                          lineHeight: 1,
                          borderRadius: 6,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#e0ecff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f4c81'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#f0f5ff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#d8e0ee'
                        }}
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => speakText(message.text)}
                        title="Ouvir em voz alta"
                        style={{
                          background: '#f0f5ff',
                          border: '1px solid #d8e0ee',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#0f4c81',
                          padding: '6px 8px',
                          lineHeight: 1,
                          borderRadius: 6,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#e0ecff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f4c81'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#f0f5ff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#d8e0ee'
                        }}
                      >
                        🔊 Speak
                      </button>
                      <button
                        onClick={() => shareText(message.text)}
                        title="Compartilhar"
                        style={{
                          background: '#f0f5ff',
                          border: '1px solid #d8e0ee',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#0f4c81',
                          padding: '6px 8px',
                          lineHeight: 1,
                          borderRadius: 6,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#e0ecff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f4c81'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#f0f5ff'
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#d8e0ee'
                        }}
                      >
                        🔗 Share
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowMoreMenu(showMoreMenu === index.toString() ? null : index.toString())}
                          title="Mais opções"
                          style={{
                            background: '#f0f5ff',
                            border: '1px solid #d8e0ee',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#0f4c81',
                            padding: '6px 8px',
                            lineHeight: 1,
                            borderRadius: 6,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#e0ecff'
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f4c81'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#f0f5ff'
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#d8e0ee'
                          }}
                        >
                          ⋮ More
                        </button>
                        {showMoreMenu === index.toString() && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: '#fff',
                            border: '1px solid #d8e0ee',
                            borderRadius: 6,
                            padding: '6px 0',
                            minWidth: '140px',
                            zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,.1)',
                          }}>
                            <button
                              onClick={() => {
                                const currentTime = new Date().toLocaleTimeString('pt-BR')
                                copyToClipboard(`${message.text}\n\n[${currentTime}]`)
                                setShowMoreMenu(null)
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: '#334155',
                              }}
                            >
                              📋 Copiar com timestamp
                            </button>
                            <button
                              onClick={() => {
                                const lines = message.text.split('\n').filter(l => l.trim())
                                const formatted = lines.map(l => `• ${l}`).join('\n')
                                copyToClipboard(formatted)
                                setShowMoreMenu(null)
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: '#334155',
                              }}
                            >
                              🔘 Copiar formatado
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && <div style={{ fontSize: 12, color: '#667085' }}>Apex AI analisando...</div>}
            </div>
          )}

          {!minimized && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 10,
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              maxWidth: fullscreen ? 960 : undefined,
              width: fullscreen ? '100%' : undefined,
              margin: fullscreen ? '0 auto' : undefined,
            }}>
              {attachments.length > 0 && (
                <div style={{ fontSize: 10, display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0' }}>
                  {attachments.map(att => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                      <span>📎 {att.name}</span>
                      <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#a0a8bb' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault()
                      send()
                    }
                  }}
                  onPaste={event => {
                    const clipboardData = event.clipboardData
                    if (!clipboardData) {
                      console.log('[PASTE] No clipboard data')
                      return
                    }
                    const items = clipboardData.items
                    console.log('[PASTE] Clipboard items count:', items?.length || 0)
                    let foundImage = false
                    for (let i = 0; i < (items?.length || 0); i++) {
                      const item = items?.[i]
                      if (!item) continue
                      console.log('[PASTE] Item', i, 'kind:', item.kind, 'type:', item.type)
                      if (item.kind === 'file' && item.type.startsWith('image/')) {
                        foundImage = true
                        event.preventDefault()
                        const file = item.getAsFile()
                        console.log('[PASTE] Image file obtained:', !!file, 'name:', file?.name, 'type:', file?.type)
                        if (file) {
                          const validation = validateAttachment(file)
                          if (validation.valid) {
                            setAttachments(prev => [...prev, {
                              id: Date.now().toString(),
                              name: file.name || `screenshot.${file.type.split('/')[1] || 'png'}`,
                              type: file.type,
                              size: file.size,
                              file: file,
                            }])
                            console.log('[PASTE] Image attachment added:', file.name)
                          } else if (validation.error) {
                            console.error('[PASTE] Validation error:', validation.error)
                            alert(validation.error)
                          }
                        } else {
                          console.warn('[PASTE] getAsFile() returned null')
                        }
                      }
                    }
                    if (!foundImage) {
                      console.log('[PASTE] No image data found in clipboard')
                    }
                  }}
                  placeholder={`Cole texto longo, página, relatório ou pergunta. Use Ctrl+Enter para enviar. Você também pode colar imagens via Print Screen.`}
                  style={{
                    flex: 1,
                    border: '1px solid #cfd6e4',
                    borderRadius: 8,
                    padding: '9px 10px',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    minHeight: '72px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label title="Anexar arquivo" style={{ padding: '9px 8px', border: '1px solid #d8e0ee', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📎
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0]
                          const validation = validateAttachment(file)
                          if (validation.valid) {
                            setAttachments([...attachments, {
                              id: Date.now().toString(),
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              file: file,
                            }])
                            e.target.value = ''
                          } else if (validation.error) {
                            alert(validation.error)
                            e.target.value = ''
                          }
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {micSupported && (
                    <button
                      onClick={() => {
                        if (!recognitionRef.current) return
                        if (listening) {
                          recognitionRef.current.stop()
                          setListening(false)
                        } else {
                          recognitionRef.current.start()
                          setListening(true)
                        }
                      }}
                      disabled={loading}
                      title={listening ? 'Ouvindo...' : 'Usar microfone (pt-BR)'}
                      style={{
                        padding: '9px 8px',
                        border: `1px solid ${listening ? '#0f4c81' : '#d8e0ee'}`,
                        borderRadius: 8,
                        background: listening ? '#edf3ff' : '#fff',
                        color: listening ? '#0f4c81' : '#667085',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        height: 32,
                        width: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      🎙️
                    </button>
                  )}
                  <button
                    onClick={() => send()}
                    disabled={loading || (input.trim().length === 0 && attachments.length === 0)}
                    style={{
                      border: 0,
                      borderRadius: 8,
                      background: loading || (input.trim().length === 0 && attachments.length === 0) ? '#cbd5e1' : '#0f4c81',
                      color: '#fff',
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: loading || (input.trim().length === 0 && attachments.length === 0) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Enviar
                  </button>
                  {(input.trim().length > 0 || attachments.length > 0) && (
                    <button
                      onClick={() => { setInput(''); setAttachments([]) }}
                      disabled={loading}
                      style={{
                        border: 0,
                        borderRadius: 8,
                        background: loading ? '#cbd5e1' : '#e2e8f0',
                        color: loading ? '#9ca3af' : '#475569',
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              {input.trim().length > 0 && (
                <div style={{ fontSize: 11, color: '#667085', textAlign: 'right' }}>
                  {input.length} caracteres {attachments.length > 0 && `+ ${attachments.length} anexo(s)`}
                </div>
              )}
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
