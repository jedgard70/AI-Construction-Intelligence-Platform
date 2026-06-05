import { useState, useRef, useEffect, useCallback } from 'react'
import { getSupabase } from '../lib/supabase'

// ─── Memória persistida em localStorage ───────────────────────────────────────
const MEM_KEY = 'acip_memory_v2'
const CP1_RUNTIME_MARKER = 'CP1 runtime: HelpButton v125-forensic-universal-intake'
const CP1_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const CP1_LARGE_FILE_MESSAGE = 'Arquivo recebido, mas excede o limite CP1 de 10MB. Será tratado em checkpoint de arquivos grandes.'

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEM_KEY)
    if (!raw) return defaultMemory()
    return { ...defaultMemory(), ...JSON.parse(raw) }
  } catch { return defaultMemory() }
}

function defaultMemory() {
  return {
    facts: [],            // [{text, date}]
    skills: [],           // [{name, count, lastUsed}]
    preferences: {},      // {key: value}
    summaries: [],        // [{text, date}]
    conversationCount: 0,
  }
}

function saveMemory(mem) {
  try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)) } catch {}
}

function mergeMemory(current, extracted) {
  const now = new Date().toISOString()
  const updated = { ...current }

  // Facts — deduplication por similaridade simples
  for (const fact of (extracted.facts || [])) {
    const exists = updated.facts.some(f => f.text.toLowerCase().includes(fact.toLowerCase().slice(0, 15)))
    if (!exists && fact.length > 5) updated.facts.push({ text: fact, date: now })
  }
  updated.facts = updated.facts.slice(-30) // mantém últimos 30

  // Skills — incrementa contador
  for (const skill of (extracted.skills || [])) {
    const idx = updated.skills.findIndex(s => s.name.toLowerCase() === skill.toLowerCase())
    if (idx >= 0) {
      updated.skills[idx].count++
      updated.skills[idx].lastUsed = now
    } else {
      updated.skills.push({ name: skill, count: 1, lastUsed: now })
    }
  }
  updated.skills.sort((a, b) => b.count - a.count)
  updated.skills = updated.skills.slice(0, 40) // top 40 skills

  // Preferences
  updated.preferences = { ...updated.preferences, ...(extracted.preferences || {}) }

  // Summary
  if (extracted.summary?.length > 5) {
    updated.summaries.push({ text: extracted.summary, date: now })
    updated.summaries = updated.summaries.slice(-20)
  }

  updated.conversationCount = (updated.conversationCount || 0) + 1
  return updated
}

// ─── Prompt dinâmico com contexto de memória ─────────────────────────────────
const BASE_PROMPT = `Você é o ACIP Assistant — assistente de IA avançado da AI Construction Intelligence Platform v5.3.

Você pode ajudar com QUALQUER assunto: engenharia civil, arquitetura, gestão de obras, direito, finanças, cálculos, pesquisas técnicas, análise de documentos, imagens, plantas, prints de tela e perguntas gerais.

Quando o usuário enviar imagem ou print, analise com detalhes. Quando enviar PDF, leia e explique.

ESPECIALIDADE — Plataforma ConstructAI v5.3:
• Dashboard: KPIs por role, CPI, SPI, EAC, VAC, TCPI, Curva S
• Agentes IA: BIM Coordinator, Construction Planner, Cost Controller, Risk Analysis, Safety Monitor, Investment Analyst, Quality Control, Doc Intelligence
• RDO, NCIs, Segurança (NRs), BIM, Investimentos, SINAPI
• Visualizador: PDF, DWG, DXF, DGN, IFC, RVT, FBX, STL, STEP, OBJ, SAT, gbXML

OUTRAS COMPETÊNCIAS:
• Engenharia (estrutural, hidráulica, elétrica, solos, topografia)
• Normas ABNT, NRs, NBR 15575, PBQP-H, ISO
• Orçamentação, EVM, cronogramas (MS Project, Primavera, BIM 4D)
• Contratos e documentos jurídicos de construção
• Matemática, física, química, ciências
• Programação, TI, tecnologia
• Negócios, gestão e finanças

Seja direto e detalhado quando necessário. Use markdown para organizar respostas longas. Responda em português brasileiro por padrão.`

function buildPrompt(memory) {
  let prompt = BASE_PROMPT
  const recentFacts = memory.facts.slice(-8)
  const topSkills   = memory.skills.slice(0, 8)

  if (recentFacts.length > 0) {
    prompt += '\n\n━━ CONTEXTO APRENDIDO SOBRE ESTE USUÁRIO ━━\n'
    prompt += recentFacts.map(f => `• ${f.text}`).join('\n')
    prompt += '\nUse esse contexto para personalizar suas respostas.'
  }
  if (topSkills.length > 0) {
    prompt += '\n\n━━ TÓPICOS MAIS USADOS (adapte profundidade) ━━\n'
    prompt += topSkills.map(s => `• ${s.name} (${s.count}x)`).join('\n')
  }
  if (memory.preferences.level) {
    prompt += `\n\nNível técnico do usuário: ${memory.preferences.level}`
  }
  return prompt
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
function getMediaType(file) {
  if (file.type) return file.type
  const ext = file.name.split('.').pop().toLowerCase()
  return ({
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp',
    pdf:'application/pdf', csv:'text/csv', txt:'text/plain', md:'text/markdown', json:'application/json',
    xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ifc:'application/octet-stream', rvt:'application/octet-stream', dwg:'application/octet-stream',
    dxf:'application/octet-stream', zip:'application/zip',
  })[ext] || 'application/octet-stream'
}
const isImage = mt => mt.startsWith('image/')
const isPDF   = mt => mt === 'application/pdf'
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
}
function getValidSessionToken(session) {
  const token = typeof session?.access_token === 'string' ? session.access_token.trim() : ''
  if (!token) return null
  const expiresAt = typeof session?.expires_at === 'number' ? session.expires_at : null
  if (expiresAt && expiresAt < Math.floor(Date.now() / 1000) + 30) return null
  return token
}
async function readJsonResponse(res) {
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

const FAQS = [
  '📊 Como interpretar o CPI e SPI?',
  '🏗️ Como usar o visualizador de plantas?',
  '⚠️ Quais NRs se aplicam em obras?',
  '💰 Como calcular ROI de uma obra?',
  '📄 Analise este documento',
  '🔍 Como abrir uma NCI de qualidade?',
]

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HelpButton() {
  const [open, setOpen]         = useState(false)
  const [tab, setTab]           = useState('chat') // 'chat' | 'memory'
  const [expanded, setExpanded] = useState(false)
  const [memory, setMemory]     = useState(() => typeof window !== 'undefined' ? loadMemory() : defaultMemory())
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Olá! Sou o **ACIP Assistant** — aprendo com cada conversa e fico mais útil com o tempo.\n\nEnvie texto, imagem, PDF ou qualquer arquivo; formatos sem leitura profunda serão classificados para o checkpoint correto.' }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [learning, setLearning] = useState(false)
  const [attachments, setAtts]  = useState([])
  const [authToken, setAuthToken] = useState(null)
  const bottomRef               = useRef(null)
  const fileInputRef            = useRef(null)
  const exchangeRef             = useRef(0) // conta pares user/assistant

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, open, loading, tab])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    let active = true
    sb.auth.getSession()
      .then(({ data }) => {
        if (active) setAuthToken(getValidSessionToken(data?.session))
      })
      .catch(() => {
        if (active) setAuthToken(null)
      })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthToken(getValidSessionToken(session))
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // ── Aprendizado automático a cada 3 trocas ──
  const triggerLearning = useCallback(async (msgs) => {
    if (learning) return
    setLearning(true)
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      })
      if (!res.ok) return
      const extracted = await res.json()
      if (!extracted.facts?.length && !extracted.skills?.length) return
      setMemory(prev => {
        const updated = mergeMemory(prev, extracted)
        saveMemory(updated)
        return updated
      })
    } catch {} finally { setLearning(false) }
  }, [learning])

  async function handleFiles(files) {
    const incoming = Array.from(files || []).filter(Boolean)
    if (!incoming.length) return
    const accepted = []
    const rejected = []
    for (const f of incoming) {
      if (f.size > CP1_MAX_ATTACHMENT_BYTES) rejected.push(f.name)
      else accepted.push(f)
    }
    if (rejected.length) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: rejected.map(name => `Arquivo recebido: ${name}\n${CP1_LARGE_FILE_MESSAGE}`).join('\n\n'),
      }])
    }
    if (!accepted.length) return
    const previews = await Promise.all(accepted.map(async f => {
      const b64 = await fileToBase64(f)
      const mt  = getMediaType(f)
      return { name: f.name, base64: b64, mediaType: mt, previewUrl: URL.createObjectURL(f) }
    }))
    setAtts(prev => [...prev, ...previews])
  }

  function removeAtt(idx) {
    setAtts(prev => { URL.revokeObjectURL(prev[idx].previewUrl); return prev.filter((_,i)=>i!==idx) })
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || []).filter(it => it.type.startsWith('image/'))
    if (!items.length) return
    e.preventDefault()
    handleFiles(items.map(it => it.getAsFile()).filter(Boolean))
  }

  async function sendMessage(text) {
    const question = text || input.trim()
    if ((!question && !attachments.length) || loading) return
    setInput('')

    const blocks = []
    if (question) blocks.push({ type:'text', text: question })

    const userMsg = {
      role: 'user',
      content: blocks.length === 1 && blocks[0].type === 'text' ? question : blocks,
      _display: question || (attachments.length === 1 ? attachments[0].name : `${attachments.length} arquivos`),
      _atts: attachments.map(a => ({ name:a.name, mediaType:a.mediaType, previewUrl:a.previewUrl })),
    }

    setAtts([])
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      if (attachments.length) {
        const analyses = []
        for (const a of attachments) {
          if (!authToken) {
            analyses.push(`Arquivo recebido: ${a.name}\nPlease log in on this Preview before using protected attachment analysis.`)
            continue
          }
          const res = await fetch('/api/chat/analyze-attachment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
              prompt: question,
              attachment: {
                name: a.name,
                type: a.mediaType || 'application/octet-stream',
                dataUrl: `data:${a.mediaType || 'application/octet-stream'};base64,${a.base64}`,
              },
            }),
          })
          const data = await readJsonResponse(res)
          const text = data?.analysis || data?.content?.[0]?.text || (res.status === 401 ? 'Please log in on this Preview before using protected attachment analysis.' : res.status === 413 ? CP1_LARGE_FILE_MESSAGE : data?.error?.message) || 'Analise vazia.'
          analyses.push(`Arquivo: ${a.name}\nTipo: ${data?.type || 'unknown'}\n${text}`)
        }
        const finalMessages = [...newMessages, { role:'assistant', content: analyses.join('\n\n') }]
        setMessages(finalMessages)
        exchangeRef.current++
        if (exchangeRef.current % 3 === 0) triggerLearning(finalMessages.slice(-12))
        setLoading(false)
        return
      }

      const apiMsgs = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          system: buildPrompt(memory),
          messages: apiMsgs,
        }),
      })
      const data = await readJsonResponse(res)
      const reply = data?.content?.[0]?.text || 'Não consegui processar sua mensagem.'
      const finalMessages = [...newMessages, { role:'assistant', content: reply }]
      setMessages(finalMessages)

      // Dispara aprendizado a cada 3 pares de troca
      exchangeRef.current++
      if (exchangeRef.current % 3 === 0) {
        triggerLearning(finalMessages.slice(-12))
      }
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Erro de conexão. Tente novamente.' }])
    }
    setLoading(false)
  }

  function clearMemory() {
    const fresh = defaultMemory()
    setMemory(fresh)
    saveMemory(fresh)
  }

  function copyResponse(text) {
    if (!text || typeof navigator === 'undefined') return
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function speakResponse(text) {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  async function shareResponse(text) {
    if (!text || typeof navigator === 'undefined') return
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function showMoreForResponse(text) {
    if (!text || typeof window === 'undefined') return
    window.alert(text)
  }

  function renderMsgContent(m) {
    const text = m._display || (typeof m.content === 'string' ? m.content : '')
    const atts  = m._atts || []
    return (
      <>
        {atts.map((a, i) => (
          <div key={i} style={{ marginBottom:6 }}>
            {isImage(a.mediaType)
              ? <img src={a.previewUrl} alt={a.name} style={{ maxWidth:'100%', maxHeight:140, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', display:'block' }} />
              : <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 8px', background:'rgba(255,255,255,0.15)', borderRadius:6, fontSize:11, fontWeight:600 }}>📄 {a.name}</div>
            }
          </div>
        ))}
        <span style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}
          dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code style="background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:3px">$1</code>') }} />
      </>
    )
  }

  const panelW = expanded ? 580 : 375
  const panelH = expanded ? 700 : 540
  const skillLevels = { 1:'Iniciante', 2:'Básico', 3:'Intermediário', 5:'Avançado', 10:'Especialista' }
  function skillLevel(count) {
    if (count >= 10) return { label:'Especialista', color:'#7C3AED' }
    if (count >= 5)  return { label:'Avançado',     color:'#185FA5' }
    if (count >= 3)  return { label:'Intermediário', color:'#3B6D11' }
    if (count >= 2)  return { label:'Básico',        color:'#B45309' }
    return                  { label:'Iniciante',     color:'#8b93a7' }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button onClick={() => setOpen(o => !o)} title="ACIP Assistant"
        style={{ position:'fixed', bottom:24, right:24, zIndex:10001,
          width:54, height:54, borderRadius:'50%',
          background: open ? '#0C447C' : '#185FA5',
          color:'#fff', border:'none', cursor:'pointer', fontSize:22,
          boxShadow:'0 4px 20px rgba(24,95,165,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.2s' }}>
        {open ? '✕' : '🤖'}
      </button>
      {/* Badge de skills */}
      {!open && memory.skills.length > 0 && (
        <div style={{ position:'fixed', bottom:68, right:20, zIndex:10001,
          background:'#3B6D11', color:'#fff', borderRadius:10, padding:'1px 6px',
          fontSize:9, fontWeight:700, pointerEvents:'none' }}>
          {memory.skills.length} skills
        </div>
      )}

      {open && (
        <div style={{ position:'fixed', bottom:88, right:24, zIndex:10000,
          width:panelW, height:panelH, background:'#fff', borderRadius:16,
          boxShadow:'0 8px 48px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column',
          fontFamily:"'Geist',system-ui,sans-serif", border:'1px solid #e5e8f0',
          overflow:'hidden', transition:'width .2s,height .2s' }}>

          {/* Header */}
          <div style={{ padding:'12px 14px', background:'linear-gradient(135deg,#185FA5,#1a4a8a)',
            display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>ACIP Assistant</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.65)', display:'flex', alignItems:'center', gap:6 }}>
                {memory.skills.length > 0
                  ? <><span style={{ background:'rgba(255,255,255,0.2)', padding:'1px 6px', borderRadius:8 }}>🧠 {memory.skills.length} skills · {memory.conversationCount} conversas</span></>
                  : 'Aprendendo com cada conversa…'
                }
                {learning && <span style={{ opacity:.7 }}>⏳</span>}
              </div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.65)', marginTop:2 }}>{CP1_RUNTIME_MARKER}</div>
            </div>
            {/* Tabs */}
            <div style={{ display:'flex', gap:4 }}>
              {[{ id:'chat', icon:'💬' }, { id:'memory', icon:'🧠' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} title={t.id === 'chat' ? 'Chat' : 'Memória & Skills'}
                  style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', fontSize:14,
                    background: tab===t.id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>{t.icon}</button>
              ))}
              <button onClick={() => setExpanded(e => !e)} title={expanded ? 'Reduzir' : 'Expandir'}
                style={{ width:28, height:28, borderRadius:6, border:'none', color:'rgba(255,255,255,0.8)',
                  background:'rgba(255,255,255,0.12)', cursor:'pointer', fontSize:14,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                {expanded ? '⊟' : '⊞'}
              </button>
            </div>
          </div>

          {/* ── TAB: CHAT ─────────────────────────────────────────────── */}
          {tab === 'chat' && (
            <>
              {/* Mensagens */}
              <div style={{ flex:1, overflowY:'auto', padding:'12px 14px',
                display:'flex', flexDirection:'column', gap:10, background:'#f8f9fc' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                    {m.role==='assistant' && (
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA5',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, flexShrink:0, marginRight:6, marginTop:2 }}>🤖</div>
                    )}
                    <div style={{ maxWidth:'83%', padding:'9px 12px',
                      borderRadius: m.role==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                      background: m.role==='user' ? '#185FA5' : '#fff',
                      color: m.role==='user' ? '#fff' : '#1a1f36',
                      fontSize:12, lineHeight:1.65,
                      border: m.role==='assistant' ? '1px solid #e5e8f0' : 'none' }}>
                      {renderMsgContent(m)}
                      {m.role === 'assistant' && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                          <button onClick={() => copyResponse(typeof m.content === 'string' ? m.content : '')} style={responseActionStyle}>Copy</button>
                          <button onClick={() => speakResponse(typeof m.content === 'string' ? m.content : '')} style={responseActionStyle}>Speak</button>
                          <button onClick={() => shareResponse(typeof m.content === 'string' ? m.content : '')} style={responseActionStyle}>Share</button>
                          <button onClick={() => showMoreForResponse(typeof m.content === 'string' ? m.content : '')} style={responseActionStyle}>More</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA5',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🤖</div>
                    <div style={{ padding:'9px 14px', background:'#fff', borderRadius:'4px 12px 12px 12px',
                      border:'1px solid #e5e8f0', fontSize:12, color:'#8b93a7' }}>
                      Processando…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* FAQs */}
              {messages.length <= 1 && (
                <div style={{ padding:'8px 12px', background:'#fff', borderTop:'1px solid #e5e8f0', flexShrink:0 }}>
                  <div style={{ fontSize:10, color:'#8b93a7', marginBottom:5, fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'.06em' }}>Sugestões</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {FAQS.map((q,i) => (
                      <button key={i} onClick={() => sendMessage(q)}
                        style={{ fontSize:10, padding:'3px 8px', background:'#EFF4FF', color:'#185FA5',
                          border:'1px solid #B5D4F4', borderRadius:20, cursor:'pointer', fontFamily:'inherit' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Previews de anexo */}
              {attachments.length > 0 && (
                <div style={{ padding:'6px 12px', background:'#fff',
                  borderTop:'1px solid #e5e8f0', display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
                  {attachments.map((a, i) => (
                    <div key={i} style={{ position:'relative' }}>
                      {isImage(a.mediaType)
                        ? <img src={a.previewUrl} alt={a.name} style={{ height:50, width:50, objectFit:'cover', borderRadius:6, border:'1px solid #e5e8f0', display:'block' }} />
                        : <div style={{ height:50, width:50, borderRadius:6, background:'#EFF4FF', border:'1px solid #B5D4F4',
                            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
                            <span style={{ fontSize:18 }}>📄</span>
                            <span style={{ fontSize:8, color:'#185FA5', fontWeight:600, textAlign:'center' }}>{a.name.split('.').pop().toUpperCase()}</span>
                          </div>
                      }
                      <button onClick={() => removeAtt(i)}
                        style={{ position:'absolute', top:-4, right:-4, width:15, height:15, borderRadius:'50%',
                          background:'#E53E3E', color:'#fff', border:'none', cursor:'pointer',
                          fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding:'10px 12px', background:'#fff', borderTop:'1px solid #e5e8f0', flexShrink:0 }}>
                <input type="file" ref={fileInputRef} style={{ display:'none' }} multiple
                  accept="*/*" onChange={e => handleFiles(e.target.files)} />
                <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
                  <button onClick={() => fileInputRef.current?.click()} title="Anexar arquivo"
                    style={{ width:34, height:34, borderRadius:8, background:'#f0f2f5',
                      border:'1px solid #e5e8f0', cursor:'pointer', fontSize:16, flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>📎</button>
                  <textarea value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,96)+'px' }}
                    onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    onPaste={handlePaste}
                    placeholder="Pergunte qualquer coisa… ou cole um print (Ctrl+V)"
                    rows={1}
                    style={{ flex:1, padding:'7px 10px', border:'1px solid #e5e8f0', borderRadius:8,
                      fontSize:12, fontFamily:'inherit', background:'#f8f9fc', color:'#1a1f36',
                      outline:'none', resize:'none', overflow:'hidden', lineHeight:1.5,
                      minHeight:34, maxHeight:96 }} />
                  <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && !attachments.length)}
                    style={{ width:34, height:34, background:'#185FA5', color:'#fff', border:'none',
                      borderRadius:8, cursor:'pointer', fontSize:16, fontWeight:700, flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      opacity: loading || (!input.trim() && !attachments.length) ? 0.45 : 1 }}>↑</button>
                </div>
                <div style={{ fontSize:9, color:'#b0b8cc', marginTop:4, textAlign:'center' }}>
                  Enter para enviar · Shift+Enter nova linha · Ctrl+V colar print
                </div>
              </div>
            </>
          )}

          {/* ── TAB: MEMÓRIA ──────────────────────────────────────────── */}
          {tab === 'memory' && (
            <div style={{ flex:1, overflowY:'auto', padding:'16px', background:'#f8f9fc',
              display:'flex', flexDirection:'column', gap:16 }}>

              {/* Estatísticas */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[
                  { icon:'💬', val: memory.conversationCount, label:'Conversas' },
                  { icon:'🧠', val: memory.skills.length,     label:'Skills' },
                  { icon:'📌', val: memory.facts.length,       label:'Fatos aprendidos' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fff', borderRadius:10,
                    padding:'12px 10px', textAlign:'center', border:'1px solid #e5e8f0' }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#1a1f36' }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'#8890a0' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Skills adquiridas */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#185FA5', textTransform:'uppercase',
                  letterSpacing:'.08em', marginBottom:8 }}>🎯 Skills Adquiridas</div>
                {memory.skills.length === 0 ? (
                  <div style={{ padding:'16px', background:'#fff', borderRadius:10,
                    border:'1px dashed #d0d5e0', textAlign:'center', fontSize:12, color:'#8890a0' }}>
                    Nenhuma skill ainda.<br/>Converse para começar a aprender!
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {memory.skills.map((sk, i) => {
                      const lv = skillLevel(sk.count)
                      return (
                        <div key={i} style={{ background:'#fff', borderRadius:8, padding:'8px 12px',
                          border:'1px solid #e5e8f0', display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36' }}>{sk.name}</div>
                            <div style={{ fontSize:9, color:'#8890a0', marginTop:2 }}>
                              Usado {sk.count}x · {fmtDate(sk.lastUsed)}
                            </div>
                          </div>
                          {/* Barra de progresso */}
                          <div style={{ width:60 }}>
                            <div style={{ fontSize:9, color:lv.color, fontWeight:700, marginBottom:2, textAlign:'right' }}>{lv.label}</div>
                            <div style={{ height:4, background:'#f0f2f5', borderRadius:2 }}>
                              <div style={{ height:'100%', borderRadius:2, background:lv.color,
                                width: Math.min(100, (sk.count / 10) * 100) + '%', transition:'width .4s' }} />
                            </div>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:lv.color, minWidth:20, textAlign:'center' }}>
                            {['','⭐','⭐','★★','★★','★★★','★★★','★★★','★★★','★★★','🏆'][Math.min(10,sk.count)] || '🏆'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Fatos aprendidos */}
              {memory.facts.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#3B6D11', textTransform:'uppercase',
                    letterSpacing:'.08em', marginBottom:8 }}>📌 Contexto sobre Você</div>
                  <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8f0', overflow:'hidden' }}>
                    {memory.facts.slice().reverse().slice(0, 10).map((f, i) => (
                      <div key={i} style={{ padding:'8px 12px', fontSize:11, color:'#1a1f36',
                        borderBottom: i < Math.min(9, memory.facts.length-1) ? '1px solid #f5f5f5' : 'none',
                        display:'flex', alignItems:'flex-start', gap:8 }}>
                        <span style={{ flexShrink:0, color:'#3B6D11' }}>•</span>
                        <span style={{ flex:1, lineHeight:1.5 }}>{f.text}</span>
                        <span style={{ flexShrink:0, fontSize:9, color:'#b0b8cc' }}>{fmtDate(f.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de conversas */}
              {memory.summaries.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#8A4E2F', textTransform:'uppercase',
                    letterSpacing:'.08em', marginBottom:8 }}>📋 Histórico de Tópicos</div>
                  <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8f0', overflow:'hidden' }}>
                    {memory.summaries.slice().reverse().slice(0, 8).map((s, i) => (
                      <div key={i} style={{ padding:'8px 12px', fontSize:11, color:'#1a1f36',
                        borderBottom: i < Math.min(7, memory.summaries.length-1) ? '1px solid #f5f5f5' : 'none',
                        display:'flex', alignItems:'flex-start', gap:8 }}>
                        <span style={{ flexShrink:0, color:'#8A4E2F' }}>💬</span>
                        <span style={{ flex:1, lineHeight:1.5 }}>{s.text}</span>
                        <span style={{ flexShrink:0, fontSize:9, color:'#b0b8cc' }}>{fmtDate(s.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão limpar memória */}
              {(memory.skills.length > 0 || memory.facts.length > 0) && (
                <button onClick={() => { if (confirm('Apagar toda a memória e skills aprendidas?')) clearMemory() }}
                  style={{ padding:'9px', border:'1px solid #f09595', borderRadius:8, background:'#fcebeb',
                    color:'#a32d2d', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  🗑️ Apagar toda a memória
                </button>
              )}

              {(memory.skills.length === 0 && memory.facts.length === 0) && (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🤖</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:6 }}>Pronto para aprender!</div>
                  <div style={{ fontSize:11, color:'#8890a0', lineHeight:1.6 }}>
                    Cada conversa ensina o assistente.<br/>
                    Após ~3 trocas, ele extrai skills e<br/>contexto automaticamente.
                  </div>
                  <button onClick={() => setTab('chat')}
                    style={{ marginTop:14, padding:'8px 20px', border:'none', borderRadius:8,
                      background:'#185FA5', color:'#fff', fontSize:12, fontWeight:600,
                      cursor:'pointer', fontFamily:'inherit' }}>
                    💬 Começar a conversar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

const responseActionStyle = {
  border: '1px solid #cfd6e6',
  borderRadius: 6,
  background: '#f8fafc',
  color: '#1a1f36',
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 8px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
