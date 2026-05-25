'use client'
import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const SEGMENTOS = ['Incorporadora', 'Construtora', 'Escritório de Arquitetura', 'Engenharia', 'Investidor', 'Proprietário Privado', 'Órgão Público']

export default function NewClientModal({ onClose, onCreated }: Props) {
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [segmento, setSegmento] = useState(SEGMENTOS[0])
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    const sb = getSupabase()
    if (!sb) { setError('Supabase não configurado'); setLoading(false); return }
    const { error: err } = await sb.from('clients').insert({
      nome,
      razao_social: empresa || null,
      segmento,
      email: email || null,
      telefone: telefone || null,
      status: 'ativo',
      tipo: 'pessoa_juridica',
      cpf_cnpj: `cli_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    })
    if (err) { setError(err.message); setLoading(false); return }
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
        <div style={s.title}>👤 Novo Cliente</div>

        <label style={s.label}>Nome Completo *</label>
        <input style={s.input} placeholder="Ex: Carlos Mendes" value={nome} onChange={e => setNome(e.target.value)} />

        <label style={s.label}>Empresa</label>
        <input style={s.input} placeholder="Ex: Mendes Incorporações Ltda" value={empresa} onChange={e => setEmpresa(e.target.value)} />

        <label style={s.label}>Segmento</label>
        <select style={s.select} value={segmento} onChange={e => setSegmento(e.target.value)}>
          {SEGMENTOS.map(seg => <option key={seg}>{seg}</option>)}
        </select>

        <label style={s.label}>E-mail</label>
        <input style={s.input} type="email" placeholder="carlos@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />

        <label style={s.label}>Telefone</label>
        <input style={s.input} placeholder="(11) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />

        {error && <div style={{ fontSize: 12, color: '#e53e3e', marginBottom: 12 }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={s.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : '✓ Adicionar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
