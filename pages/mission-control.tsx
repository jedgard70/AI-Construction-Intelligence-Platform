import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'

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
      status: 'atencao',
      detail: 'Sem API GitHub conectada nesta tela. O repositorio mestre local esta em D:\\AI-constr.',
    },
    {
      name: 'Vercel',
      status: 'atencao',
      detail: 'Sem leitura direta da Vercel nesta tela. Validacao atual feita por build local limpo.',
    },
    {
      name: 'Build',
      status: 'ok',
      detail: 'Ultimo build local executado com sucesso apos Bloco 1 e Bloco 2.',
    },
  ], [documentsCount, error, events.length, projects.length])

  const roadmap = [
    { item: 'Project Intake Engine', status: '45%', priority: 'Critica' },
    { item: 'Agent Window Framework', status: '55%', priority: 'Critica' },
    { item: 'Mission Control V1', status: 'Em implantacao', priority: 'Alta' },
    { item: 'Apex AI Copilot Foundation', status: 'Pendente', priority: 'Alta' },
    { item: 'Project Workspace', status: 'Pendente', priority: 'Alta' },
    { item: 'Supabase Gap Analysis', status: '60%', priority: 'Alta' },
  ]

  const checklist = [
    ['Nova Analise unificada', true],
    ['Projeto nasce automaticamente', true],
    ['AgentWindow em BIM 3D/BIM OPS/Plantas', true],
    ['Mission Control com Supabase real', !loading],
    ['Copilot global consolidado', false],
    ['Workspace com abas padrao', false],
    ['Migrations aprovadas', false],
  ]

  const statusColor = {
    ok: '#2f7d32',
    atencao: '#ad6800',
    bloqueado: '#a32d2d',
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f5f7fa', color: '#172033', fontFamily: "'Geist', system-ui, sans-serif" },
    topbar: { height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
    main: { maxWidth: 1180, margin: '0 auto', padding: '24px 20px 42px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 },
    title: { margin: 0, fontSize: 24, color: '#111827' },
    sub: { marginTop: 4, color: '#667085', fontSize: 13 },
    sec: { fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: '#667085', marginBottom: 10 },
    btn: { border: '1px solid #d8dee9', background: '#fff', borderRadius: 8, padding: '8px 12px', color: '#185FA5', fontWeight: 800, cursor: 'pointer' },
    row: { display: 'grid', gridTemplateColumns: '1.1fr .6fr 1fr', gap: 10, padding: '9px 0', borderBottom: '1px solid #eef2f7', fontSize: 12 },
    small: { color: '#667085', fontSize: 12, lineHeight: 1.5 },
  }

  if (loading) {
    return <div style={s.page}><main style={s.main}>Carregando Mission Control...</main></div>
  }

  return (
    <div style={s.page}>
      <Head>
        <title>Mission Control | AI Construction Platform</title>
      </Head>

      <header style={s.topbar}>
        <button style={s.btn} onClick={() => router.push('/dashboard')}>Dashboard</button>
        <strong>Mission Control V1</strong>
      </header>

      <main style={s.main}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={s.title}>Mission Control</h1>
          <p style={s.sub}>Status operacional real da plataforma, roadmap e checklist do Pacote Master 001.</p>
          <div style={{ marginTop: 8, display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid #d8e0ee', borderRadius: 999, padding: '4px 10px', background: '#f8fafc', fontSize: 11, color: '#475467', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: copilotKnowledgeBadge.color, display: 'inline-block' }} />
            {copilotKnowledgeBadge.text}
          </div>
        </div>

        <section style={{ ...s.grid4, marginBottom: 14 }}>
          {statusItems.map(item => (
            <div key={item.name} style={s.card}>
              <div style={s.sec}>{item.name}</div>
              <div style={{ color: statusColor[item.status], fontSize: 18, fontWeight: 900 }}>{item.status.toUpperCase()}</div>
              <p style={s.small}>{item.detail}</p>
            </div>
          ))}
        </section>

        <section style={{ ...s.grid2, marginBottom: 14 }}>
          <div style={s.card}>
            <div style={s.sec}>Roadmap</div>
            {roadmap.map(item => (
              <div key={item.item} style={s.row}>
                <strong>{item.item}</strong>
                <span>{item.status}</span>
                <span style={{ color: '#667085' }}>{item.priority}</span>
              </div>
            ))}
          </div>

          <div style={s.card}>
            <div style={s.sec}>Checklist</div>
            {checklist.map(([label, done]) => (
              <div key={String(label)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eef2f7', fontSize: 13 }}>
                <span style={{ color: done ? '#2f7d32' : '#ad6800', fontWeight: 900 }}>{done ? 'OK' : 'PENDENTE'}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...s.grid2, marginBottom: 14 }}>
          <div style={s.card}>
            <div style={s.sec}>Modulos</div>
            {modules.length ? modules.map(module => (
              <div key={module.id ?? module.module_key ?? module.label} style={{ padding: '8px 0', borderBottom: '1px solid #eef2f7' }}>
                <strong style={{ fontSize: 13 }}>{module.label ?? module.module_key}</strong>
                <div style={s.small}>{module.status ?? 'sem status'} {module.page ? `- ${module.page}` : ''} {module.description ? `- ${module.description}` : ''}</div>
              </div>
            )) : <p style={s.small}>Nenhum registro em platform_modules ou sem permissao de leitura.</p>}
          </div>

          <div style={s.card}>
            <div style={s.sec}>Projetos recentes</div>
            {projects.map(project => (
              <button key={project.id} onClick={() => router.push(`/projeto/${project.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderBottom: '1px solid #eef2f7', padding: '8px 0', cursor: 'pointer' }}>
                <strong style={{ fontSize: 13 }}>{project.name}</strong>
                <div style={s.small}>{project.status} - {new Date(project.created_at).toLocaleDateString('pt-BR')}</div>
              </button>
            ))}
          </div>
        </section>

        <section style={{ ...s.grid2, marginBottom: 14 }}>
          <div style={s.card}>
            <div style={s.sec}>Autonomous Orchestrator</div>
            <div style={{ fontSize: 12, color: '#475467', marginBottom: 8 }}>
              Modo: <strong>{autonomous?.execution?.mode ?? 'guided'}</strong>
            </div>
            {autonomous?.execution?.nextRecommendedBlock ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', fontWeight: 800 }}>Proximo bloco recomendado</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{autonomous.execution.nextRecommendedBlock.id} - {autonomous.execution.nextRecommendedBlock.title}</div>
                <div style={s.small}>Risco: {autonomous.execution.nextRecommendedBlock.risk} | Prioridade: {autonomous.execution.nextRecommendedBlock.priority}</div>
              </div>
            ) : (
              <p style={s.small}>Sem bloco recomendado no momento.</p>
            )}
            {autonomousError && <p style={{ ...s.small, color: '#a32d2d' }}>{autonomousError}</p>}
          </div>

          <div style={s.card}>
            <div style={s.sec}>Aprovacao Obrigatoria</div>
            {autonomous?.governance?.requiredApprovals?.length ? autonomous.governance.requiredApprovals.map(item => (
              <div key={item.key} style={{ padding: '8px 0', borderBottom: '1px solid #eef2f7' }}>
                <strong style={{ fontSize: 12 }}>{item.key}</strong>
                <div style={s.small}>{item.description}</div>
              </div>
            )) : (
              <p style={s.small}>Sem regras carregadas pela API de autonomia.</p>
            )}
          </div>
        </section>

        <section style={s.card}>
          <div style={s.sec}>Eventos de agentes</div>
          {events.map(event => (
            <div key={event.id} style={{ padding: '8px 0', borderBottom: '1px solid #eef2f7', fontSize: 12 }}>
              <strong>{event.source_agent}</strong> · {event.event_type} · {event.priority}
              <div style={s.small}>{event.summary}</div>
            </div>
          ))}
          {!events.length && <p style={s.small}>Nenhum evento de agente encontrado.</p>}
        </section>
      </main>
    </div>
  )
}
