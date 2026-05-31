import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: string } | null
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

type Proposal = {
  id: string
  proposal_code: string
  title: string
  proposal_type: string
  status: string
  version_number: number
  opportunity_id: string | null
  total_value: number | null
  currency_code: string
  valid_until: string | null
  created_at: string
}

export default function CrmProposalsPage() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Proposal[]>([])

  async function load() {
    setLoading(true)
    setError('')
    try {
      if (!token) throw new Error('Bearer token obrigatório para consumir as APIs CRM.')
      const qs = new URLSearchParams({ limit: '100' })
      if (status) qs.set('status', status)
      const res = await fetch(`/api/crm/proposals?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json()) as ApiResponse<Proposal[]>
      if (!res.ok || !json.success) throw new Error(json.error?.message || `Falha HTTP ${res.status}`)
      setItems(json.data ?? [])
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar propostas')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>CRM Proposals | Apex</title>
      </Head>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>CRM · Proposals</h1>
        <p style={{ color: '#9ca3af' }}>Consome <code>/api/crm/proposals</code> com Bearer token.</p>

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
            <option value="viewed">viewed</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="expired">expired</option>
          </select>
          <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            {loading ? 'Carregando...' : 'Carregar'}
          </button>
          <Link href="/crm/proposals/new" style={{ color: '#93c5fd' }}>Nova Proposal</Link>
          <Link href="/crm/contracts" style={{ color: '#93c5fd' }}>Contracts</Link>
        </div>

        {error && <div style={{ padding: 12, borderRadius: 8, background: '#7f1d1d', color: '#fecaca', marginBottom: 16 }}>{error}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0b1220', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              {['Code', 'Title', 'Status', 'Version', 'Opportunity', 'Value', 'Valid Until'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: 10, fontSize: 12, color: '#9ca3af', borderBottom: '1px solid #374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.proposal_code}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.title}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.status}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>v{p.version_number}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.opportunity_id ?? '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.total_value != null ? `${p.currency_code} ${Number(p.total_value).toLocaleString('pt-BR')}` : '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>{p.valid_until || '—'}</td>
              </tr>
            ))}
            {items.length === 0 && !loading && !error && (
              <tr><td colSpan={7} style={{ padding: 14, color: '#9ca3af' }}>Nenhuma proposta carregada.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </>
  )
}

