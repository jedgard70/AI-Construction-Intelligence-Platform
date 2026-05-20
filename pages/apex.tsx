'use client'
import Head from 'next/head'
import { useEffect, useRef } from 'react'

// SVG arrow shared component
function Arr() {
  return (
    <svg className="arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

// Star SVG
function Star() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
    </svg>
  )
}

export default function ApexPage() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Sticky nav
    const onScroll = () => {
      if (!navRef.current) return
      if (window.scrollY > 60) navRef.current.classList.add('is-stuck')
      else navRef.current.classList.remove('is-stuck')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Slideshow
    const slides = document.querySelectorAll<HTMLElement>('#heroBg .slide')
    const ticks  = document.querySelectorAll<HTMLElement>('#heroTicks .tick')
    let idx = 0
    const interval = setInterval(() => {
      slides[idx]?.classList.remove('is-active')
      ticks[idx]?.classList.remove('is-active')
      idx = (idx + 1) % slides.length
      slides[idx]?.classList.add('is-active')
      ticks[idx]?.classList.add('is-active')
    }, 4500)

    // Reveal on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      })
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearInterval(interval)
      io.disconnect()
    }
  }, [])

  return (
    <>
      <Head>
        <title>Apex Construtora — Engenharia, BIM e construção de patrimônio</title>
        <meta name="description" content="Apex Global Ltda · 25 anos construindo patrimônio com precisão técnica, modelagem BIM 6D/7D e gestão integrada de obras de alto padrão." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        :root {
          --bg: #f6f4ef;
          --bg-2: #ece8de;
          --paper: #ffffff;
          --ink: #0d1117;
          --ink-2: #2a2f38;
          --ink-3: #5a6072;
          --hair: #d9d3c5;
          --hair-2: #1f242c;
          --dark: #0a1428;
          --dark-2: #0f1a30;
          --dark-3: #1a2540;
          --amber: #2962E6;
          --amber-2: #1E4DBF;
          --navy: #0a1733;
          --brick: #C8202D;
          --moss: #3b6d11;
          --display: "Sora", system-ui, sans-serif;
          --sans: "Geist", "Inter", system-ui, sans-serif;
          --mono: ui-monospace, "Geist Mono", monospace;
          --pad-x: clamp(24px, 5vw, 96px);
          --gutter: clamp(24px, 3vw, 56px);
          --ease: cubic-bezier(.22,.61,.36,1);
        }
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); font-family: var(--sans); font-size: 16px;
          line-height: 1.55; -webkit-font-smoothing: antialiased; overflow-x: hidden; margin: 0; }
        img { max-width: 100%; display: block; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: var(--amber); color: #fff; }

        .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
          color: var(--ink-3); display: inline-flex; align-items: center; gap: 10px; }
        .eyebrow::before { content: ""; width: 24px; height: 1px; background: currentColor; opacity: .6; }
        .lede { font-family: var(--display); font-weight: 400; font-size: clamp(18px,1.6vw,22px);
          line-height: 1.4; color: var(--ink-2); max-width: 56ch; }

        /* NAV */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          padding: 18px var(--pad-x); display: flex; align-items: center;
          justify-content: space-between; background: transparent;
          transition: background .35s var(--ease), border-color .35s var(--ease);
          color: #fff; border-bottom: 1px solid transparent; }
        .nav.is-stuck { background: rgba(10,20,40,.85); backdrop-filter: blur(14px) saturate(1.2);
          border-bottom: 1px solid #1a2540; }
        .nav-logo { display: flex; align-items: center; }
        .nav-menu { display: flex; gap: 36px; font-size: 13.5px; letter-spacing: .01em; align-items: center; }
        .nav-menu a { position: relative; padding: 6px 0; }
        .nav-menu a::after { content: ""; position: absolute; left: 0; bottom: 0; width: 0; height: 1px;
          background: var(--amber); transition: width .3s var(--ease); }
        .nav-menu a:hover::after { width: 100%; }
        .nav-cta { border: 1px solid currentColor; padding: 10px 18px; border-radius: 999px;
          font-size: 13px; font-weight: 500; transition: all .25s var(--ease);
          display: inline-flex; align-items: center; gap: 8px; }
        .nav-cta:hover { background: var(--amber); color: #fff; border-color: var(--amber); }
        .nav-cta .dot { width: 6px; height: 6px; background: var(--brick); border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(200,32,45,.18); }
        @media (max-width: 880px) { .nav-menu { display: none; } }

        /* HERO */
        .hero { position: relative; min-height: 100vh; background: var(--dark); color: #fff;
          overflow: hidden; isolation: isolate; display: flex; flex-direction: column;
          justify-content: flex-end; padding: 140px var(--pad-x) 56px; }
        .hero-bg { position: absolute; inset: 0; z-index: -2; }
        .hero-bg .slide { position: absolute; inset: 0; background-size: cover;
          background-position: center; opacity: 0; transform: scale(1.05);
          transition: opacity 1.4s ease, transform 8s ease; }
        .hero-bg .slide.is-active { opacity: 1; transform: scale(1); }
        .hero-veil { position: absolute; inset: 0; z-index: -1;
          background: linear-gradient(180deg, rgba(10,20,40,.55) 0%, rgba(10,20,40,.25) 40%, rgba(10,20,40,.92) 100%),
                      linear-gradient(90deg, rgba(10,20,40,.7) 0%, rgba(10,20,40,0) 60%); }
        .hero-top { position: absolute; top: 110px; left: var(--pad-x); right: var(--pad-x);
          display: flex; justify-content: space-between; align-items: flex-start; gap: 40px;
          color: rgba(255,255,255,.7); font-family: var(--mono); font-size: 11px;
          letter-spacing: .1em; text-transform: uppercase; }
        .hero-top .live { display: inline-flex; align-items: center; gap: 8px; }
        .hero-top .live .pulse { width: 8px; height: 8px; background: var(--brick);
          border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(200,32,45,.6); }
          50% { box-shadow: 0 0 0 8px rgba(200,32,45,0); } }
        .hero-title { font-family: var(--display); font-weight: 600;
          font-size: clamp(56px,9.5vw,168px); line-height: .92; letter-spacing: -.04em;
          margin: 0 0 32px; max-width: 14ch; }
        .hero-title .it { font-style: italic; font-weight: 300; color: var(--brick); }
        .hero-title .small { display: block; font-size: .35em; font-weight: 400; letter-spacing: .02em;
          color: rgba(255,255,255,.7); margin-top: 18px; line-height: 1.3; max-width: 24ch; }
        .hero-foot { display: grid; grid-template-columns: 1fr auto; gap: var(--gutter);
          align-items: end; padding-top: 32px; border-top: 1px solid rgba(255,255,255,.18); }
        .hero-sub { font-family: var(--display); font-weight: 400; font-size: clamp(15px,1.2vw,18px);
          color: rgba(255,255,255,.85); max-width: 48ch; line-height: 1.5; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-slidebar { position: absolute; bottom: 56px; right: var(--pad-x); display: flex;
          flex-direction: column; gap: 8px; font-family: var(--mono); font-size: 10px;
          color: rgba(255,255,255,.65); text-align: right; z-index: 2; }
        .hero-slidebar .ticks { display: flex; gap: 6px; }
        .hero-slidebar .tick { width: 26px; height: 2px; background: rgba(255,255,255,.2); transition: background .3s var(--ease); }
        .hero-slidebar .tick.is-active { background: var(--amber); }
        @media (max-width: 768px) { .hero-foot { grid-template-columns: 1fr; }
          .hero-slidebar { display: none; } .hero-top { top: 90px; } }

        /* BUTTONS */
        .btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px;
          border-radius: 999px; font-size: 14px; font-weight: 500;
          transition: all .25s var(--ease); white-space: nowrap; }
        .btn-amber { background: var(--amber); color: #fff; }
        .btn-amber:hover { background: var(--amber-2); }
        .btn-ghost { border: 1px solid rgba(255,255,255,.35); color: #fff; }
        .btn-ghost:hover { border-color: #fff; background: rgba(255,255,255,.06); }
        .btn-dark { background: var(--ink); color: var(--bg); }
        .btn-dark:hover { background: var(--amber); color: #fff; }
        .btn .arr { transition: transform .25s var(--ease); }
        .btn:hover .arr { transform: translateX(4px); }

        /* MARQUEE */
        .marquee { background: var(--ink); color: var(--bg); border-top: 1px solid var(--dark-3);
          overflow: hidden; padding: 28px 0; }
        .marquee-track { display: flex; gap: 96px; white-space: nowrap; animation: marq 40s linear infinite;
          font-family: var(--display); font-size: clamp(28px,4vw,56px); font-weight: 300; letter-spacing: -.02em; }
        .marquee-track span { display: inline-flex; align-items: center; gap: 96px; }
        .marquee-track .dot { width: 10px; height: 10px; background: var(--amber); border-radius: 50%; flex-shrink: 0; }
        .marquee-track em { font-style: italic; color: var(--amber); font-weight: 300; }
        @keyframes marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* STATS */
        .stats { background: var(--bg); padding: clamp(72px,9vw,140px) var(--pad-x);
          border-bottom: 1px solid var(--hair); }
        .stats-head { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gutter);
          align-items: end; margin-bottom: clamp(48px,6vw,88px); }
        .stats-head h2 { font-family: var(--display); font-weight: 500;
          font-size: clamp(36px,4.4vw,64px); line-height: 1.02; letter-spacing: -.025em;
          margin: 18px 0 0; max-width: 18ch; }
        .stats-head h2 em { font-style: italic; font-weight: 300; color: var(--brick); }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px;
          background: var(--hair); border: 1px solid var(--hair); }
        .stat { background: var(--bg); padding: 32px 28px 36px; display: flex;
          flex-direction: column; gap: 20px; min-height: 220px; justify-content: space-between;
          transition: background .25s var(--ease); }
        .stat:hover { background: var(--paper); }
        .stat .num { font-family: var(--display); font-size: clamp(56px,6vw,88px); font-weight: 400;
          line-height: .92; letter-spacing: -.04em; color: var(--ink); }
        .stat .num sup { font-size: .35em; font-weight: 500; color: var(--amber); margin-left: 6px; top: -.7em; }
        .stat .lbl { font-size: 13px; color: var(--ink-3); line-height: 1.45; max-width: 22ch; }
        @media (max-width: 920px) { .stats-head { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2,1fr); } }

        /* SECTION CHROME */
        .section { padding: clamp(80px,10vw,160px) var(--pad-x); position: relative; }
        .section-head { display: grid; grid-template-columns: 220px 1fr; gap: var(--gutter);
          align-items: start; margin-bottom: clamp(48px,6vw,88px); }
        .section-head-num { font-family: var(--mono); font-size: 12px; letter-spacing: .1em;
          color: var(--ink-3); padding-top: 18px; }
        .section-title { font-family: var(--display); font-weight: 500;
          font-size: clamp(40px,5.5vw,84px); line-height: 1.0; letter-spacing: -.03em;
          margin: 0 0 24px; max-width: 22ch; }
        .section-title em { font-style: italic; font-weight: 300; color: var(--brick); }
        @media (max-width: 768px) { .section-head { grid-template-columns: 1fr; } }

        /* ATUAÇÃO */
        .atuacao { background: var(--paper); border-bottom: 1px solid var(--hair); }
        .atuacao-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px;
          background: var(--hair); border: 1px solid var(--hair); }
        .atu-card { background: var(--paper); padding: 32px; display: flex; flex-direction: column;
          gap: 24px; min-height: 540px; position: relative; overflow: hidden;
          transition: background .35s var(--ease); }
        .atu-card:hover { background: var(--bg); }
        .atu-card .num { font-family: var(--mono); font-size: 11px; letter-spacing: .1em;
          color: var(--ink-3); text-transform: uppercase; }
        .atu-img { flex: 1; overflow: hidden; background: var(--bg-2); min-height: 260px; }
        .atu-img img { width: 100%; height: 100%; object-fit: cover;
          transition: transform 1.1s var(--ease); }
        .atu-card:hover .atu-img img { transform: scale(1.04); }
        .atu-card h3 { font-family: var(--display); font-weight: 500; font-size: clamp(22px,2vw,28px);
          line-height: 1.1; letter-spacing: -.02em; margin: 0; }
        .atu-card p { font-size: 14.5px; color: var(--ink-3); line-height: 1.55; margin: 0; }
        .more { display: inline-flex; align-items: center; gap: 8px; font-size: 13px;
          font-weight: 500; color: var(--amber); margin-top: auto; }
        .more .arr { transition: transform .25s var(--ease); }
        .more:hover .arr { transform: translateX(4px); }
        @media (max-width: 920px) { .atuacao-grid { grid-template-columns: 1fr; } }

        /* SOBRE */
        .sobre { background: var(--bg); border-top: 1px solid var(--hair); }
        .sobre-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: clamp(40px,6vw,96px); align-items: start; }
        .sobre-portrait { position: sticky; top: 100px; }
        .sobre-portrait img { width: 100%; aspect-ratio: 3/4; object-fit: cover; object-position: top; }
        .badge { display: flex; justify-content: space-between; align-items: start; gap: 16px;
          padding: 16px 20px; background: var(--paper); border: 1px solid var(--hair);
          font-size: 12.5px; margin-top: -1px; }
        .badge strong { display: block; font-weight: 600; font-size: 14px; margin-bottom: 2px; }
        .sobre-text { display: flex; flex-direction: column; gap: 24px; }
        .sobre-text h2 { font-family: var(--display); font-weight: 500;
          font-size: clamp(36px,4vw,58px); line-height: 1.05; letter-spacing: -.025em; margin: 0; }
        .sobre-text h2 em { font-style: italic; font-weight: 300; color: var(--brick); }
        .quote { font-family: var(--display); font-size: clamp(18px,1.6vw,22px); font-style: italic;
          color: var(--ink-2); border-left: 3px solid var(--amber); padding-left: 24px;
          line-height: 1.45; margin: 0; }
        .sobre-text p { font-size: 15px; color: var(--ink-2); line-height: 1.65; margin: 0; }
        .creds { display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
          background: var(--hair); border: 1px solid var(--hair); margin-top: 8px; }
        .cred { background: var(--paper); padding: 20px 22px; display: flex; gap: 18px; align-items: baseline;
          transition: background .25s var(--ease); }
        .cred:hover { background: var(--bg); }
        .cred .yr { font-family: var(--mono); font-size: 11px; color: var(--amber); letter-spacing: .1em;
          flex-shrink: 0; width: 22px; }
        .cred .lbl { font-size: 13.5px; font-weight: 500; color: var(--ink); line-height: 1.3; }
        .cred .lbl small { display: block; font-size: 11.5px; color: var(--ink-3); font-weight: 400; margin-top: 3px; }
        @media (max-width: 920px) { .sobre-grid { grid-template-columns: 1fr; }
          .sobre-portrait { position: static; } .creds { grid-template-columns: 1fr; } }

        /* PROJETOS */
        .projetos { background: var(--dark); color: #fff; padding: clamp(80px,10vw,160px) var(--pad-x); }
        .projs-grid { display: grid; grid-template-columns: repeat(3,1fr);
          grid-template-rows: auto auto; gap: 12px; }
        .proj { overflow: hidden; position: relative; cursor: pointer; }
        .proj img { width: 100%; height: 100%; object-fit: cover;
          transition: transform 1.1s var(--ease); display: block; }
        .proj:hover img { transform: scale(1.04); }
        .proj-info { position: absolute; inset: 0; padding: 20px; display: flex;
          flex-direction: column; justify-content: space-between;
          background: linear-gradient(0deg, rgba(10,20,40,.9) 0%, rgba(10,20,40,.1) 50%, transparent 100%); }
        .proj-info .meta { font-family: var(--mono); font-size: 10px; letter-spacing: .1em;
          color: rgba(255,255,255,.6); text-transform: uppercase; margin-bottom: 4px; }
        .proj-info .ttl { font-family: var(--display); font-weight: 500;
          font-size: clamp(16px,1.4vw,20px); line-height: 1.2; letter-spacing: -.01em; }
        .proj-info .specs { font-size: 12px; color: rgba(255,255,255,.7); line-height: 1.4; }
        .proj-info .specs strong { display: block; font-family: var(--mono); font-size: 15px;
          color: var(--amber); letter-spacing: -.01em; margin-bottom: 2px; }
        .p-feature { grid-column: span 2; grid-row: span 2; min-height: 500px; }
        .p-tall { grid-column: span 1; grid-row: span 2; min-height: 500px; }
        .p-half { grid-column: span 1; grid-row: span 1; min-height: 240px; }
        .p-third { grid-column: span 1; grid-row: span 1; min-height: 240px; }
        .projetos-foot { display: flex; justify-content: space-between; align-items: center;
          gap: 24px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,.12);
          margin-top: 40px; flex-wrap: wrap; }
        .projetos-foot p { font-size: 14px; color: rgba(255,255,255,.6); }
        @media (max-width: 920px) { .projs-grid { grid-template-columns: 1fr 1fr; }
          .p-feature,.p-tall { grid-column: span 2; grid-row: span 1; min-height: 280px; }
          .p-half,.p-third { grid-column: span 1; } }

        /* PROCESSO */
        .proc-grid { display: grid; grid-template-columns: .7fr 1fr;
          gap: clamp(40px,6vw,96px); align-items: start; }
        .proc-img { position: sticky; top: 100px; aspect-ratio: 4/5;
          background: var(--bg-2); overflow: hidden; }
        .proc-img img { width: 100%; height: 100%; object-fit: cover; }
        .proc-steps { display: flex; flex-direction: column; }
        .proc-step { padding: 28px 0; border-bottom: 1px solid var(--hair);
          display: grid; grid-template-columns: 60px 1fr auto; gap: 24px; align-items: baseline; }
        .proc-step:first-child { border-top: 1px solid var(--hair); }
        .proc-step .n { font-family: var(--mono); font-size: 11px; color: var(--ink-3); letter-spacing: .1em; }
        .proc-step h4 { font-family: var(--display); font-weight: 500;
          font-size: clamp(22px,2.2vw,32px); line-height: 1.1; letter-spacing: -.02em;
          margin: 0 0 8px; }
        .proc-step h4 em { font-style: italic; font-weight: 300; color: var(--brick); }
        .proc-step p { font-size: 14.5px; color: var(--ink-3); line-height: 1.5; margin: 0; max-width: 48ch; }
        .proc-step .tag { font-family: var(--mono); font-size: 10px; letter-spacing: .1em;
          color: var(--ink-3); text-transform: uppercase; align-self: start; padding-top: 8px; }
        @media (max-width: 920px) { .proc-grid { grid-template-columns: 1fr; }
          .proc-img { position: static; aspect-ratio: 16/10; }
          .proc-step { grid-template-columns: 40px 1fr; } .proc-step .tag { display: none; } }

        /* DEPOIMENTOS */
        .depo { background: var(--paper); border-top: 1px solid var(--hair); position: relative; overflow: hidden; }
        .depo-rating { display: inline-flex; align-items: center; gap: 14px; padding: 10px 16px 10px 14px;
          border: 1px solid var(--hair); border-radius: 999px; margin-top: 18px; background: var(--bg); }
        .depo-rating .stars { display: inline-flex; gap: 2px; color: var(--amber); }
        .depo-rating .stars svg { width: 14px; height: 14px; fill: currentColor; }
        .depo-rating .score { font-family: var(--display); font-weight: 600; font-size: 18px; color: var(--ink); }
        .depo-rating .meta { font-family: var(--mono); font-size: 11px; letter-spacing: .08em;
          color: var(--ink-3); text-transform: uppercase; }
        .depo-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: var(--gutter);
          align-items: stretch; }
        .depo-feature { padding: clamp(32px,4vw,56px); background: var(--bg); border: 1px solid var(--hair);
          display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
          min-height: 460px; position: relative; overflow: hidden; }
        .depo-feature::before { content: "\\201C"; position: absolute; top: -40px; left: -8px;
          font-family: var(--display); font-size: 320px; line-height: 1; color: var(--amber);
          opacity: .08; font-weight: 700; pointer-events: none; }
        .depo-feature blockquote { font-family: var(--display); font-weight: 400;
          font-size: clamp(22px,2.4vw,34px); line-height: 1.32; letter-spacing: -.015em;
          color: var(--ink); margin: 0; position: relative; z-index: 1; max-width: 30ch; }
        .depo-feature blockquote em { font-style: italic; color: var(--brick); font-weight: 300; }
        .depo-feature .by { display: grid; grid-template-columns: 56px 1fr auto; gap: 16px;
          align-items: center; padding-top: 24px; border-top: 1px solid var(--hair); }
        .avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--amber); color: #fff;
          display: grid; place-items: center; font-family: var(--display); font-weight: 600;
          font-size: 20px; letter-spacing: -.02em; }
        .who strong { display: block; font-family: var(--display); font-weight: 500; font-size: 16px;
          color: var(--ink); letter-spacing: -.01em; }
        .who span { font-size: 12.5px; color: var(--ink-3); }
        .stamp { text-align: right; font-family: var(--mono); font-size: 10px; color: var(--ink-3);
          letter-spacing: .08em; text-transform: uppercase; line-height: 1.4; }
        .stamp strong { display: block; font-family: var(--display); color: var(--ink); font-size: 18px;
          font-weight: 500; letter-spacing: -.01em; text-transform: none; margin-bottom: 2px; }
        .depo-stack { display: flex; flex-direction: column; gap: 16px; }
        .depo-card { background: var(--paper); border: 1px solid var(--hair); padding: 24px 28px;
          flex: 1; display: flex; flex-direction: column; gap: 16px;
          transition: background .25s var(--ease), transform .35s var(--ease); }
        .depo-card:hover { background: var(--bg); transform: translateX(-4px); }
        .depo-card .top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .depo-card .stars { display: inline-flex; gap: 1px; color: var(--amber); }
        .depo-card .stars svg { width: 11px; height: 11px; fill: currentColor; }
        .depo-card .ref { font-family: var(--mono); font-size: 10px; letter-spacing: .08em;
          color: var(--ink-3); text-transform: uppercase; }
        .depo-card p { font-size: 14.5px; line-height: 1.55; color: var(--ink-2); margin: 0; flex: 1; }
        .depo-card .by { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid var(--hair); }
        .depo-card .by .avatar { width: 36px; height: 36px; font-size: 13px; flex-shrink: 0; background: var(--navy); }
        .depo-card .by .who strong { font-size: 13.5px; font-weight: 500; line-height: 1.2; font-family: inherit; }
        .depo-card .by .who span { font-size: 11.5px; }
        @media (max-width: 920px) { .depo-grid { grid-template-columns: 1fr; }
          .depo-feature .by { grid-template-columns: 48px 1fr; }
          .depo-feature .stamp { grid-column: 2; text-align: left; } }

        /* SEALS */
        .seals { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px;
          background: var(--hair); border: 1px solid var(--hair);
          margin-top: clamp(56px,6vw,88px); }
        .seal { background: var(--paper); padding: 28px; }
        .seal .hr-num { font-family: var(--mono); font-size: 11px; letter-spacing: .1em;
          color: var(--ink-3); margin-bottom: 14px; }
        .seal p { font-family: var(--display); font-size: 18px; line-height: 1.3; letter-spacing: -.01em; margin: 0; }
        @media (max-width: 768px) { .seals { grid-template-columns: repeat(2,1fr); } }

        /* STRIP (PORTFÓLIO) */
        .strip { background: var(--paper); padding: clamp(60px,7vw,100px) var(--pad-x);
          border-top: 1px solid var(--hair); overflow: hidden; }
        .strip-head { display: flex; justify-content: space-between; align-items: end;
          gap: 24px; margin-bottom: 40px; flex-wrap: wrap; }
        .strip-head h3 { font-family: var(--display); font-weight: 500;
          font-size: clamp(28px,3vw,44px); line-height: 1.05; letter-spacing: -.02em;
          margin: 8px 0 0; max-width: 28ch; }
        .strip-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; grid-auto-rows: 140px; }
        .strip-cell { overflow: hidden; background: var(--bg-2); }
        .strip-cell img { width: 100%; height: 100%; object-fit: cover;
          transition: transform 1.1s var(--ease); }
        .strip-cell:hover img { transform: scale(1.05); }
        .s-1 { grid-column: span 2; grid-row: span 2; }
        .s-2 { grid-column: span 2; grid-row: span 1; }
        .s-3 { grid-column: span 2; grid-row: span 2; }
        .s-4 { grid-column: span 2; grid-row: span 1; }
        .s-5 { grid-column: span 3; grid-row: span 2; }
        .s-6 { grid-column: span 3; grid-row: span 2; }
        @media (max-width: 920px) { .strip-grid { grid-template-columns: repeat(2,1fr); }
          .s-1,.s-2,.s-3,.s-4,.s-5,.s-6 { grid-column: span 1; grid-row: span 1; } }

        /* CTA */
        .cta { background: var(--dark); color: #fff; padding: clamp(80px,10vw,160px) var(--pad-x);
          position: relative; overflow: hidden; }
        .cta::before { content: ""; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 20%, rgba(41,98,230,.20), transparent 50%),
                      radial-gradient(ellipse at 10% 100%, rgba(200,32,45,.18), transparent 50%);
          pointer-events: none; }
        .cta-inner { position: relative; display: grid; grid-template-columns: 1fr 1fr;
          gap: var(--gutter); align-items: end; }
        .cta-inner h2 { font-family: var(--display); font-weight: 500;
          font-size: clamp(48px,7vw,120px); line-height: .95; letter-spacing: -.035em; margin: 0; max-width: 14ch; }
        .cta-inner h2 em { font-style: italic; font-weight: 300; color: var(--brick); }
        .cta-side { display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
        .cta-side p { font-family: var(--display); font-weight: 300; font-size: 18px;
          color: rgba(255,255,255,.75); margin: 0; max-width: 36ch; }
        .cta-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 920px) { .cta-inner { grid-template-columns: 1fr; } }

        /* FOOTER */
        footer { background: var(--dark); color: rgba(255,255,255,.7); padding: 56px var(--pad-x) 28px;
          border-top: 1px solid var(--dark-3); font-size: 13px; }
        .foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: var(--gutter); padding-bottom: 40px; border-bottom: 1px solid var(--dark-3); }
        .foot-grid p { margin: 0 0 10px; line-height: 1.6; }
        .foot-grid h5 { color: #fff; font-family: var(--mono); font-size: 11px; letter-spacing: .12em;
          text-transform: uppercase; margin: 0 0 20px; font-weight: 500; }
        .foot-grid ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .foot-grid ul a { color: rgba(255,255,255,.7); transition: color .2s var(--ease); }
        .foot-grid ul a:hover { color: var(--amber); }
        .foot-base { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;
          padding-top: 24px; font-family: var(--mono); font-size: 11px;
          color: rgba(255,255,255,.5); letter-spacing: .05em; }
        @media (max-width: 920px) { .foot-grid { grid-template-columns: 1fr 1fr; } }

        /* FAB */
        .fab { position: fixed; right: 24px; bottom: 24px; z-index: 60; width: 56px; height: 56px;
          background: #25D366; border-radius: 50%; display: grid; place-items: center;
          box-shadow: 0 8px 28px rgba(37,211,102,.4); transition: transform .25s var(--ease); }
        .fab:hover { transform: scale(1.08); }
        .fab svg { width: 28px; height: 28px; fill: #fff; }

        /* REVEAL */
        .reveal { opacity: 0; transform: translateY(28px);
          transition: opacity .9s var(--ease), transform .9s var(--ease); }
        .reveal.is-in { opacity: 1; transform: none; }

        .logo-img { height: 40px; width: auto; display: block; }
        .footer-logo { height: 64px; margin-bottom: 16px; }
        .hr-num { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; color: var(--ink-3); }
      `}</style>

      {/* NAV */}
      <header className="nav" id="nav" ref={navRef}>
        <a href="#top" className="nav-logo" aria-label="Apex Global · página inicial">
          <svg height="36" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 38 L32 14 L44 38 L40 38 L32 22 L24 38 Z" fill="#2962E6"/>
            <path d="M22 40 L36 50 L34 54 L20 44 Z" fill="#C8202D"/>
            <text x="50" y="36" fill="#fff" fontFamily="system-ui" fontWeight="700" fontSize="18" letterSpacing="3">APEX</text>
            <text x="50" y="47" fill="rgba(255,255,255,.65)" fontFamily="system-ui" fontWeight="400" fontSize="9" letterSpacing="5">GLOBAL</text>
          </svg>
        </a>
        <nav className="nav-menu" aria-label="Principal">
          <a href="#atuacao">Atuação</a>
          <a href="#sobre">Sobre</a>
          <a href="#projetos">Projetos</a>
          <a href="#processo">Processo</a>
          <a href="#depoimentos">Depoimentos</a>
          <a href="#portfolio">Portfólio</a>
        </nav>
        <a href="#contato" className="nav-cta">
          <span className="dot"></span>
          Conversar agora
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-bg" id="heroBg">
          <div className="slide is-active" style={{backgroundImage:"url('https://apexconstrutora.com/wp-content/uploads/2026/03/Gemini_Generated_Image_lmde21lmde21lmde-scaled.png')"}}></div>
          <div className="slide" style={{backgroundImage:"url('https://apexconstrutora.com/wp-content/uploads/2026/05/arquitetura-blue-print-digital-1.jpg')"}}></div>
          <div className="slide" style={{backgroundImage:"url('https://apexconstrutora.com/wp-content/uploads/2026/05/projecao-do-bim-para-a-casa-final-1.png')"}}></div>
          <div className="slide" style={{backgroundImage:"url('https://apexconstrutora.com/wp-content/uploads/2026/03/Gemini_Generated_Image_7g29zw7g29zw7g29-scaled.png')"}}></div>
        </div>
        <div className="hero-veil"></div>
        <div className="hero-top">
          <div className="live"><span className="pulse"></span> Promissão · SP · CREA 5071162007</div>
          <div>Edição v.2026 · Apex Global Ltda</div>
        </div>
        <h1 className="hero-title">
          Construir é
          <span className="it"> precisão.</span>
          <span className="small">Engenharia, BIM 6D/7D e gestão integrada para obras residenciais e comerciais de alto padrão.</span>
        </h1>
        <div className="hero-foot">
          <p className="hero-sub">25 anos coordenando o ciclo completo de obras — da concepção arquitetônica ao memorial descritivo, com previsibilidade financeira e zero retrabalho.</p>
          <div className="hero-actions">
            <a href="#projetos" className="btn btn-amber">Ver projetos <Arr /></a>
            <a href="#contato" className="btn btn-ghost">Solicitar orçamento</a>
          </div>
        </div>
        <div className="hero-slidebar">
          <div>04 etapas · BIM workflow</div>
          <div className="ticks" id="heroTicks">
            <div className="tick is-active"></div>
            <div className="tick"></div>
            <div className="tick"></div>
            <div className="tick"></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0,1].map(i => (
            <span key={i}>
              <em>BIM 6D</em><span className="dot"></span>
              Memoriais ABNT<span className="dot"></span>
              Compatibilização <em>precisa</em><span className="dot"></span>
              Curva-S EVM<span className="dot"></span>
              Conformidade NR<span className="dot"></span>
              Patrimônio <em>previsível</em><span className="dot"></span>
              Engenharia + IA<span className="dot"></span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="stats">
        <div className="stats-head">
          <div>
            <span className="eyebrow">A casa</span>
            <h2 className="reveal">A engenharia civil, <em>auditada</em> em cada ponto da obra.</h2>
          </div>
          <p className="lede reveal">Da fundação à entrega das chaves, cada decisão técnica é registrada, compatibilizada em BIM e acompanhada por um cronograma EVM. Patrimônio sem surpresas — não é promessa, é processo.</p>
        </div>
        <div className="stats-grid">
          {[
            {n:'25',sup:'anos',l:'Atuando em construção residencial e comercial — fundação à entrega.'},
            {n:'70',sup:'+',l:'Colaboradores diretos e indiretos coordenados em projetos simultâneos.'},
            {n:'6D',sup:'/7D',l:'Modelagem BIM integrada com EVM e sustentabilidade ABNT/NBR.'},
            {n:'0',sup:'%',l:'Tolerância para inconsistências de memorial — compatibilização total.'},
          ].map(s => (
            <div key={s.n} className="stat reveal">
              <div className="num">{s.n}<sup>{s.sup}</sup></div>
              <div className="lbl">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ATUAÇÃO */}
      <section className="section atuacao" id="atuacao">
        <div className="section-head">
          <div className="section-head-num">01 / Atuação</div>
          <div>
            <h2 className="section-title reveal">Soluções completas em<br/>construção e <em>engenharia.</em></h2>
            <p className="lede reveal">Três frentes integradas em um único contrato, com responsabilidade técnica do CEO e engenheiro civil Dr. José Edgard de Oliveira.</p>
          </div>
        </div>
        <div className="atuacao-grid">
          {[
            {num:'01 — Obra',img:'https://apexconstrutora.com/wp-content/uploads/2026/05/rHlc0Jv36cHwBKzTeYFA4Aq3P5YiG5RjdM_G45YwiPvbeU_-0RMO-UqlYV1CC7n5dOecyAnNk6B21Z6i75qr2yAo0I9IkXYoxVFK5NfwGYtG25y4bxDbCiX7N8VAy7s9uRNQ9IBhp210w-QofNZN7oNOdiN58Dus9O60xWN6K0UiGpf4n9zSWa8H8nizmsiN-1.jpeg',alt:'Obra em execução',h:'Construção & Reforma',p:'Da fundação ao acabamento, executando residências, comércios e ampliações com cronograma EVM e laudo NR-18.',link:'#contato',lt:'Solicitar visita técnica'},
            {num:'02 — Interiores',img:'https://apexconstrutora.com/wp-content/uploads/2026/05/capa-site-apex-1-scaled.png',alt:'Designer de interiores',h:'Design de Interiores',p:'Personalização do espaço com paleta, marcenaria e iluminação — render fotorrealista antes do primeiro tijolo.',link:'#processo',lt:'Ver processo de personalização'},
            {num:'03 — Arquitetura',img:'https://apexconstrutora.com/wp-content/uploads/2026/03/Gemini_Generated_Image_7wtvj37wtvj37wtv-scaled.png',alt:'Consultoria de arquitetura',h:'Consultoria & BIM',p:'Compatibilização BIM 6D/7D, memorial descritivo ABNT e curva-S financeira — para investidores e construtoras.',link:'#projetos',lt:'Ver portfólio técnico'},
          ].map(c => (
            <article key={c.num} className="atu-card reveal">
              <div className="num">{c.num}</div>
              <div className="atu-img"><img src={c.img} alt={c.alt} /></div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
              <a className="more" href={c.link}>{c.lt} <Arr /></a>
            </article>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section className="section sobre" id="sobre">
        <div className="section-head">
          <div className="section-head-num">02 / Sobre</div>
          <div>
            <h2 className="section-title reveal">Liderança técnica com<br/>vinte e cinco <em>safras</em>.</h2>
            <p className="lede reveal">Engenharia, gestão de negócios e relações humanas — sob a responsabilidade de um só profissional, do orçamento à entrega das chaves.</p>
          </div>
        </div>
        <div className="sobre-grid">
          <div className="sobre-portrait reveal">
            <img src="https://apexconstrutora.com/wp-content/uploads/2026/05/foto-edgard-curriculo2.png" alt="Dr. José Edgard de Oliveira, CEO da Apex Construtora" />
            <div className="badge">
              <div><strong>Dr. José Edgard de Oliveira</strong>CEO · Engenheiro Civil</div>
              <div style={{textAlign:'right'}}>CREA<br/><strong>5071162007</strong></div>
            </div>
          </div>
          <div className="sobre-text">
            <h2 className="reveal">Visão estratégica <em>e</em> mão na massa.</h2>
            <p className="quote reveal">"Trazer duas décadas e meia de experiência em campo e gestão para entregar o mapa definitivo de como construir patrimônio com previsibilidade, economia e segurança técnica."</p>
            <p className="reveal">Dr. José Edgard de Oliveira domina o ciclo construtivo de ponta a ponta — da concepção arquitetônica ao gerenciamento de obras de alto padrão. Especialista em aliar o rigor da engenharia civil às tecnologias mais avançadas: modelagem BIM, AutoCAD e Inteligência Artificial aplicada à compatibilização precisa de projetos.</p>
            <p className="reveal">Como Master Practitioner em PNL, coordenou com sucesso equipes multidisciplinares com até 70 colaboradores em múltiplos projetos simultâneos.</p>
            <div className="creds">
              {[
                {yr:'01',l:'Engenheiro Civil',s:'FARO · Faculdade de Roseira'},
                {yr:'02',l:'MBA Internacional',s:'University of Devonshire London'},
                {yr:'03',l:'PhD Business & Marketing',s:'University of Devonshire London'},
                {yr:'04',l:'Master Practitioner em PNL',s:'SBPNL · Rio de Janeiro'},
                {yr:'05',l:'Administração de Empresas',s:'Universidade UNAERP'},
                {yr:'06',l:'Contabilidade',s:'Instituto Moura Lacerda · Ribeirão Preto'},
                {yr:'★',l:'Comendador JK',s:'Ordem do Mérito do Empreendedor'},
                {yr:'★',l:'Embaixador da Paz',s:'Forças de Paz da ONU · Brasil & Portugal'},
              ].map(c => (
                <div key={c.yr+c.l} className="cred reveal">
                  <div className="yr">{c.yr}</div>
                  <div className="lbl">{c.l}<small>{c.s}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROJETOS */}
      <section className="section projetos" id="projetos">
        <div className="section-head">
          <div className="section-head-num" style={{color:'rgba(255,255,255,.5)'}}>03 / Projetos</div>
          <div>
            <h2 className="section-title reveal">Projetos <em>recentes</em>, em obra e entregues.</h2>
            <p className="lede reveal">Residências de alto padrão, ampliações e renderizações BIM em Promissão, Guaiçara e região.</p>
          </div>
        </div>
        <div className="projs-grid">
          {[
            {cls:'proj p-feature reveal',img:'https://apexconstrutora.com/wp-content/uploads/2023/08/001_506502557c.jpg',meta:'01 · Promissão · SP',ttl:'Residência Jardim Americano',specs:<><strong>171,68 m²</strong>10 × 25 · 3 dorm · 3 suítes · 2 vagas</>},
            {cls:'proj p-tall reveal',img:'https://apexconstrutora.com/wp-content/uploads/2026/05/Render_Fachada_Triangular_J_Edgard-1.png',meta:'02 · Render BIM',ttl:'Fachada Triangular',specs:<><strong>BIM 7D</strong>Estudo volumétrico</>},
            {cls:'proj p-half reveal',img:'https://apexconstrutora.com/wp-content/uploads/2026/03/Gemini_Generated_Image_mj82kxmj82kxmj82-scaled.png',meta:'03 · Guaiçara · SP',ttl:'Casa Térrea Premium',specs:<><strong>210 m²</strong>12 × 25</>},
            {cls:'proj p-half reveal',img:'https://apexconstrutora.com/wp-content/uploads/2023/08/001_b17e363f39.jpg',meta:'04 · Promissão · SP',ttl:'Sobrado com Mezanino',specs:<><strong>248 m²</strong>10 × 25 · 2 pavimentos</>},
            {cls:'proj p-third reveal',img:'https://apexconstrutora.com/wp-content/uploads/2026/03/Gemini_Generated_Image_7g29zw7g29zw7g29-scaled.png',meta:'05 · Render',ttl:'Linha Contemporânea',specs:<><strong>185 m²</strong></>},
            {cls:'proj p-third reveal',img:'https://apexconstrutora.com/wp-content/uploads/2026/05/ChatGPT-Image-Apr-30-2026-09_06_33-AM-1.png',meta:'06 · Concept',ttl:'Residência Modular',specs:<><strong>320 m²</strong></>},
            {cls:'proj p-third reveal',img:'https://apexconstrutora.com/wp-content/uploads/2026/05/fachada-jd-Americano-inteira.png',meta:'07 · Lins · SP',ttl:'Fachada Jd. Americano',specs:<><strong>Render 3D</strong></>},
          ].map((p,i) => (
            <article key={i} className={p.cls} tabIndex={0}>
              <img src={p.img} alt={p.ttl} />
              <div className="proj-info">
                <div><div className="meta">{p.meta}</div><h3 className="ttl">{p.ttl}</h3></div>
                <div className="specs">{p.specs}</div>
              </div>
            </article>
          ))}
        </div>
        <div className="projetos-foot">
          <p>Mais de 40 obras coordenadas em Promissão, Guaiçara, Lins e Ribeirão Preto.</p>
          <a href="#portfolio" className="btn btn-ghost">Ver portfólio completo <Arr /></a>
        </div>
      </section>

      {/* PROCESSO */}
      <section className="section processo" id="processo">
        <div className="section-head">
          <div className="section-head-num">04 / Processo</div>
          <div>
            <h2 className="section-title reveal">Personalizar com <em>previsibilidade.</em></h2>
            <p className="lede reveal">Da primeira reunião à entrega das chaves — cada etapa é um documento, um render e uma assinatura.</p>
          </div>
        </div>
        <div className="proc-grid">
          <div className="proc-img reveal">
            <img src="https://apexconstrutora.com/wp-content/uploads/2026/05/Projeto-Hidrossanitario-1024x670-1.png" alt="Projeto hidrossanitário" />
          </div>
          <div className="proc-steps">
            {[
              {n:'01',h:<>Diagnóstico <em>técnico</em></>,p:'Visita ao terreno, levantamento topográfico e análise do programa de necessidades. Documentação ART e estudo de viabilidade.',tag:'Semana 01'},
              {n:'02',h:<>Estudo <em>preliminar</em></>,p:'Plantas, cortes e volumetria em BIM. Render fotorrealista das fachadas — você aprova o que vê antes do contrato.',tag:'Semana 02–04'},
              {n:'03',h:<>Projeto <em>executivo</em></>,p:'Memorial descritivo ABNT, projetos hidrossanitário, elétrico e estrutural. Compatibilização BIM 6D — orçamento fechado, curva-S aprovada.',tag:'Semana 05–10'},
              {n:'04',h:<>Execução <em>auditada</em></>,p:'Cronograma EVM com aferição semanal, conformidade NR-18 e relatório fotográfico. Acesso ao painel ConstructAI durante toda a obra.',tag:'Mês 03 → Entrega'},
              {n:'05',h:<>Entrega <em>e</em> garantia</>,p:'Habite-se, manual do proprietário e garantia de 5 anos sobre estrutura. Pós-obra ativo por 12 meses.',tag:'As-built'},
            ].map(s => (
              <div key={s.n} className="proc-step reveal">
                <div className="n">{s.n}</div>
                <div><h4>{s.h}</h4><p>{s.p}</p></div>
                <div className="tag">{s.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section depo" id="depoimentos">
        <div className="section-head">
          <div className="section-head-num">05 / Depoimentos</div>
          <div>
            <h2 className="section-title reveal">O que dizem<br/>sobre o <em>método.</em></h2>
            <p className="lede reveal">Cinco clientes — entre proprietários, investidores e engenheiros parceiros — descrevem o que mudou quando a obra ganhou cronograma, BIM e memorial auditados.</p>
            <div className="depo-rating reveal">
              <span className="stars" aria-label="5 de 5 estrelas">{[0,1,2,3,4].map(i=><Star key={i}/>)}</span>
              <span className="score">4,9</span>
              <span className="meta">média · 32 obras avaliadas</span>
            </div>
          </div>
        </div>
        <div className="depo-grid">
          <article className="depo-feature reveal">
            <blockquote>"Foi a primeira obra da minha vida em que ninguém me disse <em>'imprevistos acontecem'</em>. Não aconteceram. A casa foi entregue dois dias antes do prazo e o orçamento final fechou centavo a centavo com a curva-S aprovada no contrato."</blockquote>
            <div className="by">
              <div className="avatar">MA</div>
              <div className="who"><strong>Marina Albuquerque</strong><span>Residência 240 m² · Promissão, SP · 2025</span></div>
              <div className="stamp"><strong>R$ 1,2 mi</strong>Investimento final</div>
            </div>
          </article>
          <div className="depo-stack">
            {[
              {init:'LS',ref:'OBR-2024-017',q:'"Os renders BIM nos deram coragem para investir no projeto: vimos a casa por dentro antes de a fundação ser concretada. Sem achismo, sem \'na obra a gente decide\'."',who:'Luciana & Fernando Souza',sub:'Reforma + piscina · Lins, SP'},
              {init:'PM',ref:'INVEST · 2025',q:'"Como investidora à distância, o relatório semanal com fotografia e EVM me poupa de visitas físicas. Vejo o desvio antes da despesa acontecer — isso é dinheiro recuperado."',who:'Engª Patrícia Moreira',sub:'Investidora · Ribeirão Preto, SP'},
              {init:'HV',ref:'OBR-2024-031',q:'"O memorial descritivo da Apex é tão detalhado que pedimos cópia para o nosso advogado guardar. Cada item, cada metro, cada NBR citada — proteção pura."',who:'Dr. Henrique Vasconcelos',sub:'Residência alto padrão · Promissão, SP'},
            ].map(d => (
              <article key={d.init} className="depo-card reveal">
                <div className="top">
                  <span className="stars">{[0,1,2,3,4].map(i=><Star key={i}/>)}</span>
                  <span className="ref">{d.ref}</span>
                </div>
                <p>{d.q}</p>
                <div className="by">
                  <div className="avatar">{d.init}</div>
                  <div className="who"><strong>{d.who}</strong><span>{d.sub}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="seals">
          {[
            {v:'94%',l:'Entregam no prazo\nou antes do contrato.'},
            {v:'100%',l:'Recomendam para\nparentes próximos.'},
            {v:'±1,8%',l:'Desvio médio entre\norçado e executado.'},
            {v:'5 anos',l:'De garantia estrutural\nem todos os contratos.'},
          ].map(s => (
            <div key={s.v} className="seal">
              <div className="hr-num">{s.v}</div>
              <p>{s.l.split('\n').map((t,i) => <span key={i}>{t}{i===0&&<br/>}</span>)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className="strip" id="portfolio">
        <div className="strip-head">
          <div>
            <span className="eyebrow">06 / Portfólio</span>
            <h3 className="reveal">Fachadas, interiores, piscinas — o detalhe que prova o método.</h3>
          </div>
          <a href="#contato" className="btn btn-dark">Solicitar portfólio completo <Arr /></a>
        </div>
        <div className="strip-grid">
          {[
            {cls:'strip-cell s-1',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/fachada-jd-Americano.png',alt:'Fachada Jardim Americano'},
            {cls:'strip-cell s-2',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/estilo-picina-com-hidro-alvenaria.png',alt:'Piscina alvenaria com hidro'},
            {cls:'strip-cell s-3',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/teto-gesso-ilha-led.png',alt:'Teto de gesso com ilha de LED'},
            {cls:'strip-cell s-4',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/lavabo-jd-americano.png',alt:'Lavabo Jardim Americano'},
            {cls:'strip-cell s-5',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/estilo-picina-com-hidro-alvenaria-angulo1.png',alt:'Piscina ângulo 1'},
            {cls:'strip-cell s-6',src:'https://apexconstrutora.com/wp-content/uploads/2026/05/ChatGPT-Image-Apr-30-2026-09_37_09-AM.png',alt:'Renderização ambiente'},
          ].map(c => (
            <div key={c.cls} className={c.cls}><img src={c.src} alt={c.alt} /></div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="contato">
        <div className="cta-inner">
          <h2 className="reveal">Pronto para<br/>tirar a obra <em>do papel?</em></h2>
          <div className="cta-side">
            <p className="reveal">Receba em 48h uma análise técnica do seu terreno e uma proposta com cronograma e curva-S — sem compromisso.</p>
            <div className="cta-actions reveal">
              <a href="https://wa.me/5514999999999?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20uma%20an%C3%A1lise%20t%C3%A9cnica" className="btn btn-amber" target="_blank" rel="noreferrer">
                Solicitar análise técnica <Arr />
              </a>
              <a href="tel:+5514999999999" className="btn btn-ghost">(14) 9 9999-9999</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-grid">
          <div>
            <svg height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom:16}}>
              <path d="M20 38 L32 14 L44 38 L40 38 L32 22 L24 38 Z" fill="#2962E6"/>
              <path d="M22 40 L36 50 L34 54 L20 44 Z" fill="#C8202D"/>
              <text x="50" y="36" fill="#fff" fontFamily="system-ui" fontWeight="700" fontSize="18" letterSpacing="3">APEX</text>
              <text x="50" y="47" fill="rgba(255,255,255,.65)" fontFamily="system-ui" fontWeight="400" fontSize="9" letterSpacing="5">GLOBAL</text>
            </svg>
            <p>Expertise técnica, organização e clareza em cada projeto.<br/>Construindo o futuro com profissionalismo e confiança.</p>
            <p style={{marginTop:18,color:'rgba(255,255,255,.5)'}}>Rua Comendador José Zillo, s/n — Promissão · SP<br/>contato@apexglobal.com.br</p>
          </div>
          <div>
            <h5>Institucional</h5>
            <ul>
              <li><a href="#sobre">Sobre</a></li>
              <li><a href="#atuacao">Áreas de atuação</a></li>
              <li><a href="#processo">Processo</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </div>
          <div>
            <h5>Serviços</h5>
            <ul>
              <li><a href="#">Construção &amp; reforma</a></li>
              <li><a href="#">Design de interiores</a></li>
              <li><a href="#">Consultoria BIM</a></li>
              <li><a href="#">Memorial descritivo</a></li>
            </ul>
          </div>
          <div>
            <h5>Redes</h5>
            <ul>
              <li><a href="https://instagram.com/apexconstrutora" target="_blank" rel="noreferrer">Instagram</a></li>
              <li><a href="https://linkedin.com/company/apexglobal" target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href="https://wa.me/5514999999999" target="_blank" rel="noreferrer">WhatsApp</a></li>
              <li><a href="#" target="_blank" rel="noreferrer">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <div>Apex Global Ltda © 2026 · CNPJ 45.239.918/0001-26 · I.E. 564102661110</div>
          <div>Resp. técnico: Dr. José Edgard de Oliveira · CREA 5071162007</div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a className="fab" href="https://wa.me/5514999999999" aria-label="Conversar no WhatsApp" target="_blank" rel="noreferrer">
        <svg viewBox="0 0 24 24">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .18 5.31.18 11.87a11.78 11.78 0 0 0 1.6 5.94L0 24l6.34-1.66a11.84 11.84 0 0 0 5.71 1.45h.01c6.55 0 11.87-5.32 11.87-11.87a11.82 11.82 0 0 0-3.41-8.44ZM12.06 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.66-.23-.38a9.86 9.86 0 0 1-1.52-5.28c0-5.46 4.44-9.9 9.91-9.9a9.86 9.86 0 0 1 9.9 9.92c0 5.46-4.44 9.9-9.9 9.9Z" />
        </svg>
      </a>
    </>
  )
}
