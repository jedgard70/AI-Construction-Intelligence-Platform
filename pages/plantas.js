import Head from 'next/head'
import { useState, useRef, useCallback } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const EDIFICACAO_TYPES = [
  'Residencial — casa', 'Residencial — apartamento', 'Comercial — escritório',
  'Comercial — loja', 'Industrial — galpão', 'Educacional', 'Saúde — clínica/hospital', 'Hotelaria',
]
const RENDER_STYLES = [
  'Fotorrealista profissional', 'Arquitetônico abstrato', 'Aquarela', 'Lápis e carvão',
  'Render técnico', 'Cartoon / Ilustração',
]
const LOTE_TYPES = [
  'Lote retangular — urbano padrão', 'Lote em esquina', 'Lote irregular',
  'Condomínio fechado', 'Rural / campo', 'Litoral / praia', 'Montanha / serra',
]
const VEGETACAO_TYPES = [
  'Tropical — palmeiras imperiais', 'Tropical — jardim exuberante',
  'Minimalista — grama e pedras', 'Mediterrâneo', 'Deserto — cactos e suculentas',
  'Temperado — árvores caducifólias', 'Sem vegetação — urbano',
]
const ESCALAS = ['1:25', '1:50', '1:75', '1:100', '1:200', '1:500']
const CAMERA_OPTS = [
  { id: 'bird',     label: "Vista Aérea",   icon: '🦅', en: "bird's-eye view from directly above" },
  { id: 'street',   label: 'Nível Rua',     icon: '🚶', en: 'street-level view, pedestrian perspective' },
  { id: 'aerial',   label: 'Perspectiva',   icon: '📐', en: 'aerial perspective, 45-degree angle' },
  { id: 'interior', label: 'Interior',      icon: '🏠', en: 'interior view, inside the building' },
]
const LIGHT_OPTS = [
  { id: 'golden',   label: 'Hora Dourada', icon: '🌅', en: 'golden hour lighting, warm orange sunset' },
  { id: 'morning',  label: 'Manhã',        icon: '☀️', en: 'bright morning light, clear blue sky' },
  { id: 'midday',   label: 'Meio-dia',     icon: '🌤️', en: 'midday sunlight, strong shadows' },
  { id: 'night',    label: 'Noturno',      icon: '🌙', en: 'night scene, artificial lighting, dramatic atmosphere' },
  { id: 'overcast', label: 'Nublado',      icon: '☁️', en: 'overcast soft lighting, diffuse shadows' },
]
const VARIATION_OPTS = [
  { id: 'lush',    label: 'Vegetação Exuberante', icon: '🌿', en: 'lush tropical vegetation, vibrant green landscaping' },
  { id: 'minimal', label: 'Minimalista',          icon: '⬜', en: 'minimal clean landscaping, white and grey tones' },
  { id: 'winter',  label: 'Inverno',              icon: '❄️', en: 'winter scene, bare trees, subtle frost' },
  { id: 'rain',    label: 'Chuva / Nublado',      icon: '🌧️', en: 'rainy atmosphere, wet surfaces, reflections on pavement' },
]

const DEMO = {
  tipo: 'Residência Unifamiliar Térrea de Alto Padrão (Planta Horizontal Extensa)',
  ambientes: [
    { nome: 'Garagem', area: '~45,0 m²' },
    { nome: 'Sala de Visita / Living', area: '~38,0 m²' },
    { nome: 'Copa / Cozinha', area: '~22,0 m²' },
    { nome: 'Área Gourmet / BBQ', area: '~28,0 m²' },
    { nome: 'Suíte Master', area: '~20,0 m²' },
    { nome: 'Dormitório 2', area: '~14,0 m²' },
    { nome: 'Dormitório 3', area: '~12,0 m²' },
    { nome: 'Banheiro Social', area: '~6,5 m²' },
    { nome: 'Área de Serviço', area: '~8,0 m²' },
  ],
  pessoas: [
    { ambiente: 'Sala de Visita / Living', pessoas: 8, atividade: 'Convívio social, entretenimento' },
    { ambiente: 'Copa / Cozinha', pessoas: 4, atividade: 'Preparo de refeições, café da manhã' },
    { ambiente: 'Área Gourmet / BBQ', pessoas: 12, atividade: 'Churrascos, festas, eventos' },
    { ambiente: 'Suíte Master', pessoas: 2, atividade: 'Repouso, descanso' },
    { ambiente: 'Dormitório 2', pessoas: 2, atividade: 'Repouso, home office' },
    { ambiente: 'Garagem', pessoas: 0, atividade: '2 veículos + circulação' },
  ],
  dallePrompt: `Photorealistic professional architectural visualization of a high-end single-family residence, bird's-eye view, ultra-detailed rendering.

PROPERTY & SITE:
Standard rectangular urban lot 15m x 30m on a quiet residential street.
Sidewalk with concrete pavers, two street-level imperial palm trees flanking the entrance, ornamental tropical grass borders along the property line.

FLOOR PLAN LAYOUT:
- Left zone: Double garage (45m²) with two vehicles visible
- Interior garden/patio with lush green lawn visible from above
- Central social zone: Living room (38m²) with L-shaped sofa, coffee table
- Open-plan kitchen/dining (22m²) with island and dining table
- Outdoor gourmet area (28m²) with pergola and BBQ
- Private zone: Master suite (20m²) with private bathroom
- Two additional bedrooms (14m² and 12m²)

RENDERING STYLE:
Photorealistic professional, golden hour lighting, tropical lush vegetation,
ultra-high detail, architectural visualization, 8K quality, professional render.`,
  palette: [
    { name: 'Cobre Natural',   hex: '#C17D3C', usage: 'Detalhes metálicos, molduras' },
    { name: 'Cinza Pedra',     hex: '#8B8B8B', usage: 'Concreto, pavimentação' },
    { name: 'Verde Imperial',  hex: '#2D5016', usage: 'Vegetação, palmeiras' },
    { name: 'Areia Quente',    hex: '#D4A853', usage: 'Revestimentos, fachada' },
    { name: 'Off-White',       hex: '#F5F0E8', usage: 'Paredes internas, teto' },
    { name: 'Madeira Clara',   hex: '#C9956A', usage: 'Deck, pergolado' },
  ],
  marketing: {
    instagram: '✨ Casa dos sonhos com acabamento premium! 🏡\n\nGaragem para 2 carros, área gourmet perfeita para receber, suíte master com closet e muito mais.\n\n📐 ~185m² de puro requinte e conforto\n🌿 Jardim tropical com palmeiras imperiais\n🍖 Área gourmet / BBQ coberta\n\n📲 Entre em contato e agende sua visita!\n\n#imovel #casadeluxo #arquitetura #construcao #sonho #housedecor',
    whatsapp: 'Olá! Vi a planta desta residência incrível e gostaria de mais informações. Teria disponibilidade para uma visita? Ficou impressionante o projeto — área gourmet, garagem dupla e suíte master! 🏡✨',
    descricao: 'Residência unifamiliar térrea de alto padrão, projeto horizontal extenso com ~185m² privativos. Garagem coberta para 2 veículos, sala de estar integrada ao living, cozinha gourmet com ilha central, área de BBQ com pergolado coberto, suíte master com banheiro privativo, 2 dormitórios adicionais, banheiro social e área de serviço. Acabamentos premium, piso em porcelanato, esquadrias em alumínio de correr. Jardim frontal com paisagismo tropical. Pronto para personalização de interiores.',
  },
}

// ── Helper components ─────────────────────────────────────────────────────────
function Section({ title, icon, rightButton, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#5a6282', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
        {rightButton && (
          <button onClick={rightButton.onClick}
            style={{ marginLeft: 'auto', padding: '4px 12px', background: '#f0f4ff', color: '#185FA5', border: '1px solid #c5d8f5', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {rightButton.label}
          </button>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

function MarketingCard({ title, icon, color, content }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#5a6282', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
        <button onClick={copy} style={{ marginLeft: 'auto', padding: '4px 12px', background: copied ? '#f0fff4' : '#f0f4ff', color: copied ? '#276749' : '#185FA5', border: `1px solid ${copied ? '#9ae6b4' : '#c5d8f5'}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {copied ? '✓ Copiado!' : '📋 Copiar'}
        </button>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <textarea readOnly value={content || ''} rows={4}
          style={{ width: '100%', padding: '10px', border: '1px solid #f0f2f7', borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: 'vertical', background: '#fafbfc', color: '#1a1f36', fontFamily: 'inherit', cursor: 'text' }} />
      </div>
    </div>
  )
}

function OptionBtn({ active, onClick, icon, label, activeColor = '#185FA5', activeBg = '#EFF4FF', activeBorder = '#185FA5' }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', border: active ? `2px solid ${activeBorder}` : '1px solid #e0e0e0',
      borderRadius: 8, background: active ? activeBg : '#fff', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, color: active ? activeColor : '#555',
      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all .15s',
    }}>
      <span>{icon}</span>{label}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlantasPage() {
  const [files, setFiles] = useState([])
  const [selIdx, setSelIdx] = useState(null)
  const [imgType, setImgType] = useState('planta')
  const [params, setParams] = useState({
    edificacao: EDIFICACAO_TYPES[0],
    renderStyle: RENDER_STYLES[0],
    lote: LOTE_TYPES[0],
    vegetacao: VEGETACAO_TYPES[0],
    escala: '1:50',
    pessoas: '6',
  })
  const [tab, setTab] = useState('analise')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [dallePrompt, setDallePrompt] = useState('')
  const [renderImg, setRenderImg] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [renderError, setRenderError] = useState(null)
  const [camera, setCamera] = useState('bird')
  const [light, setLight] = useState('golden')
  const [variation, setVariation] = useState('lush')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Olá! Sou o Assistente de Arquitetura IA. Faça upload de uma planta para análise real, ou clique em "Ver Análise (pronta)" para ver um exemplo. Posso ajudar com normas NBR, sugestões de design e perguntas sobre o projeto.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatPending, setChatPending] = useState(false)
  const fileRef = useRef(null)
  const chatEndRef = useRef(null)

  const currentFile = selIdx !== null ? files[selIdx] : null

  const scaleLabel = (() => {
    const n = parseInt(params.escala.replace('1:', ''))
    const cm = (1.70 * 100) / n
    return `Escala ${params.escala} — figura 1,70m = ${cm.toFixed(2)} cm na planta`
  })()

  const handleUpload = useCallback((fileList) => {
    const arr = Array.from(fileList)
    arr.forEach(file => {
      const entry = { name: file.name, type: file.type, size: file.size, url: URL.createObjectURL(file), b64: null }
      const reader = new FileReader()
      reader.onload = e => {
        setFiles(prev => prev.map(f => f.name === file.name && f.url === entry.url ? { ...f, b64: e.target.result.split(',')[1] } : f))
      }
      reader.readAsDataURL(file)
      setFiles(prev => {
        const next = [...prev, entry]
        if (prev.length === 0) setSelIdx(0)
        return next
      })
    })
  }, [])

  const removeFile = useCallback((i) => {
    setFiles(prev => {
      const next = prev.filter((_, j) => j !== i)
      if (selIdx === i) setSelIdx(next.length > 0 ? 0 : null)
      else if (selIdx > i) setSelIdx(s => s - 1)
      return next
    })
  }, [selIdx])

  const buildAnalysisPrompt = () => {
    const camEn = CAMERA_OPTS.find(c => c.id === camera)?.en || ''
    const litEn = LIGHT_OPTS.find(l => l.id === light)?.en || ''
    const varEn = VARIATION_OPTS.find(v => v.id === variation)?.en || ''
    return `Você é um arquiteto sênior. Analise esta ${imgType === 'planta' ? 'planta baixa' : imgType === 'fachada' ? 'fachada arquitetônica' : 'corte/seção arquitetônica'} e retorne SOMENTE JSON válido (sem markdown, sem texto extra):

{
  "tipo": "descrição do tipo de edificação identificado",
  "ambientes": [{"nome": "nome", "area": "~XX,X m²"}],
  "pessoas": [{"ambiente": "nome", "pessoas": N, "atividade": "descrição"}],
  "dallePrompt": "Prompt COMPLETO em inglês para DALL-E/Stable Diffusion, estilo: ${params.renderStyle}, câmera: ${camEn}, iluminação: ${litEn}, vegetação: ${varEn}, edificação: ${params.edificacao}, lote: ${params.lote}, ultra-detailed, 8K, architectural visualization professional render",
  "palette": [{"name": "nome da cor", "hex": "#hexcode", "usage": "uso na edificação"}],
  "marketing": {
    "instagram": "Caption para Instagram com emojis e hashtags",
    "whatsapp": "Mensagem de captação para WhatsApp",
    "descricao": "Descrição completa para portal imobiliário"
  }
}`
  }

  const handleAnalyze = useCallback(async () => {
    if (!currentFile || analyzing) return
    const file = files[selIdx]
    if (!file.b64) { setTimeout(handleAnalyze, 300); return }

    setAnalyzing(true)
    setTab('analise')
    try {
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const mediaType = isPDF ? 'application/pdf' : (file.type || 'image/jpeg')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: 'Você é um arquiteto sênior especialista. Retorne APENAS JSON válido, sem texto adicional, sem blocos de código markdown.',
          messages: [{
            role: 'user',
            content: [
              { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mediaType, data: file.b64 } },
              { type: 'text', text: buildAnalysisPrompt() }
            ]
          }]
        })
      })
      const data = await res.json()
      const text = data?.content?.[0]?.text || ''
      let parsed
      try {
        const match = text.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(match ? match[0] : text)
      } catch { parsed = DEMO }
      setAnalysis(parsed)
      setDallePrompt(parsed.dallePrompt || DEMO.dallePrompt)
      setMessages(m => [...m, { role: 'assistant', content: `✅ Análise de "${file.name}" concluída! Tipo identificado: ${parsed.tipo}. ${parsed.ambientes?.length || 0} ambientes mapeados. Veja as abas Análise, Paleta e Marketing.` }])
    } catch {
      setAnalysis(DEMO)
      setDallePrompt(DEMO.dallePrompt)
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Erro de conexão. Mostrando análise demo. Configure ANTHROPIC_API_KEY no .env.local para análise real.' }])
    }
    setAnalyzing(false)
  }, [currentFile, files, selIdx, analyzing, imgType, params, camera, light, variation])

  const handleShowDemo = () => {
    setAnalysis(DEMO)
    setDallePrompt(DEMO.dallePrompt)
    setTab('analise')
  }

  const handleRender = useCallback(async () => {
    if (rendering) return
    setRendering(true)
    setRenderError(null)
    const camEn = CAMERA_OPTS.find(c => c.id === camera)?.en || ''
    const litEn = LIGHT_OPTS.find(l => l.id === light)?.en || ''
    const varEn = VARIATION_OPTS.find(v => v.id === variation)?.en || ''
    const fullPrompt = `${dallePrompt || DEMO.dallePrompt}\n\nCAMERA: ${camEn}\nLIGHTING: ${litEn}\nVEGETATION/STYLE: ${varEn}\nRENDER STYLE: ${params.renderStyle}`
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      })
      const data = await res.json()
      if (data.imageData) {
        setRenderImg(`data:${data.mimeType || 'image/jpeg'};base64,${data.imageData}`)
      } else {
        setRenderError(data.hint || data.error || 'API de render não configurada. Configure GEMINI_API_KEY no .env.local.')
      }
    } catch {
      setRenderError('Erro de conexão. Verifique GEMINI_API_KEY no .env.local.')
    }
    setRendering(false)
  }, [rendering, dallePrompt, camera, light, variation, params.renderStyle])

  const sendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || chatPending) return
    setChatInput('')
    setMessages(m => [...m, { role: 'user', content: text }])
    setChatPending(true)
    try {
      const ctx = analysis
        ? `Você analisou: ${analysis.tipo}. Ambientes: ${analysis.ambientes?.map(a => `${a.nome} (${a.area})`).join(', ')}.`
        : 'Aguardando análise de planta.'
      const hist = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          system: `Você é o Assistente de Arquitetura IA, especialista em projetos residenciais e comerciais brasileiros. ${ctx} Responda em português de forma técnica e útil. Cite normas NBR quando relevante.`,
          messages: [...hist, { role: 'user', content: text }]
        })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data?.content?.[0]?.text || 'Erro ao conectar.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '[Erro de conexão — verifique ANTHROPIC_API_KEY]' }])
    }
    setChatPending(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [chatInput, chatPending, messages, analysis])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Studio 3D — Visualizador de Plantas BIM/CAD</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Geist',system-ui,sans-serif;background:#f0f2f5;color:#1a1f36}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#d0d5e0;border-radius:3px}
        select,input,textarea{font-family:inherit}
        .tab-btn{padding:12px 16px;border:none;border-bottom:2px solid transparent;background:transparent;cursor:pointer;font-size:12px;font-weight:500;color:#5a6282;font-family:inherit;transition:all .15s;white-space:nowrap}
        .tab-btn.active{border-bottom-color:#185FA5;color:#185FA5;font-weight:700}
        .opt-btn{padding:8px 14px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#555;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
        .opt-btn:hover{border-color:#aab}
      ` }} />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* ── Title bar ───────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', padding: '8px 20px', borderBottom: '1px solid #e0e3ea', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, zIndex: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1f36' }}>Visualizador de Plantas e Arquivos BIM / CAD</span>
          <span style={{ fontSize: 10, color: '#aaa', letterSpacing: '.03em' }}>PDF · DWG · DXF · DGN · IFC · RVT · DWF · FBX · STL · STEP · OBJ · SAT · gbXML · Navisworks</span>
          <div style={{ flex: 1 }} />
          <a href="/dashboard" style={{ padding: '5px 12px', background: '#f4f5f7', color: '#5a6282', border: '1px solid #e0e3ea', borderRadius: 6, fontSize: 11, cursor: 'pointer', textDecoration: 'none' }}>← Dashboard</a>
        </div>

        {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', overflow: 'hidden', minHeight: 0 }}>

          {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
          <div style={{ background: '#fff', borderRight: '1px solid #e0e3ea', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Abrir arquivo */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f7', flexShrink: 0 }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ width: '100%', background: 'linear-gradient(135deg, #F5A623, #e8940e)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                📁 Abrir arquivo(s)
              </button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }}
                onChange={e => handleUpload(e.target.files)} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f7', flexShrink: 0, maxHeight: 120, overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} onClick={() => setSelIdx(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', background: i === selIdx ? '#EFF4FF' : 'transparent', marginBottom: 2 }}>
                    {f.url && <img src={f.url} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} alt="" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>Imagem · {(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeFile(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, lineHeight: 1, padding: '2px 4px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Scrollable params area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

              {/* 1 — Tipo de imagem */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>1 — TIPO DE IMAGEM</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { id: 'planta', icon: '📐', label: 'Planta Baixa' },
                    { id: 'fachada', icon: '🏢', label: 'Fachada' },
                    { id: 'corte', icon: '✂️', label: 'Corte/Seção' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setImgType(t.id)} style={{
                      padding: '8px 4px', border: imgType === t.id ? '2px solid #185FA5' : '1px solid #e0e3ea',
                      borderRadius: 8, background: imgType === t.id ? '#EFF4FF' : '#fff', cursor: 'pointer',
                      fontSize: 10, fontWeight: 600, color: imgType === t.id ? '#185FA5' : '#555',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                    }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2 — Projeto 2D preview */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>2 — PROJETO 2D</div>
                <div style={{ position: 'relative', width: '100%', height: 120, border: '1px solid #e0e3ea', borderRadius: 8, overflow: 'hidden', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentFile?.url
                    ? <img src={currentFile.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 11, color: '#ccc' }}>Faça upload de uma planta</span>
                  }
                  {currentFile && (
                    <button onClick={() => { removeFile(selIdx) }}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✕ Remover
                    </button>
                  )}
                </div>
              </div>

              {/* 3 — Parâmetros */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>3 — PARÂMETROS</div>

                {[
                  { key: 'edificacao', label: 'TIPO DE EDIFICAÇÃO', opts: EDIFICACAO_TYPES },
                  { key: 'renderStyle', label: 'ESTILO DE RENDERIZAÇÃO', opts: RENDER_STYLES },
                  { key: 'lote', label: 'TIPO DE LOTE / ENTORNO', opts: LOTE_TYPES },
                  { key: 'vegetacao', label: 'VEGETAÇÃO / PAISAGISMO', opts: VEGETACAO_TYPES },
                ].map(({ key, label, opts }) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>{label}</label>
                    <select value={params[key]} onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e0e3ea', borderRadius: 6, fontSize: 12, background: '#fff', color: '#333', outline: 'none' }}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>ESCALA</label>
                    <select value={params.escala} onChange={e => setParams(p => ({ ...p, escala: e.target.value }))}
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #e0e3ea', borderRadius: 6, fontSize: 12, background: '#fff', color: '#333', outline: 'none' }}>
                      {ESCALAS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>Nº PESSOAS</label>
                    <input type="number" value={params.pessoas} onChange={e => setParams(p => ({ ...p, pessoas: e.target.value }))} min="1" max="100"
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #e0e3ea', borderRadius: 6, fontSize: 12, background: '#fff', color: '#333', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ padding: '7px 10px', background: '#f8f9fc', borderRadius: 6, fontSize: 11, color: '#666', marginBottom: 16 }}>
                  📏 {scaleLabel}
                </div>
              </div>

              {/* Categories legend */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>CATEGORIAS</div>
                {[
                  { color: '#e53e3e', label: 'PDF / Documentos' },
                  { color: '#3182ce', label: 'CAD (DWG, DXF, DGN)' },
                  { color: '#38a169', label: 'BIM (IFC, RVT)' },
                  { color: '#805ad5', label: '3D (FBX, STL, OBJ)' },
                  { color: '#d69e2e', label: 'Intercâmbio (STEP, SAT)' },
                  { color: '#2c7a7b', label: 'gbXML / MEP' },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#666' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA button */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f2f7', flexShrink: 0 }}>
              <button onClick={handleAnalyze} disabled={!currentFile || analyzing} style={{
                width: '100%', background: analyzing ? '#888' : 'linear-gradient(135deg, #7B5FE8, #5A3ED5)',
                color: '#fff', border: 'none', borderRadius: 8, padding: '12px',
                fontWeight: 700, cursor: analyzing || !currentFile ? 'not-allowed' : 'pointer',
                fontSize: 13, letterSpacing: '.02em', fontFamily: 'inherit',
                opacity: !currentFile && !analyzing ? .5 : 1,
              }}>
                {analyzing ? '⏳ Analisando...' : '✦ Gerar Análise Completa com IA'}
              </button>
            </div>
          </div>

          {/* ══ RIGHT MAIN AREA ═══════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

            {/* Studio 3D sub-header */}
            <div style={{ background: '#1a2035', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3B6FD4, #5A3ED5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>F</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Studio 3D</div>
                  <div style={{ fontSize: 10, color: '#8b93a7' }}>Plantas, Fachadas e Vídeos com IA</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ padding: '4px 10px', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🇧🇷</button>
                <button style={{ padding: '4px 10px', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🇺🇸</button>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '7px 14px', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} /> Visualizar
                </button>
                <button style={{ padding: '7px 14px', background: '#7B5FE8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🎨 Humanizar
                </button>
                <button onClick={handleShowDemo} style={{ padding: '7px 14px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ Ver Análise (pronta)
                </button>
              </div>
              <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                🖨️ Imprimir
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e0e3ea', padding: '0 18px', display: 'flex', alignItems: 'center', flexShrink: 0, overflowX: 'auto' }}>
              {[
                { id: 'analise',   label: '📊 Análise' },
                { id: 'render',    label: '🎨 Render IA' },
                { id: 'paleta',    label: '🎨 Paleta' },
                { id: 'marketing', label: '📱 Marketing' },
                { id: 'assistente', label: '🤖 Assistente' },
              ].map(t => (
                <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab content (each tab scrolls independently) ──────────────── */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>

              {/* ANÁLISE */}
              {tab === 'analise' && (
                <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#f4f5f7', padding: 24 }}>
                  <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    {!analysis && !analyzing && (
                      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📐</div>
                        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#555' }}>Nenhuma análise ainda</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>Faça upload de uma planta e clique em "Gerar Análise Completa com IA", ou clique em "Ver Análise (pronta)".</div>
                      </div>
                    )}
                    {analyzing && (
                      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
                        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Analisando com Claude Vision...</div>
                        <div style={{ fontSize: 13 }}>Identificando ambientes, áreas e gerando prompts...</div>
                      </div>
                    )}
                    {analysis && !analyzing && (
                      <>
                        <Section title="ANÁLISE" icon="📊">
                          <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f0f4ff', borderRadius: 8, fontSize: 13 }}>
                            <strong>Tipo:</strong> <span style={{ color: '#185FA5' }}>{analysis.tipo}</span>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#f0f4ff' }}>
                                  <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#5a6282', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Ambiente</th>
                                  <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#5a6282', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Área Estimada</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analysis.ambientes?.map((a, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f7' }}>
                                    <td style={{ padding: '9px 14px' }}>{a.nome}</td>
                                    <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 12 }}>{a.area}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        <Section title="AMBIENTES E PESSOAS" icon="👥">
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#f0f4ff' }}>
                                  {['Ambiente', 'Pessoas', 'Atividade'].map(h => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#5a6282', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {analysis.pessoas?.map((p, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f7' }}>
                                    <td style={{ padding: '9px 14px' }}>{p.ambiente}</td>
                                    <td style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 600 }}>{p.pessoas}</td>
                                    <td style={{ padding: '9px 14px', color: '#5a6282' }}>{p.atividade}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        <Section title="PROMPT DALL-E" icon="🔮"
                          rightButton={{ label: '📋 Copiar', onClick: () => navigator.clipboard.writeText(dallePrompt) }}>
                          <textarea value={dallePrompt} onChange={e => setDallePrompt(e.target.value)} rows={12}
                            style={{ width: '100%', padding: '12px', border: '1px solid #e0e3ea', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none', background: '#fafbfc', color: '#1a1f36' }} />
                          <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                            ✏️ Prompt editável. Modifique conforme necessário e clique em "Nova versão" na aba Render IA.
                          </div>
                        </Section>

                        <Section title="CÂMERA" icon="📷">
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            {CAMERA_OPTS.map(c => (
                              <OptionBtn key={c.id} active={camera === c.id} onClick={() => setCamera(c.id)} icon={c.icon} label={c.label} />
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6282', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Iluminação</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            {LIGHT_OPTS.map(l => (
                              <OptionBtn key={l.id} active={light === l.id} onClick={() => setLight(l.id)} icon={l.icon} label={l.label} activeColor="#b7791f" activeBg="#fffbeb" activeBorder="#d69e2e" />
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6282', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Variações</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {VARIATION_OPTS.map(v => (
                              <OptionBtn key={v.id} active={variation === v.id} onClick={() => setVariation(v.id)} icon={v.icon} label={v.label} activeColor="#276749" activeBg="#f0fff4" activeBorder="#38a169" />
                            ))}
                          </div>
                        </Section>

                        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                          <button onClick={() => { handleRender(); setTab('render') }} style={{
                            padding: '14px 40px', background: 'linear-gradient(135deg, #38a169, #2f855a)',
                            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                            fontSize: 15, fontFamily: 'inherit', letterSpacing: '.02em',
                          }}>
                            ✦ Gerar Render com estas opções
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* RENDER IA */}
              {tab === 'render' && (
                <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#f4f5f7' }}>
                  {!renderImg && !rendering && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                      <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
                      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#555' }}>Nenhum render gerado</div>
                      <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
                        {renderError
                          ? <span style={{ color: '#e53e3e' }}>⚠️ {renderError}</span>
                          : 'Configure os parâmetros na aba Análise e gere o render.'}
                      </div>
                      {renderError && (
                        <div style={{ background: '#fff8f0', border: '1px solid #fbd38d', borderRadius: 10, padding: '12px 20px', maxWidth: 520, margin: '0 auto 20px', fontSize: 12, color: '#744210', textAlign: 'left' }}>
                          <strong>Para gerar renders reais:</strong><br />
                          Configure <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>GEMINI_API_KEY</code> no arquivo <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>.env.local</code><br />
                          O prompt DALL-E gerado pode ser usado diretamente em DALL-E 3, Midjourney ou Stable Diffusion.
                        </div>
                      )}
                      <button onClick={handleRender} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #38a169, #2f855a)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                        ✦ Gerar Render
                      </button>
                    </div>
                  )}

                  {rendering && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
                      <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
                      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Gerando render com IA...</div>
                      <div style={{ fontSize: 13 }}>Aguarde alguns segundos...</div>
                    </div>
                  )}

                  {renderImg && !rendering && (
                    <>
                      <div style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <img src={renderImg} alt="Render gerado por IA"
                          style={{ width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain' }} />
                        <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,.5)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 10, letterSpacing: '.05em' }}>
                          Render IA
                        </div>
                      </div>
                      <div style={{ padding: '12px 18px', background: '#fff', display: 'flex', gap: 8, borderBottom: '1px solid #e0e3ea' }}>
                        <a href={renderImg} download="render-ia.jpg"
                          style={{ padding: '9px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          ⬇️ Baixar
                        </a>
                        <button onClick={handleRender} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #38a169, #2f855a)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                          ✦ Nova versão
                        </button>
                      </div>
                    </>
                  )}

                  {/* Reel Preview */}
                  <div style={{ margin: 20, background: '#1a1a2e', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>📱 Reel Preview — Instagram / TikTok</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 140, aspectRatio: '9/16', background: '#2a2a3e', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderImg
                            ? <img src={renderImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            : <span style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: 8 }}>Gere um render primeiro</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PALETA */}
              {tab === 'paleta' && (
                <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#f4f5f7', padding: 24 }}>
                  <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    {!analysis ? (
                      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
                        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#555' }}>Nenhuma paleta ainda</div>
                        <div style={{ fontSize: 13 }}>Gere uma análise para ver a paleta de cores do projeto.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 20 }}>
                          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f36', marginBottom: 4 }}>Paleta de Cores do Projeto</h2>
                          <p style={{ fontSize: 13, color: '#888' }}>Clique em qualquer cor para copiar o hex code.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                          {analysis.palette?.map((c, i) => (
                            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e3ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.05)', cursor: 'pointer' }}
                              onClick={() => navigator.clipboard.writeText(c.hex)}>
                              <div style={{ height: 100, background: c.hex, position: 'relative' }}>
                                <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,.35)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace' }}>{c.hex}</div>
                              </div>
                              <div style={{ padding: '10px 12px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                                <div style={{ fontSize: 10, color: '#aaa' }}>{c.usage}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e3ea', padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#5a6282', marginBottom: 10 }}>Barra de cores</div>
                          <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden' }}>
                            {analysis.palette?.map((c, i) => (
                              <div key={i} style={{ flex: 1, background: c.hex, cursor: 'pointer', position: 'relative' }} title={`${c.name} — ${c.hex}`}
                                onClick={() => navigator.clipboard.writeText(c.hex)} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* MARKETING */}
              {tab === 'marketing' && (
                <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#f4f5f7', padding: 24 }}>
                  <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    {!analysis ? (
                      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
                        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#555' }}>Nenhum conteúdo de marketing ainda</div>
                        <div style={{ fontSize: 13 }}>Gere uma análise para ver o conteúdo de marketing pronto.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 20 }}>
                          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f36', marginBottom: 4 }}>Conteúdo de Marketing</h2>
                          <p style={{ fontSize: 13, color: '#888' }}>Copie e use diretamente nas suas plataformas.</p>
                        </div>
                        <MarketingCard title="Instagram / Reels" icon="📸" color="#E1306C" content={analysis.marketing?.instagram} />
                        <MarketingCard title="WhatsApp — Captação" icon="💬" color="#25D366" content={analysis.marketing?.whatsapp} />
                        <MarketingCard title="Portal Imobiliário — Descrição" icon="🏠" color="#185FA5" content={analysis.marketing?.descricao} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ASSISTENTE */}
              {tab === 'assistente' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f4f5f7' }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '72%', padding: '10px 14px', fontSize: 13, lineHeight: 1.65, borderRadius: 12,
                          background: m.role === 'user' ? '#185FA5' : '#fff',
                          color: m.role === 'user' ? '#fff' : '#1a1f36',
                          border: m.role === 'assistant' ? '1px solid #e0e3ea' : 'none',
                          whiteSpace: 'pre-wrap',
                          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                        }}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatPending && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ padding: '10px 16px', background: '#fff', border: '1px solid #e0e3ea', borderRadius: 12, fontSize: 13, color: '#888' }}>⏳ Pensando...</div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #e0e3ea', display: 'flex', gap: 8, flexShrink: 0 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                      placeholder="Pergunte sobre o projeto, normas NBR, design, estrutura..."
                      style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0e3ea', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#f8f9fc' }} />
                    <button onClick={sendChat} disabled={!chatInput.trim() || chatPending}
                      style={{ padding: '10px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: chatInput.trim() && !chatPending ? 'pointer' : 'not-allowed', fontSize: 13, fontFamily: 'inherit', opacity: !chatInput.trim() || chatPending ? .5 : 1 }}>
                      →
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
