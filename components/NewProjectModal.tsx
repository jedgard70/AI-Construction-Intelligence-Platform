'use client'
import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const TIPOS = ['Residencial Unifamiliar', 'Residencial Multifamiliar', 'Comercial', 'Industrial', 'Misto', 'Infraestrutura']
const FASES = ['Concepção', 'Planejamento', 'Fundação', 'Estrutura', 'Acabamento', 'Entrega']

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState(TIPOS[0])
  const [fase, setFase] = useState(FASES[0])
  const [orcamento, setOrcamento] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!nome.trim()) { setError('Nome do projeto é obrigatório'); return }
    setLoading(true)
    const sb = getSupabase()
    if (sb) {
      const { error: err } = await sb.from('projects').insert({
        name: nome,
        type: tipo,
        phase: fase,
        budget: orcamento ? parseFloat(orcamento) : null,
        status: 'active',
      })
      if (err) { setError(err.message); setLoading(false); return }
    }
    onCreated()
    onClose()
  }

  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' },
    title: { fontSize: 18, fontWeight: 700, color: '#0F4C81', marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4, display: 'block' as const },
    input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
      fontSize: 13, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14 },
    select: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
      fontSize: 13, color: '#1a1a2e', background: '#fff', marginBottom: 14, boxSizing: 'border-box' as const },
    btnPrimary: { padding: '11px 24px', background: '#185FA5', color: '#fff', border: 'none',
      borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    btnGhost: { padding: '11px 24px', background: 'transparent', color: '#8b93a7',
      border: '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>🏗️ Novo Projeto</div>

        <label style={s.label}>Nome do Projeto *</label>
        <input style={s.input} placeholder="Ex: Edifício Horizonte — Torre A" value={nome} onChange={e => setNome(e.target.value)} />

        <label style={s.label}>Tipo</label>
        <select style={s.select} value={tipo} onChange={e => setTipo(e.target.value)}>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>

        <label style={s.label}>Fase Atual</label>
        <select style={s.select} value={fase} onChange={e => setFase(e.target.value)}>
          {FASES.map(f => <option key={f}>{f}</option>)}
        </select>

        <label style={s.label}>Orçamento (R$)</label>
        <input style={s.input} type="number" placeholder="Ex: 4500000" value={orcamento} onChange={e => setOrcamento(e.target.value)} />

        {error && <div style={{ fontSize: 12, color: '#e53e3e', marginBottom: 12 }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={s.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : '✓ Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  )
}
