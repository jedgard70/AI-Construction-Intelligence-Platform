'use client'
import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'
import PrintShareModal from '../components/PrintShareModal'
import {
  LayoutDashboard, Box, Library, ImageIcon,
  BarChart3, Clock, HardDrive, Zap, ArrowUpRight,
  Monitor, Cpu, Layers, Bell, Search, LogOut, Plus, X,
} from 'lucide-react'
import Image from 'next/image'

const CSS_VARS = `
  :root {
    --background: #0a0a0a; --surface: #1c1b1f;
    --primary: #d0bcff; --on-primary: #381e72;
    --primary-container: #4f378b; --on-primary-container: #eaddff;
    --secondary: #ccc2dc; --tertiary: #efb8c8;
    --on-surface: #e6e1e5; --on-surface-variant: #cac4d0;
    --outline: #938f99; --outline-variant: #49454f;
  }
`

type Project = { name: string; status: string; date: string; img: string; style: string }

const INITIAL_PROJECTS: Project[] = [
  { name: 'Neo-Modern Atrium',  status: 'Render Complete',      date: '2h ago',    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&q=80', style: 'Contemporary' },
  { name: 'Corporate Lobby v2', status: 'Syncing Assets',       date: '5h ago',    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80', style: 'Minimalist'    },
  { name: 'Kitchen Interior',   status: 'Optimization Running', date: 'yesterday', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80', style: 'Residential'   },
]

const GALLERY_IMGS = [
  { name: 'Penthouse Suite', style: 'Contemporary', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80' },
  { name: 'Modern Office',   style: 'Minimalist',   img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&q=80' },
  { name: 'Luxury Villa',    style: 'Mediterranean',img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80' },
  { name: 'Urban Studio',    style: 'Industrial',   img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80' },
  { name: 'Resort Lobby',    style: 'Tropical',     img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80' },
  { name: 'Zen Garden',      style: 'Japanese',     img: 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=400&q=80' },
]

const MATERIALS = [
  'Concreto Polido','Madeira Carvalho','Mármore Carrara','Aço Escovado',
  'Vidro Temperado','Couro Preto','Tecido Linho','Granito Preto','Cobre Oxidado','Resina Epóxi',
]

type Tab = 'dashboard' | 'gallery' | 'editor' | 'materials'

export default function ArchVisPage() {
  const router = useRouter()
  const [tab, setTab]             = useState<Tab>('dashboard')
  const [projects, setProjects]   = useState<Project[]>(INITIAL_PROJECTS)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [galleryImgs, setGalleryImgs] = useState(GALLERY_IMGS)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName]     = useState('')
  const [newStyle, setNewStyle]   = useState('Contemporary')
  const [selectedProj, setSelectedProj] = useState<Project | null>(null)
  const [aiRunning, setAiRunning] = useState(false)
  const [aiResult, setAiResult]   = useState('')
  const [syncMsg, setSyncMsg]     = useState('')
  const [activeMat, setActiveMat] = useState<string | null>(null)
  const [showPrint, setShowPrint] = useState(false)

  const STYLE_OPTIONS = ['Contemporary','Minimalist','Mediterranean','Industrial','Tropical','Japanese','Biophilic','Scandinavian']
  const PLACEHOLDER_IMGS = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  ]

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    const sb = getSupabase()
    if (sb) {
      const { data } = await sb.from('archvis_projects').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        setProjects(data.map(d => ({ name: d.nome || d.name, status: d.status || 'Project Created', date: new Date(d.created_at).toLocaleDateString('pt-BR'), img: d.img_url || PLACEHOLDER_IMGS[0], style: d.estilo || d.style || 'Contemporary' })))
      }
      const { data: renders } = await sb.from('archvis_renders').select('*').order('created_at', { ascending: false }).limit(6)
      if (renders && renders.length > 0) {
        setGalleryImgs(renders.map(r => ({ name: r.nome || r.name, style: r.estilo || 'Contemporary', img: r.img_url || GALLERY_IMGS[0].img })))
      }
    }
    setLoadingProjects(false)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  async function createProject() {
    if (!newName.trim()) return
    const p: Project = {
      name: newName.trim(),
      status: 'Project Created',
      date: 'just now',
      img: PLACEHOLDER_IMGS[Math.floor(Math.random() * PLACEHOLDER_IMGS.length)],
      style: newStyle,
    }
    const sb = getSupabase()
    if (sb) {
      await sb.from('archvis_projects').insert({ nome: p.name, status: p.status, estilo: p.style, img_url: p.img })
    }
    setProjects(prev => [p, ...prev])
    setNewName(''); setShowModal(false)
    setTab('dashboard')
  }

  async function runAI(proj: Project) {
    setAiRunning(true); setAiResult('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 800,
          messages: [{ role: 'user', content: `Você é um especialista em design de interiores e renderização arquitetônica. Analise este projeto de visualização:\n\nProjeto: "${proj.name}"\nEstilo: ${proj.style}\nStatus: ${proj.status}\n\nForneça:\n1. 🎨 Análise do estilo (2-3 frases)\n2. 💡 3 sugestões de melhorias visuais\n3. 🏆 Score de qualidade (0-100) e por quê\n4. 📸 Recomendação de ângulo de câmera ideal` }],
        }),
      })
      const data = await res.json()
      setAiResult(data?.content?.[0]?.text || data.response || 'Análise concluída.')
    } catch { setAiResult('Erro ao conectar ao agente. Verifique a conexão.') }
    // Save AI result to Supabase
    const sb2 = getSupabase()
    if (sb2 && proj && aiResult) {
      await sb2.from('archvis_renders').insert({ nome: proj.name, estilo: proj.style, img_url: proj.img, analise_ia: aiResult })
    }
    setAiRunning(false)
  }

  function syncProject() {
    setSyncMsg('⏳ Sincronizando...')
    setTimeout(() => setSyncMsg('✅ Projeto sincronizado na nuvem!'), 1500)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  const s = {
    wrap:     { minHeight: '100vh', background: '#0a0a0a', color: '#e6e1e5', fontFamily: "'Inter',system-ui,sans-serif" },
    header:   { height: 64, borderBottom: '1px solid #49454f', background: 'rgba(28,27,31,.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky' as const, top: 0, zIndex: 50 },
    nav:      { display: 'flex', gap: 4 },
    navBtn:   (active: boolean) => ({ padding: '6px 14px', borderRadius: 8, border: active ? '1px solid rgba(208,188,255,.3)' : '1px solid transparent', background: active ? 'rgba(208,188,255,.1)' : 'transparent', color: active ? '#d0bcff' : '#cac4d0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }),
    body:     { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
    card:     { background: '#211f26', border: '1px solid #49454f', borderRadius: 16, padding: '20px 22px' },
    statCard: { background: '#211f26', border: '1px solid #49454f', borderRadius: 16, padding: 24 },
    grid4:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 },
    grid2:    { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 },
    grid3:    { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
    btnPrimary: { background: '#d0bcff', color: '#381e72', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
    overlay:  { position: 'fixed' as const, inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:    { background: '#1c1b1f', border: '1px solid #49454f', borderRadius: 16, width: 480, padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,.6)' },
    input:    { width: '100%', background: '#2b2930', border: '1px solid #49454f', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e6e1e5', fontFamily: 'inherit', outline: 'none' },
    select:   { width: '100%', background: '#2b2930', border: '1px solid #49454f', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e6e1e5', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
    label:    { fontSize: 10, fontWeight: 700, color: '#938f99', textTransform: 'uppercase' as const, letterSpacing: '.08em', display: 'block', marginBottom: 6 },
  }

  return (
    <>
      <Head><title>ArchVis Pro — Visualização Arquitetônica</title></Head>
      <style dangerouslySetInnerHTML={{ __html: CSS_VARS }} />
      <div style={s.wrap}>

        {/* New Project Modal */}
        {showModal && (
          <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={s.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e6e1e5' }}>🎨 New Visualization Project</div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#938f99', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Project Name *</label>
                <input style={s.input} placeholder="Ex: Penthouse Suite — Floor 32" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Visual Style</label>
                <select style={s.select} value={newStyle} onChange={e => setNewStyle(e.target.value)}>
                  {STYLE_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #49454f', borderRadius: 8, padding: '9px 18px', color: '#cac4d0', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={createProject} style={{ ...s.btnPrimary }} disabled={!newName.trim()}>
                  <Plus size={15} /> Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Detail Modal */}
        {selectedProj && (
          <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelectedProj(null)}>
            <div style={{ ...s.modal, width: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedProj.name}</div>
                <button onClick={() => { setSelectedProj(null); setAiResult('') }} style={{ background: 'none', border: 'none', color: '#938f99', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ position: 'relative', height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <Image src={selectedProj.img} alt={selectedProj.name} fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(208,188,255,.15)', color: '#d0bcff', borderRadius: 20 }}>{selectedProj.style}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', background: '#2b2930', color: '#938f99', borderRadius: 20 }}>{selectedProj.status}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', background: '#2b2930', color: '#938f99', borderRadius: 20 }}>{selectedProj.date}</span>
              </div>
              <button onClick={() => runAI(selectedProj)} disabled={aiRunning}
                style={{ width: '100%', background: aiRunning ? '#2b2930' : '#d0bcff', color: aiRunning ? '#938f99' : '#381e72', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: aiRunning ? 'wait' : 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                {aiRunning ? '⏳ Analisando com IA...' : '🤖 Analisar com ArchVis AI'}
              </button>
              {aiResult && (
                <>
                  <div style={{ background: '#0f0e11', border: '1px solid #49454f', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#cac4d0', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>
                    {aiResult}
                  </div>
                  <button onClick={() => setShowPrint(true)} style={{ marginTop: 8, width: '100%', padding: '7px', background: 'rgba(208,188,255,.1)', border: '1px solid rgba(208,188,255,.25)', borderRadius: 8, color: '#d0bcff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    🖨️ Imprimir Análise
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.back()}>
              <div style={{ width: 32, height: 32, background: '#d0bcff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} color="#381e72" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', textTransform: 'uppercase' as const }}>
                ArchVis <span style={{ fontWeight: 300, opacity: .5 }}>PRO</span>
              </span>
            </div>
            <nav style={s.nav}>
              {([['dashboard','Dashboard',LayoutDashboard],['editor','Editor',Box],['materials','Materials',Library],['gallery','Gallery',ImageIcon]] as const).map(([id, label, Icon]) => (
                <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setShowModal(true)} style={s.btnPrimary}>
              <Plus size={15} /> New Project
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#cac4d0' }} />
              <input placeholder="Quick search…" style={{ background: '#2b2930', border: '1px solid #49454f', borderRadius: 20, padding: '6px 12px 6px 30px', fontSize: 11, color: '#e6e1e5', fontFamily: 'monospace', outline: 'none', width: 160 }} />
            </div>
            <button style={{ background: 'none', border: 'none', color: '#cac4d0', cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, background: '#d0bcff', borderRadius: '50%', border: '1.5px solid #0a0a0a' }} />
            </button>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#cac4d0', cursor: 'pointer' }}><LogOut size={18} /></button>
          </div>
        </header>

        <div style={s.body}>

          {/* ── DASHBOARD ──────────────────────────────────── */}
          {tab === 'dashboard' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Workstation Dashboard</h1>
                  <p style={{ color: '#cac4d0', fontSize: 13 }}>System Status: <span style={{ color: '#d0bcff' }}>Optimized</span> · {projects.length} projects</p>
                </div>
                <button onClick={() => setShowModal(true)} style={s.btnPrimary}><Plus size={15} /> New Project</button>
              </div>

              <div style={s.grid4}>
                {[
                  { label: 'Active Renders', value: `0${projects.length}`, icon: Monitor, color: '#d0bcff' },
                  { label: 'Storage Used', value: '42.8GB', icon: HardDrive, color: '#efb8c8' },
                  { label: 'Avg Speed', value: '2.4s', icon: Zap, color: '#ccc2dc' },
                  { label: 'Uptime', value: '99.9%', icon: Clock, color: '#cac4d0' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} style={s.statCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Icon size={18} color={color} />
                      <ArrowUpRight size={14} color="#938f99" opacity={0.5} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color }}>{value}</div>
                    <div style={{ fontSize: 10, color: '#938f99', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={s.grid2}>
                <div style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Visualizations</h2>
                    <button onClick={() => setTab('gallery')} style={{ color: '#d0bcff', fontSize: 11, fontFamily: 'monospace', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {projects.map((p, i) => (
                      <div key={i} onClick={() => setSelectedProj(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', background: '#2b2930', borderRadius: 12, border: '1px solid #49454f', cursor: 'pointer', transition: 'border-color .15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#d0bcff'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#49454f'}>
                        <div style={{ width: 80, height: 52, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                          <Image src={p.img} alt={p.name} fill style={{ objectFit: 'cover' }} sizes="80px" unoptimized />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#cac4d0', fontFamily: 'monospace' }}>{p.status}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#938f99', fontFamily: 'monospace' }}>{p.date}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={s.card}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Workspace Tools</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { name: 'Neural Denoise', icon: Cpu,       action: () => alert('Neural Denoise: removendo ruído de render…') },
                        { name: 'PBR Library',    icon: Library,   action: () => setTab('materials') },
                        { name: 'Scene Layers',   icon: Layers,    action: () => setTab('editor') },
                        { name: 'Analytics',      icon: BarChart3, action: () => alert('Analytics: 04 renders · 42.8GB usado · uptime 99.9%') },
                      ].map(({ name, icon: Icon, action }) => (
                        <button key={name} onClick={action}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', background: '#2b2930', border: '1px solid #49454f', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#d0bcff'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#49454f'}>
                          <Icon size={20} color="#d0bcff" />
                          <span style={{ fontSize: 9, color: '#938f99', textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...s.card, background: 'rgba(79,55,139,.2)', border: '1px solid rgba(208,188,255,.2)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d0bcff', marginBottom: 8 }}>Deployment Hub</h3>
                    <p style={{ fontSize: 11, color: '#cac4d0', marginBottom: 14, lineHeight: 1.6 }}>Your latest render is ready for client review. Sync to cloud now.</p>
                    {syncMsg && <div style={{ fontSize: 12, color: syncMsg.startsWith('✅') ? '#d0bcff' : '#938f99', marginBottom: 10 }}>{syncMsg}</div>}
                    <button onClick={syncProject} style={{ width: '100%', background: '#d0bcff', color: '#381e72', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sync Project
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── GALLERY ──────────────────────────────────────── */}
          {tab === 'gallery' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Visualization Gallery</h1>
                  <p style={{ color: '#cac4d0', fontSize: 13 }}>{GALLERY_IMGS.length + projects.length} renders</p>
                </div>
                <button onClick={() => setShowModal(true)} style={s.btnPrimary}><Plus size={15} /> New Project</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[...projects.map(p => ({ name: p.name, style: p.style, img: p.img })), ...GALLERY_IMGS].map((g, i) => (
                  <div key={i} onClick={() => setSelectedProj({ ...g, status: 'In Gallery', date: '' })}
                    style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #49454f', cursor: 'pointer', background: '#211f26', transition: 'border-color .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#d0bcff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#49454f'}>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Image src={g.img} alt={g.name} fill style={{ objectFit: 'cover' }} sizes="400px" unoptimized />
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: '#938f99', fontFamily: 'monospace' }}>{g.style}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── EDITOR ───────────────────────────────────────── */}
          {tab === 'editor' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Scene Editor</h1>
                <button onClick={() => setShowModal(true)} style={s.btnPrimary}><Plus size={15} /> New Project</button>
              </div>
              <div style={{ ...s.card, aspectRatio: '16/8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                <Image src={projects[0]?.img || GALLERY_IMGS[0].img} alt="Scene" fill style={{ objectFit: 'cover', opacity: .5 }} unoptimized />
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#d0bcff', marginBottom: 8 }}>
                    {projects[0]?.name || 'No project selected'}
                  </div>
                  <div style={{ fontSize: 12, color: '#cac4d0', marginBottom: 20 }}>Style: {projects[0]?.style || '—'} · Status: {projects[0]?.status || '—'}</div>
                  <button onClick={() => projects[0] && runAI(projects[0])} disabled={aiRunning}
                    style={{ background: '#d0bcff', color: '#381e72', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {aiRunning ? '⏳ Analisando…' : '🤖 Analisar com ArchVis AI'}
                  </button>
                </div>
              </div>
              {aiResult && (
                <div style={{ ...s.card, background: '#0f0e11' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>AI Analysis</div>
                    <button onClick={() => setShowPrint(true)}
                      style={{ padding: '5px 12px', background: 'rgba(208,188,255,.15)', border: '1px solid rgba(208,188,255,.3)', borderRadius: 7, color: '#d0bcff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🖨️ Imprimir
                    </button>
                  </div>
                  <pre style={{ fontSize: 12, color: '#cac4d0', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{aiResult}</pre>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 16 }}>
                {projects.map((p, i) => (
                  <div key={i} onClick={() => setSelectedProj(p)}
                    style={{ background: '#211f26', border: '1px solid #49454f', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#d0bcff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#49454f'}>
                    <div style={{ position: 'relative', height: 80 }}>
                      <Image src={p.img} alt={p.name} fill style={{ objectFit: 'cover', opacity: .7 }} sizes="200px" unoptimized />
                    </div>
                    <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600 }}>{p.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── MATERIALS ────────────────────────────────────── */}
          {tab === 'materials' && (
            <>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>PBR Material Library</h1>
              <p style={{ color: '#cac4d0', fontSize: 13, marginBottom: 24 }}>
                {activeMat ? `✅ Material selecionado: ${activeMat}` : 'Clique em um material para aplicar ao projeto ativo'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {MATERIALS.map((mat, i) => (
                  <div key={i} onClick={() => setActiveMat(activeMat === mat ? null : mat)}
                    style={{ background: '#211f26', border: `1px solid ${activeMat === mat ? '#d0bcff' : '#49454f'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s' }}>
                    <div style={{ height: 80, background: `hsl(${i*36},${20+i*5}%,${25+i*3}%)`, position: 'relative' }}>
                      {activeMat === mat && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(208,188,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
                      )}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: activeMat === mat ? '#d0bcff' : '#e6e1e5' }}>{mat}</div>
                      <div style={{ fontSize: 9, color: '#938f99', fontFamily: 'monospace', marginTop: 2 }}>PBR · 4K</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {showPrint && selectedProj && aiResult && (
        <PrintShareModal
          title={`ArchVis AI Analysis — ${selectedProj.name}`}
          onClose={() => setShowPrint(false)}
          buildHtml={() => `
<div class="meta">
  <span>🏗️ Projeto: ${selectedProj.name}</span>
  <span>🎨 Estilo: ${selectedProj.style}</span>
  <span>📊 Status: ${selectedProj.status}</span>
</div>
<h2>Análise ArchVis AI</h2>
<div class="text-area">${aiResult}</div>`}
          buildText={() => `ARCHVIS AI — ${selectedProj.name}\nEstilo: ${selectedProj.style}\n\n${aiResult}`}
        />
      )}
    </>
  )
}
