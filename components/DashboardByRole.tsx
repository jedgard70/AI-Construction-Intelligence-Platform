'use client'
import HelpButton from './HelpButton'
import NewProjectModal from './NewProjectModal'
import NewClientModal from './NewClientModal'
import { printDocument } from './PrintShareModal'
import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'
import type { Profile } from '../pages/dashboard'

const CurvaSChart = dynamic(() => import('./CurvaSChart'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b93a7', fontSize: 12 }}>
      Carregando gráfico...
    </div>
  ),
})

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
      { icon: '▪', label: 'Sales Pipeline' },
      { icon: '▪', label: 'Documentos' },
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
      { icon: '▪', label: 'Curva S / EVM' },
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
  const [showNewClient, setShowNewClient] = useState(false)
  const [showPlantasViewer, setShowPlantasViewer] = useState(false)
  const [activeNav, setActiveNav]     = useState(0)
  const [activePlanta, setActivePlanta] = useState(0)
  const [plantFiles, setPlantFiles]   = useState<Array<{name:string,type:string,url:string,size:number,ext:string}>>([])
  const [plantUploading, setPlantUploading] = useState(false)
  const [viewerTab, setViewerTab] = useState<'viewer'|'humanize'|'analysis'>('viewer')
  const [humanTipo, setHumanTipo] = useState('residencial unifamiliar')
  const [humanEscala, setHumanEscala] = useState('50')
  const [humanNP, setHumanNP] = useState(6)
  const [humanEstilo, setHumanEstilo] = useState('photorealistic professional architectural')
  const [humanLote, setHumanLote] = useState('standard rectangular urban lot with sidewalk and street trees')
  const [humanVeg, setHumanVeg] = useState('imperial palm trees, tropical shrubs, bromeliads, ornamental grasses, dense tropical foliage')
  const [humanB64, setHumanB64] = useState<string|null>(null)
  const [humanImgType, setHumanImgType] = useState('image/jpeg')
  const [humanResult, setHumanResult] = useState<Record<string,string>>({})
  const [humanLoading, setHumanLoading] = useState(false)
  const [unifiedAnalysis, setUnifiedAnalysis] = useState('')
  const [unifiedLoading, setUnifiedLoading] = useState(false)
  const [activePfB64, setActivePfB64] = useState<string|null>(null)
  const [activePfMediaType, setActivePfMediaType] = useState('image/jpeg')
  const [aiAgentModal, setAiAgentModal] = useState<string|null>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult]   = useState('')

  const cfg = ROLE_CONFIG[profile.role] ?? DEFAULT_ROLE_CONFIG

  const loadData = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      // Modo local — carrega projetos salvos pelo usuário (localStorage)
      try {
        const stored = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
        if (stored.length > 0) {
          setProjects(stored)
        } else {
          // Dados de exemplo só quando não há nada salvo
          setProjects([
            { id:'example-1', name:'[Exemplo] Torre Horizonte — Torre A', code:'OBR-2026-EX1', status:'em_andamento',
              city:'São Paulo', state:'SP', budget_planned:12400000, budget_actual:10200000,
              completion_pct:68, cpi:1.02, spi:1.04, eac:12200000, esg_score:81 },
            { id:'example-2', name:'[Exemplo] Clique em "+ Novo Projeto" para criar o seu', code:'OBR-2026-EX2', status:'planejamento',
              city:'', state:'', budget_planned:0, budget_actual:0,
              completion_pct:0, cpi:null, spi:null, eac:null, esg_score:null },
          ])
        }
      } catch {
        setProjects([])
      }
      setBudgetData([])
      setEvents([])
      setLoading(false)
      return
    }

    // Dados reais do Supabase
    try {
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
    } catch {
      // tabelas ainda não criadas — dashboard abre vazio sem travar
    } finally {
      setLoading(false)
    }
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
                  'SINAPI Realtime': '/orcamento',
                  'Contratos': '/contratos/novo',
                  'RDO': '/rdo',
                  'Ocorrências': '/rdo',
                  'Checklist NR': '/qualidade',
                  'Não conformidades': '/qualidade',
                  'NCIs abertas': '/qualidade',
                  'Checklists': '/qualidade',
                  'NBR 15575': '/qualidade',
                  'Histórico retrabalho': '/qualidade',
                  'Documentos': '/documentos',
                  'ROI / TIR': '/investimentos',
                  'NOI / Cap Rate': '/investimentos',
                  'ESG Score': '/investimentos',
                  'Pitch Deck': '/investimentos',
                  'Investimentos': '/investimentos',
                  'Plantas': '/plantas',
                  'BIM / Clash': '/bim-ops',
                  'Cronograma': '/orcamento',
                  'Qualidade': '/qualidade',
                  'Sales Pipeline': '/vendas',
                  'Pipeline': '/vendas',
                  'Captação': '/vendas',
                  'Exec. Intelligence': '/investimentos',
                  'Portfólio': '/investimentos',
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
          <div style={{borderTop:'1px solid #e5e8f0',margin:'8px 0 4px',padding:'8px 8px 0'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'#b0b8c8',textTransform:'uppercase',padding:'0 2px 6px'}}>Ferramentas</div>
            <a href='/bim-ops' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#0d6e6e',fontSize:12,fontWeight:600,textDecoration:'none',borderRadius:8,transition:'background .15s',background:'#E6F7F7'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#c8efef')} onMouseLeave={e=>(e.currentTarget.style.background='#E6F7F7')}>🏗️ Atlas BIM Ops</a>
            <a href='/us-brand' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#0F4C81',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#E8F0F9')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>🌎 US Brand Strategy</a>
            <a href='/platform' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#185FA5',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#EFF4FF')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>🗺️ Platform Map</a>
            <a href='/archvis' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#3B6D11',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#EAF3DE')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>🎨 ArchVis Pro</a>
            <a href='/director-cut' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#534AB7',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#F0EEFF')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>🎬 Director Cut</a>
            <a href='/juridico' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#534AB7',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#F0EEFF')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>⚖️ Jurídico</a>
            <a href='/vendas' style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',color:'#185FA5',fontSize:12,fontWeight:500,textDecoration:'none',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#EFF4FF')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>📊 Sales Pipeline</a>
          </div></nav>

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
              <button onClick={() => setShowNewClient(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                  border:'1px solid #534AB7', borderRadius:8, background:'#F0EEFF',
                  fontSize:12, fontWeight:600, color:'#534AB7', cursor:'pointer',
                  fontFamily:'inherit' }}>
                👤 Novo Cliente
              </button>
              <button onClick={() => setShowNewProject(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                  border:'none', borderRadius:8, background:'#185FA5',
                  fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer',
                  fontFamily:'inherit' }}>
                + Novo Projeto
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

            {/* ── 4 Cards Agentes IA ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { id:'bim',    icon:'🏢', label:'BIM Intelligence',    sub:'Clash detection · 3D/4D/5D/6D/7D',   color:'#185FA5', bg:'#EFF4FF',
                  prompt:'Você é o BIM_Intelligence_AI. Analise o portfólio de obras e simule uma detecção de clashes BIM. Retorne: 1) Número de interferências detectadas por disciplina (Estrutural, Hidráulica, Elétrica, HVAC); 2) Nível de severidade (Crítico/Médio/Baixo); 3) Top 3 conflitos prioritários com descrição técnica; 4) Índice 4D de cronograma e 5D de custo vinculados; 5) Recomendações de resolução. Use dados fictícios realistas de obras brasileiras.' },
                { id:'evm',    icon:'📊', label:'EVM Analytics',        sub:'CPI, SPI, EAC, VAC, TCPI em tempo real', color:'#534AB7', bg:'#F0EEFF',
                  prompt:'Você é o EVM_Analytics_AI. Calcule e analise os indicadores de Earned Value Management do portfólio. Forneça: 1) CPI (Cost Performance Index) por projeto; 2) SPI (Schedule Performance Index); 3) EAC (Estimate at Completion); 4) VAC (Variance at Completion); 5) TCPI (To-Complete Performance Index); 6) Análise da Curva S; 7) Previsão de encerramento e custo final. Use os projetos do portfólio e mostre cálculos detalhados.' },
                { id:'nr',     icon:'🛡', label:'Conformidade NR',      sub:'NR-6, NR-10, NR-18, NR-33, NR-35',  color:'#3B6D11', bg:'#EAF3DE',
                  prompt:'Você é o NR_Compliance_AI. Faça uma auditoria completa de conformidade com Normas Regulamentadoras no portfólio de obras. Analise: 1) NR-18 (Segurança na Construção Civil) — itens críticos; 2) NR-6 (EPIs) — cobertura e adequação; 3) NR-10 (Eletricidade) — pontos de risco; 4) NR-33 (Espaços Confinados); 5) NR-35 (Trabalho em Altura). Para cada NR: status de conformidade, pendências, prazo para regularização e risco de multa (valor estimado). Emita score geral de segurança.' },
                { id:'multi',  icon:'🤖', label:'Multi-Agent AI',       sub:'8 especialistas cognitivos simultâneos', color:'#A32D2D', bg:'#FCEBEB',
                  prompt:'Você é o MultiAgent_Coordinator. Coordene 8 agentes especializados e produza uma análise estratégica completa do portfólio: [Cost_Controller_AI] Desvios de custo e alertas SINAPI; [Construction_Planner_AI] Caminho crítico e reprogramações; [BIM_Intelligence_AI] Detecção de clashes e compatibilização; [Legal_Compliance_AI] Conformidade contratual e regulatória; [ESG_Monitor_AI] Score de sustentabilidade; [Risk_Assessment_AI] Matriz de riscos atualizada; [Market_Intelligence_AI] Benchmarking setorial; [Finance_Optimizer_AI] Fluxo de caixa e otimização. Consolide em relatório executivo com score geral 0-100 e top 5 ações prioritárias.' },
              ].map(ag => (
                <div key={ag.id}
                  onClick={() => { setAiAgentModal(ag.id); setAgentResult('') }}
                  style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12,
                    padding:'14px 16px', cursor:'pointer', transition:'all .15s',
                    borderLeftWidth:3, borderLeftColor:ag.color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=ag.bg; (e.currentTarget as HTMLElement).style.borderColor=ag.color }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='#fff'; (e.currentTarget as HTMLElement).style.borderLeftColor=ag.color; (e.currentTarget as HTMLElement).style.borderTopColor='#e5e8f0'; (e.currentTarget as HTMLElement).style.borderRightColor='#e5e8f0'; (e.currentTarget as HTMLElement).style.borderBottomColor='#e5e8f0' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{ag.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36', marginBottom:3 }}>{ag.label}</div>
                  <div style={{ fontSize:10, color:'#8b93a7', lineHeight:1.4 }}>{ag.sub}</div>
                  <div style={{ marginTop:10, fontSize:10, fontWeight:600, color:ag.color,
                    display:'flex', alignItems:'center', gap:4 }}>▶ Executar agente</div>
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
                  <CurvaSChart data={budgetData} />
                </div>
              )}

              {/* Eventos dos agentes */}
              {cfg.showAgentEvents && (
                <div style={{ background:'#fff', border:'1px solid #e5e8f0',
                  borderRadius:12, padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>
                      🤖 Alertas dos Agentes IA
                    </div>
                    {events.length > 0 && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => {
                          const html = `
<h1>🤖 Relatório de Alertas — Agentes IA</h1>
<div class="meta"><span>📅 ${new Date().toLocaleDateString('pt-BR')}</span><span>${events.length} alertas</span></div>
<table>
  <tr><th>Prioridade</th><th>Agente</th><th>Hora</th><th>Resumo</th></tr>
  ${events.map(ev => `<tr>
    <td><span class="badge badge-${ev.priority==='critico'?'red':ev.priority==='alto'?'yellow':'blue'}">${ev.priority.toUpperCase()}</span></td>
    <td>${ev.source_agent.replace('_AI','')}</td>
    <td>${new Date(ev.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
    <td>${ev.summary}</td>
  </tr>`).join('')}
</table>`
                          printDocument('Alertas dos Agentes IA', html)
                        }} style={{ padding:'5px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                          background:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
                          fontFamily:'inherit', color:'#5a6282', display:'flex', alignItems:'center', gap:4 }}>
                          🖨️ Imprimir
                        </button>
                        <button onClick={() => {
                          const text = `🤖 ALERTAS DOS AGENTES IA\n${new Date().toLocaleDateString('pt-BR')}\n\n` +
                            events.map(ev => `[${ev.priority.toUpperCase()}] ${ev.source_agent.replace('_AI','')} — ${ev.summary}`).join('\n')
                          const wa = encodeURIComponent(text)
                          window.open(`https://wa.me/?text=${wa}`, '_blank')
                        }} style={{ padding:'5px 10px', border:'1px solid #3B6D11', borderRadius:6,
                          background:'#EAF3DE', fontSize:11, fontWeight:600, cursor:'pointer',
                          fontFamily:'inherit', color:'#3B6D11', display:'flex', alignItems:'center', gap:4 }}>
                          📤 Compartilhar
                        </button>
                      </div>
                    )}
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
                        {['Projeto','Localização','Progresso','CPI','SPI','Previsto','Realizado','Status','']
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
                          style={{ background: i%2===0 ? '#fff' : '#fafbfd', transition:'background 0.1s',
                            cursor: p.id.startsWith('example-') ? 'default' : 'pointer' }}
                          onClick={() => !p.id.startsWith('example-') && router.push(`/projeto/${p.id}`)}
                          onMouseEnter={e=>(e.currentTarget.style.background='#EFF4FF')}
                          onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfd')}>
                          <td style={{ padding:'11px 14px', fontWeight:500, color:'#1a1f36' }}>
                            <div>{p.name}</div>
                            <div style={{ fontSize:10, color:'#a0a8bb', marginTop:2 }}>{p.code}</div>
                          </td>
                          <td style={{ padding:'11px 14px', color:'#5a6282' }}>
                            {[p.city, p.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:70, height:5, background:'#e5e8f0', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ width:`${p.completion_pct}%`, height:'100%',
                                  background: p.completion_pct>=75 ? '#3B6D11' : p.completion_pct>=40 ? '#185FA5' : '#A32D2D',
                                  borderRadius:3 }}/>
                              </div>
                              <span style={{ fontSize:11, fontWeight:500, color:'#3a4166' }}>{p.completion_pct}%</span>
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
                          <td style={{ padding:'11px 14px', color:'#5a6282' }}>{fmt(p.budget_planned)}</td>
                          <td style={{ padding:'11px 14px', fontWeight:500,
                            color: p.budget_actual > p.budget_planned ? '#A32D2D' : '#3B6D11' }}>
                            {fmt(p.budget_actual)}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20,
                              background: statusColor(p.status)+'18', color: statusColor(p.status) }}>
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            {!p.id.startsWith('example-') && (
                              <button onClick={() => {
                                if (!confirm(`Remover "${p.name}"?`)) return
                                setProjects(prev => {
                                  const updated = prev.filter(x => x.id !== p.id)
                                  try {
                                    const stored = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
                                    localStorage.setItem('atlas_projects', JSON.stringify(stored.filter((x: any) => x.id !== p.id)))
                                  } catch {}
                                  const sb = getSupabase()
                                  if (sb) sb.from('projects').delete().eq('id', p.id).then(() => {})
                                  return updated
                                })
                              }} style={{ background:'none', border:'none', cursor:'pointer',
                                color:'#A32D2D', fontSize:14, padding:'2px 6px', borderRadius:4,
                                opacity: 0.6 }} title="Remover">✕</button>
                            )}
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

      {/* ── MODAL AGENTE IA ── */}
      {aiAgentModal && (() => {
        const AGENTS: Record<string,{icon:string,label:string,color:string,prompt:string}> = {
          bim:   { icon:'🏢', label:'BIM Intelligence', color:'#185FA5',
            prompt:'Você é o BIM_Intelligence_AI. Analise o portfólio de obras e simule uma detecção de clashes BIM. Retorne: 1) Interferências detectadas por disciplina (Estrutural, Hidráulica, Elétrica, HVAC) com quantidades; 2) Severidade (Crítico/Médio/Baixo); 3) Top 3 conflitos prioritários com descrição técnica detalhada; 4) Índice 4D de cronograma e 5D de custo vinculados; 5) Recomendações de resolução. Use dados fictícios realistas de obras brasileiras de médio porte.' },
          evm:   { icon:'📊', label:'EVM Analytics', color:'#534AB7',
            prompt:'Você é o EVM_Analytics_AI. Calcule e analise indicadores de Earned Value Management do portfólio. Mostre: 1) CPI por projeto com interpretação; 2) SPI por projeto; 3) EAC e VAC calculados; 4) TCPI necessário para cumprir budget; 5) Análise da Curva S com pontos de inflexão; 6) Previsão de encerramento. Inclua tabela resumo e análise executiva. Dados reais: projetos com CPI médio 0.94 e SPI 0.91.' },
          nr:    { icon:'🛡', label:'Conformidade NR', color:'#3B6D11',
            prompt:'Você é o NR_Compliance_AI. Realize auditoria de conformidade NR no portfólio. Avalie: 1) NR-18 — itens críticos e status; 2) NR-6 (EPIs) — cobertura por função; 3) NR-10 (Eletricidade) — pontos de risco elétrico; 4) NR-33 (Espaços Confinados); 5) NR-35 (Altura). Para cada: status (Conforme/Parcial/Não conforme), pendências, prazo de regularização e multa estimada. Emita score geral 0-100 e plano de ação.' },
          multi: { icon:'🤖', label:'Multi-Agent AI', color:'#A32D2D',
            prompt:'Você é o MultiAgent_Coordinator. Coordene 8 agentes especializados e produza análise estratégica completa: [Cost_Controller_AI] Desvios de custo e alertas SINAPI; [Construction_Planner_AI] Caminho crítico; [BIM_Intelligence_AI] Clashes; [Legal_Compliance_AI] Conformidade contratual; [ESG_Monitor_AI] Score sustentabilidade; [Risk_Assessment_AI] Matriz de riscos; [Market_Intelligence_AI] Benchmarking; [Finance_Optimizer_AI] Fluxo de caixa. Consolide em relatório executivo com score geral 0-100 e top 5 ações prioritárias.' },
        }
        const ag = AGENTS[aiAgentModal]

        async function runAgent() {
          setAgentRunning(true); setAgentResult('')
          try {
            const res = await fetch('/api/chat', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:2000,
                system: ag.prompt,
                messages:[{ role:'user', content:`Execute análise completa agora para o portfólio de ${projects.length} projetos ativos. Data: ${new Date().toLocaleDateString('pt-BR')}.` }]
              })
            })
            const data = await res.json()
            setAgentResult(data?.content?.[0]?.text || 'Análise concluída.')
          } catch { setAgentResult('Erro ao conectar com o agente.') }
          setAgentRunning(false)
        }

        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',system-ui,sans-serif" }}
            onClick={e => e.target === e.currentTarget && setAiAgentModal(null)}>
            <div style={{ background:'#fff', borderRadius:16, width:700, maxHeight:'88vh',
              display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
              border:'1px solid #e5e8f0', overflow:'hidden' }}>
              {/* header */}
              <div style={{ padding:'16px 22px', borderBottom:'1px solid #e5e8f0',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:`${ag.color}08` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:24 }}>{ag.icon}</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a1f36' }}>{ag.label}</div>
                    <div style={{ fontSize:11, color:'#8b93a7' }}>Agente especializado · AI Construction Platform</div>
                  </div>
                </div>
                <button onClick={() => setAiAgentModal(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#8b93a7' }}>✕</button>
              </div>
              {/* body */}
              <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
                {!agentResult && !agentRunning && (
                  <div style={{ textAlign:'center', padding:'32px 0' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>{ag.icon}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:8 }}>
                      {ag.label} pronto para executar
                    </div>
                    <div style={{ fontSize:12, color:'#8b93a7', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
                      O agente irá analisar seu portfólio de {projects.length} projetos e gerar relatório completo com recomendações.
                    </div>
                    <button onClick={runAgent}
                      style={{ padding:'12px 28px', background:ag.color, color:'#fff', border:'none',
                        borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      ▶ Executar {ag.label}
                    </button>
                  </div>
                )}
                {agentRunning && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:16 }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${ag.color}`,
                      borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <div style={{ fontSize:13, color:ag.color, fontWeight:600 }}>
                      {ag.label} analisando portfólio...
                    </div>
                    <div style={{ fontSize:11, color:'#8b93a7' }}>Processando {projects.length} projetos com IA Claude</div>
                  </div>
                )}
                {agentResult && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#3B6D11' }}>✅ Análise concluída</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { printDocument(ag.label, `<h1>${ag.icon} ${ag.label}</h1><pre style="white-space:pre-wrap;font-family:inherit">${agentResult}</pre>`) }}
                          style={{ padding:'5px 12px', border:'1px solid #e5e8f0', borderRadius:6, background:'#fff',
                            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#5a6282' }}>
                          🖨️ Imprimir
                        </button>
                        <button onClick={runAgent}
                          style={{ padding:'5px 12px', border:`1px solid ${ag.color}`, borderRadius:6, background:'#fff',
                            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:ag.color }}>
                          🔄 Reanalisar
                        </button>
                      </div>
                    </div>
                    <div style={{ background:'#f8f9fc', borderLeft:`3px solid ${ag.color}`, borderRadius:'0 8px 8px 0',
                      padding:'14px 16px', fontSize:12, lineHeight:1.8, color:'#1a1f36',
                      whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
                      {agentResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── VISUALIZADOR DE PLANTAS ── */}
      {showPlantasViewer && (() => {
        const IMAGE_EXTS = ['jpg','jpeg','png','webp','gif','bmp','tiff','tif','svg']
        const SUPPORTED_EXTS = [...IMAGE_EXTS,'pdf','dwg','dxf','dgn','ifc','rvt','dwf','dwfx','fbx','stl','step','stp','obj','sat','gbxml','nwc','nwd']
        const EXT_META: Record<string, {icon:string,cat:string,color:string}> = {
          jpg:   { icon:'🖼️', cat:'Imagem',      color:'#E57E32' },
          jpeg:  { icon:'🖼️', cat:'Imagem',      color:'#E57E32' },
          png:   { icon:'🖼️', cat:'Imagem PNG',  color:'#E57E32' },
          webp:  { icon:'🖼️', cat:'Imagem WebP', color:'#E57E32' },
          gif:   { icon:'🖼️', cat:'Imagem GIF',  color:'#E57E32' },
          bmp:   { icon:'🖼️', cat:'Imagem BMP',  color:'#E57E32' },
          tiff:  { icon:'🖼️', cat:'Imagem TIFF', color:'#E57E32' },
          tif:   { icon:'🖼️', cat:'Imagem TIFF', color:'#E57E32' },
          svg:   { icon:'🖼️', cat:'Imagem SVG',  color:'#E57E32' },
          pdf:   { icon:'📄', cat:'Documento',   color:'#E53E3E' },
          dwg:   { icon:'📐', cat:'CAD',          color:'#185FA5' },
          dxf:   { icon:'📐', cat:'CAD',          color:'#185FA5' },
          dgn:   { icon:'📐', cat:'CAD',          color:'#185FA5' },
          ifc:   { icon:'🏗️', cat:'BIM / IFC',    color:'#3B6D11' },
          rvt:   { icon:'🏗️', cat:'Revit',        color:'#3B6D11' },
          dwf:   { icon:'📦', cat:'DWF',          color:'#8A4E2F' },
          dwfx:  { icon:'📦', cat:'DWFx',         color:'#8A4E2F' },
          fbx:   { icon:'🎲', cat:'3D / FBX',     color:'#6B4EBF' },
          stl:   { icon:'🖨️', cat:'3D / STL',     color:'#6B4EBF' },
          step:  { icon:'🔩', cat:'STEP',         color:'#B45309' },
          stp:   { icon:'🔩', cat:'STEP',         color:'#B45309' },
          obj:   { icon:'🎲', cat:'3D / OBJ',     color:'#6B4EBF' },
          sat:   { icon:'🔷', cat:'SAT / ACIS',   color:'#0E7490' },
          gbxml: { icon:'🌿', cat:'gbXML / MEP',  color:'#15803D' },
          nwc:   { icon:'🔗', cat:'Navisworks',   color:'#7C3AED' },
          nwd:   { icon:'🔗', cat:'Navisworks',   color:'#7C3AED' },
        }
        const THREE_D_EXTS = ['ifc','rvt','dwg','dxf','dgn','dwf','dwfx','fbx','stl','obj','step','stp','sat','gbxml','nwc','nwd']
        const activePf = plantFiles[activePlanta] ?? null
        const isPDF = activePf?.ext === 'pdf'
        const isImage = activePf ? IMAGE_EXTS.includes(activePf.ext) : false
        const is3D = activePf ? THREE_D_EXTS.includes(activePf.ext) : false
        const canAnalyze = activePf ? (isImage || isPDF) : false

        async function autoRunAnalysis(b64: string, mediaType: string, pf: {name:string,ext:string}) {
          setUnifiedLoading(true); setUnifiedAnalysis(''); setViewerTab('analysis')
          const isPDFFile = pf.ext === 'pdf'
          try {
            const res = await fetch('/api/chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'claude-sonnet-4-6', max_tokens: 3000,
                system: `Você é o Atlas BIM Intelligence — sistema integrado de análise de plantas e projetos de construção civil. Você combina análise BIM, quantitativos, memorial descritivo e conformidade normativa em uma única análise completa. Responda sempre em português do Brasil.`,
                messages: [{ role: 'user', content: [
                  { type: isPDFFile ? 'document' : 'image', source: { type: 'base64', media_type: mediaType, data: b64 } } as any,
                  { type: 'text', text: `Analise esta planta/documento "${pf.name}" e gere um relatório técnico completo integrado.

### 1. IDENTIFICAÇÃO DO PROJETO
Tipo de edificação, pavimento, escala, descrição geral, ambientes identificados com áreas estimadas.

### 2. MEMORIAL DESCRITIVO
Descrição técnica completa da obra: fundação, estrutura, alvenaria, cobertura, revestimentos, instalações (hidráulica, elétrica, ar-condicionado), esquadrias, acabamentos. Use linguagem técnica profissional.

### 3. QUANTITATIVO DE SERVIÇOS (ABNT NBR)
| Item | Descrição | Unid | Quantidade | Custo Unit (R$) | Total (R$) |
(liste todos os serviços identificáveis: escavação, concreto, alvenaria, cobertura, revestimento, instalações, pintura, etc.)

### 4. COMPATIBILIZAÇÃO BIM
Conflitos e interferências identificados entre sistemas (estrutural × hidráulico × elétrico). Para cada conflito: localização, disciplinas envolvidas, severidade, solução recomendada.

### 5. CONFORMIDADE NORMATIVA
Verificação de: NBR 9077 (saídas de emergência), NBR 9050 (acessibilidade), NBR 15575 (desempenho), ABNT NBR 6118 (concreto armado). Liste conformidades e não-conformidades.

### 6. DADOS PARA CONTRATO
- Área total construída estimada: ___ m²
- Área do terreno estimada: ___ m²
- Tipo de obra: ___
- Classificação: ___
- Valor estimado da obra: R$ ___
- Prazo estimado de execução: ___ meses` }
                ]}]
              })
            })
            const data = await res.json()
            const text = data?.content?.[0]?.text || 'Análise não disponível.'
            setUnifiedAnalysis(text)
            try {
              localStorage.setItem('atlas_plant_analysis', JSON.stringify({
                fileName: pf.name,
                analysis: text,
                date: new Date().toISOString()
              }))
            } catch {}
          } catch (err: any) {
            setUnifiedAnalysis(`Erro: ${err.message || 'Falha ao conectar. Verifique ANTHROPIC_API_KEY no Vercel.'}`)
          }
          setUnifiedLoading(false)
        }

        async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
          const files = Array.from(e.target.files || [])
          if (!files.length) return
          setPlantUploading(true)
          const newEntries = files.map(f => {
            const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
            return { name: f.name, type: f.type || 'application/octet-stream', url: URL.createObjectURL(f), size: f.size, ext }
          })
          const newIdx = plantFiles.length
          setPlantFiles(prev => [...prev, ...newEntries])
          setActivePlanta(newIdx)
          setPlantUploading(false)
          e.target.value = ''

          const firstNew = files[0]
          const firstExt = firstNew.name.split('.').pop()?.toLowerCase() ?? ''
          const firstEntry = newEntries[0]

          if (THREE_D_EXTS.includes(firstExt)) {
            // Open 3D viewer in new window
            const url = URL.createObjectURL(firstNew)
            try { localStorage.setItem('bim3d_file_url', url); localStorage.setItem('bim3d_file_name', firstNew.name); localStorage.setItem('bim3d_file_ext', firstExt) } catch {}
            window.open(`/bim-3d?name=${encodeURIComponent(firstNew.name)}&ext=${firstExt}`, '_blank', 'width=1400,height=900')
          } else if ([...IMAGE_EXTS, 'pdf'].includes(firstExt)) {
            // Read base64 and auto-trigger AI analysis
            const mediaType = firstNew.type || (firstExt === 'pdf' ? 'application/pdf' : 'image/jpeg')
            const b64 = await new Promise<string>((res, rej) => {
              const r = new FileReader()
              r.onload = () => res((r.result as string).split(',')[1])
              r.onerror = rej
              r.readAsDataURL(firstNew)
            })
            setActivePfB64(b64)
            setActivePfMediaType(mediaType)
            setUnifiedAnalysis('')
            // Auto-trigger analysis immediately, passing data directly (no state lag)
            await autoRunAnalysis(b64, mediaType, firstEntry)
          } else {
            setActivePfB64(null)
          }
        }

        function runUnifiedAnalysis() {
          if (!activePfB64 || !activePf) return
          autoRunAnalysis(activePfB64, activePfMediaType, activePf)
        }

        function removeFile(idx: number) {
          setPlantFiles(prev => {
            URL.revokeObjectURL(prev[idx].url)
            const next = prev.filter((_,i) => i !== idx)
            setActivePlanta(Math.max(0, Math.min(activePlanta, next.length - 1)))
            return next
          })
        }

        function fmtSize(b: number) {
          if (b < 1024) return b + ' B'
          if (b < 1048576) return (b/1024).toFixed(1) + ' KB'
          return (b/1048576).toFixed(1) + ' MB'
        }

        return createPortal(
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0,
            background:'#fff', zIndex:2147483647,
            display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ padding:'14px 20px', background:'#f8f9fc', borderBottom:'1px solid #e5e8f0',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36' }}>
                  🏗️ Visualizador de Plantas e Arquivos BIM / CAD
                </div>
                <div style={{ fontSize:11, color:'#8890a0', marginTop:2 }}>
                  PDF · DWG · DXF · DGN · IFC · RVT · DWF · FBX · STL · STEP · OBJ · SAT · gbXML · Navisworks
                </div>
              </div>
              <button onClick={() => setShowPlantasViewer(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer',
                  color:'#8890a0', lineHeight:1, padding:'4px 8px' }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', flex:1, overflow:'hidden' }}>

              {/* Sidebar — lista de arquivos */}
              <div style={{ borderRight:'1px solid #e5e8f0', display:'flex', flexDirection:'column',
                background:'#fafafa', overflow:'hidden' }}>

                {/* Upload button */}
                <label style={{ margin:'12px', display:'block', cursor:'pointer' }}>
                  <input type="file" multiple style={{ display:'none' }}
                    accept="image/*,.pdf,.dwg,.dxf,.dgn,.ifc,.rvt,.dwf,.dwfx,.fbx,.stl,.step,.stp,.obj,.sat,.gbxml,.nwc,.nwd"
                    onChange={handleFileInput} />
                  <div style={{ padding:'9px 14px', background:'#185FA5', borderRadius:8,
                    color:'#fff', fontSize:12, fontWeight:600, textAlign:'center',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    opacity: plantUploading ? 0.65 : 1 }}>
                    {plantUploading ? '⏳ Carregando...' : '📂 Abrir arquivo(s)'}
                  </div>
                </label>

                {/* File list */}
                <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px' }}>
                  {plantFiles.length === 0 ? (
                    <div style={{ padding:'24px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
                      <div style={{ fontSize:11, color:'#8890a0', lineHeight:1.5 }}>
                        Nenhum arquivo.<br/>Clique em "Abrir arquivo(s)"<br/>para carregar plantas.
                      </div>
                      <div style={{ marginTop:16, fontSize:10, color:'#aab0c0', lineHeight:1.6 }}>
                        Formatos suportados:<br/>
                        PDF · DWG · DXF · DGN<br/>
                        IFC · RVT · DWF · DWFx<br/>
                        FBX · STL · STEP · OBJ<br/>
                        SAT · gbXML · NWC · NWD
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {plantFiles.map((pf, i) => {
                        const m = EXT_META[pf.ext] ?? { icon:'📎', cat:'Arquivo', color:'#5a6282' }
                        return (
                          <div key={i}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px',
                              borderRadius:8, cursor:'pointer', transition:'all .12s', position:'relative',
                              background: activePlanta===i ? '#EFF4FF' : 'transparent',
                              border: activePlanta===i ? '1px solid #b8cdff' : '1px solid transparent' }}
                            onClick={() => setActivePlanta(i)}>
                            <div style={{ width:32, height:32, borderRadius:6, flexShrink:0,
                              background: m.color+'18', display:'flex', alignItems:'center',
                              justifyContent:'center', fontSize:16 }}>{m.icon}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:11, fontWeight:600, color: activePlanta===i ? '#185FA5' : '#1a1f36',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pf.name}</div>
                              <div style={{ fontSize:10, color:'#8890a0' }}>{m.cat} · {fmtSize(pf.size)}</div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); removeFile(i) }}
                              title="Remover"
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc',
                                fontSize:14, padding:'2px 4px', flexShrink:0, lineHeight:1 }}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Formats legend */}
                <div style={{ padding:'12px', borderTop:'1px solid #e5e8f0', background:'#fff' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#8890a0', textTransform:'uppercase',
                    letterSpacing:'.1em', marginBottom:8 }}>Categorias</div>
                  {[
                    { color:'#E53E3E', label:'PDF / Documentos' },
                    { color:'#185FA5', label:'CAD (DWG, DXF, DGN)' },
                    { color:'#3B6D11', label:'BIM (IFC, RVT)' },
                    { color:'#6B4EBF', label:'3D (FBX, STL, OBJ)' },
                    { color:'#B45309', label:'Intercâmbio (STEP, SAT)' },
                    { color:'#15803D', label:'gbXML / MEP' },
                  ].map(c => (
                    <div key={c.label} style={{ display:'flex', alignItems:'center', gap:6,
                      fontSize:10, color:'#5a6282', marginBottom:4 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:c.color, flexShrink:0 }} />
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main viewer area */}
              <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e8f0', flexShrink:0,
                  display:'flex', alignItems:'center', gap:8, background:'#fff', flexWrap:'wrap' as const }}>
                  {/* Tabs */}
                  <button onClick={() => setViewerTab('viewer')}
                    style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                      background: viewerTab==='viewer' ? '#185FA5' : '#f0f4f8',
                      color: viewerTab==='viewer' ? '#fff' : '#5a6282', border:'none', fontFamily:'inherit' }}>
                    👁️ Visualizar
                  </button>
                  <button onClick={() => setViewerTab('humanize')}
                    style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                      background: viewerTab==='humanize' ? '#534AB7' : '#f0f4f8',
                      color: viewerTab==='humanize' ? '#fff' : '#5a6282', border:'none', fontFamily:'inherit' }}>
                    🎨 Humanizar
                  </button>
                  {canAnalyze && (
                    <button onClick={runUnifiedAnalysis}
                      disabled={unifiedLoading}
                      style={{ padding:'5px 14px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
                        background: viewerTab==='analysis' ? '#3B6D11' : '#EAF3DE',
                        color: viewerTab==='analysis' ? '#fff' : '#3B6D11', border:'1px solid #97C459', fontFamily:'inherit',
                        opacity: unifiedLoading ? 0.7 : 1 }}>
                      {unifiedLoading ? '⏳ Analisando com IA...' : '🤖 Analisar Tudo (BIM + Memorial + Quantitativo)'}
                    </button>
                  )}
                  {is3D && activePf && (
                    <button onClick={() => {
                      try { localStorage.setItem('bim3d_file_url', activePf.url); localStorage.setItem('bim3d_file_name', activePf.name); localStorage.setItem('bim3d_file_ext', activePf.ext) } catch {}
                      window.open(`/bim-3d?name=${encodeURIComponent(activePf.name)}&ext=${activePf.ext}`, '_blank', 'width=1400,height=900')
                    }}
                      style={{ padding:'5px 14px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
                        background:'#534AB7', color:'#fff', border:'none', fontFamily:'inherit' }}>
                      🎲 Abrir Viewer 3D
                    </button>
                  )}
                  <div style={{ width:1, height:20, background:'#e5e8f0', margin:'0 4px' }} />
                  {activePf && isPDF && viewerTab==='viewer' && (
                    <>
                      <button onClick={() => {
                        const iframe = document.querySelector('iframe[title="' + activePf.name + '"]') as HTMLIFrameElement | null
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.focus()
                          iframe.contentWindow.print()
                        } else {
                          window.open(activePf.url, '_blank')
                        }
                      }} style={{ padding:'5px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                        background:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit', color:'#5a6282' }}>
                        🖨️ Imprimir
                      </button>
                      <a href={activePf.url} download={activePf.name}
                        style={{ padding:'5px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                          background:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit',
                          color:'#5a6282', textDecoration:'none' }}>
                        ⬇️ Baixar
                      </a>
                    </>
                  )}
                  {activePf && !isPDF && viewerTab==='viewer' && (
                    <a href={activePf.url} download={activePf.name}
                      style={{ padding:'6px 14px', border:'none', borderRadius:6,
                        background:'#185FA5', fontSize:11, fontWeight:600, cursor:'pointer',
                        fontFamily:'inherit', color:'#fff', textDecoration:'none',
                        display:'flex', alignItems:'center', gap:5 }}>
                      ⬇️ Baixar {activePf.name}
                    </a>
                  )}
                  {activePf && (
                    <div style={{ marginLeft:'auto', fontSize:11, color:'#8890a0' }}>
                      {(EXT_META[activePf.ext] ?? { cat:'Arquivo' }).cat} · {fmtSize(activePf.size)}
                    </div>
                  )}
                </div>

                {/* Humanize Panel */}
                {viewerTab === 'humanize' && (
                  <div style={{ flex:1, overflow:'auto', background:'#f8f9fc', display:'grid',
                    gridTemplateColumns:'340px 1fr', gap:0 }}>
                    {/* Left controls */}
                    <div style={{ borderRight:'1px solid #e5e8f0', padding:'20px 18px', display:'flex',
                      flexDirection:'column' as const, gap:14, overflowY:'auto' as const, background:'#fff' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#185FA5', marginBottom:4 }}>
                        🤖 Humanizador de Plantas Baixas
                      </div>
                      <div style={{ fontSize:11, color:'#8890a0', lineHeight:1.5 }}>
                        Envie uma imagem da planta baixa. A IA analisa ambientes, distribui pessoas e gera prompts DALL-E / Midjourney prontos.
                      </div>

                      {/* Image upload */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                          letterSpacing:'.08em', marginBottom:8 }}>Imagem da Planta</div>
                        {humanB64 ? (
                          <div style={{ position:'relative', borderRadius:8, overflow:'hidden', border:'1px solid #e5e8f0' }}>
                            <img src={`data:${humanImgType};base64,${humanB64}`} alt="Planta"
                              style={{ width:'100%', maxHeight:160, objectFit:'contain', display:'block', padding:4 }} />
                            <button onClick={() => setHumanB64(null)}
                              style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.6)',
                                color:'#fff', border:'none', borderRadius:4, fontSize:10, padding:'3px 7px', cursor:'pointer' }}>
                              ✕ Remover
                            </button>
                          </div>
                        ) : (
                          <label style={{ cursor:'pointer', display:'block' }}>
                            <input type="file" accept="image/*,.pdf,.dwg,.dxf,.dgn,.ifc,.rvt" style={{ display:'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                const isPDFFile = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
                                const mt = isPDFFile ? 'application/pdf'
                                  : ['image/jpeg','image/png','image/gif','image/webp'].includes(f.type) ? f.type
                                  : f.type.startsWith('image/') ? f.type : 'image/jpeg'
                                setHumanImgType(mt)
                                const rd = new FileReader()
                                rd.onload = ev => setHumanB64((ev.target?.result as string).split(',')[1])
                                rd.readAsDataURL(f)
                              }} />
                            <div style={{ border:'1.5px dashed #d0d5e0', borderRadius:8, padding:'24px 12px',
                              textAlign:'center' as const, background:'#fafafa', transition:'all .2s' }}>
                              <div style={{ fontSize:28, marginBottom:6 }}>📐</div>
                              <div style={{ fontSize:12, fontWeight:500, color:'#1a1f36', marginBottom:3 }}>
                                Arraste ou clique para enviar
                              </div>
                              <div style={{ fontSize:11, color:'#8890a0' }}>JPG · PNG · PDF · DWG · IFC · qualquer formato</div>
                            </div>
                          </label>
                        )}
                      </div>

                      {/* Controls */}
                      {[
                        { lbl:'Tipo de edificação', id:'humanTipo', val:humanTipo, set:setHumanTipo, opts:[
                          ['residencial unifamiliar','🏠 Residencial — casa'],
                          ['apartamento residencial','🏢 Residencial — apartamento'],
                          ['escritório comercial','💼 Escritório / Comercial'],
                          ['loja de varejo','🛍️ Loja / Varejo'],
                          ['café ou restaurante','☕ Café / Restaurante'],
                          ['clínica ou consultório','🏥 Clínica / Consultório'],
                        ]},
                        { lbl:'Estilo de renderização', id:'humanEstilo', val:humanEstilo, set:setHumanEstilo, opts:[
                          ['photorealistic professional architectural','Fotorrealista profissional'],
                          ['high-end architectural visualization','Alta renderização arquitetônica'],
                          ['watercolor artistic architectural','Aquarela / Artístico'],
                          ['technical axonometric','Técnico / Axonométrico'],
                        ]},
                        { lbl:'Tipo de lote / entorno', id:'humanLote', val:humanLote, set:setHumanLote, opts:[
                          ['standard rectangular urban lot with sidewalk and street trees','Lote retangular — urbano padrão'],
                          ['corner lot with two street frontages, sidewalks and urban trees','Lote de esquina — duas frentes'],
                          ['rural lot with natural landscape, grass, trees and open sky','Lote rural — paisagem natural'],
                          ['condominium lot surrounded by common areas, gardens and other units','Lote em condomínio'],
                        ]},
                        { lbl:'Vegetação / Paisagismo', id:'humanVeg', val:humanVeg, set:setHumanVeg, opts:[
                          ['imperial palm trees, tropical shrubs, bromeliads, ornamental grasses, dense tropical foliage','🌴 Tropical — palmeiras imperiais'],
                          ['mediterranean trees, lavender, olive trees, bougainvillea, stone pathways','🫒 Mediterrâneo — oliveiras'],
                          ['minimalist landscaping, ornamental grasses, pebbles, architectural plants','⬜ Minimalista — gramas ornamentais'],
                          ['native Brazilian cerrado vegetation, small trees, dry grass','🌵 Cerrado brasileiro'],
                        ]},
                      ].map(ctrl => (
                        <div key={ctrl.id}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                            letterSpacing:'.08em', marginBottom:5 }}>{ctrl.lbl}</div>
                          <select value={ctrl.val} onChange={e => ctrl.set(e.target.value)}
                            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                              fontSize:12, background:'#f8f9fc', color:'#1a1f36', fontFamily:'inherit', outline:'none' }}>
                            {ctrl.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      ))}

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                            letterSpacing:'.08em', marginBottom:5 }}>Escala</div>
                          <select value={humanEscala} onChange={e => setHumanEscala(e.target.value)}
                            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                              fontSize:12, background:'#f8f9fc', color:'#1a1f36', fontFamily:'inherit', outline:'none' }}>
                            {[['25','1 : 25'],['50','1 : 50'],['100','1 : 100'],['200','1 : 200']].map(([v,l]) =>
                              <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                            letterSpacing:'.08em', marginBottom:5 }}>Nº de pessoas</div>
                          <input type="number" value={humanNP} min={1} max={20}
                            onChange={e => setHumanNP(Number(e.target.value))}
                            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                              fontSize:12, background:'#f8f9fc', color:'#1a1f36', fontFamily:'inherit', outline:'none' }} />
                        </div>
                      </div>

                      {/* Scale info */}
                      <div style={{ background:'#EFF4FF', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#185FA5' }}>
                        📏 Escala 1:{humanEscala} — figura 1,70 m = <strong>{((1.70/parseInt(humanEscala))*100).toFixed(2)} cm</strong> na planta
                      </div>

                      <button
                        disabled={!humanB64 || humanLoading}
                        onClick={async () => {
                          if (!humanB64) return
                          setHumanLoading(true)
                          setHumanResult({})
                          const cmFig = ((1.70/parseInt(humanEscala))*100).toFixed(2)
                          const prompt = `Você é especialista em visualização arquitetônica. Analise esta planta baixa de uma edificação do tipo "${humanTipo}" e gere uma análise completa em português.

PARÂMETROS:
- Escala: 1:${humanEscala}
- Figuras humanas: 1,70 m (= ${cmFig} cm na planta)
- Número de pessoas: ${humanNP}
- Estilo: ${humanEstilo}
- Lote: ${humanLote}
- Vegetação: ${humanVeg}

RETORNE EXATAMENTE neste formato markdown:

### ANÁLISE
[Tipo identificado, lista de ambientes com áreas estimadas, total aproximado]

### AMBIENTES E PESSOAS
[Distribua as ${humanNP} pessoas pelos ambientes: Ambiente | Pessoas | Atividade]

### PROMPT DALL-E
[Prompt completo em inglês ultra-detalhado para DALL-E/GPT-4o. Incluir lote: ${humanLote}, vegetação: ${humanVeg}, ${humanNP} figuras de 1,70m com atividades específicas, estilo ${humanEstilo}, escala 1:${humanEscala}]

### PROMPT MIDJOURNEY
[Versão compacta para /imagine com --ar 4:3 --quality 2 --style raw --v 6]

### PASSOS REVIT
[5 passos com famílias RPC, configuração 1700mm e renderização para esta planta]`

                          try {
                            const r = await fetch('/api/chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                model: 'claude-sonnet-4-6',
                                max_tokens: 1500,
                                messages: [{
                                  role: 'user',
                                  content: [
                                    { type: humanImgType === 'application/pdf' ? 'document' : 'image',
                                      source:{ type:'base64', media_type: humanImgType, data: humanB64 } } as any,
                                    { type:'text', text: prompt }
                                  ]
                                }]
                              })
                            })
                            const d = await r.json()
                            const txt = d.content?.[0]?.text || ''
                            const secs: Record<string,string> = {}
                            const rx = /###\s+([A-ZÇÁÉÍÓÚ\s\/E]+)\n([\s\S]*?)(?=###|$)/g
                            let m
                            while ((m = rx.exec(txt)) !== null) secs[m[1].trim()] = m[2].trim()
                            if (!Object.keys(secs).length) secs['RESULTADO'] = txt
                            setHumanResult(secs)
                          } catch (err: any) {
                            setHumanResult({ 'ERRO': err?.message || 'Falha na análise.' })
                          }
                          setHumanLoading(false)
                        }}
                        style={{ padding:'12px', background: humanB64 ? '#534AB7' : '#ccc',
                          color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                          cursor: humanB64 ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        {humanLoading ? '⏳ Analisando...' : '✨ Gerar Análise e Prompts'}
                      </button>
                    </div>

                    {/* Right results */}
                    <div style={{ padding:'20px', overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:14 }}>
                      {humanLoading && (
                        <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center',
                          justifyContent:'center', gap:14, padding:48, color:'#8890a0' }}>
                          <div style={{ width:36, height:36, border:'3px solid #e5e8f0', borderTopColor:'#534AB7',
                            borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                          <div style={{ fontSize:13 }}>Analisando planta com IA...</div>
                          <div style={{ fontSize:11, color:'#b0b8cc' }}>Identificando ambientes e calculando escala 1,70 m</div>
                        </div>
                      )}
                      {!humanLoading && Object.keys(humanResult).length === 0 && (
                        <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center',
                          justifyContent:'center', gap:14, padding:48, color:'#8890a0', textAlign:'center' as const }}>
                          <div style={{ fontSize:48 }}>🏛️</div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36' }}>Aguardando planta baixa</div>
                          <div style={{ fontSize:12, maxWidth:280, lineHeight:1.6 }}>
                            Envie uma imagem da planta e clique em "Gerar Análise e Prompts"
                          </div>
                          <div style={{ background:'#f8f9fc', border:'1px solid #e5e8f0', borderRadius:8, padding:'12px 16px', fontSize:11, color:'#5a6282' }}>
                            <div style={{ fontWeight:700, marginBottom:6 }}>Escala de referência (1,70 m)</div>
                            {[['1:25','6,8 cm'],['1:50','3,4 cm'],['1:100','1,7 cm'],['1:200','0,85 cm']].map(([s,v]) => (
                              <div key={s} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0',
                                borderBottom:'1px solid #e5e8f0' }}>
                                <span>{s}</span><span style={{ color:'#3B6D11', fontWeight:600 }}>{v} na planta</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!humanLoading && Object.keys(humanResult).map(key => {
                        const val = humanResult[key]
                        const isPrompt = key.includes('DALL') || key.includes('MIDJOURNEY') || key.includes('PROMPT')
                        const promptId = `hprompt-${key.replace(/\s/g,'')}`
                        return (
                          <div key={key} style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, overflow:'hidden' }}>
                            <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e8f0', background:'#f8f9fc',
                              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36' }}>
                                {key.includes('ANÁLISE') ? '📊' : key.includes('AMBIENTES') ? '🚶' : key.includes('DALL') ? '🎨' : key.includes('MIDJOURNEY') ? '🎭' : key.includes('REVIT') ? '🏗️' : '📋'} {key}
                              </div>
                              {isPrompt && (
                                <button id={`btn-${promptId}`}
                                  onClick={() => {
                                    navigator.clipboard.writeText(val)
                                    const btn = document.getElementById(`btn-${promptId}`)
                                    if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(() => { if(btn) btn.textContent = '📋 Copiar' }, 2000) }
                                  }}
                                  style={{ fontSize:10, padding:'3px 9px', background:'#fff', border:'1px solid #e5e8f0',
                                    borderRadius:5, cursor:'pointer', color:'#5a6282', fontFamily:'inherit' }}>
                                  📋 Copiar
                                </button>
                              )}
                            </div>
                            <div style={{ padding:'14px 16px' }}>
                              {isPrompt ? (
                                <div id={promptId} style={{ background:'#f8f9fc', border:'1px solid #e5e8f0', borderRadius:6,
                                  padding:'10px 12px', fontFamily:'monospace', fontSize:11, lineHeight:1.8,
                                  color:'#1a1f36', whiteSpace:'pre-wrap' as const }}>
                                  {val}
                                </div>
                              ) : (
                                <div style={{ fontSize:12, lineHeight:1.75, color:'#5a6282',
                                  whiteSpace:'pre-wrap' as const }}
                                  dangerouslySetInnerHTML={{ __html: val
                                    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
                                    .replace(/^[-•]\s+(.+)$/gm,'<div style="padding:2px 0 2px 12px;border-left:2px solid #e5e8f0">$1</div>')
                                    .replace(/\n/g,'<br/>') }} />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Viewer canvas */}
                {viewerTab === 'viewer' && (
                <div style={{ flex:1, overflow:'hidden', background:'#1a1a2e', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {!activePf ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                      <div style={{ fontSize:56 }}>🏗️</div>
                      <div style={{ fontSize:15, fontWeight:600, color:'#e0e4f0' }}>Nenhum arquivo selecionado</div>
                      <div style={{ fontSize:12, color:'#8890a0', textAlign:'center' as const, maxWidth:320, lineHeight:1.6 }}>
                        Clique em <strong style={{ color:'#58a6ff' }}>"📂 Abrir arquivo(s)"</strong> na lateral para carregar uma planta.
                      </div>
                      <div style={{ fontSize:10, color:'#8890a0', textAlign:'center' as const, lineHeight:1.8, marginTop:8 }}>
                        🖼️ Imagens (JPG · PNG · WebP) · 📄 PDF<br/>
                        📐 CAD (DWG · DXF · DGN) · 🏗️ BIM (IFC · RVT)<br/>
                        📦 DWF · 🎲 FBX · STL · OBJ · STEP · SAT · gbXML · NWC/NWD
                      </div>
                    </div>
                  ) : isPDF ? (
                    <iframe src={activePf.url} title={activePf.name}
                      style={{ width:'100%', height:'100%', border:'none', display:'block' }} />
                  ) : isImage ? (
                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'#1a1a2e' }}>
                      <img src={activePf.url} alt={activePf.name}
                        style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:6,
                          boxShadow:'0 8px 32px rgba(0,0,0,.6)' }} />
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
                      <div style={{ fontSize:64 }}>{(EXT_META[activePf.ext] ?? { icon:'📎' }).icon}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#e0e4f0', textAlign:'center' as const }}>{activePf.name}</div>
                      <div style={{ fontSize:12, color:'#8890a0', textAlign:'center' as const, lineHeight:1.6 }}>
                        Formato <strong style={{ color:'#58a6ff' }}>.{activePf.ext.toUpperCase()}</strong> — {(EXT_META[activePf.ext] ?? { cat:'Arquivo' }).cat}
                        <br/>Tamanho: {fmtSize(activePf.size)}
                        <br/><br/>
                        Este formato requer software CAD para renderização 3D.<br/>
                        Exporte como PDF ou JPG no AutoCAD/Revit para visualizar aqui.
                      </div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, justifyContent:'center' }}>
                        <a href={activePf.url} download={activePf.name}
                          style={{ padding:'10px 22px', background:'#185FA5', color:'#fff', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                          ⬇️ Baixar {activePf.name}
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Overlay: Analisar Tudo button when file loaded */}
                  {canAnalyze && !unifiedLoading && !unifiedAnalysis && (
                    <button onClick={runUnifiedAnalysis}
                      style={{ position:'absolute', bottom:24, right:24,
                        padding:'12px 22px', background:'#3B6D11', color:'#fff', border:'none',
                        borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer',
                        fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,0,0,.4)',
                        display:'flex', alignItems:'center', gap:8 }}>
                      🤖 Analisar Tudo — BIM + Memorial + Quantitativo
                    </button>
                  )}
                </div>
                )}

                {/* Analysis result tab */}
                {viewerTab === 'analysis' && (
                  <div style={{ flex:1, overflowY:'auto' as const, padding:24, background:'#f8f9fc' }}>
                    {unifiedLoading ? (
                      <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', gap:16, padding:60 }}>
                        <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #e5e8f0', borderTopColor:'#3B6D11', animation:'spin .7s linear infinite' }} />
                        <div style={{ fontSize:14, fontWeight:600, color:'#185FA5' }}>Atlas BIM Intelligence analisando...</div>
                        <div style={{ fontSize:12, color:'#8890a0' }}>Gerando Memorial Descritivo · Quantitativo · BIM · Conformidade NBR</div>
                      </div>
                    ) : unifiedAnalysis ? (
                      <>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                          <div>
                            <div style={{ fontSize:16, fontWeight:700, color:'#1a1f36' }}>📊 Análise Completa — {activePf?.name}</div>
                            <div style={{ fontSize:11, color:'#8890a0', marginTop:2 }}>Memorial Descritivo · Quantitativo · BIM · Conformidade · Dados para Contrato</div>
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => window.open('/juridico', '_self')}
                              style={{ padding:'7px 14px', background:'#534AB7', color:'#fff', border:'none', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              ⚖️ Usar no Jurídico
                            </button>
                          </div>
                        </div>
                        <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'18px 20px',
                          fontSize:12, lineHeight:1.9, color:'#1a1f36', whiteSpace:'pre-wrap' as const, fontFamily:'monospace' }}>
                          {unifiedAnalysis}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign:'center' as const, padding:60, color:'#8890a0' }}>
                        <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
                        <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:8 }}>Análise não iniciada</div>
                        <div style={{ fontSize:12 }}>Carregue uma imagem ou PDF e clique em "Analisar Tudo"</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
        </div>,
        document.body)
      })()}

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={(proj) => {
        setProjects(prev => {
          const filtered = prev.filter(p => p.id.startsWith('example-'))
          return [proj, ...(filtered.length === prev.length ? [] : prev.filter(p => !p.id.startsWith('example-')))]
        })
        setShowNewProject(false)
      }} />}
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} onCreated={loadData} />}
      <HelpButton />
    </>
  )
}
