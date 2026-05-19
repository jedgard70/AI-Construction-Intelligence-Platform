'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const NCIS = [
  { id:'NCI-001', titulo:'Fissuras em parede de alvenaria — Bloco A', severidade:'alta', status:'aberta', prazo:'20/05/2026', responsavel:'Eng. Carlos', projeto:'Edifício Horizonte' },
  { id:'NCI-002', titulo:'Caimento inadequado em laje de cobertura', severidade:'critica', status:'aberta', prazo:'18/05/2026', responsavel:'Eng. Ana', projeto:'Complexo Industrial Norte' },
  { id:'NCI-003', titulo:'Argamassa fora do traço — Fundação P-12', severidade:'media', status:'em_andamento', prazo:'25/05/2026', responsavel:'Eng. João', projeto:'Condomínio Vale Verde' },
  { id:'NCI-004', titulo:'Revestimento cerâmico com empolamento', severidade:'baixa', status:'resolvida', prazo:'10/05/2026', responsavel:'Eng. Maria', projeto:'Edifício Horizonte' },
  { id:'NCI-005', titulo:'Espessura de laje abaixo do especificado — eixo D', severidade:'critica', status:'aberta', prazo:'17/05/2026', responsavel:'Eng. Carlos', projeto:'Complexo Industrial Norte' },
]

const CHECKLISTS = [
  { norma:'NBR 15575', descricao:'Desempenho de edificações habitacionais', conformidade:91, itens:48, ok:44 },
  { norma:'NBR 6118', descricao:'Projeto de estruturas de concreto', conformidade:97, itens:32, ok:31 },
  { norma:'NBR 13749', descricao:'Revestimentos de paredes e tetos', conformidade:85, itens:20, ok:17 },
  { norma:'ISO 9001', descricao:'Sistema de gestão da qualidade', conformidade:88, itens:65, ok:57 },
]

const sevColor: Record<string, string> = { critica:'#A32D2D', alta:'#BA7517', media:'#185FA5', baixa:'#3B6D11' }
const sevLabel: Record<string, string> = { critica:'CRÍTICA', alta:'ALTA', media:'MÉDIA', baixa:'BAIXA' }
const stColor: Record<string, string> = { aberta:'#A32D2D', em_andamento:'#BA7517', resolvida:'#3B6D11' }
const stLabel: Record<string, string> = { aberta:'Aberta', em_andamento:'Em andamento', resolvida:'Resolvida' }

export default function QualidadePage() {
  const router = useRouter()
  const [tab, setTab] = useState<'ncis'|'checklists'>('ncis')
  const [filtro, setFiltro] = useState('todas')

  const ncis = filtro === 'todas' ? NCIS : NCIS.filter(n => n.status === filtro)

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px',
      height:52, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body: { maxWidth:960, margin:'0 auto', padding:'28px 20px' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    kpiGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
    kpi: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, padding:'14px 16px' },
    kpiVal: { fontSize:26, fontWeight:700, fontFamily:'monospace', marginBottom:2 },
    kpiLbl: { fontSize:10, color:'#8890a0', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' },
    tabs: { display:'flex', gap:4, marginBottom:20 },
    tab: { padding:'7px 18px', borderRadius:7, border:'1px solid #e5e8f0',
      fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' },
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
              { val:'8', lbl:'NCIs Abertas', color:'#A32D2D' },
              { val:'3', lbl:'Vencidas', color:'#BA7517' },
              { val:'4,2%', lbl:'Taxa Retrabalho', color:'#A32D2D' },
              { val:'91%', lbl:'NBR 15575', color:'#3B6D11' },
            ].map(k => (
              <div key={k.lbl} style={s.kpi}>
                <div style={{ ...s.kpiVal, color: k.color }}>{k.val}</div>
                <div style={s.kpiLbl}>{k.lbl}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
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
          </div>

          {tab === 'ncis' && (
            <div style={s.card}>
              {/* Filtro */}
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
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
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ncis.map(n => (
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
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color: stColor[n.status],
                        marginBottom:3 }}>{stLabel[n.status]}</div>
                      <div style={{ fontSize:10, color:'#8890a0' }}>Prazo: {n.prazo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:'monospace',
                      color: c.conformidade >= 95 ? '#3B6D11' : c.conformidade >= 85 ? '#BA7517' : '#A32D2D' }}>
                      {c.conformidade}%
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
    </>
  )
}
