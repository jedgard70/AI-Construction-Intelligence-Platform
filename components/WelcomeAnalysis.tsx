import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useRouter } from 'next/router'
import type { Profile } from '../pages/dashboard'

type IntakeKind = 'visual' | 'bim' | 'legal' | 'finance' | 'marketing' | 'field' | 'generic'

type RouteOption = {
  title: string
  description: string
  href: string
}

type LiveAgent = {
  name: string
  signal: string
  finding: string
  action: string
}

type IntakeResult = {
  code: string
  kind: IntakeKind
  headline: string
  explanation: string
  routes: RouteOption[]
  agents: LiveAgent[]
}

const DEFAULT_ROUTES: RouteOption[] = [
  {
    title: 'ArchVis',
    description: 'Transformar imagem, planta ou modelo em material visual vendavel.',
    href: '/archvis',
  },
  {
    title: 'BIM / 3D',
    description: 'Abrir caminho tecnico para modelo, compatibilizacao, clash e quantitativo.',
    href: '/bim-3d',
  },
  {
    title: 'Orcamento',
    description: 'Preparar base para custo, proposta e cronograma fisico-financeiro.',
    href: '/orcamento',
  },
]

const AGENT_LIBRARY: Record<IntakeKind, LiveAgent[]> = {
  visual: [
    { name: 'Render Agent', signal: 'visual', finding: 'Material pode virar planta humanizada, fachada, interior ou prancha comercial.', action: 'Encaminhar para ArchVis' },
    { name: 'DirectCut Agent', signal: 'motion', finding: 'Se houver sequencia de imagens, pode virar video, tour ou timelapse.', action: 'Preparar roteiro audiovisual' },
    { name: 'Marketing Agent', signal: 'brand', finding: 'Imagem pode alimentar portfolio, website, social media e material de venda.', action: 'Abrir rota Marketing' },
  ],
  bim: [
    { name: 'BIM Agent', signal: 'model', finding: 'Arquivo parece tecnico e deve ser tratado como modelo/coordenação, nao como imagem simples.', action: 'Abrir BIM / 3D' },
    { name: 'Clash Agent', signal: 'coordination', finding: 'Checkpoint futuro pode sobrepor disciplinas e destacar interferencias.', action: 'Preparar compatibilizacao' },
    { name: 'Quantitativo Agent', signal: 'measure', finding: 'Modelo tecnico pode alimentar quantitativo, orçamento e cronograma.', action: 'Encaminhar para Orcamento' },
  ],
  legal: [
    { name: 'Legal Agent', signal: 'contract', finding: 'Documento deve ser classificado para contrato, aditivo, compliance, permit ou assinatura.', action: 'Abrir Juridico / Contratos' },
    { name: 'Compliance Agent', signal: 'risk', finding: 'Pode exigir regras por pais, cidade, county ou norma local.', action: 'Preparar checklist legal' },
    { name: 'Signature Agent', signal: 'workflow', finding: 'Se for documento final, pode seguir para assinatura e controle de status.', action: 'Encaminhar assinatura' },
  ],
  finance: [
    { name: 'Finance Agent', signal: 'cost', finding: 'Entrada parece custo, nota, orcamento, invoice ou documento financeiro.', action: 'Abrir Financeiro / Orcamento' },
    { name: 'Proposal Agent', signal: 'commercial', finding: 'Pode alimentar proposta, curva de desembolso ou fluxo financeiro.', action: 'Preparar proposta' },
    { name: 'Audit Agent', signal: 'control', finding: 'Documento financeiro deve preservar rastreabilidade e evitar exposicao sensivel.', action: 'Registrar trilha futura' },
  ],
  marketing: [
    { name: 'Marketing Agent', signal: 'campaign', finding: 'Entrada aponta para website, portfolio, posts, campanha ou material institucional.', action: 'Abrir Design/Web' },
    { name: 'DirectCut Agent', signal: 'video', finding: 'Arquivos de video ou sequencia visual podem virar reels, tour ou apresentacao.', action: 'Abrir DirectCut' },
    { name: 'Brand Agent', signal: 'identity', finding: 'Logos, fotos e renders podem montar kit visual da empresa/projeto.', action: 'Preparar material' },
  ],
  field: [
    { name: 'Field Agent', signal: 'obra', finding: 'Entrada parece relacionada a obra, campo, equipe, RDO ou execucao.', action: 'Abrir Obras/Campo' },
    { name: 'Progress Agent', signal: 'status', finding: 'Pode virar registro de avanço fisico, pendencia ou evidencia de obra.', action: 'Preparar RDO' },
    { name: 'Cost Agent', signal: 'materials', finding: 'Campo pode acionar material, compra, medicao e pagamento.', action: 'Conectar financeiro' },
  ],
  generic: [
    { name: 'Apex Router', signal: 'triage', finding: 'Ainda preciso de uma intencao para escolher a rota com seguranca.', action: 'Perguntar objetivo' },
    { name: 'Document Agent', signal: 'file', finding: 'Arquivo aceito no intake; leitura profunda depende do formato e checkpoint.', action: 'Classificar entrada' },
    { name: 'Operations Agent', signal: 'next step', finding: 'Posso encaminhar para visual, tecnico, juridico, financeiro, marketing ou obra.', action: 'Sugerir rotas' },
  ],
}

function ownerEmails() {
  return (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  return Boolean(
    profile.is_owner === true ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'diretor_executivo' ||
    ownerEmails().includes(String(profile.email || '').toLowerCase())
  )
}

function openApexAi() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('apex-copilot-open'))
}

function extensionFrom(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function intakeCode() {
  const now = new Date()
  return `APX-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`
}

function routesFor(kind: IntakeKind): RouteOption[] {
  if (kind === 'visual') {
    return [
      { title: 'ArchVis', description: 'Render, planta humanizada, fachada, interiores e prancha comercial.', href: '/archvis' },
      { title: 'Marketing / Design', description: 'Portfolio, apresentacao, website, social media e material de venda.', href: '/platform' },
      { title: 'DirectCut', description: 'Video, tour, timelapse e roteiro visual do projeto.', href: '/director-cut' },
    ]
  }
  if (kind === 'bim') {
    return [
      { title: 'BIM / 3D', description: 'Visualizacao tecnica, compatibilizacao, clash e validacao.', href: '/bim-3d' },
      { title: 'Orcamento', description: 'Quantitativo, custos, proposta e cronograma fisico-financeiro.', href: '/orcamento' },
      { title: 'Obras / Campo', description: 'Preparar execucao, RDO, equipes e controle de obra.', href: '/rdo' },
    ]
  }
  if (kind === 'legal') {
    return [
      { title: 'Juridico / Contratos', description: 'Contrato, memorial, aditivo, compliance, permit e assinatura.', href: '/juridico/contratos' },
      { title: 'Documentos legais', description: 'Organizar evidencias, anexos e trilha documental.', href: '/documentos' },
      { title: 'Compliance', description: 'Checar regras por pais, cidade, county ou norma aplicavel.', href: '/juridico/compliance' },
    ]
  }
  if (kind === 'finance') {
    return [
      { title: 'Financeiro / Orcamento', description: 'Nota, invoice, custo, composicao, proposta e fluxo financeiro.', href: '/orcamento' },
      { title: 'CRM Revenue', description: 'Conectar proposta, contrato, parcelas e status financeiro.', href: '/crm/revenue' },
      { title: 'Documentos', description: 'Guardar suporte documental para auditoria futura.', href: '/documentos' },
    ]
  }
  if (kind === 'marketing') {
    return [
      { title: 'Marketing / Design', description: 'Website, materiais, portfolio, conteudo e campanhas.', href: '/platform' },
      { title: 'DirectCut', description: 'Video, reels, tour e apresentacao audiovisual.', href: '/director-cut' },
      { title: 'ArchVis', description: 'Gerar imagens vendaveis para alimentar campanha.', href: '/archvis' },
    ]
  }
  if (kind === 'field') {
    return [
      { title: 'Obras / Campo', description: 'RDO, equipes, materiais, pendencias e execucao.', href: '/rdo' },
      { title: 'Qualidade', description: 'NCIs, evidencias, fotos e nao conformidades.', href: '/qualidade' },
      { title: 'Financeiro / Orcamento', description: 'Materiais, medicao, pagamento e custo real.', href: '/orcamento' },
    ]
  }
  return DEFAULT_ROUTES
}

function classify(fileName: string, intent: string): IntakeResult {
  const ext = extensionFrom(fileName)
  const text = `${fileName} ${intent}`.toLowerCase()
  let kind: IntakeKind = 'generic'
  let headline = 'Entrada recebida para triagem inteligente'
  let explanation = 'A Apex AI precisa da intencao do usuario para escolher o caminho operacional correto.'

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || /(render|imagem|fachada|interior|planta humanizada|vendavel|visual)/i.test(text)) {
    kind = 'visual'
    headline = 'Imagem ou material visual detectado'
    explanation = 'Esta entrada pode virar render, planta humanizada, portfolio, prancha comercial, marketing ou video.'
  } else if (['ifc', 'rvt', 'dwg', 'dxf', 'skp'].includes(ext) || /(bim|revit|ifc|dwg|cad|clash|modelo|quantitativo)/i.test(text)) {
    kind = 'bim'
    headline = 'Modelo tecnico BIM/CAD detectado'
    explanation = 'Este material deve seguir para BIM/3D, compatibilizacao, validacao tecnica, clash, quantitativo ou orcamento.'
  } else if (/(contrato|juridico|jurídico|permit|compliance|assinatura|aditivo|memorial)/i.test(text)) {
    kind = 'legal'
    headline = 'Documento juridico ou regulatorio detectado'
    explanation = 'O caminho correto envolve contratos, permits, compliance, assinatura ou organizacao legal.'
  } else if (/(nota fiscal|invoice|financeiro|orcamento|orçamento|custo|pagamento|budget|proposta)/i.test(text)) {
    kind = 'finance'
    headline = 'Entrada financeira ou comercial detectada'
    explanation = 'A entrada pode alimentar orcamento, proposta, fluxo financeiro, revenue ou auditoria de custos.'
  } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || /(marketing|website|site|social|instagram|video|vídeo|directcut|portfolio|campanha)/i.test(text)) {
    kind = 'marketing'
    headline = 'Material de marketing, design ou video detectado'
    explanation = 'A entrada pode seguir para Design/Web, DirectCut, portfolio, campanha ou conteudo institucional.'
  } else if (/(obra|campo|rdo|equipe|material|medicao|medição|diario|diário|nci|qualidade)/i.test(text)) {
    kind = 'field'
    headline = 'Entrada operacional de obra detectada'
    explanation = 'A entrada pode ser tratada como evidencia de campo, RDO, pendencia, qualidade, medicao ou custo real.'
  }

  return {
    code: intakeCode(),
    kind,
    headline,
    explanation,
    routes: routesFor(kind),
    agents: AGENT_LIBRARY[kind],
  }
}

function previewLabel(file: File | null) {
  if (!file) return 'Mostre o que você tem'
  const ext = extensionFrom(file.name).toUpperCase() || 'FILE'
  return `${ext} recebido`
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const [file, setFile] = useState<File | null>(null)
  const [intent, setIntent] = useState('')
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function runIntake(nextFile = file, nextIntent = intent) {
    setResult(classify(nextFile?.name || '', nextIntent))
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    if (nextFile) runIntake(nextFile, intent)
  }

  return (
    <section style={styles.page}>
      <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={handleFile} />

      <div style={styles.hero}>
        <div style={styles.heroCopy}>
          <span style={styles.kicker}>APEX GLOBAL AI</span>
          <h1 style={styles.title}>Welcome</h1>
          <p style={styles.lead}>Anexe seu arquivo ou fale com a Apex AI para iniciar.</p>
          <div style={styles.heroActions}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.primaryButton}>Anexar documento</button>
            <button type="button" onClick={openApexAi} style={styles.secondaryButton}>Falar com Apex AI</button>
            <button type="button" onClick={() => runIntake()} style={styles.secondaryButton}>Iniciar analise</button>
          </div>
        </div>
        <div style={styles.previewPanel}>
          <div style={styles.previewStage}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview do arquivo enviado" style={styles.previewImage} />
            ) : (
              <div style={styles.previewPlaceholder}>
                <span style={styles.previewLabel}>{previewLabel(file)}</span>
                <strong>{file ? file.name : 'Arquivo, imagem, BIM, contrato, nota ou texto livre'}</strong>
                <small>{file ? 'Preview profundo será tratado pelo módulo correto.' : 'A Apex AI identifica o caminho.'}</small>
              </div>
            )}
          </div>
          <div style={styles.previewMeta}>
            <span>{file ? file.name : 'Nenhum arquivo selecionado'}</span>
            <strong>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Aguardando entrada'}</strong>
          </div>
        </div>
      </div>

      <div style={styles.intentPanel}>
        <label style={styles.intentLabel}>O que você deseja fazer com isso?</label>
        <div style={styles.intentRow}>
          <input
            value={intent}
            onChange={event => setIntent(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') runIntake()
            }}
            style={styles.intentInput}
            placeholder="Ex: transformar em render vendavel, validar IFC, revisar contrato, gerar orcamento..."
          />
          <button type="button" onClick={() => runIntake()} style={styles.redButton}>Identificar caminho</button>
        </div>
      </div>

      {result && (
        <div style={styles.analysisBand}>
          <section style={styles.analysisPanel}>
            <div style={styles.sectionKicker}>Analise visual / tecnica</div>
            <div style={styles.code}>{result.code}</div>
            <h2 style={styles.analysisTitle}>{result.headline}</h2>
            <p style={styles.analysisText}>{result.explanation}</p>
          </section>

          <section style={styles.routesPanel}>
            <div style={styles.sectionKicker}>Rotas inteligentes</div>
            <div style={styles.routeGrid}>
              {result.routes.map(route => (
                <button key={route.title} type="button" onClick={() => router.push(route.href)} style={styles.routeCard}>
                  <strong>{route.title}</strong>
                  <span>{route.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {result && (
        <section style={styles.agentsPanel}>
          <div style={styles.sectionKicker}>Agentes vivos demonstrativos</div>
          <div style={styles.agentGrid}>
            {result.agents.map(agent => (
              <button key={agent.name} type="button" style={styles.agentCard}>
                <span style={styles.agentSignal}>{agent.signal}</span>
                <strong>{agent.name}</strong>
                <span>{agent.finding}</span>
                <em>{agent.action}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      <div style={styles.ownerArea}>
        <div>
          <h2 style={styles.ownerTitle}>Executive control</h2>
          <p style={styles.ownerText}>Controle Owner e indicadores executivos continuam separados da primeira experiência.</p>
        </div>
        {isOwner && (
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>
            Dashboard Executivo
          </button>
        )}
      </div>
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 88px)',
    background: '#ffffff',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: 28,
    color: '#071a33',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, .85fr) minmax(420px, 1.15fr)',
    gap: 24,
    alignItems: 'stretch',
  },
  heroCopy: {
    borderLeft: '5px solid #b20f1d',
    padding: '8px 0 8px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  kicker: {
    color: '#b20f1d',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '.08em',
  },
  title: {
    margin: '10px 0 0',
    fontSize: 44,
    lineHeight: 1,
    letterSpacing: 0,
    color: '#071a33',
  },
  lead: {
    margin: '16px 0 0',
    color: '#0d2b52',
    fontSize: 21,
    fontWeight: 800,
    lineHeight: 1.35,
  },
  heroActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 24,
  },
  primaryButton: {
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#ffffff',
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  secondaryButton: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  previewPanel: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#f7f9fc',
    padding: 14,
    minHeight: 380,
    display: 'grid',
    gridTemplateRows: '1fr auto',
    gap: 12,
  },
  previewStage: {
    minHeight: 320,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#ffffff',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: '#5f6b7a',
    textAlign: 'center',
    padding: 24,
  },
  previewLabel: {
    color: '#b20f1d',
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  },
  previewMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    color: '#5f6b7a',
    fontSize: 12,
  },
  intentPanel: {
    marginTop: 22,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 16,
  },
  intentLabel: {
    display: 'block',
    color: '#071a33',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 10,
  },
  intentRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 10,
  },
  intentInput: {
    width: '100%',
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  redButton: {
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#ffffff',
    padding: '0 16px',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  analysisBand: {
    display: 'grid',
    gridTemplateColumns: '.8fr 1.2fr',
    gap: 18,
    marginTop: 20,
  },
  analysisPanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#071a33',
    color: '#ffffff',
    padding: 18,
  },
  sectionKicker: {
    color: '#b20f1d',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: 12,
  },
  code: {
    display: 'inline-flex',
    border: '1px solid rgba(255,255,255,.22)',
    borderRadius: 8,
    padding: '6px 9px',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 14,
  },
  analysisTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
  },
  analysisText: {
    margin: '12px 0 0',
    color: '#d6dde8',
    fontSize: 13,
    lineHeight: 1.65,
  },
  routesPanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
  },
  routeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  routeCard: {
    minHeight: 130,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#f9fbfd',
    color: '#071a33',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  agentsPanel: {
    marginTop: 20,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
  },
  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  agentCard: {
    minHeight: 164,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    textAlign: 'left',
    cursor: 'pointer',
    color: '#071a33',
    fontFamily: 'inherit',
  },
  agentSignal: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    background: '#fff5f6',
    color: '#b20f1d',
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  ownerArea: {
    marginTop: 30,
    borderTop: '1px solid #dfe5ee',
    paddingTop: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ownerTitle: {
    margin: 0,
    color: '#071a33',
    fontSize: 18,
  },
  ownerText: {
    margin: '6px 0 0',
    color: '#5f6b7a',
    fontSize: 13,
  },
  ownerButton: {
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#fff',
    padding: '12px 18px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
}
