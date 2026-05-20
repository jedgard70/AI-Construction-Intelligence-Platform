'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../../lib/supabase'

interface Project {
  id: string; name: string; code: string; type: string; status: string
  city: string; state: string; budget_planned: number; budget_actual: number
  completion_pct: number; cpi: number | null; spi: number | null
  eac: number | null; esg_score: number | null; created_at: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL',
    notation:'compact', maximumFractionDigits:1 }).format(v)
const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)
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

export default function ClienteView() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // Try localStorage first
    try {
      const all: Project[] = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
      const found = all.find(p => p.id === id)
      if (found) { setProject(found); setLoading(false) }
    } catch {}
    // Also try Supabase
    const sb = getSupabase()
    if (sb) {
      sb.from('projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) { setProject(data as Project); setLoading(false) }
      })
    }
    setLoading(false)
  }, [id])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'system-ui' }}>
      <div style={{ color:'#8b93a7', fontSize:14 }}>Carregando projeto...</div>
    </div>
  )

  if (!project) return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center', color:'#8b93a7' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
        <div style={{ fontSize:15, fontWeight:600, color:'#1a1f36', marginBottom:8 }}>Projeto não encontrado</div>
        <div style={{ fontSize:13 }}>Verifique o link enviado pelo seu gestor de obra.</div>
      </div>
    </div>
  )

  const burnPct = project.budget_planned > 0
    ? Math.min((project.budget_actual / project.budget_planned) * 100, 100) : 0
  const overBudget = project.budget_actual > project.budget_planned
  const cpiOk = (project.cpi ?? 1) >= 0.95
  const spiOk = (project.spi ?? 1) >= 0.95

  return (
    <>
      <Head>
        <title>{project.name} — Relatório do Projeto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f5f7; font-family: 'Geist', system-ui, sans-serif; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#f4f5f7' }}>
        {/* Header */}
        <div style={{ background:'#0F4C81', padding:'16px 24px 20px', color:'#fff' }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'#f0a500',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏗️</div>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600,
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>Atlas Construction Intelligence</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Relatório do Projeto — Acesso do Cliente</div>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:700 }}>{project.name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:4, display:'flex', gap:16 }}>
              <span>{project.code}</span>
              <span>·</span>
              <span>{[project.city, project.state].filter(Boolean).join(', ')}</span>
              <span>·</span>
              <span style={{ padding:'2px 10px', borderRadius:20,
                background: statusColor(project.status)+'33', color:'#fff', fontWeight:600 }}>
                {statusLabel(project.status)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 16px' }}>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
            {/* Avanço */}
            <div style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e5e8f0' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#8b93a7', textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:8 }}>Avanço Físico da Obra</div>
              <div style={{ fontSize:32, fontWeight:800, color:'#1a1f36', marginBottom:10 }}>
                {pct(project.completion_pct)}
              </div>
              <div style={{ width:'100%', height:8, background:'#e5e8f0', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${project.completion_pct}%`, height:'100%', borderRadius:4,
                  background: project.completion_pct>=75 ? '#3B6D11' : project.completion_pct>=40 ? '#185FA5' : '#BA7517',
                  transition:'width 0.4s ease' }} />
              </div>
            </div>

            {/* Orçamento */}
            <div style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e5e8f0' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#8b93a7', textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:8 }}>Situação Orçamentária</div>
              <div style={{ fontSize:32, fontWeight:800,
                color: overBudget ? '#A32D2D' : '#3B6D11', marginBottom:6 }}>
                {pct(burnPct)}
              </div>
              <div style={{ fontSize:12, color:'#8b93a7' }}>
                {fmt(project.budget_actual)} executado de {fmt(project.budget_planned)} contratado
              </div>
              {overBudget && (
                <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginTop:6 }}>
                  ⚠ Acima do orçamento em {fmt(project.budget_actual - project.budget_planned)}
                </div>
              )}
            </div>
          </div>

          {/* Índices */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Índice de Custo (CPI)', value: idx(project.cpi),
                ok: cpiOk, tip: cpiOk ? 'Custo dentro do planejado' : 'Custo acima do previsto' },
              { label:'Índice de Prazo (SPI)', value: idx(project.spi),
                ok: spiOk, tip: spiOk ? 'Cronograma no prazo' : 'Projeto com atraso' },
              { label:'Score ESG', value: `${project.esg_score ?? '—'}/100`,
                ok: (project.esg_score ?? 0) >= 70,
                tip: (project.esg_score ?? 0) >= 70 ? 'Padrão sustentável' : 'Requer atenção' },
            ].map(k => (
              <div key={k.label} style={{ background:'#fff', borderRadius:12, padding:16,
                border:`1px solid ${k.ok ? '#e5e8f0' : '#FBBCBC'}` }}>
                <div style={{ fontSize:10, fontWeight:600, color:'#8b93a7', textTransform:'uppercase',
                  letterSpacing:'0.06em', marginBottom:6 }}>{k.label}</div>
                <div style={{ fontSize:24, fontWeight:800,
                  color: k.ok ? '#3B6D11' : '#A32D2D', marginBottom:4 }}>{k.value}</div>
                <div style={{ fontSize:11, color: k.ok ? '#3B6D11' : '#A32D2D' }}>
                  {k.ok ? '✓' : '⚠'} {k.tip}
                </div>
              </div>
            ))}
          </div>

          {/* Orçamento detalhado */}
          <div style={{ background:'#fff', borderRadius:12, padding:20, border:'1px solid #e5e8f0', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36', marginBottom:14 }}>
              💰 Resumo Financeiro
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[
                { l:'Valor Contratual', v: fmtFull(project.budget_planned), c:'#534AB7' },
                { l:'Custo Executado até hoje', v: fmtFull(project.budget_actual),
                  c: overBudget ? '#A32D2D' : '#3B6D11' },
                { l:'Projeção de Custo Final (EAC)',
                  v: project.eac ? fmtFull(project.eac) : '—', c:'#185FA5' },
                { l:'Desvio de Custo',
                  v: project.budget_planned > 0
                    ? `${overBudget ? '-' : '+'}${fmt(Math.abs(project.budget_actual - project.budget_planned))}`
                    : '—',
                  c: overBudget ? '#A32D2D' : '#3B6D11' },
              ].map((row, i) => (
                <div key={row.l} style={{ padding:'12px 16px',
                  borderBottom: i < 2 ? '1px solid #f0f2f5' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid #f0f2f5' : 'none' }}>
                  <div style={{ fontSize:10, color:'#8b93a7', fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{row.l}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:row.c }}>{row.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div style={{ background:'#fff', borderRadius:12, padding:20, border:'1px solid #e5e8f0', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36', marginBottom:12 }}>📋 Informações do Projeto</div>
            {[
              { l:'Código da Obra', v: project.code },
              { l:'Tipo de Obra', v: project.type || '—' },
              { l:'Localização', v: [project.city, project.state].filter(Boolean).join(', ') || '—' },
              { l:'Início', v: project.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : '—' },
            ].map(row => (
              <div key={row.l} style={{ display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid #f0f2f5', fontSize:13 }}>
                <span style={{ color:'#8b93a7', fontWeight:500 }}>{row.l}</span>
                <span style={{ color:'#1a1f36', fontWeight:600 }}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign:'center', padding:'20px 0', fontSize:11, color:'#8b93a7' }}>
            Relatório gerado por <strong>Atlas Construction Intelligence Platform</strong><br/>
            Atualizado em {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
        </div>
      </div>
    </>
  )
}
