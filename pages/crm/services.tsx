import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: string } | null
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

type Service = {
  id: string
  service_code: string
  name: string
  category: string
  default_currency_code: string
  base_price: number | null
  is_active: boolean
}

export default function CrmServicesPage() {
  const [token, setToken] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      if (!token) throw new Error('Bearer token obrigatório para consumir as APIs CRM.')
      const res = await fetch('/api/crm/services?active=true&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json()) as ApiResponse<Service[]>
      if (!res.ok || !json.success) throw new Error(json.error?.message || `Falha HTTP ${res.status}`)
      setServices(json.data ?? [])
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar serviços')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Service[]>()
    for (const s of services) {
      const key = s.category || 'uncategorized'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(s)
    }
    return [...m.entries()]
  }, [services])

  return (
    <>
      <Head>
        <title>CRM Services | Apex</title>
      </Head>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
        <h1 style={{ marginTop: 0 }}>CRM · Services Catalog</h1>
        <p style={{ color: '#9ca3af' }}>Consome <code>/api/crm/services</code> com Bearer token.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token"
            style={{ flex: 1, minWidth: 280, padding: 10, borderRadius: 8, border: '1px solid #374151', background: '#111827', color: '#f9fafb' }}
          />
          <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            {loading ? 'Carregando...' : 'Carregar'}
          </button>
          <Link href="/crm/proposals" style={{ color: '#93c5fd' }}>Proposals</Link>
          <Link href="/crm/contracts" style={{ color: '#93c5fd' }}>Contracts</Link>
          <Link href="/crm/revenue" style={{ color: '#93c5fd' }}>Revenue</Link>
        </div>

        {error && <div style={{ padding: 12, borderRadius: 8, background: '#7f1d1d', color: '#fecaca', marginBottom: 16 }}>{error}</div>}

        {grouped.length === 0 && !loading && !error && (
          <div style={{ color: '#9ca3af' }}>Nenhum serviço carregado.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {grouped.map(([category, items]) => (
            <section key={category} style={{ border: '1px solid #374151', borderRadius: 12, padding: 14, background: '#0b1220' }}>
              <h3 style={{ marginTop: 0, textTransform: 'capitalize' }}>{category}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((s) => (
                  <li key={s.id} style={{ borderTop: '1px solid #1f2937', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{s.name}</strong>
                      <span style={{ color: '#60a5fa' }}>{s.service_code}</span>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>
                      {s.base_price != null ? `${s.default_currency_code} ${Number(s.base_price).toLocaleString('pt-BR')}` : 'Sem preço base'}
                      {' · '}
                      {s.is_active ? 'Ativo' : 'Inativo'}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  )
}

