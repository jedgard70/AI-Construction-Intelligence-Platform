import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const CONTRACT_TYPES = [
  { value: 'empreitada', label: 'Empreitada' },
  { value: 'fornecimento', label: 'Fornecimento' },
  { value: 'prestacao_servicos', label: 'Prestação de Serviços' },
  { value: 'compra_venda_imovel', label: 'Compra e Venda de Imóvel' },
  { value: 'investimento_imobiliario', label: 'Investimento Imobiliário' },
  { value: 'locacao', label: 'Locação' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'outro', label: 'Outro' },
]

const SEV_COLOR = { alto: '#A32D2D', medio: '#BA7517', baixo: '#3B6D11' }
const REC_COLOR = { aprovar: '#3B6D11', revisar_clausulas: '#BA7517', rejeitar: '#A32D2D' }
const REC_LABEL = { aprovar: 'Aprovar', revisar_clausulas: 'Revisar Cláusulas', rejeitar: 'Rejeitar' }

export default function AnalisarContrato() {
  const [form, setForm] = useState({ contract_type: 'empreitada', input_mode: 'text' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null)
    const body = {
      contract_id: `CTR-${Date.now()}`,
      project_id: form.project_id || 'PRJ-MANUAL',
      contract_type: form.contract_type,
      ...(form.input_mode === 'text' ? { contract_text: form.contract_text } : { document_url: form.document_url }),
    }
    try {
      const resp = await fetch('/api/juridico/contratos/analisar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await resp.json()
      if (!resp.ok) setError(data.errors?.join('\n') || data.message)
      else setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Análise de Contrato · Jurídico · ConstructAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
        <JuriHeader title="Análise de Contrato" subtitle="Document_Intelligence_AI" />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Card title="Dados do Contrato">
              <Row>
                <Field label="Tipo de Contrato" required>
                  <select value={form.contract_type} onChange={e => set('contract_type', e.target.value)} style={selectStyle}>
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="ID do Projeto">
                  <input placeholder="PRJ-2026-001" value={form.project_id || ''} onChange={e => set('project_id', e.target.value)} style={inputStyle} />
                </Field>
              </Row>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {[['text', 'Colar texto'], ['url', 'URL do PDF']].map(([m, l]) => (
                    <button key={m} onClick={() => set('input_mode', m)} style={{
                      padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      background: form.input_mode === m ? '#185FA5' : '#f0f2f7',
                      color: form.input_mode === m ? '#fff' : '#4a5070',
                    }}>{l}</button>
                  ))}
                </div>
                {form.input_mode === 'text' ? (
                  <textarea rows={10} placeholder="Cole o texto do contrato aqui (mínimo 50 caracteres)..." value={form.contract_text || ''} onChange={e => set('contract_text', e.target.value)} style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                ) : (
                  <input placeholder="https://seu-storage.com/contrato.pdf" value={form.document_url || ''} onChange={e => set('document_url', e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                )}
              </div>
            </Card>

            {error && <ErrorBox>{error}</ErrorBox>}

            <SubmitBtn loading={loading} onClick={handleSubmit} label="Analisar Contrato" />

            {result && (
              <>
                <ScoreBar score={result.analysis?.score_risco_geral} label="Score de Risco" reverse />
                <RecomBadge value={result.analysis?.recomendacao_final} map={REC_LABEL} colorMap={REC_COLOR} />

                {result.analysis?.resumo_executivo && (
                  <Card title="Resumo Executivo">
                    <p style={{ fontSize: '13px', color: '#1a1f36', lineHeight: 1.6, margin: 0 }}>{result.analysis.resumo_executivo}</p>
                  </Card>
                )}

                {result.analysis?.clausulas_criticas?.length > 0 && (
                  <Card title={`Cláusulas Críticas (${result.analysis.clausulas_criticas.length})`}>
                    {result.analysis.clausulas_criticas.map((c, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${SEV_COLOR[c.risco] || '#e2e5ed'}`, paddingLeft: '12px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                          <Chip color={SEV_COLOR[c.risco]}>{c.risco?.toUpperCase()}</Chip>
                          <Chip color="#6b7490">{c.tipo}</Chip>
                        </div>
                        <div style={{ fontSize: '12px', color: '#1a1f36', fontWeight: 600 }}>{c.descricao}</div>
                        {c.recomendacao && <div style={{ fontSize: '11px', color: '#6b7490', marginTop: '3px' }}>→ {c.recomendacao}</div>}
                      </div>
                    ))}
                  </Card>
                )}

                {result.analysis?.riscos_juridicos?.length > 0 && (
                  <Card title={`Riscos Jurídicos (${result.analysis.riscos_juridicos.length})`}>
                    {result.analysis.riscos_juridicos.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f0f2f7' }}>
                        <Chip color={SEV_COLOR[r.severidade]}>{r.severidade?.toUpperCase()}</Chip>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#1a1f36', fontWeight: 600 }}>{r.risco}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {r.base_legal && <span style={{ fontSize: '10px', color: '#6b7490' }}>{r.base_legal}</span>}
                            {r.categoria && <Chip color="#185FA5">{r.categoria.replace(/_/g, ' ')}</Chip>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}

                {result.analysis?.checklist_conformidade && (
                  <Card title="Checklist de Conformidade">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {Object.entries(result.analysis.checklist_conformidade).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: val ? '#3B6D11' : '#A32D2D' }}>
                          <span style={{ fontSize: '13px' }}>{val ? '✓' : '✗'}</span>
                          <span>{key.replace(/^tem_|^menciona_/, '').replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {result.analysis?.alertas_vencimento?.length > 0 && (
                  <Card title={`Alertas de Prazo (${result.analysis.alertas_vencimento.length})`}>
                    {result.analysis.alertas_vencimento.map((a, i) => {
                      const urgColor = { critico: '#A32D2D', atencao: '#BA7517', informativo: '#185FA5' }
                      return (
                        <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid #f0f2f7', alignItems: 'flex-start' }}>
                          <Chip color={urgColor[a.urgencia] || '#6b7490'}>{a.urgencia?.toUpperCase()}</Chip>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1f36' }}>{a.item}</div>
                            <div style={{ fontSize: '11px', color: '#6b7490' }}>{a.prazo_descrito}</div>
                          </div>
                        </div>
                      )
                    })}
                  </Card>
                )}

                {result.analysis?.pontos_de_atencao?.length > 0 && (
                  <Card title="Pontos de Atenção">
                    {result.analysis.pontos_de_atencao.map((p, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#1a1f36', padding: '5px 0', borderBottom: '1px solid #f0f2f7', lineHeight: 1.5 }}>
                        · {p}
                      </div>
                    ))}
                  </Card>
                )}

                {result.analysis?.inconsistencias?.length > 0 && (
                  <Card title="Inconsistências">
                    {result.analysis.inconsistencias.map((inc, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#A32D2D', padding: '5px 0', borderBottom: '1px solid #f0f2f7' }}>
                        ⚠ {inc}
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}
          </div>

          <div style={{ width: '220px', flexShrink: 0 }}>
            <JuriNav active="contratos" />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────
export function JuriHeader({ title, subtitle }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e2e5ed', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
      <Link href="/dashboard" style={{ color: '#6b7490', fontSize: '13px', textDecoration: 'none' }}>← Dashboard</Link>
      <span style={{ color: '#e2e5ed' }}>|</span>
      <span style={{ fontSize: '11px', color: '#a0a8bb' }}>Jurídico</span>
      <span style={{ color: '#e2e5ed' }}>›</span>
      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1f36' }}>{title}</span>
      {subtitle && <span style={{ fontSize: '11px', color: '#185FA5', background: '#185FA510', borderRadius: '6px', padding: '2px 8px', marginLeft: '4px' }}>{subtitle}</span>}
    </header>
  )
}

export function JuriNav({ active }) {
  const items = [
    { key: 'contratos', href: '/juridico/contratos', icon: '🔍', label: 'Analisar Contrato' },
    { key: 'compliance', href: '/juridico/compliance', icon: '✅', label: 'Compliance' },
    { key: 'due-diligence', href: '/juridico/due-diligence', icon: '📊', label: 'Due Diligence' },
    { key: 'assinatura', href: '/juridico/assinatura', icon: '✍️', label: 'Assinatura Digital' },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '12px', marginBottom: '12px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#a0a8bb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Módulo Jurídico</div>
      {items.map(item => (
        <Link key={item.key} href={item.href} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '7px', textDecoration: 'none',
          background: active === item.key ? '#185FA510' : 'transparent',
          color: active === item.key ? '#185FA5' : '#4a5070',
          fontSize: '12px', fontWeight: active === item.key ? 700 : 400,
          marginBottom: '2px',
        }}>
          <span>{item.icon}</span>{item.label}
        </Link>
      ))}
      <div style={{ borderTop: '1px solid #e2e5ed', marginTop: '10px', paddingTop: '10px' }}>
        <Link href="/contratos/novo" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', textDecoration: 'none', color: '#f0a500', fontSize: '12px', fontWeight: 600, background: '#f0a50010' }}>
          <span>📄</span> Novo Contrato
        </Link>
      </div>
    </div>
  )
}

export function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '18px 20px', marginBottom: '16px' }}>
      {title && <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>{title}</div>}
      {children}
    </div>
  )
}

export function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
}

export function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5070', display: 'block', marginBottom: '4px' }}>
        {label}{required && <span style={{ color: '#A32D2D' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

export function ErrorBox({ children }) {
  return <div style={{ background: '#A32D2D10', border: '1px solid #A32D2D30', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#A32D2D', whiteSpace: 'pre-line' }}>{children}</div>
}

export function SubmitBtn({ loading, onClick, label }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#a0a8bb' : '#185FA5', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}>
      {loading ? 'Analisando com IA…' : label}
    </button>
  )
}

export function ScoreBar({ score, label, reverse }) {
  const s = Number(score) || 0
  const color = reverse
    ? s > 66 ? '#A32D2D' : s > 33 ? '#BA7517' : '#3B6D11'
    : s > 66 ? '#3B6D11' : s > 33 ? '#BA7517' : '#A32D2D'
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '14px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#6b7490', marginBottom: '6px' }}>{label}</div>
        <div style={{ height: '6px', background: '#f0f2f7', borderRadius: '3px' }}>
          <div style={{ width: `${s}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color, fontFamily: 'monospace', minWidth: '48px', textAlign: 'right' }}>{s}</div>
    </div>
  )
}

export function RecomBadge({ value, map, colorMap }) {
  if (!value) return null
  const color = colorMap[value] || '#6b7490'
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
      <span style={{ padding: '8px 24px', borderRadius: '20px', background: `${color}18`, color, fontWeight: 700, fontSize: '13px', border: `1px solid ${color}40` }}>
        {map[value] || value}
      </span>
    </div>
  )
}

export function Chip({ color, children }) {
  return <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}15`, borderRadius: '4px', padding: '1px 7px', flexShrink: 0 }}>{children}</span>
}

export const inputStyle = { padding: '8px 11px', border: '1px solid #e2e5ed', borderRadius: '7px', fontSize: '13px', color: '#1a1f36', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }
export const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }
