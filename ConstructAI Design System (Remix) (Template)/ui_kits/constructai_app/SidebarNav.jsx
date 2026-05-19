/* global React */
// SidebarNav.jsx — fixed 220px white sidebar with role-aware nav

const ROLE_INFO = {
  diretor_executivo:   { label:'Diretor Executivo',     icon:'👑', accent:'#534AB7' },
  gestor_financeiro:   { label:'Gestor Financeiro',     icon:'💲', accent:'#3B6D11' },
  coordenador_projetos:{ label:'Coordenador Projetos',  icon:'📅', accent:'#185FA5' },
  engenheiro_campo:    { label:'Engenheiro de Campo',   icon:'🦺', accent:'#BA7517' },
  gestor_qualidade:    { label:'Gestor de Qualidade',   icon:'🔍', accent:'#A32D2D' },
  investidor:          { label:'Investidor / Sócio',    icon:'📈', accent:'#854F0B' },
};

const ROLE_NAV = {
  diretor_executivo:   [
    {label:'Dashboard'}, {label:'Portfólio'}, {label:'Exec. Intelligence'}, {label:'Investimentos'}, {label:'ESG Score'},
  ],
  gestor_financeiro:   [
    {label:'Dashboard'}, {label:'Curva S / EVM'}, {label:'SINAPI Realtime'}, {label:'Contratos'}, {label:'ROI / TIR'},
  ],
  coordenador_projetos:[
    {label:'Dashboard'}, {label:'Cronograma'}, {label:'Documentos'}, {label:'BIM / Clash', badge:'!'}, {label:'Qualidade'},
  ],
  engenheiro_campo:    [
    {label:'Dashboard'}, {label:'RDO', badge:'1'}, {label:'Ocorrências'}, {label:'Checklist NR'}, {label:'Não conformidades'},
  ],
  gestor_qualidade:    [
    {label:'Dashboard'}, {label:'NCIs abertas', badge:'8'}, {label:'Checklists'}, {label:'NBR 15575'}, {label:'Histórico retrabalho'},
  ],
  investidor:          [
    {label:'Dashboard'}, {label:'ROI / TIR'}, {label:'NOI / Cap Rate'}, {label:'ESG Score'}, {label:'Pitch Deck'},
  ],
};

function SidebarNav({ role, fullName, active, onChangeActive, onLogout }) {
  const info = ROLE_INFO[role];
  const nav = ROLE_NAV[role];
  const initials = (fullName || '?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  return (
    <aside style={{
      width:220, minWidth:220, background:'#fff',
      borderRight:'1px solid #e5e8f0', display:'flex',
      flexDirection:'column', overflow:'hidden',
    }}>
      <div style={{ padding:'18px 16px', borderBottom:'1px solid #e5e8f0',
        display:'flex', alignItems:'center', gap:10 }}>
        <BrandMark size={32} tone="blue"/>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36' }}>ConstructAI</div>
          <div style={{ fontSize:9, color:'#8b93a7', letterSpacing:'.06em', fontFamily:'monospace' }}>
            v5.3 ENTERPRISE
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        <div style={{ fontSize:9, color:'#a0a8bb', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 8px 4px' }}>
          Principal
        </div>
        {nav.map((item, i) => (
          <button key={i} onClick={() => onChangeActive(i)} style={{
            display:'flex', alignItems:'center', gap:8, width:'100%',
            padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:13, fontWeight: i===active ? 500 : 400,
            background: i===active ? '#EFF4FF' : 'transparent',
            color: i===active ? '#185FA5' : '#5a6282',
            marginBottom:2, justifyContent:'space-between',
          }}>
            <span>{item.label}</span>
            {item.badge && (
              <span style={{ background:'#FCEBEB', color:'#A32D2D',
                fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:10 }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div style={{ height:10 }} />
        <div style={{ fontSize:9, color:'#a0a8bb', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 8px 4px' }}>
          Apps
        </div>
        <a href="#" style={{ display:'flex', gap:8, padding:'8px 10px',
          color:'#3B6D11', fontSize:13, textDecoration:'none' }}>🎨 ArchVis Pro</a>
        <a href="#" style={{ display:'flex', gap:8, padding:'8px 10px',
          color:'#534AB7', fontSize:13, textDecoration:'none' }}>🎬 Director Cut</a>
        <a href="#" style={{ display:'flex', gap:8, padding:'8px 10px',
          color:'#534AB7', fontSize:13, textDecoration:'none' }}>⚖️ Jurídico</a>
      </nav>

      <div style={{ padding:12, borderTop:'1px solid #e5e8f0',
        display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%',
          background: info.accent + '22', color: info.accent,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:12, fontWeight:700, flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#1a1f36',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {fullName}
          </div>
          <div style={{ fontSize:10, color:'#8b93a7' }}>{info.icon} {info.label}</div>
        </div>
        <button onClick={onLogout} title="Sair" style={{
          background:'none', border:'none', cursor:'pointer',
          color:'#a0a8bb', fontSize:16, padding:4 }}>↩</button>
      </div>
    </aside>
  );
}

window.SidebarNav = SidebarNav;
window.ROLE_INFO = ROLE_INFO;
