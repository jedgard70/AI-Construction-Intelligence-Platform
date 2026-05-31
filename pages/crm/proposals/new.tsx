import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: string } | null
}

export default function CrmProposalNewPage() {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    opportunity_id: '',
    title: '',
    proposal_type: 'consulting',
    status: 'draft',
    currency_code: 'BRL',
    valid_until: '',
  })

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (!token) throw new Error('Bearer token obrigatório para consumir as APIs CRM.')
      if (!form.opportunity_id.trim()) throw new Error('opportunity_id é obrigatório.')
      if (!form.title.trim()) throw new Error('title é obrigatório.')

      const payload = {
        opportunity_id: form.opportunity_id.trim(),
        title: form.title.trim(),
        proposal_type: form.proposal_type,
        status: form.status,
        currency_code: form.currency_code,
        valid_until: form.valid_until || null,
      }

      const res = await fetch('/api/crm/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as ApiResponse<{ id: string; proposal_code: string }>
      if (!res.ok || !json.success || !json.data) throw new Error(json.error?.message || `Falha HTTP ${res.status}`)
      setSuccess(`Proposal criada: ${json.data.proposal_code} (${json.data.id})`)
    } catch (e: any) {
      setError(e.message || 'Falha ao criar proposal')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #374151',
    background: '#111827',
    color: '#f9fafb',
  }

  return (
    <>
      <Head>
        <title>New Proposal | Apex</title>
      </Head>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>CRM · New Proposal</h1>
        <p style={{ color: '#9ca3af' }}>Consome <code>/api/crm/proposals</code> (POST).</p>

        <form onSubmit={submit} style={{ display: 'grid', gap: 14, background: '#0b1220', border: '1px solid #374151', borderRadius: 12, padding: 16 }}>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>Bearer token</div>
            <input style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token" />
          </label>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>opportunity_id *</div>
            <input style={inputStyle} value={form.opportunity_id} onChange={(e) => updateField('opportunity_id', e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>title *</div>
            <input style={inputStyle} value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>proposal_type</div>
              <input style={inputStyle} value={form.proposal_type} onChange={(e) => updateField('proposal_type', e.target.value)} />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>status</div>
              <input style={inputStyle} value={form.status} onChange={(e) => updateField('status', e.target.value)} />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>currency_code</div>
              <input style={inputStyle} value={form.currency_code} onChange={(e) => updateField('currency_code', e.target.value)} />
            </label>
          </div>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>valid_until</div>
            <input style={inputStyle} type="date" value={form.valid_until} onChange={(e) => updateField('valid_until', e.target.value)} />
          </label>

          {error && <div style={{ padding: 10, borderRadius: 8, background: '#7f1d1d', color: '#fecaca' }}>{error}</div>}
          {success && <div style={{ padding: 10, borderRadius: 8, background: '#064e3b', color: '#a7f3d0' }}>{success}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff' }}>
              {saving ? 'Criando...' : 'Criar Proposal'}
            </button>
            <Link href="/crm/proposals" style={{ color: '#93c5fd', alignSelf: 'center' }}>Voltar para listagem</Link>
          </div>
        </form>
      </main>
    </>
  )
}

