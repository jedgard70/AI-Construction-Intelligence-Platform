import Head from 'next/head'
import { useState, useRef, useCallback } from 'react'

// ── Drawing data (architectural floor plan schematic) ─────────────────────
const DRAWING = {
  viewBox: '0 0 1400 900',
  walls: [
    'M 120 140 L 1280 140 L 1280 760 L 120 760 Z',
    'M 120 360 L 760 360', 'M 760 140 L 760 760', 'M 760 520 L 1280 520',
    'M 380 140 L 380 360', 'M 540 360 L 540 760', 'M 980 520 L 980 760',
    'M 120 580 L 540 580', 'M 320 580 L 320 760',
  ],
  doors: [
    { x:250, y:360, r:28, sweep:'M 250 360 a 28 28 0 0 0 28 -28' },
    { x:540, y:460, r:26, sweep:'M 540 460 a 26 26 0 0 1 26 -26' },
    { x:760, y:260, r:28, sweep:'M 760 260 a 28 28 0 0 0 -28 -28' },
    { x:980, y:640, r:24, sweep:'M 980 640 a 24 24 0 0 1 24 24' },
    { x:380, y:250, r:24, sweep:'M 380 250 a 24 24 0 0 0 -24 24' },
    { x:220, y:580, r:20, sweep:'M 220 580 a 20 20 0 0 1 20 -20' },
  ],
  windows: [
    { x:200, y:140, w:80 }, { x:460, y:140, w:80 },
    { x:880, y:140, w:100 }, { x:1100, y:140, w:100 },
  ],
  stairs: { x:1020, y:580, w:200, h:140 },
  dims: [
    { x1:120, y1:100, x2:380, y2:100, label:"8'400", h:true },
    { x1:380, y1:100, x2:760, y2:100, label:"12'200", h:true },
    { x1:760, y1:100, x2:1280, y2:100, label:"16'800", h:true },
    { x1:80, y1:140, x2:80, y2:360, label:"7'100", h:false },
    { x1:80, y1:360, x2:80, y2:760, label:"12'900", h:false },
  ],
  rooms: [
    { id:'A01', x:250,  y:250, name:'Lobby',       area:'182 m²' },
    { id:'A02', x:570,  y:250, name:'Open Office',  area:'264 m²' },
    { id:'A03', x:1020, y:250, name:'Sala Reuniões',area:'118 m²' },
    { id:'A04', x:330,  y:470, name:'Apoio',        area:'76 m²'  },
    { id:'A05', x:650,  y:640, name:'WC',           area:'32 m²'  },
    { id:'A06', x:220,  y:670, name:'Depósito',     area:'42 m²'  },
    { id:'A07', x:430,  y:670, name:'Mec.',         area:'38 m²'  },
    { id:'A08', x:870,  y:640, name:'Corredor',     area:'104 m²' },
    { id:'A09', x:1140, y:660, name:'Escada 1',     area:'28 m²'  },
  ],
}

const INITIAL_FINDINGS = [
  { id:'F-014', x:226, y:248, w:72, h:28, cat:'code',          sev:'high', conf:0.94,
    title:'Largura de saída abaixo do mínimo normativo',
    body:'Corredor A04 mede 1.05 m livre. NBR 9077 exige ≥ 1.20 m para lotação > 50.',
    ref:'NBR 9077 §4.5.3', room:'A04 · Apoio', status:'open' },
  { id:'F-021', x:1018, y:256, w:90, h:26, cat:'clash',        sev:'high', conf:0.88,
    title:'Conflito duto HVAC × viga estrutural',
    body:'Duto Ø450 mm a FFL+2.85 conflita com viga W14×30 no grid C-4.',
    ref:'Quadro de Vigas §2.1', room:'A03 · Sala Reuniões', status:'open' },
  { id:'F-009', x:470, y:145, w:38, h:22, cat:'missing',       sev:'med',  conf:0.82,
    title:'Tag de janela ausente',
    body:'Janela W-12 na elevação norte não tem etiqueta nesta folha. Visível em A-301.',
    ref:'Padrão de Desenho', room:'A02 · Open Office', status:'open' },
  { id:'F-027', x:660, y:650, w:60, h:24, cat:'accessibility', sev:'med',  conf:0.91,
    title:'Raio de giro WC abaixo do mínimo',
    body:'Raio de giro para cadeirante A05 é 1.42 m. NBR 9050 exige mínimo 1.50 m.',
    ref:'NBR 9050 §8.3 / ADA §304.3', room:'A05 · WC', status:'open' },
  { id:'F-031', x:870, y:638, w:84, h:22, cat:'dimension',     sev:'low',  conf:0.76,
    title:'Discrepância em string de cotas',
    body:'Corredor A08 acumulado é 14\'620; somas parciais totalizam 14\'580. Delta de 40 mm.',
    ref:'Padrão de Desenho', room:'A08 · Corredor', status:'open' },
  { id:'F-038', x:220, y:668, w:64, h:22, cat:'missing',       sev:'low',  conf:0.71,
    title:'Sentido de abertura de porta não indicado',
    body:'Porta D-06 sem indicador de abertura. Confirmar sentido.',
    ref:'Padrão de Desenho', room:'A06 · Depósito', status:'open' },
  { id:'F-042', x:1138, y:660, w:56, h:22, cat:'code',         sev:'med',  conf:0.84,
    title:'Espelho de degrau inconsistente',
    body:'Degraus Escada 1 variam 27–30 cm. NBR 9050 exige espelho/piso consistentes.',
    ref:'NBR 9050 §6.8', room:'A09 · Escada 1', status:'open' },
]

const CAT_META = {
  code:          { label:'Código',        color:'#A32D2D', bg:'#FCEBEB' },
  clash:         { label:'Conflito',      color:'#534AB7', bg:'#F0EEFF' },
  missing:       { label:'Dado ausente',  color:'#BA7517', bg:'#FAEEDA' },
  accessibility: { label:'Acessibilidade',color:'#185FA5', bg:'#EFF4FF' },
  dimension:     { label:'Dimensão',      color:'#3B6D11', bg:'#EAF3DE' },
}
const SEV_DOT = { high:'#A32D2D', med:'#BA7517', low:'#8b93a7' }

// ── Drawing SVG component ─────────────────────────────────────────────────
function FloorPlanSVG({ findings, selectedId, hoverId, onPick, onMove, zoom }) {
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  const onPointerDown = (e, f) => {
    e.stopPropagation()
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const inv = svgRef.current.getScreenCTM().inverse()
    const start = pt.matrixTransform(inv)
    dragRef.current = { id: f.id, ox: start.x - f.x, oy: start.y - f.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragRef.current) return
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
    onMove(dragRef.current.id,
      Math.max(60, Math.min(1340, p.x - dragRef.current.ox)),
      Math.max(60, Math.min(840, p.y - dragRef.current.oy)))
  }
  const onPointerUp = () => { dragRef.current = null }

  return (
    <svg ref={svgRef} viewBox={DRAWING.viewBox}
      style={{ width:'100%', height:'100%', display:'block',
        background:'#f8f9fc', cursor:'crosshair' }}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e8f0" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* paper */}
      <rect x="40" y="40" width="1320" height="820" rx="4" fill="#fff" stroke="#e5e8f0"/>
      <rect x="40" y="40" width="1320" height="820" fill="url(#grid)"/>

      {/* dims */}
      {DRAWING.dims.map((d, i) => {
        const mx = (d.x1+d.x2)/2, my = (d.y1+d.y2)/2
        return (
          <g key={i} stroke="#8b93a7" strokeWidth="0.8" fill="#8b93a7">
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}/>
            {d.h ? <>
              <line x1={d.x1} y1={d.y1-5} x2={d.x1} y2={d.y1+5}/>
              <line x1={d.x2} y1={d.y2-5} x2={d.x2} y2={d.y2+5}/>
              <text x={mx} y={d.y1-8} fontSize="10" fontFamily="monospace" textAnchor="middle" stroke="none">{d.label}</text>
            </> : <>
              <line x1={d.x1-5} y1={d.y1} x2={d.x1+5} y2={d.y1}/>
              <line x1={d.x2-5} y1={d.y2} x2={d.x2+5} y2={d.y2}/>
              <text x={d.x1-8} y={my} fontSize="10" fontFamily="monospace" textAnchor="end" dominantBaseline="middle" stroke="none">{d.label}</text>
            </>}
          </g>
        )
      })}

      {/* walls */}
      <g stroke="#1a1f36" strokeWidth="3" fill="none" strokeLinecap="square">
        {DRAWING.walls.map((d, i) => <path key={i} d={d}/>)}
      </g>

      {/* doors */}
      <g stroke="#1a1f36" strokeWidth="1" fill="none" opacity=".8">
        {DRAWING.doors.map((d, i) => (
          <g key={i}><path d={d.sweep}/><line x1={d.x} y1={d.y} x2={d.x+d.r} y2={d.y}/></g>
        ))}
      </g>

      {/* windows */}
      <g stroke="#1a1f36" strokeWidth="1" fill="#fff">
        {DRAWING.windows.map((w, i) => (
          <g key={i}>
            <rect x={w.x} y={w.y-3} width={w.w} height={6} fill="#fff" stroke="#1a1f36"/>
            <line x1={w.x} y1={w.y} x2={w.x+w.w} y2={w.y} stroke="#1a1f36"/>
          </g>
        ))}
      </g>

      {/* stairs */}
      <g stroke="#1a1f36" strokeWidth="1" fill="none">
        <rect x={DRAWING.stairs.x} y={DRAWING.stairs.y} width={DRAWING.stairs.w} height={DRAWING.stairs.h}/>
        {[1,2,3,4,5,6].map(j => (
          <line key={j}
            x1={DRAWING.stairs.x} y1={DRAWING.stairs.y + j*(DRAWING.stairs.h/7)}
            x2={DRAWING.stairs.x+DRAWING.stairs.w} y2={DRAWING.stairs.y + j*(DRAWING.stairs.h/7)}/>
        ))}
      </g>

      {/* room labels */}
      {DRAWING.rooms.map(r => (
        <g key={r.id} fill="#5a6282" style={{ pointerEvents:'none' }}>
          <text x={r.x} y={r.y-4} fontSize="13" fontWeight="500" fontFamily="Geist,sans-serif" textAnchor="middle">{r.name}</text>
          <text x={r.x} y={r.y+12} fontSize="9" fontFamily="monospace" textAnchor="middle" opacity=".7">{r.id} · {r.area}</text>
        </g>
      ))}

      {/* AI findings */}
      {findings.map(f => {
        const meta = CAT_META[f.cat]
        const sel = selectedId === f.id
        const hov = hoverId === f.id
        return (
          <g key={f.id} style={{ cursor:'grab' }}
             onClick={e => { e.stopPropagation(); onPick(f.id) }}
             onPointerDown={e => onPointerDown(e, f)}>
            <rect x={f.x} y={f.y} width={f.w} height={f.h}
              fill={sel ? meta.color+'18' : 'transparent'}
              stroke={meta.color}
              strokeWidth={sel ? 2.5 : 1.6}
              strokeDasharray={hov && !sel ? '4 3' : '0'}
              rx="2"
              style={{ transition:'stroke-width .15s' }}/>
            <circle cx={f.x+f.w} cy={f.y} r={sel ? 10 : 8}
              fill={meta.color}
              style={{ filter: sel ? 'drop-shadow(0 0 5px rgba(0,0,0,.25))' : 'none',
                transition:'r .15s' }}/>
            <text x={f.x+f.w} y={f.y+3.5} fontSize="9" fontFamily="monospace"
              fontWeight="600" fill="white" textAnchor="middle"
              style={{ pointerEvents:'none' }}>
              {f.id.replace('F-','')}
            </text>
          </g>
        )
      })}

      {/* sheet stamp */}
      <g transform="translate(1080 776)" fontFamily="monospace" fill="#8b93a7" style={{ pointerEvents:'none' }}>
        <rect x="0" y="0" width="200" height="72" rx="2" fill="none" stroke="#8b93a7" strokeWidth="0.8"/>
        <line x1="0" y1="24" x2="200" y2="24" stroke="#8b93a7" strokeWidth="0.5"/>
        <line x1="0" y1="48" x2="200" y2="48" stroke="#8b93a7" strokeWidth="0.5"/>
        <line x1="120" y1="0" x2="120" y2="72" stroke="#8b93a7" strokeWidth="0.5"/>
        <text x="6" y="16" fontSize="10">FOLHA</text>
        <text x="124" y="16" fontSize="10">A-201</text>
        <text x="6" y="40" fontSize="10">ESCALA</text>
        <text x="124" y="40" fontSize="10">1 : 100</text>
        <text x="6" y="64" fontSize="10">REV</text>
        <text x="124" y="64" fontSize="10">04 · 18 Mai 26</text>
      </g>
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PlantasPage() {
  const [findings, setFindings] = useState(INITIAL_FINDINGS)
  const [selectedId, setSelectedId] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const [modalId, setModalId] = useState(null)
  const [activeCats, setActiveCats] = useState(() => new Set(Object.keys(CAT_META)))
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('findings') // findings | chat
  const [zoom, setZoom] = useState(1)
  const [messages, setMessages] = useState([
    { role:'assistant', content:'👋 Olá! Sou o BIM_Coordinator_AI. Tenho 7 achados identificados na folha A-201. Qual gostaria de revisar primeiro?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatPending, setChatPending] = useState(false)

  const filtered = findings.filter(f => {
    if (!activeCats.has(f.cat)) return false
    if (query && !`${f.id} ${f.title} ${f.body} ${f.room}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const toggleCat = c => setActiveCats(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })

  const moveFinding = useCallback((id, x, y) => {
    setFindings(fs => fs.map(f => f.id === id ? { ...f, x, y } : f))
  }, [])

  const acceptFinding = id => setFindings(fs => fs.map(f => f.id === id ? { ...f, status:'accepted' } : f))
  const dismissFinding = id => { setFindings(fs => fs.filter(f => f.id !== id)); if (modalId === id) setModalId(null) }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatPending) return
    setChatInput('')
    const userMsg = { role:'user', content: text }
    setMessages(m => [...m, userMsg])
    setChatPending(true)
    try {
      const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const systemPrompt = `Você é o BIM_Coordinator_AI, revisando a folha A-201 (planta baixa, escala 1:100).
Há ${findings.length} achados: ${findings.map(f => `${f.id} (${f.cat}, ${f.sev}): ${f.title}`).join('; ')}.
Responda em pt-BR. Seja direto e técnico. Máximo 3 frases. Termine com "Posso ajudar com mais alguma dúvida sobre a plataforma?"`
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: systemPrompt,
          messages: allMsgs,
        }),
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Erro ao conectar com o agente.'
      setMessages(m => [...m, { role:'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role:'assistant', content:'[Erro de conexão — verifique ANTHROPIC_API_KEY]' }])
    } finally {
      setChatPending(false)
    }
  }

  const stats = {
    total: findings.length,
    high: findings.filter(f => f.sev === 'high').length,
    avg: findings.length ? (findings.reduce((a, f) => a + f.conf, 0) / findings.length * 100).toFixed(0) : 0,
    accepted: findings.filter(f => f.status === 'accepted').length,
  }

  const modal = modalId ? findings.find(f => f.id === modalId) : null

  return (
    <>
      <Head>
        <title>Análise de Plantas — ConstructAI v5.3</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Geist', system-ui, sans-serif; background: #f4f5f7; color: #1a1f36; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d0d5e0; border-radius: 2px; }
        .chip-filter { display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
          border-radius:999px; font-size:11px; font-weight:500; cursor:pointer;
          transition:all .15s; border:1px solid transparent; }
        .chip-filter:hover { opacity:.85; }
        .finding-row { padding:10px 12px; border-radius:8px; cursor:pointer;
          transition:background .15s; border:1px solid transparent; }
        .finding-row:hover { background:#EFF4FF; }
        .finding-row.sel { background:#EFF4FF; border-color:#B5D4F4; }
        .tab-btn { padding:7px 14px; border:none; border-radius:6px; font-size:12px;
          font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
        .zoom-btn { width:28px; height:28px; border:1px solid #e5e8f0; border-radius:6px;
          background:#fff; cursor:pointer; font-size:14px; display:flex;
          align-items:center; justify-content:center; }
        .zoom-btn:hover { background:#f4f5f7; }
        .send-btn { padding:8px 14px; background:#185FA5; color:#fff; border:none;
          border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;
          font-family:inherit; transition:opacity .15s; }
        .send-btn:disabled { opacity:.45; cursor:not-allowed; }
        .accept-btn { padding:5px 10px; background:#EAF3DE; color:#3B6D11; border:1px solid #97C459;
          border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; }
        .dismiss-btn { padding:5px 10px; background:#f4f5f7; color:#5a6282; border:1px solid #e5e8f0;
          border-radius:6px; font-size:11px; cursor:pointer; font-family:inherit; }
        .rfi-btn { padding:5px 10px; background:#EFF4FF; color:#185FA5; border:1px solid #B5D4F4;
          border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

        {/* Topbar */}
        <header style={{ background:'#fff', borderBottom:'1px solid #e5e8f0',
          padding:'0 20px', height:52, display:'flex', alignItems:'center',
          gap:12, flexShrink:0, position:'sticky', top:0, zIndex:10 }}>

          <a href="/dashboard.html" style={{ display:'flex', alignItems:'center', gap:8,
            textDecoration:'none', color:'inherit' }}>
            <BrandMarkInline/>
            <span style={{ fontSize:12, fontWeight:600, color:'#1a1f36' }}>ConstructAI</span>
          </a>
          <span style={{ width:1, height:20, background:'#e5e8f0' }}/>
          <span style={{ fontSize:12, color:'#8b93a7' }}>Vista Tower / Pavimento 04 /</span>
          <span style={{ fontSize:12, fontWeight:600 }}>A-201 Planta Baixa</span>

          <div style={{ marginLeft:8, display:'flex', gap:10 }}>
            {[
              { n: stats.total, label:'achados', c:'#5a6282' },
              { n: stats.high,  label:'críticos', c:'#A32D2D' },
              { n: `${stats.avg}%`, label:'confiança', c:'#3B6D11' },
              { n: stats.accepted, label:'aceitos', c:'#185FA5' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:s.c, fontVariantNumeric:'tabular-nums' }}>{s.n}</span>
                <span style={{ fontSize:10, color:'#8b93a7', letterSpacing:'.04em', textTransform:'uppercase' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{ flex:1 }}/>
          <button style={{ padding:'6px 14px', background:'#185FA5', color:'#fff', border:'none',
            borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            + Novo RFI
          </button>
          <button style={{ padding:'6px 12px', background:'#fff', color:'#5a6282',
            border:'1px solid #e5e8f0', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            ↓ Exportar
          </button>
          <a href="/dashboard.html" style={{ padding:'6px 12px', background:'#fff', color:'#5a6282',
            border:'1px solid #e5e8f0', borderRadius:8, fontSize:12, cursor:'pointer',
            fontFamily:'inherit', textDecoration:'none' }}>
            ← Dashboard
          </a>
        </header>

        {/* Filter bar */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e5e8f0',
          padding:'8px 20px', display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#8b93a7',
            textTransform:'uppercase', letterSpacing:'.08em', marginRight:4 }}>Filtrar</span>
          {Object.entries(CAT_META).map(([k, m]) => {
            const active = activeCats.has(k)
            const count = findings.filter(f => f.cat === k).length
            return (
              <button key={k} className="chip-filter" onClick={() => toggleCat(k)}
                style={{
                  background: active ? m.bg : '#f4f5f7',
                  color: active ? m.color : '#8b93a7',
                  borderColor: active ? m.color + '44' : 'transparent',
                }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: active ? m.color : '#d0d5e0' }}/>
                {m.label}
                <span style={{ fontFamily:'monospace', fontSize:10 }}>({count})</span>
              </button>
            )
          })}
          <div style={{ flex:1 }}/>
          <div style={{ position:'relative' }}>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar achados..."
              style={{ padding:'6px 12px 6px 32px', border:'1px solid #e5e8f0',
                borderRadius:8, fontSize:12, background:'#f8f9fc', color:'#1a1f36',
                outline:'none', width:220, fontFamily:'inherit' }}/>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
              color:'#8b93a7', fontSize:14 }}>🔍</span>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px',
          overflow:'hidden', minHeight:0 }}>

          {/* Drawing canvas */}
          <div style={{ position:'relative', overflow:'hidden', background:'#f4f5f7' }}>
            <div style={{ width:'100%', height:'100%', overflow:'auto', padding:24 }}>
              <div style={{ transform:`scale(${zoom})`, transformOrigin:'top left',
                width: zoom < 1 ? `${100/zoom}%` : '100%' }}>
                <FloorPlanSVG
                  findings={filtered}
                  selectedId={selectedId}
                  hoverId={hoverId}
                  onPick={id => { setSelectedId(id === selectedId ? null : id); setTab('findings') }}
                  onMove={moveFinding}
                  zoom={zoom}
                />
              </div>
            </div>

            {/* Zoom controls */}
            <div style={{ position:'absolute', bottom:20, right:20, display:'flex',
              flexDirection:'column', gap:4,
              background:'#fff', border:'1px solid #e5e8f0', borderRadius:8, padding:4 }}>
              <button className="zoom-btn" onClick={() => setZoom(z => Math.min(2, z+0.1))}>+</button>
              <button className="zoom-btn" style={{ fontSize:10, fontFamily:'monospace' }}
                onClick={() => setZoom(1)}>{Math.round(zoom*100)}%</button>
              <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.4, z-0.1))}>−</button>
            </div>

            {/* Category legend */}
            <div style={{ position:'absolute', bottom:20, left:20, background:'rgba(255,255,255,.92)',
              backdropFilter:'blur(8px)', border:'1px solid #e5e8f0',
              borderRadius:8, padding:'8px 12px', display:'flex', gap:12 }}>
              {Object.entries(CAT_META).map(([k, m]) => (
                <span key={k} style={{ display:'flex', alignItems:'center', gap:5,
                  fontSize:10, color:'#5a6282' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:m.color }}/>
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <aside style={{ background:'#fff', borderLeft:'1px solid #e5e8f0',
            display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Tab switcher */}
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e8f0',
              display:'flex', gap:4, flexShrink:0 }}>
              {[['findings','🔍 Achados'], ['chat','🤖 IA']].map(([t, label]) => (
                <button key={t} className="tab-btn" onClick={() => setTab(t)}
                  style={{ background: tab===t ? '#EFF4FF' : 'transparent',
                    color: tab===t ? '#185FA5' : '#5a6282' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Findings tab */}
            {tab === 'findings' && (
              <div style={{ flex:1, overflowY:'auto', padding:'10px 10px' }}>
                {filtered.length === 0 && (
                  <div style={{ padding:24, textAlign:'center', color:'#8b93a7', fontSize:12 }}>
                    Nenhum achado com os filtros atuais.
                  </div>
                )}
                {filtered.map(f => {
                  const meta = CAT_META[f.cat]
                  const sel = selectedId === f.id
                  return (
                    <div key={f.id}
                      className={`finding-row${sel ? ' sel' : ''}`}
                      style={{ marginBottom:4 }}
                      onMouseEnter={() => setHoverId(f.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => { setSelectedId(sel ? null : f.id) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:SEV_DOT[f.sev], flexShrink:0 }}/>
                        <span style={{ fontFamily:'monospace', fontSize:10, color:'#8b93a7' }}>{f.id}</span>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px',
                          borderRadius:20, background:meta.bg, color:meta.color }}>
                          {meta.label}
                        </span>
                        {f.status === 'accepted' && (
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px',
                            borderRadius:20, background:'#EAF3DE', color:'#3B6D11', marginLeft:'auto' }}>
                            ✓ aceito
                          </span>
                        )}
                        <span style={{ fontSize:10, color:'#8b93a7', marginLeft:'auto',
                          fontFamily:'monospace' }}>
                          {Math.round(f.conf*100)}%
                        </span>
                      </div>
                      <div style={{ fontSize:12, fontWeight:500, color:'#1a1f36',
                        lineHeight:1.4, marginBottom:2 }}>{f.title}</div>
                      <div style={{ fontSize:11, color:'#8b93a7' }}>{f.room}</div>

                      {sel && (
                        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #e5e8f0' }}>
                          <p style={{ fontSize:11, color:'#3a4166', lineHeight:1.6, marginBottom:8 }}>{f.body}</p>
                          <div style={{ fontSize:10, fontFamily:'monospace', color:'#8b93a7',
                            marginBottom:8, padding:'4px 8px', background:'#f8f9fc',
                            borderRadius:4, display:'inline-block' }}>
                            ref: {f.ref}
                          </div>
                          <div style={{ display:'flex', gap:6 }}>
                            {f.status !== 'accepted' && (
                              <button className="accept-btn" onClick={e => { e.stopPropagation(); acceptFinding(f.id) }}>
                                ✓ Aceitar
                              </button>
                            )}
                            <button className="rfi-btn" onClick={e => { e.stopPropagation(); setModalId(f.id) }}>
                              Abrir RFI
                            </button>
                            <button className="dismiss-btn" onClick={e => { e.stopPropagation(); dismissFinding(f.id) }}>
                              Dispensar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Chat tab */}
            {tab === 'chat' && (
              <>
                <div style={{ flex:1, overflowY:'auto', padding:'12px 14px',
                  display:'flex', flexDirection:'column', gap:8, background:'#f8f9fc' }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display:'flex',
                      justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth:'85%', padding:'8px 12px', fontSize:12, lineHeight:1.6,
                        borderRadius: m.role==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                        background: m.role==='user' ? '#185FA5' : '#fff',
                        color: m.role==='user' ? '#fff' : '#1a1f36',
                        border: m.role==='assistant' ? '1px solid #e5e8f0' : 'none',
                      }}>{m.content}</div>
                    </div>
                  ))}
                  {chatPending && (
                    <div style={{ display:'flex', justifyContent:'flex-start' }}>
                      <div style={{ padding:'8px 14px', background:'#fff', border:'1px solid #e5e8f0',
                        borderRadius:'4px 12px 12px 12px', fontSize:12, color:'#8b93a7',
                        fontFamily:'monospace', letterSpacing:'2px' }}>
                        ANALISANDO...
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding:'10px 12px', background:'#fff',
                  borderTop:'1px solid #e5e8f0', display:'flex', gap:8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && sendChat()}
                    placeholder="Pergunte sobre os achados..."
                    style={{ flex:1, padding:'8px 12px', border:'1px solid #e5e8f0',
                      borderRadius:8, fontSize:12, background:'#f8f9fc',
                      color:'#1a1f36', outline:'none', fontFamily:'inherit' }}/>
                  <button className="send-btn" onClick={sendChat}
                    disabled={!chatInput.trim() || chatPending}>→</button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Modal — RFI detail */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={() => setModalId(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:'24px',
            maxWidth:520, width:'90%', boxShadow:'0 16px 48px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ fontSize:10, fontFamily:'monospace', color:'#8b93a7',
                padding:'3px 8px', background:'#f4f5f7', borderRadius:4 }}>{modal.id}</span>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px',
                borderRadius:20, background:CAT_META[modal.cat].bg,
                color:CAT_META[modal.cat].color }}>
                {CAT_META[modal.cat].label}
              </span>
              <span style={{ flex:1 }}/>
              <button onClick={() => setModalId(null)}
                style={{ background:'none', border:'none', fontSize:20,
                  cursor:'pointer', color:'#8b93a7', lineHeight:1 }}>✕</button>
            </div>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8, lineHeight:1.3 }}>{modal.title}</h3>
            <p style={{ fontSize:13, color:'#3a4166', lineHeight:1.6, marginBottom:14 }}>{modal.body}</p>
            <div style={{ padding:'8px 12px', background:'#f8f9fc', borderRadius:8,
              fontFamily:'monospace', fontSize:11, color:'#5a6282', marginBottom:16 }}>
              Ref: {modal.ref} · Folha: A-201 · {modal.room}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[['Severidade', modal.sev === 'high' ? 'Alta' : modal.sev === 'med' ? 'Média' : 'Baixa'],
                ['Confiança IA', `${Math.round(modal.conf*100)}%`],
                ['Ambiente', modal.room],
                ['Status', modal.status === 'accepted' ? 'Aceito' : 'Aberto']
              ].map(([k, v]) => (
                <div key={k} style={{ padding:'8px 10px', background:'#f8f9fc',
                  borderRadius:8, border:'1px solid #e5e8f0' }}>
                  <div style={{ fontSize:10, color:'#8b93a7', fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {modal.status !== 'accepted' && (
                <button className="accept-btn" style={{ flex:1, padding:'10px', fontSize:12 }}
                  onClick={() => { acceptFinding(modal.id); setModalId(null) }}>
                  ✓ Aceitar finding
                </button>
              )}
              <button className="rfi-btn" style={{ flex:1, padding:'10px', fontSize:12 }}>
                📋 Criar RFI formal
              </button>
              <button className="dismiss-btn"
                onClick={() => { dismissFinding(modal.id); setModalId(null) }}>
                Dispensar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BrandMarkInline() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48"
      style={{ display:'block', borderRadius:8,
        boxShadow:'0 1px 0 rgba(255,255,255,0.10) inset, 0 3px 8px rgba(24,95,165,0.30)' }}>
      <defs>
        <linearGradient id="bm-nav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#185FA5"/>
          <stop offset="100%" stopColor="#0C447C"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#bm-nav)"/>
      <g stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="square">
        <line x1="6" y1="40" x2="42" y2="40"/>
      </g>
      <g fill="none" stroke="#ffffff" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M 9 40 L 24 10" strokeWidth="3.4"/>
        <path d="M 39 40 L 24 10" strokeWidth="3.4"/>
        <path d="M 15.5 27 L 32.5 27" strokeWidth="2.4"/>
      </g>
      <circle cx="24" cy="10" r="3" fill="#f0a500"/>
      <circle cx="24" cy="10" r="1.2" fill="#ffffff"/>
    </svg>
  )
}
