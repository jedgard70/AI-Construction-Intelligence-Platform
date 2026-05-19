/* global React */
// LoginView.jsx — recreation of components/LoginClient.js

const FEATURES = [
  { icon: '🏢', label: 'BIM Intelligence', desc: 'Clash detection · 3D/4D/5D/6D/7D' },
  { icon: '📊', label: 'EVM Analytics',    desc: 'CPI, SPI, EAC, VAC, TCPI em tempo real' },
  { icon: '🛡',  label: 'Conformidade NR',  desc: 'NR-6, NR-10, NR-18, NR-33, NR-35' },
  { icon: '🤖', label: 'Multi-Agent AI',   desc: '8 especialistas cognitivos simultâneos' },
];

const loginStyles = {
  page:    { minHeight:'100vh', display:'flex', background:'#0a0d12', fontFamily:"'Sora',sans-serif" },
  left:    { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'64px',
             background:'linear-gradient(160deg,#0a0d12 0%,#111520 60%,#0f1a2e 100%)',
             borderRight:'1px solid #1e2535' },
  right:   { width:'480px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px' },
  featBox: { width:'38px', height:'38px', background:'rgba(240,165,0,.1)', borderRadius:'9px',
             display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 },
  input:   { width:'100%', background:'#111520', border:'1px solid #1e2535', borderRadius:'8px',
             padding:'13px 14px', color:'#e8ecf5', fontSize:'14px', fontFamily:'inherit',
             transition:'border-color .2s', boxSizing:'border-box' },
  label:   { display:'block', color:'#9ca3c4', fontSize:'11px', fontWeight:700, marginBottom:'7px',
             letterSpacing:'.08em', textTransform:'uppercase' },
  btnGold: { width:'100%', background:'#f0a500', color:'#0a0d12', border:'none', borderRadius:'8px',
             padding:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  tabRow:  { display:'flex', gap:'4px', marginBottom:'28px', background:'#111520', padding:'4px', borderRadius:'8px' },
  tab:     { flex:1, padding:'9px', borderRadius:'6px', border:'none', fontSize:'13px', fontWeight:600,
             cursor:'pointer', fontFamily:'inherit', transition:'all .15s' },
};

function LoginView({ onLogin }) {
  const [tab, setTab] = React.useState('login');
  const [email, setEmail] = React.useState('demo@constructai.com.br');
  const [password, setPassword] = React.useState('demo123');

  function handleSubmit(e) {
    e.preventDefault();
    onLogin();
  }

  return (
    <React.Fragment>
      <style>{`
        input:focus{outline:none;border-color:#f0a500!important;box-shadow:0 0 0 3px rgba(240,165,0,.12)}
        @media(max-width:900px){.lp-left{display:none!important}.lp-right{width:100%!important}}
      `}</style>

      <div style={loginStyles.page}>
        <div className="lp-left" style={loginStyles.left}>
          <div style={{ maxWidth:'460px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'52px' }}>
              <BrandMark size={44} tone="amber"/>
              <div>
                <div style={{ color:'#e8ecf5', fontSize:'15px', fontWeight:600, letterSpacing:'-0.005em' }}>
                  Construction Intelligence Platform <span style={{ color:'#f0a500' }}>AI</span>
                </div>
                <div style={{ color:'#f0a500', fontSize:'10px', fontWeight:600,
                  letterSpacing:'2px', fontFamily:'monospace' }}>
                  v5.3 · ENTERPRISE COGNITIVE INFRASTRUCTURE
                </div>
              </div>
            </div>

            <h1 style={{ color:'#e8ecf5', fontSize:'36px', fontWeight:700,
              lineHeight:1.2, marginBottom:'16px' }}>
              IA Especializada em<br/>Construção Civil
            </h1>
            <p style={{ color:'#6b7a99', fontSize:'15px', lineHeight:1.75, marginBottom:'48px' }}>
              8 agentes cognitivos com análise BIM 6D/7D, gestão EVM e conformidade ABNT/NR em tempo real.
            </p>

            {FEATURES.map(f => (
              <div key={f.label} style={{ display:'flex', gap:'16px',
                alignItems:'flex-start', marginBottom:'24px' }}>
                <div style={loginStyles.featBox}>{f.icon}</div>
                <div style={{ paddingTop:'3px' }}>
                  <div style={{ color:'#e8ecf5', fontSize:'14px', fontWeight:600, marginBottom:'3px' }}>
                    {f.label}
                  </div>
                  <div style={{ color:'#6b7a99', fontSize:'13px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-right" style={loginStyles.right}>
          <div style={{ width:'100%', maxWidth:'380px' }}>
            <h2 style={{ color:'#e8ecf5', fontSize:'26px', fontWeight:700, marginBottom:'8px' }}>
              {tab === 'login' ? 'Entrar na plataforma' : 'Criar conta'}
            </h2>
            <p style={{ color:'#6b7a99', fontSize:'14px', marginBottom:'24px' }}>
              Acesso exclusivo para usuários autorizados.
            </p>

            <div style={loginStyles.tabRow}>
              {['login','signup'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ ...loginStyles.tab,
                    background: tab===t ? '#f0a500' : 'transparent',
                    color: tab===t ? '#0a0d12' : '#6b7a99' }}>
                  {t === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'18px' }}>
                <label style={loginStyles.label}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="seu@email.com.br" style={loginStyles.input} />
              </div>
              <div style={{ marginBottom:'26px' }}>
                <label style={loginStyles.label}>Senha</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Sua senha" style={loginStyles.input} />
              </div>
              <button type="submit" style={loginStyles.btnGold}>
                {tab === 'login' ? 'Entrar →' : 'Criar conta →'}
              </button>
            </form>

            <div style={{ marginTop:'24px', padding:'14px 16px', background:'#111520',
              borderRadius:'8px', border:'1px solid #1e2535',
              display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'16px' }}>🔒</span>
              <span style={{ color:'#6b7a99', fontSize:'12px' }}>Sessão criptografada · LGPD compliant</span>
            </div>

            <div style={{ marginTop:'14px', padding:'12px 16px',
              background:'rgba(240,165,0,.07)', borderRadius:'8px',
              border:'1px solid rgba(240,165,0,.2)' }}>
              <div style={{ color:'#f0a500', fontSize:'12px', fontWeight:600, marginBottom:'4px' }}>
                ⚡ Modo Demonstração
              </div>
              <div style={{ color:'#9ca3c4', fontSize:'12px' }}>
                Clique em Entrar para acessar o dashboard sem autenticação real.
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

window.LoginView = LoginView;
