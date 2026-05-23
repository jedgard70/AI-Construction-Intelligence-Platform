/* Embedded interactive mini-dashboard
 * - Top tab bar = role switcher (6 roles)
 * - KPI grid + Curva-S chart + agent alerts + project list
 * - Everything is hover/clickable; the chart redraws subtly per role.
 */

const { useState: useStateD, useMemo: useMemoD } = React;

/* Role glyph (lucide-ish) */
const ROLE_GLYPHS = ["♛", "$", "▦", "⛑", "✓", "↗"];

/* Curva-S generated path with role-specific tilt */
function curvaS({ pvShift = 0, evShift = 0, acShift = 0 }) {
  // Use simple control points; pvShift moves the EV/AC curves up or down a bit
  const today = 380;
  const pv = `M40 235 C 120 235, 200 200, 300 140 S 480 60, 580 50`;
  const ev = `M40 237 C 120 237, 200 215, 300 ${165 + evShift} S 420 ${110 + evShift}, ${today} ${110 + evShift}`;
  const ac = `M40 236 C 120 236, 200 218, 300 ${170 + acShift} S 400 ${130 + acShift}, ${today} ${130 + acShift}`;
  return { pv, ev, ac, today };
}

function DashChart({ tilt = { pvShift: 0, evShift: 0, acShift: 0 }, lang }) {
  const t = COPY[lang];
  const { pv, ev, ac, today } = curvaS(tilt);
  return (
    <div>
      <div className="dash-card-h">
        <div>
          <div className="dash-card-title">{t.dash.cardCurva}</div>
          <div className="dash-card-sub">{t.dash.cardCurvaSub}</div>
        </div>
        <div className="legend">
          <span className="key" style={{ color: "var(--brand-blue)" }}><span className="swatch" style={{ background: "var(--brand-blue)" }} />{t.dash.legendPV}</span>
          <span className="key" style={{ color: "var(--success)" }}><span className="swatch" style={{ background: "var(--success)" }} />{t.dash.legendEV}</span>
          <span className="key" style={{ color: "var(--danger)" }}><span className="swatch dash" />{t.dash.legendAC}</span>
        </div>
      </div>
      <svg viewBox="0 0 600 280" width="100%" height="220" preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="dgpv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#185FA5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#185FA5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dgev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B6D11" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3B6D11" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 90, 140, 190, 240].map((y) => (
          <line key={y} x1="40" x2="580" y1={y} y2={y} stroke="#e5e8f0" strokeDasharray="3 3" />
        ))}
        {[
          { x: 60, l: "Jan" }, { x: 144, l: "Mar" }, { x: 228, l: "Mai" },
          { x: 312, l: "Jul" }, { x: 396, l: "Set" }, { x: 480, l: "Nov" }, { x: 560, l: "Dez" },
        ].map((g, i) => (
          <text key={i} x={g.x} y={262} fontSize="10" fontFamily="var(--font-mono)" fill="#8b93a7" textAnchor="middle">{g.l}</text>
        ))}
        {/* PV */}
        <path d={pv + " L 580 240 L 40 240 Z"} fill="url(#dgpv)" style={{ transition: "d .35s ease" }} />
        <path d={pv} stroke="#185FA5" strokeWidth="2" fill="none" />
        {/* EV */}
        <path d={ev + ` L ${today} 240 L 40 240 Z`} fill="url(#dgev)" style={{ transition: "d .35s ease" }} />
        <path d={ev} stroke="#3B6D11" strokeWidth="2.5" fill="none" style={{ transition: "d .35s ease" }} />
        {/* AC */}
        <path d={ac} stroke="#A32D2D" strokeWidth="2" strokeDasharray="5 3" fill="none" style={{ transition: "d .35s ease" }} />
        {/* Today */}
        <line x1={today} x2={today} y1="40" y2="240" stroke="#BA7517" strokeDasharray="4 2" strokeWidth="1.5" />
        <text x={today + 4} y="52" fontSize="10" fontFamily="var(--font-mono)" fill="#BA7517" fontWeight="600">{t.dash.now}</text>
      </svg>
    </div>
  );
}

function DashAlerts({ lang, activeAgent, onPick }) {
  const t = COPY[lang];
  const alerts = DASH_ALERTS[lang];
  return (
    <div>
      <div className="dash-card-h">
        <div>
          <div className="dash-card-title">{t.dash.cardAlerts}</div>
          <div className="dash-card-sub">{t.dash.cardAlertsSub}</div>
        </div>
      </div>
      {alerts.map((a, i) => (
        <div
          key={i}
          className={"dash-alert " + a.level}
          style={{ cursor: "pointer", outline: activeAgent === a.agent ? "2px solid var(--brand-blue)" : "none" }}
          onClick={() => onPick && onPick(a.agent)}
        >
          <div className="dash-alert-h">
            <span className="dash-alert-agent">{a.agent}</span>
            <span className="dash-alert-pri">{a.pri}</span>
          </div>
          <div className="dash-alert-body">{a.body}</div>
        </div>
      ))}
    </div>
  );
}

function DashProjects({ lang, onPick, picked }) {
  const t = COPY[lang];
  const items = DASH_PROJECTS[lang];
  return (
    <div>
      <div className="dash-card-h">
        <div>
          <div className="dash-card-title">{t.dash.cardProjects}</div>
          <div className="dash-card-sub">{t.dash.cardProjectsSub}</div>
        </div>
      </div>
      <div className="dash-projects">
        <div className="dash-project-row head">
          <span>{t.dash.projHead[0]}</span>
          <span>{t.dash.projHead[1]}</span>
          <span>{t.dash.projHead[2]}</span>
          <span>{t.dash.projHead[3]}</span>
        </div>
        {items.map((p) => (
          <div
            key={p.code}
            className="dash-project-row"
            style={picked === p.code ? { background: "var(--brand-blue-tint)", color: "var(--brand-blue)" } : null}
            onClick={() => onPick && onPick(p.code)}
          >
            <div>
              <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>{p.name}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--fg-4)", letterSpacing: "0.1em" }}>{p.code}</div>
            </div>
            <span className={"dash-status " + p.status}>{t.dash.statuses[p.status]}</span>
            <span className="mono tnum" style={{ fontSize: 11 }}>{p.cpi}</span>
            <div className="row" style={{ gap: 8 }}>
              <div className="dash-bar" style={{ flex: 1 }}><span style={{ width: `${p.progress}%` }} /></div>
              <span className="mono tnum" style={{ fontSize: 10, color: "var(--fg-4)", minWidth: 28 }}>{p.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniDashboard({ t, lang, roleIndex, setRoleIndex }) {
  const tabs = t.dash.tabs;
  const kpiSet = DASH_KPIS[lang][roleIndex];
  const [activeKpi, setActiveKpi] = useStateD(0);
  const [pickedProject, setPickedProject] = useStateD(null);
  const [pickedAgent, setPickedAgent] = useStateD(null);

  /* Tilt the curve subtly per role to make tab switching feel real */
  const tilt = useMemoD(() => {
    const opts = [
      { pvShift: 0,  evShift: 0,   acShift: 0 },   // Diretor
      { pvShift: 0,  evShift: 6,   acShift: -8 },  // Financeiro
      { pvShift: 0,  evShift: -10, acShift: -4 },  // Coordenador
      { pvShift: 0,  evShift: 4,   acShift: 6 },   // Eng. Campo
      { pvShift: 0,  evShift: 2,   acShift: 2 },   // Qualidade
      { pvShift: 0,  evShift: -16, acShift: -10 }, // Investidor
    ];
    return opts[roleIndex] || opts[0];
  }, [roleIndex]);

  return (
    <div className="dash-frame" id="dashboard-mock" data-screen-label="ConstructAI mini-dashboard">
      <div className="dash-chrome">
        <div className="dash-dots"><span /><span /><span /></div>
        <div className="dash-url">{t.dash.url}</div>
        <div style={{ flex: 1 }} />
        <div className="row" style={{ gap: 8 }}>
          <span className="chip chip-mono" style={{ background: "var(--success-soft-bg)", color: "var(--success)" }}>
            <span style={{ width: 6, height: 6, background: "currentColor", borderRadius: "50%", display: "inline-block" }} />
            ConstructAI v5.3
          </span>
        </div>
      </div>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-side">
          <div className="dash-side-section">Principal</div>
          {[
            { l: lang === "pt" ? "Painel" : "Dashboard", a: true,  g: "▦" },
            { l: lang === "pt" ? "Obras"  : "Projects",  a: false, g: "🏗" },
            { l: lang === "pt" ? "Orçamento" : "Budget", a: false, g: "$" },
            { l: lang === "pt" ? "Jurídico"  : "Legal",  a: false, g: "§" },
            { l: lang === "pt" ? "Qualidade" : "Quality",a: false, g: "✓" },
            { l: lang === "pt" ? "Investidor" : "Investor", a: false, g: "↗" },
          ].map((x, i) => (
            <div key={i} className={"dash-nav-row" + (x.a ? " active" : "")}>
              <div className="dash-nav-glyph">{x.g}</div>
              <span>{x.l}</span>
            </div>
          ))}
          <div className="dash-side-section">{lang === "pt" ? "Apps" : "Apps"}</div>
          <div className="dash-nav-row"><div className="dash-nav-glyph" style={{ background: "var(--success-soft-bg)", color: "var(--success)" }}>◈</div><span>ArchVis Pro</span></div>
          <div className="dash-nav-row"><div className="dash-nav-glyph" style={{ background: "rgba(83,74,183,0.12)", color: "var(--purple)" }}>▶</div><span>Director Cut</span></div>
        </aside>

        {/* Main */}
        <div className="dash-main">
          <div className="dash-topbar">
            <div className="dash-tabs" role="tablist" aria-label="role">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={i === roleIndex}
                  className="dash-tab"
                  onClick={() => setRoleIndex(i)}
                >
                  <span>{ROLE_GLYPHS[i]}</span>
                  <span>{tab}</span>
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="chip chip-mono chip-outline">
                {lang === "pt" ? "Sáb, 18 mai 2026" : "Sat, May 18 2026"}
              </span>
            </div>
          </div>

          <div className="dash-kpis">
            {kpiSet.map((k, i) => (
              <div
                key={i}
                className={"dash-kpi" + (activeKpi === i ? " active" : "")}
                onClick={() => setActiveKpi(i)}
                role="button"
                tabIndex={0}
              >
                <div className="dash-kpi-label">{k.lbl}</div>
                <div className="dash-kpi-val tnum">{k.val}</div>
                <div className={"dash-kpi-meta " + (k.trend === "up" ? "up" : "down")}>
                  {k.trend === "up" ? "↑" : "↓"} {k.meta}
                </div>
              </div>
            ))}
          </div>

          <div className="dash-row">
            <div className="dash-card">
              <DashChart tilt={tilt} lang={lang} />
            </div>
            <div className="dash-card">
              <DashAlerts lang={lang} activeAgent={pickedAgent} onPick={setPickedAgent} />
            </div>
          </div>

          <div className="dash-card">
            <DashProjects lang={lang} onPick={setPickedProject} picked={pickedProject} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection({ t, lang, roleIndex, setRoleIndex }) {
  return (
    <section className="section" id="dashboard">
      <div className="wrap">
        <SectionHead eyebrow={t.dashboard.eyebrow} title={t.dashboard.title} lede={t.dashboard.lede} />
        <MiniDashboard t={t} lang={lang} roleIndex={roleIndex} setRoleIndex={setRoleIndex} />
      </div>
    </section>
  );
}

Object.assign(window, { MiniDashboard, DashboardSection });
