import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import NewClientModal from '../components/NewClientModal.js'

type ClientRow = {
  id: string
  name: string
  email: string | null
  city: string | null
  state: string | null
}

type ProjectTypeDb =
  | 'edificacao_residencial'
  | 'edificacao_comercial'
  | 'infraestrutura_viaria'
  | 'infraestrutura_hidrica'
  | 'industrial'
  | 'outro'

type DocumentCategory =
  | 'memorial_descritivo'
  | 'cronograma'
  | 'orcamento'
  | 'contrato'
  | 'nota_fiscal'
  | 'planta_dwg'
  | 'modelo_bim'
  | 'rdo'
  | 'ata_reuniao'
  | 'laudo_tecnico'
  | 'checklist'
  | 'relatorio'
  | 'outro'

const ACCEPTED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'ifc', 'rvt', 'zip', 'mp4', 'mov', 'avi', 'mkv']
const STORAGE_BUCKET = 'project-files'

function extensionFrom(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() ?? '' : ''
}

function cleanBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

function safeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140) || 'arquivo'
}

function detectDocumentCategory(fileName: string, objective: string): DocumentCategory {
  const n = `${fileName} ${objective}`.toLowerCase()
  const ext = extensionFrom(fileName)

  if (ext === 'dwg' || n.includes('planta')) return 'planta_dwg'
  if (ext === 'ifc' || ext === 'rvt' || n.includes('bim') || n.includes('modelo')) return 'modelo_bim'
  if (n.includes('contrato')) return 'contrato'
  if (n.includes('laudo')) return 'laudo_tecnico'
  if (n.includes('memorial')) return 'memorial_descritivo'
  if (n.includes('cronograma')) return 'cronograma'
  if (n.includes('orcamento') || n.includes('orçamento')) return 'orcamento'
  if (n.includes('rdo')) return 'rdo'
  if (n.includes('ata')) return 'ata_reuniao'
  if (n.includes('checklist')) return 'checklist'
  if (ext === 'pdf') return 'relatorio'
  return 'outro'
}

function detectProjectType(fileName: string, objective: string): ProjectTypeDb {
  const n = `${fileName} ${objective}`.toLowerCase()
  if (n.includes('industrial') || n.includes('galpao') || n.includes('galpão')) return 'industrial'
  if (n.includes('comercial') || n.includes('loja') || n.includes('escritorio') || n.includes('escritório')) return 'edificacao_comercial'
  if (n.includes('hidraulica') || n.includes('hidráulica') || n.includes('hidrica') || n.includes('hídrica')) return 'infraestrutura_hidrica'
  if (n.includes('estrada') || n.includes('viaria') || n.includes('viária') || n.includes('infraestrutura')) return 'infraestrutura_viaria'
  if (n.includes('residencial') || n.includes('casa') || n.includes('sobrado') || n.includes('rancho')) return 'edificacao_residencial'
  return 'outro'
}

function projectCode() {
  const now = new Date()
  const year = now.getFullYear()
  const suffix = String(now.getTime()).slice(-6)
  return `INT-${year}-${suffix}`
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk)
    binary += String.fromCharCode(...slice)
  }
  return btoa(binary)
}

export default function NovaAnalisePage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [clientId, setClientId] = useState('')
  const [objective, setObjective] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)

  const detected = useMemo(() => {
    if (!file) return null
    return {
      ext: extensionFrom(file.name).toUpperCase(),
      documentCategory: detectDocumentCategory(file.name, objective),
      projectType: detectProjectType(file.name, objective),
    }
  }, [file, objective])

  async function loadClients(selectLatest = false) {
      const sb = getSupabase()
      if (!sb) {
        router.replace('/login')
        return false
      }

      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        router.replace('/login')
        return false
      }

      const { data, error: clientsErr } = await sb
        .from('clients')
        .select('id,name,email,city,state')
        .order('created_at', { ascending: false })
        .limit(50)

      if (clientsErr) {
        setError(`Supabase: ${clientsErr.message}`)
        setLoading(false)
        return false
      }

      const rows = (data ?? []) as ClientRow[]
      setClients(rows)
      setClientId(selectLatest ? (rows[0]?.id ?? '') : (clientId || rows[0]?.id || ''))
      setLoading(false)
      return true
  }

  useEffect(() => {
    async function init() {
      await loadClients()
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  function chooseFile(nextFile: File | null) {
    setError('')
    setWarning('')
    if (!nextFile) {
      setFile(null)
      return
    }

    const ext = extensionFrom(nextFile.name)
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError('Formato nao suportado. Use PDF, imagem, DWG, IFC, RVT, ZIP ou video.')
      return
    }

    setFile(nextFile)
  }

  async function submitIntake() {
    setError('')
    setWarning('')

    if (!file) {
      setError('Selecione um arquivo para iniciar a analise.')
      return
    }
    if (!objective.trim()) {
      setError('Informe o objetivo da analise.')
      return
    }
    if (!clientId) {
      setError('Selecione um cliente existente antes de iniciar.')
      return
    }

    const sb = getSupabase()
    if (!sb) {
      setError('Supabase nao configurado.')
      return
    }

    setSubmitting(true)

    const { data: { user }, error: userErr } = await sb.auth.getUser()
    if (userErr || !user) {
      setSubmitting(false)
      setError('Sessao expirada. Entre novamente para criar a analise.')
      return
    }

    const projectId = crypto.randomUUID()
    const docCategory = detectDocumentCategory(file.name, objective)
    const projectType = detectProjectType(file.name, objective)
    const nameBase = cleanBaseName(file.name) || 'Nova Analise'
    const code = projectCode()
    const selectedClient = clients.find(client => client.id === clientId)

    const { error: projectErr } = await sb.from('projects').insert({
      id: projectId,
      name: `Analise - ${nameBase}`.slice(0, 120),
      code,
      type: projectType,
      status: 'planejamento',
      description: [
        `Objetivo: ${objective.trim()}`,
        `Entrada: ${file.name}`,
        `Classificacao inicial: ${docCategory}`,
      ].join('\n'),
      client_id: clientId,
      city: selectedClient?.city ?? null,
      state: selectedClient?.state ?? null,
      budget_planned: 0,
      budget_actual: 0,
      completion_pct: 0,
      created_by: user.id,
    })

    if (projectErr) {
      setSubmitting(false)
      setError(`Supabase/projects: ${projectErr.message}`)
      return
    }

    const { data: sessionData } = await sb.auth.getSession()
    const token = sessionData.session?.access_token ?? ''

    try {
      const base64 = await fileToBase64(file)
      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          original_name: safeFileName(file.name),
          mime_type: file.type || `application/${extensionFrom(file.name) || 'octet-stream'}`,
          file_base64: base64,
          metadata: {
            source: 'nova-analise',
            objective: objective.trim(),
            detected_document_category: docCategory,
            detected_project_type: projectType,
            storage_bucket: STORAGE_BUCKET,
            generated_project_code: code,
          },
        }),
      })
      const uploadData = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok) {
        setWarning(`Projeto criado. Aviso: upload/metadados de arquivo falhou (${uploadData?.error?.message || uploadData?.error || 'erro desconhecido'}).`)
      }
    } catch {
      setWarning('Projeto criado. Aviso: upload de arquivo indisponivel no momento.')
    }

    const eventRes = await fetch('/api/agent-events/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_id: projectId,
        source_agent: 'Project_Intake_Engine',
        event_type: 'documento_processado',
        priority: 'medio',
        status: 'pendente',
        summary: `Nova analise criada para ${file.name}`,
        payload: {
          objective: objective.trim(),
          document_category: docCategory,
          project_type: projectType,
          client_id: clientId,
        },
      }),
    })
    const eventData = await eventRes.json().catch(() => ({}))

    if (!eventRes.ok) {
      setWarning(`Projeto criado. Aviso: evento do agente nao registrado (${eventData?.error || 'erro desconhecido'}).`)
    }

    router.push(`/projeto/${projectId}?intake=1`)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f4f6f8', color: '#172033', fontFamily: "'Geist', system-ui, sans-serif" },
    topbar: { height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
    back: { border: '1px solid #d8dee9', background: '#fff', borderRadius: 8, padding: '8px 12px', color: '#185FA5', fontWeight: 700, cursor: 'pointer' },
    main: { maxWidth: 1080, margin: '0 auto', padding: '26px 20px 42px' },
    title: { margin: 0, fontSize: 24, color: '#111827' },
    subtitle: { marginTop: 6, color: '#667085', fontSize: 13 },
    grid: { display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16, alignItems: 'start' },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 },
    section: { fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#667085', marginBottom: 12 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#364152', marginBottom: 6 },
    input: { width: '100%', border: '1px solid #cfd6e4', borderRadius: 8, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box', background: '#fff' },
    textarea: { width: '100%', minHeight: 124, border: '1px solid #cfd6e4', borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
    drop: { border: '2px dashed #b8c1d1', borderRadius: 10, background: '#fafbfc', padding: 22, textAlign: 'center', cursor: 'pointer' },
    file: { marginTop: 12, padding: 12, background: '#f1f5f9', border: '1px solid #d8e0ee', borderRadius: 8, fontSize: 13 },
    primary: { width: '100%', border: 0, borderRadius: 8, padding: '12px 16px', background: '#185FA5', color: '#fff', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' },
    muted: { fontSize: 12, color: '#667085', lineHeight: 1.5 },
    error: { background: '#fff1f1', border: '1px solid #f3b1b1', color: '#9d1c1c', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 14 },
    warning: { background: '#fff8e6', border: '1px solid #e8c36c', color: '#744c00', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 14 },
    pill: { display: 'inline-flex', borderRadius: 999, padding: '4px 9px', background: '#edf3ff', color: '#185FA5', fontSize: 11, fontWeight: 800, marginRight: 6, marginTop: 6 },
  }

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.main}>Carregando Nova Analise...</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <Head>
        <title>Nova Analise | Atlas Construction Intelligence</title>
      </Head>

      <header style={s.topbar}>
        <button style={s.back} onClick={() => router.push('/dashboard')}>Voltar</button>
        <strong>Project Intake Engine</strong>
      </header>

      <main style={s.main}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={s.title}>Nova Analise</h1>
          <p style={s.subtitle}>Upload, objetivo e cliente em um fluxo unico. O projeto nasce automaticamente no Supabase.</p>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {warning && <div style={s.warning}>{warning}</div>}

        <div style={s.grid}>
          <section style={s.card}>
            <div style={s.section}>Entrada obrigatoria</div>

            <label style={s.label}>Arquivo</label>
            <div style={s.drop} onClick={() => document.getElementById('intake-file')?.click()}>
              <strong>{file ? file.name : 'Selecionar arquivo'}</strong>
              <p style={s.muted}>PDF, imagem, DWG, IFC, RVT, ZIP ou video.</p>
              <input
                id="intake-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.ifc,.rvt,.zip,.mp4,.mov,.avi,.mkv"
                style={{ display: 'none' }}
                onChange={event => chooseFile(event.target.files?.[0] ?? null)}
              />
            </div>

            {file && (
              <div style={s.file}>
                <strong>Arquivo registrado para intake</strong>
                <div style={s.muted}>{Math.max(1, Math.round(file.size / 1024))} KB</div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Objetivo da analise</label>
              <textarea
                style={s.textarea}
                value={objective}
                onChange={event => setObjective(event.target.value)}
                placeholder="Ex: analisar planta arquitetonica, criar projeto automatico, classificar riscos e abrir workspace."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Cliente</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <select style={s.input} value={clientId} onChange={event => setClientId(event.target.value)}>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}{client.city ? ` - ${client.city}` : ''}
                    </option>
                  ))}
                </select>
                <button type="button" style={{ ...s.back, color: '#534AB7' }} onClick={() => setShowNewClient(true)}>
                  Novo
                </button>
              </div>
              {clients.length === 0 && <p style={s.muted}>Nenhum cliente encontrado. Cadastre um cliente no dashboard antes de usar o intake.</p>}
            </div>
          </section>

          <aside style={s.card}>
            <div style={s.section}>Classificacao inicial</div>
            {detected ? (
              <>
                <div>
                  <span style={s.pill}>{detected.ext || 'ARQUIVO'}</span>
                  <span style={s.pill}>{detected.documentCategory}</span>
                  <span style={s.pill}>{detected.projectType}</span>
                </div>
                <p style={{ ...s.muted, marginTop: 14 }}>
                  Ao confirmar, a plataforma cria o projeto, vincula ao cliente, registra o documento e abre o workspace do projeto.
                </p>
              </>
            ) : (
              <p style={s.muted}>A classificacao aparece depois que o arquivo for selecionado.</p>
            )}

            <div style={{ height: 1, background: '#e2e8f0', margin: '18px 0' }} />

            <div style={s.section}>Fluxo</div>
            <p style={s.muted}>Upload {'>'} Objetivo {'>'} Cliente {'>'} Projeto Automatico {'>'} Classificacao IA {'>'} Workspace do Projeto.</p>

            <button style={s.primary} onClick={submitIntake} disabled={submitting || clients.length === 0}>
              {submitting ? 'Criando projeto...' : 'Iniciar analise'}
            </button>
          </aside>
        </div>
      </main>
      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreated={() => loadClients(true)}
        />
      )}
    </div>
  )
}
