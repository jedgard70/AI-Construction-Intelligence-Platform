import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useRouter } from 'next/router'
import type { Profile } from '../pages/dashboard'

type IntakeKind = 'visual' | 'bim' | 'legal' | 'finance' | 'marketing' | 'field' | 'generic'
type Language = 'en' | 'pt'

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

type IntentCard = {
  kind: IntakeKind
  label: string
  description: string
  prompt: string
}

const UI_COPY = {
  en: {
    welcome: 'Welcome',
    lead: 'Attach a file or talk to Apex AI to begin.',
    attach: 'Attach document',
    talk: 'Talk to Apex AI',
    start: 'Start analysis',
    previewEmpty: 'File, image, BIM, contract, invoice or free text',
    previewDeep: 'Deep preview will be handled by the correct module.',
    previewHint: 'Apex AI identifies the path.',
    noFile: 'No file selected',
    waiting: 'Waiting for input',
    intentQuestion: 'What do you want to do with this?',
    intentPlaceholder: 'Example: turn this into a sellable render, validate IFC, review contract, create budget...',
    identify: 'Identify path',
    intentCards: 'Choose an objective',
    analysis: 'Visual / technical analysis',
    routes: 'Smart routes',
    agents: 'Living agents demo',
    ownerTitle: 'Executive control',
    ownerText: 'Owner control and executive indicators remain separate from the first experience.',
    ownerButton: 'Executive Dashboard',
  },
  pt: {
    welcome: 'Bem-vindo',
    lead: 'Anexe seu arquivo ou fale com a Apex AI para iniciar.',
    attach: 'Anexar documento',
    talk: 'Falar com Apex AI',
    start: 'Iniciar analise',
    previewEmpty: 'Arquivo, imagem, BIM, contrato, nota ou texto livre',
    previewDeep: 'Preview profundo sera tratado pelo modulo correto.',
    previewHint: 'A Apex AI identifica o caminho.',
    noFile: 'Nenhum arquivo selecionado',
    waiting: 'Aguardando entrada',
    intentQuestion: 'O que voce deseja fazer com isso?',
    intentPlaceholder: 'Ex: transformar em render vendavel, validar IFC, revisar contrato, gerar orcamento...',
    identify: 'Identificar caminho',
    intentCards: 'Escolha um objetivo',
    analysis: 'Analise visual / tecnica',
    routes: 'Rotas inteligentes',
    agents: 'Agentes vivos demonstrativos',
    ownerTitle: 'Executive control',
    ownerText: 'Controle Owner e indicadores executivos continuam separados da primeira experiencia.',
    ownerButton: 'Dashboard Executivo',
  },
} satisfies Record<Language, Record<string, string>>

const INTENT_CARDS: Record<Language, IntentCard[]> = {
  en: [
    { kind: 'visual', label: 'Create render', description: 'Image, facade, interior, portfolio or visual sales material.', prompt: 'create a sellable render or visual presentation' },
    { kind: 'bim', label: 'Analyze BIM/CAD', description: 'IFC, RVT, DWG, DXF, SKP, clash, quantities or coordination.', prompt: 'analyze BIM CAD model for technical routing' },
    { kind: 'finance', label: 'Estimate cost', description: 'Budget, proposal, invoice, cost or financial workflow.', prompt: 'prepare budget cost estimate and proposal path' },
    { kind: 'legal', label: 'Review contract', description: 'Contract, permit, compliance, legal document or signature.', prompt: 'review contract permit compliance or legal document' },
    { kind: 'marketing', label: 'Build marketing', description: 'Website, portfolio, campaign, video or social material.', prompt: 'prepare marketing design website or video material' },
    { kind: 'field', label: 'Route field work', description: 'Jobsite, RDO, quality, progress, materials or execution.', prompt: 'route jobsite field RDO quality and execution work' },
  ],
  pt: [
    { kind: 'visual', label: 'Criar render', description: 'Imagem, fachada, interior, portfolio ou material visual de venda.', prompt: 'transformar em render vendavel ou apresentacao visual' },
    { kind: 'bim', label: 'Analisar BIM/CAD', description: 'IFC, RVT, DWG, DXF, SKP, clash, quantitativo ou coordenacao.', prompt: 'analisar modelo BIM CAD para rota tecnica' },
    { kind: 'finance', label: 'Gerar orcamento', description: 'Orcamento, proposta, nota, custo ou fluxo financeiro.', prompt: 'preparar orcamento custo proposta e rota financeira' },
    { kind: 'legal', label: 'Revisar contrato', description: 'Contrato, permit, compliance, documento legal ou assinatura.', prompt: 'revisar contrato permit compliance ou documento juridico' },
    { kind: 'marketing', label: 'Criar marketing', description: 'Website, portfolio, campanha, video ou material social.', prompt: 'preparar marketing design website ou video' },
    { kind: 'field', label: 'Encaminhar obra', description: 'Obra, RDO, qualidade, progresso, materiais ou execucao.', prompt: 'encaminhar obra campo RDO qualidade e execucao' },
  ],
}

const CLASSIFY_COPY: Record<Language, Record<IntakeKind, { headline: string; explanation: string }>> = {
  en: {
    visual: { headline: 'Image or visual material detected', explanation: 'This input can become a render, humanized plan, portfolio asset, sales board, marketing piece or video.' },
    bim: { headline: 'Technical BIM/CAD model detected', explanation: 'This material should move to BIM/3D, coordination, technical validation, clash review, quantities or estimating.' },
    legal: { headline: 'Legal or regulatory document detected', explanation: 'The correct path involves contracts, permits, compliance, signatures or legal document organization.' },
    finance: { headline: 'Financial or commercial input detected', explanation: 'The input can support estimating, proposals, financial flow, revenue tracking or cost audit.' },
    marketing: { headline: 'Marketing, design or video material detected', explanation: 'The input can move to Design/Web, DirectCut, portfolio, campaign or institutional content.' },
    field: { headline: 'Field operations input detected', explanation: 'The input can become jobsite evidence, RDO, pending item, quality record, measurement or real cost support.' },
    generic: { headline: 'Input received for intelligent triage', explanation: 'Apex AI needs the user intention to choose the safest operational path.' },
  },
  pt: {
    visual: { headline: 'Imagem ou material visual detectado', explanation: 'Esta entrada pode virar render, planta humanizada, portfolio, prancha comercial, marketing ou video.' },
    bim: { headline: 'Modelo tecnico BIM/CAD detectado', explanation: 'Este material deve seguir para BIM/3D, compatibilizacao, validacao tecnica, clash, quantitativo ou orcamento.' },
    legal: { headline: 'Documento juridico ou regulatorio detectado', explanation: 'O caminho correto envolve contratos, permits, compliance, assinatura ou organizacao legal.' },
    finance: { headline: 'Entrada financeira ou comercial detectada', explanation: 'A entrada pode alimentar orcamento, proposta, fluxo financeiro, revenue ou auditoria de custos.' },
    marketing: { headline: 'Material de marketing, design ou video detectado', explanation: 'A entrada pode seguir para Design/Web, DirectCut, portfolio, campanha ou conteudo institucional.' },
    field: { headline: 'Entrada operacional de obra detectada', explanation: 'A entrada pode ser tratada como evidencia de campo, RDO, pendencia, qualidade, medicao ou custo real.' },
    generic: { headline: 'Entrada recebida para triagem inteligente', explanation: 'A Apex AI precisa da intencao do usuario para escolher o caminho operacional correto.' },
  },
}

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

function routesFor(kind: IntakeKind, language: Language): RouteOption[] {
  if (kind === 'visual') {
    return [
      { title: 'ArchVis', description: language === 'en' ? 'Render, humanized plan, facade, interiors and sales board.' : 'Render, planta humanizada, fachada, interiores e prancha comercial.', href: '/archvis' },
      { title: 'Marketing / Design', description: language === 'en' ? 'Portfolio, presentation, website, social media and sales material.' : 'Portfolio, apresentacao, website, social media e material de venda.', href: '/platform' },
      { title: 'DirectCut', description: language === 'en' ? 'Video, tour, timelapse and visual project story.' : 'Video, tour, timelapse e roteiro visual do projeto.', href: '/director-cut' },
    ]
  }
  if (kind === 'bim') {
    return [
      { title: 'BIM / 3D', description: language === 'en' ? 'Technical view, coordination, clash and validation.' : 'Visualizacao tecnica, compatibilizacao, clash e validacao.', href: '/bim-3d' },
      { title: 'Orcamento', description: language === 'en' ? 'Quantities, costs, proposal and physical-financial schedule.' : 'Quantitativo, custos, proposta e cronograma fisico-financeiro.', href: '/orcamento' },
      { title: 'Obras / Campo', description: language === 'en' ? 'Prepare execution, RDO, crews and field control.' : 'Preparar execucao, RDO, equipes e controle de obra.', href: '/rdo' },
    ]
  }
  if (kind === 'legal') {
    return [
      { title: 'Juridico / Contratos', description: language === 'en' ? 'Contract, scope, addendum, compliance, permit and signature.' : 'Contrato, memorial, aditivo, compliance, permit e assinatura.', href: '/juridico/contratos' },
      { title: 'Documentos legais', description: language === 'en' ? 'Organize evidence, attachments and document trail.' : 'Organizar evidencias, anexos e trilha documental.', href: '/documentos' },
      { title: 'Compliance', description: language === 'en' ? 'Check country, city, county or applicable code rules.' : 'Checar regras por pais, cidade, county ou norma aplicavel.', href: '/juridico/compliance' },
    ]
  }
  if (kind === 'finance') {
    return [
      { title: 'Financeiro / Orcamento', description: language === 'en' ? 'Invoice, cost, composition, proposal and financial flow.' : 'Nota, invoice, custo, composicao, proposta e fluxo financeiro.', href: '/orcamento' },
      { title: 'CRM Revenue', description: language === 'en' ? 'Connect proposal, contract, installments and financial status.' : 'Conectar proposta, contrato, parcelas e status financeiro.', href: '/crm/revenue' },
      { title: 'Documentos', description: language === 'en' ? 'Keep document support for future audit.' : 'Guardar suporte documental para auditoria futura.', href: '/documentos' },
    ]
  }
  if (kind === 'marketing') {
    return [
      { title: 'Marketing / Design', description: language === 'en' ? 'Website, materials, portfolio, content and campaigns.' : 'Website, materiais, portfolio, conteudo e campanhas.', href: '/platform' },
      { title: 'DirectCut', description: language === 'en' ? 'Video, reels, tour and audiovisual presentation.' : 'Video, reels, tour e apresentacao audiovisual.', href: '/director-cut' },
      { title: 'ArchVis', description: language === 'en' ? 'Generate sales-ready imagery to feed the campaign.' : 'Gerar imagens vendaveis para alimentar campanha.', href: '/archvis' },
    ]
  }
  if (kind === 'field') {
    return [
      { title: 'Obras / Campo', description: language === 'en' ? 'RDO, crews, materials, pending items and execution.' : 'RDO, equipes, materiais, pendencias e execucao.', href: '/rdo' },
      { title: 'Qualidade', description: language === 'en' ? 'NCIs, evidence, photos and nonconformities.' : 'NCIs, evidencias, fotos e nao conformidades.', href: '/qualidade' },
      { title: 'Financeiro / Orcamento', description: language === 'en' ? 'Materials, measurement, payment and real cost.' : 'Materiais, medicao, pagamento e custo real.', href: '/orcamento' },
    ]
  }
  return [
    {
      title: 'ArchVis',
      description: language === 'en' ? 'Turn an image, plan or model into sales-ready visual material.' : 'Transformar imagem, planta ou modelo em material visual vendavel.',
      href: '/archvis',
    },
    {
      title: 'BIM / 3D',
      description: language === 'en' ? 'Open the technical path for model, coordination, clash and quantities.' : 'Abrir caminho tecnico para modelo, compatibilizacao, clash e quantitativo.',
      href: '/bim-3d',
    },
    {
      title: 'Orcamento',
      description: language === 'en' ? 'Prepare cost, proposal and physical-financial schedule basis.' : 'Preparar base para custo, proposta e cronograma fisico-financeiro.',
      href: '/orcamento',
    },
  ]
}

function classify(fileName: string, intent: string, language: Language): IntakeResult {
  const ext = extensionFrom(fileName)
  const text = `${fileName} ${intent}`.toLowerCase()
  let kind: IntakeKind = 'generic'

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || /(render|imagem|fachada|interior|planta humanizada|vendavel|visual)/i.test(text)) {
    kind = 'visual'
  } else if (['ifc', 'rvt', 'dwg', 'dxf', 'skp'].includes(ext) || /(bim|revit|ifc|dwg|cad|clash|modelo|quantitativo)/i.test(text)) {
    kind = 'bim'
  } else if (/(contrato|juridico|jurídico|permit|compliance|assinatura|aditivo|memorial)/i.test(text)) {
    kind = 'legal'
  } else if (/(nota fiscal|invoice|financeiro|orcamento|orçamento|custo|pagamento|budget|proposta)/i.test(text)) {
    kind = 'finance'
  } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || /(marketing|website|site|social|instagram|video|vídeo|directcut|portfolio|campanha)/i.test(text)) {
    kind = 'marketing'
  } else if (/(obra|campo|rdo|equipe|material|medicao|medição|diario|diário|nci|qualidade)/i.test(text)) {
    kind = 'field'
  }

  const copy = CLASSIFY_COPY[language][kind]
  return {
    code: intakeCode(),
    kind,
    headline: copy.headline,
    explanation: copy.explanation,
    routes: routesFor(kind, language),
    agents: AGENT_LIBRARY[kind],
  }
}

function previewLabel(file: File | null, language: Language) {
  if (!file) return language === 'en' ? 'Show what you have' : 'Mostre o que voce tem'
  const ext = extensionFrom(file.name).toUpperCase() || 'FILE'
  return language === 'en' ? `${ext} received` : `${ext} recebido`
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const [language, setLanguage] = useState<Language>('en')
  const [file, setFile] = useState<File | null>(null)
  const [intent, setIntent] = useState('')
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const copy = UI_COPY[language]
  const intentCards = INTENT_CARDS[language]

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function runIntake(nextFile = file, nextIntent = intent, nextLanguage = language) {
    setResult(classify(nextFile?.name || '', nextIntent, nextLanguage))
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage)
    if (result) {
      setResult(classify(file?.name || '', intent, nextLanguage))
    }
  }

  function selectIntent(card: IntentCard) {
    setIntent(card.prompt)
    setResult(classify(file?.name || '', card.prompt, language))
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
          <div style={styles.languageToggle} aria-label="Language selector">
            <button type="button" onClick={() => changeLanguage('en')} style={{ ...styles.languageButton, ...(language === 'en' ? styles.languageButtonActive : null) }}>EN</button>
            <button type="button" onClick={() => changeLanguage('pt')} style={{ ...styles.languageButton, ...(language === 'pt' ? styles.languageButtonActive : null) }}>PT</button>
          </div>
          <span style={styles.kicker}>APEX GLOBAL AI</span>
          <h1 style={styles.title}>{copy.welcome}</h1>
          <p style={styles.lead}>{copy.lead}</p>
          <div style={styles.heroActions}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.primaryButton}>{copy.attach}</button>
            <button type="button" onClick={openApexAi} style={styles.secondaryButton}>{copy.talk}</button>
            <button type="button" onClick={() => runIntake()} style={styles.secondaryButton}>{copy.start}</button>
          </div>
        </div>
        <div style={styles.previewPanel}>
          <div style={styles.previewStage}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview do arquivo enviado" style={styles.previewImage} />
            ) : (
              <div style={styles.previewPlaceholder}>
                <span style={styles.previewLabel}>{previewLabel(file, language)}</span>
                <strong>{file ? file.name : copy.previewEmpty}</strong>
                <small>{file ? copy.previewDeep : copy.previewHint}</small>
              </div>
            )}
          </div>
          <div style={styles.previewMeta}>
            <span>{file ? file.name : copy.noFile}</span>
            <strong>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : copy.waiting}</strong>
          </div>
        </div>
      </div>

      <section style={styles.intentCardsPanel}>
        <div style={styles.sectionKicker}>{copy.intentCards}</div>
        <div style={styles.intentCardsGrid}>
          {intentCards.map(card => (
            <button
              key={card.label}
              type="button"
              onClick={() => selectIntent(card)}
              style={{ ...styles.intentCard, ...(result?.kind === card.kind ? styles.intentCardActive : null) }}
            >
              <strong>{card.label}</strong>
              <span>{card.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={styles.intentPanel}>
        <label style={styles.intentLabel}>{copy.intentQuestion}</label>
        <div style={styles.intentRow}>
          <input
            value={intent}
            onChange={event => setIntent(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') runIntake()
            }}
            style={styles.intentInput}
            placeholder={copy.intentPlaceholder}
          />
          <button type="button" onClick={() => runIntake()} style={styles.redButton}>{copy.identify}</button>
        </div>
      </div>

      {result && (
        <div style={styles.analysisBand}>
          <section style={styles.analysisPanel}>
            <div style={styles.sectionKicker}>{copy.analysis}</div>
            <div style={styles.code}>{result.code}</div>
            <h2 style={styles.analysisTitle}>{result.headline}</h2>
            <p style={styles.analysisText}>{result.explanation}</p>
          </section>

          <section style={styles.routesPanel}>
            <div style={styles.sectionKicker}>{copy.routes}</div>
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
          <div style={styles.sectionKicker}>{copy.agents}</div>
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
          <h2 style={styles.ownerTitle}>{copy.ownerTitle}</h2>
          <p style={styles.ownerText}>{copy.ownerText}</p>
        </div>
        {isOwner && (
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>
            {copy.ownerButton}
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
  languageToggle: {
    alignSelf: 'flex-start',
    display: 'inline-grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: 4,
    background: '#ffffff',
    marginBottom: 18,
  },
  languageButton: {
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: '#5f6b7a',
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  languageButtonActive: {
    background: '#071a33',
    color: '#ffffff',
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
  intentCardsPanel: {
    marginTop: 22,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#f9fbfd',
    padding: 16,
  },
  intentCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  intentCard: {
    minHeight: 112,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  intentCardActive: {
    borderColor: '#b20f1d',
    boxShadow: '0 0 0 3px rgba(178,15,29,.10)',
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
