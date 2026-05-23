import { useState } from 'react'
import { getSupabase } from '../../lib/supabase'
import Head from 'next/head'
import { JuriHeader, JuriNav, Card, Row, Field, ErrorBox, SubmitBtn, Chip, inputStyle, selectStyle } from './contratos'

export default function Assinatura() {
  const [tab, setTab] = useState('enviar') // 'enviar' | 'status'
  const [form, setForm] = useState({ signing_type: 'SAME_TIME', expires_in_days: 15 })
  const [signers, setSigners] = useState([{ name: '', email: '', group: '' }])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [statusId, setStatusId] = useState('')
  const [statusResult, setStatusResult] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSigner = (i, k, v) => setSigners(s => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const addSigner = () => setSigners(s => [...s, { name: '', email: '', group: '' }])
  const removeSigner = (i) => setSigners(s => s.filter((_, idx) => idx !== i))

  const handleEnviar = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const resp = await fetch('/api/juridico/assinatura/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: form.contract_id || `CTR-${Date.now()}`,
          project_id: form.project_id || `PRJ-${Date.now()}`,
          title: form.title,
          document_url: form.document_url,
          signers: signers.filter(s => s.name && s.email),
          signing_type: form.signing_type,
          expires_in_days: Number(form.expires_in_days) || 15,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) setError(data.errors?.join('\n') || data.message)
      else {
        setResult(data)
        if (data.lumin?.signature_request_id) setStatusId(data.lumin.signature_request_id)
        // Persist to Supabase
        try {
          const sb = getSupabase()
          if (sb) {
            await sb.from('contracts').insert({
              project_id: form.project_id || null,
              tipo: 'signature_request',
              status: data.lumin?.status || 'pending',
              signature_request_id: data.lumin?.signature_request_id || null,
              parte_nome: signers.filter(s => s.name && s.email).map(s => s.name).join(', '),
            })
          }
        } catch (_) {}
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleStatus = async () => {
    if (!statusId) return
    setLoading(true); setError(null); setStatusResult(null)
    try {
      const resp = await fetch(`/api/juridico/assinatura/status?signature_request_id=${encodeURIComponent(statusId)}`)
      const data = await resp.json()
      if (!resp.ok) setError(data.message)
      else {
        setStatusResult(data)
        // Update contract status in Supabase
        try {
          const sb = getSupabase()
          if (sb && statusId && data.lumin_status) {
            await sb.from('contracts')
              .update({ status: data.lumin_status })
              .eq('signature_request_id', statusId)
          }
        } catch (_) {}
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Assinatura Digital · Jurídico · ConstructAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
        <JuriHeader title="Assinatura Digital" subtitle="Lumin" />
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '6px' }}>
              {[['enviar', '✉️ Enviar para Assinatura'], ['status', '🔍 Consultar Status']].map(([t, l]) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: tab === t ? '#185FA5' : 'transparent', color: tab === t ? '#fff' : '#6b7490' }}>{l}</button>
              ))}
            </div>

            {tab === 'enviar' ? (
              <>
                <Card title="Contrato">
                  <Row>
                    <Field label="Título do Contrato" required>
                      <input placeholder="Contrato de Empreitada — Obra Vila" value={form.title || ''} onChange={e => set('title', e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Nº do Contrato">
                      <input placeholder="CTR-2026-001" value={form.contract_id || ''} onChange={e => set('contract_id', e.target.value)} style={inputStyle} />
                    </Field>
                  </Row>
                  <div style={{ marginTop: '12px' }}>
                    <Field label="URL do PDF do Contrato" required>
                      <input placeholder="https://seu-storage.com/contrato.pdf" value={form.document_url || ''} onChange={e => set('document_url', e.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                  <Row>
                    <div style={{ marginTop: '12px' }}>
                      <Field label="Tipo de Assinatura">
                        <select value={form.signing_type} onChange={e => set('signing_type', e.target.value)} style={selectStyle}>
                          <option value="SAME_TIME">Simultâneo (todos ao mesmo tempo)</option>
                          <option value="ORDER">Sequencial (por ordem)</option>
                        </select>
                      </Field>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <Field label="Validade (dias)">
                        <input type="number" min={1} max={90} value={form.expires_in_days} onChange={e => set('expires_in_days', e.target.value)} style={inputStyle} />
                      </Field>
                    </div>
                  </Row>
                </Card>

                <Card title="Assinantes">
                  {signers.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: form.signing_type === 'ORDER' ? '1fr 1fr 80px 32px' : '1fr 1fr 32px', gap: '8px', marginBottom: '10px', alignItems: 'end' }}>
                      <Field label={i === 0 ? 'Nome' : undefined}>
                        <input placeholder="Nome completo" value={s.name} onChange={e => setSigner(i, 'name', e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label={i === 0 ? 'E-mail' : undefined}>
                        <input type="email" placeholder="email@cliente.com" value={s.email} onChange={e => setSigner(i, 'email', e.target.value)} style={inputStyle} />
                      </Field>
                      {form.signing_type === 'ORDER' && (
                        <Field label={i === 0 ? 'Grupo' : undefined}>
                          <input type="number" min={1} placeholder="1" value={s.group} onChange={e => setSigner(i, 'group', e.target.value)} style={inputStyle} />
                        </Field>
                      )}
                      <button onClick={() => removeSigner(i)} disabled={signers.length === 1} style={{ padding: '8px', background: signers.length === 1 ? '#f0f2f7' : '#A32D2D12', border: 'none', borderRadius: '6px', color: signers.length === 1 ? '#ccc' : '#A32D2D', cursor: signers.length === 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>×</button>
                    </div>
                  ))}
                  <button onClick={addSigner} style={{ padding: '7px 14px', background: '#f4f5f7', border: '1px solid #e2e5ed', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#4a5070', cursor: 'pointer' }}>+ Adicionar Assinante</button>
                </Card>

                {error && <ErrorBox>{error}</ErrorBox>}
                <SubmitBtn loading={loading} onClick={handleEnviar} label="Enviar para Assinatura" />

                {result && (
                  <Card title="Enviado com Sucesso">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7490' }}>ID da Requisição</span>
                        <span style={{ fontFamily: 'monospace', color: '#185FA5', fontWeight: 700 }}>{result.lumin?.signature_request_id}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7490' }}>Status</span>
                        <Chip color="#3B6D11">{result.lumin?.status || 'pending'}</Chip>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7490' }}>Assinantes</span>
                        <span style={{ color: '#1a1f36', fontWeight: 600 }}>{result.signers_count}</span>
                      </div>
                      {result.lumin?.simulated && (
                        <div style={{ background: '#BA751712', borderRadius: '6px', padding: '8px 10px', color: '#BA7517', fontSize: '11px', marginTop: '4px' }}>
                          Modo simulado — configure LUMIN_API_KEY para envio real.
                        </div>
                      )}
                      <button onClick={() => { setTab('status'); setStatusId(result.lumin?.signature_request_id || '') }} style={{ marginTop: '6px', padding: '8px', background: '#185FA510', color: '#185FA5', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Consultar Status →
                      </button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <>
                <Card title="Consultar Status de Assinatura">
                  <Field label="ID da Requisição de Assinatura" required>
                    <input placeholder="SR-xxxxxxxx ou SIM-SR-..." value={statusId} onChange={e => setStatusId(e.target.value)} style={inputStyle} />
                  </Field>
                  <button onClick={handleStatus} disabled={loading || !statusId} style={{ marginTop: '12px', padding: '10px 20px', background: loading || !statusId ? '#a0a8bb' : '#185FA5', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: loading || !statusId ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Consultando…' : 'Consultar'}
                  </button>
                </Card>

                {error && <ErrorBox>{error}</ErrorBox>}

                {statusResult && (
                  <Card title="Status da Assinatura">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7490' }}>ID</span>
                        <span style={{ fontFamily: 'monospace', color: '#1a1f36' }}>{statusResult.signature_request_id}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7490' }}>Status Lumin</span>
                        <Chip color={statusResult.lumin_status === 'completed' ? '#3B6D11' : '#BA7517'}>
                          {statusResult.lumin?.status || statusResult.lumin_status}
                        </Chip>
                      </div>
                      {statusResult.simulated && (
                        <div style={{ background: '#BA751712', borderRadius: '6px', padding: '8px 10px', color: '#BA7517', fontSize: '11px' }}>
                          {statusResult.message}
                        </div>
                      )}
                      {statusResult.lumin && !statusResult.simulated && (
                        <pre style={{ background: '#f8f9fc', borderRadius: '6px', padding: '10px', fontSize: '10px', overflow: 'auto', margin: 0 }}>
                          {JSON.stringify(statusResult.lumin, null, 2)}
                        </pre>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
          <div style={{ width: '220px', flexShrink: 0 }}><JuriNav active="assinatura" /></div>
        </div>
      </div>
    </>
  )
}
