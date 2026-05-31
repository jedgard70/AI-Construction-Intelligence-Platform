import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: string } | null
}

export default function CrmContractNewPage() {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    proposal_id: '',
    title: '',
    status: 'draft',
    currency_code: 'BRL',
    effective_start_date: '',
    effective_end_date: '',
    terms_markdown: '',
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
      if (!form.proposal_id.trim()) throw new Error('proposal_id é obrigatório.')

      const payload = {
        proposal_id: form.proposal_id.trim(),
        title: form.title.trim() || null,
        status: form.status,
        currency_code: form.currency_code,
        effective_start_date: form.effective_start_date || null,
        effective_end_date: form.effective_end_date || null,
        terms_markdown: form.terms_markdown || null,
      }

      const res = await fetch('/api/crm/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as ApiResponse<{ id: string; contract_code: string }>
      if (!res.ok || !json.success || !json.data) throw new Error(json.error?.message || `Falha HTTP ${res.status}`)
      setSuccess(`Contract criado: ${json.data.contract_code || json.data.id}`)
    } catch (e: any) {
      setError(e.message || 'Falha ao criar contract')
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
        <title>New Contract | Apex</title>
      </Head>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>CRM · New Contract</h1>
        <p style={{ color: '#9ca3af' }}>Consome <code>/api/crm/contracts</code> (POST).</p>

        <form onSubmit={submit} style={{ display: 'grid', gap: 14, background: '#0b1220', border: '1px solid #374151', borderRadius: 12, padding: 16 }}>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>Bearer token</div>
            <input style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token" />
          </label>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>proposal_id *</div>
            <input style={inputStyle} value={form.proposal_id} onChange={(e) => updateField('proposal_id', e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>title (opcional)</div>
            <input style={inputStyle} value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>status</div>
              <input style={inputStyle} value={form.status} onChange={(e) => updateField('status', e.target.value)} />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>currency_code</div>
              <input style={inputStyle} value={form.currency_code} onChange={(e) => updateField('currency_code', e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>effective_start_date</div>
              <input style={inputStyle} type="date" value={form.effective_start_date} onChange={(e) => updateField('effective_start_date', e.target.value)} />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: '#9ca3af' }}>effective_end_date</div>
              <input style={inputStyle} type="date" value={form.effective_end_date} onChange={(e) => updateField('effective_end_date', e.target.value)} />
            </label>
          </div>

          <label>
            <div style={{ marginBottom: 6, color: '#9ca3af' }}>terms_markdown</div>
            <textarea style={{ ...inputStyle, minHeight: 120 }} value={form.terms_markdown} onChange={(e) => updateField('terms_markdown', e.target.value)} />
          </label>

          {error && <div style={{ padding: 10, borderRadius: 8, background: '#7f1d1d', color: '#fecaca' }}>{error}</div>}
          {success && <div style={{ padding: 10, borderRadius: 8, background: '#064e3b', color: '#a7f3d0' }}>{success}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff' }}>
              {saving ? 'Criando...' : 'Criar Contract'}
            </button>
            <Link href="/crm/contracts" style={{ color: '#93c5fd', alignSelf: 'center' }}>Voltar para listagem</Link>
          </div>
        </form>
      </main>
    </>
  )
}

