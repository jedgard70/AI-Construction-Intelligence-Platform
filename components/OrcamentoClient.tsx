'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { getSupabase } from '../lib/supabase'

const OrcamentoCurvaSChart = dynamic(() => import('./OrcamentoCurvaSChart'), {
  ssr: false,
  loading: () => <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b93a7', fontSize: 12 }}>Carregando gráfico...</div>,
})

const OrcamentoBarChart = dynamic(() => import('./OrcamentoBarChart'), {
  ssr: false,
  loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b93a7', fontSize: 12 }}>Carregando gráfico...</div>,
})

// ─── Tipos ───────────────────────────────────────────────────
interface Project {
  id: string; name: string; code: string; status: string
  budget_planned: number; budget_actual: number; budget_earned: number
  cpi: number | null; spi: number | null; eac: number | null
  vac: number | null; tcpi: number | null; completion_pct: number
}
interface BudgetItem {
  period: string; pv: number; ev: number; ac: number
  cost_labor: number; cost_materials: number; cost_equipment: number
  cost_third_party: number; cost_other: number
}

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
}).format(v)

const fmtFull = (v: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(v)

const fmtKpi = (v: number | null) => v != null ? v.toFixed(2) : '—'

function kpiColor(v: number | null, meta = 0.95) {
  if (v == null) return '#8b93a7'
  return v >= meta ? '#3B6D11' : v >= meta - 0.05 ? '#854F0B' : '#A32D2D'
}

// ─── Componente ──────────────────────────────────────────────
export default function OrcamentoClient({ profile }: { profile: any }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      // Try localStorage projects first, fall back to demo data
      let localProjects: Project[] = []
      try {
        const raw = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
        localProjects = raw
          .filter((p: any) => p.id && p.name)
          .map((p: any) => {
            const bp = Number(p.budget_planned ?? p.orcamento ?? 5000000)
            const ba = Number(p.budget_actual  ?? p.realizado   ?? bp * 0.75)
            const cpi = p.cpi != null ? Number(p.cpi) : (ba > 0 ? bp / ba : 1)
            const spi = p.spi != null ? Number(p.spi) : 0.95
            const be = ba * cpi
            const eac = bp / Math.max(cpi, 0.01)
            const vac = bp - eac
            const tcpi = (bp - be) / Math.max(eac - ba, 1)
            return {
              id: p.id, name: p.name, code: p.code ?? p.id,
              status: p.status ?? 'em_andamento',
              budget_planned: bp, budget_actual: ba, budget_earned: be,
              cpi, spi, eac, vac, tcpi,
              completion_pct: Number(p.completion_pct ?? p.avanco_fisico ?? 50),
            } as Project
          })
      } catch {}

      const demoProjects: Project[] = [
        { id:'1', name:'Ponte Av. Central', code:'OBR-2026-001', status:'em_andamento',
          budget_planned:12400000, budget_actual:12100000, budget_earned:12300000,
          cpi:1.02, spi:1.04, eac:12200000, vac:200000, tcpi:0.98, completion_pct:82 },
        { id:'2', name:'Torre B Comercial', code:'OBR-2026-002', status:'atrasado',
          budget_planned:18700000, budget_actual:20600000, budget_earned:16700000,
          cpi:0.81, spi:0.88, eac:23100000, vac:-4400000, tcpi:1.18, completion_pct:55 },
        { id:'3', name:'Usina Hidrelétrica Paraná', code:'OBR-2026-003', status:'atrasado',
          budget_planned:9100000, budget_actual:9800000, budget_earned:9000000,
          cpi:0.92, spi:0.79, eac:9900000, vac:-800000, tcpi:1.08, completion_pct:38 },
        { id:'4', name:'BR-163 Trecho 4', code:'OBR-2026-004', status:'em_andamento',
          budget_planned:8100000, budget_actual:7900000, budget_earned:8000000,
          cpi:0.99, spi:0.97, eac:8200000, vac:-100000, tcpi:1.01, completion_pct:71 },
      ]
      setProjects(localProjects.length > 0 ? localProjects : demoProjects)
      setBudgetData([
        { period:'Jan', pv:6000000, ev:5800000, ac:5900000, cost_labor:3000000, cost_materials:1800000, cost_equipment:600000, cost_third_party:400000, cost_other:100000 },
        { period:'Fev', pv:12000000, ev:11500000, ac:12100000, cost_labor:5800000, cost_materials:3800000, cost_equipment:1500000, cost_third_party:800000, cost_other:200000 },
        { period:'Mar', pv:20000000, ev:19000000, ac:20500000, cost_labor:10000000, cost_materials:6000000, cost_equipment:2500000, cost_third_party:1500000, cost_other:500000 },
        { period:'Abr', pv:30000000, ev:28000000, ac:31000000, cost_labor:15000000, cost_materials:9000000, cost_equipment:4000000, cost_third_party:2500000, cost_other:500000 },
        { period:'Mai', pv:40000000, ev:36000000, ac:41500000, cost_labor:20000000, cost_materials:12000000, cost_equipment:5500000, cost_third_party:3500000, cost_other:500000 },
        { period:'Jun', pv:48300000, ev:null as any, ac:null as any, cost_labor:0, cost_materials:0, cost_equipment:0, cost_third_party:0, cost_other:0 },
      ])
      setLoading(false)
      return
    }
    const [projRes, budgetRes] = await Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('budget_items').select('*').order('period', { ascending: true }).limit(24),
    ])
    if (projRes.data) setProjects(projRes.data as Project[])
    if (budgetRes.data) setBudgetData(
      budgetRes.data.map((b: any) => ({
        period: new Date(b.period).toLocaleDateString('pt-BR', { month: 'short' }),
        pv: b.pv, ev: b.ev, ac: b.ac,
        cost_labor: b.cost_labor, cost_materials: b.cost_materials,
        cost_equipment: b.cost_equipment, cost_third_party: b.cost_third_party,
        cost_other: b.cost_other,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const visibleProjects = selectedProject === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProject)

  const totalPlan   = visibleProjects.reduce((a, p) => a + p.budget_planned, 0)
  const totalActual = visibleProjects.reduce((a, p) => a + p.budget_actual,  0)
  const totalEAC    = visibleProjects.reduce((a, p) => a + (p.eac ?? p.budget_planned), 0)
  const totalVAC    = visibleProjects.reduce((a, p) => a + (p.vac ?? 0), 0)
  const cpiMed      = visibleProjects.reduce((a, p) => a + (p.cpi ?? 0), 0) / Math.max(visibleProjects.length, 1)
  const spiMed      = visibleProjects.reduce((a, p) => a + (p.spi ?? 0), 0) / Math.max(visibleProjects.length, 1)
  const desvio      = totalPlan > 0 ? ((totalActual - totalPlan) / totalPlan) * 100 : 0

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f8f9fc',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'#185FA5',fontFamily:'monospace',fontSize:'14px'}}>Carregando orçamento...</span>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #f4f5f7; font-family: 'Geist', sans-serif; }
      `}</style>

      <div style={{minHeight:'100vh', background:'#f4f5f7'}}>

        {/* Topbar */}
        <div style={{background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'12px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <button onClick={() => router.push('/dashboard')}
              style={{background:'none', border:'none', cursor:'pointer', color:'#8b93a7', fontSize:20}}>
              ←
            </button>
            <div>
              <h1 style={{fontSize:16, fontWeight:600, color:'#1a1f36'}}>💰 Orçamento & EVM</h1>
              <p style={{fontSize:12, color:'#8b93a7'}}>Curva S · Earned Value Management · Portfólio</p>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              style={{padding:'7px 12px', border:'1px solid #e5e8f0', borderRadius:8,
                fontSize:12, background:'#f8f9fc', color:'#1a1f36', cursor:'pointer'}}>
              <option value="all">Portfólio completo</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={loadData}
              style={{padding:'7px 14px', border:'1px solid #e5e8f0', borderRadius:8,
                background:'#fff', fontSize:12, color:'#5a6282', cursor:'pointer'}}>
              🔄 Atualizar
            </button>
          </div>
        </div>

        <div style={{padding:'20px 24px', display:'flex', flexDirection:'column', gap:16}}>

          {/* KPIs EVM */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:10}}>
            {[
              { label:'BAC (Orçamento base)',  value:fmt(totalPlan),   sub:'Budget at Completion', color:'#185FA5' },
              { label:'AC (Realizado)',         value:fmt(totalActual), sub:`${desvio>=0?'+':''}${desvio.toFixed(1)}% vs. previsto`, color: desvio>10?'#A32D2D':desvio>5?'#854F0B':'#3B6D11' },
              { label:'EAC (Projeção final)',   value:fmt(totalEAC),   sub:'Estimate at Completion', color:'#854F0B' },
              { label:'VAC (Variância final)',  value:fmt(totalVAC),   sub:totalVAC>=0?'Economia projetada':'Estouro projetado', color:totalVAC>=0?'#3B6D11':'#A32D2D' },
              { label:'CPI médio',              value:fmtKpi(cpiMed),  sub: cpiMed>=0.95?'Dentro da meta':'Atenção', color:kpiColor(cpiMed) },
              { label:'SPI médio',              value:fmtKpi(spiMed),  sub: spiMed>=0.95?'No cronograma':'Atrasado', color:kpiColor(spiMed) },
            ].map((k, i) => (
              <div key={i} style={{background:'#fff', border:'1px solid #e5e8f0',
                borderRadius:12, padding:'14px 16px'}}>
                <div style={{fontSize:10, color:'#8b93a7', marginBottom:6, fontWeight:500,
                  textTransform:'uppercase', letterSpacing:'0.06em'}}>{k.label}</div>
                <div style={{fontSize:20, fontWeight:600, color:k.color, marginBottom:3}}>{k.value}</div>
                <div style={{fontSize:11, color:'#8b93a7'}}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Curva S */}
          <div style={{background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'16px'}}>
            <div style={{fontSize:14, fontWeight:600, color:'#1a1f36', marginBottom:4}}>
              📈 Curva S — Previsto × Agregado × Realizado
            </div>
            <div style={{fontSize:12, color:'#8b93a7', marginBottom:16}}>
              EVM consolidado · A área vermelha indica desvio acima do previsto
            </div>
            <OrcamentoCurvaSChart data={budgetData} />
          </div>

          {/* Gastos por categoria */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div style={{background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'16px'}}>
              <div style={{fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:16}}>
                📊 Gastos mensais por categoria
              </div>
              <OrcamentoBarChart data={budgetData.filter((d: any) => d.cost_labor > 0)} />
            </div>

            {/* Tabela EVM por projeto */}
            <div style={{background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, overflow:'hidden'}}>
              <div style={{padding:'14px 16px', borderBottom:'1px solid #e5e8f0',
                fontSize:13, fontWeight:600, color:'#1a1f36'}}>
                📋 EVM por projeto
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                  <thead>
                    <tr style={{background:'#f8f9fc'}}>
                      {['Projeto','CPI','SPI','EAC','VAC','Status'].map(h => (
                        <th key={h} style={{padding:'8px 12px', textAlign:'left',
                          fontWeight:600, color:'#8b93a7', borderBottom:'1px solid #e5e8f0'}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProjects.map((p, i) => (
                      <tr key={p.id}
                        style={{background: i%2===0?'#fff':'#fafbfd',
                          borderBottom:'1px solid #f0f2f7'}}>
                        <td style={{padding:'10px 12px', fontWeight:500, color:'#1a1f36'}}>
                          <div style={{fontSize:11}}>{p.name}</div>
                          <div style={{fontSize:10, color:'#a0a8bb'}}>{p.code}</div>
                        </td>
                        <td style={{padding:'10px 12px', fontWeight:600,
                          color:kpiColor(p.cpi)}}>{fmtKpi(p.cpi)}</td>
                        <td style={{padding:'10px 12px', fontWeight:600,
                          color:kpiColor(p.spi)}}>{fmtKpi(p.spi)}</td>
                        <td style={{padding:'10px 12px', color:'#5a6282'}}>{fmt(p.eac ?? 0)}</td>
                        <td style={{padding:'10px 12px', fontWeight:600,
                          color:(p.vac??0)>=0?'#3B6D11':'#A32D2D'}}>
                          {(p.vac??0)>=0?'+':''}{fmt(p.vac??0)}
                        </td>
                        <td style={{padding:'10px 12px'}}>
                          <span style={{
                            fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
                            background: (p.cpi??1)<0.9?'#FCEBEB':(p.cpi??1)<0.95?'#FAEEDA':'#EAF3DE',
                            color: (p.cpi??1)<0.9?'#A32D2D':(p.cpi??1)<0.95?'#854F0B':'#3B6D11',
                          }}>
                            {(p.cpi??1)<0.9?'Crítico':(p.cpi??1)<0.95?'Atenção':'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Totais */}
                    <tr style={{background:'#EFF4FF', borderTop:'2px solid #185FA5'}}>
                      <td style={{padding:'10px 12px', fontWeight:700, color:'#185FA5', fontSize:11}}>
                        {selectedProject === 'all' ? 'TOTAL PORTFÓLIO' : 'TOTAL PROJETO'}
                      </td>
                      <td style={{padding:'10px 12px', fontWeight:700, color:kpiColor(cpiMed)}}>
                        {fmtKpi(cpiMed)}
                      </td>
                      <td style={{padding:'10px 12px', fontWeight:700, color:kpiColor(spiMed)}}>
                        {fmtKpi(spiMed)}
                      </td>
                      <td style={{padding:'10px 12px', fontWeight:700, color:'#1a1f36'}}>
                        {fmt(totalEAC)}
                      </td>
                      <td style={{padding:'10px 12px', fontWeight:700,
                        color:totalVAC>=0?'#3B6D11':'#A32D2D'}}>
                        {totalVAC>=0?'+':''}{fmt(totalVAC)}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{fontSize:10, fontWeight:600, padding:'2px 8px',
                          borderRadius:20, background:'#E6F1FB', color:'#185FA5'}}>
                          Portfólio
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
