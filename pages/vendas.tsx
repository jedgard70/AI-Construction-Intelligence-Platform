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
const TIPO_COLORS: Record<string,string> = {
  'Investidor':'#534AB7','Fundo':'#185FA5','Parceiro':'#3B6D11','Investidor PF':'#BA7517'
}

const TRIGGER_LABELS: Record<string,string> = {
  roi_and_valuation_locked: 'ROI e Valuation definidos',
  cinematic_assets_approved: 'Assets cinematográficos aprovados',
  esg_score_published: 'ESG Score publicado',
  milestone_reached: 'Marco de obra atingido',
}

type CampaignData = {
  campaign_id: string
  variantA: string
  variantB: string
  audience: { segment:string; pct:number; color:string }[]
  platforms: { name:string; icon:string; status:string; reach:string; budget:string }[]
  metrics: { label:string; value:string; color:string }[]
  score: number
}

const LAUNCH_STEPS = [
  { id:1, label:'Analisando portfólio e mercado', icon:'🔍', duration:800 },
  { id:2, label:'Segmentando audiência-alvo', icon:'🎯', duration:900 },
  { id:3, label:'Gerando copywriting A/B com IA', icon:'✍️', duration:1200 },
  { id:4, label:'Calculando orçamento por plataforma', icon:'💰', duration:700 },
  { id:5, label:'Disparando para plataformas de captação', icon:'🚀', duration:900 },
  { id:6, label:'Ativando CRM e rastreamento', icon:'📊', duration:600 },
]

export default function VendasPage() {
  const router = useRouter()
  const [trigger, setTrigger] = useState('roi_and_valuation_locked')
  const [launching, setLaunching] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [generatingCopy, setGeneratingCopy] = useState(false)

  const totalVGV = LEADS.reduce((a,l) => a + parseFloat(l.valor.replace('R$ ','').replace(',','.').replace('M','')), 0)

  async function launchCampaign() {
    setShowModal(true)
    setLaunching(true)
    setCurrentStep(0)
    setCampaign(null)

    // Executa steps animados
    for (let i = 0; i < LAUNCH_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, LAUNCH_STEPS[i].duration))
      setCurrentStep(i + 1)
    }

    // Gera copywriting real com IA
    setGeneratingCopy(true)
    let variantA = ''
    let variantB = ''
    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:900,
          system:`Você é o Sales_Engine_AI — especialista em copywriting imobiliário e captação de investidores para construção civil no Brasil. Gere textos persuasivos, diretos e profissionais para campanhas de investimento em ativos imobiliários.`,
          messages:[{ role:'user', content:`Gatilho da campanha: "${TRIGGER_LABELS[trigger]}"
Pipeline atual: R$ ${totalVGV.toFixed(1)}M em ${LEADS.length} leads

Gere EXATAMENTE neste formato (sem texto extra):
---VARIANTE_A---
[Título impactante 1 linha]
[Texto corpo 2-3 linhas focado em ROI e segurança do investimento]
[CTA direto]
---VARIANTE_B---
[Título alternativo 1 linha — ângulo diferente, mais emocional]
[Texto corpo 2-3 linhas focado em exclusividade e oportunidade]
[CTA alternativo]` }]
        })
      })
      const data = await res.json()
      const raw = data?.content?.[0]?.text || ''
      const partA = raw.match(/---VARIANTE_A---([\s\S]*?)---VARIANTE_B---/)
      const partB = raw.match(/---VARIANTE_B---([\s\S]*)$/)
      variantA = partA?.[1]?.trim() || 'Invista no futuro da construção civil.\nROI projetado de 22,1% a.a. com lastro real em ativos de infraestrutura.\nConheça as oportunidades →'
      variantB = partB?.[1]?.trim() || 'Oportunidade exclusiva para investidores qualificados.\nParticipe de projetos que transformam cidades e geram retorno acima do mercado.\nAgende sua reunião →'
    } catch {
      variantA = 'Invista com segurança: ativos reais, retorno comprovado.\nROI 22,1% a.a. | TIR 18,4% | ESG Score 74/100\nConheça nosso portfólio →'
      variantB = 'Construção inteligente: do projeto ao retorno.\nEdifícios certificados, gestão BIM e monitoramento em tempo real.\nFale com nosso time →'
    }
    setGeneratingCopy(false)

    const campaignResult: CampaignData = {
      campaign_id: `CAMP-${Date.now().toString().slice(-6)}`,
      variantA,
      variantB,
      audience: [
        { segment:'Investidores PJ / Fundos', pct:42, color:'#185FA5' },
        { segment:'Family Offices', pct:28, color:'#534AB7' },
        { segment:'Investidores PF Qualificados', pct:18, color:'#3B6D11' },
        { segment:'Construtoras e Parceiros', pct:12, color:'#BA7517' },
      ],
      platforms: [
        { name:'LinkedIn Ads', icon:'💼', status:'Ativo', reach:'48.000', budget:'R$ 3.200/mês' },
        { name:'Google Ads', icon:'🔍', status:'Ativo', reach:'112.000', budget:'R$ 2.800/mês' },
        { name:'Meta (FB/IG)', icon:'📱', status:'Ativo', reach:'95.000', budget:'R$ 2.100/mês' },
        { name:'E-mail Marketing', icon:'📧', status:'Ativo', reach:'8.400', budget:'R$ 480/mês' },
        { name:'WhatsApp Direto', icon:'💬', status:'CRM', reach:'LEADS', budget:'Manual' },
      ],
      metrics: [
        { label:'Alcance total estimado', value:'263.400', color:'#185FA5' },
        { label:'Leads qualificados/mês', value:'340–520', color:'#3B6D11' },
        { label:'Custo por lead', value:'R$ 16,80', color:'#534AB7' },
        { label:'ROI campanha projetado', value:'8,4×', color:'#BA7517' },
        { label:'Budget mensal total', value:'R$ 8.580', color:'#A32D2D' },
        { label:'Score Sales Engine', value:'91/100', color:'#3B6D11' },
      ],
      score: 91,
    }

    setCampaign(campaignResult)
    setLaunching(false)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px', height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' },
    body: { maxWidth:1060, margin:'0 auto', padding:'28px 20px' },
    kpi: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:10, padding:'14px 16px' },
    kpiVal: { fontSize:22, fontWeight:700, fontFamily:'monospace', marginBottom:2 },
    kpiLbl: { fontSize:10, color:'#8890a0', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.08em' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    secTitle: { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0',
      textTransform:'uppercase' as const, marginBottom:14 },
    btn: { padding:'11px 24px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' },
    select: { padding:'9px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:13,
      color:'#1a1f36', background:'#f8f9fc', outline:'none', fontFamily:'inherit' },
  }

  return (
    <>
      <Head><title>Sales Pipeline — AI Construction Platform</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📊 Sales & Captação de Investimentos</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>Sales Engine AI v5.3</div>
        </div>

        <div style={s.body}>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
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
                  <div key={etapa} style={{ flex:1, minWidth:110, textAlign:'center' as const,
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
                      background:(TIPO_COLORS[l.tipo]||'#888')+'18', color:TIPO_COLORS[l.tipo]||'#888',
                      border:`1px solid ${(TIPO_COLORS[l.tipo]||'#888')}44` }}>{l.tipo}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>{l.nome}</div>
                    <div style={{ fontSize:11, color:'#8890a0' }}>{l.contato}</div>
                  </div>
                  <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36', marginBottom:2 }}>{l.valor}</div>
                    <div style={{ fontSize:11, color:'#185FA5', fontWeight:600 }}>{l.etapa}</div>
                  </div>
                  <div style={{ flexShrink:0 }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                      background: l.score>=90?'#EAF3DE':l.score>=75?'#FFF3E0':'#FEE8E8',
                      color: l.score>=90?'#3B6D11':l.score>=75?'#BA7517':'#A32D2D',
                      border:`2px solid ${l.score>=90?'#97C459':l.score>=75?'#F0A500':'#F09595'}` }}>
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
            <p style={{ fontSize:13, color:'#5a6282', marginBottom:16, lineHeight:1.6 }}>
              O <strong>Sales Engine AI</strong> gera copywriting A/B personalizado, segmenta a audiência e dispara para as plataformas de captação automaticamente.
            </p>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' as const }}>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                <label style={{ fontSize:10, fontWeight:600, color:'#5a6282',
                  textTransform:'uppercase' as const, letterSpacing:'.06em' }}>Gatilho da campanha</label>
                <select style={s.select} value={trigger} onChange={e => setTrigger(e.target.value)}>
                  {Object.entries(TRIGGER_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <button style={{ ...s.btn, marginTop:18 }} onClick={launchCampaign}>
                ▶ Lançar Campanha
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL CAMPANHA ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:10000,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Geist',system-ui,sans-serif", padding:16 }}
          onClick={e => !launching && e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:860,
            maxHeight:'92vh', display:'flex', flexDirection:'column',
            boxShadow:'0 24px 80px rgba(0,0,0,0.3)', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e8f0',
              background: campaign ? 'linear-gradient(135deg,#185FA5,#534AB7)' : '#1a1f36',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:2 }}>
                  🚀 {campaign ? '✅ Campanha Lançada!' : 'Lançando Campanha...'}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>
                  {campaign ? `ID: ${campaign.campaign_id} · Gatilho: ${TRIGGER_LABELS[trigger]}` : 'Sales Engine AI · Processando...'}
                </div>
              </div>
              {!launching && (
                <button onClick={() => setShowModal(false)}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                    fontSize:18, color:'#fff', borderRadius:8, padding:'4px 10px', lineHeight:1 }}>✕</button>
              )}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>

              {/* Steps de lançamento */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
                {LAUNCH_STEPS.map((step, i) => {
                  const done = currentStep > step.id
                  const active = currentStep === step.id && launching
                  return (
                    <div key={step.id} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'10px 14px', borderRadius:10, border:'1px solid',
                      borderColor: done ? '#97C459' : active ? '#185FA5' : '#e5e8f0',
                      background: done ? '#EAF3DE' : active ? '#EFF4FF' : '#fafafa',
                      transition:'all .3s' }}>
                      <div style={{ fontSize:18, flexShrink:0 }}>
                        {done ? '✅' : active ? '⏳' : step.icon}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600,
                          color: done ? '#3B6D11' : active ? '#185FA5' : '#8b93a7' }}>
                          {`Passo ${step.id}`}
                        </div>
                        <div style={{ fontSize:10, color: done ? '#3B6D11' : active ? '#185FA5' : '#aaa',
                          lineHeight:1.3 }}>
                          {step.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barra progresso */}
              {launching && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11,
                    color:'#185FA5', fontWeight:600, marginBottom:6 }}>
                    <span>{generatingCopy ? '✍️ Gerando copywriting A/B com IA...' : LAUNCH_STEPS[Math.max(0,currentStep-1)]?.label}</span>
                    <span>{Math.round((currentStep/LAUNCH_STEPS.length)*100)}%</span>
                  </div>
                  <div style={{ height:6, background:'#e5e8f0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${(currentStep/LAUNCH_STEPS.length)*100}%`, height:'100%',
                      background:'linear-gradient(90deg,#185FA5,#534AB7)', borderRadius:3, transition:'width .4s' }} />
                  </div>
                </div>
              )}

              {/* Resultado da campanha */}
              {campaign && !launching && (
                <>
                  {/* Métricas projetadas */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
                    {campaign.metrics.map(m => (
                      <div key={m.label} style={{ background:'#f8f9fc', border:'1px solid #e5e8f0',
                        borderRadius:10, padding:'12px 16px', textAlign:'center' as const }}>
                        <div style={{ fontSize:20, fontWeight:700, color:m.color, fontFamily:'monospace' }}>
                          {m.value}
                        </div>
                        <div style={{ fontSize:10, color:'#8890a0', marginTop:4, fontWeight:600,
                          textTransform:'uppercase' as const, letterSpacing:'.05em' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

                    {/* Copywriting A/B */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#8890a0',
                        textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:10 }}>
                        ✍️ Copywriting Gerado por IA
                      </div>
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#185FA5', marginBottom:6,
                          display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ padding:'2px 8px', background:'#EFF4FF', borderRadius:20 }}>VARIANTE A</span>
                          <span style={{ color:'#8890a0' }}>— Racional / ROI</span>
                        </div>
                        <div style={{ background:'#EFF4FF', border:'1px solid #B5D4F4',
                          borderRadius:8, padding:'12px 14px', fontSize:12, lineHeight:1.7,
                          color:'#1a1f36', whiteSpace:'pre-wrap' as const }}>
                          {campaign.variantA}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#534AB7', marginBottom:6,
                          display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ padding:'2px 8px', background:'#F0EEFF', borderRadius:20 }}>VARIANTE B</span>
                          <span style={{ color:'#8890a0' }}>— Emocional / Exclusividade</span>
                        </div>
                        <div style={{ background:'#F0EEFF', border:'1px solid #C9C3F5',
                          borderRadius:8, padding:'12px 14px', fontSize:12, lineHeight:1.7,
                          color:'#1a1f36', whiteSpace:'pre-wrap' as const }}>
                          {campaign.variantB}
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Segmentação */}
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#8890a0',
                          textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:10 }}>
                          🎯 Segmentação da Audiência
                        </div>
                        {campaign.audience.map(a => (
                          <div key={a.segment} style={{ marginBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11,
                              marginBottom:4, fontWeight:500, color:'#1a1f36' }}>
                              <span>{a.segment}</span>
                              <span style={{ color:a.color, fontWeight:700 }}>{a.pct}%</span>
                            </div>
                            <div style={{ height:6, background:'#e5e8f0', borderRadius:3 }}>
                              <div style={{ width:`${a.pct}%`, height:'100%', background:a.color,
                                borderRadius:3, transition:'width 1s ease' }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Plataformas */}
                      <div style={{ fontSize:11, fontWeight:700, color:'#8890a0',
                        textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:10 }}>
                        📡 Plataformas Ativas
                      </div>
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                        {campaign.platforms.map(p => (
                          <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10,
                            padding:'8px 10px', background:'#f8f9fc', borderRadius:8,
                            border:'1px solid #e5e8f0' }}>
                            <span style={{ fontSize:16 }}>{p.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:11, fontWeight:600, color:'#1a1f36' }}>{p.name}</div>
                              <div style={{ fontSize:10, color:'#8890a0' }}>Alcance: {p.reach} · {p.budget}</div>
                            </div>
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20,
                              background: p.status==='Ativo'?'#EAF3DE':'#EFF4FF',
                              color: p.status==='Ativo'?'#3B6D11':'#185FA5' }}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,#185FA5,#534AB7)',
                    borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between',
                    color:'#fff' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>
                        🤖 Sales Engine Score
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>
                        Campanha otimizada por IA — Gatilho: {TRIGGER_LABELS[trigger]}
                      </div>
                    </div>
                    <div style={{ textAlign:'center' as const }}>
                      <div style={{ fontSize:36, fontWeight:700 }}>{campaign.score}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.75)' }}>/100</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!launching && (
              <div style={{ padding:'14px 24px', borderTop:'1px solid #e5e8f0',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ padding:'9px 20px', border:'1px solid #e5e8f0', borderRadius:8,
                    background:'#fff', color:'#5a6282', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Fechar
                </button>
                {campaign && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => {
                      const text = `🚀 CAMPANHA LANÇADA — ${campaign.campaign_id}\n\nGatilho: ${TRIGGER_LABELS[trigger]}\nScore: ${campaign.score}/100\n\n✍️ VARIANTE A:\n${campaign.variantA}\n\n✍️ VARIANTE B:\n${campaign.variantB}\n\nAlcance: ${campaign.metrics[0].value} | Leads/mês: ${campaign.metrics[1].value} | ROI campanha: ${campaign.metrics[3].value}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank')
                    }} style={{ padding:'9px 18px', border:'1px solid #3B6D11', borderRadius:8,
                      background:'#EAF3DE', color:'#3B6D11', fontSize:13, fontWeight:600,
                      cursor:'pointer', fontFamily:'inherit' }}>
                      📲 WhatsApp
                    </button>
                    <button onClick={launchCampaign}
                      style={{ padding:'9px 20px', border:'none', borderRadius:8,
                        background:'#185FA5', color:'#fff', fontSize:13, fontWeight:700,
                        cursor:'pointer', fontFamily:'inherit' }}>
                      🔄 Nova Campanha
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
