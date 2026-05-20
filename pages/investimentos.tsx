'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PrintShareModal from '../components/PrintShareModal'

const PROJETOS = [
  { nome:'Edifício Horizonte — Torre A', vgv:48.2, roi:24.3, tir:19.8, noi:3.2, capRate:6.7, esg:82, status:'em_andamento', fase:'Fundação — 34%' },
  { nome:'Complexo Industrial Norte', vgv:87.5, roi:31.2, tir:22.1, noi:6.8, capRate:7.8, esg:71, status:'em_andamento', fase:'Estrutura — 58%' },
  { nome:'Condomínio Vale Verde', vgv:29.4, roi:18.6, tir:15.3, noi:1.9, capRate:6.5, esg:91, status:'planejamento', fase:'Aprovação prefeitura' },
  { nome:'Cerrado Sul Fase II', vgv:112.0, roi:28.9, tir:21.4, noi:8.4, capRate:7.5, esg:78, status:'planejamento', fase:'Terreno adquirido' },
]

const ESG_LABEL: Record<string,string> = { range0:'Insuficiente', range50:'Adequado', range70:'Bom', range85:'Excelente' }
function esgLabel(v: number) {
  if (v >= 85) return 'Excelente'
  if (v >= 70) return 'Bom'
  if (v >= 50) return 'Adequado'
  return 'Insuficiente'
}
function esgColor(v: number) {
  if (v >= 85) return '#3B6D11'
  if (v >= 70) return '#185FA5'
  if (v >= 50) return '#BA7517'
  return '#A32D2D'
}

const fmt = (v: number) => `R$ ${v.toFixed(1)}M`

export default function InvestimentosPage() {
  const router = useRouter()
  const [selected, setSelected] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [pitch, setPitch] = useState('')
  const [showPrint, setShowPrint] = useState(false)

  const proj = PROJETOS[selected]

  async function gerarPitch() {
    setGenerating(true)
    setPitch('')
    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:900,
          system:`Você é o Investment_Analyst_AI. Gere um pitch de investimento profissional e persuasivo para apresentação a investidores institucionais. Use dados reais fornecidos e formatação clara com seções: Tese de Investimento, Indicadores Financeiros, ESG, Análise Risco-Retorno e Recomendação.`,
          messages:[{ role:'user', content:`Gere pitch para: ${proj.nome}
VGV: ${fmt(proj.vgv)} | ROI: ${proj.roi}% | TIR: ${proj.tir}% | NOI: ${fmt(proj.noi)} | Cap Rate: ${proj.capRate}% | ESG: ${proj.esg}/100 (${esgLabel(proj.esg)})
Status: ${proj.fase}` }]
        })
      })
      const data = await res.json()
      setPitch(data?.content?.[0]?.text || 'Erro ao gerar pitch.')
    } catch {
      setPitch('Erro ao conectar com o agente.')
    }
    setGenerating(false)
  }

  const totalVGV = PROJETOS.reduce((a,p) => a+p.vgv, 0)
  const avgROI = PROJETOS.reduce((a,p) => a+p.roi, 0) / PROJETOS.length
  const avgTIR = PROJETOS.reduce((a,p) => a+p.tir, 0) / PROJETOS.length
  const avgESG = PROJETOS.reduce((a,p) => a+p.esg, 0) / PROJETOS.length

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
    projBtn: { width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:10, border:'1px solid',
      cursor:'pointer', fontFamily:'inherit', transition:'all .15s', marginBottom:6 },
    metricRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 },
    metric: { background:'#f8f9fc', borderRadius:8, padding:'10px 12px' },
    metricVal: { fontSize:18, fontWeight:700, fontFamily:'monospace' },
    metricLbl: { fontSize:10, color:'#8890a0', marginTop:1 },
    genBtn: { padding:'10px 22px', background:'#534AB7', color:'#fff', border:'none', borderRadius:8,
      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' },
  }

  return (
    <>
      <Head><title>Investimentos — ROI, TIR, ESG</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📈 Análise de Investimentos</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>ROI · TIR · NOI · ESG</div>
        </div>

        <div style={s.body}>
          {/* KPIs Portfólio */}
          <div style={s.kpiGrid}>
            {[
              { val:`R$ ${totalVGV.toFixed(0)}M`, lbl:'VGV Total', color:'#185FA5' },
              { val:`${avgROI.toFixed(1)}%`, lbl:'ROI Médio', color:'#3B6D11' },
              { val:`${avgTIR.toFixed(1)}%`, lbl:'TIR Médio', color:'#534AB7' },
              { val:`${avgESG.toFixed(0)}/100`, lbl:'ESG Médio', color:'#3B6D11' },
            ].map(k => (
              <div key={k.lbl} style={s.kpi}>
                <div style={{ ...s.kpiVal, color:k.color }}>{k.val}</div>
                <div style={s.kpiLbl}>{k.lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>
            {/* Seletor de projeto */}
            <div>
              <div style={s.card}>
                <div style={s.secTitle}>Projetos</div>
                {PROJETOS.map((p, i) => (
                  <button key={i} style={{ ...s.projBtn,
                    background: selected===i ? '#EFF4FF' : '#fff',
                    borderColor: selected===i ? '#185FA5' : '#e5e8f0',
                    color: '#1a1f36' }} onClick={() => { setSelected(i); setPitch('') }}>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{p.nome}</div>
                    <div style={{ fontSize:10, color:'#8890a0' }}>{p.fase}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#3B6D11', marginTop:4 }}>
                      ROI {p.roi}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalhe do projeto */}
            <div>
              <div style={s.card}>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a1f36', marginBottom:4 }}>{proj.nome}</div>
                <div style={{ fontSize:12, color:'#8890a0', marginBottom:18 }}>{proj.fase}</div>

                <div style={s.metricRow}>
                  {[
                    { val:fmt(proj.vgv), lbl:'VGV', color:'#185FA5' },
                    { val:`${proj.roi}%`, lbl:'ROI', color:'#3B6D11' },
                    { val:`${proj.tir}%`, lbl:'TIR', color:'#534AB7' },
                    { val:fmt(proj.noi), lbl:'NOI anual', color:'#185FA5' },
                    { val:`${proj.capRate}%`, lbl:'Cap Rate', color:'#BA7517' },
                    { val:`${proj.esg}/100`, lbl:`ESG — ${esgLabel(proj.esg)}`, color:esgColor(proj.esg) },
                  ].map(m => (
                    <div key={m.lbl} style={s.metric}>
                      <div style={{ ...s.metricVal, color:m.color }}>{m.val}</div>
                      <div style={s.metricLbl}>{m.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* ESG bar */}
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#8890a0', marginBottom:5 }}>
                    <span>ESG Score</span><span>{proj.esg}/100</span>
                  </div>
                  <div style={{ height:6, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${proj.esg}%`, borderRadius:3,
                      background:esgColor(proj.esg), transition:'width .5s' }} />
                  </div>
                </div>

                {/* Gerar Pitch */}
                <div style={{ borderTop:'1px solid #e5e8f0', paddingTop:16 }}>
                  <div style={s.secTitle}>Pitch Deck com IA</div>
                  <button style={{ ...s.genBtn, opacity: generating ? .6 : 1 }}
                    onClick={gerarPitch} disabled={generating}>
                    {generating ? '⏳ Gerando...' : '🎯 Gerar Pitch para Investidores'}
                  </button>
                  {pitch && (
                    <>
                      <div style={{ marginTop:16, padding:'16px', background:'#f8f9fc',
                        borderRadius:10, border:'1px solid #e5e8f0', fontSize:12,
                        lineHeight:1.75, color:'#1a1f36', whiteSpace:'pre-wrap' }}>
                        {pitch}
                      </div>
                      <button onClick={() => setShowPrint(true)}
                        style={{ marginTop:10, padding:'9px 18px', background:'#185FA5', color:'#fff',
                          border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                          fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                        🖨️ Imprimir / Exportar Pitch
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPrint && (
        <PrintShareModal
          title={`Valuation & Pitch — ${proj.nome}`}
          onClose={() => setShowPrint(false)}
          buildHtml={() => `
<div class="meta">
  <span>🏗️ ${proj.nome}</span>
  <span>📊 VGV: ${fmt(proj.vgv)}</span>
  <span>📅 ${proj.fase}</span>
</div>
<h2>Indicadores Financeiros</h2>
<div class="grid3">
  <div class="field"><label>VGV</label><p style="font-size:18px;font-weight:700;color:#185FA5">${fmt(proj.vgv)}</p></div>
  <div class="field"><label>ROI</label><p style="font-size:18px;font-weight:700;color:#3B6D11">${proj.roi}%</p></div>
  <div class="field"><label>TIR</label><p style="font-size:18px;font-weight:700;color:#534AB7">${proj.tir}%</p></div>
  <div class="field"><label>NOI Anual</label><p style="font-size:18px;font-weight:700;color:#185FA5">${fmt(proj.noi)}</p></div>
  <div class="field"><label>Cap Rate</label><p style="font-size:18px;font-weight:700;color:#BA7517">${proj.capRate}%</p></div>
  <div class="field"><label>ESG Score</label><p style="font-size:18px;font-weight:700;color:${esgColor(proj.esg)}">${proj.esg}/100 — ${esgLabel(proj.esg)}</p></div>
</div>
<h2>Pitch para Investidores</h2>
<div class="text-area">${pitch}</div>`}
          buildText={() => [
            `VALUATION & PITCH — ${proj.nome}`,
            `VGV: ${fmt(proj.vgv)} | ROI: ${proj.roi}% | TIR: ${proj.tir}%`,
            `NOI: ${fmt(proj.noi)} | Cap Rate: ${proj.capRate}% | ESG: ${proj.esg}/100`,
            ``, pitch,
          ].join('\n')}
        />
      )}
    </>
  )
}
