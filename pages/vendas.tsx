'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const LEADS = [
  { id:'L-001', nome:'Grupo Cavalcanti Incorporações', tipo:'Investidor', valor:'R$ 12,4M', etapa:'Proposta enviada', score:92, contato:'pedro@cavalcanti.com.br' },
  { id:'L-002', nome:'Fundo Imobiliário CerradoSul', tipo:'Fundo', valor:'R$ 28,1M', etapa:'Reunião agendada', score:87, contato:'investimentos@cerradosul.com.br' },
  { id:'L-003', nome:'Construtora Horizonte SP', tipo:'Parceiro', valor:'R$ 5,2M', etapa:'Qualificação', score:74, contato:'comercial@horizontesp.com.br' },
  { id:'L-004', nome:'Dr. Marcelo Ferreira', tipo:'Investidor PF', valor:'R$ 1,8M', etapa:'Contato inicial', score:61, contato:'mferreira@gmail.com' },
  { id:'L-005', nome:'Real Estate Partners LATAM', tipo:'Fundo', valor:'R$ 45,0M', etapa:'Due diligence', score:95, contato:'deals@repartners.com' },
]

const ETAPAS = ['Contato inicial','Qualificação','Reunião agendada','Proposta enviada','Due diligence','Fechado']
const TIPO_COLORS: Record<string,string> = { 'Investidor':'#534AB7', 'Fundo':'#185FA5', 'Parceiro':'#3B6D11', 'Investidor PF':'#BA7517' }

export default function VendasPage() {
  const router = useRouter()
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [trigger, setTrigger] = useState('roi_and_valuation_locked')

  async function launchCampaign() {
    setLaunching(true)
    try {
      await fetch('/api/sales/pipeline', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          trigger,
          project_id: 'horizonte',
          assets: { renders:[], financials:{ roi:22.1, tir:18.4 }, esg_score:74 }
        })
      })
    } catch {}
    setLaunching(false)
    setLaunched(true)
    setTimeout(() => setLaunched(false), 4000)
  }

  const totalVGV = LEADS.reduce((a,l) => a + parseFloat(l.valor.replace('R$ ','').replace(',','.').replace('M','')), 0)

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px', height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body: { maxWidth:1040, margin:'0 auto', padding:'28px 20px' },
    kpiGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 },
    kpi: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, padding:'14px 16px' },
    kpiVal: { fontSize:22, fontWeight:700, fontFamily:'monospace', marginBottom:2 },
    kpiLbl: { fontSize:10, color:'#8890a0', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    secTitle: { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0', textTransform:'uppercase', marginBottom:14 },
    btn: { padding:'10px 22px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' },
    select: { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:13,
      color:'#1a1f36', background:'#f8f9fc', outline:'none', fontFamily:'inherit' },
  }

  return (
    <>
      <Head><title>Sales Pipeline — AI Construction Platform</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📊 Sales & Captação de Investimentos</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>Investment Engine v5.3</div>
        </div>

        <div style={s.body}>
          {/* KPIs */}
          <div style={s.kpiGrid}>
            {[
              { val:`R$ ${totalVGV.toFixed(1)}M`, lbl:'VGV Pipeline', color:'#185FA5' },
              { val:String(LEADS.length), lbl:'Leads ativos', color:'#534AB7' },
              { val:'1', lbl:'Em due diligence', color:'#3B6D11' },
              { val:'87', lbl:'Score médio', color:'#BA7517' },
            ].map(k => (
              <div key={k.lbl} style={s.kpi}>
                <div style={{ ...s.kpiVal, color:k.color }}>{k.val}</div>
                <div style={s.kpiLbl}>{k.lbl}</div>
              </div>
            ))}
          </div>

          {/* Funil */}
          <div style={s.card}>
            <div style={s.secTitle}>Funil de Captação</div>
            <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
              {ETAPAS.map((etapa, i) => {
                const count = LEADS.filter(l => l.etapa === etapa).length
                return (
                  <div key={etapa} style={{ flex:1, minWidth:120, textAlign:'center',
                    padding:'12px 8px', borderRight: i < ETAPAS.length-1 ? '1px solid #e5e8f0' : 'none' }}>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:'monospace',
                      color: count > 0 ? '#185FA5' : '#ccc', marginBottom:4 }}>{count}</div>
                    <div style={{ fontSize:10, color:'#8890a0', fontWeight:600 }}>{etapa}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leads */}
          <div style={s.card}>
            <div style={s.secTitle}>Leads e Oportunidades</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {LEADS.map(l => (
                <div key={l.id} style={{ border:'1px solid #e5e8f0', borderRadius:10,
                  padding:'12px 16px', display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ flexShrink:0 }}>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#8890a0', marginBottom:3 }}>{l.id}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background: (TIPO_COLORS[l.tipo]||'#888')+'18',
                      color: TIPO_COLORS[l.tipo]||'#888',
                      border:`1px solid ${(TIPO_COLORS[l.tipo]||'#888')}44` }}>
                      {l.tipo}
                    </span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{l.nome}</div>
                    <div style={{ fontSize:11, color:'#8890a0' }}>{l.contato}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36', marginBottom:2 }}>{l.valor}</div>
                    <div style={{ fontSize:11, color:'#185FA5', fontWeight:600 }}>{l.etapa}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'center' }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                      background: l.score>=90 ? '#EAF3DE' : l.score>=75 ? '#FFF3E0' : '#FEE8E8',
                      color: l.score>=90 ? '#3B6D11' : l.score>=75 ? '#BA7517' : '#A32D2D',
                      border: `2px solid ${l.score>=90 ? '#97C459' : l.score>=75 ? '#F0A500' : '#F09595'}` }}>
                      {l.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lançar Campanha */}
          <div style={s.card}>
            <div style={s.secTitle}>🚀 Lançar Campanha de Captação com IA</div>
            <p style={{ fontSize:13, color:'#5a6282', marginBottom:14, lineHeight:1.6 }}>
              O Sales Engine gera copywriting A/B personalizado, segmenta audiência e dispara para as plataformas de captação automaticamente.
            </p>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <select style={s.select} value={trigger} onChange={e => setTrigger(e.target.value)}>
                <option value="roi_and_valuation_locked">ROI e Valuation definidos</option>
                <option value="cinematic_assets_approved">Assets cinematográficos aprovados</option>
                <option value="esg_score_published">ESG Score publicado</option>
                <option value="milestone_reached">Marco de obra atingido</option>
              </select>
              <button style={{ ...s.btn, opacity: launching ? .6 : 1 }}
                onClick={launchCampaign} disabled={launching}>
                {launching ? '⏳ Processando...' : launched ? '✅ Campanha lançada!' : '▶ Lançar Campanha'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
