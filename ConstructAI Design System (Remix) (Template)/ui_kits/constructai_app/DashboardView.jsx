/* global React, SidebarNav, ROLE_INFO, KpiGrid, CurvaSCard, AgentAlerts, ProjectsTable,
   DEMO_PROJECTS, DEMO_ALERTS, kpisForRole, HelpButton */
// DashboardView.jsx — full dashboard, role-switchable

function DashboardView({ profile, onLogout, onChangeRole }) {
  const [active, setActive] = React.useState(0);
  const info = ROLE_INFO[profile.role];
  const kpis = kpisForRole(profile.role, DEMO_PROJECTS);

  const showCurvaS = profile.role === 'diretor_executivo' || profile.role === 'gestor_financeiro' || profile.role === 'investidor';
  const showAlerts = profile.role === 'diretor_executivo' || profile.role === 'coordenador_projetos' || profile.role === 'gestor_qualidade';

  return (
    <React.Fragment>
      <style>{`
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#d0d5e0;border-radius:2px}
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden',
        background:'#f4f5f7', fontFamily:"'Geist',sans-serif" }}>

        <SidebarNav role={profile.role} fullName={profile.full_name}
          active={active} onChangeActive={setActive} onLogout={onLogout}/>

        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ background:'#fff', borderBottom:'1px solid #e5e8f0',
            padding:'12px 24px', display:'flex',
            alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <h1 style={{ fontSize:16, fontWeight:600, color:'#1a1f36', margin:0 }}>
                Dashboard — {info.label}
              </h1>
              <p style={{ fontSize:12, color:'#8b93a7', margin:'2px 0 0' }}>
                {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · {DEMO_PROJECTS.length} projetos
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <select value={profile.role}
                onChange={e => onChangeRole(e.target.value)}
                title="Trocar role (demo)"
                style={{ padding:'7px 12px', border:'1px solid #e5e8f0',
                  borderRadius:8, fontSize:12, background:'#f8f9fc',
                  color:'#1a1f36', cursor:'pointer', fontFamily:'inherit' }}>
                <option value="diretor_executivo">👑 Diretor Executivo</option>
                <option value="gestor_financeiro">💲 Gestor Financeiro</option>
                <option value="coordenador_projetos">📅 Coordenador</option>
                <option value="engenheiro_campo">🦺 Engenheiro Campo</option>
                <option value="gestor_qualidade">🔍 Gestor Qualidade</option>
                <option value="investidor">📈 Investidor</option>
              </select>
              <button style={{ display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', border:'1px solid #e5e8f0', borderRadius:8,
                background:'#fff', fontSize:12, fontWeight:500, color:'#5a6282',
                cursor:'pointer', fontFamily:'inherit' }}>🔄 Atualizar</button>
              <button style={{ display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', border:'none', borderRadius:8,
                background:'#185FA5', fontSize:12, fontWeight:600,
                color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>+ Novo projeto</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px',
            display:'flex', flexDirection:'column', gap:16 }}>

            <KpiGrid kpis={kpis}/>

            {(showCurvaS || showAlerts) && (
              <div style={{ display:'grid',
                gridTemplateColumns: showCurvaS && showAlerts ? '1.6fr 1fr'
                  : '1fr', gap:12 }}>
                {showCurvaS && <CurvaSCard/>}
                {showAlerts && <AgentAlerts alerts={DEMO_ALERTS}/>}
              </div>
            )}

            <ProjectsTable projects={DEMO_PROJECTS}/>
          </div>
        </main>
      </div>

      <HelpButton/>
    </React.Fragment>
  );
}

window.DashboardView = DashboardView;
