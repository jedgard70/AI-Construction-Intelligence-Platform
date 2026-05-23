'use client'
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

// ─── Brand palette ───────────────────────────────────────────────
const BRAND = {
  primary:   '#0F4C81',  // Atlas Blue
  accent:    '#F5A623',  // Construction Amber
  dark:      '#0D1B2A',  // Deep Navy
  light:     '#E8F0F9',  // Sky Mist
  success:   '#2D7A4F',  // Site Green
  text:      '#1A2B3C',
  muted:     '#5C7A99',
}

// ─── Taglines ────────────────────────────────────────────────────
const TAGLINES = [
  { line: 'Build Smarter. Submit Faster. Coordinate Better.', score: 97, why: 'Addresses the 3 biggest pain points in one sentence' },
  { line: 'AI-Powered BIM Intelligence for the Modern Jobsite', score: 89, why: 'Clear, keyword-rich, SEO-friendly' },
  { line: 'From Model to Permit in Hours, Not Weeks.', score: 94, why: 'Quantifies the value, speaks directly to permit pain' },
  { line: 'Your AI BIM Coordinator — Available 24/7', score: 88, why: 'Positions as a team member, not a tool' },
]

// ─── ICP Personas ────────────────────────────────────────────────
const PERSONAS = [
  {
    icon: '🏗️', name: 'The BIM Coordinator',
    title: 'BIM Coordinator / VDC Manager',
    company: 'Mid-size GC or MEP firm (50–500 employees)',
    location: 'TX, FL, AZ, GA, NC',
    pain: ['Spends 6+ hrs/week on clash reports', 'Revit models not coordinated before permit', 'RFIs pile up during design review', 'No single source of truth for model status'],
    gain: ['One-click clash detection with AI summary', 'Automated RFI drafts from clash data', 'Live coordination dashboard', 'Export permit-ready reports in minutes'],
    budget: '$300–$800/mo',
    urgency: 'High',
    color: BRAND.primary,
    bg: '#E8F0F9',
  },
  {
    icon: '📋', name: 'The Permit Technician',
    title: 'Permit Tech / Plan Check Coordinator',
    company: 'Residential builder or Architecture firm',
    location: 'Sun Belt — TX, FL, AZ',
    pain: ['Plan check rejections cost 3–8 weeks', 'IBC/ADA checklist done manually in Excel', 'Different requirements per jurisdiction', 'Cannot predict submission readiness'],
    gain: ['AI pre-checks against IBC 2021, ADA, NFPA, Title 24', 'Automated submission checklist per jurisdiction', 'Rejection risk score before submitting', 'One-click permit set PDF export'],
    budget: '$200–$500/mo',
    urgency: 'Very High',
    color: '#8B4513',
    bg: '#FFF0E6',
  },
  {
    icon: '📐', name: 'The Revit Specialist',
    title: 'Revit Specialist / CAD Drafter',
    company: 'Engineering firm or Design-Build GC',
    location: 'Nationwide, remote-first',
    pain: ['Manual QA/QC takes 2+ days per model', 'Clash reports sent via email, hard to track', 'No AI assistance during modeling', 'Sheet setup for permit sets is repetitive'],
    gain: ['AI QA/QC in < 5 minutes', 'Centralized clash tracker with status updates', 'AI-generated spec sections (CSI MasterFormat)', 'Smart sheet templates for permit sets'],
    budget: '$150–$400/mo',
    urgency: 'Medium',
    color: '#534AB7',
    bg: '#F0EEFF',
  },
  {
    icon: '🏢', name: 'The Construction PM',
    title: 'Project Manager / Owner Rep',
    company: 'Developer or GC (residential/commercial)',
    location: 'TX, FL, AZ, GA',
    pain: ['No visibility into BIM coordination status', 'RFIs and submittals tracked in email threads', 'Executive reports take hours to prepare', 'Cannot tie BIM issues to schedule/cost impact'],
    gain: ['Executive dashboard: open clashes, permit status, RFIs', 'AI weekly report — auto-generated in 30 sec', 'EVM analytics: CPI, SPI, budget burn', 'Alert when clash severity is Critical'],
    budget: '$500–$1,500/mo',
    urgency: 'High',
    color: BRAND.success,
    bg: '#E6F4ED',
  },
]

// ─── Value props ──────────────────────────────────────────────────
const VALUE_PROPS = [
  { icon: '⚡', title: 'Clash Detection in < 2 Min', desc: 'Upload IFC/RVT, get AI-classified clashes (Critical/Major/Minor) with RFI-ready descriptions. No Navisworks required.', metric: '2 min vs 2 days' },
  { icon: '📋', title: 'Permit-Ready in Hours', desc: 'AI pre-checks your set against IBC 2021, ADA, NFPA 101, Title 24/IECC and generates a submission checklist per jurisdiction.', metric: '73% fewer rejections' },
  { icon: '🤖', title: 'AI That Reads Your Model', desc: 'Ask in plain English: "Are all structural clashes resolved?" or "Which MEP items are blocking permit?" and get instant answers.', metric: '8 AI specialists' },
  { icon: '📊', title: 'Executive Reports — Instant', desc: 'One click generates a full PDF: clash summary, permit status, open RFIs, schedule risk, budget impact. Board-ready in 30 seconds.', metric: '30 sec vs 4 hrs' },
  { icon: '🔗', title: 'Works With Your Stack', desc: 'Imports Revit, IFC, CAD files. Exports to Word, PDF, Excel. Integrates with Procore, Autodesk BIM 360, Bluebeam.', metric: 'No migration needed' },
  { icon: '💰', title: 'ROI on Day One', desc: 'One avoided permit rejection = $15K–$80K saved (delay + redesign). Most clients recover cost in the first project.', metric: '$15K–$80K per rejection' },
]

// ─── Competitors ─────────────────────────────────────────────────
const COMPETITORS = [
  { name: 'Autodesk BCC / BIM 360', weakness: 'Complex, expensive ($$$), requires Revit ecosystem', our: 'Works with any file, 10× cheaper, AI-native' },
  { name: 'Procore', weakness: 'Project management focus, no real BIM AI', our: 'Deep BIM intelligence, clash + permit AI' },
  { name: 'PermitFlow', weakness: 'Only permits, no BIM coordination', our: 'Full stack: BIM + Permits + AI Reports' },
  { name: 'Buildots', weakness: 'Camera/IoT hardware required, $166M raised', our: 'Software-only, deploy in < 1 day, no hardware' },
  { name: 'ALICE Technologies', weakness: 'Scheduling only, no clash/permit', our: 'Coordination + permits + reporting in one' },
]

// ─── Pricing tiers ────────────────────────────────────────────────
const PRICING = [
  { name: 'Starter', price: 299, unit: '/mo', target: 'Revit Specialist, CAD Drafter', features: ['3 projects', 'Clash detection (unlimited)', 'Permit checklist', 'AI reports (10/mo)', 'PDF export'], color: '#534AB7', bg: '#F0EEFF' },
  { name: 'Pro', price: 699, unit: '/mo', target: 'BIM Coordinator, Permit Tech', features: ['10 projects', 'Everything in Starter', 'RFI auto-draft', 'Construction docs (CSI)', 'API access', 'Priority support'], color: BRAND.primary, bg: BRAND.light, recommended: true },
  { name: 'Team', price: 1499, unit: '/mo', target: 'Construction PM, GC', features: ['Unlimited projects', 'Everything in Pro', 'EVM analytics dashboard', 'Multi-user (10 seats)', 'White-label reports', 'Dedicated onboarding'], color: BRAND.success, bg: '#E6F4ED' },
]

// ─── Beachhead markets ────────────────────────────────────────────
const BEACHHEAD = [
  { state: 'Texas', city: 'Dallas / Austin / Houston', why: '#1 residential construction market, 40K+ permits/yr, BIM adoption growing fast', icon: '🤠', priority: 1 },
  { state: 'Florida', city: 'Miami / Orlando / Tampa', why: 'Hurricane resilience code = complex permits, high rejection rates, premium willingness', icon: '🌴', priority: 2 },
  { state: 'Arizona', city: 'Phoenix / Scottsdale', why: 'Fastest-growing metro, massive residential pipeline, underserved tech market', icon: '🌵', priority: 3 },
  { state: 'Georgia', city: 'Atlanta', why: 'Major commercial + residential boom, strong GC ecosystem', icon: '🍑', priority: 4 },
  { state: 'North Carolina', city: 'Charlotte / Raleigh', why: 'Tech corridor migration driving residential demand, early BIM adopters', icon: '🌲', priority: 5 },
]

// ─── Messaging by channel ─────────────────────────────────────────
const MESSAGES = [
  {
    channel: 'LinkedIn Cold DM',
    target: 'BIM Coordinator',
    copy: `Hi [Name], I noticed [Company] is working on [Project]. We built Atlas — an AI that detects BIM clashes, pre-checks permit submissions, and writes your weekly coordination report automatically.\n\nMost BIM teams cut their clash review time by 80% in the first week.\n\nWorth a 15-min demo?`,
  },
  {
    channel: 'Cold Email — Subject Line',
    target: 'Permit Technician',
    copy: `Subject: [Company] — cut permit rejection risk before your next submittal\n\nHi [Name], permit rejections in [City] cost an average of $40K in delays.\n\nWe pre-check your permit set against IBC 2021, ADA, NFPA, and [jurisdiction] local amendments — automatically — before you submit.\n\nCan I show you a 10-minute demo this week?`,
  },
  {
    channel: 'Website Hero CTA',
    target: 'All personas',
    copy: `Upload your IFC/RVT file →\nGet clash report + permit readiness score in 2 minutes.\nNo signup required for the first project.`,
  },
  {
    channel: 'Demo Call Opening',
    target: 'Construction PM',
    copy: `"Before I start the demo, tell me — what's your biggest BIM coordination headache right now? Is it clashes blocking permit, or is it the time it takes to generate executive reports?"\n\n[Listen → then demo the exact feature that solves their pain first]`,
  },
]

// ─── Component ───────────────────────────────────────────────────
export default function USBrand() {
  const router = useRouter()
  const [tab, setTab] = useState<'brand'|'icp'|'value'|'compete'|'pricing'|'market'|'messaging'>('brand')
  const [selectedTagline, setSelectedTagline] = useState(0)

  // ── Supabase live data (fallback to hardcoded arrays) ──
  const [taglines, setTaglines] = useState(TAGLINES)
  const [personas, setPersonas] = useState(PERSONAS)
  const [valueProps, setValueProps] = useState(VALUE_PROPS)
  const [competitors, setCompetitors] = useState(COMPETITORS)
  const [pricing, setPricing] = useState(PRICING)

  const loadBrandAssets = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    const { data } = await sb.from('brand_assets').select('*').order('created_at', { ascending: true })
    if (!data || data.length === 0) return

    const tl = data.filter((d: any) => d.tipo === 'tagline')
    if (tl.length > 0) setTaglines(tl.map((d: any) => ({ line: d.conteudo, score: d.score || 90, why: d.descricao || '' })))

    const ps = data.filter((d: any) => d.tipo === 'persona')
    if (ps.length > 0) setPersonas(ps.map((d: any) => {
      const meta = d.metadata || {}
      return {
        icon: meta.icon || '🏗️', name: d.nome || d.conteudo,
        title: meta.title || '', company: meta.company || '',
        location: meta.location || '', pain: meta.pain || [],
        gain: meta.gain || [], budget: meta.budget || '',
        urgency: meta.urgency || 'Medium',
        color: meta.color || BRAND.primary, bg: meta.bg || '#E8F0F9',
      }
    }))

    const vp = data.filter((d: any) => d.tipo === 'value_prop')
    if (vp.length > 0) setValueProps(vp.map((d: any) => ({ icon: d.metadata?.icon || '⚡', title: d.nome || d.conteudo, desc: d.descricao || '', metric: d.metadata?.metric || '' })))

    const cp = data.filter((d: any) => d.tipo === 'competitor')
    if (cp.length > 0) setCompetitors(cp.map((d: any) => {
      const meta = d.metadata || {}
      return { name: d.nome, category: meta.category || '', price: meta.price || '', strengths: meta.strengths || [], weaknesses: meta.weaknesses || [], ourEdge: meta.ourEdge || '' }
    }))

    const pr = data.filter((d: any) => d.tipo === 'pricing')
    if (pr.length > 0) setPricing(pr.map((d: any) => {
      const meta = d.metadata || {}
      return { name: d.nome, price: meta.price || 0, unit: meta.unit || '/mo', target: meta.target || '', features: meta.features || [], color: meta.color || BRAND.primary, bg: meta.bg || '#E8F0F9' }
    }))
  }, [])

  useEffect(() => { loadBrandAssets() }, [loadBrandAssets])

  const TABS = [
    { id: 'brand',     label: '🎨 Brand' },
    { id: 'icp',       label: '👤 ICP' },
    { id: 'value',     label: '💎 Valor' },
    { id: 'compete',   label: '⚔️ Competição' },
    { id: 'pricing',   label: '💰 Pricing' },
    { id: 'market',    label: '🗺️ Mercado' },
    { id: 'messaging', label: '📣 Mensagens' },
  ] as const

  return (
    <>
      <Head><title>US Brand Strategy — Atlas Construction Intelligence</title></Head>
      <div style={{ fontFamily: "'Geist', sans-serif", minHeight: '100vh', background: '#f4f6fa', color: BRAND.text }}>

        {/* Top nav */}
        <div style={{ background: BRAND.dark, padding: '0 24px', display: 'flex', alignItems: 'center', height: 52, gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#8b99a8', cursor: 'pointer', fontSize: 13 }}>← Dashboard</button>
          <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: 15 }}>🌎 Atlas — US Market Strategy</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
                background: tab === t.id ? BRAND.primary : 'transparent',
                border: `1px solid ${tab === t.id ? BRAND.primary : '#30363d'}`,
                color: tab === t.id ? '#fff' : '#8b99a8',
                borderRadius: 6, padding: '4px 11px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

          {/* ── BRAND ───────────────────────────────────────────── */}
          {tab === 'brand' && (
            <div>
              {/* Brand hero */}
              <div style={{
                background: `linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.primary} 100%)`,
                borderRadius: 16, padding: '40px 48px', marginBottom: 24, color: '#fff',
              }}>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', color: BRAND.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
                  Platform Name
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                  Atlas Construction Intelligence
                </div>
                <div style={{ fontSize: 16, color: '#a8c4e0', marginBottom: 24, fontStyle: 'italic' }}>
                  "{taglines[selectedTagline].line}"
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ background: BRAND.accent, color: BRAND.dark, borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>
                    AI-Native
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>
                    BIM Intelligence
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>
                    US Market Ready
                  </div>
                </div>
              </div>

              {/* Taglines */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', marginBottom: 16, border: '1px solid #e0e6ef' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🏷️ Taglines — Escolha a principal</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {taglines.map((t, i) => (
                    <div key={i} onClick={() => setSelectedTagline(i)} style={{
                      padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${selectedTagline === i ? BRAND.primary : '#e0e6ef'}`,
                      background: selectedTagline === i ? BRAND.light : '#fafbfc',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: selectedTagline === i ? BRAND.primary : '#e0e6ef',
                          color: selectedTagline === i ? '#fff' : BRAND.muted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13,
                        }}>{t.score}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: BRAND.text, marginBottom: 2 }}>"{t.line}"</div>
                          <div style={{ fontSize: 11, color: BRAND.muted }}>{t.why}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color palette */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0e6ef', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🎨 Brand Colors</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { name: 'Atlas Blue', hex: BRAND.primary, use: 'Primary CTA, headers' },
                    { name: 'Construction Amber', hex: BRAND.accent, use: 'Highlights, badges' },
                    { name: 'Deep Navy', hex: BRAND.dark, use: 'Dark backgrounds, nav' },
                    { name: 'Sky Mist', hex: BRAND.light, use: 'Light backgrounds' },
                    { name: 'Site Green', hex: BRAND.success, use: 'Success states, PM tier' },
                    { name: 'Steel Gray', hex: BRAND.muted, use: 'Muted text, borders' },
                  ].map(c => (
                    <div key={c.name} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 56, borderRadius: 8, background: c.hex, marginBottom: 8, border: '1px solid rgba(0,0,0,0.08)' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.text }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: BRAND.muted, fontFamily: 'monospace' }}>{c.hex}</div>
                      <div style={{ fontSize: 10, color: BRAND.muted }}>{c.use}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand voice */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0e6ef' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🗣️ Brand Voice</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { attr: 'Confident', desc: 'We make bold claims backed by data. "80% faster" not "potentially faster."' },
                    { attr: 'Technical but Clear', desc: 'We speak BIM fluently but never use jargon unnecessarily. Plain English first.' },
                    { attr: 'Urgency-Aware', desc: 'Construction is deadline-driven. We frame everything around speed and risk reduction.' },
                    { attr: 'Cost-Conscious', desc: 'Every feature ties back to dollars saved or days recovered. Always quantify.' },
                  ].map(v => (
                    <div key={v.attr} style={{ background: BRAND.light, borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: BRAND.primary, marginBottom: 4 }}>{v.attr}</div>
                      <div style={{ fontSize: 12, color: BRAND.text }}>{v.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ICP ─────────────────────────────────────────────── */}
          {tab === 'icp' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>👤 Ideal Customer Profile (ICP)</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>4 personas prioritárias para o mercado americano</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {personas.map(p => (
                  <div key={p.name} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${p.color}33`, overflow: 'hidden' }}>
                    <div style={{ background: p.bg, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ fontSize: 32 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: BRAND.muted }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: BRAND.muted }}>{p.company}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: BRAND.muted }}>Budget</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.budget}</div>
                        <div style={{ fontSize: 10, color: p.urgency === 'Very High' ? '#A32D2D' : p.color, fontWeight: 600 }}>
                          {p.urgency} urgency
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#A32D2D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>😣 Pain Points</div>
                        {p.pain.map((item, i) => (
                          <div key={i} style={{ fontSize: 11, color: BRAND.text, padding: '3px 0', display: 'flex', gap: 6 }}>
                            <span style={{ color: '#A32D2D', flexShrink: 0 }}>✗</span> {item}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.success, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>✅ Gains with Atlas</div>
                        {p.gain.map((item, i) => (
                          <div key={i} style={{ fontSize: 11, color: BRAND.text, padding: '3px 0', display: 'flex', gap: 6 }}>
                            <span style={{ color: BRAND.success, flexShrink: 0 }}>✓</span> {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: '8px 20px 14px', fontSize: 11, color: BRAND.muted }}>
                      📍 Beachhead: {p.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VALUE PROPS ─────────────────────────────────────── */}
          {tab === 'value' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>💎 Proposta de Valor</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>Cada feature com métrica quantificada</div>

              {/* Big statement */}
              <div style={{
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.dark})`,
                borderRadius: 16, padding: '32px 40px', marginBottom: 24, color: '#fff',
              }}>
                <div style={{ fontSize: 13, color: BRAND.accent, fontWeight: 600, marginBottom: 8 }}>Proposta de Valor Central</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>
                  Atlas gives construction teams the AI intelligence to coordinate BIM models, pass permit review, and produce executive reports — 10× faster than manual workflows.
                </div>
                <div style={{ fontSize: 13, color: '#a8c4e0' }}>
                  For mid-size GCs and design firms in the Sun Belt who are drowning in clash reports, permit rejections, and coordination emails.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {valueProps.map(v => (
                  <div key={v.title} style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e0e6ef' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.text, marginBottom: 6 }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: BRAND.muted, lineHeight: 1.5, marginBottom: 12 }}>{v.desc}</div>
                    <div style={{
                      background: BRAND.light, borderRadius: 6, padding: '6px 10px',
                      fontSize: 12, fontWeight: 700, color: BRAND.primary,
                    }}>{v.metric}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMPETE ─────────────────────────────────────────── */}
          {tab === 'compete' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>⚔️ Posicionamento Competitivo</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>Como nos posicionamos vs. concorrentes</div>

              {/* Positioning matrix */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0e6ef', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Matriz de Posicionamento</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: BRAND.dark, color: '#fff' }}>
                      {['Competidor', 'Fraqueza deles', 'Nossa vantagem'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c, i) => (
                      <tr key={c.name} style={{ background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: BRAND.text }}>{c.name}</td>
                        <td style={{ padding: '10px 14px', color: '#A32D2D' }}>{c.weakness}</td>
                        <td style={{ padding: '10px 14px', color: BRAND.success, fontWeight: 500 }}>{c.our}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Differentiation */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0e6ef' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>🥇 Nosso Diferencial Único (Unfair Advantage)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'AI-First Architecture', desc: 'Every feature has Claude at its core — not bolted on. Competitors use AI as a gimmick, we use it as the engine.' },
                    { label: 'Full-Stack (not point solution)', desc: 'BIM + Permits + AI Reports in one platform. Competitors do one thing; we do the entire pre-construction workflow.' },
                    { label: 'Deploy in < 1 Day', desc: 'No hardware, no Revit license required, no 6-month onboarding. Upload IFC file, get results in 2 minutes.' },
                  ].map(d => (
                    <div key={d.label} style={{ background: BRAND.light, borderRadius: 8, padding: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: BRAND.primary, marginBottom: 6 }}>{d.label}</div>
                      <div style={{ fontSize: 12, color: BRAND.text, lineHeight: 1.5 }}>{d.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PRICING ─────────────────────────────────────────── */}
          {tab === 'pricing' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>💰 Estratégia de Pricing</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 24 }}>Três tiers alinhados aos ICPs</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {pricing.map(p => (
                  <div key={p.name} style={{
                    background: '#fff', borderRadius: 16,
                    border: `2px solid ${p.recommended ? p.color : '#e0e6ef'}`,
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {p.recommended && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: p.color, color: '#fff',
                        fontSize: 9, fontWeight: 700, padding: '4px 12px',
                        borderBottomLeftRadius: 8,
                      }}>MOST POPULAR</div>
                    )}
                    <div style={{ background: p.bg, padding: '20px 24px' }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: p.color }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0' }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: BRAND.dark }}>${p.price}</span>
                        <span style={{ fontSize: 13, color: BRAND.muted }}>{p.unit}</span>
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.muted }}>Best for: {p.target}</div>
                    </div>
                    <div style={{ padding: '16px 24px 20px' }}>
                      {p.features.map((f, i) => (
                        <div key={i} style={{ fontSize: 12, color: BRAND.text, padding: '5px 0', display: 'flex', gap: 8 }}>
                          <span style={{ color: p.color }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional pricing notes */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e0e6ef' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📌 Estratégia de Go-to-Market Pricing</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, color: BRAND.text }}>
                  {[
                    { label: 'Free Trial', desc: '1 project free, no credit card — remove friction for first upload' },
                    { label: 'Annual Discount', desc: '20% off annual — drives LTV and reduces churn early' },
                    { label: 'Enterprise Custom', desc: 'For GCs with 20+ seats — custom pricing + SLA + white-label' },
                    { label: 'Partner Referral', desc: '20% rev share for BIM consultants who refer clients' },
                  ].map(n => (
                    <div key={n.label} style={{ background: BRAND.light, borderRadius: 8, padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: BRAND.primary, marginBottom: 4 }}>{n.label}</div>
                      <div style={{ color: BRAND.muted }}>{n.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MARKET ──────────────────────────────────────────── */}
          {tab === 'market' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🗺️ Beachhead Market</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>Sun Belt — mercados prioritários para prospecção</div>

              {/* Market size */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'US BIM Market 2024', value: '$2.09B', sub: '13.1% CAGR', color: BRAND.primary },
                  { label: 'Projected 2030', value: '$5.1B', sub: 'Best entry window: now', color: BRAND.success },
                  { label: 'SAM (Sun Belt)', value: '$380M', sub: 'Serviceable market', color: '#B87000' },
                  { label: 'SOM Year 1', value: '$2.4M', sub: '~400 paid seats × $500 avg', color: '#534AB7' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e0e6ef' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.text, marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* States */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BEACHHEAD.map(b => (
                  <div key={b.state} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e0e6ef', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: BRAND.primary, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, flexShrink: 0,
                    }}>#{b.priority}</div>
                    <div style={{ fontSize: 22 }}>{b.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.text }}>{b.state} — {b.city}</div>
                      <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>{b.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MESSAGING ───────────────────────────────────────── */}
          {tab === 'messaging' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>📣 Messaging Framework</div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>Copy pronto para prospecção — LinkedIn, email, demo, site</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {MESSAGES.map(m => (
                  <div key={m.channel} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e6ef', overflow: 'hidden' }}>
                    <div style={{ background: BRAND.light, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.primary }}>{m.channel}</div>
                        <div style={{ fontSize: 11, color: BRAND.muted }}>Target: {m.target}</div>
                      </div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(m.copy)}
                        style={{ background: BRAND.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        📋 Copiar
                      </button>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <pre style={{
                        fontFamily: "'Geist', sans-serif", fontSize: 13, color: BRAND.text,
                        whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6,
                      }}>{m.copy}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
