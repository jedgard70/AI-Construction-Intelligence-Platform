'use client'
import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Box, Library, ImageIcon,
  BarChart3, Clock, HardDrive, Zap, ArrowUpRight,
  Monitor, Cpu, Layers, Bell, Search, LogOut,
} from 'lucide-react'
import Image from 'next/image'

const CSS_VARS = `
  :root {
    --background: #0a0a0a;
    --surface: #1c1b1f;
    --surface-container-lowest: #0f0e11;
    --surface-container-low: #1c1b1f;
    --surface-container: #211f26;
    --surface-container-high: #2b2930;
    --surface-container-highest: #36343b;
    --on-surface: #e6e1e5;
    --on-surface-variant: #cac4d0;
    --outline: #938f99;
    --outline-variant: #49454f;
    --primary: #d0bcff;
    --on-primary: #381e72;
    --primary-container: #4f378b;
    --on-primary-container: #eaddff;
    --secondary: #ccc2dc;
    --tertiary: #efb8c8;
    --error: #f2b8b5;
    --on-error: #601410;
  }
`

const PROJECTS = [
  { name: 'Neo-Modern Atrium', status: 'Render Complete', date: '2h ago', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&q=80' },
  { name: 'Corporate Lobby v2', status: 'Syncing Assets', date: '5h ago', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80' },
  { name: 'Kitchen Interior', status: 'Optimization Running', date: 'yesterday', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80' },
]

const GALLERY = [
  { name: 'Penthouse Suite', style: 'Contemporary', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80' },
  { name: 'Modern Office', style: 'Minimalist', img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&q=80' },
  { name: 'Luxury Villa', style: 'Mediterranean', img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80' },
  { name: 'Urban Studio', style: 'Industrial', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80' },
  { name: 'Resort Lobby', style: 'Tropical', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80' },
  { name: 'Zen Garden', style: 'Japanese', img: 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=400&q=80' },
]

type Tab = 'dashboard' | 'gallery' | 'editor' | 'materials'

export default function ArchVisPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dashboard')

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0a0a', color: '#e6e1e5', fontFamily: "'Inter',system-ui,sans-serif" },
    header: { height: 64, borderBottom: '1px solid #49454f', background: 'rgba(28,27,31,.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky' as const, top: 0, zIndex: 50 },
    logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
    nav: { display: 'flex', gap: 4 },
    navBtn: (active: boolean) => ({
      padding: '6px 14px', borderRadius: 8, border: active ? '1px solid rgba(208,188,255,.3)' : '1px solid transparent',
      background: active ? 'rgba(208,188,255,.1)' : 'transparent',
      color: active ? '#d0bcff' : '#cac4d0', fontSize: 12, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
    }),
    body: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
    card: { background: '#211f26', border: '1px solid #49454f', borderRadius: 16, padding: '20px 22px' },
    statCard: { background: '#211f26', border: '1px solid #49454f', borderRadius: 16, padding: 24 },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 },
    grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  }

  return (
    <>
      <Head><title>ArchVis Pro — Visualização Arquitetônica</title></Head>
      <style dangerouslySetInnerHTML={{ __html: CSS_VARS }} />
      <div style={s.wrap}>
        {/* Header */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={s.logo} onClick={() => router.back()}>
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
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#cac4d0' }} />
              <input placeholder="Quick search (⌘K)" style={{ background: '#2b2930', border: '1px solid #49454f', borderRadius: 20, padding: '6px 12px 6px 30px', fontSize: 11, color: '#e6e1e5', fontFamily: 'monospace', outline: 'none', width: 180 }} />
            </div>
            <button style={{ background: 'none', border: 'none', color: '#cac4d0', cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, background: '#d0bcff', borderRadius: '50%', border: '1.5px solid #0a0a0a' }} />
            </button>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#cac4d0', cursor: 'pointer' }} title="Voltar">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div style={s.body}>
          {tab === 'dashboard' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Workstation Dashboard</h1>
                <p style={{ color: '#cac4d0', fontSize: 13 }}>System Status: <span style={{ color: '#d0bcff' }}>Optimized</span> · Node: US-EAST-01</p>
              </div>
              <div style={s.grid4}>
                {[
                  { label: 'Active Renders', value: '04', icon: Monitor, color: '#d0bcff' },
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
                    {PROJECTS.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', background: '#2b2930', borderRadius: 12, border: '1px solid #49454f', cursor: 'pointer' }}>
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
                      {[{ name: 'Neural Denoise', icon: Cpu }, { name: 'PBR Library', icon: Library }, { name: 'Scene Layers', icon: Layers }, { name: 'Analytics', icon: BarChart3 }].map(({ name, icon: Icon }) => (
                        <button key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', background: '#2b2930', border: '1px solid #49454f', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <Icon size={20} color="#d0bcff" />
                          <span style={{ fontSize: 9, color: '#938f99', textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...s.card, background: 'rgba(79,55,139,.2)', border: '1px solid rgba(208,188,255,.2)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d0bcff', marginBottom: 8 }}>Deployment Hub</h3>
                    <p style={{ fontSize: 11, color: '#cac4d0', marginBottom: 14, lineHeight: 1.6 }}>Your latest render is ready for client review. Sync to cloud now.</p>
                    <button style={{ width: '100%', background: '#d0bcff', color: '#381e72', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sync Project
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'gallery' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Visualization Gallery</h1>
                <p style={{ color: '#cac4d0', fontSize: 13 }}>{GALLERY.length} renders · Filtrar por estilo</p>
              </div>
              <div style={s.grid3}>
                {GALLERY.map((g, i) => (
                  <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #49454f', cursor: 'pointer', background: '#211f26' }}>
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

          {tab === 'editor' && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#cac4d0' }}>
              <Box size={48} color="#d0bcff" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>3D Editor</h2>
              <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                O editor 3D completo está disponível na versão desktop integrada ao Revit/3ds Max.
              </p>
            </div>
          )}

          {tab === 'materials' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>PBR Material Library</h1>
                <p style={{ color: '#cac4d0', fontSize: 13 }}>Biblioteca de materiais físicos para renderização</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {['Concreto Polido','Madeira Carvalho','Mármore Carrara','Aço Escovado','Vidro Temperado',
                  'Couro Preto','Tecido Linho','Granito Preto','Cobre Oxidado','Resina Epóxi'].map((mat, i) => (
                  <div key={i} style={{ background: '#211f26', border: '1px solid #49454f', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 80, background: `hsl(${i*36},${20+i*5}%,${25+i*3}%)` }} />
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{mat}</div>
                      <div style={{ fontSize: 9, color: '#938f99', fontFamily: 'monospace', marginTop: 2 }}>PBR · 4K</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
