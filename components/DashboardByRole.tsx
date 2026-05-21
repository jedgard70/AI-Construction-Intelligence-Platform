'use client'
import HelpButton from './HelpButton'
import NewProjectModal from './NewProjectModal'
import NewClientModal from './NewClientModal'
import { printDocument } from './PrintShareModal'
import dynamic from 'next/dynamic'
import React, { useEffect, useState, useCallback } from 'react'
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
  const [humanAnaliseTipo, setHumanAnaliseTipo] = useState<'planta'|'fachada'|'corte'|'interior'>('planta')
  const [humanLang, setHumanLang] = useState<'pt-BR'|'en-US'>('pt-BR')
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
  const [humanTab, setHumanTab] = useState<'analise'|'render'|'palette'|'marketing'|'assistant'>('analise')
  const [geminiRenderB64, setGeminiRenderB64] = useState<string|null>(null)
  const [geminiRenderLoading, setGeminiRenderLoading] = useState(false)
  const [geminiRenderError, setGeminiRenderError] = useState<string|null>(null)
  const [pollinationsUrl, setPollinationsUrl] = useState<string|null>(null)
  const [geminiPalette, setGeminiPalette] = useState<Array<{name:string,hex:string,usage:string}>>([])
  const [geminiMarketing, setGeminiMarketing] = useState<string>('')
  const [geminiPaletteLoading, setGeminiPaletteLoading] = useState(false)
  const [geminiMarketingLoading, setGeminiMarketingLoading] = useState(false)
  const [geminiPaletteError, setGeminiPaletteError] = useState<string|null>(null)
  const [geminiMarketingError, setGeminiMarketingError] = useState<string|null>(null)
  const [humanGallery, setHumanGallery] = useState<Array<{id:string,type:'planta'|'render',b64:string,mime:string,label:string,createdAt:number}>>([])
  const [galleryLoaded, setGalleryLoaded] = useState(false)
  const [geminiVariants, setGeminiVariants] = useState<Record<string, string|null>>({})
  const [variantsLoading, setVariantsLoading] = useState<Record<string, boolean>>({})
  const [reelGenerating, setReelGenerating] = useState(false)
  const [reelVideoUrl, setReelVideoUrl] = useState<string|null>(null)
  const [reelEffect, setReelEffect] = useState<string>('auto')
  const [reelNarration, setReelNarration] = useState<string>('')
  const [reelNarrationLoading, setReelNarrationLoading] = useState(false)
  const [reelAudioB64, setReelAudioB64] = useState<string|null>(null)
  const [humanAssistantMsgs, setHumanAssistantMsgs] = useState<Array<{role:'user'|'assistant',text:string}>>([])
  const [humanAssistantInput, setHumanAssistantInput] = useState('')
  const [humanAssistantLoading, setHumanAssistantLoading] = useState(false)
  const [unifiedAnalysis, setUnifiedAnalysis] = useState('')
  const [unifiedLoading, setUnifiedLoading] = useState(false)
  const [activePfB64, setActivePfB64] = useState<string|null>(null)

  // Load gallery from localStorage once
  React.useEffect(() => {
    if (galleryLoaded) return
    try {
      const saved = localStorage.getItem('acip_humanizer_gallery')
      if (saved) setHumanGallery(JSON.parse(saved))
    } catch {}
    setGalleryLoaded(true)
  }, [galleryLoaded])
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
        @keyframes kenburns { from { transform: scale(1.05); } to { transform: scale(1.5) translateY(-8%); } }
        .reel-kenburns { animation: kenburns 18s linear forwards; }
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
          setUnifiedLoading(true); setUnifiedAnalysis('')
          // Stay on viewer tab so the file remains visible while AI runs
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

            <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gridTemplateRows:'1fr', flex:1, overflow:'hidden', minHeight:0 }}>

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
              <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
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
                    <button
                      disabled={unifiedLoading}
                      onClick={() => {
                        if (unifiedAnalysis) { setViewerTab('analysis') }
                        else { runUnifiedAnalysis() }
                      }}
                      style={{ padding:'5px 14px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
                        background: unifiedLoading ? '#8a9a70' : unifiedAnalysis ? '#3B6D11' : '#EAF3DE',
                        color: (unifiedLoading || unifiedAnalysis) ? '#fff' : '#3B6D11',
                        border:'1px solid #97C459', fontFamily:'inherit', position:'relative' as const }}>
                      {unifiedLoading ? '⏳ Analisando...' : unifiedAnalysis ? '📊 Ver Análise (pronta)' : '🤖 Analisar Tudo'}
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
                  <div style={{ flex:1, overflow:'hidden', background:'#f8f9fc', display:'grid',
                    gridTemplateColumns:'340px 1fr', gridTemplateRows:'1fr', gap:0, minHeight:0 }}>
                    {/* Left controls */}
                    <div style={{ borderRight:'1px solid #e5e8f0', display:'flex',
                      flexDirection:'column' as const, overflowY:'auto' as const, background:'#fff', minHeight:0 }}>

                      {/* Studio 3D Header */}
                      <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', padding:'14px 18px',
                        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, background:'#3b82f6', borderRadius:8,
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                            🏗️
                          </div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>Studio 3D</div>
                            <div style={{ fontSize:10, color:'#94a3b8' }}>Plantas, Fachadas e Vídeos com IA</div>
                          </div>
                        </div>
                        {/* Language toggle */}
                        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid #334155' }}>
                          {(['pt-BR','en-US'] as const).map(l => (
                            <button key={l} onClick={() => setHumanLang(l)}
                              style={{ padding:'4px 8px', border:'none', cursor:'pointer', fontSize:10, fontWeight:600,
                                background: humanLang === l ? '#3b82f6' : 'transparent',
                                color: humanLang === l ? '#fff' : '#94a3b8', fontFamily:'inherit' }}>
                              {l === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gallery strip */}
                      {humanGallery.length > 0 && (
                        <div style={{ padding:'8px 12px', borderBottom:'1px solid #e5e8f0', flexShrink:0 }}>
                          <div style={{ fontSize:10, fontWeight:600, color:'#8890a0', marginBottom:6 }}>
                            📁 Galeria ({humanGallery.length})
                          </div>
                          <div style={{ display:'flex', gap:6, overflowX:'auto' as const, paddingBottom:4 }}>
                            {humanGallery.map(item => (
                              <div key={item.id}
                                title={`${item.type === 'planta' ? '📐 Planta' : '🎨 Render'}: ${item.label}`}
                                onClick={() => {
                                  if (item.type === 'planta') {
                                    setHumanB64(item.b64)
                                    setHumanImgType(item.mime)
                                  } else {
                                    setGeminiRenderB64(item.b64)
                                    setHumanTab('render')
                                  }
                                }}
                                style={{ flexShrink:0, position:'relative' as const, width:52, height:52, cursor:'pointer',
                                  borderRadius:6, overflow:'hidden', border:'2px solid #e5e8f0',
                                  transition:'border-color .15s' }}>
                                <img src={`data:${item.mime};base64,${item.b64}`} alt={item.label}
                                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                  onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                                <div style={{ position:'absolute' as const, bottom:0, left:0, right:0,
                                  background:'rgba(0,0,0,.55)', fontSize:8, color:'#fff', textAlign:'center', padding:'1px 0' }}>
                                  {item.type === 'planta' ? '📐' : '🎨'}
                                </div>
                              </div>
                            ))}
                            <button onClick={() => {
                              if (!confirm('Limpar galeria?')) return
                              localStorage.removeItem('acip_humanizer_gallery')
                              setHumanGallery([])
                            }} title="Limpar galeria"
                              style={{ flexShrink:0, width:52, height:52, border:'1px dashed #e5e8f0', background:'#f8f9fc',
                                borderRadius:6, cursor:'pointer', fontSize:16, color:'#b0b8cc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Image upload + preview */}
                      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column' as const, gap:14 }}>

                      {/* Tipo de imagem */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                          letterSpacing:'.08em', marginBottom:8 }}>
                          {humanLang === 'pt-BR' ? '1 — Tipo de imagem' : '1 — Image type'}
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          {([
                            ['planta', '📐', humanLang==='pt-BR'?'Planta Baixa':'Floor Plan'],
                            ['fachada', '🏢', humanLang==='pt-BR'?'Fachada':'Facade'],
                            ['corte', '✂️', humanLang==='pt-BR'?'Corte/Seção':'Section'],
                            ['interior', '🏠', humanLang==='pt-BR'?'Interior 3D':'Interior 3D'],
                          ] as const).map(([v, ic, lbl]) => (
                            <button key={v} onClick={() => setHumanAnaliseTipo(v)}
                              style={{ padding:'8px 6px', border:`1.5px solid ${humanAnaliseTipo===v?'#3b82f6':'#e5e8f0'}`,
                                borderRadius:8, background: humanAnaliseTipo===v ? '#eff6ff' : '#fafafa',
                                cursor:'pointer', fontFamily:'inherit', textAlign:'center' as const,
                                display:'flex', flexDirection:'column' as const, alignItems:'center', gap:4 }}>
                              <span style={{ fontSize:18 }}>{ic}</span>
                              <span style={{ fontSize:10, fontWeight:600, color: humanAnaliseTipo===v ? '#3b82f6' : '#5a6282' }}>{lbl}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image upload */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                          letterSpacing:'.08em', marginBottom:8 }}>
                          {humanLang === 'pt-BR' ? '2 — Projeto 2D' : '2 — 2D Project'}
                        </div>
                        {humanB64 ? (
                          <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'2px solid #3b82f6' }}>
                            <img src={`data:${humanImgType};base64,${humanB64}`} alt="Planta"
                              style={{ width:'100%', maxHeight:160, objectFit:'contain', display:'block', background:'#f8faff', padding:4 }} />
                            <button onClick={() => { setHumanB64(null); setHumanResult({}); setGeminiRenderB64(null); setGeminiPalette([]); setGeminiMarketing('') }}
                              style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.65)',
                                color:'#fff', border:'none', borderRadius:4, fontSize:10, padding:'3px 7px', cursor:'pointer' }}>
                              ✕ {humanLang==='pt-BR'?'Remover':'Remove'}
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
                            <div style={{ border:'2px dashed #93c5fd', borderRadius:10, padding:'28px 12px',
                              textAlign:'center' as const, background:'#eff6ff', transition:'all .2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#dbeafe' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='#eff6ff' }}>
                              <div style={{ fontSize:32, marginBottom:8 }}>🖼️</div>
                              <div style={{ fontSize:12, fontWeight:600, color:'#1e40af', marginBottom:3 }}>
                                {humanLang==='pt-BR'?'Arraste ou clique aqui':'Drag or click to upload'}
                              </div>
                              <div style={{ fontSize:10, color:'#60a5fa' }}>JPG · PNG · PDF · DWG · IFC</div>
                            </div>
                          </label>
                        )}
                      </div>

                      {/* Controls */}
                      <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                        letterSpacing:'.08em' }}>
                        {humanLang==='pt-BR'?'3 — Parâmetros':'3 — Parameters'}
                      </div>
                      {[
                        { lbl: humanLang==='pt-BR'?'Tipo de edificação':'Building type', id:'humanTipo', val:humanTipo, set:setHumanTipo, opts:[
                          ['residencial unifamiliar','🏠 Residencial — casa'],
                          ['apartamento residencial','🏢 Residencial — apartamento'],
                          ['escritório comercial','💼 Escritório / Comercial'],
                          ['loja de varejo','🛍️ Loja / Varejo'],
                          ['café ou restaurante','☕ Café / Restaurante'],
                          ['clínica ou consultório','🏥 Clínica / Consultório'],
                        ]},
                        { lbl: humanLang==='pt-BR'?'Estilo de renderização':'Render style', id:'humanEstilo', val:humanEstilo, set:setHumanEstilo, opts:[
                          ['photorealistic professional architectural',humanLang==='pt-BR'?'Fotorrealista profissional':'Photorealistic'],
                          ['high-end architectural visualization',humanLang==='pt-BR'?'Alta renderização arquitetônica':'High-end arch. viz'],
                          ['watercolor artistic architectural',humanLang==='pt-BR'?'Aquarela / Artístico':'Watercolor / Artistic'],
                          ['technical axonometric',humanLang==='pt-BR'?'Técnico / Axonométrico':'Technical / Axonometric'],
                        ]},
                        { lbl: humanLang==='pt-BR'?'Tipo de lote / entorno':'Lot / setting', id:'humanLote', val:humanLote, set:setHumanLote, opts:[
                          ['standard rectangular urban lot with sidewalk and street trees',humanLang==='pt-BR'?'Lote retangular — urbano padrão':'Rectangular urban lot'],
                          ['corner lot with two street frontages, sidewalks and urban trees',humanLang==='pt-BR'?'Lote de esquina — duas frentes':'Corner lot'],
                          ['rural lot with natural landscape, grass, trees and open sky',humanLang==='pt-BR'?'Lote rural — paisagem natural':'Rural lot'],
                          ['condominium lot surrounded by common areas, gardens and other units',humanLang==='pt-BR'?'Lote em condomínio':'Condominium'],
                        ]},
                        { lbl: humanLang==='pt-BR'?'Vegetação / Paisagismo':'Vegetation / Landscaping', id:'humanVeg', val:humanVeg, set:setHumanVeg, opts:[
                          ['imperial palm trees, tropical shrubs, bromeliads, ornamental grasses, dense tropical foliage',humanLang==='pt-BR'?'🌴 Tropical — palmeiras imperiais':'🌴 Tropical — imperial palms'],
                          ['mediterranean trees, lavender, olive trees, bougainvillea, stone pathways',humanLang==='pt-BR'?'🫒 Mediterrâneo — oliveiras':'🫒 Mediterranean — olive trees'],
                          ['minimalist landscaping, ornamental grasses, pebbles, architectural plants',humanLang==='pt-BR'?'⬜ Minimalista — gramas ornamentais':'⬜ Minimalist — ornamental grass'],
                          ['native Brazilian cerrado vegetation, small trees, dry grass',humanLang==='pt-BR'?'🌵 Cerrado brasileiro':'🌵 Brazilian Cerrado'],
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
                            letterSpacing:'.08em', marginBottom:5 }}>{humanLang==='pt-BR'?'Escala':'Scale'}</div>
                          <select value={humanEscala} onChange={e => setHumanEscala(e.target.value)}
                            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                              fontSize:12, background:'#f8f9fc', color:'#1a1f36', fontFamily:'inherit', outline:'none' }}>
                            {[['25','1 : 25'],['50','1 : 50'],['100','1 : 100'],['200','1 : 200']].map(([v,l]) =>
                              <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                            letterSpacing:'.08em', marginBottom:5 }}>{humanLang==='pt-BR'?'Nº de pessoas':'People count'}</div>
                          <input type="number" value={humanNP} min={1} max={20}
                            onChange={e => setHumanNP(Number(e.target.value))}
                            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                              fontSize:12, background:'#f8f9fc', color:'#1a1f36', fontFamily:'inherit', outline:'none' }} />
                        </div>
                      </div>

                      {/* Scale info */}
                      <div style={{ background:'#eff6ff', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#1d4ed8' }}>
                        📏 {humanLang==='pt-BR'?'Escala':'Scale'} 1:{humanEscala} — {humanLang==='pt-BR'?'figura':'person'} 1,70 m = <strong>{((1.70/parseInt(humanEscala))*100).toFixed(2)} cm</strong> {humanLang==='pt-BR'?'na planta':'on plan'}
                      </div>

                      <button
                        disabled={!humanB64 || humanLoading}
                        onClick={async () => {
                          if (!humanB64) return
                          setHumanLoading(true)
                          setHumanResult({})
                          setGeminiRenderB64(null)
                          setGeminiRenderError(null)
                          setPollinationsUrl(null)
                          setGeminiPalette([])
                          setGeminiMarketing('')
                          setGeminiPaletteError(null)
                          setGeminiMarketingError(null)
                          setGeminiVariants({})
                          setVariantsLoading({})
                          setReelVideoUrl(null)
                          setReelNarration('')
                          setReelAudioB64(null)
                          setHumanTab('analise')
                          // Save uploaded floor plan to gallery
                          if (humanB64 && humanImgType !== 'application/pdf') {
                            try {
                              const saved = localStorage.getItem('acip_humanizer_gallery')
                              const gallery: any[] = saved ? JSON.parse(saved) : []
                              const already = gallery.find((g: any) => g.type === 'planta' && g.b64 === humanB64)
                              if (!already) {
                                const entry = { id: 'p' + Date.now(), type: 'planta', b64: humanB64, mime: humanImgType, label: humanTipo || 'Planta', createdAt: Date.now() }
                                const next = [entry, ...gallery].slice(0, 30)
                                localStorage.setItem('acip_humanizer_gallery', JSON.stringify(next))
                                setHumanGallery(next)
                              }
                            } catch {}
                          }
                          const cmFig = ((1.70/parseInt(humanEscala))*100).toFixed(2)
                          const imgLabel = humanAnaliseTipo === 'planta' ? (humanLang==='pt-BR'?'planta baixa':'floor plan')
                            : humanAnaliseTipo === 'fachada' ? (humanLang==='pt-BR'?'fachada':'building facade')
                            : humanAnaliseTipo === 'interior' ? (humanLang==='pt-BR'?'interior 3D':'3D interior')
                            : (humanLang==='pt-BR'?'corte/seção':'section/elevation')
                          const isEnglish = humanLang === 'en-US'
                          const prompt = isEnglish
                            ? `You are an expert architectural visualizer. Analyze this ${imgLabel} of a "${humanTipo}" building and provide a complete analysis in English.

PARAMETERS:
- Scale: 1:${humanEscala}
- Human figures: 1.70m (= ${cmFig} cm on plan)
- Number of people: ${humanNP}
- Style: ${humanEstilo}
- Setting: ${humanLote}
- Vegetation: ${humanVeg}
- Image type: ${imgLabel}

RETURN EXACTLY in this markdown format:

### ANALYSIS
[Building type identified, list of spaces with estimated areas, total approximate area]

### PEOPLE & SPACES
[Distribute ${humanNP} people across spaces: Space | People | Activity]

### GEMINI RENDER PROMPT
[Write an ultra-detailed English prompt for Gemini 2.0 Flash Exp to generate a photorealistic image-to-image humanization. ${humanAnaliseTipo === 'planta' ? `Bird's-eye view: same top-down geometry, realistic flooring per room, high-end furniture scale 1:${humanEscala}, ${humanNP} people at 1.70m, swimming pool if space allows, EXTERIOR: ${humanLote}, ${humanVeg}, sidewalk, parked cars, overhead sunlight with shadows.` : humanAnaliseTipo === 'fachada' ? `Front elevation: same facade geometry, photorealistic wall/roof materials, golden hour lighting, ${humanVeg}, luxury car in driveway, sky with clouds, ${humanNP} people visible.` : humanAnaliseTipo === 'interior' ? `Interior perspective: same camera angle and layout, photorealistic materials (flooring/walls/ceiling), LED recessed lighting + strip lights, ${humanNP} person doing activity at 1.70m, decorative elements, reflections and ambient occlusion, style: ${humanEstilo}.` : `Cross-section: same geometry, photorealistic materials on cut surfaces, interior spaces with furniture and people at scale.`} Style: ${humanEstilo}. No text overlays.]

### IMPROVEMENT SUGGESTIONS
[List 5 concrete improvements: layout, natural light, space optimization, materials, circulation]`
                            : `Você é especialista em visualização arquitetônica. Analise esta ${imgLabel} de uma edificação do tipo "${humanTipo}" e gere uma análise completa em português.

PARÂMETROS:
- Escala: 1:${humanEscala}
- Figuras humanas: 1,70 m (= ${cmFig} cm na planta)
- Número de pessoas: ${humanNP}
- Estilo: ${humanEstilo}
- Lote: ${humanLote}
- Vegetação: ${humanVeg}
- Tipo de imagem: ${imgLabel}

RETORNE EXATAMENTE neste formato markdown:

### ANÁLISE
[Tipo identificado, lista de ambientes com áreas estimadas, total aproximado]

### AMBIENTES E PESSOAS
[Distribua as ${humanNP} pessoas pelos ambientes: Ambiente | Pessoas | Atividade]

### PROMPT GEMINI RENDER
[Escreva um prompt em inglês ultra-detalhado para o Gemini 2.0 Flash Exp gerar humanização fotorrealista image-to-image. ${humanAnaliseTipo === 'planta' ? `Vista aérea: mesma geometria top-down, pisos realistas por ambiente, mobiliário escala 1:${humanEscala}, ${humanNP} pessoas de 1,70 m, piscina se houver espaço, EXTERIOR: ${humanLote}, ${humanVeg}, calçada, carros, iluminação solar superior.` : humanAnaliseTipo === 'fachada' ? `Elevação frontal: mesma geometria da fachada, materiais fotorrealistas (muro/telhado/revestimentos), iluminação dourada (golden hour), ${humanVeg}, carro luxo na garagem, céu com nuvens, ${humanNP} pessoas visíveis.` : humanAnaliseTipo === 'interior' ? `Perspectiva interior: mesmo ângulo de câmera e layout, materiais fotorrealistas (piso/paredes/teto), LED embutido + fita LED sob armários, ${humanNP} pessoa(s) fazendo atividade de 1,70 m, elementos decorativos, reflexos e ambient occlusion, estilo ${humanEstilo}.` : `Corte transversal: mesma geometria, materiais fotorrealistas nas superfícies de corte, ambientes internos com mobiliário e pessoas em escala.`} Estilo: ${humanEstilo}. Sem sobreposição de texto.]

### MELHORIAS SUGERIDAS
[Liste 5 melhorias concretas para o projeto: layout, iluminação natural, aproveitamento de espaço, materiais, circulação]`

                          let analysisText = ''
                          let dallePrompt = ''
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
                            analysisText = txt
                            const secs: Record<string,string> = {}
                            const rx = /###\s+([^\n]+)\n([\s\S]*?)(?=###\s|$)/g
                            let m
                            while ((m = rx.exec(txt)) !== null) secs[m[1].trim()] = m[2].trim()
                            if (!Object.keys(secs).length) secs['RESULTADO'] = txt
                            setHumanResult(secs)
                            const dalleKey = Object.keys(secs).find(k => k.includes('GEMINI') || k.includes('DALL') || k.includes('PROMPT'))
                            dallePrompt = dalleKey ? secs[dalleKey] : ''
                          } catch (err: any) {
                            setHumanResult({ 'ERRO': err?.message || 'Falha na análise.' })
                          }
                          setHumanLoading(false)

                          // Auto-trigger Gemini render + palette + marketing in parallel
                          const b64Snap = humanB64
                          const imgTypeSnap = humanImgType
                          const tipoSnap = humanTipo
                          const estiloSnap = humanEstilo
                          const loteSnap = humanLote
                          const vegSnap = humanVeg

                          // ── Render: Gemini image-to-image PRIMARY ──
                          // Preserves exact floor plan geometry — true humanization, not text-to-image
                          if (b64Snap && imgTypeSnap !== 'application/pdf') {
                            setPollinationsUrl(null)
                            setGeminiRenderB64(null)
                            setGeminiRenderError(null)
                            setGeminiRenderLoading(true)
                            const renderPrompt = humanAnaliseTipo === 'planta'
                              ? `You are an expert architectural visualizer. Transform this top-down floor plan into a photorealistic bird's-eye humanized visualization.

CRITICAL: Keep EXACTLY the same top-down perspective and floor plan geometry. Do NOT create a 3D exterior view. Do NOT invent new walls or rooms.

Add to the plan:
- Realistic flooring per room: hardwood, large-format porcelain tiles, marble, carpets
- High-end modern furniture at correct scale (1:${humanEscala})
- ${estiloSnap} interior style with indoor plants, decor, artwork, lighting fixtures
- ${humanNP} people doing realistic activities (1.70 m height reference)
- Swimming pool with blue water texture if outdoor space allows
- EXTERIOR: ${loteSnap}, ${vegSnap}, paved sidewalk, street markings, parked luxury car, shadow projection from vegetation
- Natural overhead sunlight with soft cast shadows

Result: premium bird's-eye architectural render for luxury real estate marketing. No text overlays.`
                              : humanAnaliseTipo === 'fachada'
                              ? `You are an expert architectural visualizer. Transform this building facade/elevation drawing into a photorealistic architectural exterior render.

CRITICAL: Keep EXACTLY the same camera angle, building silhouette, roof profile, and facade proportions as the original. Do NOT change the building shape or layout.

Transform by adding:
- Photorealistic wall materials: exposed concrete panels, stucco, stone cladding, wood slats — match architectural style
- Realistic roof covering: dark ceramic tiles, flat concrete slab with parapet, metal sheet — per design
- High-end windows with glass reflections and warm interior light visible through glazing
- Premium front door and garage door with metallic/wood finish and subtle lighting
- Dramatic golden-hour sunlight casting realistic shadows across the facade
- ${vegSnap}, palm trees and ornamental shrubs along the boundary wall and sidewalk
- Realistic concrete or stone pavement on driveway and sidewalk
- A luxury dark-colored vehicle parked in or near the garage
- Dramatic sky: warm sunset clouds or blue clear sky with depth
- Wall sconces, security camera, architectural accent lighting details

Result: premium photorealistic exterior render for luxury real estate marketing. No text overlays.`
                              : humanAnaliseTipo === 'interior'
                              ? `You are an expert architectural visualizer. Transform this 3D interior model/sketch into a photorealistic interior architectural render.

CRITICAL: Keep EXACTLY the same camera position, viewing angle, room layout, and all existing furniture/objects. Do NOT rearrange the space.

Transform by adding:
- Photorealistic floor: polished large-format porcelain tiles, concrete microcement or hardwood
- Photorealistic walls: smooth painted surfaces, textured plaster or wood accent panels
- Photorealistic ceiling: white gypsum board with recessed LED spots and LED strip lighting
- Premium cabinets: matte white lacquer or natural wood veneer with stone countertops
- Stainless steel and high-gloss appliances with metallic reflections
- Warm LED strip lighting under upper cabinets, recessed ceiling spots casting soft pools of light
- Natural light streaming through windows with realistic light rays and window frame shadows
- ${humanNP} realistic person/people doing activities (1.70 m height) — professional but casual
- Elegant decor: ceramic vase with olive branch, cutting board with bread, small potted plant, stainless accessories
- Photorealistic ambient occlusion, material reflections, soft shadows and depth of field
- Style: ${estiloSnap}, luxury real estate marketing quality

Result: premium photorealistic interior render. No text overlays.`
                              : `You are an expert architectural visualizer. Transform this architectural cross-section drawing into a photorealistic rendered section.

CRITICAL: Keep EXACTLY the same section cut geometry and proportions.

Transform by adding:
- Photorealistic materials on all cut surfaces: concrete structure, brick/block fill, insulation layers
- Interior spaces visible through the cut: realistic flooring, furniture, ceiling finishes
- Natural light entering through windows and skylights with realistic rays
- ${humanNP} people shown in scale (1.70 m) inside spaces doing activities
- Exterior context: ${vegSnap}, ground materials, sky
- Style: ${estiloSnap}

Result: premium photorealistic architectural section render. No text overlays.`
                            fetch('/api/gemini', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                model: 'gemini-2.0-flash-exp',
                                contents: [{ role: 'user', parts: [
                                  { inlineData: { mimeType: imgTypeSnap, data: b64Snap } },
                                  { text: renderPrompt }
                                ]}],
                                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                              })
                            }).then(async r => {
                              const data = await r.json()
                              if (data?.error?.message) { setGeminiRenderError(data.error.message); return }
                              const parts = data?.candidates?.[0]?.content?.parts ?? []
                              const imgPart = parts.find((p: any) => p.inlineData?.data)
                              if (imgPart) {
                                const b64 = imgPart.inlineData.data
                                setGeminiRenderB64(b64)
                                setGeminiRenderError(null)
                                // Save render to gallery
                                try {
                                  const saved = localStorage.getItem('acip_humanizer_gallery')
                                  const gallery: any[] = saved ? JSON.parse(saved) : []
                                  const entry = { id: Date.now().toString(), type: 'render', b64, mime: 'image/jpeg', label: humanTipo || 'Render', createdAt: Date.now() }
                                  const next = [entry, ...gallery].slice(0, 30)
                                  localStorage.setItem('acip_humanizer_gallery', JSON.stringify(next))
                                  setHumanGallery(next)
                                } catch {}
                              } else setGeminiRenderError('Gemini não retornou imagem.')
                            }).catch((e: any) => setGeminiRenderError(e?.message || 'Erro de rede'))
                            .finally(() => setGeminiRenderLoading(false))
                          } else if (dallePrompt) {
                            // PDF or no image: fall back to Pollinations text-to-image
                            const encoded = encodeURIComponent(
                              `${dallePrompt} bird's-eye architectural floor plan render, luxury real estate, top-down view`.slice(0, 500)
                            )
                            setPollinationsUrl(`https://image.pollinations.ai/prompt/${encoded}?width=1280&height=960&nologo=true&seed=${Date.now()}`)
                          }

                          // Gemini palette
                          if (analysisText) {
                            setGeminiPaletteLoading(true)
                            setGeminiPaletteError(null)
                            fetch('/api/gemini', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                model: 'gemini-2.0-flash',
                                contents: [{ role: 'user', parts: [{ text:
                                  `Based on this architectural analysis of a "${tipoSnap}" building, suggest a professional color palette with exactly 6 colors.
Analysis: ${analysisText.slice(0, 1200)}
Return ONLY a valid JSON array (no markdown, no extra text): [{"name":"Warm White","hex":"#F5F0E8","usage":"Walls"},{"name":"Sage Green","hex":"#8FA888","usage":"Accents"},...]` }]}]
                              })
                            }).then(async r => {
                              const data = await r.json()
                              if (data?.error?.message) { setGeminiPaletteError(data.error.message); return }
                              const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                              const match = txt.match(/\[[\s\S]*?\]/)
                              if (match) {
                                try { setGeminiPalette(JSON.parse(match[0])); setGeminiPaletteError(null) } catch(e: any) { setGeminiPaletteError('Erro ao parsear paleta: ' + match[0].slice(0, 60)) }
                              } else { setGeminiPaletteError('Gemini não retornou paleta válida.') }
                            }).catch((e: any) => setGeminiPaletteError(e?.message || 'Erro de rede'))
                            .finally(() => setGeminiPaletteLoading(false))
                          }

                          // Gemini marketing copy
                          if (analysisText) {
                            setGeminiMarketingLoading(true)
                            setGeminiMarketingError(null)
                            fetch('/api/gemini', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                model: 'gemini-2.0-flash',
                                contents: [{ role: 'user', parts: [{ text:
                                  `Você é um copywriter especializado em marketing imobiliário de alto padrão. Com base nesta análise arquitetônica de um imóvel "${tipoSnap}", crie textos de marketing profissionais em português:

Análise: ${analysisText.slice(0, 1200)}

Crie:
1. **Headline** (até 10 palavras, impactante)
2. **Subtítulo** (até 20 palavras)
3. **Descrição** (2 parágrafos ricos e sedutores, 60-80 palavras cada)
4. **Diferenciais** (5 bullet points com emojis)
5. **Call to Action** (1 frase poderosa)` }]}]
                              })
                            }).then(async r => {
                              const data = await r.json()
                              if (data?.error?.message) { setGeminiMarketingError(data.error.message); return }
                              const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                              if (txt) { setGeminiMarketing(txt); setGeminiMarketingError(null) }
                              else setGeminiMarketingError('Gemini não retornou texto de marketing.')
                            }).catch((e: any) => setGeminiMarketingError(e?.message || 'Erro de rede'))
                            .finally(() => setGeminiMarketingLoading(false))
                          }
                        }}
                        style={{ padding:'12px', background: humanB64 ? '#534AB7' : '#ccc',
                          color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                          cursor: humanB64 ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        {humanLoading
                          ? (humanLang==='pt-BR'?'⏳ Analisando...':'⏳ Analyzing...')
                          : (humanLang==='pt-BR'?'✨ Gerar Análise Completa com IA':'✨ Analyze with AI')}
                      </button>

                      </div>{/* end inner padding div */}
                    </div>

                    {/* Right results — tabbed */}
                    <div style={{ display:'flex', flexDirection:'column' as const, overflow:'hidden', minHeight:0 }}>

                      {/* Tabs header */}
                      {!humanLoading && Object.keys(humanResult).length > 0 && (
                        <div style={{ display:'flex', gap:2, padding:'8px 12px', borderBottom:'1px solid #e5e8f0',
                          background:'#f8f9fc', flexShrink:0, flexWrap:'wrap' as const }}>
                          {([
                            ['analise','📊 Análise'],
                            ['render','🎨 Render IA'],
                            ['palette','🎭 Paleta'],
                            ['marketing','📣 Marketing'],
                            ['assistant','💬 Assistente'],
                          ] as const).map(([t, lbl]) => (
                            <button key={t} onClick={() => setHumanTab(t)}
                              style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, border:'none',
                                cursor:'pointer', fontFamily:'inherit',
                                background: humanTab === t ? '#534AB7' : 'transparent',
                                color: humanTab === t ? '#fff' : '#5a6282' }}>
                              {lbl}{t === 'render' && geminiRenderLoading ? ' ⏳' : ''}
                              {t === 'palette' && geminiPaletteLoading ? ' ⏳' : ''}
                              {t === 'marketing' && geminiMarketingLoading ? ' ⏳' : ''}
                            </button>
                          ))}
                          <button onClick={async () => {
                            const w = window.open('','_blank','width=960,height=800')
                            if (!w) return
                            let plantImgUrl = ''
                            if (humanB64 && humanImgType !== 'application/pdf') {
                              try {
                                const bs = atob(humanB64); const ab = new ArrayBuffer(bs.length); const ia = new Uint8Array(ab)
                                for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i)
                                plantImgUrl = URL.createObjectURL(new Blob([ab], { type: humanImgType }))
                              } catch {}
                            }
                            let renderImgUrl = ''
                            if (geminiRenderB64) {
                              try {
                                const bs = atob(geminiRenderB64); const ab = new ArrayBuffer(bs.length); const ia = new Uint8Array(ab)
                                for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i)
                                renderImgUrl = URL.createObjectURL(new Blob([ab], { type: 'image/jpeg' }))
                              } catch {}
                            }
                            const imgHtml = plantImgUrl ? `<img src="${plantImgUrl}" style="width:100%;border-radius:8px;margin-bottom:16px;display:block;page-break-inside:avoid"/>` : ''
                            const renderHtml = renderImgUrl ? `<h2>🎨 RENDERIZAÇÃO IA</h2><img src="${renderImgUrl}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block;page-break-inside:avoid"/>` : ''
                            const paletteHtml = geminiPalette.length ? `<h2>🎭 PALETA DE CORES</h2><div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px">${geminiPalette.map(c=>`<div style="display:flex;align-items:center;gap:8px;background:#f8f9fc;padding:8px 12px;border-radius:8px;border:1px solid #e5e8f0"><div style="width:32px;height:32px;border-radius:6px;background:${c.hex};border:1px solid rgba(0,0,0,.1)"></div><div><div style="font-size:12px;font-weight:700">${c.name}</div><div style="font-size:10px;color:#8890a0">${c.hex} · ${c.usage}</div></div></div>`).join('')}</div>` : ''
                            const marketingHtml = geminiMarketing ? `<h2>📣 MARKETING</h2><div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${geminiMarketing.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</div>` : ''
                            const sections = Object.entries(humanResult).map(([k,v]) =>
                              `<h2>${k.includes('DALL')?'🎨':k.includes('MIDJ')?'🎭':k.includes('REVIT')?'🏗️':k.includes('AMBIENTES')?'🚶':'📊'} ${k}</h2><pre>${v}</pre>`
                            ).join('')
                            w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Humanização — ${humanTipo}</title><style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:24px 32px;color:#1a1f36;margin:0}h1{font-size:20px;color:#185FA5;margin-bottom:4px}.sub{font-size:12px;color:#8890a0;margin-bottom:24px}h2{font-size:14px;color:#534AB7;margin:20px 0 8px;page-break-after:avoid}pre{white-space:pre-wrap;font-size:12px;line-height:1.85;background:#f8f9fc;padding:12px;border-radius:6px;border:1px solid #e5e8f0;margin:0;page-break-inside:avoid}img{width:100%;height:auto;border-radius:8px;display:block;page-break-inside:avoid}@page{size:auto;margin:15mm}@media print{.no-print{display:none}}</style></head><body><h1>🏛️ Humanização de Planta Baixa</h1><div class="sub">${humanTipo} · Escala 1:${humanEscala} · ${humanNP} pessoas · ${humanEstilo}</div>${imgHtml}${renderHtml}${paletteHtml}${marketingHtml}${sections}<br/><button class="no-print" onclick="window.print()" style="padding:10px 24px;background:#534AB7;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer">🖨️ Imprimir</button></body></html>`)
                            w.document.close()
                          }}
                            style={{ marginLeft:'auto', padding:'5px 12px', background:'#3B6D11', color:'#fff',
                              border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            🖨️ Imprimir
                          </button>
                        </div>
                      )}

                      {/* Scrollable content */}
                      <div style={{ flex:1, overflowY:'auto' as const, padding:'16px', display:'flex', flexDirection:'column' as const, gap:14, minHeight:0 }}>

                        {/* Loading state */}
                        {humanLoading && (
                          <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center',
                            justifyContent:'center', gap:14, padding:48, color:'#8890a0' }}>
                            <div style={{ width:36, height:36, border:'3px solid #e5e8f0', borderTopColor:'#534AB7',
                              borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                            <div style={{ fontSize:13 }}>Analisando planta com IA...</div>
                            <div style={{ fontSize:11, color:'#b0b8cc' }}>Gemini + Claude: identificando ambientes, gerando paleta e marketing</div>
                          </div>
                        )}

                        {/* Empty state */}
                        {!humanLoading && Object.keys(humanResult).length === 0 && (
                          <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center',
                            justifyContent:'center', gap:14, padding:48, color:'#8890a0', textAlign:'center' as const }}>
                            <div style={{ fontSize:48 }}>🏛️</div>
                            <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36' }}>Humanizador Studio 3D</div>
                            <div style={{ fontSize:12, maxWidth:300, lineHeight:1.6 }}>
                              Envie uma imagem da planta e clique em <strong>"✨ Gerar Análise"</strong>.<br/>
                              A IA (Claude + Gemini) gerará análise, render 3D, paleta de cores e textos de marketing.
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%', maxWidth:280 }}>
                              {[['📊','Análise de ambientes'],['🎨','Render IA (Gemini)'],['🎭','Paleta de cores'],['📣','Copy de marketing']].map(([ic,lb])=>(
                                <div key={lb} style={{ background:'#f8f9fc', border:'1px solid #e5e8f0', borderRadius:8,
                                  padding:'10px', textAlign:'center' as const, fontSize:11, color:'#5a6282' }}>
                                  <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>{lb}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Tab: Análise ── */}
                        {!humanLoading && humanTab === 'analise' && Object.keys(humanResult).map(key => {
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
                                    color:'#1a1f36', whiteSpace:'pre-wrap' as const }}>{val}</div>
                                ) : (
                                  <div style={{ fontSize:12, lineHeight:1.75, color:'#5a6282', whiteSpace:'pre-wrap' as const }}
                                    dangerouslySetInnerHTML={{ __html: val
                                      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
                                      .replace(/^[-•]\s+(.+)$/gm,'<div style="padding:2px 0 2px 12px;border-left:2px solid #e5e8f0">$1</div>')
                                      .replace(/\n/g,'<br/>') }} />
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* ── Tab: Render IA ── */}
                        {!humanLoading && humanTab === 'render' && (
                          <div style={{ display:'flex', flexDirection:'column' as const, gap:16 }}>

                            {/* Loading card — shown while Gemini processes */}
                            {geminiRenderLoading && !geminiRenderB64 && (
                              <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius:12,
                                padding:'40px 24px', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:16, textAlign:'center' as const }}>
                                <div style={{ position:'relative' as const, width:56, height:56 }}>
                                  <div style={{ position:'absolute' as const, inset:0, border:'3px solid rgba(167,139,250,.3)', borderRadius:'50%' }} />
                                  <div style={{ position:'absolute' as const, inset:0, border:'3px solid transparent',
                                    borderTopColor:'#a78bfa', borderRadius:'50%', animation:'spin .9s linear infinite' }} />
                                  <div style={{ position:'absolute' as const, inset:8, background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                    borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎨</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:14, fontWeight:700, color:'#e0e7ff', marginBottom:6 }}>
                                    {humanLang==='pt-BR'
                                      ? humanAnaliseTipo==='fachada' ? 'Renderizando fachada...'
                                        : humanAnaliseTipo==='interior' ? 'Renderizando interior...'
                                        : humanAnaliseTipo==='corte' ? 'Renderizando corte...'
                                        : 'Humanizando a planta...'
                                      : humanAnaliseTipo==='fachada' ? 'Rendering facade...'
                                        : humanAnaliseTipo==='interior' ? 'Rendering interior...'
                                        : humanAnaliseTipo==='corte' ? 'Rendering section...'
                                        : 'Humanizing floor plan...'
                                    }
                                  </div>
                                  <div style={{ fontSize:11, color:'rgba(167,139,250,.8)', lineHeight:1.6 }}>
                                    Gemini 2.0 Flash Exp — image-to-image<br/>
                                    {humanLang==='pt-BR'
                                      ? humanAnaliseTipo==='fachada' ? 'Preservando geometria, aplicando materiais, iluminação e vegetação'
                                        : humanAnaliseTipo==='interior' ? 'Preservando câmera, aplicando materiais, iluminação LED e pessoas'
                                        : 'Preservando geometria e adicionando mobiliário, pessoas e paisagismo'
                                      : humanAnaliseTipo==='fachada' ? 'Preserving geometry, applying materials, lighting & vegetation'
                                        : humanAnaliseTipo==='interior' ? 'Preserving camera, applying materials, LED lighting & people'
                                        : 'Preserving geometry, adding furniture, people & landscaping'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Render result */}
                            {(geminiRenderB64 || pollinationsUrl) ? (
                              <div style={{ display:'flex', flexDirection:'column' as const, gap:14 }}>
                                {/* Main render card */}
                                <div style={{ background:'#fff', border:`2px solid ${geminiRenderB64?'#534AB7':'#3b82f6'}`, borderRadius:12, overflow:'hidden' as const }}>
                                  <div style={{ padding:'10px 16px', background: geminiRenderB64 ? 'linear-gradient(135deg,#534AB7,#3d37a0)' : 'linear-gradient(135deg,#1e3a5f,#1e40af)',
                                    display:'flex', alignItems:'center', gap:8 }}>
                                    <span style={{ fontSize:16 }}>🎨</span>
                                    <div style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff' }}>
                                      {geminiRenderB64
                                        ? (humanLang==='pt-BR'?'Render IA — Gemini image-to-image':'AI Render — Gemini image-to-image')
                                        : (humanLang==='pt-BR'?'Render IA — Gerado por IA':'AI Render — AI Generated')}
                                    </div>
                                    <div style={{ fontSize:10, color:'rgba(255,255,255,.7)' }}>
                                      {geminiRenderB64 ? 'Gemini 2.0 Flash Exp' : 'Pollinations.ai'}
                                    </div>
                                  </div>
                                  {geminiRenderB64 ? (
                                    <img src={`data:image/jpeg;base64,${geminiRenderB64}`} alt="Render Gemini"
                                      style={{ width:'100%', display:'block', maxHeight:480, objectFit:'cover' }} />
                                  ) : (
                                    <img src={pollinationsUrl!} alt="Render"
                                      style={{ width:'100%', display:'block', maxHeight:420, objectFit:'cover' }}
                                      onError={() => setPollinationsUrl(null)} />
                                  )}
                                  <div style={{ padding:'10px 14px', display:'flex', gap:8, background:'#f8f9fc', borderTop:'1px solid #e5e8f0', flexWrap:'wrap' as const }}>
                                    {geminiRenderB64 ? (
                                      <a href={`data:image/jpeg;base64,${geminiRenderB64}`} download="render-gemini.jpg"
                                        style={{ padding:'6px 14px', background:'#534AB7', color:'#fff', borderRadius:6,
                                          fontSize:11, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                                        ⬇️ {humanLang==='pt-BR'?'Baixar':'Download'}
                                      </a>
                                    ) : (
                                      <a href={pollinationsUrl!} download="render.jpg" target="_blank" rel="noreferrer"
                                        style={{ padding:'6px 14px', background:'#3b82f6', color:'#fff', borderRadius:6,
                                          fontSize:11, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                                        ⬇️ {humanLang==='pt-BR'?'Baixar':'Download'}
                                      </a>
                                    )}
                                    {humanB64 && humanImgType !== 'application/pdf' && (
                                    <button onClick={() => {
                                      setGeminiRenderB64(null); setGeminiRenderError(null); setGeminiRenderLoading(true); setPollinationsUrl(null)
                                      const p = humanAnaliseTipo === 'planta'
                                        ? `You are an expert architectural visualizer. Transform this top-down floor plan into a photorealistic bird's-eye humanized visualization.\n\nCRITICAL: Keep EXACTLY the same top-down perspective and floor plan geometry. Do NOT invent new walls or rooms.\n\nAdd: realistic flooring per room, high-end furniture scale 1:${humanEscala}, ${humanNP} people at 1.70m, indoor plants & decor, swimming pool if space allows. EXTERIOR: ${humanLote}, ${humanVeg}, sidewalk, parked luxury car, shadow projection. Natural overhead sunlight. Style: ${humanEstilo}. No text overlays. Seed:${Date.now()}`
                                        : humanAnaliseTipo === 'fachada'
                                        ? `You are an expert architectural visualizer. Transform this building facade into a photorealistic exterior render.\n\nCRITICAL: Keep EXACTLY the same camera angle and facade geometry.\n\nAdd: photorealistic wall materials, dark roof tiles/concrete slab, premium door & garage with metallic finish, golden-hour sunlight with facade shadows, ${humanVeg} along boundary wall and sidewalk, luxury dark vehicle in driveway, dramatic sky with clouds. Style: ${humanEstilo}. No text overlays. Seed:${Date.now()}`
                                        : humanAnaliseTipo === 'interior'
                                        ? `You are an expert architectural visualizer. Transform this 3D interior into a photorealistic render.\n\nCRITICAL: Keep EXACTLY the same camera position and room layout.\n\nAdd: photorealistic flooring, painted walls, gypsum ceiling with LED recessed spots and strip lights, premium cabinets with stone countertops, stainless appliances, natural light from windows, ${humanNP} person at 1.70m doing activity, elegant decor. Style: ${humanEstilo}. No text overlays. Seed:${Date.now()}`
                                        : `You are an expert architectural visualizer. Transform this cross-section into a photorealistic rendered section.\n\nCRITICAL: Keep EXACTLY the same geometry.\n\nAdd: photorealistic materials on cut surfaces, interior spaces with furniture and people at scale 1.70m, natural light, ${humanVeg}. Style: ${humanEstilo}. No text overlays. Seed:${Date.now()}`
                                      fetch('/api/gemini',{ method:'POST', headers:{'Content-Type':'application/json'},
                                        body:JSON.stringify({ model:'gemini-2.0-flash-exp', contents:[{role:'user',parts:[{inlineData:{mimeType:humanImgType,data:humanB64}},{text:p}]}], generationConfig:{responseModalities:['TEXT','IMAGE']} })
                                      }).then(async r=>{const d=await r.json(); if(d?.error?.message){setGeminiRenderError(d.error.message);return} const ip=(d?.candidates?.[0]?.content?.parts??[]).find((x:any)=>x.inlineData?.data); if(ip){setGeminiRenderB64(ip.inlineData.data);setGeminiRenderError(null)} else setGeminiRenderError('Sem imagem.')}).catch((e:any)=>setGeminiRenderError(e.message)).finally(()=>setGeminiRenderLoading(false))
                                    }}
                                      style={{ padding:'6px 14px', background:'#3B6D11', color:'#fff', border:'none',
                                        borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                      🔄 {humanLang==='pt-BR'?'Nova versão':'New version'}
                                    </button>
                                    )}
                                  </div>
                                </div>

                                {/* ── Style Variants for Marketing ── */}
                                {geminiRenderB64 && humanB64 && humanImgType !== 'application/pdf' && (
                                  <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, overflow:'hidden' as const }}>
                                    <div style={{ padding:'10px 16px', background:'linear-gradient(135deg,#1e1b4b,#312e81)', display:'flex', alignItems:'center', gap:8 }}>
                                      <span style={{ fontSize:14 }}>✨</span>
                                      <div style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff' }}>
                                        {humanLang==='pt-BR' ? 'Variações para Divulgação' : 'Marketing Variations'}
                                      </div>
                                      <div style={{ fontSize:9, color:'rgba(255,255,255,.5)' }}>Gemini</div>
                                    </div>
                                    <div style={{ padding:'14px', display:'flex', flexDirection:'column' as const, gap:10 }}>
                                      <div style={{ fontSize:10, color:'#8890a0', lineHeight:1.5 }}>
                                        {humanLang==='pt-BR'
                                          ? 'Gere o mesmo projeto em 3 estilos diferentes para divulgação profissional'
                                          : 'Generate the same project in 3 styles for professional marketing'}
                                      </div>
                                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                                        {([
                                          { key:'night', emoji:'🌙', label: humanLang==='pt-BR'?'Noturno':'Night',
                                            suffix: 'STYLE: stunning nighttime render — warm amber and gold interior light glowing from windows, soft exterior LED uplighting along walls and landscaping, dramatic dark sky, cozy intimate atmosphere, luxury architectural night photography quality' },
                                          { key:'minimal', emoji:'☀️', label: humanLang==='pt-BR'?'Minimalista':'Minimal',
                                            suffix: 'STYLE: bright minimalist render — abundant natural daylight flooding the space, clean white and warm ivory palette, Scandinavian aesthetic, soft overcast sky, spacious and airy feeling, crisp clean lines' },
                                          { key:'watercolor', emoji:'🎨', label: humanLang==='pt-BR'?'Aquarela':'Watercolor',
                                            suffix: 'STYLE: artistic watercolor architectural illustration — hand-painted appearance, warm pastel tones, visible brush strokes on surfaces, architectural sketch quality, artistic and elegant presentation style' },
                                        ] as const).map(style => (
                                          <div key={style.key} style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                                            <button
                                              disabled={!!variantsLoading[style.key]}
                                              onClick={() => {
                                                setVariantsLoading(p => ({...p, [style.key]: true}))
                                                setGeminiVariants(p => ({...p, [style.key]: null}))
                                                const baseP = humanAnaliseTipo === 'planta'
                                                  ? `Transform this top-down floor plan into a photorealistic bird's-eye humanized visualization. CRITICAL: Keep EXACTLY the same top-down perspective and floor plan geometry. Do NOT invent new walls or rooms. Add: realistic flooring per room, high-end furniture scale 1:${humanEscala}, ${humanNP} people at 1.70m, swimming pool if space allows. EXTERIOR: ${humanLote}, ${humanVeg}, sidewalk, parked luxury car, shadow projection.`
                                                  : humanAnaliseTipo === 'fachada'
                                                  ? `Transform this building facade into a photorealistic exterior render. CRITICAL: Keep EXACTLY the same camera angle and facade geometry. Add: photorealistic wall materials and roof, premium doors, ${humanVeg} along wall and sidewalk, luxury dark vehicle in driveway.`
                                                  : humanAnaliseTipo === 'interior'
                                                  ? `Transform this 3D interior into a photorealistic render. CRITICAL: Keep EXACTLY the same camera position and room layout. Add: photorealistic flooring, walls, ceiling, LED recessed lights and strip lights, premium cabinets and stone countertops, stainless appliances, ${humanNP} person at 1.70m doing activity.`
                                                  : `Transform this cross-section into a photorealistic rendered section. CRITICAL: Keep EXACTLY the same geometry. Add: photorealistic materials, interior spaces with furniture and people at scale.`
                                                const fullP = `You are an expert architectural visualizer. ${baseP}\n\n${style.suffix}\n\nNo text overlays. Seed:${Date.now()}`
                                                fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
                                                  body: JSON.stringify({ model:'gemini-2.0-flash-exp', contents:[{role:'user',parts:[{inlineData:{mimeType:humanImgType,data:humanB64}},{text:fullP}]}], generationConfig:{responseModalities:['TEXT','IMAGE']} })
                                                }).then(async r => {
                                                  const d = await r.json()
                                                  const ip = (d?.candidates?.[0]?.content?.parts??[]).find((x: any) => x.inlineData?.data)
                                                  if (ip) setGeminiVariants(p => ({...p, [style.key]: ip.inlineData.data}))
                                                }).catch(() => {}).finally(() => setVariantsLoading(p => ({...p, [style.key]: false})))
                                              }}
                                              style={{ padding:'8px 6px', border:`1.5px solid ${geminiVariants[style.key] ? '#22c55e' : '#e5e8f0'}`,
                                                borderRadius:8, background: geminiVariants[style.key] ? '#f0fdf4' : variantsLoading[style.key] ? '#faf5ff' : '#fafafa',
                                                cursor: variantsLoading[style.key] ? 'wait' : 'pointer', fontFamily:'inherit',
                                                display:'flex', flexDirection:'column' as const, alignItems:'center', gap:4, width:'100%' }}>
                                              <span style={{ fontSize:18 }}>{variantsLoading[style.key] ? '⏳' : style.emoji}</span>
                                              <span style={{ fontSize:9, fontWeight:600, color: geminiVariants[style.key] ? '#16a34a' : '#5a6282', lineHeight:1.2 }}>
                                                {variantsLoading[style.key] ? (humanLang==='pt-BR'?'Gerando...':'Generating...') : style.label}
                                              </span>
                                            </button>
                                            {geminiVariants[style.key] && (
                                              <div style={{ position:'relative' as const, borderRadius:6, overflow:'hidden' as const }}>
                                                <img src={`data:image/jpeg;base64,${geminiVariants[style.key]!}`} alt={style.label}
                                                  style={{ width:'100%', display:'block', aspectRatio:'4/3', objectFit:'cover' as const }} />
                                                <a href={`data:image/jpeg;base64,${geminiVariants[style.key]!}`} download={`render-${style.key}-${humanTipo.replace(/ /g,'-')}.jpg`}
                                                  style={{ position:'absolute' as const, bottom:4, right:4, background:'rgba(0,0,0,.7)', color:'#fff',
                                                    borderRadius:4, padding:'3px 6px', fontSize:9, textDecoration:'none', display:'inline-flex', gap:3 }}>
                                                  ⬇️
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* ── Video Reel Generator (full featured) ── */}
                                {(geminiRenderB64 || pollinationsUrl) && (() => {
                                  // helper: draw image centered+scaled to fill canvas
                                  function applyTransform(ctx2: CanvasRenderingContext2D, img2: HTMLImageElement,
                                    scale: number, panX: number, panY: number, rotation = 0) {
                                    const iA = img2.width / img2.height
                                    let dW = 1080, dH = 1080 / iA
                                    if (dH < 1920) { dH = 1920; dW = 1920 * iA }
                                    ctx2.save()
                                    ctx2.translate(540 + panX, 960 + panY)
                                    if (rotation !== 0) ctx2.rotate(rotation)
                                    ctx2.scale(scale, scale)
                                    ctx2.drawImage(img2, -dW/2, -dH/2, dW, dH)
                                    ctx2.restore()
                                  }
                                  const EFFECTS = [
                                    { key:'kenburns-in',  label: 'Ken Burns ↗', fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1+0.16*t, -50*t, -25*t) },
                                    { key:'kenburns-out', label: 'Zoom Out ↙', fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1.16-0.16*t, 50*(1-t), 25*(1-t)) },
                                    { key:'pan-right',    label: 'Pan → Dir',  fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1.12, -120+240*t, 0) },
                                    { key:'pan-left',     label: 'Pan ← Esq',  fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1.12, 120-240*t, 0) },
                                    { key:'pan-down',     label: 'Pan ↓ Des',  fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1.12, 0, -100+200*t) },
                                    { key:'rotate-zoom',  label: 'Rotate+Zoom', fn: (ctx2: CanvasRenderingContext2D, img2: HTMLImageElement, t: number) => applyTransform(ctx2, img2, 1+0.1*t, 0, 0, (-0.04+0.08*t)*Math.PI) },
                                  ]
                                  const imgCount = 1 + Object.values(geminiVariants).filter(Boolean).length
                                  return (
                                  <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, overflow:'hidden' as const }}>
                                    <div style={{ padding:'10px 16px', background:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
                                      <span style={{ fontSize:14 }}>🎬</span>
                                      <div style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff' }}>
                                        {humanLang==='pt-BR' ? 'Vídeo Reel — Instagram / TikTok' : 'Video Reel — Instagram / TikTok'}
                                      </div>
                                      <div style={{ fontSize:9, color:'#475569' }}>9:16 • {imgCount * 5}s</div>
                                    </div>

                                    <div style={{ padding:'14px', display:'flex', flexDirection:'column' as const, gap:12 }}>

                                      {/* Phone preview */}
                                      <div style={{ display:'flex', justifyContent:'center', background:'#0f172a', borderRadius:8, padding:'14px' }}>
                                        <div style={{ width:130, aspectRatio:'9/16' as any, overflow:'hidden', position:'relative' as const,
                                          borderRadius:16, boxShadow:'0 12px 32px rgba(0,0,0,.7)', background:'#000' }}>
                                          <img src={geminiRenderB64 ? `data:image/jpeg;base64,${geminiRenderB64}` : pollinationsUrl!}
                                            alt="Reel" className="reel-kenburns"
                                            key={(geminiRenderB64 ?? pollinationsUrl ?? '').slice(-20)}
                                            style={{ width:'100%', height:'100%', objectFit:'cover' as const, display:'block' }} />
                                          <div style={{ position:'absolute' as const, inset:0,
                                            background:'linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 50%)',
                                            display:'flex', flexDirection:'column' as const, justifyContent:'flex-end', padding:'10px 8px' }}>
                                            <div style={{ fontSize:9, fontWeight:700, color:'#fff', lineHeight:1.3 }}>
                                              {humanTipo.charAt(0).toUpperCase()+humanTipo.slice(1)}
                                            </div>
                                            <div style={{ fontSize:7, color:'rgba(255,255,255,.65)', marginTop:2 }}>
                                              Visualização Arquitetônica Premium
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Camera Effect selector */}
                                      <div>
                                        <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const,
                                          letterSpacing:'.08em', marginBottom:6 }}>
                                          {humanLang==='pt-BR' ? '🎥 Efeito de Câmera' : '🎥 Camera Effect'}
                                        </div>
                                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
                                          {[{key:'auto', label:'🎲 Auto'}, ...EFFECTS.map(e => ({key:e.key, label: e.label}))].map(ef => (
                                            <button key={ef.key} onClick={() => setReelEffect(ef.key)}
                                              style={{ padding:'6px 4px', border:`1.5px solid ${reelEffect===ef.key?'#3b82f6':'#e5e8f0'}`,
                                                borderRadius:6, background: reelEffect===ef.key?'#eff6ff':'#fafafa',
                                                cursor:'pointer', fontFamily:'inherit', fontSize:9, fontWeight:600,
                                                color: reelEffect===ef.key?'#3b82f6':'#5a6282', lineHeight:1.3, textAlign:'center' as const }}>
                                              {ef.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* AI Narration section */}
                                      <div style={{ background:'#f8f9fc', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column' as const, gap:8 }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:'#8890a0', textTransform:'uppercase' as const, letterSpacing:'.08em' }}>
                                          🎙️ {humanLang==='pt-BR' ? 'Narração com IA' : 'AI Narration'}
                                        </div>
                                        {reelNarration ? (
                                          <textarea value={reelNarration} onChange={e => setReelNarration(e.target.value)}
                                            rows={4} style={{ width:'100%', padding:'8px', border:'1px solid #e5e8f0', borderRadius:6,
                                              fontSize:11, fontFamily:'inherit', resize:'vertical' as const, color:'#1a1f36', background:'#fff', boxSizing:'border-box' as const }} />
                                        ) : (
                                          <div style={{ fontSize:10, color:'#8890a0', lineHeight:1.5 }}>
                                            {humanLang==='pt-BR'
                                              ? 'Gere um roteiro de vendas em PT-BR com narração por voz Gemini (áudio .webm)'
                                              : 'Generate a sales script in PT-BR with Gemini voice narration (audio .webm)'}
                                          </div>
                                        )}
                                        <div style={{ display:'flex', gap:8 }}>
                                          <button disabled={reelNarrationLoading}
                                            onClick={async () => {
                                              setReelNarrationLoading(true)
                                              setReelAudioB64(null)
                                              try {
                                                // 1. Generate script text via Gemini
                                                const scriptR = await fetch('/api/gemini', {
                                                  method:'POST', headers:{'Content-Type':'application/json'},
                                                  body: JSON.stringify({ model:'gemini-2.0-flash', contents:[{role:'user',parts:[{text:
                                                    `Escreva um roteiro de narração de vídeo de 15 segundos em português brasileiro profissional e elegante para um vídeo de marketing imobiliário de um projeto "${humanTipo}" de estilo "${humanEstilo}". Máximo 5 frases curtas. Linguagem premium, inspiradora. Sem hashtags. Apenas o texto da narração.`
                                                  }]}] })
                                                })
                                                const scriptD = await scriptR.json()
                                                const scriptText = scriptD?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `Descubra o projeto premium ${humanTipo}. Design exclusivo com acabamentos de alto padrão. Um espaço que une elegância e funcionalidade. Viva a experiência da arquitetura de excelência.`
                                                setReelNarration(scriptText)

                                                // 2. Generate audio via Gemini TTS
                                                const audioR = await fetch('/api/gemini', {
                                                  method:'POST', headers:{'Content-Type':'application/json'},
                                                  body: JSON.stringify({
                                                    model:'gemini-2.0-flash-exp',
                                                    contents:[{role:'user',parts:[{text: scriptText}]}],
                                                    generationConfig:{ responseModalities:['AUDIO'], speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName:'Aoede' } } } }
                                                  })
                                                })
                                                const audioD = await audioR.json()
                                                const audioPart = (audioD?.candidates?.[0]?.content?.parts??[]).find((p: any) => p.inlineData?.data)
                                                if (audioPart) setReelAudioB64(audioPart.inlineData.data)
                                              } catch(e: any) {
                                                console.error('Narration error:', e)
                                              } finally {
                                                setReelNarrationLoading(false)
                                              }
                                            }}
                                            style={{ flex:1, padding:'7px 10px', background: reelNarrationLoading ? '#64748b' : '#4f46e5',
                                              color:'#fff', border:'none', borderRadius:6, fontSize:10, fontWeight:600,
                                              cursor: reelNarrationLoading ? 'wait' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                                            {reelNarrationLoading ? '⏳ Gerando...' : '✨ Gerar Roteiro + Voz'}
                                          </button>
                                          {reelAudioB64 && (
                                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#16a34a', fontWeight:600 }}>
                                              🎵 Voz pronta
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Generate + download */}
                                      <div style={{ display:'flex', gap:8 }}>
                                        <button disabled={reelGenerating}
                                          onClick={async () => {
                                            if (reelVideoUrl) { URL.revokeObjectURL(reelVideoUrl); setReelVideoUrl(null) }
                                            setReelGenerating(true)
                                            try {
                                              // Collect images
                                              const allB64: string[] = []
                                              if (geminiRenderB64) allB64.push(geminiRenderB64)
                                              ;(['night','minimal','watercolor'] as const).forEach(k => { if (geminiVariants[k]) allB64.push(geminiVariants[k]!) })

                                              const canvas = document.createElement('canvas')
                                              canvas.width = 1080; canvas.height = 1920
                                              const ctx2 = canvas.getContext('2d')!

                                              const imgs = await Promise.all(allB64.slice(0,4).map(b64 => new Promise<HTMLImageElement>((res, rej) => {
                                                const im = new Image(); im.onload = () => res(im); im.onerror = rej
                                                im.src = `data:image/jpeg;base64,${b64}`
                                              })))
                                              if (!imgs.length) { setReelGenerating(false); return }

                                              // Build per-segment effect list
                                              const effectFns = imgs.map((_, i) => {
                                                if (reelEffect === 'auto') {
                                                  return EFFECTS[i % EFFECTS.length].fn
                                                }
                                                return (EFFECTS.find(e => e.key === reelEffect) || EFFECTS[0]).fn
                                              })

                                              // Audio setup
                                              let audioCtx: AudioContext|null = null
                                              let audioDestination: MediaStreamAudioDestinationNode|null = null
                                              if (reelAudioB64) {
                                                try {
                                                  audioCtx = new AudioContext({ sampleRate: 24000 })
                                                  audioDestination = audioCtx.createMediaStreamDestination()
                                                  // Decode PCM-16 at 24kHz
                                                  const raw = atob(reelAudioB64)
                                                  const bytes = new Uint8Array(raw.length)
                                                  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
                                                  const int16 = new Int16Array(bytes.buffer)
                                                  const audioBuffer = audioCtx.createBuffer(1, int16.length, 24000)
                                                  const ch = audioBuffer.getChannelData(0)
                                                  for (let i = 0; i < int16.length; i++) ch[i] = int16[i] / 32768.0
                                                  const src = audioCtx.createBufferSource()
                                                  src.buffer = audioBuffer
                                                  src.connect(audioDestination)
                                                  src.start(0)
                                                } catch(e) { audioCtx = null; audioDestination = null }
                                              }

                                              // MediaRecorder setup
                                              const videoStream = canvas.captureStream(30)
                                              const allTracks = [...videoStream.getTracks()]
                                              if (audioDestination) allTracks.push(...audioDestination.stream.getAudioTracks())
                                              const combinedStream = new MediaStream(allTracks)
                                              const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
                                                : MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
                                              const recorder = new MediaRecorder(combinedStream, { mimeType })
                                              const chunks: BlobPart[] = []
                                              recorder.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunks.push(e.data) }

                                              const segDur = 5000 // 5s per image
                                              const totalDur = imgs.length * segDur
                                              const fps = 30; const frameMs = 1000/fps
                                              recorder.start(100)
                                              const t0 = performance.now()
                                              let lastF = t0

                                              await new Promise<void>(resolve => {
                                                function frame() {
                                                  const now = performance.now()
                                                  if (now - lastF < frameMs - 2) { requestAnimationFrame(frame); return }
                                                  lastF = now
                                                  const elapsed = now - t0
                                                  if (elapsed >= totalDur) { recorder.stop(); resolve(); return }

                                                  const segIdx = Math.min(Math.floor(elapsed / segDur), imgs.length-1)
                                                  const segT = (elapsed % segDur) / segDur
                                                  const img2 = imgs[segIdx]

                                                  ctx2.clearRect(0,0,1080,1920)
                                                  effectFns[segIdx](ctx2, img2, segT)

                                                  // Cross-fade transition at segment boundaries
                                                  if (imgs.length > 1) {
                                                    const fadeIn  = segT < 0.12 ? 1 - segT/0.12 : 0
                                                    const fadeOut = segT > 0.88 ? (segT-0.88)/0.12 : 0
                                                    const alpha = Math.max(fadeIn, fadeOut)
                                                    if (alpha > 0) { ctx2.fillStyle=`rgba(0,0,0,${alpha})`; ctx2.fillRect(0,0,1080,1920) }
                                                  }

                                                  // Bottom gradient + text overlay
                                                  const grad = ctx2.createLinearGradient(0,1200,0,1920)
                                                  grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(1,'rgba(0,0,0,0.88)')
                                                  ctx2.fillStyle=grad; ctx2.fillRect(0,0,1080,1920)

                                                  // Caption: narration line (if available)
                                                  if (reelNarration) {
                                                    const lines = reelNarration.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean)
                                                    const lineIdx = Math.floor((elapsed/totalDur)*lines.length)
                                                    const line = lines[Math.min(lineIdx, lines.length-1)] || ''
                                                    ctx2.fillStyle='rgba(255,255,255,0.85)'; ctx2.font='italic 34px Georgia,serif'
                                                    ctx2.textAlign='center' as CanvasTextAlign
                                                    // Word wrap
                                                    const words = line.split(' '); let curLine=''; const wrapped: string[]=[]
                                                    for (const w of words) {
                                                      const test = curLine ? curLine+' '+w : w
                                                      if (ctx2.measureText(test).width > 900) { wrapped.push(curLine); curLine=w }
                                                      else curLine=test
                                                    }
                                                    if (curLine) wrapped.push(curLine)
                                                    wrapped.forEach((l,li) => ctx2.fillText(l, 540, 1560+li*44))
                                                  }

                                                  // Title + brand
                                                  ctx2.textAlign='center' as CanvasTextAlign
                                                  ctx2.fillStyle='rgba(255,255,255,0.38)'; ctx2.font='26px sans-serif'
                                                  ctx2.fillText('✦  Arquitetura & Design  ✦', 540, 1680)
                                                  ctx2.fillStyle='#fff'; ctx2.font='bold 48px sans-serif'
                                                  const title2 = humanTipo.charAt(0).toUpperCase()+humanTipo.slice(1)
                                                  ctx2.fillText(title2.length>22?title2.slice(0,20)+'…':title2, 540, 1746)
                                                  ctx2.fillStyle='rgba(255,255,255,0.6)'; ctx2.font='28px sans-serif'
                                                  ctx2.fillText('Visualização Arquitetônica Premium', 540, 1800)
                                                  ctx2.fillStyle='rgba(255,255,255,0.3)'; ctx2.font='20px sans-serif'
                                                  ctx2.fillText('AI Construction Intelligence Platform', 540, 1852)

                                                  // Segment indicator dots
                                                  if (imgs.length > 1) {
                                                    imgs.forEach((_, di) => {
                                                      ctx2.beginPath()
                                                      ctx2.arc(540 + (di - (imgs.length-1)/2)*20, 1882, di===segIdx?5:3, 0, Math.PI*2)
                                                      ctx2.fillStyle = di===segIdx ? '#fff' : 'rgba(255,255,255,0.35)'
                                                      ctx2.fill()
                                                    })
                                                  }
                                                  requestAnimationFrame(frame)
                                                }
                                                requestAnimationFrame(frame)
                                              })
                                              await new Promise<void>(r => { recorder.onstop = () => r() })
                                              if (audioCtx) audioCtx.close()
                                              const blob = new Blob(chunks, { type:'video/webm' })
                                              setReelVideoUrl(URL.createObjectURL(blob))
                                            } catch(e: any) {
                                              console.error('Reel error:', e)
                                            } finally {
                                              setReelGenerating(false)
                                            }
                                          }}
                                          style={{ flex:1, padding:'10px 14px', background: reelGenerating?'#64748b':'#e11d48',
                                            color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:600,
                                            cursor: reelGenerating?'wait':'pointer', fontFamily:'inherit',
                                            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                                          {reelGenerating ? '⏳ Renderizando...' : `🎬 Gerar Vídeo${reelAudioB64?' + Voz':''}`}
                                        </button>
                                        {reelVideoUrl && (
                                          <a href={reelVideoUrl} download={`reel-${humanTipo.replace(/ /g,'-')}.webm`}
                                            style={{ padding:'10px 14px', background:'#16a34a', color:'#fff',
                                              border:'none', borderRadius:8, fontSize:12, fontWeight:600,
                                              textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                                            ⬇️ .webm
                                          </a>
                                        )}
                                      </div>

                                      <div style={{ fontSize:9, color:'#8890a0', lineHeight:1.5, textAlign:'center' as const }}>
                                        {imgCount} cena(s) × 5s = {imgCount*5}s • {reelAudioB64?'🎵 com narração':'sem áudio'} • 1080×1920 • CapCut / Premiere / Reels
                                      </div>
                                    </div>
                                  </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              /* Empty state — shown only before analysis runs, not when there is an error */
                              !geminiRenderLoading && !geminiRenderError && (
                                <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:12, padding:48, color:'#8890a0', textAlign:'center' as const }}>
                                  <div style={{ fontSize:48 }}>🎨</div>
                                  <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>
                                    {humanLang==='pt-BR'?'Renderização IA':'AI Render'}
                                  </div>
                                  <div style={{ fontSize:11, lineHeight:1.6, maxWidth:280 }}>
                                    {humanLang==='pt-BR'
                                      ?'Envie uma planta e clique em "Gerar Análise" — o render aparece automaticamente.'
                                      :'Upload a floor plan and click "Analyze" — the render appears automatically.'}
                                  </div>
                                </div>
                              )
                            )}

                            {/* Gemini error note (small, non-blocking) */}
                            {geminiRenderError && !geminiRenderLoading && (
                              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6,
                                padding:'8px 12px', fontSize:10, color:'#7f1d1d', display:'flex', gap:8, alignItems:'flex-start' }}>
                                <span style={{ flexShrink:0 }}>⚠️</span>
                                <span>Gemini image-to-image: {geminiRenderError.slice(0, 120)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Tab: Paleta ── */}
                        {!humanLoading && humanTab === 'palette' && (
                          <div style={{ display:'flex', flexDirection:'column' as const, gap:14 }}>
                            {geminiPaletteLoading && (
                              <div style={{ display:'flex', alignItems:'center', gap:12, padding:32, color:'#8890a0' }}>
                                <div style={{ width:24, height:24, border:'2px solid #534AB7', borderTopColor:'transparent',
                                  borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                                <div style={{ fontSize:12 }}>Gemini sugerindo paleta de cores...</div>
                              </div>
                            )}
                            {!geminiPaletteLoading && geminiPalette.length > 0 && (
                              <>
                                <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36' }}>🎭 Paleta de Cores Recomendada</div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                  {geminiPalette.map((c,i) => (
                                    <div key={i} style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, overflow:'hidden' as const }}>
                                      <div style={{ height:64, background:c.hex }} />
                                      <div style={{ padding:'10px 12px' }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36', marginBottom:2 }}>{c.name}</div>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>{c.hex}</div>
                                          <button onClick={() => navigator.clipboard.writeText(c.hex)}
                                            style={{ fontSize:10, padding:'2px 7px', background:'#f0f4f8', border:'none',
                                              borderRadius:4, cursor:'pointer', color:'#5a6282', fontFamily:'inherit' }}>
                                            Copiar
                                          </button>
                                        </div>
                                        <div style={{ fontSize:10, color:'#b0b8cc', marginTop:4 }}>{c.usage}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {!geminiPaletteLoading && geminiPaletteError && (
                              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'12px 14px', fontSize:11, color:'#7f1d1d' }}>
                                <div style={{ fontWeight:600, marginBottom:4 }}>⚠️ Erro ao gerar paleta</div>
                                <div style={{ marginBottom:8 }}>{geminiPaletteError.slice(0, 150)}</div>
                                <button onClick={() => {
                                  const ctx = Object.values(humanResult).join('\n').slice(0, 1200)
                                  if (!ctx) return
                                  setGeminiPaletteLoading(true); setGeminiPaletteError(null)
                                  fetch('/api/gemini',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model:'gemini-2.0-flash', contents:[{role:'user',parts:[{text:`Based on this architectural analysis of a "${humanTipo}" building, suggest exactly 6 professional colors.\nAnalysis: ${ctx}\nReturn ONLY a JSON array: [{"name":"...","hex":"#...","usage":"..."},...]`}]}] }) }).then(async r=>{const d=await r.json(); if(d?.error?.message){setGeminiPaletteError(d.error.message);return} const t=d?.candidates?.[0]?.content?.parts?.[0]?.text||''; const m=t.match(/\[[\s\S]*?\]/); if(m){try{setGeminiPalette(JSON.parse(m[0]));setGeminiPaletteError(null)}catch{setGeminiPaletteError('Parse error')}}else setGeminiPaletteError('Sem resposta')}).catch((e:any)=>setGeminiPaletteError(e.message)).finally(()=>setGeminiPaletteLoading(false))
                                }} style={{ padding:'5px 12px', background:'#534AB7', color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                  🔄 Tentar novamente
                                </button>
                              </div>
                            )}
                            {!geminiPaletteLoading && !geminiPaletteError && geminiPalette.length === 0 && (
                              <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:10, padding:48, color:'#8890a0', textAlign:'center' as const }}>
                                <div style={{ fontSize:36 }}>🎭</div>
                                <div style={{ fontSize:12 }}>Paleta será gerada automaticamente após análise.</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Tab: Marketing ── */}
                        {!humanLoading && humanTab === 'marketing' && (
                          <div style={{ display:'flex', flexDirection:'column' as const, gap:14 }}>
                            {geminiMarketingLoading && (
                              <div style={{ display:'flex', alignItems:'center', gap:12, padding:32, color:'#8890a0' }}>
                                <div style={{ width:24, height:24, border:'2px solid #534AB7', borderTopColor:'transparent',
                                  borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                                <div style={{ fontSize:12 }}>Gemini criando textos de marketing...</div>
                              </div>
                            )}
                            {!geminiMarketingLoading && geminiMarketing && (
                              <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, overflow:'hidden' as const }}>
                                <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e8f0', background:'#f8f9fc',
                                  display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                  <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36' }}>📣 Copy de Marketing Imobiliário</div>
                                  <button onClick={() => navigator.clipboard.writeText(geminiMarketing)}
                                    style={{ fontSize:10, padding:'3px 9px', background:'#fff', border:'1px solid #e5e8f0',
                                      borderRadius:5, cursor:'pointer', color:'#5a6282', fontFamily:'inherit' }}>
                                    📋 Copiar tudo
                                  </button>
                                </div>
                                <div style={{ padding:'16px', fontSize:12, lineHeight:1.85, color:'#1a1f36' }}
                                  dangerouslySetInnerHTML={{ __html: geminiMarketing
                                    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:#185FA5">$1</strong>')
                                    .replace(/^##\s+(.+)$/gm,'<h3 style="color:#534AB7;font-size:13px;margin:16px 0 6px">$1</h3>')
                                    .replace(/^###\s+(.+)$/gm,'<h4 style="color:#534AB7;font-size:12px;margin:12px 0 4px">$1</h4>')
                                    .replace(/^[-•*]\s+(.+)$/gm,'<div style="padding:4px 0 4px 16px;border-left:3px solid #534AB7;margin:3px 0">$1</div>')
                                    .replace(/\n\n/g,'<br/><br/>')
                                    .replace(/\n/g,'<br/>') }} />
                              </div>
                            )}
                            {!geminiMarketingLoading && geminiMarketingError && (
                              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'12px 14px', fontSize:11, color:'#7f1d1d' }}>
                                <div style={{ fontWeight:600, marginBottom:4 }}>⚠️ Erro ao gerar marketing</div>
                                <div style={{ marginBottom:8 }}>{geminiMarketingError.slice(0, 150)}</div>
                                <button onClick={() => {
                                  const ctx = Object.values(humanResult).join('\n').slice(0, 1200)
                                  if (!ctx) return
                                  setGeminiMarketingLoading(true); setGeminiMarketingError(null)
                                  fetch('/api/gemini',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model:'gemini-2.0-flash', contents:[{role:'user',parts:[{text:`Você é copywriter imobiliário de alto padrão. Crie textos de marketing para um imóvel "${humanTipo}":\n${ctx}\n\nCrie: **Headline**, **Subtítulo**, **Descrição** (2 parágrafos), **Diferenciais** (5 bullet points com emojis), **Call to Action**`}]}] }) }).then(async r=>{const d=await r.json(); if(d?.error?.message){setGeminiMarketingError(d.error.message);return} const t=d?.candidates?.[0]?.content?.parts?.[0]?.text||''; if(t){setGeminiMarketing(t);setGeminiMarketingError(null)}else setGeminiMarketingError('Sem resposta')}).catch((e:any)=>setGeminiMarketingError(e.message)).finally(()=>setGeminiMarketingLoading(false))
                                }} style={{ padding:'5px 12px', background:'#534AB7', color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                  🔄 Tentar novamente
                                </button>
                              </div>
                            )}
                            {!geminiMarketingLoading && !geminiMarketingError && !geminiMarketing && (
                              <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:10, padding:48, color:'#8890a0', textAlign:'center' as const }}>
                                <div style={{ fontSize:36 }}>📣</div>
                                <div style={{ fontSize:12 }}>Textos de marketing serão gerados automaticamente após análise.</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Tab: Assistente ── */}
                        {!humanLoading && humanTab === 'assistant' && (
                          <div style={{ display:'flex', flexDirection:'column' as const, gap:10 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36', marginBottom:4 }}>
                              💬 Assistente do Projeto
                            </div>
                            <div style={{ fontSize:11, color:'#8890a0', lineHeight:1.5, marginBottom:8 }}>
                              Tire dúvidas sobre a planta, pede sugestões de layout, materiais, cores ou acabamentos.
                            </div>
                            {/* Messages */}
                            <div style={{ display:'flex', flexDirection:'column' as const, gap:8, maxHeight:320, overflowY:'auto' as const }}>
                              {humanAssistantMsgs.length === 0 && (
                                <div style={{ background:'#f0f4f8', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#5a6282', lineHeight:1.6 }}>
                                  Olá! Sou seu assistente de projeto. Posso responder sobre:<br/>
                                  • Sugestões de layout e circulação<br/>
                                  • Materiais e acabamentos<br/>
                                  • Normas ABNT para o ambiente<br/>
                                  • Melhorias de iluminação e ventilação
                                </div>
                              )}
                              {humanAssistantMsgs.map((msg, i) => (
                                <div key={i} style={{ display:'flex', flexDirection:'column' as const, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap:4 }}>
                                  <div style={{ maxWidth:'85%', padding:'9px 13px', borderRadius:12, fontSize:12, lineHeight:1.65,
                                    whiteSpace:'pre-wrap' as const,
                                    background: msg.role === 'user' ? '#534AB7' : '#f4f6fb',
                                    color: msg.role === 'user' ? '#fff' : '#1a1f36',
                                    borderBottomRightRadius: msg.role === 'user' ? 2 : 12,
                                    borderBottomLeftRadius: msg.role === 'assistant' ? 2 : 12 }}>
                                    {msg.text}
                                  </div>
                                  {msg.role === 'assistant' && humanB64 && humanImgType !== 'application/pdf' && (
                                    <button onClick={() => {
                                      setGeminiRenderB64(null); setGeminiRenderError(null); setGeminiRenderLoading(true); setPollinationsUrl(null)
                                      setHumanTab('render')
                                      const assistantSuggestions = msg.text
                                      const p = (humanAnaliseTipo === 'planta'
                                        ? `You are an expert architectural visualizer. Transform this top-down floor plan into a photorealistic bird's-eye humanized visualization.\n\nCRITICAL: Keep EXACTLY the same top-down perspective and floor plan geometry. Do NOT invent new walls or rooms.\n\nBase render: realistic flooring per room, furniture scale 1:${humanEscala}, ${humanNP} people at 1.70m, indoor plants & decor, swimming pool if space allows. EXTERIOR: ${humanLote}, ${humanVeg}, sidewalk, parked luxury car, shadow projection. Natural overhead sunlight. Style: ${humanEstilo}.`
                                        : humanAnaliseTipo === 'fachada'
                                        ? `You are an expert architectural visualizer. Transform this building facade into a photorealistic exterior render.\n\nCRITICAL: Keep EXACTLY the same camera angle and facade geometry.\n\nBase render: photorealistic wall materials, roof covering, premium doors, golden-hour sunlight, ${humanVeg} along wall and sidewalk, luxury vehicle in driveway, sky with clouds. Style: ${humanEstilo}.`
                                        : humanAnaliseTipo === 'interior'
                                        ? `You are an expert architectural visualizer. Transform this 3D interior into a photorealistic render.\n\nCRITICAL: Keep EXACTLY the same camera position and room layout.\n\nBase render: photorealistic flooring/walls/ceiling, LED recessed spots and strip lights, premium cabinets and stone countertops, stainless appliances, ${humanNP} person at 1.70m, elegant decor. Style: ${humanEstilo}.`
                                        : `You are an expert architectural visualizer. Transform this cross-section into a photorealistic rendered section.\n\nCRITICAL: Keep EXACTLY the same geometry.\n\nBase render: photorealistic materials, interior spaces with furniture and people at scale. Style: ${humanEstilo}.`
                                      ) + `\n\nADDITIONAL INSTRUCTIONS FROM CONSULTANT:\n${assistantSuggestions}\n\nApply these suggestions in the render. No text overlays. Seed:${Date.now()}`
                                      fetch('/api/gemini',{ method:'POST', headers:{'Content-Type':'application/json'},
                                        body:JSON.stringify({ model:'gemini-2.0-flash-exp', contents:[{role:'user',parts:[{inlineData:{mimeType:humanImgType,data:humanB64}},{text:p}]}], generationConfig:{responseModalities:['TEXT','IMAGE']} })
                                      }).then(async r=>{const d=await r.json(); if(d?.error?.message){setGeminiRenderError(d.error.message);return} const ip=(d?.candidates?.[0]?.content?.parts??[]).find((x:any)=>x.inlineData?.data); if(ip){setGeminiRenderB64(ip.inlineData.data);setGeminiRenderError(null)}else setGeminiRenderError('Sem imagem.')}).catch((e:any)=>setGeminiRenderError(e.message)).finally(()=>setGeminiRenderLoading(false))
                                    }}
                                      style={{ fontSize:10, padding:'3px 9px', background:'linear-gradient(135deg,#534AB7,#7c3aed)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                                      🎨 Aplicar no Render
                                    </button>
                                  )}
                                </div>
                              ))}
                              {humanAssistantLoading && (
                                <div style={{ display:'flex', gap:6, padding:'8px 12px' }}>
                                  {[0,1,2].map(i => (
                                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#534AB7',
                                      animation:`bounce .9s ease-in-out ${i*0.15}s infinite` }} />
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Input */}
                            <div style={{ display:'flex', gap:8, marginTop:4 }}>
                              <input
                                value={humanAssistantInput}
                                onChange={e => setHumanAssistantInput(e.target.value)}
                                onKeyDown={async e => {
                                  if (e.key !== 'Enter' || !humanAssistantInput.trim() || humanAssistantLoading) return
                                  const q = humanAssistantInput.trim()
                                  setHumanAssistantInput('')
                                  const newMsgs = [...humanAssistantMsgs, { role: 'user' as const, text: q }]
                                  setHumanAssistantMsgs(newMsgs)
                                  setHumanAssistantLoading(true)
                                  const ctx = Object.entries(humanResult).map(([k,v])=>`${k}:\n${v}`).join('\n\n')
                                  try {
                                    const r = await fetch('/api/chat', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        model: 'claude-sonnet-4-6',
                                        max_tokens: 600,
                                        system: `Você é um assistente especialista em arquitetura e design de interiores. O contexto do projeto é:\n\n${ctx}\n\nResponda de forma concisa e prática em português.`,
                                        messages: newMsgs.map(m => ({ role: m.role, content: m.text }))
                                      })
                                    })
                                    const d = await r.json()
                                    const reply = d?.content?.[0]?.text || 'Desculpe, não consegui responder.'
                                    setHumanAssistantMsgs(prev => [...prev, { role: 'assistant', text: reply }])
                                  } catch {
                                    setHumanAssistantMsgs(prev => [...prev, { role: 'assistant', text: '⚠️ Erro de conexão.' }])
                                  }
                                  setHumanAssistantLoading(false)
                                }}
                                placeholder="Pergunte sobre o projeto..."
                                disabled={humanAssistantLoading || Object.keys(humanResult).length === 0}
                                style={{ flex:1, padding:'9px 12px', border:'1px solid #e5e8f0', borderRadius:8,
                                  fontSize:12, outline:'none', fontFamily:'inherit', color:'#1a1f36' }} />
                              <button
                                disabled={!humanAssistantInput.trim() || humanAssistantLoading || Object.keys(humanResult).length === 0}
                                onClick={async () => {
                                  const q = humanAssistantInput.trim()
                                  if (!q || humanAssistantLoading) return
                                  setHumanAssistantInput('')
                                  const newMsgs = [...humanAssistantMsgs, { role: 'user' as const, text: q }]
                                  setHumanAssistantMsgs(newMsgs)
                                  setHumanAssistantLoading(true)
                                  const ctx = Object.entries(humanResult).map(([k,v])=>`${k}:\n${v}`).join('\n\n')
                                  try {
                                    const r = await fetch('/api/chat', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        model: 'claude-sonnet-4-6',
                                        max_tokens: 600,
                                        system: `Você é um assistente especialista em arquitetura e design de interiores. O contexto do projeto é:\n\n${ctx}\n\nResponda de forma concisa e prática em português.`,
                                        messages: newMsgs.map(m => ({ role: m.role, content: m.text }))
                                      })
                                    })
                                    const d = await r.json()
                                    const reply = d?.content?.[0]?.text || 'Desculpe, não consegui responder.'
                                    setHumanAssistantMsgs(prev => [...prev, { role: 'assistant', text: reply }])
                                  } catch {
                                    setHumanAssistantMsgs(prev => [...prev, { role: 'assistant', text: '⚠️ Erro de conexão.' }])
                                  }
                                  setHumanAssistantLoading(false)
                                }}
                                style={{ width:36, height:36, borderRadius:8, border:'none',
                                  background: humanAssistantInput.trim() && !humanAssistantLoading ? '#534AB7' : '#e5e8f0',
                                  color:'#fff', fontSize:16, cursor: humanAssistantInput.trim() && !humanAssistantLoading ? 'pointer' : 'default',
                                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                ➤
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
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
                  {/* Overlay: loading banner while AI runs */}
                  {unifiedLoading && (
                    <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
                      background:'rgba(26,31,54,.92)', color:'#a8d88a', borderRadius:10,
                      padding:'10px 20px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:10,
                      boxShadow:'0 4px 20px rgba(0,0,0,.5)', backdropFilter:'blur(6px)' }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #3B6D11',
                        borderTopColor:'#a8d88a', animation:'spin .7s linear infinite', flexShrink:0 }} />
                      Atlas BIM Intelligence analisando… aguarde
                    </div>
                  )}
                  {/* Overlay: analysis ready */}
                  {canAnalyze && !unifiedLoading && unifiedAnalysis && viewerTab === 'viewer' && (
                    <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
                      background:'rgba(59,109,17,.95)', color:'#fff', borderRadius:10,
                      padding:'10px 20px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:10,
                      boxShadow:'0 4px 20px rgba(0,0,0,.4)', cursor:'pointer', backdropFilter:'blur(6px)' }}
                      onClick={() => setViewerTab('analysis')}>
                      ✅ Análise pronta — clique para ver
                    </div>
                  )}
                </div>
                )}

                {/* Analysis result tab */}
                {viewerTab === 'analysis' && (
                  <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
                    {/* Left: file preview */}
                    {activePf && (
                      <div style={{ width:'45%', borderRight:'1px solid #e5e8f0', background:'#1a1a2e',
                        display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {isPDF ? (
                          <iframe src={activePf.url} title={activePf.name}
                            style={{ width:'100%', height:'100%', border:'none', display:'block' }} />
                        ) : isImage ? (
                          <img src={activePf.url} alt={activePf.name}
                            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', padding:12,
                              boxShadow:'0 8px 32px rgba(0,0,0,.6)', borderRadius:6 }} />
                        ) : (
                          <div style={{ textAlign:'center' as const, color:'#8890a0', padding:24 }}>
                            <div style={{ fontSize:48, marginBottom:8 }}>{(EXT_META[activePf.ext] ?? { icon:'📎' }).icon}</div>
                            <div style={{ fontSize:13, color:'#e0e4f0' }}>{activePf.name}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Right: analysis */}
                    <div style={{ flex:1, overflowY:'auto' as const, padding:20, background:'#f8f9fc' }}>
                      {unifiedLoading ? (
                        <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', gap:16, padding:60 }}>
                          <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #e5e8f0', borderTopColor:'#3B6D11', animation:'spin .7s linear infinite' }} />
                          <div style={{ fontSize:14, fontWeight:600, color:'#185FA5' }}>Atlas BIM Intelligence analisando...</div>
                          <div style={{ fontSize:12, color:'#8890a0' }}>Memorial Descritivo · Quantitativo · BIM · NBR</div>
                        </div>
                      ) : unifiedAnalysis ? (
                        <>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📊 {activePf?.name}</div>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => {
                                const w = window.open('','_blank','width=900,height=700')
                                if (!w) return
                                w.document.write(`<html><head><title>Análise BIM — ${activePf?.name}</title><style>body{font-family:monospace;padding:32px;font-size:13px;line-height:1.9;color:#1a1f36;white-space:pre-wrap}h1{font-size:18px;margin-bottom:16px}@media print{button{display:none}}</style></head><body><h1>📊 Análise BIM — ${activePf?.name}</h1>${unifiedAnalysis}<br/><br/><button onclick="window.print()">🖨️ Imprimir</button></body></html>`)
                                w.document.close()
                              }} style={{ padding:'5px 11px', background:'#185FA5', color:'#fff', border:'none', borderRadius:6, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                🖨️ Imprimir
                              </button>
                              <button onClick={() => window.open('/juridico', '_self')}
                                style={{ padding:'5px 11px', background:'#534AB7', color:'#fff', border:'none', borderRadius:6, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                ⚖️ Jurídico
                              </button>
                            </div>
                          </div>
                          <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, padding:'16px 18px',
                            fontSize:11, lineHeight:1.9, color:'#1a1f36', whiteSpace:'pre-wrap' as const, fontFamily:'monospace' }}>
                            {unifiedAnalysis}
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign:'center' as const, padding:60, color:'#8890a0' }}>
                          <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:8 }}>Análise não iniciada</div>
                          <div style={{ fontSize:12 }}>Carregue uma imagem ou PDF — a análise inicia automaticamente</div>
                        </div>
                      )}
                    </div>
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
