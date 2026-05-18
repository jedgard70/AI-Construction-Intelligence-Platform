import { useState } from 'react'
import Head from 'next/head'
import { JuriHeader, JuriNav, Card, Row, Field, ErrorBox, SubmitBtn, ScoreBar, Chip, inputStyle, selectStyle } from './contratos'

const STANDARDS = [
  { key: 'NR_18', label: 'NR-18 — Construção Civil', domain: 'Segurança' },
  { key: 'NR_35', label: 'NR-35 — Trabalho em Altura', domain: 'Segurança' },
  { key: 'NR_10', label: 'NR-10 — Instalações Elétricas', domain: 'Segurança' },
  { key: 'NR_06', label: 'NR-06 — EPI', domain: 'Segurança' },
  { key: 'NR_33', label: 'NR-33 — Espaço Confinado', domain: 'Segurança' },
  { key: 'ISO_45001', label: 'ISO 45001 — SSO', domain: 'Qualidade' },
  { key: 'ISO_9001', label: 'ISO 9001 — Qualidade', domain: 'Qualidade' },
  { key: 'ISO_14001', label: 'ISO 14001 — Ambiental', domain: 'Qualidade' },
  { key: 'ISO_19650', label: 'ISO 19650 — BIM', domain: 'BIM' },
  { key: 'ABNT_NBR_15575', label: 'ABNT NBR 15575 — Desempenho', domain: 'ABNT' },
  { key: 'LGPD', label: 'LGPD — Proteção de Dados', domain: 'Legal' },
  { key: 'SOC_2_Type_II', label: 'SOC 2 Type II — Segurança', domain: 'Legal' },
]

const STATUS_COLOR = { conforme: '#3B6D11', parcialmente_conforme: '#BA7517', nao_conforme: '#A32D2D', informacao_insuficiente: '#6b7490' }
const STATUS_LABEL = { conforme: 'Conforme', parcialmente_conforme: 'Parcial', nao_conforme: 'Não Conforme', informacao_insuficiente: 'Insuf.' }

export default function Compliance() {
  const [form, setForm] = useState({ project_id: '', scope_text: '' })
  const [selected, setSelected] = useState(new Set(STANDARDS.map(s => s.key)))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const toggleStd = (k) => setSelected(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null)
    let scope = {}
    try { scope = JSON.parse(form.scope_text || '{}') } catch { scope = { descricao: form.scope_text } }
    try {
      const resp = await fetch('/api/juridico/compliance/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: form.project_id || `PRJ-${Date.now()}`, scope, standards: [...selected] }),
      })
      const data = await resp.json()
      if (!resp.ok) setError(data.errors?.join('\n') || data.message)
      else setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Compliance · Jurídico · ConstructAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
        <JuriHeader title="Compliance" subtitle="Compliance_Agent" />
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Card title="Projeto">
              <Field label="ID do Projeto">
                <input placeholder="PRJ-2026-001" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} style={inputStyle} />
              </Field>
              <div style={{ marginTop: '12px' }}>
                <Field label="Escopo / Dados do Projeto (JSON ou texto)">
                  <textarea rows={5} placeholder={'{\n  "safety_plan": true,\n  "ppe_documented": false,\n  "workers_trained_nr18": true\n}'} value={form.scope_text} onChange={e => setForm(f => ({ ...f, scope_text: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </Field>
              </div>
            </Card>

            <Card title="Normas a Verificar">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STANDARDS.map(s => (
                  <button key={s.key} onClick={() => toggleStd(s.key)} style={{
                    padding: '4px 10px', borderRadius: '6px', border: '1px solid',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    borderColor: selected.has(s.key) ? '#185FA5' : '#e2e5ed',
                    background: selected.has(s.key) ? '#185FA512' : '#f8f9fc',
                    color: selected.has(s.key) ? '#185FA5' : '#6b7490',
                  }}>{s.label}</button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#a0a8bb', marginTop: '8px' }}>{selected.size} norma(s) selecionada(s)</div>
            </Card>

            {error && <ErrorBox>{error}</ErrorBox>}
            <SubmitBtn loading={loading} onClick={handleSubmit} label="Verificar Compliance" />

            {result && (
              <>
                <ScoreBar score={result.result?.score_compliance} label="Score de Compliance" />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Chip color={STATUS_COLOR[result.result?.resultado_geral] || '#6b7490'}>
                    {STATUS_LABEL[result.result?.resultado_geral] || result.result?.resultado_geral}
                  </Chip>
                </div>

                {result.result?.nao_conformidades_criticas?.length > 0 && (
                  <Card title="Não Conformidades Críticas">
                    {result.result.nao_conformidades_criticas.map((nc, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f0f2f7', fontSize: '12px', color: '#A32D2D' }}>⚠ {nc}</div>
                    ))}
                  </Card>
                )}

                {result.result?.resultados?.map((r, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e5ed', padding: '14px 16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '12px', color: '#1a1f36' }}>{r.standard}</span>
                      <Chip color={STATUS_COLOR[r.status] || '#6b7490'}>{STATUS_LABEL[r.status] || r.status}</Chip>
                      {r.prazo_regularizacao && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#BA7517' }}>Prazo: {r.prazo_regularizacao}</span>}
                    </div>
                    {r.nao_conformidades?.length > 0 && (
                      <ul style={{ margin: '0 0 6px 16px', padding: 0, fontSize: '11px', color: '#A32D2D' }}>
                        {r.nao_conformidades.map((nc, j) => <li key={j}>{nc}</li>)}
                      </ul>
                    )}
                    {r.plano_acao?.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '11px', color: '#3B6D11' }}>
                        {r.plano_acao.map((a, j) => <li key={j}>→ {a}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ width: '220px', flexShrink: 0 }}><JuriNav active="compliance" /></div>
        </div>
      </div>
    </>
  )
}
