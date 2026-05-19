'use client'
import HelpButton from './HelpButton'
import NewProjectModal from './NewProjectModal'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getSupabase } from '../lib/supabase'
import type { Profile } from '../pages/dashboard'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  code: string
  status: string
  city: string
  state: string
  budget_planned: number
  budget_actual: number
  completion_pct: number
  cpi: number | null
  spi: number | null
  eac: number | null
  esg_score: number | null
}

interface BudgetItem {
  period: string
  pv: number
  ev: number
  ac: number
}

interface AgentEvent {
  id: string
  event_type: string
  source_agent: string
  summary: string
  priority: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1 }).format(v)

const fmtPct = (v: number | null) =>
  v != null ? `${v.toFixed(1)}%` : '—'

const fmtKpi = (v: number | null) =>
  v != null ? v.toFixed(2) : '—'

function statusColor(s: string) {
  const m: Record<string, string> = {
    em_andamento: '#185FA5', atrasado: '#A32D2D',
    planejamento: '#534AB7', pausado: '#BA7517',
    concluido: '#3B6D11',   cancelado: '#5F5E5A',
  }
  return m[s] ?? '#888'
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    em_andamento: 'Em andamento', atrasado: 'Atrasado',
    planejamento: 'Planejamento', pausado: 'Pausado',
    concluido: 'Concluído',       cancelado: 'Cancelado',
  }
  return m[s] ?? s
}

function priorityColor(p: string) {
  return p === 'critico' ? '#A32D2D'
    : p === 'alto'   ? '#BA7517'
    : p === 'medio'  ? '#185FA5'
    : '#5F5E5A'
}

function avatarInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Config por role ──────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  label: string; icon: string
  nav: { icon: string; label: string; badge?: string }[]
  kpis: (projects: Project[]) => { icon: string; label: string; value: string; delta: string; trend: 'up'|'down'|'warn'|'neutral' }[]
  showCurvaS: boolean
  showAgentEvents: boolean
  showProjects: boolean
  accentColor: string
}> = {
  diretor_executivo: {
    label: 'Diretor Executivo', icon: '👑', accentColor: '#534AB7',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'Portfólio' },
      { icon: '▪', label: 'Exec. Intelligence' },
      { icon: '▪', label: 'Investimentos' },
      { icon: '▪', label: 'ESG Score' },
    ],
    kpis: (ps) => [
      { icon: '🏢', label: 'Projetos ativos', value: String(ps.length),
        delta: `${ps.filter(p=>p.status==='em_andamento').length} em andamento`,
        trend: 'neutral' },
      { icon: '💰', label: 'Orçamento total',
        value: fmt(ps.reduce((a,p)=>a+p.budget_planned,0)),
        delta: 'Base contratual', trend: 'neutral' },
      { icon: '📊', label: 'CPI médio',
        value: fmtKpi(ps.reduce((a,p)=>a+(p.cpi??0),0)/Math.max(ps.length,1)),
        delta: ps.some(p=>(p.cpi??1)<0.9) ? 'Atenção: projetos abaixo de 0,90' : 'Dentro da meta',
        trend: ps.some(p=>(p.cpi??1)<0.9) ? 'warn' : 'up' },
      { icon: '🌱', label: 'ESG médio',
        value: fmtKpi(ps.reduce((a,p)=>a+(p.esg_score??0),0)/Math.max(ps.length,1)),
        delta: '/100 — meta ≥ 70', trend: 'up' },
    ],
    showCurvaS: true, showAgentEvents: true, showProjects: true,
  },

  gestor_financeiro: {
    label: 'Gestor Financeiro', icon: '💲', accentColor: '#3B6D11',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'Curva S / EVM', href: '/orcamento', href: '/orcamento' },
      { icon: '▪', label: 'SINAPI Realtime' },
      { icon: '▪', label: 'Contratos' },
      { icon: '▪', label: 'ROI / TIR' },
    ],
    kpis: (ps) => {
      const totalPlan = ps.reduce((a,p)=>a+p.budget_planned,0)
      const totalActual = ps.reduce((a,p)=>a+p.budget_actual,0)
      const desvio = totalPlan > 0 ? ((totalActual-totalPlan)/totalPlan)*100 : 0
      const cpiMed = ps.reduce((a,p)=>a+(p.cpi??0),0)/Math.max(ps.length,1)
      return [
        { icon: '📋', label: 'Orçamento previsto', value: fmt(totalPlan), delta: 'Base Jan/2026', trend: 'neutral' },
        { icon: '💸', label: 'Realizado', value: fmt(totalActual),
          delta: `${desvio>=0?'+':''}${desvio.toFixed(1)}% vs. previsto`,
          trend: desvio>10 ? 'down' : desvio>5 ? 'warn' : 'up' },
        { icon: '📈', label: 'CPI portfólio', value: fmtKpi(cpiMed),
          delta: cpiMed < 0.9 ? 'Crítico — abaixo de 0,90' : cpiMed < 0.95 ? 'Atenção' : 'Dentro da meta',
          trend: cpiMed < 0.9 ? 'down' : cpiMed < 0.95 ? 'warn' : 'up' },
        { icon: '🔢', label: 'Projetos com desvio',
          value: String(ps.filter(p=>p.budget_actual>p.budget_planned).length),
          delta: `de ${ps.length} projetos`, trend: 'warn' },
      ]
    },
    showCurvaS: true, showAgentEvents: false, showProjects: true,
  },

  coordenador_projetos: {
    label: 'Coordenador de Projetos', icon: '📅', accentColor: '#185FA5',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'Cronograma' },
      { icon: '▪', label: 'Documentos' },
      { icon: '▪', label: 'BIM / Clash', badge: '!' },
      { icon: '▪', label: 'Qualidade' },
    ],
    kpis: (ps) => {
      const spiMed = ps.reduce((a,p)=>a+(p.spi??0),0)/Math.max(ps.length,1)
      const avgComp = ps.reduce((a,p)=>a+p.completion_pct,0)/Math.max(ps.length,1)
      return [
        { icon: '📊', label: 'Conclusão média', value: fmtPct(avgComp),
          delta: 'Média do portfólio', trend: 'neutral' },
        { icon: '⏱', label: 'SPI médio', value: fmtKpi(spiMed),
          delta: spiMed < 0.9 ? 'Abaixo da meta (0,95)' : 'Dentro da meta',
          trend: spiMed < 0.9 ? 'down' : spiMed < 0.95 ? 'warn' : 'up' },
        { icon: '🔴', label: 'Atrasados', value: String(ps.filter(p=>p.status==='atrasado').length),
          delta: 'Requerem atenção', trend: ps.some(p=>p.status==='atrasado') ? 'down' : 'up' },
        { icon: '✅', label: 'No prazo', value: String(ps.filter(p=>p.status==='em_andamento').length),
          delta: 'Progredindo normalmente', trend: 'up' },
      ]
    },
    showCurvaS: false, showAgentEvents: true, showProjects: true,
  },

  engenheiro_campo: {
    label: 'Engenheiro de Campo', icon: '🦺', accentColor: '#BA7517',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'RDO', badge: '1' },
      { icon: '▪', label: 'Ocorrências' },
      { icon: '▪', label: 'Checklist NR' },
      { icon: '▪', label: 'Não conformidades' },
    ],
    kpis: (ps) => {
      const ativos = ps.filter(p=>p.status==='em_andamento')
      return [
        { icon: '🏗', label: 'Projetos no campo', value: String(ativos.length),
          delta: 'Frentes ativas', trend: 'neutral' },
        { icon: '📋', label: 'RDO pendente', value: '1',
          delta: 'Fechar hoje até 18h', trend: 'warn' },
        { icon: '🛡', label: 'Dias sem acidente', value: '47',
          delta: 'Meta: 365 dias', trend: 'up' },
        { icon: '⚠', label: 'NCIs abertas', value: '2',
          delta: '1 vence amanhã', trend: 'warn' },
      ]
    },
    showCurvaS: false, showAgentEvents: false, showProjects: true,
  },

  gestor_qualidade: {
    label: 'Gestor de Qualidade', icon: '🔍', accentColor: '#A32D2D',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'NCIs abertas', badge: '8' },
      { icon: '▪', label: 'Checklists' },
      { icon: '▪', label: 'NBR 15575' },
      { icon: '▪', label: 'Histórico retrabalho' },
    ],
    kpis: () => [
      { icon: '🔴', label: 'NCIs abertas', value: '8', delta: '3 vencidas', trend: 'down' },
      { icon: '🔁', label: 'Taxa retrabalho', value: '4,2%', delta: 'Meta ≤3% — acima', trend: 'down' },
      { icon: '⏱', label: 'Prazo médio NCI', value: '9,3 dias', delta: 'Meta ≤7 dias', trend: 'warn' },
      { icon: '📐', label: 'NBR 15575', value: '91%', delta: 'Meta ≥95%', trend: 'warn' },
    ],
    showCurvaS: false, showAgentEvents: true, showProjects: false,
  },

  investidor: {
    label: 'Investidor / Sócio', icon: '📈', accentColor: '#854F0B',
    nav: [
      { icon: '▪', label: 'Dashboard' },
      { icon: '▪', label: 'ROI / TIR' },
      { icon: '▪', label: 'NOI / Cap Rate' },
      { icon: '▪', label: 'ESG Score' },
      { icon: '▪', label: 'Pitch Deck' },
    ],
    kpis: (ps) => [
      { icon: '📈', label: 'ROI médio', value: '22,1%', delta: 'Meta ≥20% ✓', trend: 'up' },
      { icon: '💹', label: 'TIR portfólio', value: '18,4%', delta: 'WACC+5%: 14,2% ✓', trend: 'up' },
      { icon: '🏙', label: 'VGV total', value: fmt(ps.reduce((a,p)=>a+p.budget_planned*2.5,0)),
        delta: '73% comercializado', trend: 'up' },
      { icon: '🌱', label: 'ESG score', value: '74/100', delta: 'Rótulo: Bom', trend: 'up' },
    ],
    showCurvaS: true, showAgentEvents: false, showProjects: true,
  },
}

const DEFAULT_ROLE_CONFIG = ROLE_CONFIG['coordenador_projetos']

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardByRole({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [projects, setProjects]       = useState<Project[]>([])
  const [budgetData, setBudgetData]   = useState<BudgetItem[]>([])
  const [events, setEvents]           = useState<AgentEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showPlantasViewer, setShowPlantasViewer] = useState(false)
  const [activeNav, setActiveNav]     = useState(0)
  const [activePlanta, setActivePlanta] = useState(0)

  const cfg = ROLE_CONFIG[profile.role] ?? DEFAULT_ROLE_CONFIG

  const loadData = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      // Modo demo — dados fictícios
      setProjects([
        { id:'1', name:'Ponte Av. Central', code:'OBR-2026-001', status:'em_andamento',
          city:'São Paulo', state:'SP', budget_planned:12400000, budget_actual:12100000,
          completion_pct:82, cpi:1.02, spi:1.04, eac:12200000, esg_score:81 },
        { id:'2', name:'Torre B Comercial', code:'OBR-2026-002', status:'atrasado',
          city:'Rio de Janeiro', state:'RJ', budget_planned:18700000, budget_actual:20600000,
          completion_pct:55, cpi:0.81, spi:0.88, eac:23100000, esg_score:78 },
        { id:'3', name:'Usina Hidrelétrica Paraná', code:'OBR-2026-003', status:'atrasado',
          city:'Curitiba', state:'PR', budget_planned:9100000, budget_actual:9800000,
          completion_pct:38, cpi:0.92, spi:0.79, eac:9900000, esg_score:69 },
        { id:'4', name:'BR-163 Trecho 4', code:'OBR-2026-004', status:'em_andamento',
          city:'Sinop', state:'MT', budget_planned:8100000, budget_actual:7900000,
          completion_pct:71, cpi:0.99, spi:0.97, eac:8200000, esg_score:72 },
      ])
      setBudgetData([
        { period:'Jan', pv:6000000,  ev:5800000,  ac:5900000  },
        { period:'Fev', pv:12000000, ev:11500000, ac:12100000 },
        { period:'Mar', pv:20000000, ev:19000000, ac:20500000 },
        { period:'Abr', pv:30000000, ev:28000000, ac:31000000 },
        { period:'Mai', pv:40000000, ev:36000000, ac:41500000 },
        { period:'Jun', pv:48300000, ev:null as any, ac:null as any },
      ])
      setEvents([
        { id:'1', event_type:'desvio_custo', source_agent:'Cost_Controller_AI',
          summary:'Torre B: aço A572 +22% acima do SINAPI. Substituto sugerido: HEA.',
          priority:'critico', created_at: new Date().toISOString() },
        { id:'2', event_type:'atraso_caminho_critico', source_agent:'Construction_Planner_AI',
          summary:'Usina Paraná: 18 dias de atraso acumulado. Replanejamento necessário.',
          priority:'alto', created_at: new Date().toISOString() },
        { id:'3', event_type:'documento_processado', source_agent:'Document_Intelligence_AI',
          summary:'Memorial Torre B: 3 inconsistências de armadura identificadas (págs 47, 89, 112).',
          priority:'medio', created_at: new Date().toISOString() },
      ])
      setLoading(false)
      return
    }

    // Dados reais do Supabase
    const [projRes, budgetRes, eventsRes] = await Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('budget_items').select('*').order('period', { ascending: true }).limit(12),
      sb.from('agent_events').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    if (projRes.data)   setProjects(projRes.data as Project[])
    if (budgetRes.data) setBudgetData(
      budgetRes.data.map((b: any) => ({
        period: new Date(b.period).toLocaleDateString('pt-BR', { month: 'short' }),
        pv: b.pv, ev: b.ev, ac: b.ac,
      }))
    )
    if (eventsRes.data) setEvents(eventsRes.data as AgentEvent[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleLogout() {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:'14px', letterSpacing:'2px' }}>
        CARREGANDO DASHBOARD...
      </span>
    </div>
  )

  const kpis = cfg.kpis(projects)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #f4f5f7; font-family: 'Geist', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #d0d5e0; border-radius: 2px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
        <aside style={{
          width: '220px', minWidth: '220px', background: '#fff',
          borderRight: '1px solid #e5e8f0', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '18px 16px', borderBottom: '1px solid #e5e8f0',
            display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, background: '#185FA5',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16, color: '#fff' }}>🏗</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f36' }}>ConstructAI</div>
              <div style={{ fontSize: 9, color: '#8b93a7', letterSpacing: '0.06em' }}>v5.3 ENTERPRISE</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: '#a0a8bb', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '8px 8px 4px' }}>Principal</div>
            {cfg.nav.map((item, i) => (
              <button key={i} onClick={() => {
                setActiveNav(i)
                const routes: Record<string,string> = {
                  'Curva S / EVM': '/orcamento',
                  'Orçamento': '/orcamento',
                  'RDO': '/rdo',
                  'Não conformidades': '/qualidade',
                  'NCIs abertas': '/qualidade',
                  'Checklists': '/qualidade',
                  'NBR 15575': '/qualidade',
                  'Documentos': '/documentos',
                  'ROI / TIR': '/investimentos',
                  'NOI / Cap Rate': '/investimentos',
                  'ESG Score': '/investimentos',
                  'Pitch Deck': '/investimentos',
                  'Investimentos': '/investimentos',
                  'Plantas': '/plantas',
                  'BIM / Clash': '/plantas',
                }
                if (routes[item.label]) window.location.href = routes[item.label]
              }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: i === activeNav ? 500 : 400,
                  background: i === activeNav ? '#EFF4FF' : 'transparent',
                  color: i === activeNav ? '#185FA5' : '#5a6282',
                  marginBottom: 2, transition: 'all 0.15s',
                  justifyContent: 'space-between',
                }}>
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{ background: '#FCEBEB', color: '#A32D2D',
                    fontSize: 9, fontWeight: 700, padding: '1px 5px',
                    borderRadius: 10, marginLeft: 'auto' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          <a href='https://arch-vis-pro.vercel.app' target='_blank' style={{display:'flex',gap:8,padding:'8px 10px',color:'#3B6D11',fontSize:13,textDecoration:'none',margin:'4px 8px'}}>🎨 ArchVis Pro</a><a href='https://directorcut-xi.vercel.app' target='_blank' style={{display:'flex',gap:8,padding:'8px 10px',color:'#534AB7',fontSize:13,textDecoration:'none',margin:'4px 8px'}}>🎬 Director Cut</a><a href='/juridico' style={{display:'flex',gap:8,padding:'8px 10px',color:'#534AB7',fontSize:13,textDecoration:'none',margin:'4px 8px'}}>⚖️ Jurídico</a></nav>

          {/* User box */}
          <div style={{ padding: '12px', borderTop: '1px solid #e5e8f0',
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: cfg.accentColor + '22', color: cfg.accentColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {avatarInitials(profile.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1f36',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name ?? profile.email}
              </div>
              <div style={{ fontSize: 10, color: '#8b93a7' }}>{cfg.icon} {cfg.label}</div>
            </div>
            <button onClick={handleLogout} title="Sair"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#a0a8bb', fontSize: 16, padding: 4, borderRadius: 4 }}>
              ↩
            </button>
          </div>
        </aside>

        {/* ── MAIN ──────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e5e8f0',
            padding: '12px 24px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: '#1a1f36' }}>
                Dashboard — {cfg.label}
              </h1>
              <p style={{ fontSize: 12, color: '#8b93a7' }}>
                {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric',
                  month:'long', year:'numeric' })} · {projects.length} projetos
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={loadData}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                  border:'1px solid #e5e8f0', borderRadius:8, background:'#fff',
                  fontSize:12, fontWeight:500, color:'#5a6282', cursor:'pointer',
                  fontFamily:'inherit' }}>
                🔄 Atualizar
              </button>
              <button onClick={() => setShowPlantasViewer(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                  border:'1px solid #3B6D11', borderRadius:8, background:'#EAF3DE',
                  fontSize:12, fontWeight:600, color:'#3B6D11', cursor:'pointer',
                  fontFamily:'inherit' }}>
                🏗️ Plantas
              </button>
              <button onClick={() => setShowNewProject(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                  border:'none', borderRadius:8, background:'#185FA5',
                  fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer',
                  fontFamily:'inherit' }}>
                + Novo projeto
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px',
            display:'flex', flexDirection:'column', gap:16 }}>

            {/* KPIs */}
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
              {kpis.map((k, i) => (
                <div key={i} style={{ background:'#fff', border:'1px solid #e5e8f0',
                  borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, color:'#8b93a7', marginBottom:6,
                    display:'flex', alignItems:'center', gap:5 }}>
                    <span>{k.icon}</span> {k.label}
                  </div>
                  <div style={{ fontSize:22, fontWeight:600, color:'#1a1f36', marginBottom:3 }}>
                    {k.value}
                  </div>
                  <div style={{ fontSize:11,
                    color: k.trend==='up' ? '#3B6D11' : k.trend==='down' ? '#A32D2D'
                      : k.trend==='warn' ? '#854F0B' : '#8b93a7',
                    display:'flex', alignItems:'center', gap:3 }}>
                    {k.trend==='up'?'↑':k.trend==='down'?'↓':k.trend==='warn'?'⚠':''} {k.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Linha central */}
            <div style={{ display:'grid',
              gridTemplateColumns: cfg.showCurvaS ? '1.6fr 1fr' : '1fr',
              gap:12 }}>

              {/* Curva S */}
              {cfg.showCurvaS && (
                <div style={{ background:'#fff', border:'1px solid #e5e8f0',
                  borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36',
                    marginBottom:4 }}>
                    📈 Curva S — Previsto × Realizado × Projeção
                  </div>
                  <div style={{ fontSize:11, color:'#8b93a7', marginBottom:14 }}>
                    EVM consolidado do portfólio
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={budgetData}
                      margin={{ top:4, right:8, left:8, bottom:0 }}>
                      <defs>
                        <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#185FA5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gEV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3B6D11" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B6D11" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gAC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#A32D2D" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#A32D2D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7"/>
                      <XAxis dataKey="period" tick={{ fontSize:10, fill:'#8b93a7' }}/>
                      <YAxis tickFormatter={v=>fmt(v)} tick={{ fontSize:9, fill:'#8b93a7' }} width={64}/>
                      <Tooltip formatter={(v:any) => fmt(Number(v))}
                        contentStyle={{ fontSize:11, border:'1px solid #e5e8f0', borderRadius:8 }}/>
                      <Legend iconSize={8}
                        formatter={(v) => <span style={{ fontSize:11, color:'#5a6282' }}>{v}</span>}/>
                      <ReferenceLine x="Mai" stroke="#BA7517" strokeDasharray="4 2"
                        label={{ value:'Hoje', fill:'#BA7517', fontSize:9 }}/>
                      <Area type="monotone" dataKey="pv" name="Previsto" stroke="#185FA5"
                        fill="url(#gPV)" strokeWidth={2} dot={false} connectNulls/>
                      <Area type="monotone" dataKey="ev" name="Agregado" stroke="#3B6D11"
                        fill="url(#gEV)" strokeWidth={2.5} dot={false} connectNulls/>
                      <Area type="monotone" dataKey="ac" name="Realizado" stroke="#A32D2D"
                        fill="url(#gAC)" strokeWidth={2} strokeDasharray="5 3"
                        dot={false} connectNulls/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Eventos dos agentes */}
              {cfg.showAgentEvents && (
                <div style={{ background:'#fff', border:'1px solid #e5e8f0',
                  borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:14 }}>
                    🤖 Alertas dos Agentes IA
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {events.map(ev => (
                      <div key={ev.id} style={{
                        padding:'10px 12px', borderRadius:8,
                        border:`1px solid ${priorityColor(ev.priority)}33`,
                        background:`${priorityColor(ev.priority)}08`,
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontSize:10, fontWeight:600,
                            color: priorityColor(ev.priority),
                            textTransform:'uppercase', letterSpacing:'0.06em' }}>
                            {ev.priority} · {ev.source_agent.replace('_AI','')}
                          </span>
                          <span style={{ fontSize:10, color:'#a0a8bb' }}>
                            {new Date(ev.created_at).toLocaleTimeString('pt-BR',
                              { hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:'#3a4166', lineHeight:1.5 }}>
                          {ev.summary}
                        </p>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p style={{ fontSize:12, color:'#a0a8bb', textAlign:'center',
                        padding:'20px 0' }}>
                        ✅ Sem alertas ativos
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabela de projetos */}
            {cfg.showProjects && (
              <div style={{ background:'#fff', border:'1px solid #e5e8f0',
                borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e5e8f0',
                  fontSize:13, fontWeight:600, color:'#1a1f36' }}>
                  🗂 Projetos em andamento
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f8f9fc' }}>
                        {['Projeto','Localização','Progresso','CPI','SPI','Previsto','Realizado','Status']
                          .map(h => (
                            <th key={h} style={{ padding:'10px 14px', textAlign:'left',
                              fontWeight:600, color:'#8b93a7', whiteSpace:'nowrap',
                              borderBottom:'1px solid #e5e8f0', fontSize:11 }}>
                              {h}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, i) => (
                        <tr key={p.id}
                          style={{ background: i%2===0 ? '#fff' : '#fafbfd',
                            transition:'background 0.1s', cursor:'pointer' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='#EFF4FF')}
                          onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfd')}>
                          <td style={{ padding:'11px 14px', fontWeight:500, color:'#1a1f36' }}>
                            <div>{p.name}</div>
                            <div style={{ fontSize:10, color:'#a0a8bb', marginTop:2 }}>{p.code}</div>
                          </td>
                          <td style={{ padding:'11px 14px', color:'#5a6282' }}>
                            {p.city}, {p.state}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:70, height:5, background:'#e5e8f0',
                                borderRadius:3, overflow:'hidden' }}>
                                <div style={{ width:`${p.completion_pct}%`, height:'100%',
                                  background: p.completion_pct>=75 ? '#3B6D11'
                                    : p.completion_pct>=40 ? '#185FA5' : '#A32D2D',
                                  borderRadius:3 }}/>
                              </div>
                              <span style={{ fontSize:11, fontWeight:500, color:'#3a4166' }}>
                                {p.completion_pct}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding:'11px 14px', fontWeight:500,
                            color: (p.cpi??1)<0.9?'#A32D2D':(p.cpi??1)<0.95?'#854F0B':'#3B6D11' }}>
                            {fmtKpi(p.cpi)}
                          </td>
                          <td style={{ padding:'11px 14px', fontWeight:500,
                            color: (p.spi??1)<0.9?'#A32D2D':(p.spi??1)<0.95?'#854F0B':'#3B6D11' }}>
                            {fmtKpi(p.spi)}
                          </td>
                          <td style={{ padding:'11px 14px', color:'#5a6282' }}>
                            {fmt(p.budget_planned)}
                          </td>
                          <td style={{ padding:'11px 14px',
                            color: p.budget_actual > p.budget_planned ? '#A32D2D' : '#3B6D11',
                            fontWeight:500 }}>
                            {fmt(p.budget_actual)}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{
                              fontSize:10, fontWeight:600, padding:'3px 9px',
                              borderRadius:20,
                              background: statusColor(p.status)+'18',
                              color: statusColor(p.status),
                            }}>
                              {statusLabel(p.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── VISUALIZADOR DE PLANTAS ── */}
      {showPlantasViewer && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowPlantasViewer(false) }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:300,
            display:'flex', alignItems:'flex-start', justifyContent:'center',
            padding:20, overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:960,
            margin:'auto', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

            {/* Header */}
            <div style={{ padding:'14px 20px', background:'#f8f9fc', borderBottom:'1px solid #e5e8f0',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36' }}>
                  🏗️ Visualizador de Plantas Arquitetônicas
                </div>
                <div style={{ fontSize:11, color:'#8890a0', marginTop:2 }}>
                  José Edgard de Oliveira · Lote 255,12 m² · Área construída 280 m²
                </div>
              </div>
              <button onClick={() => setShowPlantasViewer(false)}
                style={{ background:'none', border:'none', fontSize:20, cursor:'pointer',
                  color:'#8890a0', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:520 }}>

              {/* Índice de Plantas */}
              <div style={{ borderRight:'1px solid #e5e8f0', padding:'16px 12px',
                background:'#fafafa', display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase',
                  letterSpacing:'.1em', marginBottom:8, paddingLeft:8 }}>Índice de Plantas</div>
                {[
                  { icon:'🏠', label:'Planta Baixa', sub:'Pavimento Térreo' },
                  { icon:'⬜', label:'Planta de Forro', sub:'Modulação de gesso' },
                  { icon:'🔺', label:'Planta de Telhado', sub:'Cobertura e caimentos' },
                  { icon:'✂️', label:'Cortes', sub:'Corte AA / BB' },
                  { icon:'📐', label:'Elevações', sub:'4 fachadas' },
                  { icon:'🏛️', label:'Fachada Principal', sub:'Vista frontal' },
                ].map((p, i) => (
                  <button key={i} onClick={() => setActivePlanta(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit',
                      textAlign:'left', width:'100%', transition:'all .15s',
                      background: activePlanta===i ? '#EFF4FF' : 'transparent',
                      borderLeft: activePlanta===i ? '3px solid #185FA5' : '3px solid transparent' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600,
                        color: activePlanta===i ? '#185FA5' : '#1a1f36' }}>{p.label}</div>
                      <div style={{ fontSize:10, color:'#8890a0' }}>{p.sub}</div>
                    </div>
                  </button>
                ))}

                {/* Quadro de Áreas */}
                <div style={{ marginTop:'auto', padding:'12px', background:'#fff',
                  border:'1px solid #e5e8f0', borderRadius:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase',
                    letterSpacing:'.08em', marginBottom:8 }}>Quadro de Áreas</div>
                  {[
                    { label:'Lote', val:'255,12 m²' },
                    { label:'Área construída', val:'280,00 m²' },
                    { label:'Taxa de ocupação', val:'55%' },
                    { label:'Coeficiente', val:'1,10' },
                    { label:'Área livre', val:'115,12 m²' },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between',
                      fontSize:11, padding:'3px 0', borderBottom:'1px solid #f0f0f0' }}>
                      <span style={{ color:'#5a6282' }}>{r.label}</span>
                      <span style={{ fontWeight:600, color:'#1a1f36', fontFamily:'monospace' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Área de visualização */}
              <div style={{ display:'flex', flexDirection:'column' }}>
                {/* Toolbar */}
                <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e8f0',
                  display:'flex', alignItems:'center', gap:8 }}>
                  {['🔍 Zoom +','🔍 Zoom -','↔ Ajustar','📏 Medidas','🖨️ Imprimir'].map(a => (
                    <button key={a} style={{ padding:'5px 10px', border:'1px solid #e5e8f0',
                      borderRadius:6, background:'#fff', fontSize:11, cursor:'pointer',
                      fontFamily:'inherit', color:'#5a6282' }}>{a}</button>
                  ))}
                </div>

                {/* Canvas da planta */}
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#f0f2f5', padding:24, minHeight:380 }}>
                  <div style={{ background:'#fff', borderRadius:8, padding:32,
                    boxShadow:'0 2px 12px rgba(0,0,0,.1)', width:'100%', maxWidth:560, aspectRatio:'4/3',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    border:'2px solid #e5e8f0' }}>
                    {[
                      { icon:'🏠', msg:'Planta Baixa — Pavimento Térreo', detail:'Sala, 3 quartos, 2 banheiros, cozinha, área de serviço' },
                      { icon:'⬜', msg:'Planta de Forro', detail:'Modulação 60x60 cm · Sancas perimetrais · Spots embutidos' },
                      { icon:'🔺', msg:'Planta de Telhado', detail:'Estrutura em madeira · Telha cerâmica · Caimento 30%' },
                      { icon:'✂️', msg:'Corte AA / BB', detail:'Pé-direito 2,80m · Laje 12cm · Fundação em sapata corrida' },
                      { icon:'📐', msg:'Elevações', detail:'4 fachadas · Revestimento argamassado · Pintura texturizada' },
                      { icon:'🏛️', msg:'Fachada Principal', detail:'Portão ferro · Jardineira · Garagem para 2 veículos' },
                    ][activePlanta] && (() => {
                      const p = [
                        { icon:'🏠', msg:'Planta Baixa — Pavimento Térreo', detail:'Sala, 3 quartos, 2 banheiros, cozinha, área de serviço' },
                        { icon:'⬜', msg:'Planta de Forro', detail:'Modulação 60x60 cm · Sancas perimetrais · Spots embutidos' },
                        { icon:'🔺', msg:'Planta de Telhado', detail:'Estrutura em madeira · Telha cerâmica · Caimento 30%' },
                        { icon:'✂️', msg:'Corte AA / BB', detail:'Pé-direito 2,80m · Laje 12cm · Fundação em sapata corrida' },
                        { icon:'📐', msg:'Elevações', detail:'4 fachadas · Revestimento argamassado · Pintura texturizada' },
                        { icon:'🏛️', msg:'Fachada Principal', detail:'Portão ferro · Jardineira · Garagem para 2 veículos' },
                      ][activePlanta]
                      return (
                        <>
                          <div style={{ fontSize:56, marginBottom:16 }}>{p.icon}</div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#1a1f36', marginBottom:8, textAlign:'center' }}>{p.msg}</div>
                          <div style={{ fontSize:12, color:'#8890a0', textAlign:'center', lineHeight:1.6 }}>{p.detail}</div>
                          <div style={{ marginTop:20, padding:'8px 16px', background:'#EFF4FF',
                            borderRadius:6, fontSize:11, color:'#185FA5', fontWeight:600 }}>
                            📎 Arquivo: {['PB-01','PF-01','PT-01','CR-01','EL-01','FA-01'][activePlanta]}.dwg
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Metadados */}
                <div style={{ padding:'12px 16px', borderTop:'1px solid #e5e8f0',
                  background:'#fafafa', display:'flex', gap:24, flexWrap:'wrap' }}>
                  {[
                    { label:'Proprietário', val:'José Edgard de Oliveira' },
                    { label:'CREA', val:'5071162007' },
                    { label:'Endereço', val:'Promissão / SP' },
                    { label:'Revisão', val:'Rev.02 — Mai/2026' },
                    { label:'Escala', val:'1:50' },
                    { label:'Norma', val:'ABNT NBR 6492' },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ fontSize:9, fontWeight:700, color:'#8890a0',
                        textTransform:'uppercase', letterSpacing:'.07em' }}>{m.label}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:'#1a1f36' }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onSave={loadData} />}
    </>
  )
}
