'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getSupabase } from '../lib/supabase'
import HelpButton from './HelpButton'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)
const fmtFull = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtKpi = (v: number | null) => v != null ? v.toFixed(2) : '—'
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

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

const DEMO_PROJECTS: Project[] = [
  { id:'1', name:'Ponte Av. Central', code:'OBR-2026-001', status:'em_andamento', budget_planned:12400000, budget_actual:12100000, budget_earned:12648000, cpi:1.02, spi:1.04, eac:12200000, vac:200000, tcpi:0.93, completion_pct:82 },
  { id:'2', name:'Torre B Comercial', code:'OBR-2026-002', status:'atrasado', budget_planned:18700000, budget_actual:20600000, budget_earned:16647000, cpi:0.81, spi:0.88, eac:23100000, vac:-4400000, tcpi:1.18, completion_pct:55 },
  { id:'3', name:'Usina Hidrelétrica', code:'OBR-2026-003', status:'atrasado', budget_planned:9100000, budget_actual:9800000, budget_earned:9016000, cpi:0.92, spi:0.79, eac:9900000, vac:-800000, tcpi:1.08, completion_pct:38 },
  { id:'4', name:'BR-163 Trecho 4', code:'OBR-2026-004', status:'em_andamento', budget_planned:8100000, budget_actual:7900000, budget_earned:7821000, cpi:0.99, spi:0.97, eac:8200000, vac:-100000, tcpi:1.02, completion_pct:71 },
]

const DEMO_BUDGET: BudgetItem[] = [
  { period:'Jan', pv:6000000, ev:5800000, ac:5900000, cost_labor:2950000, cost_materials:1770000, cost_equipment:590000, cost_third_party:354000, cost_other:236000 },
  { period:'Fev', pv:12000000, ev:11500000, ac:12100000, cost_labor:6050000, cost_materials:3630000, cost_equipment:1210000, cost_third_party:726000, cost_other:484000 },
  { period:'Mar', pv:20000000, ev:19000000, ac:20500000, cost_labor:10250000, cost_materials:6150000, cost_equipment:2050000, cost_third_party:1230000, cost_other:820000 },
  { period:'Abr', pv:30000000, ev:28000000, ac:31000000, cost_labor:15500000, cost_materials:9300000, cost_equipment:3100000, cost_third_party:1860000, cost_other:1240000 },
  { period:'Mai', pv:40000000, ev:36000000, ac:41500000, cost_labor:20750000, cost_materials:12450000, cost_equipment:4150000, cost_third_party:2490000, cost_other:1660000 },
  { period:'Jun', pv:48300000, ev:null as any, ac:null as any, cost_labor:0, cost_materials:0, cost_equipment:0, cost_third_party:0, cost_other:0 },
]

export default function OrcamentoClient({ profile }: { profile: any }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      setProjects(DEMO_PROJECTS)
      setBudget(DEMO_BUDGET)
      setLoading(false)
      return
    }
    const [projRes, budgetRes] = await Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('budget_items').select('*').order('period', { ascending: true }),
    ])
    if (projRes.data) setProjects(projRes.data as Project[])
    if (budgetRes.data) setBudget(budgetRes.data.map((b: any) => ({
      ...b, period: new Date(b.period).toLocaleDateString('pt-BR', { month: 'short' })
    })))
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleLogout() {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    router.replace('/login')
  }

  const totalPlan = projects.reduce((a, p) => a + p.budget_planned, 0)
  const totalActual = projects.reduce((a, p) => a + p.budget_actual, 0)
  const totalEarned = projects.reduce((a, p) => a + p.budget_earned, 0)
  const totalEAC = projects.reduce((a, p) => a + (p.eac ?? p.budget_planned), 0)
  const desvio = totalPlan > 0 ? ((totalActual - totalPlan) / totalPlan) * 100 : 0
  const cpiMed = projects.reduce((a, p) => a + (p.cpi ?? 0), 0) / Math.max(projects.length, 1)
  const spiMed = projects.reduce((a, p) => a + (p.spi ?? 0), 0) / Math.max(projects.length, 1)

  const kpiColor = (v: number, meta: number) => v >= meta ? '#3B6D11' : v >= meta * 0.95 ? '#854F0B' : '#A32D2D'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:'14px', letterSpacing:'2px' }}>CARREGANDO...</span>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #f4f5f7; font-family: 'Geist', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #d0d5e0; border-radius: 2px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ width:220, minWidth:220, background:'#fff', borderRight:'1px solid #e5e8f0', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #e5e8f0', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#185FA5', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#fff' }}>🏗</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36' }}>ConstructAI</div>
              <div style={{ fontSize:9, color:'#8b93a7', letterSpacing:'0.06em' }}>v5.3 ENTERPRISE</div>
            </div>
          </div>
          <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
            <div style={{ fontSize:9, color:'#a0a8bb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 8px 4px' }}>Principal</div>
            {[
              { label:'Dashboard', href:'/dashboard' },
              { label:'Orçamento / EVM', href:'/orcamento', active:true },
              { label:'Cronograma', href:'/cronograma' },
            ].map((item, i) => (
              <button key={i} onClick={() => router.push(item.href)}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight: item.active ? 500 : 400, background: item.active ? '#EFF4FF' : 'transparent', color: item.active ? '#185FA5' : '#5a6282', marginBottom:2 }}>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding:'12px', borderTop:'1px solid #e5e8f0', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'#EAF3DE', color:'#3B6D11', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>
              {profile?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() || '?'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#1a1f36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.full_name || profile?.email}</div>
              <div style={{ fontSize:10, color:'#8b93a7' }}>💲 {profile?.role}</div>
            </div>
            <button onClick={handleLogout} title="Sair" style={{ background:'none', border:'none', cursor:'pointer', color:'#a0a8bb', fontSize:16 }}>↩</button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <h1 style={{ fontSize:16, fontWeight:600, color:'#1a1f36' }}>💰 Orçamento & EVM</h1>
              <p style={{ fontSize:12, color:'#8b93a7' }}>Curva S · Earned Value Management · Desvios</p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                style={{ padding:'7px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#f8f9fc', color:'#1a1f36', cursor:'pointer' }}>
                <option value="all">Portfólio completo</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={loadData} style={{ padding:'7px 14px', border:'1px solid #e5e8f0', borderRadius:8, background:'#fff', fontSize:12, fontWeight:500, color:'#5a6282', cursor:'pointer', fontFamily:'inherit' }}>
                🔄 Atualizar
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

            {/* KPIs EVM */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:10 }}>
              {[
                { label:'BAC (Orçamento)', value: fmt(totalPlan), sub:'Base contratual', color:'#185FA5' },
                { label:'AC (Realizado)', value: fmt(totalActual), sub: fmtPct(desvio) + ' vs previsto', color: desvio > 10 ? '#A32D2D' : desvio > 5 ? '#854F0B' : '#3B6D11' },
                { label:'EV (Agregado)', value: fmt(totalEarned), sub:'Valor agregado', color:'#3B6D11' },
                { label:'EAC (Projeção)', value: fmt(totalEAC), sub:'Custo final estimado', color: totalEAC > totalPlan ? '#A32D2D' : '#3B6D11' },
                { label:'CPI médio', value: fmtKpi(cpiMed), sub: cpiMed >= 0.95 ? 'Dentro da meta' : 'Abaixo da meta', color: kpiColor(cpiMed, 0.95) },
                { label:'SPI médio', value: fmtKpi(spiMed), sub: spiMed >= 0.95 ? 'Dentro da meta' : 'Abaixo da meta', color: kpiColor(spiMed, 0.95) },
              ].map((k, i) => (
                <div key={i} style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:10, color:'#8b93a7', marginBottom:5 }}>{k.label}</div>
                  <div style={{ fontSize:20, fontWeight:600, color: k.color, marginBottom:3 }}>{k.value}</div>
                  <div style={{ fontSize:10, color:'#8b93a7' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Curva S */}
            <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a1f36' }}>📈 Curva S — Previsto × Realizado × Agregado</div>
                  <div style={{ fontSize:11, color:'#8b93a7', marginTop:2 }}>EVM consolidado do portfólio</div>
                </div>
                <div style={{ display:'flex', gap:16, fontSize:11, color:'#5a6282' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:12, height:3, background:'#185FA5', display:'inline-block', borderRadius:2 }}></span> Previsto (PV)</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:12, height:3, background:'#3B6D11', display:'inline-block', borderRadius:2 }}></span> Agregado (EV)</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:12, height:3, background:'#A32D2D', display:'inline-block', borderRadius:2 }}></span> Realizado (AC)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={budget} margin={{ top:4, right:8, left:8, bottom:0 }}>
                  <defs>
                    <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#185FA5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#185FA5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gEV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B6D11" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gAC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A32D2D" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#A32D2D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7"/>
                  <XAxis dataKey="period" tick={{ fontSize:11, fill:'#8b93a7' }}/>
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize:10, fill:'#8b93a7' }} width={70}/>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ fontSize:11, border:'1px solid #e5e8f0', borderRadius:8 }}/>
                  <ReferenceLine x="Mai" stroke="#BA7517" strokeDasharray="4 2" label={{ value:'Hoje', fill:'#BA7517', fontSize:10 }}/>
                  <Area type="monotone" dataKey="pv" name="Previsto (PV)" stroke="#185FA5" fill="url(#gPV)" strokeWidth={2} dot={false} connectNulls/>
                  <Area type="monotone" dataKey="ev" name="Agregado (EV)" stroke="#3B6D11" fill="url(#gEV)" strokeWidth={2.5} dot={false} connectNulls/>
                  <Area type="monotone" dataKey="ac" name="Realizado (AC)" stroke="#A32D2D" fill="url(#gAC)" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Linha inferior */}
            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>

              {/* Tabela EVM por projeto */}
              <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e5e8f0', fontSize:13, fontWeight:600, color:'#1a1f36' }}>
                  📋 EVM por projeto
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f8f9fc' }}>
                        {['Projeto','BAC','AC','EV','CPI','SPI','EAC','VAC'].map(h => (
                          <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:600, color:'#8b93a7', fontSize:10, borderBottom:'1px solid #e5e8f0', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, i) => (
                        <tr key={p.id} style={{ background: i%2===0 ? '#fff' : '#fafbfd' }}>
                          <td style={{ padding:'10px 12px', fontWeight:500, color:'#1a1f36' }}>
                            <div style={{ fontSize:11 }}>{p.name}</div>
                            <div style={{ fontSize:9, color:'#a0a8bb' }}>{p.code}</div>
                          </td>
                          <td style={{ padding:'10px 12px', color:'#5a6282', whiteSpace:'nowrap' }}>{fmt(p.budget_planned)}</td>
                          <td style={{ padding:'10px 12px', whiteSpace:'nowrap', color: p.budget_actual > p.budget_planned ? '#A32D2D' : '#3B6D11', fontWeight:500 }}>{fmt(p.budget_actual)}</td>
                          <td style={{ padding:'10px 12px', color:'#3B6D11', whiteSpace:'nowrap' }}>{fmt(p.budget_earned)}</td>
                          <td style={{ padding:'10px 12px', fontWeight:500, color: kpiColor(p.cpi??0, 0.95) }}>{fmtKpi(p.cpi)}</td>
                          <td style={{ padding:'10px 12px', fontWeight:500, color: kpiColor(p.spi??0, 0.95) }}>{fmtKpi(p.spi)}</td>
                          <td style={{ padding:'10px 12px', whiteSpace:'nowrap', color: (p.eac??0) > p.budget_planned ? '#A32D2D' : '#3B6D11' }}>{fmt(p.eac??0)}</td>
                          <td style={{ padding:'10px 12px', whiteSpace:'nowrap', fontWeight:500, color: (p.vac??0) >= 0 ? '#3B6D11' : '#A32D2D' }}>{fmt(p.vac??0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico de gastos por categoria */}
              <div style={{ background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'16px' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:14 }}>
                  📊 Gastos por categoria
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budget.filter(b => b.ac > 0)} margin={{ top:4, right:8, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7"/>
                    <XAxis dataKey="period" tick={{ fontSize:10, fill:'#8b93a7' }}/>
                    <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize:9, fill:'#8b93a7' }} width={60}/>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ fontSize:11, border:'1px solid #e5e8f0', borderRadius:8 }}/>
                    <Legend iconSize={8} formatter={(v) => <span style={{ fontSize:10, color:'#5a6282' }}>{v}</span>}/>
                    <Bar dataKey="cost_labor" name="Mão de obra" stackId="a" fill="#185FA5"/>
                    <Bar dataKey="cost_materials" name="Materiais" stackId="a" fill="#3B6D11"/>
                    <Bar dataKey="cost_equipment" name="Equipamentos" stackId="a" fill="#BA7517"/>
                    <Bar dataKey="cost_third_party" name="Terceiros" stackId="a" fill="#534AB7"/>
                    <Bar dataKey="cost_other" name="Outros" stackId="a" fill="#5F5E5A" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </main>
      </div>
      <HelpButton />
    </>
  )
}
