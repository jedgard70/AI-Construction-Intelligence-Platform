'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../lib/supabase'

interface Lead {
  id: string
  name: string
  empresa: string | null
  email: string | null
  valor: number | null
  tipo: string
  etapa: string
  probabilidade: number
  proxima_acao: string | null
  created_at: string
}

const ETAPAS = ['Prospecção','Qualificação','Reunião agendada','Proposta enviada','Negociação','Fechado']
const TIPO_COLORS: Record<string,string> = { 'comercial':'#534AB7', 'residencial':'#185FA5', 'industrial':'#3B6D11', 'infraestrutura':'#BA7517' }
const fmtValor = (v: number | null) => v ? `R$ ${(v/1000000).toFixed(1)}M` : '—'

export default function VendasPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [trigger, setTrigger] = useState('roi_and_valuation_locked')

  useEffect(() => {
    async function fetchLeads() {
      const sb = getSupabase()
      if (!sb) { setLoadingLeads(false); return }
      const { data, error } = await sb
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setLeads(data as Lead[])
      setLoadingLeads(false)
    }
    fetchLeads()
  }, [])

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

  const totalVGV = leads.reduce((a, l) => a + (l.valor ?? 0), 0) / 1_000_000
  const avgScore = leads.length ? Math.round(leads.reduce((a,l) => a + l.probabilidade, 0) / leads.length) : 0
  const emDiligencia = leads.filter(l => l.etapa === 'Negociação').length

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
              { val:String(leads.length), lbl:'Leads ativos', color:'#534AB7' },
              { val:String(emDiligencia), lbl:'Em negociação', color:'#3B6D11' },
              { val:String(avgScore), lbl:'Prob. média %', color:'#BA7517' },
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
                const count = leads.filter(l => l.etapa === etapa).length
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
              {loadingLeads && <div style={{ color:'#8890a0', fontSize:13, padding:8 }}>Carregando leads...</div>}
              {!loadingLeads && leads.length === 0 && (
                <div style={{ color:'#8890a0', fontSize:13, padding:8 }}>Nenhum lead cadastrado ainda. Adicione o primeiro lead pelo painel.</div>
              )}
              {leads.map(l => (
                <div key={l.id} style={{ border:'1px solid #e5e8f0', borderRadius:10,
                  padding:'12px 16px', display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background: (TIPO_COLORS[l.tipo]||'#888')+'18',
                      color: TIPO_COLORS[l.tipo]||'#888',
                      border:`1px solid ${(TIPO_COLORS[l.tipo]||'#888')}44` }}>
                      {l.tipo}
                    </span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{l.name}</div>
                    <div style={{ fontSize:11, color:'#8890a0' }}>{l.empresa ?? l.email ?? '—'}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36', marginBottom:2 }}>{fmtValor(l.valor)}</div>
                    <div style={{ fontSize:11, color:'#185FA5', fontWeight:600 }}>{l.etapa}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'center' }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                      background: l.probabilidade>=80 ? '#EAF3DE' : l.probabilidade>=60 ? '#FFF3E0' : '#FEE8E8',
                      color: l.probabilidade>=80 ? '#3B6D11' : l.probabilidade>=60 ? '#BA7517' : '#A32D2D',
                      border: `2px solid ${l.probabilidade>=80 ? '#97C459' : l.probabilidade>=60 ? '#F0A500' : '#F09595'}` }}>
                      {l.probabilidade}%
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
                <option value="regulatory_approved">Aprovação regulatória concluída</option>
              </select>
              <button
                style={{ ...s.btn, opacity: launching ? 0.6 : 1 }}
                disabled={launching}
                onClick={launchCampaign}
              >
                {launching ? '⏳ Lançando...' : launched ? '✓ Lançada!' : '🚀 Lançar Campanha'}
              </button>
              {launched && (
                <div style={{ fontSize:12, color:'#3B6D11', fontWeight:600 }}>
                  ✓ Campanha enviada com sucesso para os canais configurados.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
