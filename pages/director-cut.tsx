'use client'
import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'
import Image from 'next/image'
import {
  LayoutDashboard, Film, Cuboid, FolderOpen, MessageSquareText,
  Search, Settings, LogOut, Plus, MoreVertical, Play, Pause,
  SkipBack, SkipForward, Volume2, Maximize, Upload, Download,
  CheckCircle, AlertCircle, X,
} from 'lucide-react'

type View = 'dashboard' | 'editor' | 'render' | 'assets' | 'review'
type Project = { title: string; phase: string; progress: number; active: boolean; img: string }
type Asset   = { name: string; type: string; size: string; status: string }

const INITIAL_PROJECTS: Project[] = [
  { title: 'Cyberpunk Overdrive', phase: 'VFX Phase: Compositing', progress: 75, active: true,  img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80' },
  { title: 'Void Echoes',         phase: 'VFX Phase: Animation',   progress: 40, active: false, img: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=400&q=80' },
  { title: 'Dune Rider',          phase: 'VFX Phase: Lighting',    progress: 60, active: false, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { title: 'London Fog',          phase: 'VFX Phase: Grading',     progress: 90, active: false, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80' },
]

const INITIAL_ASSETS: Asset[] = [
  { name: 'hero_vfx_comp_v12.exr', type: 'VFX',    size: '2.4 GB',  status: 'approved' },
  { name: 'sfx_thunderstorm.wav',   type: 'Audio',  size: '45 MB',   status: 'approved' },
  { name: 'bg_plate_night.mov',     type: 'Plate',  size: '18 GB',   status: 'pending'  },
  { name: 'char_rig_v3.abc',        type: '3D',     size: '890 MB',  status: 'review'   },
  { name: 'color_lut_final.cube',   type: 'LUT',    size: '1.2 MB',  status: 'approved' },
  { name: 'title_card_anim.mp4',    type: 'Motion', size: '320 MB',  status: 'pending'  },
]

const INITIAL_REVIEWS = [
  { reviewer: 'Maria Santos', role: 'Director',  comment: 'The color grade on scene 12 needs more warmth in the highlights.', status: 'open',     time: '2h ago' },
  { reviewer: 'João Costa',   role: 'VFX Super', comment: 'Fire simulation approved. Moving to final comp.',                  status: 'resolved', time: '4h ago' },
  { reviewer: 'Ana Lima',     role: 'Producer',  comment: 'Runtime is 127min — need to cut 3min from act 2.',                status: 'open',     time: '1d ago' },
  { reviewer: 'Carlos Melo',  role: 'Sound',     comment: 'Dialogue mix in reel 4 approved for final.',                      status: 'resolved', time: '2d ago' },
]

const VFX_PHASES = ['Development', 'Pre-Production', 'VFX Phase: Animation', 'VFX Phase: Lighting', 'VFX Phase: Compositing', 'VFX Phase: Grading', 'Delivery']

export default function DirectorCutPage() {
  const router = useRouter()
  const [view, setView]         = useState<View>('dashboard')
  const [playing, setPlaying]   = useState(false)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [assets, setAssets]     = useState<Asset[]>(INITIAL_ASSETS)
  const [reviews, setReviews]   = useState(INITIAL_REVIEWS)
  const [activeProj, setActiveProj] = useState<Project | null>(null)

  // New Project modal
  const [showNew, setShowNew]   = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPhase, setNewPhase] = useState('Development')

  // Asset upload
  const [showUpload, setShowUpload] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('VFX')

  // New review comment
  const [showReview, setShowReview] = useState(false)
  const [revName, setRevName]   = useState('')
  const [revRole, setRevRole]   = useState('Director')
  const [revComment, setRevComment] = useState('')

  // AI analysis
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText]       = useState('')
  const [studioContext, setStudioContext] = useState<any>(null)

  // Supabase load
  const loadData = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    const { data: vp } = await sb.from('video_projects').select('*').order('created_at', { ascending: false })
    if (vp && vp.length > 0) {
      setProjects(vp.map(d => ({ title: d.titulo || d.title, phase: d.fase || 'Development', progress: d.progresso_pct || 0, active: false, img: d.thumbnail_url || INITIAL_PROJECTS[0].img })))
    }
    const { data: va } = await sb.from('video_analyses').select('*').order('created_at', { ascending: false }).limit(10)
    if (va && va.length > 0) {
      setReviews(va.map(d => ({ reviewer: d.analisado_por || 'Team', role: d.tipo_analise || 'Analysis', comment: d.resultado || '', status: 'resolved', time: new Date(d.created_at).toLocaleDateString('pt-BR') })))
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('apex_directcut_context')
      if (raw) {
        const parsed = JSON.parse(raw)
        setStudioContext(parsed)
        setView('editor')
        if (parsed?.fileName && !newTitle) setNewTitle(parsed.fileName.replace(/\.[^.]+$/, ''))
      }
    } catch {
      setStudioContext(null)
    }
  }, [])

  async function createProject() {
    if (!newTitle.trim()) return
    const p: Project = { title: newTitle.trim(), phase: newPhase, progress: 0, active: false, img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80' }
    const sb = getSupabase()
    if (sb) await sb.from('video_projects').insert({ titulo: p.title, fase: p.phase, progresso_pct: 0, thumbnail_url: p.img, status: 'Em Andamento' })
    setProjects(prev => [p, ...prev])
    setNewTitle(''); setShowNew(false)
  }

  function setActive(proj: Project) {
    setProjects(prev => prev.map(p => ({ ...p, active: p.title === proj.title })))
    setActiveProj(proj)
  }

  function uploadAsset() {
    if (!uploadName.trim()) return
    const a: Asset = { name: uploadName.trim(), type: uploadType, size: '—', status: 'pending' }
    setAssets(prev => [a, ...prev])
    setUploadName(''); setShowUpload(false)
  }

  function approveAsset(name: string) {
    setAssets(prev => prev.map(a => a.name === name ? { ...a, status: 'approved' } : a))
  }

  function addReview() {
    if (!revComment.trim()) return
    setReviews(prev => [{ reviewer: revName || 'Você', role: revRole, comment: revComment.trim(), status: 'open', time: 'agora' }, ...prev])
    setRevName(''); setRevComment(''); setShowReview(false)
  }

  function resolveReview(comment: string) {
    setReviews(prev => prev.map(r => r.comment === comment ? { ...r, status: 'resolved' } : r))
  }

  async function runAI() {
    const p = projects.find(pr => pr.active) || projects[0]
    if (!p) return
    setAiLoading(true); setAiText('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 900,
          messages: [{ role: 'user', content: `Você é um diretor de VFX e pós-produção. Analise este projeto:\n\nTítulo: "${p.title}"\nFase: ${p.phase}\nProgresso: ${p.progress}%\nAssets: ${assets.length} arquivos\nComentários em aberto: ${reviews.filter(r => r.status === 'open').length}\n\nForneça:\n1. 🎬 Diagnóstico do estado atual da produção\n2. ⚠️ Riscos de entrega (prazo, qualidade, orçamento)\n3. 💡 3 ações prioritárias para a próxima semana\n4. 🏆 Score de prontidão para entrega (0–100)` }],
        }),
      })
      const data = await res.json()
      const result = data?.content?.[0]?.text || data.response || 'Análise concluída.'
      setAiText(result)
      const sb2 = getSupabase()
      if (sb2 && p) await sb2.from('video_analyses').insert({ tipo_analise: 'Director Cut AI', resultado: result, analisado_por: 'IA Claude', confianca_pct: 92 })
    } catch { setAiText('Erro ao conectar ao agente.') }
    setAiLoading(false)
  }

  const c = {
    wrap:      { minHeight: '100vh', background: '#131313', color: '#e5e2e1', fontFamily: "'Inter',system-ui,sans-serif", display: 'flex', flexDirection: 'column' as const },
    topbar:    { height: 56, borderBottom: '1px solid #3b494b', background: '#1c1b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 50, position: 'sticky' as const, top: 0 },
    main:      { flex: 1, overflowY: 'auto' as const, paddingBottom: 64 },
    bottomNav: { height: 64, borderTop: '1px solid #3b494b', background: '#1c1b1b', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px', flexShrink: 0, position: 'sticky' as const, bottom: 0, zIndex: 50 },
    body:      { padding: '24px 20px', maxWidth: 960, margin: '0 auto' },
    card:      { background: '#201f1f', border: '1px solid #3b494b', borderRadius: 12, padding: '16px 18px', marginBottom: 16 },
    btnCyan:   { background: '#00f0ff', color: '#00363a', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
    overlay:   { position: 'fixed' as const, inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:     { background: '#1c1b1b', border: '1px solid #3b494b', borderRadius: 16, width: 480, padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,.8)' },
    input:     { width: '100%', background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e5e2e1', fontFamily: 'inherit', outline: 'none' },
    select:    { width: '100%', background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e5e2e1', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
    label:     { fontSize: 10, fontWeight: 700, color: '#849495', textTransform: 'uppercase' as const, letterSpacing: '.08em', display: 'block', marginBottom: 6 },
  }

  const navItems = [
    { id: 'dashboard' as View, icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { id: 'editor'    as View, icon: <Film size={22} />,            label: 'Editor'    },
    { id: 'render'    as View, icon: <Cuboid size={22} />,          label: 'Render'    },
    { id: 'assets'    as View, icon: <FolderOpen size={22} />,      label: 'Assets'    },
    { id: 'review'    as View, icon: <MessageSquareText size={22} />,label: 'Review'   },
  ]

  return (
    <>
      <Head><title>Director&apos;s Cut — Workspace Cinematográfico</title></Head>
      <div style={c.wrap}>

        {/* New Project Modal */}
        {showNew && (
          <div style={c.overlay} onClick={e => e.target === e.currentTarget && setShowNew(false)}>
            <div style={c.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#00dbe9' }}>🎬 New Project</div>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={c.label}>Project Title *</label>
                <input style={c.input} placeholder="Ex: Midnight Protocol — Feature Film" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={c.label}>Current Phase</label>
                <select style={c.select} value={newPhase} onChange={e => setNewPhase(e.target.value)}>
                  {VFX_PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: '1px solid #3b494b', borderRadius: 8, padding: '8px 16px', color: '#849495', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={createProject} disabled={!newTitle.trim()} style={c.btnCyan}>
                  <Plus size={15} /> Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Asset Modal */}
        {showUpload && (
          <div style={c.overlay} onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
            <div style={c.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#00dbe9' }}>📁 Upload Asset</div>
                <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={c.label}>File Name *</label>
                <input style={c.input} placeholder="Ex: hero_vfx_final_v15.exr" value={uploadName} onChange={e => setUploadName(e.target.value)} autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={c.label}>Asset Type</label>
                <select style={c.select} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                  {['VFX','Audio','Plate','3D','LUT','Motion','Script','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: '1px solid #3b494b', borderRadius: 8, padding: '8px 16px', color: '#849495', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={uploadAsset} disabled={!uploadName.trim()} style={c.btnCyan}><Upload size={14} /> Upload</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Comment Modal */}
        {showReview && (
          <div style={c.overlay} onClick={e => e.target === e.currentTarget && setShowReview(false)}>
            <div style={c.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#cf5cff' }}>💬 Add Review Comment</div>
                <button onClick={() => setShowReview(false)} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={c.label}>Your Name</label>
                <input style={c.input} placeholder="Ex: João Silva" value={revName} onChange={e => setRevName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={c.label}>Role</label>
                <select style={c.select} value={revRole} onChange={e => setRevRole(e.target.value)}>
                  {['Director','VFX Super','Producer','Sound','Editor','Colorist','Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={c.label}>Comment *</label>
                <textarea style={{ ...c.input, resize: 'vertical' as const, minHeight: 80 }} placeholder="Descreva o feedback ou aprovação…" value={revComment} onChange={e => setRevComment(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowReview(false)} style={{ background: 'none', border: '1px solid #3b494b', borderRadius: 8, padding: '8px 16px', color: '#849495', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={addReview} disabled={!revComment.trim()} style={{ ...c.btnCyan, background: '#cf5cff', color: '#fff' }}>Post Review</button>
              </div>
            </div>
          </div>
        )}

        {/* Project detail sheet */}
        {activeProj && (
          <div style={c.overlay} onClick={e => e.target === e.currentTarget && setActiveProj(null)}>
            <div style={{ ...c.modal, width: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#00dbe9' }}>{activeProj.title}</div>
                <button onClick={() => { setActiveProj(null); setAiText('') }} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ position: 'relative', height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                <Image src={activeProj.img} alt={activeProj.title} fill style={{ objectFit: 'cover', opacity: .8 }} unoptimized />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(0,219,233,.15)', color: '#00dbe9', borderRadius: 20 }}>{activeProj.phase}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', background: '#2a2a2a', color: '#849495', borderRadius: 20 }}>{activeProj.progress}% done</span>
              </div>
              <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3, marginBottom: 16 }}>
                <div style={{ height: '100%', width: `${activeProj.progress}%`, background: '#cf5cff', borderRadius: 3 }} />
              </div>
              <button onClick={runAI} disabled={aiLoading}
                style={{ width: '100%', background: aiLoading ? '#2a2a2a' : '#00f0ff', color: aiLoading ? '#849495' : '#00363a', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: aiLoading ? 'wait' : 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                {aiLoading ? '⏳ Analisando produção...' : '🤖 Director AI — Analisar Produção'}
              </button>
              {aiText && (
                <div style={{ background: '#0e0e0e', border: '1px solid #3b494b', borderRadius: 8, padding: '12px', fontSize: 12, color: '#b9cacb', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto' }}>
                  {aiText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Bar */}
        <header style={c.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.04em', color: '#00dbe9', textTransform: 'uppercase' as const }}>
              Director&apos;s Cut
            </h1>
            <span style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.12em', borderLeft: '1px solid #3b494b', paddingLeft: 12 }}>
              {projects.find(p => p.active)?.title || 'No Active Project'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowNew(true)} style={c.btnCyan}>
              <Plus size={15} /> New Project
            </button>
            <button style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><Search size={18} /></button>
            <button style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><Settings size={18} /></button>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><LogOut size={18} /></button>
          </div>
        </header>

        <main style={c.main}>
          <div style={c.body}>
            {studioContext && (
              <section style={{ ...c.card, borderColor: '#00dbe9', background: '#172224' }}>
                <div style={{ fontSize: 10, color: '#00dbe9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                  Apex Copilot Studio Context
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#e5e2e1' }}>DirectCut workflow ready</h2>
                <p style={{ margin: 0, color: '#b9cacb', fontSize: 13, lineHeight: 1.6 }}>
                  Source: <strong>{studioContext.fileName || 'manual objective'}</strong>. {studioContext.result?.summary || 'Use this workspace to create a video plan, script, shot list or timeline.'}
                </p>
                <div style={{ marginTop: 12, background: '#0e0e0e', border: '1px solid #3b494b', borderRadius: 10, padding: 12, color: '#e5e2e1', fontSize: 12, lineHeight: 1.6 }}>
                  {studioContext.result?.prompt || 'Prepare a construction video plan with story, scenes, duration, assets, delivery format and review steps.'}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => setShowNew(true)} style={c.btnCyan}><Plus size={15} /> Create video project</button>
                  <button onClick={() => setAiText(studioContext.result?.prompt || '')} style={{ background: 'transparent', border: '1px solid rgba(0,219,233,.45)', borderRadius: 8, color: '#00dbe9', padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Load script prompt
                  </button>
                </div>
              </section>
            )}

            {/* ── DASHBOARD ─────────────────────────────── */}
            {view === 'dashboard' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Projects</h2>
                    <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>{projects.length} projects · {projects.filter(p=>p.active).length} active</p>
                  </div>
                  <button onClick={() => setShowNew(true)} style={c.btnCyan}><Plus size={16} /> New Project</button>
                </div>

                {/* Featured */}
                {projects[0] && (
                  <div onClick={() => setActive(projects[0])} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,219,233,.3)', marginBottom: 24, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/7' }}>
                      <Image src={projects[0].img} alt={projects[0].title} fill style={{ objectFit: 'cover', opacity: .8 }} sizes="960px" unoptimized />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #131313 0%, transparent 60%)' }} />
                    </div>
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ background: 'rgba(28,27,31,.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,219,233,.5)', color: '#00dbe9', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, background: '#00dbe9', borderRadius: '50%' }} />
                        {projects[0].active ? 'ACTIVE' : 'FEATURED'}
                      </span>
                    </div>
                    <div style={{ padding: '0 20px 20px', position: 'relative', marginTop: -60 }}>
                      <h3 style={{ fontSize: 28, fontWeight: 800, color: '#00dbe9', marginBottom: 4 }}>{projects[0].title}</h3>
                      <div style={{ fontSize: 12, color: '#b9cacb', marginBottom: 8 }}>{projects[0].phase} · {projects[0].progress}%</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,.15)', borderRadius: 2, width: 200 }}>
                        <div style={{ height: '100%', width: `${projects[0].progress}%`, background: '#cf5cff', borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 12 }}>All Projects</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {projects.map((p, i) => (
                    <div key={i} onClick={() => setActive(p)}
                      style={{ display: 'flex', gap: 12, padding: '10px 12px', background: p.active ? 'rgba(0,219,233,.05)' : '#201f1f', border: `1px solid ${p.active ? 'rgba(0,219,233,.4)' : '#3b494b'}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color .15s' }}
                      onMouseEnter={e => !p.active && ((e.currentTarget as HTMLElement).style.borderColor = '#849495')}
                      onMouseLeave={e => !p.active && ((e.currentTarget as HTMLElement).style.borderColor = '#3b494b')}>
                      <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <Image src={p.img} alt={p.title} fill style={{ objectFit: 'cover' }} sizes="72px" unoptimized />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: p.active ? '#00dbe9' : '#e5e2e1' }}>{p.title}</span>
                          <MoreVertical size={14} color="#849495" />
                        </div>
                        <span style={{ fontSize: 11, color: '#b9cacb', marginTop: 2 }}>{p.phase}</span>
                        <div style={{ height: 3, background: '#3b494b', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.progress}%`, background: p.active ? '#00dbe9' : '#cf5cff', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI summary card */}
                <div style={{ ...c.card, marginTop: 16, background: 'rgba(0,219,233,.05)', border: '1px solid rgba(0,219,233,.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#00dbe9', marginBottom: 8 }}>🤖 Director AI</div>
                  <p style={{ fontSize: 12, color: '#b9cacb', marginBottom: 12 }}>Análise completa de produção, riscos de entrega e ações prioritárias para o projeto ativo.</p>
                  <button onClick={runAI} disabled={aiLoading} style={{ ...c.btnCyan, width: '100%', justifyContent: 'center' }}>
                    {aiLoading ? '⏳ Analisando...' : '🎬 Analisar Produção com IA'}
                  </button>
                  {aiText && <pre style={{ marginTop: 12, fontSize: 12, color: '#b9cacb', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'inherit' }}>{aiText}</pre>}
                </div>
              </>
            )}

            {/* ── EDITOR ─────────────────────────────────── */}
            {view === 'editor' && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Timeline Editor</h2>
                <div style={{ ...c.card, background: '#0e0e0e', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
                  <Image src={projects.find(p=>p.active)?.img || projects[0]?.img || ''} alt="Preview" fill style={{ objectFit: 'cover', opacity: .7 }} unoptimized />
                  {!playing && <div style={{ position: 'absolute', width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,219,233,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={24} color="#00363a" /></div>}
                </div>
                <div style={{ ...c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <button style={{ background: 'none', border: 'none', color: '#b9cacb', cursor: 'pointer' }}><SkipBack size={20} /></button>
                  <button onClick={() => setPlaying(!playing)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#00dbe9', border: 'none', color: '#00363a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#b9cacb', cursor: 'pointer' }}><SkipForward size={20} /></button>
                  <div style={{ flex: 1, height: 4, background: '#3b494b', borderRadius: 2, margin: '0 8px', cursor: 'pointer' }}>
                    <div style={{ height: '100%', width: playing ? '45%' : '35%', background: '#00dbe9', borderRadius: 2, transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#b9cacb' }}>01:12:44 / 02:07:23</span>
                  <Volume2 size={16} color="#849495" />
                  <Maximize size={16} color="#849495" />
                </div>
                <div style={c.card}>
                  <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Timeline — {projects.find(p=>p.active)?.title || 'No active project'}
                  </p>
                  {['V1 — Hero Plate','V2 — VFX Comp','A1 — Dialogue','A2 — Score','A3 — SFX'].map((track, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#849495', width: 100, fontFamily: 'monospace', flexShrink: 0 }}>{track}</span>
                      <div style={{ flex: 1, height: 24, background: '#2a2a2a', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ height: '100%', width: `${50+i*8}%`, background: i < 2 ? 'rgba(0,219,233,.25)' : 'rgba(207,92,255,.25)', borderRadius: 4, border: `1px solid ${i<2 ? 'rgba(0,219,233,.4)' : 'rgba(207,92,255,.4)'}` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── RENDER ─────────────────────────────────── */}
            {view === 'render' && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Render Queue</h2>
                {projects.map((p, i) => (
                  <div key={i} style={c.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.title} — Final</div>
                        <div style={{ fontSize: 11, color: '#b9cacb', fontFamily: 'monospace' }}>Frames: {Math.round(p.progress * 36)}/{3600}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                        background: p.progress === 100 ? 'rgba(0,219,233,.15)' : p.active ? 'rgba(207,92,255,.15)' : '#2a2a2a',
                        color: p.progress === 100 ? '#00dbe9' : p.active ? '#cf5cff' : '#849495' }}>
                        {p.progress === 100 ? 'Concluído' : p.active ? 'Rendering' : 'Na fila'}
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress === 100 ? '#00dbe9' : '#cf5cff', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#849495', marginTop: 4 }}>{p.progress}%</div>
                  </div>
                ))}
              </>
            )}

            {/* ── ASSETS ─────────────────────────────────── */}
            {view === 'assets' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Asset Library</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowUpload(true)} style={{ background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#b9cacb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><Upload size={14} /> Upload</button>
                    <button onClick={() => {
                      const rows = assets.map(a => `${a.name}\t${a.type}\t${a.size}\t${a.status}`).join('\n')
                      const blob = new Blob([`Nome\tTipo\tTamanho\tStatus\n${rows}`], { type: 'text/plain' })
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'assets.txt'; a.click()
                    }} style={{ background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#b9cacb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><Download size={14} /> Export</button>
                  </div>
                </div>
                <div style={{ ...c.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3b494b' }}>
                        {['Nome','Tipo','Tamanho','Status','Ação'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((a, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #3b494b' }}>
                          <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace' }}>{a.name}</td>
                          <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#2a2a2a', color: '#b9cacb' }}>{a.type}</span></td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: '#b9cacb', fontFamily: 'monospace' }}>{a.size}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: a.status === 'approved' ? '#00dbe9' : a.status === 'pending' ? '#849495' : '#cf5cff' }}>
                              {a.status === 'approved' ? '✓ Aprovado' : a.status === 'pending' ? '⏳ Pendente' : '👁 Em revisão'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {a.status !== 'approved' && (
                              <button onClick={() => approveAsset(a.name)} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(0,219,233,.1)', color: '#00dbe9', border: '1px solid rgba(0,219,233,.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Aprovar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── REVIEW ─────────────────────────────────── */}
            {view === 'review' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Review & Feedback</h2>
                  <button onClick={() => setShowReview(true)} style={{ ...c.btnCyan, background: '#cf5cff', color: '#fff' }}>
                    <Plus size={15} /> Add Comment
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((r, i) => (
                    <div key={i} style={{ ...c.card, borderLeft: `3px solid ${r.status === 'resolved' ? '#00dbe9' : '#cf5cff'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{r.reviewer}</span>
                          <span style={{ fontSize: 10, color: '#849495', marginLeft: 8, padding: '1px 6px', background: '#2a2a2a', borderRadius: 20 }}>{r.role}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#849495' }}>{r.time}</span>
                          {r.status === 'resolved'
                            ? <CheckCircle size={14} color="#00dbe9" />
                            : <button onClick={() => resolveReview(r.comment)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <AlertCircle size={14} color="#cf5cff" />
                              </button>}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: '#b9cacb', lineHeight: 1.6 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </main>

        {/* Bottom Nav */}
        <nav style={c.bottomNav}>
          {navItems.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setView(id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: 1, height: '100%', paddingTop: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: view === id ? 'rgba(0,219,233,.05)' : 'transparent',
              borderTop: view === id ? '2px solid #00dbe9' : '2px solid transparent',
              color: view === id ? '#00dbe9' : '#849495', transition: 'all .15s',
            }}>
              <div style={{ marginBottom: 3 }}>{icon}</div>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.04em' }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
