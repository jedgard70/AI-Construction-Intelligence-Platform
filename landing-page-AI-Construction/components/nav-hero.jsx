/* Nav + Hero + Marquee
 * Marketing surface — bold display, live agent alert feed on the right.
 */

const { useState, useEffect, useRef, useMemo } = React;

/* ── Brand mark ──────────────────────────────────────────── */
function BrandMark({ size = 36 }) {
  return (
    <div className="brand-mark" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      A
    </div>
  );
}

/* ── Lang toggle ─────────────────────────────────────────── */
function LangToggle({ lang, onChange }) {
  return (
    <div className="lang-toggle" role="group" aria-label="language">
      <button onClick={() => onChange("pt")} aria-pressed={lang === "pt"}>pt-BR</button>
      <button onClick={() => onChange("en")} aria-pressed={lang === "en"}>en</button>
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────── */
function Nav({ t, lang, setLang }) {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="brand">
          <BrandMark />
          <div>
            <div className="brand-name">Atlas <span style={{ color: "var(--accent)" }}>·</span> ConstructAI</div>
            <div className="brand-sub">Construction Intelligence</div>
          </div>
        </a>
        <div className="nav-links">
          <a href="#services" className="nav-link">{t.nav.services}</a>
          <a href="#agents" className="nav-link">{t.nav.agents}</a>
          <a href="#platform" className="nav-link">{t.nav.platform}</a>
          <a href="#pricing" className="nav-link">{t.nav.pricing}</a>
          <a href="#faq" className="nav-link">{t.nav.faq}</a>
        </div>
        <div className="nav-actions">
          <LangToggle lang={lang} onChange={setLang} />
          <a href="#signin" className="btn btn-ghost btn-sm">{t.nav.signin}</a>
          <a href="#demo" className="btn btn-mono btn-sm">{t.nav.demo}</a>
        </div>
      </div>
    </nav>
  );
}

/* ── Live feed (right-side of hero) ──────────────────────── */
function formatRelTime(seconds, lang) {
  const s = Math.abs(Math.round(seconds));
  if (lang === "pt") {
    if (s < 60) return `há ${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `há ${m} min`;
    return `há ${Math.round(m / 60)}h`;
  } else {
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  }
}

function LiveFeed({ lang }) {
  const seeds = FEED_SEEDS[lang];
  const [rows, setRows] = useState(() =>
    seeds.slice(0, 5).map((s, i) => ({ ...s, id: i, age: -s.t, isNew: false }))
  );
  const counterRef = useRef(seeds.length);

  /* Tick: age rows; periodically push new row from pool */
  useEffect(() => {
    const tick = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1, isNew: false })));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const push = setInterval(() => {
      setRows((prev) => {
        const id = counterRef.current++;
        const seed = seeds[id % seeds.length];
        const fresh = { ...seed, id, age: 1, isNew: true };
        return [fresh, ...prev].slice(0, 5);
      });
    }, 5200);
    return () => clearInterval(push);
  }, [seeds]);

  /* Reset rows when lang changes */
  useEffect(() => {
    setRows(seeds.slice(0, 5).map((s, i) => ({ ...s, id: i, age: -s.t, isNew: false })));
    counterRef.current = seeds.length;
  }, [lang, seeds]);

  const t = COPY[lang];
  return (
    <div className="live-card" aria-live="polite">
      <div className="live-card-head">
        <div className="live-card-title">
          <span className="live-dot" />
          {t.hero.live}
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em" }}>
          {lang === "pt" ? "8 agentes · online" : "8 agents · online"}
        </div>
      </div>
      <div className="live-rows">
        {rows.map((r) => (
          <div key={r.id} className={"live-row" + (r.isNew ? " new" : "")}>
            <div className="live-row-time">{formatRelTime(r.age, lang)}</div>
            <div>
              <div className="live-row-agent">{r.agent}</div>
              <div className="live-row-body">{r.body}</div>
            </div>
            <div className={"live-row-pri pri-" + r.pri}>{r.pri}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero({ t, lang, headlineOverride }) {
  return (
    <section className="hero section flush-top" id="top">
      <div className="hero-ghost">A</div>
      <div className="wrap">
        <div className="row" style={{ marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <span className="chip chip-mono">{t.hero.eyebrow}</span>
          <span className="chip chip-outline chip-dot" style={{ color: "var(--success)" }}>
            <span style={{ color: "var(--ink-3)" }}>{lang === "pt" ? "Sistema operacional · 99,95% uptime" : "Operating system · 99.95% uptime"}</span>
          </span>
        </div>
        <div className="hero-grid">
          <div>
            {headlineOverride && headlineOverride.trim() ? (
              <h1 className="display display-xxl">{headlineOverride}</h1>
            ) : (
              <h1 className="display display-xxl">
                {t.hero.headlinePre}{" "}
                <span className="strike">{t.hero.headlineStrike}</span>{" "}
                {t.hero.headlinePost}{" "}
                <span className="accent">{t.hero.headlineAccent}</span>
              </h1>
            )}
            <p className="lede" style={{ marginTop: 32, maxWidth: "44ch" }}>{t.hero.subhead}</p>
            <div className="row" style={{ marginTop: 36, gap: 12, flexWrap: "wrap" }}>
              <a href="#demo" className="btn btn-primary btn-lg">{t.hero.ctaPrimary} <span aria-hidden="true">→</span></a>
              <a href="#signin" className="btn btn-ghost btn-lg">{t.hero.ctaSecondary}</a>
            </div>
            <div className="row" style={{ marginTop: 28, gap: 8, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase" }}>
              {t.hero.trust}
            </div>

            <div className="hero-meta">
              {t.hero.stats.map((s, i) => (
                <div key={i}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <LiveFeed lang={lang} />
        </div>
      </div>
    </section>
  );
}

/* ── Marquee strip ───────────────────────────────────────── */
function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((it, i) => (
          <div key={i} className="marquee-item">
            <span className="glyph" />
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Nav, Hero, Marquee, BrandMark });
