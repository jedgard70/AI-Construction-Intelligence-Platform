'use client'
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

// ── Types ──────────────────────────────────────────────────────────────────────

type RevStatus = 'forecast'|'contracted'|'invoiced'|'partially_paid'|'paid'|'overdue'|'cancelled'
type Currency  = 'BRL'|'USD'|'EUR'

interface RevenueRecord {
  id: string
  title: string
  reference_code?: string
  status: RevStatus
  currency: Currency
  amount_forecast: number
  amount_contracted: number
  amount_invoiced: number
  amount_received: number
  expected_close_date?: string
  contract_signed_date?: string
  installments_count: number
  client_id?: string
  project_id?: string
  tags: string[]
  notes?: string
  created_at: string
}

interface DashboardData {
  demo?: boolean
  kpis: {
    forecast:   { amount: number; count: number }
    contracted: { amount: number; count: number }
    invoiced:   { amount: number; count: number }
    received:   { amount: number; count: number }
    overdue:    { amount: number; count: number }
    cancelled:  { amount: number; count: number }
  }
  conversion: {
    forecast_to_contracted: number
    contracted_to_invoiced: number
    invoiced_to_paid: number
  }
  by_status: { status: string; count: number; total: number }[]
  upcoming_installments: any[]
  overdue_installments: any[]
  generated_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<RevStatus, string> = {
  forecast:       'Forecast',
  contracted:     'Contratado',
  invoiced:       'Faturado',
  partially_paid: 'Parc. Pago',
  paid:           'Pago',
  overdue:        'Em Atraso',
  cancelled:      'Cancelado',
}
const STATUS_COLORS: Record<RevStatus, string> = {
  forecast:       '#6366f1',
  contracted:     '#3b82f6',
  invoiced:       '#f59e0b',
  partially_paid: '#8b5cf6',
  paid:           '#10b981',
  overdue:        '#ef4444',
  cancelled:      '#6b7280',
}

const fmt = (n: number, currency: Currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n)

const fmtDate = (d?: string) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

function demoToken() { return 'demo-token-acip' }

// ── Local storage helpers (modo demo sem Supabase) ─────────────────────────────

const LS_KEY = 'atlas_revenue_records'

function loadLocalRecords(): RevenueRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLocalRecords(records: RevenueRecord[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(records)) } catch {}
}

// ── Blank form ─────────────────────────────────────────────────────────────────

const BLANK: Partial<RevenueRecord> = {
  title: '', reference_code: '', status: 'forecast', currency: 'BRL',
  amount_forecast: 0, amount_contracted: 0, amount_invoiced: 0, amount_received: 0,
  installments_count: 1, tags: [], notes: '',
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, amount, count, color, currency = 'BRL' }: {
  label: string; amount: number; count: number; color: string; currency?: Currency
}) {
  return (
    <div style={{
      background: '#111827', border: `1px solid ${color}33`,
      borderRadius: 12, padding: '20px 24px', minWidth: 160, flex: '1 1 160px',
    }}>
      <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>
        {fmt(amount, currency)}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{count} registro{count !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RevStatus }) {
  const color = STATUS_COLORS[status] || '#6b7280'
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

// ── Modal: Add/Edit Revenue Record ────────────────────────────────────────────

function RecordModal({
  record, onClose, onSaved,
}: {
  record: Partial<RevenueRecord> | null
  onClose: () => void
  onSaved: (r: RevenueRecord) => void
}) {
  const [form, setForm] = useState<Partial<RevenueRecord>>(record ?? { ...BLANK })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!record?.id

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title?.trim()) { setErr('Título obrigatório'); return }
    setSaving(true); setErr('')

    try {
      if (isEdit) {
        const res = await fetch(`/api/crm/revenue/${record!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${demoToken()}` },
          body: JSON.stringify(form),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        onSaved({ ...record, ...form, ...json.data } as RevenueRecord)
      } else {
        const res = await fetch('/api/crm/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${demoToken()}` },
          body: JSON.stringify(form),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        onSaved(json.data as RevenueRecord)
      }
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
    color: '#f9fafb', padding: '8px 12px', width: '100%', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }
  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#0d1117', border: '1px solid #21262d', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 680, maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f9fafb', margin: 0, fontSize: 18 }}>
            {isEdit ? 'Editar Receita' : 'Nova Receita'}
          </h2>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <div>
          <label style={lbl}>Título *</label>
          <input style={inp} value={form.title || ''} onChange={e => set('title', e.target.value)} />
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>Código de Referência</label>
            <input style={inp} placeholder="REV-2026-001" value={form.reference_code || ''}
              onChange={e => set('reference_code', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={e => set('status', e.target.value as RevStatus)}>
              {(Object.keys(STATUS_LABELS) as RevStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>Moeda</label>
            <select style={inp} value={form.currency} onChange={e => set('currency', e.target.value as Currency)}>
              <option value="BRL">BRL — Real</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Nº de Parcelas</label>
            <input style={inp} type="number" min={1} max={360} value={form.installments_count || 1}
              onChange={e => set('installments_count', parseInt(e.target.value) || 1)} />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>Valor Forecast</label>
            <input style={inp} type="number" min={0} step={0.01} value={form.amount_forecast || 0}
              onChange={e => set('amount_forecast', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={lbl}>Valor Contratado</label>
            <input style={inp} type="number" min={0} step={0.01} value={form.amount_contracted || 0}
              onChange={e => set('amount_contracted', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>Valor Faturado</label>
            <input style={inp} type="number" min={0} step={0.01} value={form.amount_invoiced || 0}
              onChange={e => set('amount_invoiced', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={lbl}>Valor Recebido</label>
            <input style={inp} type="number" min={0} step={0.01} value={form.amount_received || 0}
              onChange={e => set('amount_received', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>Previsão de Fechamento</label>
            <input style={inp} type="date" value={form.expected_close_date || ''}
              onChange={e => set('expected_close_date', e.target.value || null)} />
          </div>
          <div>
            <label style={lbl}>Data de Assinatura</label>
            <input style={inp} type="date" value={form.contract_signed_date || ''}
              onChange={e => set('contract_signed_date', e.target.value || null)} />
          </div>
        </div>

        <div>
          <label style={lbl}>Notas</label>
          <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
            value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
        </div>

        {err && <div style={{ color: '#ef4444', fontSize: 13 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
            borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13,
          }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#1d4ed8' : '#2563eb', border: 'none', color: '#fff',
            borderRadius: 8, padding: '8px 24px', cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard'|'records'|'overdue'>('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState<RevenueRecord | null>(null)
  const [filterStatus, setFilterStatus] = useState<RevStatus | ''>('')

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/revenue/dashboard', {
        headers: { Authorization: `Bearer ${demoToken()}` },
      })
      const json = await res.json()
      setDashboard(json)
    } catch {}
  }, [])

  const loadRecords = useCallback(async () => {
    try {
      const qs = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`/api/crm/revenue${qs}`, {
        headers: { Authorization: `Bearer ${demoToken()}` },
      })
      const json = await res.json()

      if (json.demo) {
        // Mescla com localStorage
        const local = loadLocalRecords()
        const merged = [...(json.data || []), ...local]
        const seen = new Set<string>()
        setRecords(merged.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true }))
      } else {
        setRecords(json.data || [])
      }
    } catch {}
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    loadDashboard()
    loadRecords()
  }, [loadDashboard, loadRecords])

  function handleSaved(r: RevenueRecord) {
    setShowModal(false); setEditRecord(null)
    // Persiste localmente (modo demo)
    const existing = loadLocalRecords()
    const idx = existing.findIndex(x => x.id === r.id)
    if (idx >= 0) existing[idx] = r; else existing.unshift(r)
    saveLocalRecords(existing)
    loadRecords()
    loadDashboard()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este registro de receita?')) return
    try {
      await fetch(`/api/crm/revenue/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${demoToken()}` },
      })
    } catch {}
    const local = loadLocalRecords().filter(r => r.id !== id)
    saveLocalRecords(local)
    loadRecords()
    loadDashboard()
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    page:  { minHeight: '100vh', background: '#060b14', color: '#e5e7eb', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 0 48px' } as React.CSSProperties,
    header:{ background: '#0d1117', borderBottom: '1px solid #21262d', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
    main:  { maxWidth: 1280, margin: '0 auto', padding: '32px 24px' } as React.CSSProperties,
    tabs:  { display: 'flex', gap: 4, marginBottom: 32 } as React.CSSProperties,
  }

  function Tab({ id, label }: { id: typeof activeTab; label: string }) {
    const active = id === activeTab
    return (
      <button onClick={() => setActiveTab(id)} style={{
        background: active ? '#1d4ed8' : 'transparent',
        border: active ? '1px solid #2563eb' : '1px solid #21262d',
        color: active ? '#fff' : '#9ca3af', borderRadius: 8,
        padding: '7px 20px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
      }}>
        {label}
      </button>
    )
  }

  const filteredRecords = filterStatus
    ? records.filter(r => r.status === filterStatus)
    : records

  return (
    <>
      <Head><title>Revenue Engine — ACIP</title></Head>
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => router.back()} style={{
              background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18,
            }}>←</button>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: 1 }}>CRM / FINANCEIRO</div>
              <h1 style={{ color: '#f9fafb', margin: 0, fontSize: 20, fontWeight: 700 }}>
                Revenue Engine
              </h1>
            </div>
            {dashboard?.demo && (
              <span style={{
                background: '#78350f22', color: '#fbbf24', border: '1px solid #78350f',
                borderRadius: 6, padding: '2px 10px', fontSize: 11,
              }}>
                MODO DEMO
              </span>
            )}
          </div>
          <button onClick={() => { setEditRecord(null); setShowModal(true) }} style={{
            background: '#2563eb', border: 'none', color: '#fff', borderRadius: 8,
            padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            + Nova Receita
          </button>
        </div>

        <div style={S.main}>
          {/* Tabs */}
          <div style={S.tabs}>
            <Tab id="dashboard" label="Dashboard" />
            <Tab id="records"   label={`Registros (${records.length})`} />
            <Tab id="overdue"   label={`Em Atraso (${dashboard?.overdue_installments?.length || 0})`} />
          </div>

          {/* ── TAB: DASHBOARD ────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* KPI Grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <KpiCard label="Forecast"    amount={dashboard?.kpis.forecast.amount   || 0} count={dashboard?.kpis.forecast.count   || 0} color="#6366f1" />
                <KpiCard label="Contratado"  amount={dashboard?.kpis.contracted.amount || 0} count={dashboard?.kpis.contracted.count || 0} color="#3b82f6" />
                <KpiCard label="Faturado"    amount={dashboard?.kpis.invoiced.amount   || 0} count={dashboard?.kpis.invoiced.count   || 0} color="#f59e0b" />
                <KpiCard label="Recebido"    amount={dashboard?.kpis.received.amount   || 0} count={dashboard?.kpis.received.count   || 0} color="#10b981" />
                <KpiCard label="Em Atraso"   amount={dashboard?.kpis.overdue.amount    || 0} count={dashboard?.kpis.overdue.count    || 0} color="#ef4444" />
              </div>

              {/* Funil de Conversão */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
                <h3 style={{ color: '#9ca3af', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 20px' }}>
                  Funil de Conversão
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Forecast → Contratado', value: dashboard?.conversion.forecast_to_contracted, color: '#3b82f6' },
                    { label: 'Contratado → Faturado', value: dashboard?.conversion.contracted_to_invoiced, color: '#f59e0b' },
                    { label: 'Faturado → Pago',       value: dashboard?.conversion.invoiced_to_paid,       color: '#10b981' },
                  ].map((c, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{c.label}</div>
                      <div style={{ background: '#1f2937', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${c.value || 0}%`, background: c.color, height: '100%', transition: 'width 0.6s' }} />
                      </div>
                      <div style={{ fontSize: 13, color: c.color, fontWeight: 700, marginTop: 4 }}>{c.value || 0}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por Status */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
                <h3 style={{ color: '#9ca3af', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 16px' }}>
                  Por Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(dashboard?.by_status || []).filter(s => s.count > 0).map(s => (
                    <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StatusBadge status={s.status as RevStatus} />
                      <div style={{ flex: 1, background: '#1f2937', borderRadius: 4, height: 6 }}>
                        <div style={{
                          width: `${Math.min(100, (s.total / Math.max(...(dashboard?.by_status||[]).map(x=>x.total),1)) * 100)}%`,
                          background: STATUS_COLORS[s.status as RevStatus] || '#6b7280',
                          height: '100%', borderRadius: 4,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 100, textAlign: 'right', fontFamily: 'monospace' }}>
                        {fmt(s.total)}
                      </span>
                      <span style={{ fontSize: 11, color: '#4b5563', minWidth: 24 }}>{s.count}x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximas parcelas */}
              {(dashboard?.upcoming_installments || []).length > 0 && (
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ color: '#9ca3af', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 16px' }}>
                    Parcelas nos Próximos 7 Dias
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ color: '#4b5563', fontSize: 11, borderBottom: '1px solid #1f2937' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Receita</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Parcela</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vencimento</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard!.upcoming_installments.map((inst: any) => (
                        <tr key={inst.id} style={{ borderBottom: '1px solid #111827' }}>
                          <td style={{ padding: '8px 12px', color: '#e5e7eb' }}>{inst.revenue_title}</td>
                          <td style={{ padding: '8px 12px', color: '#9ca3af' }}>#{inst.installment_number}</td>
                          <td style={{ padding: '8px 12px', color: '#f59e0b' }}>{fmtDate(inst.due_date)}</td>
                          <td style={{ padding: '8px 12px', color: '#10b981', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                            {fmt(inst.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: RECORDS ─────────────────────────────────────────────── */}
          {activeTab === 'records' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Filter */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['', ...Object.keys(STATUS_LABELS)] as (RevStatus|'')[]).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s as any)} style={{
                    background: filterStatus === s ? '#1d4ed8' : '#111827',
                    border: `1px solid ${filterStatus === s ? '#2563eb' : '#1f2937'}`,
                    color: filterStatus === s ? '#fff' : '#9ca3af',
                    borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12,
                  }}>
                    {s ? STATUS_LABELS[s as RevStatus] : 'Todos'}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Carregando...</div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ color: '#4b5563', textAlign: 'center', padding: 60, fontSize: 14 }}>
                  Nenhum registro encontrado.<br />
                  <button onClick={() => setShowModal(true)} style={{
                    marginTop: 16, background: '#1d4ed8', border: 'none', color: '#fff',
                    borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13,
                  }}>
                    + Criar primeiro registro
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 120px 100px 130px 130px 130px 130px 80px',
                    gap: 8, padding: '8px 16px',
                    color: '#4b5563', fontSize: 11, letterSpacing: 1,
                  }}>
                    <span>TÍTULO</span><span>STATUS</span><span>MOEDA</span>
                    <span>FORECAST</span><span>CONTRATADO</span><span>FATURADO</span>
                    <span>RECEBIDO</span><span></span>
                  </div>
                  {filteredRecords.map(r => (
                    <div key={r.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 120px 100px 130px 130px 130px 130px 80px',
                      gap: 8, padding: '14px 16px',
                      background: '#0d1117', border: '1px solid #1a2030',
                      borderRadius: 10, alignItems: 'center', fontSize: 13,
                    }}>
                      <div>
                        <div style={{ color: '#e5e7eb', fontWeight: 500 }}>{r.title}</div>
                        {r.reference_code && (
                          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{r.reference_code}</div>
                        )}
                        {r.contract_signed_date && (
                          <div style={{ fontSize: 11, color: '#4b5563' }}>Assinado: {fmtDate(r.contract_signed_date)}</div>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{r.currency}</span>
                      <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 12 }}>{fmt(r.amount_forecast, r.currency)}</span>
                      <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: 12 }}>{fmt(r.amount_contracted, r.currency)}</span>
                      <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: 12 }}>{fmt(r.amount_invoiced, r.currency)}</span>
                      <span style={{ color: '#10b981', fontFamily: 'monospace', fontSize: 12 }}>{fmt(r.amount_received, r.currency)}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditRecord(r); setShowModal(true) }}
                          title="Editar" style={{ background: '#1f2937', border: 'none', color: '#9ca3af', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                          ✎
                        </button>
                        <button onClick={() => handleDelete(r.id)}
                          title="Remover" style={{ background: '#1f2937', border: 'none', color: '#ef4444', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: OVERDUE ─────────────────────────────────────────────── */}
          {activeTab === 'overdue' && (
            <div>
              {(dashboard?.overdue_installments || []).length === 0 ? (
                <div style={{ color: '#10b981', textAlign: 'center', padding: 60, fontSize: 14 }}>
                  ✓ Nenhuma parcela em atraso
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dashboard!.overdue_installments.map((inst: any) => (
                    <div key={inst.id} style={{
                      background: '#1a0a0a', border: '1px solid #ef444433',
                      borderRadius: 10, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    }}>
                      <div>
                        <div style={{ color: '#e5e7eb', fontWeight: 500, fontSize: 14 }}>{inst.revenue_title}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                          Parcela #{inst.installment_number} · Venc: {fmtDate(inst.due_date)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>
                          {fmt(inst.amount)}
                        </div>
                        <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 2 }}>
                          {inst.days_overdue} dia{inst.days_overdue !== 1 ? 's' : ''} em atraso
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RecordModal
          record={editRecord}
          onClose={() => { setShowModal(false); setEditRecord(null) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
