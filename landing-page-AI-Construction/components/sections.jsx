/* Sections: Services, Agents, BIM/EVM, Proof, Roles, Compliance, Cases, Pricing, FAQ, Footer */

const { useState: useStateS, useEffect: useEffectS } = React;

/* ── Section header (eyebrow + title + lede) ─────────────── */
function SectionHead({ eyebrow, title, lede, align = "split" }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow eyebrow-accent">{eyebrow}</span>
        <h2 className="display display-l">{title}</h2>
      </div>
      {lede && <p className="lede">{lede}</p>}
    </div>
  );
}

/* ── Services ────────────────────────────────────────────── */
function Services({ t }) {
  return (
    <section className="section" id="services">
      <div className="wrap">
        <SectionHead eyebrow={t.services.eyebrow} title={t.services.title} lede={t.services.lede} />
        <div className="services-grid">
          {t.services.items.map((s, i) => (
            <div key={i} className="service-tile">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="service-num">{String(i + 1).padStart(2, "0")} · {s.title.split(" ")[0].toUpperCase()}</div>
                <div className="service-arrow">↗</div>
              </div>
              <div className="service-title">{s.title}</div>
              <div className="service-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Agents grid ─────────────────────────────────────────── */
function Agents({ t, layout, accentMap }) {
  return (
    <section className="section agents" id="agents">
      <div className="wrap">
        <SectionHead eyebrow={t.agents.eyebrow} title={t.agents.title} lede={t.agents.lede} />
        <div className="agents-grid" data-layout={layout}>
          {t.agents.items.map((a) => (
            <div key={a.num} className="agent-card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="agent-num">{a.num}</span>
                <span className="agent-class">{a.cls}</span>
              </div>
              <div className="agent-title">{a.name}</div>
              <div className="agent-desc">{a.desc}</div>
              <div className="agent-kpi">
                <span>{a.kpi}</span>
                <b>{a.kpiVal}</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BIM/EVM explainer with SVG visualization ────────────── */
function BimViz({ lang }) {
  /* Hand-drawn S-curve SVG with PV/EV/AC and a "Hoje" reference line. */
  const t = COPY[lang];
  return (
    <div className="bim-viz">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--ink-4)" }}>{t.dash.cardCurva}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", marginTop: 4 }}>{t.dash.cardCurvaSub}</div>
        </div>
        <div className="legend">
          <span className="key" style={{ color: "var(--brand-blue)" }}><span className="swatch" style={{ background: "var(--brand-blue)" }} />{t.dash.legendPV}</span>
          <span className="key" style={{ color: "var(--success)" }}><span className="swatch" style={{ background: "var(--success)" }} />{t.dash.legendEV}</span>
          <span className="key" style={{ color: "var(--danger)" }}><span className="swatch dash" />{t.dash.legendAC}</span>
        </div>
      </div>
      <svg viewBox="0 0 600 280" width="100%" height="280" preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="gpv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#185FA5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#185FA5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B6D11" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3B6D11" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[40, 90, 140, 190, 240].map((y) => (
          <line key={y} x1="40" x2="580" y1={y} y2={y} stroke="#e5e8f0" strokeDasharray="3 3" />
        ))}
        {/* X-axis labels */}
        {[
          { x: 60, l: "Jan" }, { x: 144, l: "Mar" }, { x: 228, l: "Mai" },
          { x: 312, l: "Jul" }, { x: 396, l: "Set" }, { x: 480, l: "Nov" }, { x: 560, l: "Dez" },
        ].map((g, i) => (
          <text key={i} x={g.x} y={262} fontSize="10" fontFamily="var(--font-mono)" fill="#8b93a7" textAnchor="middle">{g.l}</text>
        ))}
        {/* Y axis ticks */}
        {[
          { y: 240, l: "0" }, { y: 190, l: "25" }, { y: 140, l: "50" }, { y: 90, l: "75" }, { y: 40, l: "100" },
        ].map((g, i) => (
          <text key={i} x={32} y={g.y + 3} fontSize="10" fontFamily="var(--font-mono)" fill="#8b93a7" textAnchor="end">{g.l}</text>
        ))}
        {/* PV (planned) — smooth S-curve */}
        <path d="M40 235 C 120 235, 200 200, 300 140 S 480 60, 580 50 L 580 240 L 40 240 Z" fill="url(#gpv)" />
        <path d="M40 235 C 120 235, 200 200, 300 140 S 480 60, 580 50" stroke="#185FA5" strokeWidth="2" fill="none" />
        {/* EV (earned) — slightly lower */}
        <path d="M40 237 C 120 237, 200 215, 300 165 S 420 110, 380 110 L 380 240 L 40 240 Z" fill="url(#gev)" />
        <path d="M40 237 C 120 237, 200 215, 300 165 S 420 110, 380 110" stroke="#3B6D11" strokeWidth="2.5" fill="none" />
        {/* AC (actual) — dashed, slightly higher (over budget) */}
        <path d="M40 236 C 120 236, 200 218, 300 170 S 400 130, 400 130" stroke="#A32D2D" strokeWidth="2" strokeDasharray="5 3" fill="none" />
        {/* "Today" reference */}
        <line x1="380" x2="380" y1="40" y2="240" stroke="#BA7517" strokeDasharray="4 2" strokeWidth="1.5" />
        <text x="384" y="52" fontSize="10" fontFamily="var(--font-mono)" fill="#BA7517" fontWeight="600">{t.dash.now}</text>
        {/* CPI badge */}
        <g transform="translate(420, 86)">
          <rect width="116" height="52" rx="10" fill="#fff" stroke="#e5e8f0" />
          <text x="12" y="20" fontSize="9" fontFamily="var(--font-mono)" fill="#8b93a7" letterSpacing="1.4">CPI ATUAL</text>
          <text x="12" y="42" fontSize="20" fontFamily="var(--font-sans-app)" fontWeight="700" fill="#A32D2D">0,81</text>
          <text x="60" y="42" fontSize="10" fontFamily="var(--font-mono)" fill="#8b93a7">Meta ≥ 0,95</text>
        </g>
      </svg>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { lbl: "PV", val: "R$ 28,4 mi", color: "var(--brand-blue)" },
          { lbl: "EV", val: "R$ 23,0 mi", color: "var(--success)" },
          { lbl: "AC", val: "R$ 28,3 mi", color: "var(--danger)" },
        ].map((k, i) => (
          <div key={i} style={{
            border: "1px solid var(--app-border)",
            borderRadius: "var(--radius-md)",
            padding: "8px 10px",
            background: "var(--app-surface)",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: "var(--fg-4)" }}>{k.lbl}</div>
            <div style={{ fontWeight: 600, color: k.color, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{k.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BimEvm({ t, lang }) {
  return (
    <section className="section bim" id="platform">
      <div className="wrap">
        <SectionHead eyebrow={t.bim.eyebrow} title={t.bim.title} lede={t.bim.lede} />
        <div className="bim-grid">
          <div className="bim-points">
            {t.bim.points.map((p, i) => (
              <div key={i} className="bim-point">
                <div className="bim-dim">{p.dim}</div>
                <div>
                  <div className="bim-name">{p.name}</div>
                  <div className="bim-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <BimViz lang={lang} />
        </div>
      </div>
    </section>
  );
}

/* ── Proof / KPI ─────────────────────────────────────────── */
function Proof({ t }) {
  return (
    <section className="proof">
      <div className="wrap">
        <span className="eyebrow">{t.proof.eyebrow}</span>
        <h2 className="proof-headline">{t.proof.headline}</h2>
        <div className="proof-grid">
          {t.proof.cells.map((c, i) => (
            <div key={i} className="proof-cell">
              <div className="proof-num">
                {c.num}
                {c.unit && <span className="unit">{c.unit}</span>}
              </div>
              <div className="proof-label">{c.label}</div>
            </div>
          ))}
        </div>
        <div className="proof-foot">{t.proof.foot}</div>
      </div>
    </section>
  );
}

/* ── Roles ──────────────────────────────────────────────── */
function Roles({ t }) {
  return (
    <section className="section" id="roles">
      <div className="wrap">
        <SectionHead eyebrow={t.roles.eyebrow} title={t.roles.title} lede={t.roles.lede} />
        <div className="roles-grid">
          {t.roles.items.map((r) => (
            <div key={r.num} className="role-card">
              <span className="role-accent" style={{ background: r.color }} />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="role-num">{r.num}</span>
                <span className="role-num" style={{ color: r.color }}>●</span>
              </div>
              <div className="role-title">{r.title}</div>
              <div className="role-desc">{r.desc}</div>
              <div className="role-tags">
                {r.tags.map((tag, i) => (
                  <span key={i} className="role-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Compliance ─────────────────────────────────────────── */
function Compliance({ t }) {
  return (
    <section className="section compliance">
      <div className="wrap">
        <SectionHead eyebrow={t.compliance.eyebrow} title={t.compliance.title} lede={t.compliance.lede} />
        <div className="compliance-grid">
          {t.compliance.items.map((c, i) => (
            <div key={i} className="compliance-card">
              <span className="compliance-badge">{c.badge}</span>
              <div className="compliance-title">{c.title}</div>
              <div className="compliance-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Cases ──────────────────────────────────────────────── */
function Cases({ t }) {
  return (
    <section className="section" id="cases">
      <div className="wrap">
        <SectionHead eyebrow={t.cases.eyebrow} title={t.cases.title} />
        <div className="cases-logos">
          {t.cases.logos.map((l, i) => (
            <div key={i} className="cases-logo">
              <div>{l.name}</div>
              <div className="sub">{l.sub}</div>
            </div>
          ))}
        </div>
        <div className="cases-feature">
          {t.cases.features.map((f, i) => (
            <div key={i} className="case-card">
              <p className="case-quote">{f.quote}</p>
              <div className="case-meta">
                <div className="case-author">
                  <b>{f.author}</b>
                  {f.role}
                </div>
                <div className="case-kpi">
                  <div className="num">{f.kpi}</div>
                  <div className="lbl">{f.kpiLabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────── */
function Pricing({ t }) {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <SectionHead eyebrow={t.pricing.eyebrow} title={t.pricing.title} lede={t.pricing.lede} />
        <div className="pricing-grid">
          {t.pricing.tiers.map((tier, i) => (
            <div key={i} className={"tier" + (tier.feature ? " feature" : "")}>
              {tier.tag && <span className="tier-tag">{tier.tag}</span>}
              <div className="tier-name">{tier.name}</div>
              <div className="tier-price">{tier.price}{tier.unit && <span className="unit">{tier.unit}</span>}</div>
              <div className="tier-desc">{tier.desc}</div>
              <ul className="tier-features">
                {tier.features.map((f, k) => <li key={"f" + k}>{f}</li>)}
                {tier.muted && tier.muted.map((f, k) => <li key={"m" + k} className="muted">{f}</li>)}
              </ul>
              <a href="#demo" className={"btn " + (tier.feature ? "btn-primary" : "btn-ghost")} style={{ width: "100%", justifyContent: "center" }}>
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────── */
function Faq({ t }) {
  const [open, setOpen] = useStateS(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="faq-grid">
          <div>
            <span className="eyebrow eyebrow-accent">{t.faq.eyebrow}</span>
            <h2 className="display display-l" style={{ marginTop: 12 }}>{t.faq.title}</h2>
            <p className="lede" style={{ marginTop: 24 }}>{t.faq.lede}</p>
          </div>
          <div className="faq-list">
            {t.faq.items.map((it, i) => (
              <div key={i} className={"faq-item" + (open === i ? " open" : "")} onClick={() => setOpen(open === i ? -1 : i)}>
                <div className="faq-q">
                  <span>{it.q}</span>
                  <span className="plus">+</span>
                </div>
                <div className="faq-a">{it.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────── */
function Footer({ t, lang }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="row" style={{ marginBottom: 24 }}>
              <BrandMark size={44} />
              <div style={{ marginLeft: 4 }}>
                <div style={{ fontFamily: "var(--font-sans-display)", fontWeight: 700, fontSize: 18 }}>Atlas <span style={{ color: "var(--accent)" }}>·</span> ConstructAI</div>
                <div className="brand-sub">Atlas Construction Intelligence LLC</div>
              </div>
            </div>
            <p className="footer-cta">{t.footer.cta}</p>
            <a href="#demo" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>{t.footer.ctaBtn} <span aria-hidden="true">→</span></a>
          </div>
          {t.footer.cols.map((col, i) => (
            <div key={i} className="footer-col">
              <h4>{col.h}</h4>
              <ul>
                {col.links.map((l, k) => <li key={k}><a href="#">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          background: "var(--surface-card-2)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-xl)",
          padding: "16px 20px",
          marginBottom: 32,
          fontSize: 12,
          color: "var(--ink-3)",
          lineHeight: 1.55,
        }}>
          {t.footer.legal}
        </div>
        <div className="footer-bottom">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.version}</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SectionHead, Services, Agents, BimEvm, Proof, Roles, Compliance, Cases, Pricing, Faq, Footer });
