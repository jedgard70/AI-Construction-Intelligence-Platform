'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const DOCS_EXEMPLO = [
  { id:'D-001', nome:'Contrato_Horizonte_Torre_A.pdf', tipo:'Contrato', tamanho:'2,4 MB', data:'15/05/2026', status:'Analisado', tags:['Contrato','Obra','Alto risco'] },
  { id:'D-002', nome:'Laudo_Estrutural_Industrial.pdf', tipo:'Laudo', tamanho:'5,1 MB', data:'12/05/2026', status:'Analisado', tags:['Laudo','Estrutura','NBR 6118'] },
  { id:'D-003', nome:'Planta_Aprovada_ValeVerde.pdf', tipo:'Planta', tamanho:'18,3 MB', data:'10/05/2026', status:'Pendente', tags:['Planta','Aprovação','PMSP'] },
  { id:'D-004', nome:'NF_Materiais_Mai2026.pdf', tipo:'Nota Fiscal', tamanho:'0,8 MB', data:'19/05/2026', status:'Analisado', tags:['NF','Materiais','Tributário'] },
  { id:'D-005', nome:'Memorial_Descritivo_ValeVerde.pdf', tipo:'Memorial', tamanho:'3,2 MB', data:'08/05/2026', status:'Analisado', tags:['Memorial','NBR 12721','Residencial'] },
]

const TIPO_COLOR: Record<string,string> = {
  'Contrato':'#534AB7','Laudo':'#185FA5','Planta':'#3B6D11',
  'Nota Fiscal':'#BA7517','Memorial':'#8A4E2F'
}

const DOC_TYPES = [
  { icon:'📋', label:'Contrato', desc:'Contratos de obra, serviços, fornecimento' },
  { icon:'⚖️', label:'Laudo', desc:'Laudos técnicos, vistorias, perícias' },
  { icon:'📐', label:'Planta', desc:'Plantas arquitetônicas e complementares' },
  { icon:'🧾', label:'Nota Fiscal', desc:'NFs de materiais, serviços, equipamentos' },
  { icon:'📑', label:'Memorial', desc:'Memoriais descritivos e especificações' },
  { icon:'📜', label:'ART/RRT', desc:'Anotações de responsabilidade técnica' },
]

export default function DocumentosPage() {
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<typeof DOCS_EXEMPLO[0] | null>(null)
  const [docs, setDocs] = useState(DOCS_EXEMPLO)
  const [uploadPct, setUploadPct] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyzeFile(file: File) {
    setAnalyzing(true)
    setResult('')
    setFileName(file.name)
    setUploadPct(20)

    try {
      const isPDF  = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name)

      let messages: any[]

      if (isPDF || isImage) {
        // Claude Vision — lê o conteúdo visual do documento
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        setUploadPct(55)
        const mediaType = isPDF ? 'application/pdf' : (file.type || 'image/jpeg')
        messages = [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Analise este documento de construção civil e retorne um relatório completo com:

1. 📋 TIPO DE DOCUMENTO: identifique exatamente o tipo
2. 🏗️ PARTES ENVOLVIDAS: contratante, contratado, responsável técnico
3. 📍 OBJETO / OBRA: endereço, tipo de obra, área, descrição
4. 💰 VALORES: valores financeiros mencionados (contratos, orçamentos)
5. 📅 DATAS E PRAZOS: vigência, prazo de execução, vencimentos
6. ⚠️ PONTOS CRÍTICOS: cláusulas importantes, riscos, pendências
7. ✅ CONFORMIDADE: normas ABNT, NRs, legislação aplicável
8. 📌 AÇÕES RECOMENDADAS: próximos passos sugeridos

Seja detalhado e técnico. Use emojis nos títulos para facilitar leitura.` }
          ]
        }]
      } else {
        // Texto simples para outros formatos
        const text = await file.text().catch(() => '[Formato binário — envie PDF ou imagem para análise visual]')
        setUploadPct(55)
        messages = [{ role:'user', content:`Analise este documento de construção civil:\n\n${text.slice(0,4000)}` }]
      }

      setUploadPct(70)

      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:1500,
          system:`Você é o Document_Intelligence_AI — especialista em análise de documentos técnicos de construção civil, contratos de engenharia, laudos estruturais, plantas arquitetônicas, memoriais descritivos, notas fiscais e ARTs/RRTs. Faça análises precisas, técnicas e estruturadas. Identifique riscos, conformidades e não conformidades com a legislação brasileira (Código Civil, ABNT, NRs, LGPD).`,
          messages
        })
      })

      setUploadPct(90)
      const data = await res.json()
      const text = data?.content?.[0]?.text || 'Não foi possível analisar o documento.'
      setResult(text)
      setUploadPct(100)

      // Adiciona à lista
      const tipo = text.toLowerCase().includes('contrato') ? 'Contrato'
        : text.toLowerCase().includes('laudo') ? 'Laudo'
        : text.toLowerCase().includes('planta') ? 'Planta'
        : text.toLowerCase().includes('nota fiscal') ? 'Nota Fiscal'
        : text.toLowerCase().includes('memorial') ? 'Memorial'
        : 'Documento'

      setDocs(prev => [{
        id: `D-${String(Date.now()).slice(-3)}`,
        nome: file.name,
        tipo,
        tamanho: `${(file.size/1048576).toFixed(1)} MB`,
        data: new Date().toLocaleDateString('pt-BR'),
        status:'Analisado',
        tags:[tipo,'IA Vision']
      }, ...prev])

    } catch (err: any) {
      setResult(`❌ Erro ao analisar: ${err?.message || 'Falha de conexão'}`)
      setUploadPct(0)
    }
    setAnalyzing(false)
    setTimeout(() => setUploadPct(0), 2000)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px', height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body: { maxWidth:1100, margin:'0 auto', padding:'28px 20px' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    secTitle: { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0',
      textTransform:'uppercase' as const, marginBottom:14 },
    dropzone: { border:`2px dashed ${dragging ? '#185FA5' : '#d0d5e0'}`, borderRadius:12,
      padding:'36px 20px', textAlign:'center' as const, cursor:'pointer', transition:'all .2s',
      background: dragging ? 'rgba(24,95,165,.04)' : '#fafafa' },
  }

  return (
    <>
      <Head><title>Document Intelligence — AI Construction Platform</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📑 Document Intelligence AI</div>
            <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
              background:'#EFF4FF', color:'#185FA5', fontWeight:700 }}>Claude Vision</div>
          </div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>OCR · Classificação · Análise IA</div>
        </div>

        <div style={s.body}>

          {/* Tipos suportados */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:16 }}>
            {DOC_TYPES.map(dt => (
              <div key={dt.label} style={{ background:'#fff', border:'1px solid #e5e8f0',
                borderRadius:10, padding:'10px 12px', textAlign:'center' as const }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{dt.icon}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'#1a1f36' }}>{dt.label}</div>
                <div style={{ fontSize:9, color:'#8890a0', marginTop:2, lineHeight:1.3 }}>{dt.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 }}>

            {/* Upload + Resultado */}
            <div>
              <div style={s.card}>
                <div style={s.secTitle}>Upload e Análise com IA</div>

                <div style={s.dropzone}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragging(false)
                    const f = e.dataTransfer.files[0]
                    if (f) analyzeFile(f)
                  }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>
                    {analyzing ? '⏳' : '📤'}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:6 }}>
                    {analyzing ? `Analisando ${fileName}...` : 'Arraste um documento ou clique para selecionar'}
                  </div>
                  <div style={{ fontSize:12, color:'#8890a0', marginBottom:10 }}>
                    PDF, JPG, PNG — Claude Vision lê e analisa qualquer documento
                  </div>
                  {!analyzing && (
                    <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' as const }}>
                      {['PDF','Imagem','Contrato','Laudo','Planta','NF','Memorial','ART'].map(t => (
                        <span key={t} style={{ fontSize:9, padding:'2px 8px', borderRadius:20,
                          background:'#EFF4FF', color:'#185FA5', fontWeight:600 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <input ref={fileRef} type="file" style={{ display:'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xlsx,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if(f) analyzeFile(f) }} />
                </div>

                {/* Barra de progresso */}
                {(analyzing || uploadPct > 0) && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4,
                      fontSize:11, color:'#185FA5', fontWeight:600 }}>
                      <span>
                        {uploadPct < 40 ? 'Lendo arquivo...'
                          : uploadPct < 70 ? 'Enviando para Claude Vision...'
                          : uploadPct < 90 ? 'Analisando conteúdo...'
                          : '✅ Análise concluída!'}
                      </span>
                      <span>{uploadPct}%</span>
                    </div>
                    <div style={{ height:4, background:'#e5e8f0', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${uploadPct}%`, height:'100%', background:'#185FA5',
                        borderRadius:2, transition:'width .4s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Resultado */}
              {result && (
                <div style={s.card}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={s.secTitle}>📋 Resultado — {fileName}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => {
                        const w = window.open('','_blank','width=800,height=700')
                        if(!w) return
                        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Análise — ${fileName}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;font-size:12px;line-height:1.7;color:#1a1f36}
h1{color:#185FA5;font-size:18px}pre{white-space:pre-wrap;font-family:inherit}
.footer{margin-top:32px;border-top:1px solid #e5e8f0;padding-top:12px;font-size:10px;color:#8b93a7}
@media print{@page{margin:1cm}}</style>
</head><body><h1>📑 Análise Document Intelligence</h1><h2>${fileName}</h2><pre>${result}</pre>
<div class="footer">Document_Intelligence_AI · AI Construction Platform · ${new Date().toLocaleString('pt-BR')}</div>
<script>window.onload=()=>window.print()</script></body></html>`)
                        w.document.close()
                      }} style={{ padding:'5px 12px', border:'1px solid #e5e8f0', borderRadius:6,
                        background:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit', color:'#5a6282' }}>
                        🖨️ Imprimir
                      </button>
                      <button onClick={() => {
                        const wa = encodeURIComponent(`📑 *Análise Document Intelligence*\n${fileName}\n\n${result}`)
                        window.open(`https://wa.me/?text=${wa}`,'_blank')
                      }} style={{ padding:'5px 12px', border:'1px solid #3B6D11', borderRadius:6,
                        background:'#EAF3DE', fontSize:11, cursor:'pointer', fontFamily:'inherit', color:'#3B6D11' }}>
                        📲 Compartilhar
                      </button>
                    </div>
                  </div>
                  <div style={{ background:'#f8f9fc', border:'1px solid #e5e8f0', borderRadius:8,
                    padding:'14px 16px', fontSize:12, lineHeight:1.8, color:'#1a1f36',
                    whiteSpace:'pre-wrap', maxHeight:500, overflowY:'auto' }}>
                    {result}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de documentos */}
            <div>
              <div style={s.card}>
                <div style={s.secTitle}>Documentos Analisados ({docs.length})</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:600, overflowY:'auto' }}>
                  {docs.map(d => (
                    <div key={d.id} onClick={() => setSelectedDoc(d === selectedDoc ? null : d)}
                      style={{ border:`1px solid ${selectedDoc?.id===d.id ? '#185FA5' : '#e5e8f0'}`,
                        borderRadius:10, padding:'10px 14px', cursor:'pointer',
                        background: selectedDoc?.id===d.id ? '#EFF4FF' : '#fff',
                        transition:'all .15s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36', flex:1, marginRight:8, wordBreak:'break-word' as const }}>{d.nome}</div>
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, flexShrink:0,
                          background: d.status==='Analisado' ? '#EAF3DE' : '#FFF3E0',
                          color: d.status==='Analisado' ? '#3B6D11' : '#BA7517' }}>
                          {d.status}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:9, padding:'1px 7px', borderRadius:20, fontWeight:600,
                          background:(TIPO_COLOR[d.tipo]||'#888')+'18',
                          color: TIPO_COLOR[d.tipo]||'#888',
                          border:`1px solid ${(TIPO_COLOR[d.tipo]||'#888')}44` }}>
                          {d.tipo}
                        </span>
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
