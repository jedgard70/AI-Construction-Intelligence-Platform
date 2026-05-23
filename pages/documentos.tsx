'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../lib/supabase'

// ─── enum ↔ UI label maps ─────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  contrato:            'Contrato',
  laudo_tecnico:       'Laudo',
  planta_dwg:          'Planta',
  nota_fiscal:         'Nota Fiscal',
  memorial_descritivo: 'Memorial',
  cronograma:          'Cronograma',
  orcamento:           'Orçamento',
  rdo:                 'RDO',
  ata_reuniao:         'Ata',
  checklist:           'Checklist',
  relatorio:           'Relatório',
  modelo_bim:          'Modelo BIM',
  outro:               'Outro',
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'Analisado',
  WIP:       'Pendente',
  SHARED:    'Compartilhado',
  ARCHIVED:  'Arquivado',
}

const TIPO_COLOR: Record<string, string> = {
  'Contrato': '#534AB7', 'Laudo': '#185FA5', 'Planta': '#3B6D11',
  'Nota Fiscal': '#BA7517', 'Memorial': '#A32D2D', 'RDO': '#185FA5',
  'Checklist': '#3B6D11', 'Relatório': '#534AB7',
}

// Detect category enum from file extension / name
function detectCategory(filename: string): string {
  const n = filename.toLowerCase()
  if (n.includes('contrato')) return 'contrato'
  if (n.includes('laudo') || n.includes('laudo_tecnico')) return 'laudo_tecnico'
  if (n.includes('planta') || n.endsWith('.dwg')) return 'planta_dwg'
  if (n.includes('nf_') || n.includes('nota_fiscal')) return 'nota_fiscal'
  if (n.includes('memorial')) return 'memorial_descritivo'
  if (n.includes('cronograma')) return 'cronograma'
  if (n.includes('orcamento') || n.includes('orçamento')) return 'orcamento'
  if (n.includes('rdo')) return 'rdo'
  if (n.includes('ata')) return 'ata_reuniao'
  if (n.includes('checklist')) return 'checklist'
  if (n.includes('relatorio') || n.includes('relatório')) return 'relatorio'
  if (n.endsWith('.ifc') || n.includes('bim') || n.includes('modelo')) return 'modelo_bim'
  return 'outro'
}

function fmtSize(kb: number | null): string {
  if (!kb) return '—'
  if (kb >= 1024) return (kb / 1024).toFixed(1).replace('.', ',') + ' MB'
  return kb + ' KB'
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

// ─── types ────────────────────────────────────────────────────────────────────
interface DocDB {
  id: string
  file_name: string
  category: string
  file_size_kb: number | null
  status: string
  ai_tags: string[] | null
  ai_summary: string | null
  created_at: string
}

interface DocUI {
  id: string
  nome: string
  tipo: string
  tamanho: string
  data: string
  status: string
  tags: string[]
  analysis_result: string | null
}

function dbToUi(d: DocDB): DocUI {
  return {
    id:              d.id,
    nome:            d.file_name,
    tipo:            CATEGORY_LABEL[d.category] || d.category,
    tamanho:         fmtSize(d.file_size_kb),
    data:            fmtDate(d.created_at),
    status:          STATUS_LABEL[d.status] || d.status,
    tags:            d.ai_tags || [],
    analysis_result: d.ai_summary,
  }
}

// ─── component ────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocUI[]>([])
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocUI | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── auth + initial load ──────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id ?? null)
      loadDocs(sb)
    })
  }, [])

  async function loadDocs(sb: ReturnType<typeof getSupabase>) {
    if (!sb) return
    const { data, error } = await sb
      .from('documents')
      .select('id,file_name,category,file_size_kb,status,ai_tags,ai_summary,created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) { setLoadErr('Erro ao carregar documentos.'); return }
    if (data && data.length > 0) setDocs((data as DocDB[]).map(dbToUi))
  }

  // ── AI analysis + save to Supabase ──────────────────────────────────────
  async function analyzeFile(file: File) {
    setAnalyzing(true)
    setResult('')
    let analysisText = ''
    try {
      const text = await file.text().catch(() => '[Arquivo binário — OCR necessário]')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          promptKey: 'document_intelligence',
          messages: [{ role: 'user', content: `Analise este documento:\n\n${text.slice(0, 3000)}` }],
        }),
      })
      const data = await res.json()
      analysisText = data?.content?.[0]?.text || 'Não foi possível analisar o documento.'
      setResult(analysisText)
    } catch {
      analysisText = 'Erro ao conectar com o agente. Verifique a API key.'
      setResult(analysisText)
    }

    // ── Persist to Supabase ──────────────────────────────────────────────
    const sb = getSupabase()
    if (sb) {
      const category = detectCategory(file.name)
      const sizeKb = Math.round(file.size / 1024)
      const { data: inserted, error: insertErr } = await sb
        .from('documents')
        .insert({
          user_id:      userId,
          name:         file.name,
          file_name:    file.name,
          file_path:    `/uploads/${Date.now()}_${file.name}`,
          category,
          file_size_kb: sizeKb,
          status:       'PUBLISHED',
          ai_summary:   analysisText,
          ai_tags:      [],
          ai_processed_at: new Date().toISOString(),
        })
        .select('id,file_name,category,file_size_kb,status,ai_tags,ai_summary,created_at')
        .single()
      if (!insertErr && inserted) {
        setDocs(prev => [dbToUi(inserted as DocDB), ...prev])
      }
    }
    setAnalyzing(false)
  }

  // ─── styles ───────────────────────────────────────────────────────────────
  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f4f5f7', fontFamily: "'Geist',system-ui,sans-serif" },
    topbar: {
      background: '#fff', borderBottom: '1px solid #e5e8f0', padding: '0 24px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
    },
    back: {
      display: 'flex', alignItems: 'center', gap: 8, color: '#185FA5', fontSize: 13,
      fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
    },
    body:     { maxWidth: 1040, margin: '0 auto', padding: '28px 20px' },
    card:     { background: '#fff', border: '1px solid #e5e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16 },
    secTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#8890a0', textTransform: 'uppercase', marginBottom: 14 },
    dropzone: {
      border: `2px dashed ${dragging ? '#185FA5' : '#d0d5e0'}`, borderRadius: 12,
      padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
      background: dragging ? 'rgba(24,95,165,.04)' : '#fafafa',
    },
    errBanner: {
      background: '#FEE8E8', border: '1px solid #F09595', borderRadius: 8,
      padding: '10px 14px', color: '#A32D2D', fontSize: 12, marginBottom: 16,
    },
    tag: {
      display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10,
      fontWeight: 600, background: '#EAF3DE', color: '#3B6D11', marginRight: 4, marginBottom: 2,
    },
    analysisBox: {
      background: '#f8f9fc', border: '1px solid #e5e8f0', borderRadius: 8,
      padding: '12px 14px', fontSize: 12, color: '#1a1f36', lineHeight: 1.6,
      whiteSpace: 'pre-wrap' as const, fontFamily: 'monospace',
    },
    tipoChip: {
      display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:10,
      fontWeight:700, marginRight:6,
    },
    statusChip: {
      display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:10,
      fontWeight:600, background:'#EAF3DE', color:'#3B6D11',
    },
  }

  return (
    <>
      <Head><title>Documentos — AI Construction Platform</title></Head>
      <div style={s.page}>
        {/* Topbar */}
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📁 Inteligência de Documentos</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>Doc AI Engine v5.3</div>
        </div>

        <div style={s.body}>
          {loadErr && <div style={s.errBanner}>⚠ {loadErr}</div>}

          {/* Upload / Drop zone */}
          <div style={s.card}>
            <div style={s.secTitle}>📤 Upload & Análise com IA</div>
            <div
              style={s.dropzone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) analyzeFile(f)
              }}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#185FA5', marginBottom:4 }}>
                Arraste um documento ou clique para selecionar
              </div>
              <div style={{ fontSize:11, color:'#8890a0' }}>
                PDF, DOCX, TXT, DWG — análise automática por IA
              </div>
              <input
                ref={fileRef} type="file" style={{ display:'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) analyzeFile(f) }}
              />
            </div>

            {analyzing && (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#185FA5', fontSize:13 }}>
                ⏳ Analisando documento com IA...
              </div>
            )}
            {result && !analyzing && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#8890a0',
                  textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                  Resultado da análise
                </div>
                <div style={s.analysisBox}>{result}</div>
              </div>
            )}
          </div>

          {/* Lista de documentos */}
          <div style={s.card}>
            <div style={s.secTitle}>📋 Documentos Recentes ({docs.length})</div>
            {docs.length === 0 && !loadErr && (
              <div style={{ color:'#8890a0', fontSize:13, padding:'8px 0' }}>
                Nenhum documento encontrado. Faça o upload acima para começar.
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {docs.map(d => (
                <div
                  key={d.id}
                  style={{
                    border: selectedDoc?.id === d.id ? '1.5px solid #185FA5' : '1px solid #e5e8f0',
                    borderRadius:10, padding:'12px 16px', cursor:'pointer',
                    background: selectedDoc?.id === d.id ? '#f0f6ff' : '#fff',
                    transition:'all .15s',
                  }}
                  onClick={() => setSelectedDoc(prev => prev?.id === d.id ? null : d)}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                        {d.nome}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{
                          ...s.tipoChip,
                          background: (TIPO_COLOR[d.tipo] ?? '#534AB7') + '18',
                          color: TIPO_COLOR[d.tipo] ?? '#534AB7',
                          border: `1px solid ${(TIPO_COLOR[d.tipo] ?? '#534AB7')}44`,
                        }}>{d.tipo}</span>
                        <span style={s.statusChip}>{d.status}</span>
                        <span style={{ fontSize:10, color:'#8890a0' }}>{d.tamanho}</span>
                        <span style={{ fontSize:10, color:'#8890a0' }}>{d.data}</span>
                      </div>
                      {d.tags.length > 0 && (
                        <div style={{ marginTop:4 }}>
                          {d.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedDoc?.id === d.id && d.analysis_result && (
                    <div style={{ marginTop:12, borderTop:'1px solid #e5e8f0', paddingTop:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#8890a0',
                        textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>
                        Análise IA
                      </div>
                      <div style={s.analysisBox}>{d.analysis_result}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
