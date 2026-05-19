'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ─── Types ──────────────────────────────────────────────────────
type Module = 'dashboard' | 'clash' | 'permits' | 'docs' | 'workflow' | 'reports' | 'upload'
type ClashItem = { id:string; discipline:string; severity:'Critical'|'Major'|'Minor'; description:string; location:string; status:string }

const CLASH_DATA: ClashItem[] = [
  { id:'CLH-001', discipline:'MEP vs Structural', severity:'Critical', description:'HVAC duct 24"×12" collides with W18×50 beam at grid C-4, elevation +14\'6"', location:'Level 3 · Grid C-4', status:'Open' },
  { id:'CLH-002', discipline:'Plumbing vs Structural', severity:'Critical', description:'4" sanitary drain conflicts with concrete slab penetration at grid A-7', location:'Level 2 · Grid A-7', status:'Open' },
  { id:'CLH-003', discipline:'Electrical vs MEP', severity:'Major', description:'Conduit bank 4×1.5" EMT routing conflicts with mechanical chase at AHU-3', location:'Mechanical Room 102', status:'Under Review' },
  { id:'CLH-004', discipline:'Architectural vs Structural', severity:'Major', description:'Curtain wall anchor bracket conflicts with HSS 6×6 column at north facade', location:'Level 1 · North Facade', status:'Under Review' },
  { id:'CLH-005', discipline:'Fire Protection vs MEP', severity:'Minor', description:'Sprinkler branch line conflicts with supply air duct at corridor 2B', location:'Level 2 · Corridor 2B', status:'Resolved' },
  { id:'CLH-006', discipline:'Plumbing vs Electrical', severity:'Minor', description:'Domestic water riser in proximity to panel EB-2, clearance under NEC 110.26', location:'Electrical Room 1A', status:'Open' },
]

const PERMIT_CHECKLIST = [
  { id:'P1', label:'Site Plan — Civil Survey', status:'Complete', reviewer:'City Planning Dept.' },
  { id:'P2', label:'Architectural Floor Plans (all levels)', status:'Complete', reviewer:'Building Dept.' },
  { id:'P3', label:'Foundation & Structural Plans', status:'In Review', reviewer:'Structural Plan Check' },
  { id:'P4', label:'MEP — Mechanical Plans', status:'In Review', reviewer:'Mechanical Inspector' },
  { id:'P5', label:'MEP — Electrical Plans (E-series)', status:'Pending', reviewer:'Electrical Plan Check' },
  { id:'P6', label:'MEP — Plumbing Plans (P-series)', status:'Pending', reviewer:'Plumbing Inspector' },
  { id:'P7', label:'Energy Compliance (Title 24 / IECC)', status:'Pending', reviewer:'Energy Compliance' },
  { id:'P8', label:'Fire & Life Safety Plans', status:'Not Started', reviewer:'Fire Marshal' },
  { id:'P9', label:'Accessibility Review (ADA / IBC)', status:'Not Started', reviewer:'ADA Coordinator' },
  { id:'P10', label:'Stormwater SWPPP', status:'Not Started', reviewer:'Environmental Dept.' },
]

const WORKFLOW_TASKS = [
  { id:'T1', title:'Revit Model QA/QC — Level 3', assignee:'BIM Coordinator', due:'May 24', priority:'High', status:'In Progress' },
  { id:'T2', title:'Structural Clash Report — Phase 2', assignee:'Structural BIM', due:'May 22', priority:'Critical', status:'Overdue' },
  { id:'T3', title:'Permit Set PDF Export — City Submittal', assignee:'CAD Drafter', due:'May 26', priority:'High', status:'Not Started' },
  { id:'T4', title:'MEP Coordination RFI #47', assignee:'MEP Engineer', due:'May 25', priority:'Medium', status:'In Progress' },
  { id:'T5', title:'Spec Section 03300 — Concrete', assignee:'Estimator', due:'May 28', priority:'Medium', status:'Not Started' },
  { id:'T6', title:'Shop Drawing Review — Steel', assignee:'PM', due:'May 23', priority:'High', status:'Under Review' },
]

const MARKET_ROLES = [
  { role:'BIM Coordinator', rate:'$85–$130/hr', demand:'Very High ↑', icon:'🏗️' },
  { role:'Revit Specialist', rate:'$70–$110/hr', demand:'Very High ↑', icon:'📐' },
  { role:'CAD Drafter', rate:'$45–$75/hr', demand:'High ↑', icon:'📏' },
  { role:'Permit Technician', rate:'$55–$85/hr', demand:'High ↑', icon:'📋' },
  { role:'BIM Modeler', rate:'$65–$100/hr', demand:'Very High ↑', icon:'🏢' },
  { role:'Estimator', rate:'$75–$120/hr', demand:'High ↑', icon:'💰' },
  { role:'Construction Doc Mgr', rate:'$90–$140/hr', demand:'High ↑', icon:'📁' },
  { role:'Residential Designer', rate:'$55–$90/hr', demand:'Medium →', icon:'🏠' },
]

const SEV_COLOR: Record<string,string> = { Critical:'#A32D2D', Major:'#BA7517', Minor:'#3B6D11' }
const SEV_BG: Record<string,string>    = { Critical:'#FCEBEB', Major:'#FFF3E0', Minor:'#EAF3DE' }
const STATUS_COLOR: Record<string,string> = {
  'Complete':'#3B6D11','In Review':'#185FA5','Pending':'#BA7517',
  'Not Started':'#8890a0','Open':'#A32D2D','Resolved':'#3B6D11','Under Review':'#BA7517',
  'In Progress':'#185FA5','Overdue':'#A32D2D','Critical':'#A32D2D',
  'High':'#BA7517','Medium':'#534AB7',
}
const STATUS_BG: Record<string,string> = {
  'Complete':'#EAF3DE','In Review':'#EFF4FF','Pending':'#FFF3E0',
  'Not Started':'#f4f5f7','Open':'#FCEBEB','Resolved':'#EAF3DE','Under Review':'#FFF3E0',
  'In Progress':'#EFF4FF','Overdue':'#FCEBEB','Critical':'#FCEBEB',
  'High':'#FFF3E0','Medium':'#F0EEFF',
}

export default function BimOpsPage() {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<Module>('dashboard')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiContext, setAiContext] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{name:string,size:string}|null>(null)
  const [uploading, setUploading] = useState(false)
  const [reportRunning, setReportRunning] = useState(false)
  const [reportResult, setReportResult] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const criticalClashes = CLASH_DATA.filter(c => c.severity === 'Critical').length
  const openClashes = CLASH_DATA.filter(c => c.status === 'Open').length
  const permitDone = PERMIT_CHECKLIST.filter(p => p.status === 'Complete').length
  const overdueTask = WORKFLOW_TASKS.filter(t => t.status === 'Overdue').length

  async function runAIAnalysis(context: string, prompt: string) {
    setAnalyzing(true); setAiResult(''); setAiContext(context)
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1500,
          system:`You are BIMForge AI — the most advanced AI BIM Operations platform for the US construction market. You specialize in:
- BIM clash detection and resolution (Revit, Navisworks, IFC)
- Permit documentation for US jurisdictions (IBC, ADA, NFPA, Title 24, IECC, local codes)
- Construction documentation (CSI MasterFormat, AIA formats)
- BIM coordination workflows (LOD 300-500, COBie, BCF)
- Quality control and issue tracking
- AI-powered construction reporting
Respond in English. Be technically precise, cite US building codes and standards when relevant.`,
          messages:[{ role:'user', content: prompt }]
        })
      })
      const data = await res.json()
      setAiResult(data?.content?.[0]?.text || 'Analysis complete.')
    } catch { setAiResult('Connection error. Please check API configuration.') }
    setAnalyzing(false)
  }

  async function handleBIMUpload(file: File) {
    setUploading(true)
    await new Promise(r => setTimeout(r, 1500))
    setUploadedFile({ name: file.name, size: `${(file.size/1048576).toFixed(1)} MB` })
    setUploading(false)
    setActiveModule('clash')
    runAIAnalysis('BIM Upload Analysis',
      `A BIM file was uploaded: "${file.name}" (${(file.size/1048576).toFixed(1)} MB).
Simulate a comprehensive BIM model analysis for a US commercial construction project. Provide:
1. Model Health Score (0-100) with breakdown by discipline
2. Clash Detection Summary — estimated clashes by discipline pair
3. LOD Assessment — current Level of Development vs. required
4. IFC Export Readiness
5. COBie Data Completeness
6. Revit Model Warnings estimate
7. Recommended immediate actions before permit submission
Be specific and technical.`)
  }

  async function generatePermitReport() {
    setReportRunning(true); setReportResult('')
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1200,
          system:`You are BIMForge AI — US permit documentation specialist. Generate precise, professional permit submission reports citing IBC, ADA, NFPA, and local codes.`,
          messages:[{ role:'user', content:`Generate an AI Permit Readiness Report for a commercial project:
- ${permitDone}/${PERMIT_CHECKLIST.length} checklist items complete
- ${PERMIT_CHECKLIST.filter(p=>p.status==='In Review').length} items in review
- ${PERMIT_CHECKLIST.filter(p=>p.status==='Pending').length} items pending
- ${PERMIT_CHECKLIST.filter(p=>p.status==='Not Started').length} items not started

Provide: 1) Overall permit readiness score (0-100%); 2) Critical path items blocking submission; 3) Estimated review timeline by department; 4) Common AHJ (Authority Having Jurisdiction) comments to anticipate; 5) Recommended submission strategy.` }]
        })
      })
      const data = await res.json()
      setReportResult(data?.content?.[0]?.text || '')
    } catch { setReportResult('Error generating report.') }
    setReportRunning(false)
  }

  const s = {
    page:   { minHeight:'100vh', background:'#0d1117', fontFamily:"'Geist',system-ui,sans-serif", display:'flex', flexDirection:'column' as const },
    topbar: { background:'#161b22', borderBottom:'1px solid #30363d', padding:'0 24px', height:56,
      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
    sidebar:{ width:220, background:'#161b22', borderRight:'1px solid #30363d', display:'flex',
      flexDirection:'column' as const, padding:'16px 0', flexShrink:0 },
    content:{ flex:1, overflowY:'auto' as const, padding:'24px' },
    card:   { background:'#161b22', border:'1px solid #30363d', borderRadius:12, padding:'18px 20px', marginBottom:14 },
    cardBlue:{ background:'#0d2137', border:'1px solid #185FA5', borderRadius:12, padding:'18px 20px', marginBottom:14 },
    secTit: { fontSize:11, fontWeight:700, color:'#8b93a7', textTransform:'uppercase' as const,
      letterSpacing:'.1em', marginBottom:14 },
    kpi:    { background:'#0d1117', border:'1px solid #30363d', borderRadius:10, padding:'14px 16px' },
    kpiV:   { fontSize:24, fontWeight:700, fontFamily:'monospace', marginBottom:3 },
    kpiL:   { fontSize:10, color:'#8b93a7', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.06em' },
    badge:  (status: string) => ({ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
      background: STATUS_BG[status]||'#f4f5f7', color:STATUS_COLOR[status]||'#8890a0' }),
    navItem:(active:boolean) => ({ display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
      cursor:'pointer', fontSize:13, fontWeight:500, transition:'all .15s', borderRadius:0,
      background: active ? '#185FA520' : 'transparent',
      color: active ? '#58a6ff' : '#8b93a7',
      borderLeft: active ? '2px solid #185FA5' : '2px solid transparent' }),
    btn:    { padding:'9px 20px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
    btnGhost:{ padding:'7px 14px', background:'transparent', color:'#58a6ff', border:'1px solid #30363d',
      borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
    input:  { padding:'9px 12px', background:'#0d1117', border:'1px solid #30363d', borderRadius:8,
      fontSize:13, color:'#e6edf3', outline:'none', fontFamily:'inherit', width:'100%' },
    pre:    { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'14px 16px',
      fontSize:11, lineHeight:1.8, color:'#e6edf3', whiteSpace:'pre-wrap' as const, fontFamily:'monospace',
      maxHeight:400, overflowY:'auto' as const },
  }

  const NAV = [
    { id:'dashboard', icon:'📊', label:'Executive Dashboard' },
    { id:'upload',    icon:'⬆️', label:'BIM Upload' },
    { id:'clash',     icon:'⚡', label:'Clash Detection' },
    { id:'permits',   icon:'📋', label:'Permit Documentation' },
    { id:'docs',      icon:'📁', label:'Construction Docs' },
    { id:'workflow',  icon:'🔄', label:'AI Workflow' },
    { id:'reports',   icon:'📈', label:'AI Reports' },
  ]

  return (
    <>
      <Head><title>BIMForge AI — US Construction Intelligence Platform</title></Head>
      <div style={s.page}>

        {/* Topbar */}
        <div style={s.topbar}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => router.back()}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#8b93a7', fontSize:18 }}>←</button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#185FA5,#534AB7)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚡</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e6edf3' }}>BIMForge AI</div>
                <div style={{ fontSize:10, color:'#8b93a7' }}>AI BIM Operations Platform · US Market</div>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'#185FA520',
              color:'#58a6ff', fontWeight:600, border:'1px solid #185FA5' }}>CORE NUCLEUS · v1.0</div>
            <div style={{ fontSize:10, color:'#8b93a7' }}>Claude AI · claude-sonnet-4-6</div>
          </div>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={{ padding:'0 16px 12px', fontSize:10, color:'#8b93a7', fontWeight:700,
              textTransform:'uppercase' as const, letterSpacing:'.1em' }}>Core Nucleus</div>
            {NAV.map(n => (
              <div key={n.id} style={s.navItem(activeModule===n.id)}
                onClick={() => { setActiveModule(n.id as Module); setAiResult('') }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
            <div style={{ marginTop:'auto', padding:'16px', borderTop:'1px solid #30363d' }}>
              <div style={{ fontSize:10, color:'#8b93a7', marginBottom:8, fontWeight:700,
                textTransform:'uppercase' as const, letterSpacing:'.08em' }}>Advanced Nucleus</div>
              {['ESG Advanced','IoT Full','Digital Twin','RL Optimization','Monte Carlo'].map(f => (
                <div key={f} style={{ fontSize:11, color:'#8b93a7', padding:'4px 0',
                  display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'#30363d' }}>🔒</span> {f}
                </div>
              ))}
              <div style={{ marginTop:8, fontSize:10, padding:'5px 10px', borderRadius:6,
                background:'#30363d', color:'#8b93a7', textAlign:'center' as const }}>Coming Q3 2026</div>
            </div>
          </div>

          {/* Main Content */}
          <div style={s.content}>

            {/* ── DASHBOARD ── */}
            {activeModule === 'dashboard' && (
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>
                    Executive Dashboard
                  </div>
                  <div style={{ fontSize:12, color:'#8b93a7' }}>
                    AI-powered overview · Commercial Project · San Francisco, CA
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                  {[
                    { v:String(openClashes), l:'Open Clashes', c:'#A32D2D', icon:'⚡' },
                    { v:`${criticalClashes}`, l:'Critical Issues', c:'#BA7517', icon:'🔴' },
                    { v:`${permitDone}/${PERMIT_CHECKLIST.length}`, l:'Permit Items Done', c:'#3B6D11', icon:'📋' },
                    { v:`${overdueTask}`, l:'Overdue Tasks', c:'#A32D2D', icon:'⏰' },
                  ].map(k => (
                    <div key={k.l} style={s.kpi}>
                      <div style={{ fontSize:13, marginBottom:4 }}>{k.icon}</div>
                      <div style={{ ...s.kpiV, color:k.c }}>{k.v}</div>
                      <div style={s.kpiL}>{k.l}</div>
                    </div>
                  ))}
                </div>

                {/* Market Roles */}
                <div style={s.card}>
                  <div style={s.secTit}>🇺🇸 US Market Demand — Key Roles</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {MARKET_ROLES.map(r => (
                      <div key={r.role} style={{ background:'#0d1117', border:'1px solid #30363d',
                        borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:16, marginBottom:4 }}>{r.icon}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{r.role}</div>
                        <div style={{ fontSize:11, color:'#3B6D11', fontWeight:700, marginBottom:2 }}>{r.rate}</div>
                        <div style={{ fontSize:9, color: r.demand.includes('Very') ? '#58a6ff' : r.demand.includes('High') ? '#3B6D11' : '#BA7517',
                          fontWeight:600 }}>{r.demand}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Intelligence */}
                <div style={s.cardBlue}>
                  <div style={s.secTit}>🤖 BIMForge AI Intelligence</div>
                  {!aiResult && !analyzing && (
                    <div style={{ textAlign:'center' as const, padding:'20px 0' }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>⚡</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#e6edf3', marginBottom:8 }}>
                        Run AI Project Intelligence
                      </div>
                      <div style={{ fontSize:12, color:'#8b93a7', marginBottom:20, maxWidth:420, margin:'0 auto 20px' }}>
                        BIMForge AI analyzes your entire project — clashes, permits, schedule, cost, and compliance risks — in seconds.
                      </div>
                      <button style={s.btn} onClick={() => runAIAnalysis('dashboard',
                        `Perform a comprehensive AI project intelligence analysis for a US commercial construction project in San Francisco, CA:
- ${openClashes} open BIM clashes (${criticalClashes} critical)
- Permit progress: ${permitDone}/${PERMIT_CHECKLIST.length} items complete
- ${overdueTask} overdue workflow tasks
- Budget: $12.4M | Schedule: 18 months | Phase: Construction Documents (50% CD)

Provide executive-level analysis with: 1) Overall Project Health Score (0-100); 2) Top 3 risks requiring immediate action; 3) Permit timeline forecast; 4) Clash resolution priority matrix; 5) Budget risk assessment; 6) Next 30-day action plan. Reference IBC 2021, ADA, NFPA 72 where applicable.`)}>
                        ▶ Run AI Analysis
                      </button>
                    </div>
                  )}
                  {analyzing && aiContext === 'dashboard' && (
                    <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', padding:'30px 0', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #185FA5',
                        borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      <div style={{ fontSize:13, color:'#58a6ff' }}>BIMForge AI analyzing project...</div>
                    </div>
                  )}
                  {aiResult && aiContext === 'dashboard' && (
                    <div style={s.pre}>{aiResult}</div>
                  )}
                </div>
              </>
            )}

            {/* ── BIM UPLOAD ── */}
            {activeModule === 'upload' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>
                  ⬆️ BIM Upload & Analysis
                </div>
                <div style={s.card}>
                  <div style={s.secTit}>Upload BIM / CAD Files</div>
                  <div style={{ border:'2px dashed #30363d', borderRadius:12, padding:'40px 24px',
                    textAlign:'center' as const, cursor:'pointer', transition:'all .2s',
                    background: uploading ? '#0d2137' : '#0d1117' }}
                    onClick={() => fileRef.current?.click()}>
                    <div style={{ fontSize:48, marginBottom:12 }}>
                      {uploading ? '⏳' : uploadedFile ? '✅' : '📤'}
                    </div>
                    <div style={{ fontSize:16, fontWeight:600, color:'#e6edf3', marginBottom:8 }}>
                      {uploading ? 'Processing BIM file...'
                        : uploadedFile ? `✅ ${uploadedFile.name} uploaded`
                        : 'Drop BIM / CAD file here or click to select'}
                    </div>
                    <div style={{ fontSize:12, color:'#8b93a7', marginBottom:14 }}>
                      Revit (.rvt) · IFC · NWD/NWC · DWG · DXF · FBX · OBJ
                    </div>
                    <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' as const }}>
                      {['Revit','IFC','Navisworks','AutoCAD','Rhino','SketchUp'].map(f => (
                        <span key={f} style={{ fontSize:10, padding:'3px 10px', borderRadius:20,
                          background:'#185FA520', color:'#58a6ff', fontWeight:600, border:'1px solid #185FA540' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                    <input ref={fileRef} type="file" style={{ display:'none' }}
                      accept=".rvt,.ifc,.nwd,.nwc,.dwg,.dxf,.fbx,.obj,.stl,.step"
                      onChange={e => { const f = e.target.files?.[0]; if(f) handleBIMUpload(f) }} />
                  </div>

                  {uploadedFile && !uploading && (
                    <div style={{ marginTop:12, padding:'12px 16px', background:'#0d2137',
                      border:'1px solid #185FA5', borderRadius:8, display:'flex',
                      alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#58a6ff' }}>{uploadedFile.name}</div>
                        <div style={{ fontSize:11, color:'#8b93a7' }}>{uploadedFile.size} · AI analysis running →</div>
                      </div>
                      <button style={s.btn} onClick={() => setActiveModule('clash')}>View Analysis →</button>
                    </div>
                  )}
                </div>

                {/* BIM Intelligence explainer */}
                <div style={s.card}>
                  <div style={s.secTit}>What BIMForge AI Analyzes</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { icon:'⚡', title:'Clash Detection', desc:'Automated hard, soft and workflow clash detection across all disciplines (Arch, Struct, MEP)' },
                      { icon:'📐', title:'LOD Validation', desc:'Validates Level of Development 200–500 compliance per AIA E203 and BIM execution plan' },
                      { icon:'📋', title:'Permit Readiness', desc:'Checks completeness against IBC, ADA, local amendments for AHJ submission' },
                      { icon:'🔗', title:'COBie Export', desc:'Auto-generates Construction Operations Building information exchange for owner handover' },
                      { icon:'📊', title:'4D Schedule Link', desc:'Links BIM elements to CPM schedule for 4D simulation and milestone tracking' },
                      { icon:'💰', title:'5D Cost Link', desc:'Connects model quantities to estimating for real-time budget tracking' },
                    ].map(f => (
                      <div key={f.title} style={{ display:'flex', gap:12, padding:'12px',
                        background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{f.title}</div>
                          <div style={{ fontSize:11, color:'#8b93a7', lineHeight:1.4 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiResult && aiContext === 'BIM Upload Analysis' && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Model Analysis Result</div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── CLASH DETECTION ── */}
            {activeModule === 'clash' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:2 }}>⚡ Clash Detection</div>
                    <div style={{ fontSize:12, color:'#8b93a7' }}>{CLASH_DATA.length} clashes detected · AI-powered resolution guidance</div>
                  </div>
                  <button style={s.btn} onClick={() => runAIAnalysis('clash',
                    `Analyze these BIM clashes for a US commercial project and provide: 1) Priority resolution matrix ranked by impact and cost-to-fix; 2) Specific RFI language for each critical clash; 3) Coordination meeting agenda; 4) Estimated resolution cost per clash; 5) BCF issue markup recommendations. Clashes: ${CLASH_DATA.map(c=>`${c.id}: ${c.severity} — ${c.description} at ${c.location}`).join('; ')}`)}>
                    🤖 AI Clash Analysis
                  </button>
                </div>

                {/* Clash summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                  {(['Critical','Major','Minor'] as const).map(sev => {
                    const cnt = CLASH_DATA.filter(c=>c.severity===sev).length
                    return (
                      <div key={sev} style={{ ...s.kpi, borderLeft:`3px solid ${SEV_COLOR[sev]}` }}>
                        <div style={{ ...s.kpiV, color:SEV_COLOR[sev] }}>{cnt}</div>
                        <div style={s.kpiL}>{sev} Clashes</div>
                      </div>
                    )
                  })}
                </div>

                {/* Clash list */}
                <div style={s.card}>
                  <div style={s.secTit}>Clash Report</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {CLASH_DATA.map(cl => (
                      <div key={cl.id} style={{ background:'#0d1117', border:`1px solid ${SEV_COLOR[cl.severity]}33`,
                        borderLeft:`3px solid ${SEV_COLOR[cl.severity]}`, borderRadius:8, padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:10, fontFamily:'monospace', color:'#8b93a7' }}>{cl.id}</span>
                            <span style={s.badge(cl.severity)}>{cl.severity}</span>
                            <span style={{ fontSize:10, fontWeight:600, color:'#58a6ff' }}>{cl.discipline}</span>
                          </div>
                          <span style={s.badge(cl.status)}>{cl.status}</span>
                        </div>
                        <div style={{ fontSize:12, color:'#e6edf3', marginBottom:4, lineHeight:1.5 }}>{cl.description}</div>
                        <div style={{ fontSize:11, color:'#8b93a7' }}>📍 {cl.location}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {analyzing && aiContext === 'clash' && (
                  <div style={{ ...s.card, textAlign:'center' as const, padding:'30px' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #185FA5',
                      borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                    <div style={{ fontSize:13, color:'#58a6ff' }}>AI analyzing clash report...</div>
                  </div>
                )}
                {aiResult && aiContext === 'clash' && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Clash Analysis & Resolution</div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── PERMITS ── */}
            {activeModule === 'permits' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:2 }}>📋 Permit Documentation</div>
                    <div style={{ fontSize:12, color:'#8b93a7' }}>AHJ Submission Tracker · San Francisco Building Dept.</div>
                  </div>
                  <button style={s.btn} onClick={generatePermitReport} disabled={reportRunning}>
                    {reportRunning ? '⏳ Generating...' : '🤖 AI Permit Report'}
                  </button>
                </div>

                {/* Progress bar */}
                <div style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, color:'#e6edf3' }}>
                    <span style={{ fontWeight:600 }}>Overall Permit Readiness</span>
                    <span style={{ color:'#3B6D11', fontWeight:700 }}>{Math.round((permitDone/PERMIT_CHECKLIST.length)*100)}%</span>
                  </div>
                  <div style={{ height:8, background:'#30363d', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
                    <div style={{ width:`${(permitDone/PERMIT_CHECKLIST.length)*100}%`, height:'100%',
                      background:'linear-gradient(90deg,#3B6D11,#97C459)', borderRadius:4, transition:'width .5s' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[
                      { l:'Complete', v:permitDone, c:'#3B6D11' },
                      { l:'In Review', v:PERMIT_CHECKLIST.filter(p=>p.status==='In Review').length, c:'#185FA5' },
                      { l:'Pending', v:PERMIT_CHECKLIST.filter(p=>p.status==='Pending').length, c:'#BA7517' },
                      { l:'Not Started', v:PERMIT_CHECKLIST.filter(p=>p.status==='Not Started').length, c:'#8890a0' },
                    ].map(k => (
                      <div key={k.l} style={{ textAlign:'center' as const, padding:'8px',
                        background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ fontSize:20, fontWeight:700, color:k.c }}>{k.v}</div>
                        <div style={{ fontSize:9, color:'#8b93a7', fontWeight:600 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div style={s.card}>
                  <div style={s.secTit}>Permit Submittal Checklist</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                    {PERMIT_CHECKLIST.map(p => (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12,
                        padding:'10px 12px', background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                          background: p.status==='Complete'?'#3B6D11':p.status==='In Review'?'#185FA5':'#30363d',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>
                          {p.status==='Complete'?'✓':p.status==='In Review'?'→':''}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:'#e6edf3' }}>{p.label}</div>
                          <div style={{ fontSize:10, color:'#8b93a7', marginTop:2 }}>{p.reviewer}</div>
                        </div>
                        <span style={s.badge(p.status)}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reportResult && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Permit Readiness Report</div>
                    <div style={s.pre}>{reportResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── CONSTRUCTION DOCS ── */}
            {activeModule === 'docs' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>📁 Construction Documentation</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    { title:'Specifications (CSI MasterFormat)', items:['Division 00 — Procurement','Division 01 — General Requirements','Division 03 — Concrete','Division 05 — Metals','Division 07 — Thermal & Moisture','Division 09 — Finishes','Division 22 — Plumbing','Division 26 — Electrical'] },
                    { title:'Drawing Sets', items:['A-Series: Architectural (A0.1–A8.5)','S-Series: Structural (S0.1–S6.2)','M-Series: Mechanical (M0.1–M5.3)','P-Series: Plumbing (P0.1–P3.1)','E-Series: Electrical (E0.1–E5.2)','C-Series: Civil / Site (C0.1–C3.4)','FP-Series: Fire Protection (FP1–FP3)','L-Series: Landscape (L0.1–L2.2)'] },
                  ].map(sec => (
                    <div key={sec.title} style={s.card}>
                      <div style={s.secTit}>{sec.title}</div>
                      {sec.items.map(item => (
                        <div key={item} style={{ display:'flex', alignItems:'center', gap:8,
                          padding:'7px 0', borderBottom:'1px solid #30363d', fontSize:12, color:'#e6edf3' }}>
                          <span style={{ color:'#3B6D11', fontWeight:700 }}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <div style={s.secTit}>🤖 AI Documentation Assistant</div>
                  <button style={s.btn} onClick={() => runAIAnalysis('docs',
                    `Generate a Construction Documentation QA checklist for a US commercial project in San Francisco. Include: 1) Sheet completeness check (all series A/S/M/P/E/C/FP); 2) CSI MasterFormat spec sections required for IBC 2021 compliance; 3) ADA accessibility documentation requirements; 4) Energy compliance (Title 24) documentation; 5) Common AHJ comment categories and how to pre-empt them; 6) Coordination between drawings and specs — 10 most common conflicts. Reference actual IBC, ADA, SFBC local amendments.`)}>
                    🤖 Generate Documentation QA Report
                  </button>
                  {analyzing && aiContext === 'docs' && (
                    <div style={{ textAlign:'center' as const, padding:'20px 0', color:'#58a6ff', fontSize:13 }}>
                      ⏳ AI generating documentation report...
                    </div>
                  )}
                  {aiResult && aiContext === 'docs' && (
                    <div style={{ ...s.pre, marginTop:14 }}>{aiResult}</div>
                  )}
                </div>
              </>
            )}

            {/* ── WORKFLOW ── */}
            {activeModule === 'workflow' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3' }}>🔄 AI Workflow Automation</div>
                  <button style={s.btn} onClick={() => runAIAnalysis('workflow',
                    `Analyze this construction workflow and provide AI automation recommendations: Tasks: ${WORKFLOW_TASKS.map(t=>`${t.id}: ${t.title} (${t.status}, priority: ${t.priority}, due: ${t.due}, assignee: ${t.assignee})`).join('; ')}. Provide: 1) Critical path analysis; 2) Resource reallocation recommendations; 3) Automated notification triggers; 4) Risk-adjusted schedule; 5) 3-day sprint plan to clear backlog. Reference industry standard BIM execution plan practices.`)}>
                    🤖 AI Workflow Optimizer
                  </button>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { l:'Total Tasks', v:WORKFLOW_TASKS.length, c:'#58a6ff' },
                    { l:'In Progress', v:WORKFLOW_TASKS.filter(t=>t.status==='In Progress').length, c:'#185FA5' },
                    { l:'Overdue', v:overdueTask, c:'#A32D2D' },
                    { l:'Under Review', v:WORKFLOW_TASKS.filter(t=>t.status==='Under Review').length, c:'#BA7517' },
                  ].map(k => (
                    <div key={k.l} style={s.kpi}>
                      <div style={{ ...s.kpiV, color:k.c }}>{k.v}</div>
                      <div style={s.kpiL}>{k.l}</div>
                    </div>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={s.secTit}>Active Tasks</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {WORKFLOW_TASKS.map(t => (
                      <div key={t.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto',
                        alignItems:'center', gap:12, padding:'12px 14px', background:'#0d1117',
                        borderRadius:8, border:`1px solid ${STATUS_COLOR[t.status]||'#30363d'}33`,
                        borderLeft:`3px solid ${STATUS_COLOR[t.priority]||STATUS_COLOR[t.status]||'#30363d'}` }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{t.title}</div>
                          <div style={{ fontSize:11, color:'#8b93a7' }}>👤 {t.assignee}</div>
                        </div>
                        <div style={{ fontSize:11, color:'#8b93a7', whiteSpace:'nowrap' as const }}>📅 {t.due}</div>
                        <span style={s.badge(t.priority)}>{t.priority}</span>
                        <span style={s.badge(t.status)}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {analyzing && aiContext === 'workflow' && (
                  <div style={{ ...s.card, textAlign:'center' as const, padding:'24px' }}>
                    <div style={{ fontSize:13, color:'#58a6ff' }}>⏳ AI optimizing workflow...</div>
                  </div>
                )}
                {aiResult && aiContext === 'workflow' && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Workflow Optimization</div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── REPORTS ── */}
            {activeModule === 'reports' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>📈 AI Reports</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  {[
                    { icon:'⚡', title:'Clash Detection Report', desc:'Full clash matrix with resolution priority, BCF markup, and coordination meeting agenda.', ctx:'clash_report', prompt:'Generate a complete Clash Detection Report for a US commercial project. Include: executive summary, clash matrix by discipline pair, BCF issue markup recommendations, coordination meeting agenda, resolution timeline, and cost impact estimate. Format professionally for owner/GC distribution.' },
                    { icon:'📋', title:'Permit Readiness Report', desc:'AHJ submission checklist with IBC compliance verification and timeline forecast.', ctx:'permit_report', prompt:'Generate a Permit Readiness Report for an SF commercial project. Include: overall readiness score, critical path to submission, anticipated AHJ comments, code compliance summary (IBC 2021, SFBC, ADA, Title 24), and recommended submission strategy.' },
                    { icon:'🏗️', title:'BIM Execution Plan', desc:'Project-specific BEP per AIA E203 and AGC BIM Forum standards.', ctx:'bep', prompt:'Generate a BIM Execution Plan (BEP) outline per AIA E203 and AGC BIM Forum LOD Specification. Include: project information, BIM uses, model management protocol, file naming convention, coordinate system, LOD matrix by discipline, clash detection protocol, and owner deliverable schedule.' },
                    { icon:'📊', title:'Weekly Construction Report', desc:'AI-generated progress report for owner, GC, and PM distribution.', ctx:'weekly', prompt:'Generate a professional Weekly Construction Progress Report for a US commercial project. Include: this week\'s accomplishments, next week\'s planned work, schedule status (ahead/behind), budget status, open RFIs and submittals, safety report (0 incidents), weather impacts, and executive summary. Format for owner distribution.' },
                  ].map(r => (
                    <div key={r.title} style={{ ...s.card, cursor:'pointer' }}
                      onClick={() => { if(!analyzing) runAIAnalysis(r.ctx, r.prompt) }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>{r.icon}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>{r.title}</div>
                      <div style={{ fontSize:11, color:'#8b93a7', lineHeight:1.5, marginBottom:12 }}>{r.desc}</div>
                      <button style={s.btnGhost}>
                        {analyzing && aiContext === r.ctx ? '⏳ Generating...' : '▶ Generate with AI'}
                      </button>
                    </div>
                  ))}
                </div>

                {aiResult && ['clash_report','permit_report','bep','weekly'].includes(aiContext) && (
                  <div style={s.card}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={s.secTit}>🤖 Generated Report</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button style={s.btnGhost} onClick={() => {
                          const w = window.open('','_blank','width=900,height=700')
                          if(!w) return
                          w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BIMForge AI Report</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;font-size:12px;line-height:1.7}
h1{color:#185FA5}pre{white-space:pre-wrap;font-family:inherit}
.footer{margin-top:32px;border-top:1px solid #e5e8f0;padding-top:12px;font-size:10px;color:#8b93a7}
@media print{@page{margin:1cm}}</style>
</head><body><h1>⚡ BIMForge AI — Report</h1><pre>${aiResult}</pre>
<div class="footer">BIMForge AI · AI BIM Operations Platform · ${new Date().toLocaleString('en-US')}</div>
<script>window.onload=()=>window.print()</script></body></html>`)
                          w.document.close()
                        }}>🖨️ Print</button>
                      </div>
                    </div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
