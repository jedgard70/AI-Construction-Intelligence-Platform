'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const DOCS_EXEMPLO = [
  { id:'D-001', nome:'Contrato_Horizonte_Torre_A.pdf', tipo:'Contrato', tamanho:'2,4 MB', data:'15/05/2026', status:'Analisado', tags:['Contrato','Obra','Alto risco'] },
  { id:'D-002', nome:'Laudo_Estrutural_Industrial.pdf', tipo:'Laudo', tamanho:'5,1 MB', data:'12/05/2026', status:'Analisado', tags:['Laudo','Estrutura','NBR 6118'] },
  { id:'D-003', nome:'Planta_Aprovada_ValeVerde.pdf', tipo:'Planta', tamanho:'18,3 MB', data:'10/05/2026', status:'Pendente', tags:['Planta','Aprovação','PMSP'] },
  { id:'D-004', nome:'NF_Materiais_Mai2026.pdf', tipo:'Nota Fiscal', tamanho:'0,8 MB', data:'19/05/2026', status:'Analisado', tags:['NF','Materiais','Tributário'] },
]

const TIPO_COLOR: Record<string,string> = { 'Contrato':'#534AB7', 'Laudo':'#185FA5', 'Planta':'#3B6D11', 'Nota Fiscal':'#BA7517' }

export default function DocumentosPage() {
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<typeof DOCS_EXEMPLO[0] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyzeFile(file: File) {
    setAnalyzing(true)
    setResult('')
    try {
      const text = await file.text().catch(() => '[Arquivo binário — OCR necessário]')
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:800,
          system:`Você é o Document_Intelligence_AI. Analise o documento de construção civil enviado e retorne:
1. Tipo de documento
2. Partes envolvidas (se aplicável)
3. Cláusulas ou pontos críticos
4. Riscos identificados
5. Prazo/validade (se aplicável)
Seja direto e use formatação clara.`,
          messages:[{ role:'user', content:`Analise este documento:\n\n${text.slice(0,3000)}` }]
        })
      })
      const data = await res.json()
      setResult(data?.content?.[0]?.text || 'Não foi possível analisar o documento.')
    } catch {
      setResult('Erro ao conectar com o agente. Verifique a API key.')
    }
    setAnalyzing(false)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px', height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body: { maxWidth:1040, margin:'0 auto', padding:'28px 20px' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    secTitle: { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0', textTransform:'uppercase', marginBottom:14 },
    dropzone: { border:`2px dashed ${dragging ? '#185FA5' : '#d0d5e0'}`, borderRadius:12,
      padding:'36px 20px', textAlign:'center', cursor:'pointer', transition:'all .2s',
      background: dragging ? 'rgba(24,95,165,.04)' : '#fafafa' },
  }

  return (
    <>
      <Head><title>Documentos — Document Intelligence</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📑 Document Intelligence</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>OCR · Classificação · Análise IA</div>
        </div>

        <div style={s.body}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Upload */}
            <div>
              <div style={s.card}>
                <div style={s.secTitle}>Upload e Análise</div>
                <div style={s.dropzone}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragging(false)
                    const f = e.dataTransfer.files[0]
                    if (f) analyzeFile(f)
                  }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:4 }}>
                    Arraste um documento ou clique para selecionar
                  </div>
                  <div style={{ fontSize:12, color:'#8890a0' }}>PDF, DWG, DOC, XLSX — máx. 50MB</div>
                  <input ref={fileRef} type="file" style={{ display:'none' }}
                    accept=".pdf,.doc,.docx,.xlsx,.dwg,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if(f) analyzeFile(f) }} />
                </div>

                {analyzing && (
                  <div style={{ marginTop:16, padding:'14px 16px', background:'#EFF4FF',
                    borderRadius:10, border:'1px solid #B5D4F4', fontSize:13, color:'#185FA5' }}>
                    ⏳ Analisando documento com Document_Intelligence_AI...
                  </div>
                )}

                {result && (
                  <div style={{ marginTop:16, padding:'14px 16px', background:'#f8f9fc',
                    borderRadius:10, border:'1px solid #e5e8f0', fontSize:12,
                    lineHeight:1.7, color:'#1a1f36', whiteSpace:'pre-wrap' }}>
                    {result}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de documentos */}
            <div>
              <div style={s.card}>
                <div style={s.secTitle}>Documentos Recentes</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {DOCS_EXEMPLO.map(d => (
                    <div key={d.id} onClick={() => setSelectedDoc(d === selectedDoc ? null : d)}
                      style={{ border:`1px solid ${selectedDoc?.id===d.id ? '#185FA5' : '#e5e8f0'}`,
                        borderRadius:10, padding:'10px 14px', cursor:'pointer',
                        background: selectedDoc?.id===d.id ? '#EFF4FF' : '#fff',
                        transition:'all .15s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36' }}>{d.nome}</div>
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20,
                          background: d.status==='Analisado' ? '#EAF3DE' : '#FFF3E0',
                          color: d.status==='Analisado' ? '#3B6D11' : '#BA7517' }}>
                          {d.status}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:9, padding:'1px 7px', borderRadius:20,
                          background:(TIPO_COLOR[d.tipo]||'#888')+'18',
                          color: TIPO_COLOR[d.tipo]||'#888',
                          border:`1px solid ${(TIPO_COLOR[d.tipo]||'#888')}44`,
                          fontWeight:600 }}>{d.tipo}</span>
                        {d.tags.map(t => (
                          <span key={t} style={{ fontSize:9, padding:'1px 7px', borderRadius:20,
                            background:'#f0f0f0', color:'#5a6282' }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ fontSize:10, color:'#8890a0', marginTop:5 }}>
                        {d.tamanho} · {d.data}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
