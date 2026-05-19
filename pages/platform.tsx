'use client'
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

// ─── Architecture layers ─────────────────────────────────────────
const LAYERS = [
  {
    id: 'core_engine',
    label: 'CORE ENGINE',
    sublabel: 'Raciocínio & IA',
    icon: '🧠',
    color: '#185FA5',
    bg: '#EFF4FF',
    border: '#185FA5',
    status: 'live',
    features: [
      { name: 'Claude Sonnet 4.6 Integration', status: 'live', page: null },
      { name: 'Multi-Agent Orchestration', status: 'live', page: '/dashboard' },
      { name: 'Document Intelligence (Vision)', status: 'live', page: '/documentos' },
      { name: 'EVM Analytics Engine', status: 'live', page: '/dashboard' },
      { name: 'NR Compliance Engine', status: 'live', page: '/dashboard' },
      { name: 'BIM Clash AI Reasoning', status: 'live', page: '/bim-ops' },
      { name: 'Permit Intelligence (US)', status: 'live', page: '/bim-ops' },
    ],
  },
  {
    id: 'bim_module',
    label: 'BIM MODULE',
    sublabel: 'Modelos & Coordenação',
    icon: '🏗️',
    color: '#0d6e6e',
    bg: '#E6F7F7',
    border: '#0d6e6e',
    status: 'live',
    features: [
      { name: 'RVT/IFC Upload & Parse', status: 'live', page: '/bim-ops' },
      { name: 'Clash Detection (Critical/Major/Minor)', status: 'live', page: '/bim-ops' },
      { name: 'AI Clash Review & RFI', status: 'live', page: '/bim-ops' },
      { name: 'Permit Checklist (IBC/ADA/NFPA)', status: 'live', page: '/bim-ops' },
      { name: 'Construction Docs (CSI MasterFormat)', status: 'live', page: '/bim-ops' },
      { name: 'BIM Coordination Workflow', status: 'live', page: '/bim-ops' },
      { name: 'AI Executive Reports', status: 'live', page: '/bim-ops' },
      { name: '3D Model Viewer', status: 'next', page: null },
      { name: 'Digital Twin (7D)', status: 'nucleus2', page: null },
    ],
  },
  {
    id: 'finance_module',
    label: 'FINANCE MODULE',
    sublabel: 'Custos & Orçamentos',
    icon: '💰',
    color: '#534AB7',
    bg: '#F0EEFF',
    border: '#534AB7',
    status: 'live',
    features: [
      { name: 'Orçamento Paramétrico', status: 'live', page: '/orcamento' },
      { name: 'Curva S & Planejamento', status: 'live', page: '/orcamento' },
      { name: 'EVM: CPI, SPI, EAC, VAC, TCPI', status: 'live', page: '/dashboard' },
      { name: 'RDO — Relatório Diário de Obra', status: 'live', page: '/rdo' },
      { name: 'Qualidade & Inspeções', status: 'live', page: '/qualidade' },
      { name: 'Monte Carlo Risk Simulation', status: 'nucleus2', page: null },
    ],
  },
  {
    id: 'investment_module',
    label: 'INVESTMENT MODULE',
    sublabel: 'Valuation & Captação',
    icon: '📈',
    color: '#B87000',
    bg: '#FFF8E6',
    border: '#B87000',
    status: 'live',
    features: [
      { name: 'Análise de Investimentos (TIR/VPL)', status: 'live', page: '/investimentos' },
      { name: 'Sales Pipeline & CRM', status: 'live', page: '/vendas' },
      { name: 'Campanhas A/B com IA', status: 'live', page: '/vendas' },
      { name: 'Crowdfunding Imobiliário', status: 'nucleus2', page: null },
      { name: 'ESG Avançado & Relatórios', status: 'nucleus2', page: null },
    ],
  },
  {
    id: 'ai_orchestration',
    label: 'AI ORCHESTRATION',
    sublabel: 'Agentes Cognitivos',
    icon: '🤖',
    color: '#A32D2D',
    bg: '#FCEBEB',
    border: '#A32D2D',
    status: 'live',
    features: [
      { name: 'BIM Intelligence Agent', status: 'live', page: '/dashboard' },
      { name: 'EVM Analytics Agent', status: 'live', page: '/dashboard' },
      { name: 'NR Conformidade Agent', status: 'live', page: '/dashboard' },
      { name: 'Multi-Agent AI (8 especialistas)', status: 'live', page: '/dashboard' },
      { name: 'Sales Engine AI', status: 'live', page: '/vendas' },
      { name: 'Document Intelligence Vision', status: 'live', page: '/documentos' },
      { name: 'Permit AI (US Market)', status: 'live', page: '/bim-ops' },
      { name: 'Reinforcement Learning Agent', status: 'nucleus2', page: null },
    ],
  },
  {
    id: 'governance',
    label: 'GOVERNANCE',
    sublabel: 'Compliance & Jurídico',
    icon: '⚖️',
    color: '#3B6D11',
    bg: '#EAF3DE',
    border: '#3B6D11',
    status: 'live',
    features: [
      { name: 'Gerador de Contratos (22 cláusulas)', status: 'live', page: '/juridico' },
      { name: 'Memorial Descritivo IA', status: 'live', page: '/juridico' },
      { name: 'Leitura de Plantas & Documentos', status: 'live', page: '/plantas' },
      { name: 'NR-6/10/18/33/35 Compliance', status: 'live', page: '/dashboard' },
      { name: 'NBR Audit Trail', status: 'next', page: null },
      { name: 'US: IBC 2021 / ADA / NFPA', status: 'live', page: '/bim-ops' },
      { name: 'Director Cut Visual', status: 'live', page: '/director-cut' },
    ],
  },
  {
    id: 'automation',
    label: 'AUTOMATION',
    sublabel: 'Workflows & Operações',
    icon: '⚡',
    color: '#8B4513',
    bg: '#FFF0E6',
    border: '#8B4513',
    status: 'live',
    features: [
      { name: 'Workflow Approvals (BIM)', status: 'live', page: '/bim-ops' },
      { name: 'Issue Tracking & RFI', status: 'live', page: '/bim-ops' },
      { name: 'Print + WhatsApp Share', status: 'live', page: null },
      { name: 'ArchVis Pro Render', status: 'live', page: '/archvis' },
      { name: 'IoT Full Integration', status: 'nucleus2', page: null },
      { name: 'Facility Management 7D', status: 'nucleus2', page: null },
    ],
  },
]

// ─── All pages/modules ─────────────────────────────────────────────
const MODULES = [
  { id: 'dashboard', label: 'Dashboard Principal', icon: '🏠', page: '/dashboard', status: 'live', desc: 'KPIs, IA Agents, EVM, NR' },
  { id: 'bim', label: 'Atlas BIM Operations', icon: '🏗️', page: '/bim-ops', status: 'live', desc: 'Clash, Permits, Docs, US Market' },
  { id: 'orcamento', label: 'Orçamento & Custos', icon: '💰', page: '/orcamento', status: 'live', desc: 'Paramétrico, Curva S, EVM' },
  { id: 'rdo', label: 'RDO Diário', icon: '📋', page: '/rdo', status: 'live', desc: 'Relatório Diário de Obra' },
  { id: 'qualidade', label: 'Qualidade', icon: '✅', page: '/qualidade', status: 'live', desc: 'Inspeções e checklists' },
  { id: 'documentos', label: 'Document Intelligence', icon: '📄', page: '/documentos', status: 'live', desc: 'Upload PDF, Vision AI, análise' },
  { id: 'plantas', label: 'Leitura de Plantas', icon: '🗺️', page: '/plantas', status: 'live', desc: 'Memorial + análise de planta' },
  { id: 'juridico', label: 'Jurídico & Contratos', icon: '⚖️', page: '/juridico', status: 'live', desc: '22 cláusulas + Memorial IA' },
  { id: 'vendas', label: 'Sales Pipeline', icon: '📊', page: '/vendas', status: 'live', desc: 'CRM + Campanhas A/B IA' },
  { id: 'investimentos', label: 'Investimentos', icon: '📈', page: '/investimentos', status: 'live', desc: 'TIR/VPL, análise financeira' },
  { id: 'archvis', label: 'ArchVis Pro', icon: '🎨', page: '/archvis', status: 'live', desc: 'Renderização arquitetônica' },
  { id: 'director', label: 'Director Cut', icon: '🎬', page: '/director-cut', status: 'live', desc: 'Apresentação visual premium' },
  { id: 'crowdfunding', label: 'Crowdfunding', icon: '🌐', page: null, status: 'nucleus2', desc: 'Captação imobiliária coletiva' },
  { id: 'esg', label: 'ESG Avançado', icon: '🌱', page: null, status: 'nucleus2', desc: 'Relatórios ESG completos' },
  { id: 'iot', label: 'IoT Full', icon: '📡', page: null, status: 'nucleus2', desc: 'Sensores e monitoramento real' },
  { id: 'twin', label: 'Digital Twin 7D', icon: '🔮', page: null, status: 'nucleus2', desc: 'Gêmeo digital completo' },
  { id: 'monte', label: 'Monte Carlo', icon: '🎲', page: null, status: 'nucleus2', desc: 'Simulação de risco avançada' },
  { id: 'facility', label: 'Facility Mgmt 7D', icon: '🏢', page: null, status: 'nucleus2', desc: 'Gestão pós-obra completa' },
]

const STATUS_CFG = {
  live:     { label: 'LIVE', color: '#3B6D11', bg: '#EAF3DE' },
  next:     { label: 'NEXT', color: '#B87000', bg: '#FFF8E6' },
  nucleus2: { label: 'N2',   color: '#8b93a7', bg: '#f0f2f7' },
}

export default function PlatformVisualizer() {
  const router = useRouter()
  const [activeLayer, setActiveLayer] = useState<string | null>(null)
  const [view, setView] = useState<'layers' | 'modules' | 'roadmap'>('layers')

  const live    = MODULES.filter(m => m.status === 'live').length
  const next    = MODULES.filter(m => m.status === 'next').length
  const n2      = MODULES.filter(m => m.status === 'nucleus2').length
  const total   = MODULES.length

  return (
    <>
      <Head><title>Platform Architecture — Atlas Construction Intelligence</title></Head>
      <div style={{ fontFamily: "'Geist', sans-serif", minHeight: '100vh', background: '#f8f9fc', color: '#1a1f36' }}>

        {/* Top bar */}
        <div style={{ background: '#0d1117', borderBottom: '1px solid #30363d', padding: '0 24px', display: 'flex', alignItems: 'center', height: 52, gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6 }}>
            ← Dashboard
          </button>
          <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
            🗺️ Atlas Construction Intelligence
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: '2px 10px' }}>
            Platform Architecture Visualizer
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {(['layers', 'modules', 'roadmap'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? '#185FA5' : 'transparent',
                border: `1px solid ${view === v ? '#185FA5' : '#30363d'}`,
                color: view === v ? '#fff' : '#8b949e',
                borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {v === 'layers' ? '📐 Layers' : v === 'modules' ? '🧩 Modules' : '🛣️ Roadmap'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total Módulos', value: total, color: '#185FA5', bg: '#EFF4FF' },
              { label: '✅ Live / Funcionando', value: live, color: '#3B6D11', bg: '#EAF3DE' },
              { label: '⏳ Próxima sprint', value: next, color: '#B87000', bg: '#FFF8E6' },
              { label: '🔒 Núcleo 2 (futuro)', value: n2, color: '#8b93a7', bg: '#f0f2f7' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}33`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── LAYERS VIEW ─────────────────────────────────────────── */}
          {view === 'layers' && (
            <div>
              <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 16 }}>
                Clique em uma camada para expandir seus recursos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LAYERS.map((layer, idx) => {
                  const isOpen = activeLayer === layer.id
                  const liveFeatures = layer.features.filter(f => f.status === 'live').length
                  return (
                    <div key={layer.id} style={{
                      border: `2px solid ${isOpen ? layer.border : '#e5e8f0'}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                      background: '#fff',
                    }}>
                      {/* Layer header */}
                      <button
                        onClick={() => setActiveLayer(isOpen ? null : layer.id)}
                        style={{
                          width: '100%', textAlign: 'left', background: isOpen ? layer.bg : '#fff',
                          border: 'none', padding: '14px 20px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit',
                          transition: 'background 0.2s',
                        }}
                      >
                        {/* Layer number */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, background: layer.color,
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        {/* Icon + labels */}
                        <div style={{ fontSize: 22, flexShrink: 0 }}>{layer.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: layer.color, letterSpacing: '0.06em' }}>
                            {layer.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#5a6282', marginTop: 1 }}>{layer.sublabel}</div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ width: 120 }}>
                          <div style={{ fontSize: 10, color: '#8b93a7', marginBottom: 3, textAlign: 'right' }}>
                            {liveFeatures}/{layer.features.length} live
                          </div>
                          <div style={{ height: 6, background: '#e5e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${(liveFeatures / layer.features.length) * 100}%`,
                              height: '100%', background: layer.color, borderRadius: 3, transition: 'width 0.4s',
                            }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#8b93a7', marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</div>
                      </button>

                      {/* Features list */}
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${layer.border}33`, padding: '12px 20px 16px', background: '#fafbfc' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                            {layer.features.map(f => {
                              const sc = STATUS_CFG[f.status as keyof typeof STATUS_CFG]
                              return (
                                <div
                                  key={f.name}
                                  onClick={() => f.page && router.push(f.page)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', background: '#fff',
                                    border: '1px solid #e5e8f0', borderRadius: 8,
                                    cursor: f.page ? 'pointer' : 'default',
                                    opacity: f.status === 'nucleus2' ? 0.55 : 1,
                                    transition: 'border-color 0.15s',
                                  }}
                                  onMouseEnter={e => { if (f.page) (e.currentTarget as HTMLElement).style.borderColor = layer.color }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e8f0' }}
                                >
                                  <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                                    borderRadius: 10, background: sc.bg, color: sc.color, flexShrink: 0,
                                  }}>{sc.label}</span>
                                  <span style={{ fontSize: 12, color: '#1a1f36', lineHeight: 1.3 }}>{f.name}</span>
                                  {f.page && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b93a7' }}>→</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MODULES VIEW ─────────────────────────────────────────── */}
          {view === 'modules' && (
            <div>
              <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 16 }}>
                Todos os módulos da plataforma — clique para navegar
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {MODULES.map(m => {
                  const sc = STATUS_CFG[m.status as keyof typeof STATUS_CFG]
                  return (
                    <div
                      key={m.id}
                      onClick={() => m.page && router.push(m.page)}
                      style={{
                        background: '#fff', border: '1px solid #e5e8f0', borderRadius: 12,
                        padding: '16px', cursor: m.page ? 'pointer' : 'default',
                        opacity: m.status === 'nucleus2' ? 0.6 : 1,
                        transition: 'box-shadow 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (m.page) {
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                          ;(e.currentTarget as HTMLElement).style.borderColor = '#185FA5'
                        }
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                        ;(e.currentTarget as HTMLElement).style.borderColor = '#e5e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontSize: 26 }}>{m.icon}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                          background: sc.bg, color: sc.color,
                        }}>{sc.label}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1f36', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: '#8b93a7', lineHeight: 1.4 }}>{m.desc}</div>
                      {m.status === 'nucleus2' && (
                        <div style={{ marginTop: 8, fontSize: 10, color: '#8b93a7', fontStyle: 'italic' }}>🔒 Núcleo 2 — em desenvolvimento</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ROADMAP VIEW ─────────────────────────────────────────── */}
          {view === 'roadmap' && (
            <div>
              <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 20 }}>
                Roadmap de desenvolvimento da plataforma
              </div>
              {[
                {
                  phase: 'Fase 1 — Núcleo 1 (MVP)', color: '#3B6D11', bg: '#EAF3DE', done: true,
                  items: [
                    '✅ Dashboard com KPIs e 4 agentes IA',
                    '✅ Orçamento paramétrico + Curva S',
                    '✅ RDO + Qualidade',
                    '✅ Document Intelligence (Claude Vision)',
                    '✅ Jurídico: Contratos 22 cláusulas + Memorial',
                    '✅ Sales Pipeline + Campanhas A/B',
                    '✅ Investimentos TIR/VPL',
                    '✅ ArchVis Pro',
                    '✅ Director Cut',
                    '✅ Leitura de Plantas',
                  ],
                },
                {
                  phase: 'Fase 2 — Atlas BIM Operations (US Market)', color: '#185FA5', bg: '#EFF4FF', done: true,
                  items: [
                    '✅ BIM Upload (RVT/IFC)',
                    '✅ Clash Detection com AI (Critical/Major/Minor)',
                    '✅ Permit Checklist (IBC 2021/ADA/NFPA/Title24)',
                    '✅ Construction Docs (CSI MasterFormat)',
                    '✅ AI Workflow Approvals',
                    '✅ AI Executive Reports',
                    '✅ US Market Roles Dashboard',
                  ],
                },
                {
                  phase: 'Fase 3 — Próxima Sprint', color: '#B87000', bg: '#FFF8E6', done: false,
                  items: [
                    '⏳ 3D Model Viewer (IFC.js ou Forge Viewer)',
                    '⏳ NBR Audit Trail automático',
                    '⏳ Integração com Revit via API',
                    '⏳ Notificações em tempo real',
                    '⏳ Mobile app (PWA)',
                  ],
                },
                {
                  phase: 'Núcleo 2 — Recursos Avançados', color: '#534AB7', bg: '#F0EEFF', done: false,
                  items: [
                    '🔒 Crowdfunding Imobiliário',
                    '🔒 ESG Avançado + Relatórios regulatórios',
                    '🔒 IoT Full (sensores, monitoramento)',
                    '🔒 Digital Twin 7D',
                    '🔒 Reinforcement Learning Agent',
                    '🔒 Monte Carlo Risk Simulation',
                    '🔒 Facility Management 7D',
                    '🔒 Multi-Agent Avançado (RL + Monte Carlo)',
                  ],
                },
              ].map((phase, i) => (
                <div key={i} style={{
                  background: '#fff', border: `2px solid ${phase.color}44`,
                  borderLeft: `4px solid ${phase.color}`,
                  borderRadius: 12, marginBottom: 16, overflow: 'hidden',
                }}>
                  <div style={{ background: phase.bg, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: phase.color }}>{phase.phase}</div>
                    {phase.done && (
                      <span style={{ fontSize: 10, background: '#EAF3DE', color: '#3B6D11', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                        COMPLETO
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                    {phase.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 12, color: '#1a1f36', padding: '4px 0' }}>{item}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Progress summary */}
              <div style={{ background: '#fff', border: '1px solid #e5e8f0', borderRadius: 12, padding: '20px', marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1f36', marginBottom: 14 }}>📊 Progresso Geral da Plataforma</div>
                {[
                  { label: 'Módulos Live', value: live, total, color: '#3B6D11' },
                  { label: 'Features Arquitetura (Live)', value: LAYERS.reduce((a, l) => a + l.features.filter(f => f.status === 'live').length, 0), total: LAYERS.reduce((a, l) => a + l.features.length, 0), color: '#185FA5' },
                  { label: 'Núcleo 1 Completo', value: 19, total: 19, color: '#3B6D11' },
                  { label: 'Núcleo 2 Planejado', value: 0, total: 8, color: '#534AB7' },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a6282', marginBottom: 4 }}>
                      <span>{p.label}</span>
                      <span style={{ fontWeight: 700, color: p.color }}>{p.value}/{p.total}</span>
                    </div>
                    <div style={{ height: 8, background: '#f0f2f7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(p.value / p.total) * 100}%`,
                        height: '100%', background: p.color, borderRadius: 4,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
