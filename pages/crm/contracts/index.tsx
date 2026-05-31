import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: string } | null
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

type Contract = {
  id: string
  contract_code: string
  title: string
  status: string
  proposal_id: string | null
  opportunity_id: string | null
  total_value: number | null
  currency_code: string
  signed_at: string | null
  effective_start_date: string | null
}

export default function CrmContractsPage() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Contract[]>([])

  async function load() {
    setLoading(true)
    setError('')
    try {
      if (!token) throw new Error('Bearer token obrigatório para consumir as APIs CRM.')
      const qs = new URLSearchParams({ limit: '100' })
      if (status) qs.set('status', status)
      const res = await fetch(`/api/crm/contracts?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json()) as ApiResponse<Contract[]>
      if (!res.ok || !json.success) throw new Error(json.error?.message || `Falha HTTP ${res.status}`)
      setItems(json.data ?? [])
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar contratos')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>CRM Contracts | Apex</title>
      </Head>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>CRM · Contracts</h1>
        <p style={{ color: '#9ca3af' }}>Consome <code>/api/crm/contracts</code> com Bearer token.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token"
            style={{ flex: 1, minWidth: 280, padding: 10, borderRadius: 8, border: '1px solid #374151', background: '#111827', color: '#f9fafb' }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #374151', background: '#111827', color: '#f9fafb' }}>
            <option value="">Todos os status</option>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="signed">signed</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            {loading ? 'Carregando...' : 'Carregar'}
          </button>
          <Link href="/crm/contracts/new" style={{ color: '#93c5fd' }}>Novo Contract</Link>
          <Link href="/crm/proposals" style={{ color: '#93c5fd' }}>Proposals</Link>
        </div>

        {error && <div style={{ padding: 12, borderRadius: 8, background: '#7f1d1d', color: '#fecaca', marginBottom: 16 }}>{error}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0b1220', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              {['Code', 'Title', 'Status', 'Proposal', 'Opportunity', 'Value', 'Signed At'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: 10, fontSize: 12, color: '#9ca3af', borderBottom: '1px solid #374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.contract_code || '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.title}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.status}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.proposal_id ?? '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.opportunity_id ?? '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.total_value != null ? `${c.currency_code} ${Number(c.total_value).toLocaleString('pt-BR')}` : '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{c.signed_at || '—'}</td>
              </tr>
            ))}
            {items.length === 0 && !loading && !error && (
              <tr><td colSpan={7} style={{ padding: 14, color: '#9ca3af' }}>Nenhum contrato carregado.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </>
  )
}

