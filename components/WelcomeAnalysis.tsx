import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, KeyboardEvent } from 'react'
import { useRouter } from 'next/router'
import { Bot, FileText, MessageSquare, Send, Upload } from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { selectApexCopilotSkill } from '../lib/apex-copilot/skill-router'
import type { ApexCopilotSkill } from '../lib/apex-copilot/skill-registry'
import type { Profile } from '../pages/dashboard'

type Language = 'en' | 'pt'
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; skill?: string }

const COPY = {
  en: {
    title: 'Apex Copilot Studio',
    lead: 'Upload any file or describe the goal. Apex Copilot chooses the right construction skill internally.',
    upload: 'Upload file',
    file: 'File',
    chat: 'Conversation',
    result: 'Output',
    emptyFile: 'No file uploaded yet',
    drop: 'Images, PDFs, IFC, RVT, DWG, DXF, SKP, videos, spreadsheets and unknown files are accepted.',
    placeholder: 'Ask Apex Copilot what you want to do next...',
    emptyChat: 'Apex Copilot will answer here as a live construction assistant.',
    thinking: 'Apex Copilot is thinking...',
    outputEmpty: 'Generated output, preview or next-step plan appears here.',
    owner: 'Executive Dashboard',
  },
  pt: {
    title: 'Apex Copilot Studio',
    lead: 'Anexe qualquer arquivo ou descreva o objetivo. O Apex Copilot escolhe a skill correta internamente.',
    upload: 'Anexar arquivo',
    file: 'Arquivo',
    chat: 'Conversa',
    result: 'Output',
    emptyFile: 'Nenhum arquivo anexado ainda',
    drop: 'Imagens, PDFs, IFC, RVT, DWG, DXF, SKP, videos, planilhas e arquivos desconhecidos sao aceitos.',
    placeholder: 'Pergunte ao Apex Copilot o que deseja fazer agora...',
    emptyChat: 'O Apex Copilot respondera aqui como assistente vivo de construcao.',
    thinking: 'Apex Copilot esta pensando...',
    outputEmpty: 'Output gerado, preview ou plano de proximo passo aparece aqui.',
    owner: 'Dashboard Executivo',
  },
} satisfies Record<Language, Record<string, string>>

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function extension(fileName = '') {
  const parts = fileName.toLowerCase().split('?')[0].split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function fileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${size} bytes`
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
  return Boolean(profile.is_owner || role === 'owner' || role === 'admin' || role === 'diretor_executivo' || ownerEmails.includes(String(profile.email || '').toLowerCase()))
}

function buildUserPrompt(file: File | null, text: string, skill: ApexCopilotSkill, language: Language) {
  const fileBlock = file
    ? [
        `Uploaded file: ${file.name}`,
        `Extension: ${extension(file.name) || 'unknown'}`,
        `MIME: ${file.type || 'unknown'}`,
        `Size: ${fileSize(file.size)}`,
      ].join('\n')
    : 'No file uploaded.'

  return [
    'Apex Copilot Studio request.',
    `Language: ${language}`,
    fileBlock,
    `User message: ${text || '(no typed objective yet)'}`,
    `Selected local skill hint: ${skill.domain} - ${skill.title}`,
    `Skill purpose: ${skill.purpose}`,
    'Respond as Apex Copilot in a real chat message. Do not output dashboard cards. Choose the domain internally and ask one useful next question.',
  ].join('\n\n')
}

function openGlobalCopilotFocus() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('apex-welcome-copilot-focus'))
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const [language, setLanguage] = useState<Language>('en')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const copy = COPY[language]
  const selectedSkill = useMemo(() => selectApexCopilotSkill({
    text: input,
    fileName: file?.name || '',
    fileType: file?.type || '',
  }), [file, input])

  useEffect(() => {
    const saved = window.localStorage.getItem('apex-language')
    if (saved === 'en' || saved === 'pt') setLanguage(saved)
    const onLanguage = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail
      if (next === 'en' || next === 'pt') setLanguage(next)
    }
    const focus = () => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.addEventListener('apex-language-change', onLanguage)
    window.addEventListener('apex-welcome-copilot-focus', focus)
    return () => {
      window.removeEventListener('apex-language-change', onLanguage)
      window.removeEventListener('apex-welcome-copilot-focus', focus)
    }
  }, [])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    let active = true
    sb.auth.getSession().then(({ data }) => {
      if (active) setAuthToken(data.session?.access_token || null)
    }).catch(() => {})
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => setAuthToken(session?.access_token || null))
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!file) {
      setFileUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function askCopilot(text: string, nextFile = file) {
    const skill = selectApexCopilotSkill({ text, fileName: nextFile?.name || '', fileType: nextFile?.type || '' })
    const userText = text.trim() || (nextFile ? `Uploaded ${nextFile.name}` : 'Start')
    setMessages(prev => [...prev, { id: id(), role: 'user', text: userText, skill: skill.domain }])
    setLoading(true)
    window.setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers.Authorization = `Bearer ${authToken}`
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          max_tokens: 900,
          messages: [
            ...messages.slice(-8).map(message => ({ role: message.role, content: message.text })),
            { role: 'user', content: buildUserPrompt(nextFile, text, skill, language) },
          ],
        }),
      })
      const data = await res.json().catch(() => ({}))
      const reply = data?.content?.[0]?.text || data?.reply || data?.error?.message || 'Apex Copilot could not complete the response.'
      const domain = data?.apex_skill?.domain || skill.domain
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text: reply, skill: domain }])
      setOutput(reply)
    } catch {
      const fallback = language === 'en'
        ? 'Apex Copilot could not reach the AI backend, but the file was accepted.'
        : 'O Apex Copilot nao conseguiu acessar o backend de IA, mas o arquivo foi aceito.'
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text: fallback, skill: skill.domain }])
      setOutput(fallback)
    } finally {
      setLoading(false)
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null
    setFile(nextFile)
    if (nextFile) askCopilot('', nextFile).catch(() => {})
  }

  function submit(event?: KeyboardEvent<HTMLInputElement>) {
    if (event && event.key !== 'Enter') return
    const text = input
    setInput('')
    askCopilot(text).catch(() => {})
  }

  function preview() {
    if (!file) {
      return (
        <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.dropZone}>
          <Upload size={34} />
          <strong>{copy.upload}</strong>
          <span>{copy.drop}</span>
        </button>
      )
    }
    if (file.type.startsWith('image/') && !['heic', 'heif'].includes(extension(file.name))) {
      return <img src={fileUrl} alt={file.name} style={styles.previewImage} />
    }
    if (file.type === 'application/pdf' || extension(file.name) === 'pdf') {
      return <iframe src={fileUrl} title={file.name} style={styles.pdfFrame} />
    }
    return (
      <div style={styles.fileBox}>
        <FileText size={42} />
        <strong>{file.name}</strong>
        <span>{extension(file.name).toUpperCase() || 'FILE'} - {file.type || 'unknown'} - {fileSize(file.size)}</span>
      </div>
    )
  }

  return (
    <section style={styles.page}>
      <input ref={fileInputRef} type="file" accept="*/*" hidden onChange={handleFile} />
      <header style={styles.header}>
        <div>
          <span style={styles.brand}>APEX GLOBAL AI</span>
          <h1 style={styles.title}>{copy.title}</h1>
          <p style={styles.lead}>{copy.lead}</p>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.secondaryButton} onClick={() => fileInputRef.current?.click()}><Upload size={17} />{copy.upload}</button>
          <button type="button" style={styles.primaryButton} onClick={openGlobalCopilotFocus}><MessageSquare size={17} />Apex Copilot</button>
        </div>
      </header>

      <main style={styles.grid}>
        <aside style={styles.sidePanel}>
          <div style={styles.panelLabel}>{copy.file}</div>
          <div style={styles.fileSummary}>
            <strong>{file?.name || copy.emptyFile}</strong>
            <span>{file ? `${extension(file.name).toUpperCase() || 'FILE'} - ${file.type || 'unknown'} - ${fileSize(file.size)}` : copy.drop}</span>
          </div>
          <div style={styles.skillBadge}>
            <Bot size={18} />
            <span>{selectedSkill.domain}</span>
            <small>{selectedSkill.title}</small>
          </div>
        </aside>

        <section ref={chatRef} style={styles.chatPanel}>
          <div style={styles.panelLabel}>{copy.chat}</div>
          <div style={styles.messages}>
            {!messages.length && <p style={styles.emptyChat}>{copy.emptyChat}</p>}
            {messages.map(message => (
              <article key={message.id} style={{ ...styles.bubble, ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble) }}>
                <strong>{message.role === 'user' ? (language === 'en' ? 'You' : 'Voce') : 'Apex Copilot'} {message.skill ? `- ${message.skill}` : ''}</strong>
                <span>{message.text}</span>
              </article>
            ))}
            {loading && <article style={{ ...styles.bubble, ...styles.assistantBubble }}><strong>Apex Copilot</strong><span>{copy.thinking}</span></article>}
          </div>
          <div style={styles.chips}>
            {['archvis', 'directcut', 'bim-3d', 'budget', 'contracts', 'field'].map(domain => (
              <button key={domain} type="button" style={styles.chip} onClick={() => askCopilot(`Continue with ${domain}`).catch(() => {})}>{domain}</button>
            ))}
          </div>
          <div style={styles.composer}>
            <input value={input} onChange={event => setInput(event.target.value)} onKeyDown={submit} style={styles.input} placeholder={copy.placeholder} />
            <button type="button" style={styles.sendButton} onClick={() => submit()} aria-label="Send"><Send size={19} /></button>
          </div>
        </section>

        <aside style={styles.outputPanel}>
          <div style={styles.panelLabel}>{copy.result}</div>
          <div style={styles.preview}>{preview()}</div>
          <div style={styles.output}>
            <strong>{selectedSkill.title}</strong>
            <p>{output || copy.outputEmpty}</p>
          </div>
        </aside>
      </main>

      {isOwner && (
        <div style={styles.ownerArea}>
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>{copy.owner}</button>
        </div>
      )}
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: 'calc(100vh - 88px)', background: '#fff', color: '#071a33', padding: '24px 34px 30px', maxWidth: 1680, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 18 },
  brand: { color: '#d7192a', fontWeight: 900, fontSize: 13 },
  title: { margin: '6px 0', fontSize: 38, lineHeight: 1, color: '#071a33' },
  lead: { margin: 0, color: '#526174', fontWeight: 700, fontSize: 16 },
  headerActions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  primaryButton: { border: 'none', borderRadius: 8, background: '#d7192a', color: '#fff', padding: '12px 16px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' },
  secondaryButton: { border: '1px solid #cfd7e6', borderRadius: 8, background: '#fff', color: '#071a33', padding: '11px 14px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: '300px minmax(440px, 1fr) minmax(380px, .85fr)', gap: 16, alignItems: 'stretch' },
  sidePanel: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#f9fbfd', padding: 16, minHeight: 620 },
  chatPanel: { border: '1px solid #cfd7e6', borderRadius: 8, background: '#fff', color: '#071a33', padding: 16, minHeight: 620, display: 'grid', gridTemplateRows: 'auto 1fr auto auto', gap: 12, boxShadow: '0 18px 42px rgba(7,26,51,.08)' },
  outputPanel: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#fff', padding: 16, minHeight: 620 },
  panelLabel: { color: '#d7192a', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', marginBottom: 12 },
  fileSummary: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, color: '#526174', fontSize: 13, lineHeight: 1.45 },
  skillBadge: { marginTop: 14, border: '1px solid #dfe5ee', borderRadius: 8, background: '#fff', padding: 12, display: 'grid', gap: 6, color: '#071a33', fontWeight: 900 },
  messages: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 },
  emptyChat: { margin: 0, color: '#526174', border: '1px solid #dfe5ee', borderRadius: 8, padding: 14, background: '#f9fbfd' },
  bubble: { borderRadius: 8, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.55, whiteSpace: 'pre-wrap', fontSize: 14 },
  assistantBubble: { background: '#f9fbfd', border: '1px solid #dfe5ee', color: '#071a33', alignSelf: 'stretch' },
  userBubble: { background: '#071a33', color: '#fff', alignSelf: 'flex-end', maxWidth: '80%' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { border: '1px solid #cfd7e6', borderRadius: 999, background: '#fff', color: '#071a33', padding: '8px 11px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  composer: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 48px', gap: 10 },
  input: { width: '100%', border: '1px solid #cfd7e6', borderRadius: 8, padding: '12px 13px', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' },
  sendButton: { border: 'none', borderRadius: 8, background: '#d7192a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  preview: { border: '1px dashed #cfd7e6', borderRadius: 8, minHeight: 330, overflow: 'hidden', background: '#f8fbff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropZone: { width: '100%', minHeight: 330, border: 'none', background: 'transparent', color: '#071a33', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', padding: 20 },
  previewImage: { width: '100%', height: '100%', minHeight: 330, objectFit: 'contain', background: '#fff' },
  pdfFrame: { width: '100%', height: 420, border: 'none', background: '#fff' },
  fileBox: { textAlign: 'center', padding: 24, color: '#526174', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', lineHeight: 1.5 },
  output: { marginTop: 14, border: '1px solid #dfe5ee', borderRadius: 8, padding: 14, color: '#526174', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  ownerArea: { display: 'flex', justifyContent: 'flex-end', marginTop: 18 },
  ownerButton: { border: 'none', borderRadius: 8, background: '#071a33', color: '#fff', padding: '14px 22px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' },
}
