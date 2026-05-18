import { useState } from 'react'
import Head from 'next/head'
import { JuriHeader, JuriNav, Card, Row, Field, ErrorBox, SubmitBtn, ScoreBar, RecomBadge, Chip, inputStyle, selectStyle } from './contratos'

const STAGES = [
  { value: 'pre_lancamento', label: 'Pré-lançamento' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'em_construcao', label: 'Em Construção' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'retrofit', label: 'Retrofit' },
]
const RATING_COLOR = { A: '#3B6D11', B: '#185FA5', C: '#BA7517', D: '#A32D2D' }
const RECOM_COLOR = { investir: '#3B6D11', investir_com_ressalvas: '#185FA5', aguardar_regularizacao: '#BA7517', nao_investir: '#A32D2D' }
const RECOM_LABEL = { investir: 'Investir', investir_com_ressalvas: 'Investir com Ressalvas', aguardar_regularizacao: 'Aguardar Regularização', nao_investir: 'Não Investir' }

export default function DueDiligence() {
  const [form, setForm] = useState({ project_stage: 'em_construcao' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null)
    let project_data = {}
    try { project_data = JSON.parse(form.project_data_text || '{}') } catch { project_data = { descricao: form.project_data_text } }
    const body = {
      project_id: form.project_id || `PRJ-${Date.now()}`,
      investor_id: form.investor_id || `INV-${Date.now()}`,
      project_stage: form.project_stage,
      project_data,
    }
    try {
      const resp = await fetch('/api/juridico/due-diligence/relatorio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await resp.json()
      if (!resp.ok) setError(data.errors?.join('\n') || data.message)
      else setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const r = result?.report

  return (
    <>
      <Head><title>Due Diligence · Jurídico · ConstructAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
        <JuriHeader title="Due Diligence" subtitle="Investment_Analyst_AI" />
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Card title="Identificação">
              <Row>
                <Field label="ID do Projeto"><input placeholder="PRJ-2026-001" value={form.project_id || ''} onChange={e => set('project_id', e.target.value)} style={inputStyle} /></Field>
                <Field label="ID do Investidor"><input placeholder="INV-007" value={form.investor_id || ''} onChange={e => set('investor_id', e.target.value)} style={inputStyle} /></Field>
              </Row>
              <div style={{ marginTop: '12px' }}>
                <Field label="Etapa do Projeto" required>
                  <select value={form.project_stage} onChange={e => set('project_stage', e.target.value)} style={selectStyle}>
                    {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
              </div>
            </Card>
            <Card title="Dados do Projeto (JSON ou texto)">
              <textarea rows={7} placeholder={'{\n  "vgv": "R$ 12M",\n  "expected_roi": 18,\n  "area_m2": 5000,\n  "incorporadora": "Construtora XYZ",\n  "regularidade_cartorio": true\n}'} value={form.project_data_text || ''} onChange={e => set('project_data_text', e.target.value)} style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
            </Card>

            {error && <ErrorBox>{error}</ErrorBox>}
            <SubmitBtn loading={loading} onClick={handleSubmit} label="Gerar Relatório de Due Diligence" />

            {r && (
              <>
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: RATING_COLOR[r.rating] || '#185FA5', lineHeight: 1 }}>{r.rating}</div>
                    <div style={{ fontSize: '10px', color: '#a0a8bb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rating</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ScoreBar score={r.score_due_diligence} label="Score Due Diligence" />
                    <RecomBadge value={r.recomendacao} map={RECOM_LABEL} colorMap={RECOM_COLOR} />
                  </div>
                </div>

                {r.headline && <Card title="Headline"><p style={{ fontSize: '13px', color: '#1a1f36', margin: 0, fontWeight: 600 }}>{r.headline}</p></Card>}

                {r.indicadores_financeiros && (
                  <Card title="Indicadores Financeiros">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {Object.entries(r.indicadores_financeiros).map(([k, v]) => (
                        <div key={k} style={{ background: '#f8f9fc', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', color: '#a0a8bb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{k.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#185FA5' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {r.riscos_identificados?.length > 0 && (
                  <Card title={`Riscos Identificados (${r.riscos_identificados.length})`}>
                    {r.riscos_identificados.map((risco, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f0f2f7' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <Chip color={{ alta: '#A32D2D', media: '#BA7517', baixa: '#3B6D11' }[risco.probabilidade] || '#6b7490'}>{risco.probabilidade?.toUpperCase()}</Chip>
                          <Chip color="#534AB7">{risco.categoria}</Chip>
                        </div>
                        <div style={{ fontSize: '12px', color: '#1a1f36', fontWeight: 600 }}>{risco.risco}</div>
                        {risco.mitigacao && <div style={{ fontSize: '11px', color: '#6b7490', marginTop: '3px' }}>Mitigação: {risco.mitigacao}</div>}
                      </div>
                    ))}
                  </Card>
                )}

                {r.proximos_passos?.length > 0 && (
                  <Card title="Próximos Passos">
                    {r.proximos_passos.map((p, i) => <div key={i} style={{ fontSize: '12px', color: '#1a1f36', padding: '5px 0', borderBottom: '1px solid #f0f2f7' }}>→ {p}</div>)}
                  </Card>
                )}
              </>
            )}
          </div>
          <div style={{ width: '220px', flexShrink: 0 }}><JuriNav active="due-diligence" /></div>
        </div>
      </div>
    </>
  )
}
