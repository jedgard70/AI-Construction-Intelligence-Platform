import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `Você é o ACIP Assistant — um assistente de IA avançado integrado à AI Construction Intelligence Platform v5.3.

Você pode ajudar com QUALQUER assunto: engenharia civil, arquitetura, gestão de obras, direito, finanças, cálculos, pesquisas técnicas, análise de documentos, imagens, plantas, prints de tela, e perguntas gerais.

Quando o usuário enviar uma imagem ou print, analise-a com detalhes e responda com base no que vê.
Quando enviar um PDF, leia o conteúdo e explique ou responda perguntas sobre ele.

ESPECIALIDADE PRINCIPAL — Plataforma ConstructAI v5.3:
- Dashboard: KPIs por role, CPI, SPI, EAC, VAC, TCPI e Curva S
- Agentes IA: BIM Coordinator, Construction Planner, Cost Controller, Risk Analysis, Safety Monitor, Investment Analyst, Quality Control, Doc Intelligence
- RDO: registro diário de obra com equipe, clima e ocorrências
- Qualidade / NCIs: não conformidades com prazo e plano de ação
- Segurança: NR-06/10/18/33/35, EPIs e TFA
- BIM: upload IFC/RVT/DWG, clash detection, 6D e 7D
- Investimentos: ROI, TIR, NOI, Cap Rate, ESG Score
- SINAPI: preços unitários em tempo real
- Visualizador: PDF, DWG, DXF, DGN, IFC, RVT, FBX, STL, STEP, OBJ, SAT, gbXML

OUTRAS COMPETÊNCIAS:
- Cálculos de engenharia (estrutural, hidráulica, elétrica, solos)
- Normas ABNT, NRs, NBR 15575, PBQP-H
- Orçamentação e cronogramas (MS Project, Primavera, BIM 4D)
- Análise de contratos e documentos jurídicos
- Pesquisa técnica e científica
- Matemática, física, química e ciências
- Tecnologia, programação e TI
- Negócios, gestão e finanças

Seja direto, detalhado quando necessário, e use markdown para organizar respostas longas. Responda em português brasileiro por padrão, mas se o usuário escrever em outro idioma, responda nesse idioma.`

const FAQS = [
  '📊 Como interpretar o CPI e SPI?',
  '🏗️ Como usar o visualizador de plantas?',
  '📄 Analise este documento para mim',
  '🔍 Como abrir uma NCI de qualidade?',
  '💰 Como calcular ROI de uma obra?',
  '⚠️ Quais NRs se aplicam em obras?',
]

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
  const map = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp', pdf:'application/pdf' }
  return map[ext] || 'application/octet-stream'
}

function isImage(mediaType) {
  return mediaType.startsWith('image/')
}

function isPDF(mediaType) {
  return mediaType === 'application/pdf'
}

export default function HelpButton() {
  const [open, setOpen]         = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Olá! Sou o **ACIP Assistant** — posso ajudar com a plataforma, engenharia, pesquisas, cálculos e qualquer dúvida.\n\nEnvie texto, uma imagem (print de tela, foto, planta) ou um PDF e vou analisar!' }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [attachments, setAttachments] = useState([])
  const bottomRef               = useRef(null)
  const fileInputRef            = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  async function handleFiles(files) {
    const allowed = Array.from(files).filter(f => {
      const mt = getMediaType(f)
      return isImage(mt) || isPDF(mt)
    })
    if (!allowed.length) return
    const previews = await Promise.all(allowed.map(async f => {
      const b64 = await fileToBase64(f)
      const mt  = getMediaType(f)
      return { name: f.name, base64: b64, mediaType: mt, previewUrl: URL.createObjectURL(f) }
    }))
    setAttachments(prev => [...prev, ...previews])
  }

  function removeAttachment(idx) {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItems = items.filter(it => it.type.startsWith('image/'))
    if (!imageItems.length) return
    e.preventDefault()
    const files = imageItems.map(it => it.getAsFile()).filter(Boolean)
    handleFiles(files)
  }

  async function sendMessage(text) {
    const question = text || input.trim()
    if ((!question && !attachments.length) || loading) return
    setInput('')

    const contentBlocks = []
    for (const att of attachments) {
      if (isImage(att.mediaType)) {
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: att.mediaType, data: att.base64 } })
      } else if (isPDF(att.mediaType)) {
        contentBlocks.push({ type: 'document', source: { type: 'base64', media_type: att.mediaType, data: att.base64 } })
      }
    }
    if (question) contentBlocks.push({ type: 'text', text: question })

    const userMsg = {
      role: 'user',
      content: contentBlocks.length === 1 && contentBlocks[0].type === 'text'
        ? question
        : contentBlocks,
      _display: question || (attachments.length === 1 ? attachments[0].name : `${attachments.length} arquivos`),
      _attachments: attachments.map(a => ({ name: a.name, mediaType: a.mediaType, previewUrl: a.previewUrl })),
    }

    setAttachments([])
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => !(m.role === 'assistant' && m === messages[0]))
        .map(m => ({
          role: m.role,
          content: Array.isArray(m.content) ? m.content : m.content,
        }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Verifique sua internet e tente novamente.' }])
    }
    setLoading(false)
  }

  function renderContent(m) {
    const text = m._display || (typeof m.content === 'string' ? m.content : null)
    const atts  = m._attachments || []
    const lines = (text || '').split('\n')

    const rendered = lines.map((line, li) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
      return <span key={li} dangerouslySetInnerHTML={{ __html: bold + (li < lines.length - 1 ? '<br/>' : '') }} />
    })

    return (
      <>
        {atts.map((a, ai) => (
          <div key={ai} style={{ marginBottom: 6 }}>
            {isImage(a.mediaType) ? (
              <img src={a.previewUrl} alt={a.name}
                style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, display: 'block', border: '1px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 6,
                fontSize: 11, fontWeight: 600 }}>
                📄 {a.name}
              </div>
            )}
          </div>
        ))}
        {rendered}
      </>
    )
  }

  const panelW = expanded ? 560 : 370
  const panelH = expanded ? 680 : 520

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} title="ACIP Assistant"
        style={{ position:'fixed', bottom:24, right:24, zIndex:10001,
          width:52, height:52, borderRadius:'50%',
          background: open ? '#0C447C' : '#185FA5',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:22, boxShadow:'0 4px 20px rgba(24,95,165,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.2s' }}>
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{ position:'fixed', bottom:86, right:24, zIndex:10000,
          width: panelW, height: panelH, background:'#fff', borderRadius:16,
          boxShadow:'0 8px 48px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column',
          fontFamily:"'Geist', system-ui, sans-serif", border:'1px solid #e5e8f0',
          overflow:'hidden', transition:'all 0.2s' }}>

          {/* Header */}
          <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,#185FA5,#1a4a8a)',
            display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:'50%',
              background:'rgba(255,255,255,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>ACIP Assistant</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)' }}>
                Plataforma · Engenharia · Pesquisa · Documentos
              </div>
            </div>
            <button onClick={() => setExpanded(e => !e)} title={expanded ? 'Reduzir' : 'Expandir'}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
                width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              {expanded ? '⊟' : '⊞'}
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px',
            display:'flex', flexDirection:'column', gap:10, background:'#f8f9fc' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA5',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, flexShrink:0, marginRight:6, marginTop:2 }}>🤖</div>
                )}
                <div style={{ maxWidth:'82%', padding:'9px 12px',
                  borderRadius: m.role==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: m.role==='user' ? '#185FA5' : '#fff',
                  color: m.role==='user' ? '#fff' : '#1a1f36',
                  fontSize:12, lineHeight:1.65,
                  border: m.role==='assistant' ? '1px solid #e5e8f0' : 'none',
                  whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {renderContent(m)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', justifyContent:'flex-start', alignItems:'center', gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA5',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🤖</div>
                <div style={{ padding:'9px 14px', background:'#fff', borderRadius:'4px 12px 12px 12px',
                  border:'1px solid #e5e8f0', fontSize:12, color:'#8b93a7',
                  display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ animation:'pulse 1.2s infinite' }}>⏳</span> Processando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* FAQs */}
          {messages.length <= 1 && (
            <div style={{ padding:'8px 14px', background:'#fff',
              borderTop:'1px solid #e5e8f0', flexShrink:0 }}>
              <div style={{ fontSize:10, color:'#8b93a7', marginBottom:6, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'.06em' }}>Sugestões</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {FAQS.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{ fontSize:10, padding:'4px 9px',
                      background:'#EFF4FF', color:'#185FA5',
                      border:'1px solid #B5D4F4', borderRadius:20,
                      cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div style={{ padding:'6px 12px', background:'#fff',
              borderTop:'1px solid #e5e8f0', display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
              {attachments.map((a, i) => (
                <div key={i} style={{ position:'relative', display:'inline-block' }}>
                  {isImage(a.mediaType) ? (
                    <img src={a.previewUrl} alt={a.name}
                      style={{ height:52, width:52, objectFit:'cover',
                        borderRadius:6, border:'1px solid #e5e8f0', display:'block' }} />
                  ) : (
                    <div style={{ height:52, width:52, borderRadius:6, background:'#EFF4FF',
                      border:'1px solid #B5D4F4', display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:2 }}>
                      <span style={{ fontSize:20 }}>📄</span>
                      <span style={{ fontSize:8, color:'#185FA5', fontWeight:600,
                        maxWidth:46, overflow:'hidden', textOverflow:'ellipsis',
                        whiteSpace:'nowrap', textAlign:'center' }}>
                        {a.name.split('.').pop().toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)}
                    style={{ position:'absolute', top:-4, right:-4, width:16, height:16,
                      borderRadius:'50%', background:'#E53E3E', color:'#fff',
                      border:'none', cursor:'pointer', fontSize:9, lineHeight:1,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px', background:'#fff',
            borderTop:'1px solid #e5e8f0', flexShrink:0 }}>
            <input type="file" ref={fileInputRef} style={{ display:'none' }} multiple
              accept="image/*,.pdf"
              onChange={e => handleFiles(e.target.files)} />

            <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
              <button onClick={() => fileInputRef.current?.click()} title="Anexar imagem ou PDF"
                style={{ width:34, height:34, borderRadius:8, background:'#f0f2f5',
                  border:'1px solid #e5e8f0', cursor:'pointer', fontSize:16, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                📎
              </button>
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,96)+'px' }}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                onPaste={handlePaste}
                placeholder="Pergunte qualquer coisa… ou cole um print (Ctrl+V)"
                rows={1}
                style={{ flex:1, padding:'7px 10px', border:'1px solid #e5e8f0',
                  borderRadius:8, fontSize:12, fontFamily:'inherit',
                  background:'#f8f9fc', color:'#1a1f36', outline:'none',
                  resize:'none', overflow:'hidden', lineHeight:1.5,
                  minHeight:34, maxHeight:96 }}
              />
              <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && !attachments.length)}
                style={{ width:34, height:34, background:'#185FA5', color:'#fff',
                  border:'none', borderRadius:8, cursor:'pointer',
                  fontSize:16, fontWeight:700, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: loading || (!input.trim() && !attachments.length) ? 0.45 : 1 }}>
                ↑
              </button>
            </div>
            <div style={{ fontSize:9, color:'#b0b8cc', marginTop:4, textAlign:'center' }}>
              Enter para enviar · Shift+Enter nova linha · Ctrl+V colar print
            </div>
          </div>
        </div>
      )}
    </>
  )
}
