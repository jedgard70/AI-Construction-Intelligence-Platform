/* global React */
// DashboardPieces.jsx — KPI grid, Curva S (inline SVG), Agent alerts, Projects table

// ── Demo data ─────────────────────────────────────────────────
const DEMO_PROJECTS = [
  { id:'1', name:'Ponte Av. Central',         code:'OBR-2026-001', status:'em_andamento',
    city:'São Paulo',     state:'SP', budget_planned:12400000, budget_actual:12100000,
    completion_pct:82, cpi:1.02, spi:1.04, eac:12200000, esg_score:81 },
  { id:'2', name:'Torre B Comercial',         code:'OBR-2026-002', status:'atrasado',
    city:'Rio de Janeiro', state:'RJ', budget_planned:18700000, budget_actual:20600000,
    completion_pct:55, cpi:0.81, spi:0.88, eac:23100000, esg_score:78 },
  { id:'3', name:'Usina Hidrelétrica Paraná', code:'OBR-2026-003', status:'atrasado',
    city:'Curitiba',      state:'PR', budget_planned:9100000,  budget_actual:9800000,
    completion_pct:38, cpi:0.92, spi:0.79, eac:9900000,  esg_score:69 },
  { id:'4', name:'BR-163 Trecho 4',           code:'OBR-2026-004', status:'em_andamento',
    city:'Sinop',         state:'MT', budget_planned:8100000,  budget_actual:7900000,
    completion_pct:71, cpi:0.99, spi:0.97, eac:8200000,  esg_score:72 },
];

const DEMO_ALERTS = [
  { id:'1', prio:'critico', agent:'Cost_Controller',
    summary:'Torre B: aço A572 +22% acima do SINAPI. Substituto sugerido: HEA.', time:'14:23' },
  { id:'2', prio:'alto',    agent:'Construction_Planner',
    summary:'Usina Paraná: 18 dias de atraso acumulado. Replanejamento necessário.', time:'13:48' },
  { id:'3', prio:'medio',   agent:'Document_Intelligence',
    summary:'Memorial Torre B: 3 inconsistências de armadura identificadas (págs 47, 89, 112).', time:'11:02' },
];

// ── Helpers ────────────────────────────────────────────────────
const fmtBRL = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:1}).format(v);
const fmtKpi = (v) => v != null ? v.toFixed(2) : '—';

const STATUS_COLOR = {
  em_andamento:'#185FA5', atrasado:'#A32D2D', planejamento:'#534AB7',
  pausado:'#BA7517',     concluido:'#3B6D11', cancelado:'#5F5E5A',
};
const STATUS_LABEL = {
  em_andamento:'Em andamento', atrasado:'Atrasado', planejamento:'Planejamento',
  pausado:'Pausado',          concluido:'Concluído', cancelado:'Cancelado',
};
const PRIO_COLOR = (p) => p==='critico'?'#A32D2D':p==='alto'?'#BA7517':p==='medio'?'#185FA5':'#5F5E5A';

// ── KPI grid ───────────────────────────────────────────────────
function KpiGrid({ kpis }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ background:'#fff', border:'1px solid #e5e8f0',
          borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#8b93a7', marginBottom:6,
            display:'flex', alignItems:'center', gap:5 }}>
            <span>{k.icon}</span> {k.label}
          </div>
          <div style={{ fontSize:22, fontWeight:600, color:'#1a1f36',
            marginBottom:3, letterSpacing:'-.01em' }}>{k.value}</div>
          <div style={{ fontSize:11, color:
            k.trend==='up'?'#3B6D11': k.trend==='down'?'#A32D2D':
            k.trend==='warn'?'#854F0B':'#8b93a7' }}>
            {k.trend==='up'?'↑ ':k.trend==='down'?'↓ ':k.trend==='warn'?'⚠ ':''}{k.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Curva S (inline SVG; matches preview/comp-curva-s.html) ───
function CurvaSCard() {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e8f0',
      borderRadius:12, padding:16 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>
        📈 Curva S — Previsto × Realizado × Projeção
      </div>
      <div style={{ fontSize:11, color:'#8b93a7', marginBottom:10 }}>
        EVM consolidado do portfólio
      </div>
      <svg viewBox="0 0 520 180" style={{ width:'100%', height:200, display:'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#185FA5" stopOpacity="0.15"/><stop offset="100%" stopColor="#185FA5" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gEV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B6D11" stopOpacity="0.22"/><stop offset="100%" stopColor="#3B6D11" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gAC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A32D2D" stopOpacity="0.18"/><stop offset="100%" stopColor="#A32D2D" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[20,60,100,140].map(y => (
          <line key={y} x1="50" y1={y} x2="510" y2={y} stroke="#f0f2f7" strokeDasharray="3 3"/>
        ))}
        {[['R$ 48 mi',24],['R$ 32 mi',62],['R$ 16 mi',102],['R$ 0',142]].map(([t,y])=>(
          <text key={t} x="44" y={y} textAnchor="end" fill="#8b93a7" fontSize="9" fontFamily="Geist,sans-serif">{t}</text>
        ))}
        {['Jan','Fev','Mar','Abr','Mai','Jun'].map((m,i)=>(
          <text key={m} x={80 + i*80} y="160" textAnchor="middle" fill="#8b93a7" fontSize="9" fontFamily="Geist,sans-serif">{m}</text>
        ))}
        <path d="M 80 132 L 160 119 L 240 100 L 320 76 L 400 50 L 480 26 L 480 140 L 80 140 Z" fill="url(#gPV)"/>
        <path d="M 80 132 L 160 119 L 240 100 L 320 76 L 400 50 L 480 26" stroke="#185FA5" strokeWidth="2" fill="none"/>
        <path d="M 80 133 L 160 122 L 240 105 L 320 82 L 400 60 L 400 140 L 80 140 Z" fill="url(#gEV)"/>
        <path d="M 80 133 L 160 122 L 240 105 L 320 82 L 400 60" stroke="#3B6D11" strokeWidth="2.5" fill="none"/>
        <path d="M 80 132 L 160 118 L 240 98 L 320 70 L 400 42 L 400 140 L 80 140 Z" fill="url(#gAC)"/>
        <path d="M 80 132 L 160 118 L 240 98 L 320 70 L 400 42" stroke="#A32D2D" strokeWidth="2" fill="none" strokeDasharray="5 3"/>
        <line x1="400" y1="20" x2="400" y2="140" stroke="#BA7517" strokeDasharray="4 2"/>
        <text x="404" y="28" fill="#BA7517" fontSize="9" fontFamily="Geist,sans-serif">Hoje</text>
      </svg>
      <div style={{ display:'flex', gap:14, fontSize:11, color:'#5a6282', marginTop:4, flexWrap:'wrap' }}>
        <span><span style={{ display:'inline-block', width:10, height:2, background:'#185FA5', verticalAlign:'middle', marginRight:5 }}></span>Previsto</span>
        <span><span style={{ display:'inline-block', width:10, height:3, background:'#3B6D11', verticalAlign:'middle', marginRight:5 }}></span>Agregado</span>
        <span><span style={{ display:'inline-block', width:10, borderTop:'2px dashed #A32D2D', verticalAlign:'middle', marginRight:5 }}></span>Realizado</span>
      </div>
    </div>
  );
}

// ── Agent alerts panel ─────────────────────────────────────────
function AgentAlerts({ alerts }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e8f0',
      borderRadius:12, padding:16 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36', marginBottom:12 }}>
        🤖 Alertas dos Agentes IA
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {alerts.map(ev => {
          const c = PRIO_COLOR(ev.prio);
          return (
            <div key={ev.id} style={{
              padding:'10px 12px', borderRadius:8,
              border:`1px solid ${c}33`, background:`${c}08`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:600, color:c,
                  textTransform:'uppercase', letterSpacing:'.06em' }}>
                  {ev.prio} · {ev.agent}
                </span>
                <span style={{ fontSize:10, color:'#a0a8bb', fontFamily:'monospace' }}>
                  {ev.time}
                </span>
              </div>
              <p style={{ fontSize:11, color:'#3a4166', lineHeight:1.5, margin:0 }}>{ev.summary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Projects table ─────────────────────────────────────────────
function ProjectsTable({ projects }) {
  const headers = ['Projeto','Localização','Progresso','CPI','SPI','Previsto','Realizado','Status'];
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e8f0',
      borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #e5e8f0',
        fontSize:13, fontWeight:600, color:'#1a1f36' }}>
        🗂 Projetos em andamento
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#f8f9fc' }}>
              {headers.map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left',
                  fontWeight:600, color:'#8b93a7', whiteSpace:'nowrap',
                  borderBottom:'1px solid #e5e8f0', fontSize:11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} style={{ background: i%2===0 ? '#fff' : '#fafbfd' }}>
                <td style={{ padding:'11px 14px', fontWeight:500, color:'#1a1f36' }}>
                  <div>{p.name}</div>
                  <div style={{ fontSize:10, color:'#a0a8bb', marginTop:2, fontFamily:'monospace' }}>{p.code}</div>
                </td>
                <td style={{ padding:'11px 14px', color:'#5a6282' }}>{p.city}, {p.state}</td>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:70, height:5, background:'#e5e8f0',
                      borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${p.completion_pct}%`, height:'100%',
                        background: p.completion_pct>=75?'#3B6D11':p.completion_pct>=40?'#185FA5':'#A32D2D',
                        borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:500, color:'#3a4166' }}>{p.completion_pct}%</span>
                  </div>
                </td>
                <td style={{ padding:'11px 14px', fontWeight:500,
                  color:(p.cpi??1)<0.9?'#A32D2D':(p.cpi??1)<0.95?'#854F0B':'#3B6D11' }}>
                  {fmtKpi(p.cpi)}
                </td>
                <td style={{ padding:'11px 14px', fontWeight:500,
                  color:(p.spi??1)<0.9?'#A32D2D':(p.spi??1)<0.95?'#854F0B':'#3B6D11' }}>
                  {fmtKpi(p.spi)}
                </td>
                <td style={{ padding:'11px 14px', color:'#5a6282' }}>{fmtBRL(p.budget_planned)}</td>
                <td style={{ padding:'11px 14px',
                  color:p.budget_actual>p.budget_planned?'#A32D2D':'#3B6D11', fontWeight:500 }}>
                  {fmtBRL(p.budget_actual)}
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <span style={{ fontSize:10, fontWeight:600, padding:'3px 9px',
                    borderRadius:20, background:STATUS_COLOR[p.status]+'18',
                    color:STATUS_COLOR[p.status] }}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Build role-keyed KPIs from project list
function kpisForRole(role, projects) {
  const sum = (k) => projects.reduce((a,p)=>a+(p[k]??0),0);
  const avg = (k) => sum(k) / Math.max(projects.length,1);

  if (role==='gestor_financeiro') {
    const totalPlan = sum('budget_planned');
    const totalActual = sum('budget_actual');
    const desvio = totalPlan ? ((totalActual-totalPlan)/totalPlan)*100 : 0;
    const cpiMed = avg('cpi');
    return [
      { icon:'📋', label:'Orçamento previsto', value: fmtBRL(totalPlan), delta:'Base Jan/2026', trend:'neutral' },
      { icon:'💸', label:'Realizado',           value: fmtBRL(totalActual),
        delta: `${desvio>=0?'+':''}${desvio.toFixed(1)}% vs. previsto`,
        trend: desvio>10?'down':desvio>5?'warn':'up' },
      { icon:'📈', label:'CPI portfólio',       value: fmtKpi(cpiMed),
        delta: cpiMed<0.9?'Crítico — abaixo de 0,90':cpiMed<0.95?'Atenção':'Dentro da meta',
        trend: cpiMed<0.9?'down':cpiMed<0.95?'warn':'up' },
      { icon:'🔢', label:'Projetos com desvio', value: String(projects.filter(p=>p.budget_actual>p.budget_planned).length),
        delta:`de ${projects.length} projetos`, trend:'warn' },
    ];
  }
  if (role==='engenheiro_campo') {
    return [
      { icon:'🏗', label:'Projetos no campo',  value: String(projects.filter(p=>p.status==='em_andamento').length), delta:'Frentes ativas', trend:'neutral' },
      { icon:'📋', label:'RDO pendente',        value:'1', delta:'Fechar hoje até 18h', trend:'warn' },
      { icon:'🛡',  label:'Dias sem acidente',  value:'47', delta:'Meta: 365 dias', trend:'up' },
      { icon:'⚠',  label:'NCIs abertas',        value:'2', delta:'1 vence amanhã', trend:'warn' },
    ];
  }
  // default: diretor / coordenador
  const cpiMed = avg('cpi');
  return [
    { icon:'🏢', label:'Projetos ativos', value: String(projects.length),
      delta: `${projects.filter(p=>p.status==='em_andamento').length} em andamento`, trend:'neutral' },
    { icon:'💰', label:'Orçamento total', value: fmtBRL(sum('budget_planned')),
      delta:'Base contratual', trend:'neutral' },
    { icon:'📊', label:'CPI médio',        value: fmtKpi(cpiMed),
      delta: projects.some(p=>(p.cpi??1)<0.9)?'Atenção: projetos abaixo de 0,90':'Dentro da meta',
      trend: projects.some(p=>(p.cpi??1)<0.9)?'warn':'up' },
    { icon:'🌱', label:'ESG médio',        value: fmtKpi(avg('esg_score')),
      delta:'/100 — meta ≥ 70', trend:'up' },
  ];
}

Object.assign(window, { DEMO_PROJECTS, DEMO_ALERTS, KpiGrid, CurvaSCard, AgentAlerts, ProjectsTable, kpisForRole });
