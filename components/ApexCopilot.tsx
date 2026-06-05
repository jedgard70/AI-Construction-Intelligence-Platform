import { useRouter } from 'next/router'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { getSupabase } from '../lib/supabase'

type Screen = 'manual' | 'supervisor' | 'status'
type Attachment = { id: string; name: string; type: string; size: number; dataUrl?: string; preview?: string }
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
const CP1_RUNTIME_MARKER = 'CP1 runtime: ApexCopilot v125-forensic-universal-intake'
const CP1_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const CP1_LARGE_FILE_MESSAGE = 'Arquivo recebido, mas excede o limite CP1 de 10MB. Será tratado em checkpoint de arquivos grandes.'

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
  if (typeof payload?.analysis === 'string' && payload.analysis.trim()) {
    return payload.analysis.trim()
  }
  if (typeof payload?.content?.[0]?.text === 'string' && payload.content[0].text.trim()) {
    return payload.content[0].text.trim()
  }
  if (typeof payload?.reply === 'string' && payload.reply.trim()) {
    return payload.reply.trim()
  }
  return ''
}

function validateAttachment(file: File): { valid: boolean; error?: string } {
  if (file.size > CP1_MAX_ATTACHMENT_BYTES) {
    return { valid: false, error: CP1_LARGE_FILE_MESSAGE }
  }
  return { valid: true }
}

async function readJsonResponse(res: Response): Promise<any> {
  const raw = await res.text()
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {
      error: {
        message: res.status === 413
          ? CP1_LARGE_FILE_MESSAGE
          : 'O servidor retornou uma resposta inesperada. O arquivo foi aceito no intake, mas a análise não foi concluída neste checkpoint.',
      },
      non_json_response: true,
    }
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      const value = event.target?.result
      if (typeof value === 'string') resolve(value)
      else reject(new Error('Falha ao ler arquivo.'))
    }
    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'))
    reader.readAsDataURL(file)
  })
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

function getValidSessionToken(session: any): string | null {
  const token = typeof session?.access_token === 'string' ? session.access_token.trim() : ''
  if (!token) return null
  const expiresAt = typeof session?.expires_at === 'number' ? session.expires_at : null
  if (expiresAt && expiresAt < Math.floor(Date.now() / 1000) + 30) return null
  return token
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
    const supabase = sb

    let active = true

    async function refreshServerContext(token: string, fallbackEmail?: string | null) {
      try {
        const res = await fetch('/api/chat/session-context', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!active) return
        if (!res.ok) {
          setAuthToken(null)
          setChatContext({
            role: 'guest',
            owner: false,
            email: fallbackEmail || null,
          })
          return
        }
        setChatContext({
          role: data?.role || 'user',
          owner: Boolean(data?.is_owner),
          email: data?.email || fallbackEmail || null,
        })
      } catch {
        if (!active) return
        setChatContext({
          role: 'guest',
          owner: false,
          email: fallbackEmail || null,
        })
      }
    }

    async function syncSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      const token = getValidSessionToken(session)
      const email = session?.user?.email || null
      setAuthToken(token)
      if (!token) {
        setChatContext({ role: 'guest', owner: false, email })
        return
      }
      setChatContext(prev => ({
        ...prev,
        role: prev.role === 'guest' ? 'user' : prev.role,
        email,
      }))
      await refreshServerContext(token, email)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = getValidSessionToken(session)
      const email = session?.user?.email || null
      setAuthToken(token)
      if (!token) {
        setChatContext({ role: 'guest', owner: false, email })
        return
      }
      setChatContext(prev => ({
        ...prev,
        role: prev.role === 'guest' ? 'user' : prev.role,
        email,
      }))
      refreshServerContext(token, email).catch(() => {})
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

  function appendAssistantMessage(message: Msg) {
    if (activeScreen === 'manual') setManualMessages(prev => [...prev, message])
    else if (activeScreen === 'supervisor') setSupervisorMessages(prev => [...prev, message])
    else if (activeScreen === 'status') setStatusMessages(prev => [...prev, message])
  }

  async function analyzeAttachments(question: string, selectedAttachments: Attachment[], headers: Record<string, string>) {
    const analyses: string[] = []
    for (const attachment of selectedAttachments) {
      if (!attachment.dataUrl) continue
      const res = await fetch('/api/chat/analyze-attachment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: question,
          attachment: {
            name: attachment.name,
            type: attachment.type || 'application/octet-stream',
            size: attachment.size,
            dataUrl: attachment.dataUrl,
          },
        }),
      })
      const data = await readJsonResponse(res)
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? 'Please log in on this Preview before using protected attachment analysis.'
            : res.status === 413
              ? CP1_LARGE_FILE_MESSAGE
              : data?.error?.message || 'Falha ao analisar anexo.',
        )
      }
      if (data?.apex_context) {
        setChatContext({
          role: data.apex_context.role || 'user',
          owner: Boolean(data.apex_context.is_owner),
          email: data.apex_context.email || chatContext.email || null,
        })
      }
      const text = readAssistantText(data)
      const typeLabel = data?.type ? `Tipo: ${data.type}` : 'Tipo: unknown'
      analyses.push(`Anexo: ${attachment.name}\n${typeLabel}\n${text || 'Analise vazia.'}`)
    }
    return analyses.join('\n\n')
  }

  async function send(text?: string) {
    const question = (text ?? input).trim()
    const selectedAttachments = attachments
    if ((!question && selectedAttachments.length === 0) || loading) return

    setInput('')
    setAttachments([])
    const nextMessages: Msg[] = activeScreen === 'manual'
      ? [...manualMessages, { role: 'user', text: question || 'Analisar anexo', attachments: selectedAttachments }]
      : activeScreen === 'supervisor'
      ? [...supervisorMessages, { role: 'user', text: question || 'Analisar anexo', attachments: selectedAttachments }]
      : [...statusMessages, { role: 'user', text: question || 'Analisar anexo', attachments: selectedAttachments }]

    if (activeScreen === 'manual') setManualMessages(nextMessages)
    else if (activeScreen === 'supervisor') setSupervisorMessages(nextMessages)
    else if (activeScreen === 'status') setStatusMessages(nextMessages)

    setLoading(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      if (selectedAttachments.length > 0) {
        if (!authToken) {
          appendAssistantMessage({
            role: 'assistant',
            text: 'Please log in on this Preview before using protected attachment analysis.',
          })
          return
        }
        const analysis = await analyzeAttachments(question, selectedAttachments, headers)
        appendAssistantMessage({
          role: 'assistant',
          text: analysis || 'Nao consegui obter analise valida do anexo.',
        })
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 900,
          messages: [
            {
              role: 'user',
              content: `Tela: ${SCREEN_LABEL[activeScreen]}\nPagina atual: ${router.pathname}\nPergunta: ${question}`,
            },
          ],
        }),
      })
      const data = await readJsonResponse(res)
      setChatContext({
        role: data?.apex_context?.role || (authToken ? 'user' : 'guest'),
        owner: Boolean(data?.apex_context?.is_owner),
        email: data?.apex_context?.email || chatContext.email || null,
      })

      if (!res.ok) {
        const serverError = data?.error?.message || 'API indisponivel no momento.'
        appendAssistantMessage({ role: 'assistant', text: `Nao consegui concluir agora: ${serverError}` })
        return
      }

      const reply = readAssistantText(data)
      appendAssistantMessage({ role: 'assistant', text: reply || 'Nao consegui obter resposta valida do Copilot.' })
    } catch (err: any) {
      appendAssistantMessage({
        role: 'assistant',
        text: err?.message || 'Sem conexao com o servidor do Copilot. Verifique sua internet ou tente novamente em instantes.',
      })
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

  function copyResponse(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function speakResponse(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    window.speechSynthesis.speak(utterance)
  }

  function shareResponse(text: string) {
    const payload = { title: 'Apex AI', text }
    if (navigator.share) {
      navigator.share(payload).catch(() => {})
      return
    }
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function showMoreForResponse(text: string) {
    const detail = text.length > 900 ? `${text.slice(0, 900)}...` : text
    window.alert(`Apex AI response\n\n${detail}`)
  }

  async function addAttachment(file: File) {
    const validation = validateAttachment(file)
    if (!validation.valid) {
      appendAssistantMessage({ role: 'assistant', text: validation.error || 'Anexo invalido.' })
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setAttachments(prev => [...prev, {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      }])
    } catch {
      appendAssistantMessage({ role: 'assistant', text: 'Nao consegui ler o anexo.' })
    }
  }

  function handlePaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData?.items || [])
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file))

    if (!files.length) return
    event.preventDefault()
    files.forEach(file => {
      addAttachment(file).catch(() => {
        appendAssistantMessage({ role: 'assistant', text: 'Nao consegui ler a imagem colada.' })
      })
    })
  }

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
              <div style={{ fontSize: 9, opacity: 0.72 }}>{CP1_RUNTIME_MARKER}</div>
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
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 2 }}>
                      <button onClick={() => copyResponse(message.text)} style={responseActionStyle}>Copy</button>
                      <button onClick={() => speakResponse(message.text)} style={responseActionStyle}>Speak</button>
                      <button onClick={() => shareResponse(message.text)} style={responseActionStyle}>Share</button>
                      <button onClick={() => showMoreForResponse(message.text)} style={responseActionStyle}>More</button>
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
                  onPaste={handlePaste}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault()
                      send()
                    }
                  }}
                  placeholder={`Cole texto longo, página, relatório ou pergunta. Use Ctrl+Enter para enviar.`}
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
                      accept="*/*"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          addAttachment(e.target.files[0])
                        }
                        e.currentTarget.value = ''
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

const responseActionStyle = {
  border: '1px solid #d8e0ee',
  background: '#fff',
  color: '#0f4c81',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 800,
  cursor: 'pointer',
} as const
