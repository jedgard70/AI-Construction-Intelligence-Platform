'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────
interface Project {
  id: string
  name: string
  code: string
  type: string
  status: string
  city: string
  state: string
  budget_planned: number
  budget_actual: number
  completion_pct: number
  cpi: number | null
  spi: number | null
  eac: number | null
  esg_score: number | null
  created_at: string
}

interface ActivityEntry {
  id: string
  ts: string
  action: string
  field?: string
  from?: string
  to?: string
}

// ─── Helpers ─────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1 }).format(v)

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const pct = (v: number | null) => v != null ? `${v.toFixed(1)}%` : '—'
const idx = (v: number | null) => v != null ? v.toFixed(2) : '—'

function statusLabel(s: string) {
  return ({ em_andamento:'Em andamento', atrasado:'Atrasado', planejamento:'Planejamento',
    pausado:'Pausado', concluido:'Concluído', cancelado:'Cancelado' }[s] ?? s)
}
function statusColor(s: string) {
  return ({ em_andamento:'#185FA5', atrasado:'#A32D2D', planejamento:'#534AB7',
    pausado:'#BA7517', concluido:'#3B6D11', cancelado:'#5F5E5A' }[s] ?? '#888')
}
function esgLabel(v: number | null) {
  if (v == null) return '—'
  if (v >= 85) return 'Excelente'
  if (v >= 70) return 'Bom'
  if (v >= 50) return 'Adequado'
  return 'Insuficiente'
}
function esgColor(v: number | null) {
  if (v == null) return '#888'
  if (v >= 85) return '#3B6D11'
  if (v >= 70) return '#185FA5'
  if (v >= 50) return '#BA7517'
  return '#A32D2D'
}

function logActivity(projectId: string, action: string, field?: string, from?: string, to?: string) {
  try {
    const key = `atlas_activity_${projectId}`
    const existing: ActivityEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      action, field, from, to,
    }
    localStorage.setItem(key, JSON.stringify([entry, ...existing].slice(0, 50)))
  } catch {}
}

// ─── Styles ──────────────────────────────────────────────────────
const s = {
  page:    { minHeight:'100vh', background:'#f4f5f7', fontFamily:'Geist,system-ui,sans-serif' },
  header:  { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 32px',
             display:'flex', alignItems:'center', height:56, gap:16 },
  back:    { background:'none', border:'none', cursor:'pointer', color:'#8b93a7',
             fontSize:13, display:'flex', alignItems:'center', gap:6 },
  body:    { maxWidth:1200, margin:'0 auto', padding:'28px 24px' },
  card:    { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:20, marginBottom:16 },
  cardTit: { fontSize:13, fontWeight:700, color:'#1a1f36', marginBottom:14 },
  label:   { fontSize:11, fontWeight:600, color:'#8b93a7', marginBottom:4,
             display:'block', textTransform:'uppercase' as const, letterSpacing:'0.06em' },
  input:   { width:'100%', padding:'9px 11px', borderRadius:8, border:'1.5px solid #e2e8f0',
             fontSize:13, color:'#1a1a2e', outline:'none', boxSizing:'border-box' as const },
  select:  { width:'100%', padding:'9px 11px', borderRadius:8, border:'1.5px solid #e2e8f0',
             fontSize:13, color:'#1a1a2e', background:'#fff', boxSizing:'border-box' as const },
  btnSave: { padding:'9px 20px', background:'#185FA5', color:'#fff', border:'none',
             borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' },
  btnAI:   { padding:'9px 20px', background:'#0F4C81', color:'#fff', border:'none',
             borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', display:'flex',
             alignItems:'center', gap:6 },
  grid4:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 },
  grid2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  grid3:   { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 },
  kpiCard: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:18 },
  pre:     { background:'#f8f9fc', border:'1px solid #e5e8f0', borderRadius:8, padding:16,
             fontSize:12, color:'#2d3748', lineHeight:1.7, whiteSpace:'pre-wrap' as const,
             marginTop:12, maxHeight:400, overflowY:'auto' as const },
}

const STATUS_OPTS = [
  { v:'planejamento', l:'Planejamento' },
  { v:'em_andamento', l:'Em andamento' },
  { v:'atrasado',     l:'Atrasado' },
  { v:'pausado',      l:'Pausado' },
  { v:'concluido',    l:'Concluído' },
  { v:'cancelado',    l:'Cancelado' },
]

// ─── Page ────────────────────────────────────────────────────────
export default function ProjetoPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }

  const [project, setProject]     = useState<Project | null>(null)
  const [editing, setEditing]     = useState(false)
  const [saving,  setSaving]      = useState(false)
  const [saved,   setSaved]       = useState(false)
  const [activity, setActivity]   = useState<ActivityEntry[]>([])
  const [aiText,   setAiText]     = useState('')
  const [aiLoading,setAiLoading]  = useState(false)
  const [aiCtx,    setAiCtx]      = useState('')

  // Edit form state
  const [form, setForm] = useState<Partial<Project>>({})

  // Load project
  useEffect(() => {
    if (!id) return
    const load = () => {
      try {
        const stored: Project[] = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
        const found = stored.find(p => p.id === id)
        if (found) {
          setProject(found)
          setForm(found)
        }
      } catch {}
    }
    load()

    // Also try Supabase
    const sb = getSupabase()
    if (sb) {
      sb.from('projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setProject(data as Project)
          setForm(data as Project)
        }
      })
    }

    // Load activity log
    try {
      const key = `atlas_activity_${id}`
      setActivity(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch {}
  }, [id])

  const saveProject = useCallback(async () => {
    if (!project || !id) return
    setSaving(true)

    const updated: Project = {
      ...project,
      ...form,
      eac: form.budget_planned && form.cpi && form.cpi > 0
        ? Math.round((form.budget_planned as number) / (form.cpi as number))
        : project.eac,
    }

    // Log changed fields
    const fields = ['status','completion_pct','budget_actual','cpi','spi','esg_score'] as const
    fields.forEach(f => {
      if (project[f] !== updated[f]) {
        logActivity(id, 'Atualizado', f, String(project[f] ?? ''), String(updated[f] ?? ''))
      }
    })

    // Update localStorage
    try {
      const stored: Project[] = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
      localStorage.setItem('atlas_projects',
        JSON.stringify(stored.map(p => p.id === id ? updated : p)))
    } catch {}

    // Update Supabase if connected
    const sb = getSupabase()
    if (sb) {
      await sb.from('projects').update({
        status: updated.status,
        completion_pct: updated.completion_pct,
        budget_actual: updated.budget_actual,
        budget_planned: updated.budget_planned,
        cpi: updated.cpi,
        spi: updated.spi,
        eac: updated.eac,
        esg_score: updated.esg_score,
        city: updated.city,
        state: updated.state,
      }).eq('id', id)
    }

    // Reload activity
    try {
      setActivity(JSON.parse(localStorage.getItem(`atlas_activity_${id}`) || '[]'))
    } catch {}

    setProject(updated)
    setEditing(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [project, form, id])

  async function runAI(ctx: string, prompt: string) {
    setAiCtx(ctx)
    setAiLoading(true)
    setAiText('')
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const d = await r.json()
      setAiText(d.content?.[0]?.text || d.error || 'Sem resposta')
    } catch {
      setAiText('Erro ao conectar com a IA.')
    }
    setAiLoading(false)
  }

  if (!project) return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex',
      alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center', color:'#8b93a7' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🏗️</div>
        <div style={{ fontSize:14 }}>Carregando projeto...</div>
        <button onClick={() => router.push('/dashboard')}
          style={{ marginTop:16, padding:'8px 20px', background:'#185FA5', color:'#fff',
            border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
          ← Voltar ao dashboard
        </button>
      </div>
    </div>
  )

  const burnPct = project.budget_planned > 0
    ? Math.min((project.budget_actual / project.budget_planned) * 100, 100)
    : 0
  const overBudget = project.budget_actual > project.budget_planned
  const cpiOk = (project.cpi ?? 1) >= 0.95
  const spiOk = (project.spi ?? 1) >= 0.95

  return (
    <>
      <Head>
        <title>{project.name} — Atlas Construction Intelligence</title>
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f5f7; font-family: 'Geist', system-ui, sans-serif; }
        input:focus, select:focus { border-color: #185FA5 !important; box-shadow: 0 0 0 3px rgba(24,95,165,.12); }
      `}</style>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.header}>
          <button style={s.back} onClick={() => router.push('/dashboard')}>
            ← Dashboard
          </button>
          <div style={{ width:1, height:20, background:'#e5e8f0' }} />
          <div style={{ fontSize:13, color:'#8b93a7' }}>{project.code}</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#1a1f36', flex:1 }}>{project.name}</div>
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
            background: statusColor(project.status)+'18', color: statusColor(project.status) }}>
            {statusLabel(project.status)}
          </span>
          {saved && (
            <span style={{ fontSize:12, color:'#3B6D11', fontWeight:600 }}>✓ Salvo</span>
          )}
          <button style={s.btnSave} onClick={() => editing ? saveProject() : setEditing(true)}
            disabled={saving}>
            {saving ? 'Salvando...' : editing ? '✓ Salvar alterações' : '✏️ Editar projeto'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(false); setForm(project) }}
              style={{ padding:'9px 16px', background:'transparent', color:'#8b93a7',
                border:'1.5px solid #e2e8f0', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer' }}>
              Cancelar
            </button>
          )}
        </div>

        <div style={s.body}>
          {/* ── KPI Cards ── */}
          <div style={{ ...s.grid4, marginBottom:16 }}>
            {/* Avanço Físico */}
            <div style={s.kpiCard}>
              <div style={s.label}>Avanço Físico</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#1a1f36', marginBottom:8 }}>
                {pct(project.completion_pct)}
              </div>
              <div style={{ width:'100%', height:6, background:'#e5e8f0', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${project.completion_pct}%`, height:'100%', borderRadius:3,
                  background: project.completion_pct>=75 ? '#3B6D11'
                    : project.completion_pct>=40 ? '#185FA5' : '#A32D2D',
                  transition:'width 0.4s ease' }} />
              </div>
              {editing && (
                <input type="range" min={0} max={100} value={form.completion_pct ?? 0}
                  onChange={e => setForm(f => ({ ...f, completion_pct: Number(e.target.value) }))}
                  style={{ width:'100%', marginTop:8 }} />
              )}
            </div>

            {/* Orçamento */}
            <div style={s.kpiCard}>
              <div style={s.label}>Burn Rate</div>
              <div style={{ fontSize:28, fontWeight:800,
                color: overBudget ? '#A32D2D' : '#1a1f36', marginBottom:4 }}>
                {pct(burnPct)}
              </div>
              <div style={{ fontSize:11, color:'#8b93a7', marginBottom:8 }}>
                {fmt(project.budget_actual)} de {fmt(project.budget_planned)}
              </div>
              <div style={{ width:'100%', height:6, background:'#e5e8f0', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${Math.min(burnPct,100)}%`, height:'100%', borderRadius:3,
                  background: overBudget ? '#A32D2D' : burnPct > 80 ? '#BA7517' : '#3B6D11',
                  transition:'width 0.4s ease' }} />
              </div>
              {overBudget && (
                <div style={{ fontSize:10, color:'#A32D2D', fontWeight:600, marginTop:4 }}>
                  ⚠ Acima do orçamento em {fmt(project.budget_actual - project.budget_planned)}
                </div>
              )}
            </div>

            {/* CPI */}
            <div style={s.kpiCard}>
              <div style={s.label}>CPI — Índice de Custo</div>
              <div style={{ fontSize:28, fontWeight:800,
                color: cpiOk ? '#3B6D11' : (project.cpi??1) >= 0.9 ? '#BA7517' : '#A32D2D' }}>
                {idx(project.cpi)}
              </div>
              <div style={{ fontSize:11, color:'#8b93a7', marginTop:4 }}>
                {cpiOk ? '✓ Dentro da meta (≥0,95)' : '⚠ Abaixo da meta — revisar custos'}
              </div>
              {project.eac && (
                <div style={{ fontSize:11, color:'#534AB7', marginTop:6, fontWeight:600 }}>
                  EAC estimado: {fmt(project.eac)}
                </div>
              )}
            </div>

            {/* SPI + ESG */}
            <div style={s.kpiCard}>
              <div style={s.label}>SPI — Índice de Prazo</div>
              <div style={{ fontSize:28, fontWeight:800,
                color: spiOk ? '#3B6D11' : (project.spi??1) >= 0.9 ? '#BA7517' : '#A32D2D' }}>
                {idx(project.spi)}
              </div>
              <div style={{ fontSize:11, color:'#8b93a7', marginTop:4 }}>
                {spiOk ? '✓ Dentro do prazo' : '⚠ Projeto atrasado'}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10,
                paddingTop:10, borderTop:'1px solid #f0f2f5' }}>
                <div style={s.label}>ESG Score</div>
                <div style={{ fontSize:13, fontWeight:700, color: esgColor(project.esg_score) }}>
                  {project.esg_score ?? '—'}/100 · {esgLabel(project.esg_score)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
            <div>
              {/* ── Editar Dados ── */}
              {editing && (
                <div style={s.card}>
                  <div style={s.cardTit}>✏️ Atualizar Projeto</div>
                  <div style={s.grid2}>
                    <div>
                      <label style={s.label}>Status</label>
                      <select style={s.select} value={form.status ?? project.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Avanço Físico (%)</label>
                      <input style={s.input} type="number" min={0} max={100}
                        value={form.completion_pct ?? 0}
                        onChange={e => setForm(f => ({ ...f, completion_pct: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div style={{ ...s.grid2, marginTop:12 }}>
                    <div>
                      <label style={s.label}>Orçamento Planejado (R$)</label>
                      <input style={s.input} type="number"
                        value={form.budget_planned ?? 0}
                        onChange={e => setForm(f => ({ ...f, budget_planned: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={s.label}>Custo Real Atual (R$)</label>
                      <input style={s.input} type="number"
                        value={form.budget_actual ?? 0}
                        onChange={e => setForm(f => ({ ...f, budget_actual: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div style={{ ...s.grid3, marginTop:12 }}>
                    <div>
                      <label style={s.label}>CPI</label>
                      <input style={s.input} type="number" step="0.01"
                        value={form.cpi ?? ''}
                        onChange={e => setForm(f => ({ ...f, cpi: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={s.label}>SPI</label>
                      <input style={s.input} type="number" step="0.01"
                        value={form.spi ?? ''}
                        onChange={e => setForm(f => ({ ...f, spi: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={s.label}>ESG Score (0-100)</label>
                      <input style={s.input} type="number" min={0} max={100}
                        value={form.esg_score ?? ''}
                        onChange={e => setForm(f => ({ ...f, esg_score: Number(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Orçamento detalhado ── */}
              <div style={s.card}>
                <div style={s.cardTit}>💰 Orçamento & EVM</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0 }}>
                  {[
                    { l:'Valor Contratual (PV)', v:fmtFull(project.budget_planned), c:'#534AB7' },
                    { l:'Custo Real Acumulado (AC)', v:fmtFull(project.budget_actual),
                      c: overBudget ? '#A32D2D' : '#3B6D11' },
                    { l:'EAC — Projeção Final',
                      v: project.eac ? fmtFull(project.eac) : '—', c:'#185FA5' },
                    { l:'Desvio de Custo (CV)',
                      v: project.budget_planned > 0
                        ? `${overBudget ? '-' : '+'}${fmt(Math.abs(project.budget_actual - project.budget_planned))}`
                        : '—',
                      c: overBudget ? '#A32D2D' : '#3B6D11' },
                    { l:'Índice CPI', v:idx(project.cpi),
                      c: cpiOk ? '#3B6D11' : '#A32D2D' },
                    { l:'Índice SPI', v:idx(project.spi),
                      c: spiOk ? '#3B6D11' : '#A32D2D' },
                  ].map((row, i) => (
                    <div key={row.l} style={{ padding:'14px 16px',
                      borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none',
                      borderRight: i % 3 !== 2 ? '1px solid #f0f2f5' : 'none' }}>
                      <div style={{ fontSize:10, color:'#8b93a7', fontWeight:600,
                        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{row.l}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:row.c }}>{row.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 7 Serviços ── */}
              <div style={s.card}>
                <div style={s.cardTit}>⚡ Serviços do Projeto</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[
                    { icon:'🤝', label:'Coordenação', desc:'RFIs · Submittals', href:'/bim-ops?tab=coordination' },
                    { icon:'⚡', label:'Compatibilização', desc:'Clash Detection', href:'/bim-ops?tab=clash' },
                    { icon:'📐', label:'Quantitativos', desc:'CSI Takeoff', href:'/bim-ops?tab=quantities' },
                    { icon:'📊', label:'Viabilidade', desc:'Pro Forma · IRR', href:'/bim-ops?tab=feasibility' },
                    { icon:'🏠', label:'Construção', desc:'Sistemas · Specs', href:'/bim-ops?tab=residential' },
                    { icon:'📁', label:'Doc. Executiva', desc:'CSI · Drawings', href:'/bim-ops?tab=docs' },
                    { icon:'⚖️', label:'Contrato', desc:'EN-US · PT-BR', href:'/juridico' },
                    { icon:'📋', label:'Permits', desc:'US · Checklist', href:'/bim-ops?tab=permits' },
                  ].map(srv => (
                    <a key={srv.label} href={srv.href}
                      style={{ display:'block', padding:'12px 14px', borderRadius:10, textDecoration:'none',
                        border:'1px solid #e5e8f0', background:'#fafbfd', transition:'all 0.15s' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#EFF4FF'
                        ;(e.currentTarget as HTMLElement).style.borderColor = '#185FA5'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = '#fafbfd'
                        ;(e.currentTarget as HTMLElement).style.borderColor = '#e5e8f0'
                      }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{srv.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#1a1f36' }}>{srv.label}</div>
                      <div style={{ fontSize:10, color:'#8b93a7', marginTop:2 }}>{srv.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* ── AI Analysis ── */}
              <div style={s.card}>
                <div style={s.cardTit}>🤖 Análise IA do Projeto</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const, marginBottom:12 }}>
                  {[
                    { label:'Diagnóstico Executivo', ctx:'exec',
                      prompt:`Analise este projeto de construção civil e forneça um diagnóstico executivo completo.
Projeto: ${project.name} (${project.code})
Status: ${statusLabel(project.status)} | Local: ${project.city}, ${project.state}
Avanço físico: ${project.completion_pct}%
Orçamento planejado: R$ ${project.budget_planned.toLocaleString('pt-BR')}
Custo real acumulado: R$ ${project.budget_actual.toLocaleString('pt-BR')}
CPI: ${project.cpi ?? 'N/A'} | SPI: ${project.spi ?? 'N/A'} | ESG: ${project.esg_score ?? 'N/A'}/100
Forneça: 1) Status geral (semáforo vermelho/amarelo/verde com justificativa); 2) Principais alertas e riscos; 3) Projeção de custo final (EAC); 4) Recomendações de ação imediata (top 3); 5) Pontos positivos a manter.` },
                    { label:'Análise de Risco', ctx:'risk',
                      prompt:`Realize uma análise de risco detalhada para o projeto: ${project.name}
CPI: ${project.cpi} | SPI: ${project.spi} | Avanço: ${project.completion_pct}%
Orçamento: R$${project.budget_planned.toLocaleString('pt-BR')} | Realizado: R$${project.budget_actual.toLocaleString('pt-BR')}
Status: ${statusLabel(project.status)}
Identifique: 1) Top 5 riscos críticos com probabilidade e impacto; 2) Gatilhos de alerta a monitorar; 3) Plano de mitigação para cada risco; 4) Cenários otimista / base / pessimista de EAC; 5) Indicadores de recuperação se o projeto estiver em desvio.` },
                    { label:'Relatório para Cliente', ctx:'client',
                      prompt:`Gere um relatório executivo profissional em português para apresentar ao cliente sobre o projeto: ${project.name} (${project.code}).
Avanço: ${project.completion_pct}% | Status: ${statusLabel(project.status)}
Local: ${project.city}, ${project.state}
Orçamento: R$${project.budget_planned.toLocaleString('pt-BR')} | Realizado: R$${project.budget_actual.toLocaleString('pt-BR')}
CPI: ${project.cpi} | SPI: ${project.spi} | ESG Score: ${project.esg_score}/100
Formato: executivo, linguagem clara para cliente não técnico. Inclua: sumário executivo, status do cronograma, situação orçamentária, próximos marcos, e mensagem de encerramento profissional. Máximo 1 página.` },
                  ].map(btn => (
                    <button key={btn.ctx} style={s.btnAI}
                      onClick={() => runAI(btn.ctx, btn.prompt)}>
                      🤖 {btn.label}
                    </button>
                  ))}
                </div>
                {aiLoading && (
                  <div style={{ textAlign:'center' as const, padding:'20px', color:'#185FA5', fontSize:13 }}>
                    ⏳ IA analisando o projeto...
                  </div>
                )}
                {aiText && !aiLoading && (
                  <div style={s.pre}>{aiText}</div>
                )}
              </div>
            </div>

            {/* ── Sidebar direita ── */}
            <div>
              {/* Info do projeto */}
              <div style={s.card}>
                <div style={s.cardTit}>📋 Informações</div>
                {[
                  { l:'Código', v: project.code },
                  { l:'Tipo', v: project.type || '—' },
                  { l:'Localização', v: [project.city, project.state].filter(Boolean).join(', ') || '—' },
                  { l:'Criado em', v: project.created_at
                    ? new Date(project.created_at).toLocaleDateString('pt-BR')
                    : '—' },
                ].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between',
                    padding:'8px 0', borderBottom:'1px solid #f0f2f5' }}>
                    <div style={{ fontSize:11, color:'#8b93a7', fontWeight:600 }}>{row.l}</div>
                    <div style={{ fontSize:12, color:'#1a1f36', fontWeight:500, textAlign:'right' as const,
                      maxWidth:180, wordBreak:'break-word' as const }}>{row.v}</div>
                  </div>
                ))}
              </div>

              {/* Alertas automáticos */}
              <div style={s.card}>
                <div style={s.cardTit}>🚨 Alertas Automáticos</div>
                {(() => {
                  const alerts: { color: string; icon: string; msg: string }[] = []
                  if ((project.cpi ?? 1) < 0.9)
                    alerts.push({ color:'#A32D2D', icon:'🔴', msg:`CPI crítico: ${idx(project.cpi)} — custo acima do planejado` })
                  else if ((project.cpi ?? 1) < 0.95)
                    alerts.push({ color:'#BA7517', icon:'🟡', msg:`CPI em atenção: ${idx(project.cpi)}` })
                  if ((project.spi ?? 1) < 0.9)
                    alerts.push({ color:'#A32D2D', icon:'🔴', msg:`SPI crítico: ${idx(project.spi)} — projeto atrasado` })
                  else if ((project.spi ?? 1) < 0.95)
                    alerts.push({ color:'#BA7517', icon:'🟡', msg:`SPI em atenção: ${idx(project.spi)}` })
                  if (overBudget)
                    alerts.push({ color:'#A32D2D', icon:'🔴', msg:`Acima do orçamento: ${fmt(project.budget_actual - project.budget_planned)}` })
                  if (project.status === 'atrasado')
                    alerts.push({ color:'#A32D2D', icon:'🔴', msg:'Status: Projeto marcado como atrasado' })
                  if ((project.esg_score ?? 100) < 50)
                    alerts.push({ color:'#BA7517', icon:'🟡', msg:`ESG score baixo: ${project.esg_score}/100` })
                  if (alerts.length === 0)
                    return <div style={{ fontSize:12, color:'#3B6D11', padding:'8px 0' }}>✓ Nenhum alerta — projeto dentro dos parâmetros</div>
                  return alerts.map((a, i) => (
                    <div key={i} style={{ fontSize:12, color:a.color, padding:'7px 0',
                      borderBottom:'1px solid #f0f2f5', display:'flex', gap:8 }}>
                      <span>{a.icon}</span> {a.msg}
                    </div>
                  ))
                })()}
              </div>

              {/* Activity log */}
              <div style={s.card}>
                <div style={s.cardTit}>📝 Histórico de Atualizações</div>
                {activity.length === 0 ? (
                  <div style={{ fontSize:12, color:'#8b93a7' }}>
                    Nenhuma atualização registrada ainda.
                  </div>
                ) : (
                  activity.slice(0, 10).map(a => (
                    <div key={a.id} style={{ padding:'7px 0', borderBottom:'1px solid #f0f2f5' }}>
                      <div style={{ fontSize:11, color:'#8b93a7' }}>
                        {new Date(a.ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit',
                          hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div style={{ fontSize:12, color:'#1a1f36', marginTop:2 }}>
                        {a.field && <span style={{ color:'#534AB7', fontWeight:600 }}>{a.field}: </span>}
                        {a.from && a.to ? `${a.from} → ${a.to}` : a.action}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
