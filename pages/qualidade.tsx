'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PrintShareModal, { printDocument } from '../components/PrintShareModal'

const CHECKLISTS = [
  { norma:'NBR 15575', descricao:'Desempenho de edificações habitacionais', conformidade:91, itens:48, ok:44 },
  { norma:'NBR 6118', descricao:'Projeto de estruturas de concreto', conformidade:97, itens:32, ok:31 },
  { norma:'NBR 13749', descricao:'Revestimentos de paredes e tetos', conformidade:85, itens:20, ok:17 },
  { norma:'ISO 9001', descricao:'Sistema de gestão da qualidade', conformidade:88, itens:65, ok:57 },
]

const sevColor: Record<string,string> = { critica:'#A32D2D', alta:'#BA7517', media:'#185FA5', baixa:'#3B6D11' }
const sevLabel: Record<string,string> = { critica:'CRÍTICA', alta:'ALTA', media:'MÉDIA', baixa:'BAIXA' }
const stColor:  Record<string,string> = { aberta:'#A32D2D', em_andamento:'#BA7517', resolvida:'#3B6D11' }
const stLabel:  Record<string,string> = { aberta:'Aberta', em_andamento:'Em andamento', resolvida:'Resolvida' }

interface NCI {
  id: string
  titulo: string
  severidade: 'critica' | 'alta' | 'media' | 'baixa'
  status: 'aberta' | 'em_andamento' | 'resolvida'
  prazo: string
  responsavel: string
  projeto: string
  createdAt: string
}

interface AtlasProject { id: string; name: string }


function buildNciHtml(n: NCI) {
  return `
<h1>⚠️ Não Conformidade — ${n.id}</h1>
<div class="meta">
  <span>🏗️ ${n.projeto}</span>
  <span>👷 ${n.responsavel}</span>
  <span>📅 Prazo: ${n.prazo}</span>
</div>
<h2>Identificação</h2>
<div class="grid">
  <div class="field"><label>Código</label><p>${n.id}</p></div>
  <div class="field"><label>Severidade</label><p>${sevLabel[n.severidade]}</p></div>
  <div class="field"><label>Status</label><p>${stLabel[n.status]}</p></div>
  <div class="field"><label>Prazo de resolução</label><p>${n.prazo}</p></div>
  <div class="field"><label>Responsável</label><p>${n.responsavel}</p></div>
  <div class="field"><label>Projeto</label><p>${n.projeto}</p></div>
</div>
<h2>Descrição da Não Conformidade</h2>
<div class="text-area">${n.titulo}</div>
<h2>Plano de Ação</h2>
<div class="text-area">[ A ser preenchido pelo responsável ]</div>
<h2>Referência Normativa</h2>
<div class="text-area">NBR 15575 · ISO 9001 · PBQP-H</div>`
}

function buildChecklistHtml(c: typeof CHECKLISTS[0]) {
  const notOk = c.itens - c.ok
  return `
<h1>✅ Checklist de Conformidade — ${c.norma}</h1>
<div class="meta">
  <span>📋 ${c.descricao}</span>
  <span>📅 ${new Date().toLocaleDateString('pt-BR')}</span>
</div>
<h2>Resultado Geral</h2>
<div class="grid3">
  <div class="field"><label>Conformidade</label><p style="font-size:24px;font-weight:700;color:${c.conformidade>=95?'#3B6D11':c.conformidade>=85?'#BA7517':'#A32D2D'}">${c.conformidade}%</p></div>
  <div class="field"><label>Itens Conformes</label><p style="font-size:20px;font-weight:700;color:#3B6D11">${c.ok}</p></div>
  <div class="field"><label>Itens Não Conformes</label><p style="font-size:20px;font-weight:700;color:#A32D2D">${notOk}</p></div>
</div>
<div class="progress" style="margin:12px 0 4px"><div class="progress-bar" style="width:${c.conformidade}%;background:${c.conformidade>=95?'#3B6D11':c.conformidade>=85?'#BA7517':'#A32D2D'}"></div></div>
<p style="font-size:11px;color:#8890a0">${c.ok} de ${c.itens} itens dentro do padrão normativo</p>
<h2>Detalhamento por Item</h2>
<table>
  <tr><th>#</th><th>Item</th><th>Status</th></tr>
  ${Array.from({length:Math.min(c.ok,10)},(_,i)=>`<tr><td>${i+1}</td><td>Item de verificação ${i+1}</td><td><span class="badge badge-green">CONFORME</span></td></tr>`).join('')}
  ${notOk>0?Array.from({length:Math.min(notOk,5)},(_,i)=>`<tr><td>${c.ok+i+1}</td><td>Item de verificação ${c.ok+i+1}</td><td><span class="badge badge-red">NÃO CONFORME</span></td></tr>`).join(''):''}
</table>`
}

const BLANK_FORM = { titulo:'', severidade:'alta' as NCI['severidade'], projeto:'', responsavel:'', prazo:'' }

export default function QualidadePage() {
  const router = useRouter()
  const [tab, setTab]     = useState<'ncis'|'checklists'>('ncis')
  const [filtro, setFiltro] = useState('todas')
  const [modal, setModal] = useState<{ title:string; buildHtml:()=>string; buildText:()=>string } | null>(null)
  const [ncis, setNcis] = useState<NCI[]>([])
  const [projects, setProjects] = useState<AtlasProject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nciForm, setNciForm] = useState(BLANK_FORM)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('atlas_ncis') || '[]') as NCI[]
      setNcis(stored)
    } catch { setNcis([]) }

    try {
      const ps = JSON.parse(localStorage.getItem('atlas_projects') || '[]') as AtlasProject[]
      setProjects(ps)
      if (ps[0] && !nciForm.projeto) setNciForm(f => ({ ...f, projeto: ps[0].name }))
    } catch {}
  }, [])

  function saveNcis(updated: NCI[]) {
    setNcis(updated)
    try { localStorage.setItem('atlas_ncis', JSON.stringify(updated)) } catch {}
  }

  function addNci() {
    if (!nciForm.titulo.trim()) return
    const seq = ncis.length + 1
    const newNci: NCI = {
      id: `NCI-${String(seq).padStart(3,'0')}`,
      titulo: nciForm.titulo,
      severidade: nciForm.severidade,
      status: 'aberta',
      prazo: nciForm.prazo || new Date(Date.now()+7*86400000).toLocaleDateString('pt-BR'),
      responsavel: nciForm.responsavel,
      projeto: nciForm.projeto,
      createdAt: new Date().toISOString(),
    }
    saveNcis([newNci, ...ncis])
    setNciForm(BLANK_FORM)
    setShowForm(false)
  }

  function updateStatus(id: string, status: NCI['status']) {
    saveNcis(ncis.map(n => n.id === id ? { ...n, status } : n))
  }

  const displayed = filtro === 'todas' ? ncis : ncis.filter(n => n.status === filtro)
  const today = new Date(); today.setHours(0,0,0,0)

  // KPIs from real data
  const nciAbertas  = ncis.filter(n => n.status === 'aberta').length
  const nciVencidas = ncis.filter(n => {
    if (n.status === 'resolvida') return false
    try {
      const [d,m,y] = n.prazo.split('/').map(Number)
      return new Date(y, m-1, d) < today
    } catch { return false }
  }).length

  function openNciModal(n: NCI) {
    setModal({
      title: `NCI ${n.id} — ${n.projeto}`,
      buildHtml: () => buildNciHtml(n),
      buildText: () => [
        `⚠️ NÃO CONFORMIDADE — ${n.id}`,
        `Projeto: ${n.projeto}`,
        `Responsável: ${n.responsavel}`,
        `Severidade: ${sevLabel[n.severidade]}`,
        `Status: ${stLabel[n.status]}`,
        `Prazo: ${n.prazo}`,
        ``,
        `Descrição: ${n.titulo}`,
      ].join('\n'),
    })
  }

  function openChecklistModal(c: typeof CHECKLISTS[0]) {
    const notOk = c.itens - c.ok
    setModal({
      title: `Checklist ${c.norma}`,
      buildHtml: () => buildChecklistHtml(c),
      buildText: () => [
        `✅ CHECKLIST — ${c.norma}`,
        `${c.descricao}`,
        ``,
        `Conformidade: ${c.conformidade}%`,
        `Itens conformes: ${c.ok} de ${c.itens}`,
        `Não conformes: ${notOk}`,
        ``,
        `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      ].join('\n'),
    })
  }

  function printAllNcis() {
    const html = `
<h1>⚠️ Relatório de Não Conformidades (NCIs)</h1>
<div class="meta"><span>📅 ${new Date().toLocaleDateString('pt-BR')}</span><span>Total: ${displayed.length} NCIs</span></div>
<table>
  <tr><th>Código</th><th>Descrição</th><th>Severidade</th><th>Status</th><th>Prazo</th><th>Responsável</th></tr>
  ${displayed.map(n => `<tr>
    <td><strong>${n.id}</strong></td>
    <td>${n.titulo}</td>
    <td><span class="badge badge-${n.severidade==='critica'||n.severidade==='alta'?'red':'blue'}">${sevLabel[n.severidade]}</span></td>
    <td>${stLabel[n.status]}</td>
    <td>${n.prazo}</td>
    <td>${n.responsavel}</td>
  </tr>`).join('')}
</table>`
    printDocument('Relatório NCIs', html)
  }

  function printAllChecklists() {
    const html = `
<h1>✅ Relatório de Checklists Normativos</h1>
<div class="meta"><span>📅 ${new Date().toLocaleDateString('pt-BR')}</span></div>
<table>
  <tr><th>Norma</th><th>Descrição</th><th>Conformidade</th><th>Itens OK</th><th>Não conformes</th></tr>
  ${CHECKLISTS.map(c => `<tr>
    <td><strong>${c.norma}</strong></td>
    <td>${c.descricao}</td>
    <td style="font-weight:700;color:${c.conformidade>=95?'#3B6D11':c.conformidade>=85?'#BA7517':'#A32D2D'}">${c.conformidade}%</td>
    <td>${c.ok}</td>
    <td>${c.itens - c.ok}</td>
  </tr>`).join('')}
</table>`
    printDocument('Checklists Normativos', html)
  }

  const s: Record<string, React.CSSProperties> = {
    page:    { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar:  { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px',
      height:52, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:10 },
    back:    { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body:    { maxWidth:960, margin:'0 auto', padding:'28px 20px' },
    card:    { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    kpiGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
    kpi:     { background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, padding:'14px 16px' },
    kpiVal:  { fontSize:26, fontWeight:700, fontFamily:'monospace', marginBottom:2 },
    kpiLbl:  { fontSize:10, color:'#8890a0', fontWeight:600, textTransform:'uppercase' as 'uppercase', letterSpacing:'.08em' },
    tabs:    { display:'flex', gap:4, marginBottom:20, alignItems:'center', flexWrap:'wrap' as 'wrap' },
    tab:     { padding:'7px 18px', borderRadius:7, border:'1px solid #e5e8f0',
      fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' },
    printBtn:{ padding:'6px 14px', border:'1px solid #e5e8f0', borderRadius:7,
      background:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
      fontFamily:'inherit', color:'#5a6282', display:'flex', alignItems:'center', gap:5 },
    inp:     { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:12,
      color:'#1a1f36', background:'#f8f9fc', fontFamily:'inherit', width:'100%',
      boxSizing:'border-box' as 'border-box' },
    sel:     { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:12,
      color:'#1a1f36', background:'#f8f9fc', fontFamily:'inherit', width:'100%' },
  }

  return (
    <>
      <Head><title>Qualidade — NCIs e Checklists</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>🔍 Gestão da Qualidade</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>NBR 15575 · ISO 9001</div>
        </div>

        <div style={s.body}>
          {/* KPIs */}
          <div style={s.kpiGrid}>
            {[
              { val: String(nciAbertas), lbl:'NCIs Abertas', color:'#A32D2D' },
              { val: String(nciVencidas), lbl:'Vencidas', color: nciVencidas > 0 ? '#BA7517' : '#3B6D11' },
              { val: ncis.length > 0 ? ((ncis.filter(n=>n.status==='resolvida').length/ncis.length)*100).toFixed(0)+'%' : '—', lbl:'Taxa Resolução', color:'#3B6D11' },
              { val:'91%', lbl:'NBR 15575', color:'#3B6D11' },
            ].map(k => (
              <div key={k.lbl} style={s.kpi}>
                <div style={{ ...s.kpiVal, color: k.color }}>{k.val}</div>
                <div style={s.kpiLbl}>{k.lbl}</div>
              </div>
            ))}
          </div>

          {/* Tabs + botão imprimir tudo */}
          <div style={s.tabs}>
            {(['ncis','checklists'] as const).map(t => (
              <button key={t} style={{ ...s.tab,
                background: tab===t ? '#185FA5' : '#fff',
                color: tab===t ? '#fff' : '#5a6282',
                borderColor: tab===t ? '#185FA5' : '#e5e8f0',
              }} onClick={() => setTab(t)}>
                {t === 'ncis' ? '⚠ Não Conformidades (NCIs)' : '✅ Checklists / Normas'}
              </button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              {tab === 'ncis' && (
                <button style={{ ...s.printBtn, background:'#185FA5', color:'#fff', borderColor:'#185FA5' }}
                  onClick={() => setShowForm(v => !v)}>
                  {showForm ? '✕ Cancelar' : '+ Nova NCI'}
                </button>
              )}
              <button style={s.printBtn}
                onClick={() => tab === 'ncis' ? printAllNcis() : printAllChecklists()}>
                🖨️ Imprimir lista
              </button>
            </div>
          </div>

          {tab === 'ncis' && (
            <>
              {/* Formulário Nova NCI */}
              {showForm && (
                <div style={{ ...s.card, border:'1px solid #185FA5', background:'#EFF4FF', marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#185FA5', marginBottom:14, letterSpacing:'.06em' }}>
                    NOVA NÃO CONFORMIDADE
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ fontSize:11, fontWeight:600, color:'#5a6282', display:'block', marginBottom:4 }}>Descrição *</label>
                      <input style={s.inp} placeholder="Descreva a não conformidade..."
                        value={nciForm.titulo} onChange={e => setNciForm(f => ({ ...f, titulo: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#5a6282', display:'block', marginBottom:4 }}>Severidade</label>
                      <select style={s.sel} value={nciForm.severidade}
                        onChange={e => setNciForm(f => ({ ...f, severidade: e.target.value as NCI['severidade'] }))}>
                        <option value="critica">Crítica</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#5a6282', display:'block', marginBottom:4 }}>Projeto</label>
                      {projects.length > 0 ? (
                        <select style={s.sel} value={nciForm.projeto}
                          onChange={e => setNciForm(f => ({ ...f, projeto: e.target.value }))}>
                          {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      ) : (
                        <input style={s.inp} placeholder="Nome do projeto"
                          value={nciForm.projeto} onChange={e => setNciForm(f => ({ ...f, projeto: e.target.value }))} />
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#5a6282', display:'block', marginBottom:4 }}>Responsável</label>
                      <input style={s.inp} placeholder="Nome do responsável"
                        value={nciForm.responsavel} onChange={e => setNciForm(f => ({ ...f, responsavel: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#5a6282', display:'block', marginBottom:4 }}>Prazo (dd/mm/aaaa)</label>
                      <input style={s.inp} placeholder="Ex: 30/06/2026"
                        value={nciForm.prazo} onChange={e => setNciForm(f => ({ ...f, prazo: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={() => { setShowForm(false); setNciForm(BLANK_FORM) }}
                      style={{ ...s.printBtn }}>Cancelar</button>
                    <button onClick={addNci}
                      style={{ padding:'7px 18px', background:'#185FA5', color:'#fff', border:'none',
                        borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Salvar NCI
                    </button>
                  </div>
                </div>
              )}

              <div style={s.card}>
                {/* Filtro */}
                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' as 'wrap' }}>
                  {[['todas','Todas'],['aberta','Abertas'],['em_andamento','Em andamento'],['resolvida','Resolvidas']].map(([v,l]) => (
                    <button key={v} onClick={() => setFiltro(v)} style={{
                      padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                      cursor:'pointer', fontFamily:'inherit', border:'1px solid',
                      background: filtro===v ? '#185FA5' : '#f4f5f7',
                      color: filtro===v ? '#fff' : '#5a6282',
                      borderColor: filtro===v ? '#185FA5' : '#e5e8f0',
                    }}>{l}</button>
                  ))}
                </div>

                {/* Lista NCIs */}
                {displayed.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px', color:'#8890a0', fontSize:13 }}>
                    Nenhuma NCI encontrada. Clique em "+ Nova NCI" para adicionar.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {displayed.map(n => (
                      <div key={n.id} style={{ border:'1px solid #e5e8f0', borderRadius:10,
                        padding:'12px 16px', display:'flex', alignItems:'center', gap:16 }}>
                        <div style={{ flexShrink:0 }}>
                          <div style={{ fontSize:10, fontFamily:'monospace', color:'#8890a0', marginBottom:2 }}>{n.id}</div>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                            borderRadius:20, background: sevColor[n.severidade]+'18',
                            color: sevColor[n.severidade], border:`1px solid ${sevColor[n.severidade]}44` }}>
                            {sevLabel[n.severidade]}
                          </span>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{n.titulo}</div>
                          <div style={{ fontSize:11, color:'#8890a0' }}>{n.projeto} · {n.responsavel}</div>
                        </div>
                        <div style={{ textAlign:'right' as 'right', flexShrink:0 }}>
                          <div style={{ marginBottom:4 }}>
                            <select value={n.status} onChange={e => updateStatus(n.id, e.target.value as NCI['status'])}
                              style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20,
                                border:'1px solid', cursor:'pointer', fontFamily:'inherit',
                                background: stColor[n.status]+'18',
                                color: stColor[n.status], borderColor: stColor[n.status]+'44' }}>
                              <option value="aberta">Aberta</option>
                              <option value="em_andamento">Em andamento</option>
                              <option value="resolvida">Resolvida</option>
                            </select>
                          </div>
                          <div style={{ fontSize:10, color:'#8890a0', marginBottom:8 }}>Prazo: {n.prazo}</div>
                          <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                            <button onClick={() => openNciModal(n)}
                              style={{ padding:'4px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                                background:'#fff', fontSize:10, fontWeight:600, cursor:'pointer',
                                fontFamily:'inherit', color:'#5a6282', display:'flex', alignItems:'center', gap:4 }}>
                              🖨️ Imprimir
                            </button>
                            <button onClick={() => openNciModal(n)}
                              style={{ padding:'4px 10px', border:'1px solid #3B6D11', borderRadius:6,
                                background:'#EAF3DE', fontSize:10, fontWeight:600, cursor:'pointer',
                                fontFamily:'inherit', color:'#3B6D11', display:'flex', alignItems:'center', gap:4 }}>
                              📤 Compartilhar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'checklists' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {CHECKLISTS.map(c => (
                <div key={c.norma} style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36', marginBottom:2 }}>{c.norma}</div>
                      <div style={{ fontSize:12, color:'#8890a0' }}>{c.descricao}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => { printDocument(`Checklist ${c.norma}`, buildChecklistHtml(c)) }}
                          style={{ padding:'5px 10px', border:'1px solid #e5e8f0', borderRadius:6,
                            background:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
                            fontFamily:'inherit', color:'#5a6282' }}>🖨️</button>
                        <button onClick={() => openChecklistModal(c)}
                          style={{ padding:'5px 10px', border:'1px solid #185FA5', borderRadius:6,
                            background:'#EFF4FF', fontSize:11, fontWeight:600, cursor:'pointer',
                            fontFamily:'inherit', color:'#185FA5' }}>📤</button>
                      </div>
                      <div style={{ fontSize:22, fontWeight:700, fontFamily:'monospace',
                        color: c.conformidade >= 95 ? '#3B6D11' : c.conformidade >= 85 ? '#BA7517' : '#A32D2D' }}>
                        {c.conformidade}%
                      </div>
                    </div>
                  </div>
                  <div style={{ height:6, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${c.conformidade}%`,
                      background: c.conformidade >= 95 ? '#3B6D11' : c.conformidade >= 85 ? '#BA7517' : '#A32D2D',
                      transition:'width .4s' }} />
                  </div>
                  <div style={{ fontSize:11, color:'#8890a0', marginTop:6 }}>
                    {c.ok} de {c.itens} itens conformes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <PrintShareModal
          title={modal.title}
          onClose={() => setModal(null)}
          buildHtml={modal.buildHtml}
          buildText={modal.buildText}
        />
      )}
    </>
  )
}
