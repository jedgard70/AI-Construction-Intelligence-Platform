import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { trackEvent } from '../lib/tracking'

type StatusItem = {
  name: string
  status: 'ok' | 'atencao' | 'bloqueado'
  detail: string
}

type ModuleRow = {
  id?: string
  label?: string
  module_key?: string
  page?: string
  status?: string
  description?: string
}

type ProjectRow = {
  id: string
  name: string
  status: string
  created_at: string
}

type EventRow = {
  id: string
  source_agent: string
  event_type: string
  summary: string
  priority: string
  created_at: string
}

type AutonomousStatusPayload = {
  system?: { status?: string }
  governance?: {
    destructiveActionsAllowed?: boolean
    criticalDeployAllowed?: boolean
    migrationWithoutApprovalAllowed?: boolean
    requiredApprovals?: Array<{ key: string; description: string; approvalRequired: boolean }>
  }
  execution?: {
    mode?: string
    nextRecommendedBlock?: {
      id: string
      title: string
      risk: string
      priority: string
      approvalRequired: boolean
    } | null
  }
}

type DesignEvolutionPayload = {
  engine?: { name?: string; mode?: string; autoApplyGlobalLayout?: boolean }
  summary?: { total?: number; high?: number; medium?: number; low?: number; nextRecommendedScreens?: string[] }
}

type NextFeaturePayload = {
  nextFeature?: {
    id: string
    title: string
    module: string
    needsApproval: boolean
  }
}

type PrAuditTemplatePayload = {
  template?: {
    scopeChecklist?: string[]
    forbiddenItems?: string[]
    qualityChecks?: string[]
  }
}

export default function MissionControlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [documentsCount, setDocumentsCount] = useState<number | null>(null)
  const [copilotKnowledgeStatus, setCopilotKnowledgeStatus] = useState<'loading' | 'active' | 'unavailable'>('loading')
  const [autonomous, setAutonomous] = useState<AutonomousStatusPayload | null>(null)
  const [autonomousError, setAutonomousError] = useState('')
  const [designEvolution, setDesignEvolution] = useState<DesignEvolutionPayload | null>(null)
  const [designEvolutionError, setDesignEvolutionError] = useState('')
  const [nextFeature, setNextFeature] = useState<NextFeaturePayload | null>(null)
  const [nextFeatureError, setNextFeatureError] = useState('')
  const [prAuditTemplate, setPrAuditTemplate] = useState<PrAuditTemplatePayload | null>(null)
  const [prAuditTemplateError, setPrAuditTemplateError] = useState('')
  const [analyticsAccessToken, setAnalyticsAccessToken] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const sb = getSupabase()
      if (!sb) {
        setCopilotKnowledgeStatus('unavailable')
        router.replace('/login')
        return
      }

      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        setCopilotKnowledgeStatus('unavailable')
        router.replace('/login')
        return
      }
      setAnalyticsAccessToken(session.access_token)

      // Track mission control view
      await trackEvent({
        type: 'mission_control_view',
        page_path: '/mission-control',
      })

      const [modulesRes, projectsRes, eventsRes, docsRes] = await Promise.all([
        sb.from('platform_modules').select('id,module_key,label,page,status,description').order('sort_order', { ascending: true }).limit(40),
        sb.from('projects').select('id,name,status,created_at').order('created_at', { ascending: false }).limit(8),
        sb.from('agent_events').select('id,source_agent,event_type,summary,priority,created_at').order('created_at', { ascending: false }).limit(12),
        sb.from('documents').select('id', { count: 'exact', head: true }),
      ])

      if (modulesRes.error) setError(`Supabase/platform_modules: ${modulesRes.error.message}`)
      setModules((modulesRes.data ?? []) as ModuleRow[])
      setProjects((projectsRes.data ?? []) as ProjectRow[])
      setEvents((eventsRes.data ?? []) as EventRow[])
      setDocumentsCount(docsRes.count ?? null)
      setCopilotKnowledgeStatus(modulesRes.error ? 'unavailable' : 'active')
      setLoading(false)

      try {
        const autonomousRes = await fetch('/api/autonomous/status')
        if (!autonomousRes.ok) {
          setAutonomousError(`Autonomous status indisponivel (${autonomousRes.status})`)
        } else {
          const payload = (await autonomousRes.json()) as AutonomousStatusPayload
          setAutonomous(payload)
        }
      } catch {
        setAutonomousError('Falha ao carregar Autonomous Orchestrator.')
      }

      try {
        const designRes = await fetch('/api/design-evolution/audit')
        if (!designRes.ok) {
          setDesignEvolutionError(`Design Evolution indisponivel (${designRes.status})`)
        } else {
          const payload = (await designRes.json()) as DesignEvolutionPayload
          setDesignEvolution(payload)
        }
      } catch {
        setDesignEvolutionError('Falha ao carregar Design Evolution Engine.')
      }

      try {
        const featureRes = await fetch('/api/autonomous/next-feature')
        if (!featureRes.ok) {
          setNextFeatureError(`Feature Generator indisponivel (${featureRes.status})`)
        } else {
          const payload = (await featureRes.json()) as NextFeaturePayload
          setNextFeature(payload)
        }
      } catch {
        setNextFeatureError('Falha ao carregar Feature Generator.')
      }

      try {
        const prAuditRes = await fetch('/api/autonomous/pr-audit-template')
        if (!prAuditRes.ok) {
          setPrAuditTemplateError(`PR Auditor indisponivel (${prAuditRes.status})`)
        } else {
          const payload = (await prAuditRes.json()) as PrAuditTemplatePayload
          setPrAuditTemplate(payload)
        }
      } catch {
        setPrAuditTemplateError('Falha ao carregar PR Auditor.')
      }
    }

    init()
  }, [router])

  const copilotKnowledgeBadge = useMemo(() => {
    if (copilotKnowledgeStatus === 'loading') {
      return { text: 'Base Apex Copilot carregando...', color: '#ad6800' }
    }
    if (copilotKnowledgeStatus === 'active') {
      return { text: 'Base Apex Copilot ativa (server-side governance)', color: '#2f7d32' }
    }
    return { text: 'Base Apex Copilot indisponivel', color: '#a32d2d' }
  }, [copilotKnowledgeStatus])

  const statusItems = useMemo<StatusItem[]>(() => [
    {
      name: 'Supabase',
      status: error ? 'atencao' : 'ok',
      detail: error || `${projects.length} projetos recentes, ${events.length} eventos de agentes, ${documentsCount ?? 0} documentos registrados.`,
    },
    {
      name: 'GitHub',
      status: 'ok',
      detail: 'Snapshot: origin/main em 13732d3 — fix: compact sidebar navigation spacing (#113). Branch sincronizado, últimos 3 PRs mergeados (#113, #112, #111).',
    },
    {
      name: 'Vercel',
      status: 'ok',
      detail: 'Snapshot: Último deploy em Production/Preview status Ready. PRs #113 e #112 deployaram com sucesso (Deploy to Vercel Preview: success).',
    },
    {
      name: 'Build',
      status: 'ok',
      detail: 'OK: Build & Type Check passou em PR #113 (fix: compact sidebar navigation spacing). npm run build validado, 0 TypeScript errors. Vercel deployment sucesso.',
    },
  ], [documentsCount, error, events.length, projects.length])

  const roadmap = [
    { item: '3.1 Governance Consolidation', status: 'OK', priority: 'Critica' },
    { item: '3.2 Help AI / Apex AI Integration', status: 'OK', priority: 'Critica' },
    { item: '3.3 Owner Command Chat', status: 'OK', priority: 'Critica' },
    { item: '3.4 Supabase Foundation Phase 0', status: 'OK', priority: 'Alta' },
    { item: 'Mission Control Owner Executor', status: 'OK', priority: 'Alta' },
    { item: 'Week 1 Production Reality Check', status: 'Em validacao', priority: 'Alta' },
  ]

  const checklist = [
    ['Nova Analise unificada', true],
    ['Projeto nasce automaticamente', true],
    ['AgentWindow em BIM 3D/BIM OPS/Plantas', true],
    ['Mission Control com Supabase real', !loading],
    ['Copilot global consolidado', true],
    ['Workspace com abas padrao', true],
    ['Owner Executor implementado', true],
    ['Week 1 Production Reality Check documentado', true],
  ]

  const legendItems = [
    { status: 'OK', description: 'Leitura atual ou validacao confirmada - operacao verde.' },
    { status: 'SNAPSHOT', description: 'Informacao documentada/manual, nao conectada em tempo real a API externa.' },
    { status: 'ATENÇÃO', description: 'Erro real, falha ou integracao ausente critica - requer acao.' },
    { status: 'PENDENTE', description: 'Nao implementado - aguardando proxima fase.' },
  ]

  const statusColor = {
    ok: '#2f7d32',
    atencao: '#ad6800',
    bloqueado: '#a32d2d',
  }

  const sectionBadge = (value?: string) => {
    const normalized = (value || '').toLowerCase()
    if (normalized.includes('ok') || normalized.includes('active') || normalized.includes('true')) return 'badge badge-ok'
    if (normalized.includes('pendente') || normalized.includes('atenc') || normalized.includes('guided')) return 'badge badge-warning'
    return 'badge badge-neutral'
  }

  if (loading) {
    return <div className="page"><main className="main">Carregando Mission Control...</main></div>
  }

  return (
    <div className="page">
      <Head>
        <title>Mission Control | AI Construction Platform</title>
      </Head>

      <header className="topbar">
        <button className="btn" onClick={() => router.push('/dashboard')}>Dashboard</button>
        <strong>Mission Control V1</strong>
      </header>

      <main className="main">
        <div className="hero">
          <h1 className="title">Mission Control</h1>
          <p className="sub">Painel central de governanca, status tecnico e proximas acoes da plataforma Apex.</p>
          <div className="chip">
            <span className="chip-dot" style={{ background: copilotKnowledgeBadge.color }} />
            {copilotKnowledgeBadge.text}
          </div>
        </div>

        <section className="status-grid">
          {statusItems.map(item => (
            <div key={item.name} className="card">
              <div className="section-title">{item.name}</div>
              <div className={sectionBadge(item.status)} style={{ color: statusColor[item.status] }}>{item.status.toUpperCase()}</div>
              <p className="small">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Plataforma</h2>
            <span className="badge badge-neutral">Core Operations</span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">Roadmap</div>
              {roadmap.map(item => (
                <div key={item.item} className="row row-3">
                  <strong>{item.item}</strong>
                  <span>{item.status}</span>
                  <span className="muted">{item.priority}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-title">Checklist</div>
              {checklist.map(([label, done]) => (
                <div key={String(label)} className="check-row">
                  <span className={done ? 'badge badge-ok' : 'badge badge-warning'}>{done ? 'OK' : 'PENDENTE'}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card legend-card">
            <div className="section-title">Legenda de Status</div>
            {legendItems.map(item => {
              let badgeClass = 'badge-neutral'
              if (item.status === 'OK') badgeClass = 'badge-ok'
              else if (item.status === 'ATENÇÃO') badgeClass = 'badge-warning'
              else if (item.status === 'SNAPSHOT') badgeClass = 'badge-snapshot'
              return (
                <div key={item.status} className="legend-row">
                  <span className={`badge ${badgeClass}`}>
                    {item.status}
                  </span>
                  <span className="small">{item.description}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Analytics</h2>
            <span className="badge badge-neutral">Real-time Tracking</span>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <AnalyticsDashboard accessToken={analyticsAccessToken} />
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Help AI / ApexCopilot</h2>
            <span className={copilotKnowledgeStatus === 'active' ? 'badge badge-ok' : 'badge badge-warning'}>
              {copilotKnowledgeStatus === 'active' ? 'Ativo' : 'Atencao'}
            </span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">Feature Generator</div>
              {nextFeature?.nextFeature ? (
                <>
                  <div className="strong">
                    {nextFeature.nextFeature.id} - {nextFeature.nextFeature.title}
                  </div>
                  <div className="small">Modulo: {nextFeature.nextFeature.module}</div>
                  <div className="small">Aprovacao obrigatoria: {nextFeature.nextFeature.needsApproval ? 'sim' : 'nao'}</div>
                </>
              ) : (
                <p className="small">Sem especificacao sugerida no momento.</p>
              )}
              {nextFeatureError && <p className="small error">{nextFeatureError}</p>}
            </div>

            <div className="card">
              <div className="section-title">PR Auditor</div>
              {(prAuditTemplate?.template?.scopeChecklist ?? []).length ? (
                prAuditTemplate?.template?.scopeChecklist?.map(item => (
                  <div key={item} className="line-item">
                    <strong>{item}</strong>
                  </div>
                ))
              ) : (
                <p className="small">Template de auditoria ainda nao carregado.</p>
              )}
              {prAuditTemplateError && <p className="small error">{prAuditTemplateError}</p>}
            </div>
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Storage</h2>
            <span className="badge badge-neutral">Foundation + APIs</span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">Modulos</div>
              {modules.length ? modules.map(module => (
                <div key={module.id ?? module.module_key ?? module.label} className="line-item">
                  <strong>{module.label ?? module.module_key}</strong>
                  <div className="small">{module.status ?? 'sem status'} {module.page ? `- ${module.page}` : ''} {module.description ? `- ${module.description}` : ''}</div>
                </div>
              )) : <p className="small">Nenhum registro em platform_modules ou sem permissao de leitura.</p>}
            </div>

            <div className="card">
              <div className="section-title">Projetos recentes</div>
              {projects.map(project => (
                <button key={project.id} onClick={() => router.push(`/projeto/${project.id}`)} className="project-item">
                  <strong>{project.name}</strong>
                  <div className="small">{project.status} - {new Date(project.created_at).toLocaleDateString('pt-BR')}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Autonomous Orchestrator</h2>
            <span className={sectionBadge(autonomous?.execution?.mode)}>{autonomous?.execution?.mode ?? 'guided'}</span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">Bloco recomendado</div>
              {autonomous?.execution?.nextRecommendedBlock ? (
                <div className="panel">
                  <div className="tiny-title">Proximo bloco recomendado</div>
                  <div className="strong">{autonomous.execution.nextRecommendedBlock.id} - {autonomous.execution.nextRecommendedBlock.title}</div>
                  <div className="small">Risco: {autonomous.execution.nextRecommendedBlock.risk} | Prioridade: {autonomous.execution.nextRecommendedBlock.priority}</div>
                </div>
              ) : (
                <p className="small">Sem bloco recomendado no momento.</p>
              )}
              {autonomousError && <p className="small error">{autonomousError}</p>}
            </div>

            <div className="card">
              <div className="section-title">Aprovacao obrigatoria</div>
              {autonomous?.governance?.requiredApprovals?.length ? autonomous.governance.requiredApprovals.map(item => (
                <div key={item.key} className="line-item">
                  <strong>{item.key}</strong>
                  <div className="small">{item.description}</div>
                </div>
              )) : (
                <p className="small">Sem regras carregadas pela API de autonomia.</p>
              )}
            </div>
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>Design Evolution</h2>
            <span className={designEvolution?.engine?.autoApplyGlobalLayout ? 'badge badge-ok' : 'badge badge-warning'}>
              {designEvolution?.engine?.mode ?? 'advisory'}
            </span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">Motor de evolucao</div>
              <div className="small">Modo: <strong>{designEvolution?.engine?.mode ?? 'advisory'}</strong></div>
              <div className="small">Auto aplicar layout global: <strong>{designEvolution?.engine?.autoApplyGlobalLayout ? 'sim' : 'nao'}</strong></div>
              <div className="small">Auditorias: <strong>{designEvolution?.summary?.total ?? 0}</strong> | High: <strong>{designEvolution?.summary?.high ?? 0}</strong></div>
              {designEvolutionError && <p className="small error">{designEvolutionError}</p>}
            </div>

            <div className="card">
              <div className="section-title">Proximas telas de evolucao</div>
              {(designEvolution?.summary?.nextRecommendedScreens ?? []).length ? (
                designEvolution?.summary?.nextRecommendedScreens?.map(screen => (
                  <div key={screen} className="line-item">
                    <strong>{screen}</strong>
                  </div>
                ))
              ) : (
                <p className="small">Sem recomendacoes no momento.</p>
              )}
            </div>
          </div>
        </section>

        <section className="domain">
          <div className="domain-header">
            <h2>PR Auditor e Eventos</h2>
            <span className="badge badge-neutral">Monitoramento continuo</span>
          </div>
          <div className="card">
            <div className="section-title">Eventos de agentes</div>
            {events.map(event => (
              <div key={event.id} className="line-item">
                <strong>{event.source_agent}</strong> · {event.event_type} · {event.priority}
                <div className="small">{event.summary}</div>
              </div>
            ))}
            {!events.length && <p className="small">Nenhum evento de agente encontrado.</p>}
          </div>
        </section>

        <style jsx>{`
          .page { min-height: 100vh; background: linear-gradient(180deg, #f4f7fb 0%, #eef3fb 100%); color: #172033; font-family: "Geist", system-ui, sans-serif; }
          .topbar { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #ffffffcc; border-bottom: 1px solid #e2e8f0; backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 20; }
          .main { max-width: 1180px; margin: 0 auto; padding: 24px 20px 42px; }
          .hero { margin-bottom: 20px; }
          .title { margin: 0; font-size: 28px; color: #111827; letter-spacing: -0.02em; }
          .sub { margin-top: 6px; color: #4B5563; font-size: 14px; }
          .chip { margin-top: 10px; display: inline-flex; gap: 8px; align-items: center; border: 1px solid #d8e0ee; border-radius: 999px; padding: 4px 10px; background: #f8fafc; font-size: 11px; color: #334155; font-weight: 700; }
          .chip-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
          .btn { border: 1px solid #d8dee9; background: #fff; border-radius: 8px; padding: 8px 12px; color: #185fa5; font-weight: 800; cursor: pointer; }
          .status-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
          .domain { margin-bottom: 14px; }
          .domain-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
          .domain-header h2 { margin: 0; font-size: 16px; color: #1e293b; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 6px 16px rgba(16, 24, 40, 0.04); }
          .section-title { font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: #4B5563; margin-bottom: 10px; }
          .row { display: grid; gap: 10px; padding: 9px 0; border-bottom: 1px solid #eef2f7; font-size: 12px; }
          .row-3 { grid-template-columns: 1.1fr .6fr 1fr; }
          .line-item { padding: 8px 0; border-bottom: 1px solid #eef2f7; font-size: 12px; }
          .project-item { display: block; width: 100%; text-align: left; background: transparent; border: 0; border-bottom: 1px solid #eef2f7; padding: 8px 0; cursor: pointer; }
          .small { color: #4B5563; font-size: 12px; line-height: 1.5; }
          .muted { color: #4B5563; }
          .strong { font-size: 13px; font-weight: 800; }
          .tiny-title { font-size: 11px; color: #4B5563; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; }
          .panel { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 10px; background: #f8fafc; }
          .check-row { display: flex; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid #eef2f7; font-size: 13px; }
          .legend-card { background: #f8fafc; border: 1px solid #dbeafe; margin-top: 14px; }
          .legend-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #e0e7ff; font-size: 12px; }
          .legend-row .badge { margin-top: 2px; flex-shrink: 0; }
          .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 800; border: 1px solid; }
          .badge-ok { color: #14532d; border-color: #86efac; background: #f0fdf4; }
          .badge-warning { color: #78350f; border-color: #fcd34d; background: #fffbeb; }
          .badge-snapshot { color: #0c4a6e; border-color: #bfdbfe; background: #f0f9ff; }
          .badge-neutral { color: #0F172A; border-color: #cbd5e1; background: #f8fafc; }
          .error { color: #a32d2d; }
          @media (max-width: 1024px) {
            .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-2 { grid-template-columns: 1fr; }
          }
          @media (max-width: 640px) {
            .main { padding: 18px 14px 28px; }
            .topbar { padding: 0 14px; }
            .title { font-size: 24px; }
            .status-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </div>
  )
}
