import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useRouter } from 'next/router'
import {
  BadgeCheck,
  Bot,
  DollarSign,
  FileText,
  HardHat,
  ImageIcon,
  Megaphone,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
  Upload,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

type IntentVisual = {
  icon: LucideIcon
  color: string
  background: string
}

const UI_COPY = {
  en: {
    welcome: 'Welcome',
    lead: 'Show what you have or tell Apex AI what you want to do.',
    sublead: 'Apex AI identifies the path and opens the next step.',
    attach: 'Attach document',
    talk: 'Talk to Apex AI',
    start: 'Start analysis',
    dropTitle: 'Drop a file here or click to select',
    dropText: 'Images, BIM/IFC, CAD, PDF, videos, spreadsheets and more.',
    previewDeep: 'Deep preview will be handled by the correct module.',
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
    trustOne: 'Secure intake',
    trustTwo: 'AI routing',
    trustThree: 'Owner governed',
  },
  pt: {
    welcome: 'Bem-vindo',
    lead: 'Mostre o que voce tem ou diga a Apex AI o que deseja fazer.',
    sublead: 'A Apex AI identifica o caminho e abre o proximo passo.',
    attach: 'Anexar documento',
    talk: 'Falar com Apex AI',
    start: 'Iniciar analise',
    dropTitle: 'Solte um arquivo aqui ou clique para selecionar',
    dropText: 'Imagens, BIM/IFC, CAD, PDF, videos, planilhas e mais.',
    previewDeep: 'Preview profundo sera tratado pelo modulo correto.',
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
    trustOne: 'Intake seguro',
    trustTwo: 'Rota por IA',
    trustThree: 'Governanca Owner',
  },
} satisfies Record<Language, Record<string, string>>

const INTENT_VISUALS: Record<IntakeKind, IntentVisual> = {
  visual: { icon: ImageIcon, color: '#ff2d21', background: '#ffe1e1' },
  bim: { icon: Workflow, color: '#1d32ff', background: '#e4e5ff' },
  finance: { icon: DollarSign, color: '#14aa52', background: '#def9e8' },
  legal: { icon: BadgeCheck, color: '#8d25de', background: '#efd9ff' },
  marketing: { icon: Megaphone, color: '#ff6f1a', background: '#ffe8d8' },
  field: { icon: HardHat, color: '#18b58c', background: '#dbf6ef' },
  generic: { icon: Bot, color: '#0d2b52', background: '#eaf2ff' },
}

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('apex-language')
    if (saved === 'en' || saved === 'pt') setLanguage(saved)
    function handleLanguage(event: Event) {
      const nextLanguage = (event as CustomEvent<Language>).detail
      if (nextLanguage === 'en' || nextLanguage === 'pt') setLanguage(nextLanguage)
    }
    window.addEventListener('apex-language-change', handleLanguage)
    return () => window.removeEventListener('apex-language-change', handleLanguage)
  }, [])

  useEffect(() => {
    if (result) {
      setResult(classify(file?.name || '', intent, language))
    }
  }, [language])

  function runIntake(nextFile = file, nextIntent = intent, nextLanguage = language) {
    setResult(classify(nextFile?.name || '', nextIntent, nextLanguage))
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
          <span style={styles.kicker}>APEX GLOBAL AI</span>
          <h1 style={styles.title}>{copy.welcome}</h1>
          <p style={styles.lead}>{copy.lead}</p>
          <p style={styles.sublead}>{copy.sublead}</p>
          <div style={styles.heroActions}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.primaryButton}><Upload size={17} />{copy.attach}</button>
            <button type="button" onClick={openApexAi} style={styles.secondaryButton}><MessageSquare size={17} />{copy.talk}</button>
            <button type="button" onClick={() => runIntake()} style={styles.secondaryButton}><Play size={17} />{copy.start}</button>
          </div>
          <div style={styles.trustGrid}>
            <span style={styles.trustItem}><FileText size={18} />{copy.trustOne}</span>
            <span style={styles.trustItem}><Bot size={18} />{copy.trustTwo}</span>
            <span style={styles.trustItem}><ShieldCheck size={18} />{copy.trustThree}</span>
          </div>
        </div>
        <button type="button" style={styles.previewPanel} onClick={() => fileInputRef.current?.click()}>
          <div style={styles.previewStage}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview do arquivo enviado" style={styles.previewImage} />
            ) : (
              <div style={styles.previewPlaceholder}>
                <span style={styles.uploadIcon}><Upload size={30} /></span>
                <strong>{file ? previewLabel(file, language) : copy.dropTitle}</strong>
                <small>{file ? copy.previewDeep : copy.dropText}</small>
              </div>
            )}
          </div>
          <div style={styles.previewMeta}>
            <span>{file ? file.name : copy.noFile}</span>
            <strong>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : copy.waiting}</strong>
          </div>
        </button>
      </div>

      <section style={styles.intentCardsPanel}>
        <div style={styles.sectionKicker}>{copy.intentCards}</div>
        <div style={styles.intentCardsGrid}>
          {intentCards.map(card => (
            (() => {
              const visual = INTENT_VISUALS[card.kind]
              const Icon = visual.icon
              return (
            <button
              key={card.label}
              type="button"
              onClick={() => selectIntent(card)}
              style={{ ...styles.intentCard, ...(result?.kind === card.kind ? styles.intentCardActive : null) }}
            >
              <span style={{ ...styles.intentIcon, color: visual.color, background: visual.background }}><Icon size={30} strokeWidth={2.1} /></span>
              <span style={styles.intentCopy}>
                <strong>{card.label}</strong>
                <span>{card.description}</span>
              </span>
            </button>
              )
            })()
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
          <button type="button" onClick={() => runIntake()} style={styles.redButton} aria-label={copy.identify} title={copy.identify}>
            <Send size={21} />
          </button>
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

      {isOwner && (
        <div style={styles.ownerArea}>
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>
            {copy.ownerButton}
          </button>
        </div>
      )}
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 88px)',
    background: '#ffffff',
    border: 'none',
    borderRadius: 0,
    padding: '34px 42px 28px',
    color: '#071a33',
    maxWidth: 1600,
    width: 'calc(100% - 32px)',
    margin: '0 auto',
    boxShadow: 'none',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(460px, .43fr) minmax(620px, .57fr)',
    gap: 48,
    alignItems: 'stretch',
  },
  heroCopy: {
    borderLeft: '5px solid #b20f1d',
    padding: '20px 0 18px 28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  kicker: {
    color: '#b20f1d',
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: '.08em',
  },
  title: {
    margin: '10px 0 0',
    fontSize: 46,
    lineHeight: 1,
    letterSpacing: 0,
    color: '#071a33',
  },
  lead: {
    margin: '18px 0 0',
    color: '#0d2b52',
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  sublead: {
    margin: '8px 0 0',
    color: '#0d2b52',
    fontSize: 16,
    lineHeight: 1.45,
  },
  heroActions: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 30,
  },
  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 18,
    marginTop: 36,
    maxWidth: 560,
  },
  trustItem: {
    borderRight: '1px solid #dfe5ee',
    borderRadius: 0,
    background: '#ffffff',
    color: '#0d2b52',
    padding: '5px 16px 5px 0',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'left',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#ffffff',
    padding: '14px 21px',
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    boxShadow: '0 12px 22px rgba(178,15,29,.16)',
  },
  secondaryButton: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: '13px 21px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    boxShadow: '0 8px 18px rgba(7,26,51,.04)',
  },
  previewPanel: {
    border: '1px solid #cfd7e6',
    borderRadius: 10,
    background: '#ffffff',
    padding: 22,
    minHeight: 390,
    display: 'grid',
    gridTemplateRows: '1fr auto',
    gap: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    boxShadow: '0 18px 40px rgba(7,26,51,.08)',
  },
  previewStage: {
    minHeight: 302,
    border: '1px dashed #cfd7e6',
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
    minHeight: 302,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: '#5f6b7a',
    textAlign: 'center',
    padding: 24,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    background: '#e8ebf2',
    color: '#071a33',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  previewMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    color: '#0d2b52',
    fontSize: 14,
  },
  intentCardsPanel: {
    marginTop: 26,
    border: '1px solid #dfe5ee',
    borderRadius: 12,
    background: '#ffffff',
    padding: '20px 22px 24px',
    boxShadow: '0 14px 32px rgba(7,26,51,.04)',
  },
  intentCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 14,
  },
  intentCard: {
    minHeight: 118,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: '18px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 10px 22px rgba(7,26,51,.055)',
  },
  intentCardActive: {
    borderColor: '#b20f1d',
    boxShadow: '0 0 0 3px rgba(178,15,29,.10)',
  },
  intentIcon: {
    width: 66,
    height: 66,
    borderRadius: 12,
    flex: '0 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentCopy: {
    display: 'grid',
    gap: 8,
    color: '#0d2b52',
    fontSize: 14,
    lineHeight: 1.45,
  },
  intentPanel: {
    marginTop: 0,
    border: '1px solid #dfe5ee',
    borderRadius: 10,
    background: '#ffffff',
    padding: 24,
    width: 'min(100%, 1280px)',
    boxShadow: '0 14px 30px rgba(7,26,51,.04)',
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
    gridTemplateColumns: 'minmax(0, 1fr) 58px',
    gap: 10,
  },
  intentInput: {
    width: '100%',
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: '15px 16px',
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  redButton: {
    border: 'none',
    borderRadius: 8,
    background: '#d7dce8',
    color: '#ffffff',
    padding: 0,
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
    marginTop: 24,
    borderTop: 'none',
    paddingTop: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    background: '#071a33',
    color: '#fff',
    padding: '18px 32px',
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
}
