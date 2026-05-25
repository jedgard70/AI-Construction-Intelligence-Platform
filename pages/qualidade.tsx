'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../lib/supabase'

interface Checklist {
  id: string
  titulo: string
  categoria: string
  norma: string | null
  status: string
  itens: Array<{ id: number; item: string; ok: boolean }>
  responsavel: string | null
  data_prev: string | null
  observacoes: string | null
  project_id: string | null
}

interface NCI {
  id: string
  titulo: string
  projeto: string | null
  responsavel: string | null
  severidade: string
  status: string
  prazo: string | null
}

interface QualityNciRow {
  id: string
  title: string
  project_id: string | null
  opened_by: string | null
  severity: string
  status: string
  deadline: string | null
  projects?: { name: string | null } | Array<{ name: string | null }> | null
}

const sevColor: Record<string, string> = { critica:'#A32D2D', maior:'#BA7517', menor:'#185FA5', observacao:'#3B6D11' }
const sevLabel: Record<string, string> = { critica:'CRÍTICA', maior:'MAIOR', menor:'MENOR', observacao:'OBSERVAÇÃO' }
const stColor: Record<string, string> = { aberta:'#A32D2D', em_analise:'#BA7517', em_correcao:'#185FA5', aguardando_verificacao:'#185FA5', fechada:'#3B6D11', cancelada:'#8890a0' }
const stLabel: Record<string, string> = { aberta:'Aberta', em_analise:'Em análise', em_correcao:'Em correção', aguardando_verificacao:'Aguardando verificação', fechada:'Fechada', cancelada:'Cancelada' }

function mapQualityNci(row: QualityNciRow): NCI {
  const project = Array.isArray(row.projects) ? row.projects[0] : row.projects
  return { id: row.id, titulo: row.title, projeto: project?.name ?? row.project_id, responsavel: row.opened_by?.slice(0, 8).toUpperCase() ?? null, severidade: row.severity, status: row.status, prazo: row.deadline }
}

export default function QualidadePage() {
  const router = useRouter()
  const [tab, setTab] = useState<'checklists'|'ncis'>('checklists')
  const [filtro, setFiltro] = useState('todas')
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [ncis, setNcis] = useState<NCI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const sb = getSupabase()
      if (!sb) { setLoading(false); return }
      const [{ data: ckData }, { data: nciData }] = await Promise.all([
        sb.from('checklists').select('*').order('created_at', { ascending: false }),
        sb.from('quality_nci').select('id,title,project_id,opened_by,severity,status,deadline,created_at,projects(name)').order('created_at', { ascending: false }),
      ])
      if (ckData) setChecklists(ckData as Checklist[])
      if (nciData) setNcis((nciData as QualityNciRow[]).map(mapQualityNci))
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = filtro === 'todas' ? checklists : checklists.filter(c => c.status === filtro)
  const abertas = checklists.filter(c => c.status === 'pendente').length
  const emAndamento = checklists.filter(c => c.status === 'em_andamento').length
  const concluidos = checklists.filter(c => c.status === 'concluido').length
  const conformidadeMedia = checklists.length
    ? Math.round(checklists.reduce((acc, c) => {
        const ok = c.itens.filter(i => i.ok).length
        return acc + (c.itens.length > 0 ? (ok / c.itens.length) * 100 : 0)
      }, 0) / checklists.length)
    : 0

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
              { val:String(abertas), lbl:'Pendentes', color:'#A32D2D' },
              { val:String(emAndamento), lbl:'Em andamento', color:'#BA7517' },
              { val:String(concluidos), lbl:'Concluídos', color:'#3B6D11' },
              { val:`${conformidadeMedia}%`, lbl:'Conformidade média', color:'#185FA5' },
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
                {[['todas','Todas'],['aberta','Abertas'],['em_analise','Em análise'],['em_correcao','Em correção'],['fechada','Fechadas']].map(([v,l]) => (
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
                {loading && <div style={{ color:'#8890a0', fontSize:13, padding:8 }}>Carregando NCIs...</div>}
                {!loading && ncis.length === 0 && (
                  <div style={{ color:'#8890a0', fontSize:13, padding:8 }}>
                    Nenhuma não-conformidade registrada. As NCIs aparecerão aqui conforme forem lançadas.
                  </div>
                )}
                {ncis
                  .filter(n => filtro === 'todas' || n.status === filtro)
                  .map(n => (
                  <div key={n.id} style={{ border:'1px solid #e5e8f0', borderRadius:10,
                    padding:'12px 16px', display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ flexShrink:0 }}>
                      <div style={{ fontSize:10, fontFamily:'monospace', color:'#8890a0', marginBottom:2 }}>
                        {n.id.slice(0,8).toUpperCase()}
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                        borderRadius:20, background: (sevColor[n.severidade] ?? '#888')+'18',
                        color: sevColor[n.severidade] ?? '#888',
                        border:`1px solid ${(sevColor[n.severidade] ?? '#888')}44` }}>
                        {sevLabel[n.severidade] ?? n.severidade.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{n.titulo}</div>
                      <div style={{ fontSize:11, color:'#8890a0' }}>{n.projeto ?? '—'} · {n.responsavel ?? '—'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color: stColor[n.status] ?? '#888',
                        marginBottom:3 }}>{stLabel[n.status] ?? n.status}</div>
                      <div style={{ fontSize:10, color:'#8890a0' }}>Prazo: {n.prazo ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'checklists' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Filtro status */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[['todas','Todas'],['pendente','Pendentes'],['em_andamento','Em andamento'],['concluido','Concluídos']].map(([v,l]) => (
                  <button key={v} onClick={() => setFiltro(v)} style={{
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', fontFamily:'inherit', border:'1px solid',
                    background: filtro===v ? '#185FA5' : '#f4f5f7',
                    color: filtro===v ? '#fff' : '#5a6282',
                    borderColor: filtro===v ? '#185FA5' : '#e5e8f0',
                  }}>{l}</button>
                ))}
              </div>

              {/* Lista Checklists */}
              {loading && <div style={{ color:'#8890a0', fontSize:13, padding:8 }}>Carregando checklists...</div>}
              {!loading && filtered.length === 0 && (
                <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12,
                  padding:'20px 22px', color:'#8890a0', fontSize:13 }}>
                  Nenhum checklist encontrado para o filtro selecionado.
                </div>
              )}
              {filtered.map(c => {
                const okCount = c.itens.filter(i => i.ok).length
                const pct = c.itens.length > 0 ? Math.round((okCount / c.itens.length) * 100) : 0
                return (
                  <div key={c.id} style={{ background:'#fff', border:'1px solid #e5e8f0',
                    borderRadius:12, padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{c.titulo}</div>
                        <div style={{ fontSize:11, color:'#8890a0' }}>
                          {c.categoria} {c.norma ? `· ${c.norma}` : ''} {c.responsavel ? `· ${c.responsavel}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px',
                        borderRadius:20, background: (stColor[c.status] ?? '#888')+'18',
                        color: stColor[c.status] ?? '#888',
                        border:`1px solid ${(stColor[c.status] ?? '#888')}44`,
                        whiteSpace:'nowrap' }}>
                        {stLabel[c.status] ?? c.status}
                      </span>
                    </div>
                    {/* Barra de progresso */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, height:6, background:'#e5e8f0', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%',
                          background: pct >= 80 ? '#3B6D11' : pct >= 50 ? '#BA7517' : '#A32D2D',
                          borderRadius:3, transition:'width .3s' }} />
                      </div>
                      <div style={{ fontSize:11, fontFamily:'monospace', color:'#5a6282', whiteSpace:'nowrap' }}>
                        {okCount}/{c.itens.length} ({pct}%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
