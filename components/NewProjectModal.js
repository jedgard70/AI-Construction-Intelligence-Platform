import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

const PROJECT_TYPES = [
  { value: 'edificacao_residencial',  label: 'Edificação Residencial' },
  { value: 'edificacao_comercial',    label: 'Edificação Comercial' },
  { value: 'infraestrutura_viaria',   label: 'Infraestrutura Viária' },
  { value: 'infraestrutura_hidrica',  label: 'Infraestrutura Hídrica' },
  { value: 'industrial',              label: 'Industrial' },
  { value: 'outro',                   label: 'Outro' },
]

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Geist', sans-serif",
  },
  modal: {
    background: '#fff', borderRadius: 16, width: 560,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    border: '1px solid #e5e8f0',
  },
  header: {
    padding: '18px 24px', borderBottom: '1px solid #e5e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: 600, color: '#1a1f36' },
  subtitle: { fontSize: 12, color: '#8b93a7', marginTop: 2 },
  body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 600, color: '#5a6282',
    textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    padding: '9px 12px', border: '1px solid #e5e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    color: '#1a1f36', background: '#f8f9fc', outline: 'none',
    transition: 'border-color 0.15s',
  },
  select: {
    padding: '9px 12px', border: '1px solid #e5e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    color: '#1a1f36', background: '#f8f9fc', outline: 'none',
    cursor: 'pointer',
  },
  footer: {
    padding: '16px 24px', borderTop: '1px solid #e5e8f0',
    display: 'flex', justifyContent: 'flex-end', gap: 10,
  },
  btnCancel: {
    padding: '9px 20px', border: '1px solid #e5e8f0',
    borderRadius: 8, background: '#fff', color: '#5a6282',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSave: {
    padding: '9px 20px', border: 'none',
    borderRadius: 8, background: '#185FA5', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errBox: {
    padding: '10px 14px', background: '#FCEBEB',
    border: '1px solid #F09595', borderRadius: 8,
    fontSize: 12, color: '#A32D2D',
  },
  okBox: {
    padding: '10px 14px', background: '#EAF3DE',
    border: '1px solid #97C459', borderRadius: 8,
    fontSize: 12, color: '#3B6D11',
  },
}

export default function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', code: '', type: 'edificacao_comercial',
    city: '', state: 'SP',
    start_date: '', end_date_planned: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome do projeto é obrigatório.'); return }
    setLoading(true); setError(''); setSuccess('')

    const sb = getSupabase()
    if (!sb) {
      // Modo demo — simula criação
      setSuccess(`Projeto "${form.name}" criado com sucesso! (modo demo)`)
      setLoading(false)
      setTimeout(() => { onCreated?.(); onClose() }, 1500)
      return
    }

    const { error: err } = await sb.from('projects').insert({
      name:             form.name.trim(),
      code:             form.code.trim() || null,
      type:             form.type,
      city:             form.city.trim() || null,
      state:            form.state || null,
      start_date:       form.start_date || null,
      end_date_planned: form.end_date_planned || null,
      status:           'planejamento',
      budget_planned:   0,
      budget_actual:    0,
      completion_pct:   0,
    })

    if (err) {
      setError('Erro ao criar projeto: ' + err.message)
      setLoading(false)
      return
    }

    setSuccess(`Projeto "${form.name}" criado com sucesso!`)
    setLoading(false)
    setTimeout(() => { onCreated?.(); onClose() }, 1500)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>🏗 Novo Projeto</div>
            <div style={s.subtitle}>Preencha os dados básicos da obra</div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#8b93a7', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={s.body}>

            {error   && <div style={s.errBox}>⚠ {error}</div>}
            {success && <div style={s.okBox}>✅ {success}</div>}

            {/* Nome */}
            <div style={s.field}>
              <label style={s.label}>Nome do projeto *</label>
              <input style={s.input} placeholder="Ex: Edifício Horizonte — Torre A"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            {/* Código e Tipo */}
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Código</label>
                <input style={s.input} placeholder="Ex: OBR-2026-005"
                  value={form.code} onChange={e => set('code', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Tipo</label>
                <select style={s.select} value={form.type}
                  onChange={e => set('type', e.target.value)}>
                  {PROJECT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cidade e Estado */}
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Cidade</label>
                <input style={s.input} placeholder="Ex: São Paulo"
                  value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Estado (UF)</label>
                <select style={s.select} value={form.state}
                  onChange={e => set('state', e.target.value)}>
                  {ESTADOS.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datas */}
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Data de início</label>
                <input style={s.input} type="date"
                  value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Prazo previsto</label>
                <input style={s.input} type="date"
                  value={form.end_date_planned} onChange={e => set('end_date_planned', e.target.value)} />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ ...s.btnSave, opacity: loading ? 0.65 : 1 }}>
              {loading ? 'Salvando...' : '+ Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
