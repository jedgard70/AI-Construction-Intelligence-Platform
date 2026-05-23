import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getSupabase } from '../lib/supabase'

// ── Constantes ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'reuniao',    label: 'Reunião',         icon: '🤝', color: '#185FA5' },
  { id: 'obra',       label: 'Obra / Campo',    icon: '🏗️', color: '#BA7517' },
  { id: 'projeto',    label: 'Projetos BIM',    icon: '📐', color: '#534AB7' },
  { id: 'relatorio',  label: 'Relatório',       icon: '📋', color: '#3B6D11' },
  { id: 'admin',      label: 'Administrativo',  icon: '🗂️', color: '#5a6282' },
  { id: 'deslocamento',label:'Deslocamento',    icon: '🚗', color: '#A32D2D' },
  { id: 'outro',      label: 'Outro',           icon: '⚙️', color: '#8b93a7' },
]

const PROJECTS = [
  'Vista Tower · Pav. 04',
  'Residencial Aurora',
  'Centro Empresarial Norte',
  'Condomínio Boa Vista',
  'JEDGARD Interna',
  'Sem projeto',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── Utilitários ───────────────────────────────────────────────────────────────
function formatDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`
  if (m > 0) return `${m}min ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function formatClock(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function timeStr(d = new Date()) {
  return d.toTimeString().slice(0, 5)
}

function catInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

function totalSecs(entries) {
  return entries.reduce((a, e) => a + (e.duration_min * 60), 0)
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Jornada() {
  const router = useRouter()

  // Auth
  const [profile, setProfile]       = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Timer (clock-in)
  const [clockedIn, setClockedIn]   = useState(false)
  const [clockStart, setClockStart] = useState(null)   // Date
  const [elapsed, setElapsed]       = useState(0)      // seconds
  const timerRef = useRef(null)

  // Entradas de hoje
  const [entries, setEntries]       = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  // Histórico semanal
  const [weekData, setWeekData]     = useState([])

  // Formulário nova entrada
  const [form, setForm] = useState({
    description: '',
    category: 'obra',
    project: PROJECTS[0],
    duration_min: 60,
    notes: '',
    start_time: timeStr(),
  })
  const [formOpen, setFormOpen]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')

  // Relato diário
  const [reportText, setReportText] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [activeTab, setActiveTab]   = useState('hoje') // 'hoje' | 'semana' | 'relato'

  // ── Autenticação ────────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) { router.replace('/login'); return }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setProfile({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name ?? session.user.email,
      })
      setAuthLoading(false)
    })
  }, [router])

  // ── Carregar entradas do dia ─────────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    if (!profile) return
    setLoadingEntries(true)
    try {
      const sb = getSupabase()
      if (!sb) { setEntries(DEMO_ENTRIES); return }
      const { data, error } = await sb
        .from('work_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('session_date', todayStr())
        .order('created_at', { ascending: false })
      if (error) throw error
      setEntries(data ?? [])
    } catch {
      setEntries(DEMO_ENTRIES) // fallback demo
    }
    setLoadingEntries(false)
  }, [profile])

  // ── Carregar semana ──────────────────────────────────────────────────────────
  const loadWeek = useCallback(async () => {
    if (!profile) return
    try {
      const sb = getSupabase()
      if (!sb) { buildDemoWeek(); return }
      const today = new Date()
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        return d.toISOString().slice(0, 10)
      }).reverse()

      const { data } = await sb
        .from('work_sessions')
        .select('session_date, duration_min, category')
        .eq('user_id', profile.id)
        .in('session_date', days)

      const grouped = days.map(date => {
        const dayEntries = (data ?? []).filter(e => e.session_date === date)
        const mins = dayEntries.reduce((a, e) => a + e.duration_min, 0)
        const d = new Date(date + 'T12:00:00')
        return {
          date,
          label: WEEKDAYS[d.getDay()],
          day: d.getDate(),
          mins,
          hours: +(mins / 60).toFixed(1),
          isToday: date === todayStr(),
          entries: dayEntries,
        }
      })
      setWeekData(grouped)
    } catch {
      buildDemoWeek()
    }
  }, [profile])

  function buildDemoWeek() {
    const today = new Date()
    const data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const mins = d.getDay() === 0 || d.getDay() === 6 ? 0 : [420, 510, 480, 390, 540, 450][i % 6]
      return {
        date: d.toISOString().slice(0, 10),
        label: WEEKDAYS[d.getDay()],
        day: d.getDate(),
        mins,
        hours: +(mins / 60).toFixed(1),
        isToday: d.toISOString().slice(0, 10) === todayStr(),
        entries: [],
      }
    })
    setWeekData(data)
  }

  useEffect(() => {
    if (profile) { loadEntries(); loadWeek() }
  }, [profile, loadEntries, loadWeek])

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (clockedIn) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - clockStart.getTime()) / 1000))
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [clockedIn, clockStart])

  function handleClockIn() {
    const now = new Date()
    setClockStart(now)
    setElapsed(0)
    setClockedIn(true)
    setForm(f => ({ ...f, start_time: timeStr(now) }))
    setFormOpen(true)
  }

  function handleClockOut() {
    setClockedIn(false)
    const mins = Math.max(1, Math.round(elapsed / 60))
    setForm(f => ({ ...f, duration_min: mins }))
  }

  // ── Salvar entrada ───────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    if (!form.description.trim()) return
    setSaving(true)
    setSaveMsg('')
    try {
      const sb = getSupabase()
      const payload = {
        user_id: profile?.id ?? 'anonymous',
        session_date: todayStr(),
        description: form.description.trim(),
        category: form.category,
        project_name: form.project,
        duration_min: Number(form.duration_min) || 60,
        notes: form.notes.trim(),
        start_time: form.start_time,
        created_at: new Date().toISOString(),
      }
      if (sb) {
        const { error } = await sb.from('work_sessions').insert(payload)
        if (error) throw error
      }
      setSaveMsg('✔ Entrada salva!')
      setFormOpen(false)
      setForm({ description: '', category: 'obra', project: PROJECTS[0],
        duration_min: 60, notes: '', start_time: timeStr() })
      loadEntries()
      loadWeek()
    } catch (err) {
      setSaveMsg('⚠ Erro ao salvar: ' + (err?.message ?? 'verifique o Supabase'))
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 4000)
  }

  // ── Deletar entrada ──────────────────────────────────────────────────────────
  async function handleDelete(id) {
    const sb = getSupabase()
    if (sb) await sb.from('work_sessions').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    loadWeek()
  }

  // ── Relato diário ────────────────────────────────────────────────────────────
  async function handleSendReport() {
    if (!reportText.trim()) return
    setSaving(true)
    try {
      const sb = getSupabase()
      if (sb) {
        await sb.from('daily_reports').upsert({
          user_id: profile?.id ?? 'anonymous',
          report_date: todayStr(),
          summary: reportText.trim(),
          total_hours: +(totalSecs(entries) / 3600).toFixed(2),
          entry_count: entries.length,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,report_date' })
      }
      setReportSent(true)
    } catch { /* silently fail */ }
    setSaving(false)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#185FA5', fontWeight: 600 }}>Carregando…</span>
    </div>
  )

  // ── Computed ─────────────────────────────────────────────────────────────────
  const totalMins     = Math.round(totalSecs(entries) / 60)
  const hoursToday    = (totalMins / 60).toFixed(1)
  const targetHours   = 8
  const progressPct   = Math.min(100, Math.round((totalMins / (targetHours * 60)) * 100))
  const maxWeekHours  = Math.max(8, ...weekData.map(d => d.hours))
  const weekTotalHrs  = weekData.reduce((a, d) => a + d.hours, 0).toFixed(1)
  const catBreakdown  = CATEGORIES.map(c => ({
    ...c, mins: entries.filter(e => e.category === c.id).reduce((a, e) => a + e.duration_min, 0),
  })).filter(c => c.mins > 0).sort((a, b) => b.mins - a.mins)

  return (
    <>
      <Head>
        <title>Jornada de Trabalho · ConstructAI</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7', fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e8f0',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 16px', borderBottom: '1px solid #e5e8f0',
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#185FA5', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff' }}>🏗</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f36' }}>ConstructAI</div>
              <div style={{ fontSize: 9, color: '#8b93a7', letterSpacing: '0.06em' }}>v5.3 ENTERPRISE</div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            {[
              { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
              { icon: '📐', label: 'Plantas BIM', href: '/plantas' },
              { icon: '⏱️', label: 'Jornada', href: '/jornada', active: true },
              { icon: '📊', label: 'Vendas', href: '/vendas' },
              { icon: '✅', label: 'Qualidade', href: '/qualidade' },
              { icon: '⚙️', label: 'BIM-Ops', href: '/bim-ops' },
              { icon: '📁', label: 'Documentos', href: '/documentos' },
            ].map(item => (
              <a key={item.href} href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: item.active ? 600 : 400,
                  color: item.active ? '#185FA5' : '#5a6282',
                  background: item.active ? '#EFF4FF' : 'transparent',
                  marginBottom: 2, transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div style={{ padding: '12px', borderTop: '1px solid #e5e8f0',
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%',
              background: '#EFF4FF', color: '#185FA5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700 }}>
              {(profile?.name ?? 'U').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1f36',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.name ?? 'Usuário'}
              </div>
              <div style={{ fontSize: 10, color: '#8b93a7' }}>Engenheiro</div>
            </div>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e5e8f0',
            padding: '12px 24px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: '#1a1f36', margin: 0 }}>
                ⏱️ Jornada de Trabalho
              </h1>
              <p style={{ fontSize: 11, color: '#8b93a7', margin: 0 }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {saveMsg && (
                <span style={{ fontSize: 12, fontWeight: 600,
                  color: saveMsg.startsWith('✔') ? '#3B6D11' : '#A32D2D' }}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={clockedIn ? handleClockOut : handleClockIn}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: clockedIn ? '#A32D2D' : '#185FA5',
                  color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.2s' }}>
                {clockedIn ? '⏹ Encerrar' : '▶ Registrar entrada'}
              </button>
              <button
                onClick={() => setFormOpen(o => !o)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e8f0',
                  cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  background: '#fff', color: '#5a6282' }}>
                + Adicionar
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* ── Timer ativo ──────────────────────────────────────────── */}
            {clockedIn && (
              <div style={{ background: 'linear-gradient(135deg,#185FA5,#534AB7)',
                borderRadius: 16, padding: '20px 28px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 24, color: '#fff',
                boxShadow: '0 4px 20px rgba(24,95,165,.25)' }}>
                <div style={{ fontSize: 40, fontFamily: 'monospace', fontWeight: 700,
                  letterSpacing: '0.05em', textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
                  {formatClock(elapsed)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>Jornada em andamento</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Entrada às {form.start_time} · {formatDuration(elapsed)} registrados
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={handleClockOut}
                    style={{ padding: '8px 16px', background: 'rgba(255,255,255,.2)',
                      border: '1px solid rgba(255,255,255,.4)', borderRadius: 8,
                      color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                    ⏹ Encerrar jornada
                  </button>
                </div>
              </div>
            )}

            {/* ── KPIs ─────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Horas hoje', value: `${hoursToday}h`, sub: `meta: ${targetHours}h`, color: '#185FA5' },
                { label: 'Registros', value: entries.length, sub: 'lançamentos do dia', color: '#534AB7' },
                { label: 'Semana atual', value: `${weekTotalHrs}h`, sub: 'últimos 7 dias', color: '#3B6D11' },
                { label: 'Progresso', value: `${progressPct}%`, sub: 'da meta diária', color: progressPct >= 100 ? '#3B6D11' : '#BA7517' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 12,
                  padding: '16px 18px', border: '1px solid #e5e8f0' }}>
                  <div style={{ fontSize: 10, color: '#8b93a7', textTransform: 'uppercase',
                    letterSpacing: '0.08em', fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: k.color, margin: '4px 0 2px' }}>
                    {k.value}
                  </div>
                  <div style={{ fontSize: 10, color: '#a0a8bb' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Barra de progresso ──────────────────────────────────── */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px',
              border: '1px solid #e5e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#1a1f36' }}>Meta diária — {targetHours}h</span>
                <span style={{ color: progressPct >= 100 ? '#3B6D11' : '#5a6282', fontWeight: 600 }}>
                  {progressPct}% concluída
                </span>
              </div>
              <div style={{ height: 10, background: '#f4f5f7', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`,
                  background: progressPct >= 100
                    ? 'linear-gradient(90deg,#3B6D11,#52a717)'
                    : 'linear-gradient(90deg,#185FA5,#534AB7)',
                  borderRadius: 99, transition: 'width 0.5s' }}/>
              </div>
              {catBreakdown.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {catBreakdown.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                      <span style={{ color: '#5a6282' }}>{c.label}</span>
                      <span style={{ fontWeight: 600, color: '#1a1f36' }}>{(c.mins/60).toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 16,
              background: '#fff', borderRadius: 10, border: '1px solid #e5e8f0',
              padding: 4, width: 'fit-content' }}>
              {[['hoje','📅 Hoje'],['semana','📆 Semana'],['relato','📝 Relato']].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ padding: '6px 16px', borderRadius: 7, border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: activeTab === id ? '#EFF4FF' : 'transparent',
                    color: activeTab === id ? '#185FA5' : '#8b93a7',
                    transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB: Hoje ─────────────────────────────────────────────── */}
            {activeTab === 'hoje' && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f4f5f7',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1f36' }}>
                    Lançamentos de hoje
                  </span>
                  <span style={{ fontSize: 11, color: '#8b93a7' }}>
                    {entries.length} entrada{entries.length !== 1 ? 's' : ''} · {hoursToday}h total
                  </span>
                </div>
                {loadingEntries ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8b93a7', fontSize: 13 }}>
                    Carregando entradas…
                  </div>
                ) : entries.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>⏱️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1f36', marginBottom: 4 }}>
                      Nenhum lançamento hoje
                    </div>
                    <div style={{ fontSize: 12, color: '#8b93a7' }}>
                      Clique em "▶ Registrar entrada" ou "+ Adicionar" para começar
                    </div>
                  </div>
                ) : (
                  <div>
                    {entries.map((entry, idx) => {
                      const cat = catInfo(entry.category)
                      return (
                        <div key={entry.id ?? idx}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 14,
                            padding: '12px 18px',
                            borderBottom: idx < entries.length - 1 ? '1px solid #f4f5f7' : 'none',
                            transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 36, height: 36, borderRadius: 10,
                            background: cat.color + '18', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0 }}>
                            {cat.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center',
                              gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1f36' }}>
                                {entry.description}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px',
                                borderRadius: 99, background: cat.color + '18', color: cat.color }}>
                                {cat.label}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#8b93a7' }}>
                              {entry.project_name && <span>{entry.project_name} · </span>}
                              {entry.start_time && <span>Início {entry.start_time} · </span>}
                              <strong style={{ color: '#5a6282' }}>{entry.duration_min} min</strong>
                              {entry.notes && <span> · {entry.notes}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#185FA5' }}>
                              {entry.duration_min >= 60
                                ? `${Math.floor(entry.duration_min/60)}h${entry.duration_min%60 > 0 ? (entry.duration_min%60)+'min' : ''}`
                                : `${entry.duration_min}min`}
                            </span>
                            {entry.id && (
                              <button onClick={() => handleDelete(entry.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#ccc', fontSize: 14, padding: '2px 4px',
                                  borderRadius: 4, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#A32D2D'}
                                onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                                title="Remover lançamento">✕</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ padding: '10px 18px', background: '#f9faff',
                      display: 'flex', justifyContent: 'space-between',
                      borderTop: '1px solid #e5e8f0', fontSize: 12 }}>
                      <span style={{ color: '#5a6282' }}>Total registrado</span>
                      <strong style={{ color: '#185FA5' }}>{hoursToday}h ({totalMins}min)</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Semana ────────────────────────────────────────────── */}
            {activeTab === 'semana' && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e8f0',
                padding: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f36', marginBottom: 16 }}>
                  Histórico da semana · {weekTotalHrs}h registradas
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
                  {weekData.map(day => {
                    const pct = maxWeekHours > 0 ? (day.hours / maxWeekHours) * 100 : 0
                    return (
                      <div key={day.date} style={{ flex: 1, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700,
                          color: day.hours >= targetHours ? '#3B6D11' : '#8b93a7' }}>
                          {day.hours > 0 ? `${day.hours}h` : '—'}
                        </div>
                        <div style={{ width: '100%', position: 'relative', flex: 1,
                          display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', borderRadius: '6px 6px 0 0', minHeight: 4,
                            height: `${Math.max(4, pct)}%`,
                            background: day.isToday
                              ? 'linear-gradient(180deg,#185FA5,#534AB7)'
                              : day.hours >= targetHours ? '#3B6D11' : '#d4daf0',
                            transition: 'height 0.5s', cursor: 'default' }}
                            title={`${day.label} ${day.day}: ${day.hours}h`}/>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: day.isToday ? '#185FA5' : '#8b93a7',
                            fontWeight: day.isToday ? 700 : 400 }}>{day.label}</div>
                          <div style={{ fontSize: 10, color: '#b0b8c8' }}>{day.day}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(#185FA5,#534AB7)', display: 'inline-block' }}/>
                    Hoje
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#3B6D11', display: 'inline-block' }}/>
                    Meta atingida (≥{targetHours}h)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#d4daf0', display: 'inline-block' }}/>
                    Parcial
                  </span>
                </div>
              </div>
            )}

            {/* ── TAB: Relato ────────────────────────────────────────────── */}
            {activeTab === 'relato' && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e8f0',
                padding: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f36', marginBottom: 4 }}>
                  Relato Diário
                </div>
                <div style={{ fontSize: 11, color: '#8b93a7', marginBottom: 16 }}>
                  Resuma o que foi feito hoje, dificuldades encontradas e próximos passos.
                </div>
                {reportSent ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11' }}>Relato enviado!</div>
                    <div style={{ fontSize: 12, color: '#8b93a7', marginTop: 4 }}>
                      Registrado para {new Date().toLocaleDateString('pt-BR')}
                    </div>
                    <button onClick={() => setReportSent(false)}
                      style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8,
                        border: '1.5px solid #e5e8f0', background: '#fff',
                        cursor: 'pointer', fontSize: 12, color: '#5a6282' }}>
                      Editar relato
                    </button>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={reportText}
                      onChange={e => setReportText(e.target.value)}
                      placeholder={'Exemplo:\n• Reunião com cliente Vista Tower — alinhamento de prazos\n• Revisão de planta A-201, 3 achados BIM corrigidos\n• Próximo passo: enviar RFI formal ao projetista estrutural'}
                      style={{ width: '100%', height: 180, padding: '12px', borderRadius: 10,
                        border: '1.5px solid #e5e8f0', resize: 'vertical',
                        fontFamily: 'inherit', fontSize: 13, color: '#1a1f36',
                        lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#185FA5'}
                      onBlur={e => e.target.style.borderColor = '#e5e8f0'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: '#8b93a7' }}>
                        {hoursToday}h trabalhadas · {entries.length} lançamentos
                      </span>
                      <button onClick={handleSendReport} disabled={saving || !reportText.trim()}
                        style={{ padding: '9px 20px', borderRadius: 8, border: 'none',
                          cursor: saving || !reportText.trim() ? 'default' : 'pointer',
                          background: saving || !reportText.trim() ? '#d4daf0' : '#185FA5',
                          color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {saving ? 'Enviando…' : '📤 Registrar relato'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modal: Adicionar lançamento ────────────────────────────────── */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 16 }}>
          <form onSubmit={handleSave}
            style={{ background: '#fff', borderRadius: 16, padding: 28,
              width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1f36', margin: 0 }}>
                ➕ Novo lançamento
              </h2>
              <button type="button" onClick={() => setFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 20, color: '#a0a8bb', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                Descrição *
              </label>
              <input value={form.description} required
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Revisão planta A-201, reunião com cliente..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#e5e8f0'}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Categoria
                </label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Duração (min)
                </label>
                <input type="number" min={1} max={960} value={form.duration_min}
                  onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#185FA5'}
                  onBlur={e => e.target.style.borderColor = '#e5e8f0'}/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Projeto
                </label>
                <select value={form.project}
                  onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Horário início
                </label>
                <input type="time" value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', boxSizing: 'border-box' }}/>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6282',
                textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                Observações
              </label>
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Resultado, pendências, decisões tomadas..."
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1.5px solid #e5e8f0', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#e5e8f0'}/>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setFormOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8,
                  border: '1.5px solid #e5e8f0', background: '#fff',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#5a6282' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: saving ? '#d4daf0' : '#185FA5',
                  cursor: saving ? 'default' : 'pointer',
                  fontWeight: 700, fontSize: 13, color: '#fff' }}>
                {saving ? 'Salvando…' : '✔ Registrar lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ── Demo fallback (quando Supabase não disponível) ────────────────────────────
const DEMO_ENTRIES = [
  { id: null, description: 'Reunião de alinhamento — Vista Tower Pav. 04',
    category: 'reuniao', project_name: 'Vista Tower · Pav. 04',
    duration_min: 90, start_time: '08:00', notes: 'Definição de RFIs pendentes' },
  { id: null, description: 'Revisão e análise de planta A-201 (BIM)',
    category: 'projeto', project_name: 'Vista Tower · Pav. 04',
    duration_min: 150, start_time: '09:30', notes: '3 achados de alta severidade identificados' },
  { id: null, description: 'Vistoria técnica em campo — Bloco A',
    category: 'obra', project_name: 'Residencial Aurora',
    duration_min: 120, start_time: '13:00', notes: 'Acompanhamento concretagem pilares' },
  { id: null, description: 'Elaboração de RDO e relatório de progresso',
    category: 'relatorio', project_name: 'Residencial Aurora',
    duration_min: 60, start_time: '15:30', notes: '' },
]
