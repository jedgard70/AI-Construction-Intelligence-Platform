'use client'
import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import {
  LayoutDashboard, Film, Cuboid, FolderOpen, MessageSquareText,
  Search, Settings, LogOut, Plus, MoreVertical, Play, Pause,
  SkipBack, SkipForward, Volume2, Maximize, Upload, Download,
  Star, CheckCircle, AlertCircle,
} from 'lucide-react'

const DC_CSS = `
  .dc-wrap { --bg: #131313; --surface: #201f1f; --surface-low: #1c1b1b; --surface-high: #2a2a2a;
    --primary: #dbfcff; --primary-dim: #00dbe9; --primary-container: #00f0ff;
    --secondary: #ecb2ff; --secondary-container: #cf5cff;
    --on-surface: #e5e2e1; --on-surface-v: #b9cacb; --outline: #849495; --outline-v: #3b494b;
    --error: #ffb4ab; }
`

type View = 'dashboard' | 'editor' | 'render' | 'assets' | 'review'

const PROJECTS = [
  { title: 'Cyberpunk Overdrive', phase: 'VFX Phase: Compositing', progress: 75, active: true,
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80' },
  { title: 'Void Echoes', phase: 'VFX Phase: Animation', progress: 40, active: false,
    img: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=400&q=80' },
  { title: 'Dune Rider', phase: 'VFX Phase: Lighting', progress: 60, active: false,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { title: 'London Fog', phase: 'VFX Phase: Grading', progress: 90, active: false,
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80' },
]

const ASSETS = [
  { name: 'hero_vfx_comp_v12.exr', type: 'VFX', size: '2.4 GB', status: 'approved' },
  { name: 'sfx_thunderstorm.wav', type: 'Audio', size: '45 MB', status: 'approved' },
  { name: 'bg_plate_night.mov', type: 'Plate', size: '18 GB', status: 'pending' },
  { name: 'char_rig_v3.abc', type: '3D', size: '890 MB', status: 'review' },
  { name: 'color_lut_final.cube', type: 'LUT', size: '1.2 MB', status: 'approved' },
  { name: 'title_card_anim.mp4', type: 'Motion', size: '320 MB', status: 'pending' },
]

const REVIEWS = [
  { reviewer: 'Maria Santos', role: 'Director', comment: 'The color grade on scene 12 needs more warmth in the highlights.', status: 'open', time: '2h ago' },
  { reviewer: 'João Costa', role: 'VFX Super', comment: 'Fire simulation approved. Moving to final comp.', status: 'resolved', time: '4h ago' },
  { reviewer: 'Ana Lima', role: 'Producer', comment: 'Runtime is 127min — need to cut 3min from act 2.', status: 'open', time: '1d ago' },
  { reviewer: 'Carlos Melo', role: 'Sound', comment: 'Dialogue mix in reel 4 approved for final.', status: 'resolved', time: '2d ago' },
]

export default function DirectorCutPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('dashboard')
  const [playing, setPlaying] = useState(false)

  const c = {
    wrap: { minHeight: '100vh', background: '#131313', color: '#e5e2e1', fontFamily: "'Inter',system-ui,sans-serif", display: 'flex', flexDirection: 'column' as const },
    topbar: { height: 56, borderBottom: '1px solid #3b494b', background: '#1c1b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 50, position: 'sticky' as const, top: 0 },
    main: { flex: 1, overflowY: 'auto' as const, paddingBottom: 64 },
    bottomNav: { height: 64, borderTop: '1px solid #3b494b', background: '#1c1b1b', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px', flexShrink: 0, position: 'sticky' as const, bottom: 0, zIndex: 50 },
    body: { padding: '24px 20px', maxWidth: 960, margin: '0 auto' },
    card: { background: '#201f1f', border: '1px solid #3b494b', borderRadius: 12, padding: '16px 18px', marginBottom: 16 },
  }

  const navItems: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { id: 'editor', icon: <Film size={22} />, label: 'Editor' },
    { id: 'render', icon: <Cuboid size={22} />, label: 'Render' },
    { id: 'assets', icon: <FolderOpen size={22} />, label: 'Assets' },
    { id: 'review', icon: <MessageSquareText size={22} />, label: 'Review' },
  ]

  return (
    <>
      <Head><title>Director&apos;s Cut — Workspace Cinematográfico</title></Head>
      <style dangerouslySetInnerHTML={{ __html: DC_CSS }} />
      <div style={c.wrap} className="dc-wrap">
        {/* Top Bar */}
        <header style={c.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.04em', color: '#00dbe9', textTransform: 'uppercase' as const }}>
              Director&apos;s Cut
            </h1>
            <span style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.12em', borderLeft: '1px solid #3b494b', paddingLeft: 12 }}>
              Project Alpha
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><Search size={18} /></button>
            <button style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer' }}><Settings size={18} /></button>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#849495', cursor: 'pointer', marginLeft: 8 }} title="Voltar"><LogOut size={18} /></button>
          </div>
        </header>

        {/* Main Content */}
        <main style={c.main}>
          <div style={c.body}>

            {/* DASHBOARD */}
            {view === 'dashboard' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Projects</h2>
                    <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Workspace / Alpha Phase</p>
                  </div>
                  <button style={{ background: '#00f0ff', color: '#00363a', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> New Project
                  </button>
                </div>

                {/* Featured */}
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,219,233,.3)', marginBottom: 24, cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/7' }}>
                    <Image src={PROJECTS[0].img} alt={PROJECTS[0].title} fill style={{ objectFit: 'cover', opacity: .8 }} sizes="960px" unoptimized />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #131313 0%, transparent 60%)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: 'rgba(28,27,31,.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,219,233,.5)', color: '#00dbe9', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, background: '#00dbe9', borderRadius: '50%' }} />
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ padding: '0 20px 20px', position: 'relative', marginTop: -60 }}>
                    <h3 style={{ fontSize: 28, fontWeight: 800, color: '#00dbe9', marginBottom: 6 }}>{PROJECTS[0].title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#b9cacb' }}>Last edited: 2 mins ago</span>
                      <div style={{ display: 'flex' }}>
                        {['JD','MK','AL'].map(i => (
                          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a2a', border: '2px solid #131313', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginLeft: -6 }}>{i}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Grid */}
                <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 12 }}>Recent Releases</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PROJECTS.slice(1).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#201f1f', border: '1px solid #3b494b', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <Image src={p.img} alt={p.title} fill style={{ objectFit: 'cover' }} sizes="72px" unoptimized />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{p.title}</span>
                          <MoreVertical size={14} color="#849495" />
                        </div>
                        <span style={{ fontSize: 11, color: '#b9cacb', marginTop: 2 }}>{p.phase}</span>
                        <div style={{ height: 3, background: '#3b494b', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.progress}%`, background: '#cf5cff', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* EDITOR */}
            {view === 'editor' && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Timeline Editor</h2>
                <div style={{ ...c.card, background: '#0e0e0e', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <Image src={PROJECTS[0].img} alt="Preview" width={640} height={360} style={{ borderRadius: 8, opacity: .7, maxWidth: '100%' }} unoptimized />
                  </div>
                </div>
                {/* Controls */}
                <div style={{ ...c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <button style={{ background: 'none', border: 'none', color: '#b9cacb', cursor: 'pointer' }}><SkipBack size={20} /></button>
                  <button onClick={() => setPlaying(!playing)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#00dbe9', border: 'none', color: '#00363a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#b9cacb', cursor: 'pointer' }}><SkipForward size={20} /></button>
                  <div style={{ flex: 1, height: 4, background: '#3b494b', borderRadius: 2, margin: '0 8px', cursor: 'pointer' }}>
                    <div style={{ height: '100%', width: '35%', background: '#00dbe9', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#b9cacb' }}>01:12:44 / 02:07:23</span>
                  <Volume2 size={16} color="#849495" />
                  <Maximize size={16} color="#849495" />
                </div>
                {/* Timeline */}
                <div style={c.card}>
                  <p style={{ fontSize: 10, color: '#849495', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Timeline — Reel 3</p>
                  {['V1 — Hero Plate','V2 — VFX Comp','A1 — Dialogue','A2 — Score','A3 — SFX'].map((track, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#849495', width: 100, fontFamily: 'monospace', flexShrink: 0 }}>{track}</span>
                      <div style={{ flex: 1, height: 24, background: '#2a2a2a', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${50 + i * 10}%`, background: i < 2 ? 'rgba(0,219,233,.25)' : 'rgba(207,92,255,.25)', borderRadius: 4, border: `1px solid ${i < 2 ? 'rgba(0,219,233,.4)' : 'rgba(207,92,255,.4)'}` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* RENDER */}
            {view === 'render' && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Render Queue</h2>
                {[
                  { name: 'Cyberpunk Overdrive — Final', frames: '2847/3600', pct: 79, status: 'rendering', time: '~42min' },
                  { name: 'Void Echoes — VFX Pass', frames: '1200/1200', pct: 100, status: 'done', time: 'Concluído' },
                  { name: 'Dune Rider — Lighting', frames: '0/4100', pct: 0, status: 'queued', time: 'Na fila' },
                ].map((r, i) => (
                  <div key={i} style={c.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#b9cacb', fontFamily: 'monospace' }}>Frames: {r.frames}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                        background: r.status === 'done' ? 'rgba(0,219,233,.15)' : r.status === 'rendering' ? 'rgba(207,92,255,.15)' : '#2a2a2a',
                        color: r.status === 'done' ? '#00dbe9' : r.status === 'rendering' ? '#cf5cff' : '#849495' }}>
                        {r.time}
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.pct}%`, background: r.status === 'done' ? '#00dbe9' : '#cf5cff', borderRadius: 3, transition: 'width .5s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#849495', marginTop: 4 }}>{r.pct}%</div>
                  </div>
                ))}
              </>
            )}

            {/* ASSETS */}
            {view === 'assets' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Asset Library</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#b9cacb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={14} /> Upload</button>
                    <button style={{ background: '#2a2a2a', border: '1px solid #3b494b', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#b9cacb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Export</button>
                  </div>
                </div>
                <div style={{ ...c.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3b494b' }}>
                        {['Nome', 'Tipo', 'Tamanho', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 10, color: '#849495', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ASSETS.map((a, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #3b494b', cursor: 'pointer' }}>
                          <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace' }}>{a.name}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#2a2a2a', color: '#b9cacb' }}>{a.type}</span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: '#b9cacb', fontFamily: 'monospace' }}>{a.size}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: a.status === 'approved' ? '#00dbe9' : a.status === 'pending' ? '#849495' : '#cf5cff' }}>
                              {a.status === 'approved' ? '✓ Aprovado' : a.status === 'pending' ? '⏳ Pendente' : '👁 Em revisão'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* REVIEW */}
            {view === 'review' && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Review & Feedback</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {REVIEWS.map((r, i) => (
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
                            : <AlertCircle size={14} color="#cf5cff" />}
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
