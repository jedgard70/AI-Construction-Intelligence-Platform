import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import type { Profile } from '../pages/dashboard'

type IntakeKind = 'project' | 'document' | 'legal' | 'finance' | 'marketing' | 'generic'
type ClientMode = 'new' | 'existing'

type IntakeDraft = {
  code: string
  kind: IntakeKind
  label: string
  confidence: string
  destination: string
  routeHint: string
  fileName: string
  supportedDeepAnalysis: boolean
}

type Action = {
  label: string
  description: string
  onClick: () => void
  primary?: boolean
}

const SERVICES = [
  'Render',
  'Projeto 3D',
  'BIM',
  'Orcamento',
  'Obra/Campo',
  'ArchVis',
  'DirectCut',
  'Design/Web',
  'Juridico/Contrato',
]

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

function buildDraftCode() {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  return `APX-INT-${stamp}-${String(now.getTime()).slice(-5)}`
}

function classifyIntake(fileName: string, objective: string, service: string, country: string): IntakeDraft {
  const text = `${fileName} ${objective} ${service}`.toLowerCase()
  const ext = extensionFrom(fileName)
  const isUs = /(usa|eua|united states|estados unidos|texas|florida|california|new york)/i.test(country)
  const isEurope = /(portugal|espanha|france|franca|italy|italia|germany|alemanha|europa|europe)/i.test(country)

  let kind: IntakeKind = 'generic'
  let label = 'Arquivo generico'
  let destination = 'Produção'
  let routeHint = '/documentos'
  let supportedDeepAnalysis = false

  if (['ifc', 'rvt', 'dwg', 'dxf', 'skp'].includes(ext) || /(bim|cad|planta|obra|projeto|render|3d|arquitet)/i.test(text)) {
    kind = 'project'
    label = ext === 'ifc' ? 'BIM/IFC' : ext === 'dwg' || ext === 'dxf' ? 'CAD/Planta' : 'Projeto/Obra'
    destination = isUs ? 'Produção EUA' : isEurope ? 'Produção Europa' : 'Produção Brasil'
    routeHint = service === 'ArchVis' ? '/archvis' : service === 'BIM' ? '/bim-3d' : service === 'Obra/Campo' ? '/rdo' : '/projeto/draft'
    supportedDeepAnalysis = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt', 'csv', 'json', 'md'].includes(ext)
  } else if (/(contrato|juridico|jurídico|compliance|assinatura|permit|endosso)/i.test(text)) {
    kind = 'legal'
    label = 'Juridico/Contrato'
    destination = 'Jurídico / Contratos'
    routeHint = '/juridico/contratos'
    supportedDeepAnalysis = ['pdf', 'txt', 'md', 'json'].includes(ext)
  } else if (/(nota fiscal|invoice|financeiro|orcamento|orçamento|pagamento|custo|budget)/i.test(text)) {
    kind = 'finance'
    label = 'Financeiro/Orçamento'
    destination = 'Financeiro / Orçamento'
    routeHint = '/orcamento'
    supportedDeepAnalysis = ['pdf', 'xlsx', 'csv', 'txt'].includes(ext)
  } else if (/(rg|cpf|cnpj|documento cliente|identidade|passport|passaporte)/i.test(text)) {
    kind = 'document'
    label = 'Documento de cliente'
    destination = 'Atendimento / Documentos'
    routeHint = '/documentos'
    supportedDeepAnalysis = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)
  } else if (/(marketing|design|site|web|video|vídeo|social|portfolio|portfólio|directcut)/i.test(text) || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    kind = 'marketing'
    label = 'Marketing/Design'
    destination = service === 'DirectCut' ? 'Marketing / DirectCut' : 'Marketing / Design/Web'
    routeHint = service === 'DirectCut' ? '/director-cut' : '/platform'
    supportedDeepAnalysis = ['jpg', 'jpeg', 'png', 'webp', 'txt', 'md'].includes(ext)
  }

  return {
    code: buildDraftCode(),
    kind,
    label,
    confidence: fileName || objective ? 'initial' : 'pending',
    destination,
    routeHint,
    fileName: fileName || 'Entrada manual',
    supportedDeepAnalysis,
  }
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const firstName = profile.full_name?.split(' ')[0] || 'Welcome'
  const [file, setFile] = useState<File | null>(null)
  const [manualEntry, setManualEntry] = useState('')
  const [clientMode, setClientMode] = useState<ClientMode>('new')
  const [clientName, setClientName] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [service, setService] = useState('BIM')
  const [draft, setDraft] = useState<IntakeDraft | null>(null)
  const [notice, setNotice] = useState('')

  function startIntake(nextFile?: File | null) {
    setNotice('')
    const selectedFile = nextFile ?? file
    const nextDraft = classifyIntake(selectedFile?.name || '', manualEntry, service, country)
    setDraft(nextDraft)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    if (nextFile) startIntake(nextFile)
  }

  function prepareDraft() {
    const nextDraft = classifyIntake(file?.name || '', manualEntry, service, country)
    setDraft(nextDraft)
    setNotice('Intake draft preparado localmente. CP3 ainda não grava este fluxo no banco.')
  }

  const actions: Action[] = [
    {
      label: 'Anexar documento/projeto',
      description: 'Selecionar qualquer arquivo e iniciar classificacao CP3 sem rejeitar formato.',
      onClick: () => fileInputRef.current?.click(),
      primary: true,
    },
    {
      label: 'Falar com Apex AI',
      description: 'Abrir o copiloto para perguntas, triagem inicial e apoio ao atendimento.',
      onClick: openApexAi,
    },
    {
      label: 'Iniciar analise',
      description: 'Criar um intake draft com cliente, local, servico e destino inicial.',
      onClick: () => startIntake(),
    },
    {
      label: 'Continuar atendimento/projeto',
      description: 'Retomar documentos, projetos e entregas existentes pela area operacional.',
      onClick: () => router.push('/documentos'),
    },
  ]

  return (
    <section style={styles.page}>
      <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={handleFile} />

      <div style={styles.hero}>
        <div style={styles.heroCopy}>
          <span style={styles.kicker}>Apex Global AI</span>
          <h1 style={styles.title}>Welcome, {firstName}</h1>
          <p style={styles.lead}>Anexe seu arquivo ou fale com a Apex AI para iniciar.</p>
          <p style={styles.body}>
            CP3 adiciona intake automatico local: a plataforma classifica a entrada, prepara um projeto draft e indica o modulo correto sem alterar Supabase.
          </p>
        </div>
        <div style={styles.signalPanel} aria-label="Apex project intake">
          <div style={styles.signalHeader}>
            <span style={styles.signalDot} />
            <span>Project intake draft</span>
          </div>
          <div style={styles.signalGrid}>
            <div style={styles.signalItem}><strong>Entrada</strong><span>arquivo ou descricao manual</span></div>
            <div style={styles.signalItem}><strong>Apex AI</strong><span>classificacao e destino inicial</span></div>
            <div style={styles.signalItem}><strong>Estado</strong><span>draft local, sem banco no CP3</span></div>
          </div>
        </div>
      </div>

      <div style={styles.actionsGrid}>
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            style={{ ...styles.actionCard, ...(action.primary ? styles.actionCardPrimary : null) }}
          >
            <span style={{ ...styles.actionLabel, ...(action.primary ? styles.actionLabelPrimary : null) }}>{action.label}</span>
            <span style={{ ...styles.actionDescription, ...(action.primary ? styles.actionDescriptionPrimary : null) }}>{action.description}</span>
          </button>
        ))}
      </div>

      <div style={styles.intakeGrid}>
        <section style={styles.intakePanel}>
          <div style={styles.sectionLabel}>Intake CP3</div>
          <label style={styles.label}>Arquivo recebido</label>
          <button type="button" style={styles.fileBox} onClick={() => fileInputRef.current?.click()}>
            <strong>{file ? file.name : 'Selecionar arquivo ou usar entrada manual'}</strong>
            <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB registrados no draft` : 'Aceita qualquer tipo de arquivo no intake.'}</span>
          </button>

          <label style={styles.label}>Entrada manual / objetivo</label>
          <textarea
            value={manualEntry}
            onChange={event => setManualEntry(event.target.value)}
            style={styles.textarea}
            placeholder="Ex: planta residencial em Dallas para render e orçamento, contrato para revisão, nota fiscal para análise financeira..."
          />

          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Cliente</label>
              <div style={styles.segmented}>
                <button type="button" onClick={() => setClientMode('new')} style={{ ...styles.segmentButton, ...(clientMode === 'new' ? styles.segmentButtonActive : null) }}>Novo</button>
                <button type="button" onClick={() => setClientMode('existing')} style={{ ...styles.segmentButton, ...(clientMode === 'existing' ? styles.segmentButtonActive : null) }}>Existente</button>
              </div>
            </div>
            <div>
              <label style={styles.label}>Nome do cliente</label>
              <input value={clientName} onChange={event => setClientName(event.target.value)} style={styles.input} placeholder="Nome ou empresa" />
            </div>
          </div>

          <div style={styles.formRowThree}>
            <div>
              <label style={styles.label}>Cidade</label>
              <input value={city} onChange={event => setCity(event.target.value)} style={styles.input} placeholder="Cidade" />
            </div>
            <div>
              <label style={styles.label}>Estado/Regiao</label>
              <input value={region} onChange={event => setRegion(event.target.value)} style={styles.input} placeholder="Estado" />
            </div>
            <div>
              <label style={styles.label}>Pais</label>
              <input value={country} onChange={event => setCountry(event.target.value)} style={styles.input} placeholder="Pais" />
            </div>
          </div>

          <label style={styles.label}>Servico desejado</label>
          <div style={styles.serviceGrid}>
            {SERVICES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setService(item)}
                style={{ ...styles.serviceButton, ...(service === item ? styles.serviceButtonActive : null) }}
              >
                {item}
              </button>
            ))}
          </div>

          <button type="button" onClick={prepareDraft} style={styles.primaryButton}>
            Preparar intake draft
          </button>
          {notice && <div style={styles.notice}>{notice}</div>}
        </section>

        <aside style={styles.resultPanel}>
          <div style={styles.sectionLabel}>Classificacao Apex AI</div>
          {draft ? (
            <>
              <div style={styles.draftCode}>{draft.code}</div>
              <div style={styles.pillRow}>
                <span style={styles.pill}>{draft.label}</span>
                <span style={styles.pill}>{draft.confidence}</span>
                <span style={styles.pill}>{draft.supportedDeepAnalysis ? 'analise CP1 disponivel' : 'classificacao CP3'}</span>
              </div>
              <dl style={styles.summaryList}>
                <div><dt>Arquivo</dt><dd>{draft.fileName}</dd></div>
                <div><dt>Cliente</dt><dd>{clientMode === 'new' ? 'Novo cliente' : 'Cliente existente'}{clientName ? ` - ${clientName}` : ''}</dd></div>
                <div><dt>Local</dt><dd>{[city, region, country].filter(Boolean).join(', ') || 'Nao informado'}</dd></div>
                <div><dt>Servico</dt><dd>{service}</dd></div>
                <div><dt>Destino</dt><dd>{draft.destination}</dd></div>
                <div><dt>Proximo modulo</dt><dd>{draft.routeHint}</dd></div>
              </dl>
              <p style={styles.resultText}>
                Draft local criado para encaminhamento. A gravacao definitiva em projetos/clientes fica bloqueada ate checkpoint de banco aprovado.
              </p>
              <div style={styles.resultActions}>
                <button type="button" onClick={openApexAi} style={styles.secondaryButton}>Abrir Apex AI</button>
                <button type="button" onClick={() => router.push(draft.routeHint === '/projeto/draft' ? '/documentos' : draft.routeHint)} style={styles.secondaryButton}>Ir para modulo</button>
              </div>
            </>
          ) : (
            <p style={styles.resultText}>
              Selecione um arquivo ou descreva a demanda e clique em Iniciar analise. O draft mostrara codigo provisório, cliente, servico e destino.
            </p>
          )}
        </aside>
      </div>

      <div style={styles.ownerArea}>
        <div>
          <h2 style={styles.ownerTitle}>Executive control</h2>
          <p style={styles.ownerText}>
            Controle Owner e indicadores executivos permanecem disponiveis apenas para Owner/diretoria.
          </p>
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
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
    gap: 22,
    alignItems: 'stretch',
  },
  heroCopy: {
    borderLeft: '5px solid #b20f1d',
    padding: '8px 0 8px 22px',
  },
  kicker: {
    display: 'block',
    color: '#b20f1d',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    lineHeight: 1.12,
    margin: 0,
    letterSpacing: 0,
    color: '#071a33',
  },
  lead: {
    margin: '14px 0 0',
    color: '#0d2b52',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  body: {
    maxWidth: 720,
    margin: '10px 0 0',
    color: '#5f6b7a',
    fontSize: 14,
    lineHeight: 1.65,
  },
  signalPanel: {
    background: '#f7f9fc',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  signalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#071a33',
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#b20f1d',
    boxShadow: '0 0 0 5px rgba(178,15,29,.10)',
  },
  signalGrid: {
    display: 'grid',
    gap: 10,
  },
  signalItem: {
    background: '#fff',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'grid',
    gap: 3,
    color: '#5f6b7a',
    fontSize: 12,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
    marginTop: 26,
  },
  actionCard: {
    minHeight: 136,
    textAlign: 'left',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 18,
    fontFamily: 'inherit',
    boxShadow: '0 10px 24px rgba(7,26,51,.05)',
  },
  actionCardPrimary: {
    background: '#071a33',
    borderColor: '#071a33',
  },
  actionLabel: {
    color: '#071a33',
    fontWeight: 800,
    fontSize: 15,
    lineHeight: 1.25,
  },
  actionLabelPrimary: {
    color: '#ffffff',
  },
  actionDescription: {
    color: '#5f6b7a',
    fontSize: 12,
    lineHeight: 1.55,
  },
  actionDescriptionPrimary: {
    color: '#d6dde8',
  },
  intakeGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, .9fr)',
    gap: 18,
    marginTop: 24,
  },
  intakePanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#f9fbfd',
    padding: 18,
  },
  resultPanel: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    boxShadow: '0 10px 24px rgba(7,26,51,.05)',
  },
  sectionLabel: {
    color: '#b20f1d',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: 14,
  },
  label: {
    display: 'block',
    color: '#0d2b52',
    fontSize: 12,
    fontWeight: 800,
    margin: '12px 0 6px',
  },
  fileBox: {
    width: '100%',
    minHeight: 76,
    border: '1px dashed #9facbf',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    cursor: 'pointer',
    display: 'grid',
    gap: 4,
    padding: 14,
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    minHeight: 96,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  input: {
    width: '100%',
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '210px minmax(0, 1fr)',
    gap: 12,
  },
  formRowThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  segmented: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    background: '#eef2f7',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: '#5f6b7a',
    padding: '9px 10px',
    cursor: 'pointer',
    fontWeight: 800,
    fontFamily: 'inherit',
  },
  segmentButtonActive: {
    background: '#ffffff',
    color: '#071a33',
    boxShadow: '0 3px 10px rgba(7,26,51,.08)',
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 8,
  },
  serviceButton: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#0d2b52',
    padding: '9px 8px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
  },
  serviceButtonActive: {
    borderColor: '#b20f1d',
    background: '#fff5f6',
    color: '#b20f1d',
  },
  primaryButton: {
    width: '100%',
    marginTop: 16,
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#ffffff',
    padding: '12px 18px',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  notice: {
    marginTop: 10,
    border: '1px solid #d7e0ec',
    borderRadius: 8,
    background: '#ffffff',
    color: '#5f6b7a',
    padding: '10px 12px',
    fontSize: 12,
  },
  draftCode: {
    display: 'inline-flex',
    background: '#071a33',
    color: '#ffffff',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '.03em',
  },
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pill: {
    display: 'inline-flex',
    borderRadius: 999,
    background: '#eef3fb',
    color: '#0d2b52',
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 800,
  },
  summaryList: {
    display: 'grid',
    gap: 10,
    margin: '16px 0',
  },
  resultText: {
    color: '#5f6b7a',
    fontSize: 13,
    lineHeight: 1.6,
  },
  resultActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 14,
  },
  secondaryButton: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: '9px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
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
