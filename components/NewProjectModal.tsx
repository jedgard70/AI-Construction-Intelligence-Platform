'use client'
import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

interface Props {
  onClose: () => void
  onCreated: (project: ProjectInput) => void
}

export interface ProjectInput {
  id: string
  name: string
  code: string
  type: string
  status: string
  city: string
  state: string
  budget_planned: number
  budget_actual: number
  completion_pct: number
  cpi: number | null
  spi: number | null
  eac: number | null
  esg_score: number | null
  created_at: string
}

const TIPOS = ['Residencial Unifamiliar', 'Residencial Multifamiliar', 'Comercial', 'Industrial', 'Misto', 'Infraestrutura']
const STATUS_OPTS = [
  { v: 'planejamento', l: 'Planejamento' },
  { v: 'em_andamento', l: 'Em andamento' },
  { v: 'atrasado',     l: 'Atrasado' },
  { v: 'pausado',      l: 'Pausado' },
  { v: 'concluido',    l: 'Concluído' },
]
const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const [nome, setNome]           = useState('')
  const [codigo, setCodigo]       = useState(`OBR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`)
  const [tipo, setTipo]           = useState(TIPOS[0])
  const [status, setStatus]       = useState('planejamento')
  const [cidade, setCidade]       = useState('')
  const [estado, setEstado]       = useState('SP')
  const [orcPlan, setOrcPlan]     = useState('')
  const [orcReal, setOrcReal]     = useState('')
  const [avanco, setAvanco]       = useState('0')
  const [cpi, setCpi]             = useState('1.00')
  const [spi, setSpi]             = useState('1.00')
  const [esg, setEsg]             = useState('70')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit() {
    if (!nome.trim()) { setError('Nome do projeto é obrigatório'); return }
    setLoading(true)

    const planned = parseFloat(orcPlan) || 0
    const actual  = parseFloat(orcReal) || 0
    const pct     = parseFloat(avanco)  || 0
    const cpiN    = parseFloat(cpi)     || 1
    const spiN    = parseFloat(spi)     || 1
    const esgN    = parseInt(esg)       || 70
    const eacN    = planned > 0 && cpiN > 0 ? Math.round(planned / cpiN) : null

    const project: ProjectInput = {
      id: crypto.randomUUID(),
      name: nome.trim(),
      code: codigo.trim(),
      type: tipo,
      status,
      city: cidade,
      state: estado,
      budget_planned: planned,
      budget_actual: actual,
      completion_pct: pct,
      cpi: cpiN,
      spi: spiN,
      eac: eacN,
      esg_score: esgN,
      created_at: new Date().toISOString(),
    }

    // Save to Supabase if configured
    const sb = getSupabase()
    if (sb) {
      const { error: err } = await sb.from('projects').insert({
        id: project.id,
        name: project.name,
        code: project.code,
        type: project.type,
        status: project.status,
        city: project.city,
        state: project.state,
        budget_planned: project.budget_planned,
        budget_actual: project.budget_actual,
        completion_pct: project.completion_pct,
        cpi: project.cpi,
        spi: project.spi,
        eac: project.eac,
        esg_score: project.esg_score,
      })
      if (err) {
        setError(`Supabase: ${err.message} — projeto salvo localmente.`)
      }
    }

    // Always save to localStorage (works in demo mode and as offline cache)
    try {
      const existing = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
      localStorage.setItem('atlas_projects', JSON.stringify([project, ...existing]))
    } catch { /* ignore storage errors */ }

    setLoading(false)
    onCreated(project)
    onClose()
  }

  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
      boxShadow: '0 8px 48px rgba(0,0,0,0.22)', maxHeight: '90vh', overflowY: 'auto' as const },
    title: { fontSize: 18, fontWeight: 700, color: '#0F4C81', marginBottom: 20 },
    section: { fontSize: 11, fontWeight: 700, color: '#8b93a7', textTransform: 'uppercase' as const,
      letterSpacing: '0.08em', marginBottom: 10, marginTop: 18, paddingBottom: 4,
      borderBottom: '1px solid #e5e8f0' },
    label: { fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4, display: 'block' as const },
    input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0',
      fontSize: 13, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' as const },
    select: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0',
      fontSize: 13, color: '#1a1a2e', background: '#fff', boxSizing: 'border-box' as const },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
    field: { marginBottom: 12 },
    btnPrimary: { padding: '11px 24px', background: '#185FA5', color: '#fff', border: 'none',
      borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    btnGhost: { padding: '11px 24px', background: 'transparent', color: '#8b93a7',
      border: '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>🏗️ Novo Projeto</div>

        <div style={s.section}>Identificação</div>
        <div style={s.field}>
          <label style={s.label}>Nome do Projeto *</label>
          <input style={s.input} placeholder="Ex: Torre Horizonte — Fase 1" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Código da Obra</label>
            <input style={s.input} value={codigo} onChange={e => setCodigo(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Tipo</label>
            <select style={s.select} value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Status</label>
            <select style={s.select} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Avanço Físico (%)</label>
            <input style={s.input} type="number" min="0" max="100" value={avanco} onChange={e => setAvanco(e.target.value)} />
          </div>
        </div>

        <div style={s.section}>Localização</div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Cidade</label>
            <input style={s.input} placeholder="Ex: São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Estado</label>
            <select style={s.select} value={estado} onChange={e => setEstado(e.target.value)}>
              {STATES.map(st => <option key={st}>{st}</option>)}
            </select>
          </div>
        </div>

        <div style={s.section}>Orçamento & Índices EVM</div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Orçamento Planejado (R$)</label>
            <input style={s.input} type="number" placeholder="Ex: 12400000" value={orcPlan} onChange={e => setOrcPlan(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Custo Real Atual (R$)</label>
            <input style={s.input} type="number" placeholder="Ex: 9800000" value={orcReal} onChange={e => setOrcReal(e.target.value)} />
          </div>
        </div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>CPI (Índice de Custo)</label>
            <input style={s.input} type="number" step="0.01" placeholder="1.00" value={cpi} onChange={e => setCpi(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>SPI (Índice de Prazo)</label>
            <input style={s.input} type="number" step="0.01" placeholder="1.00" value={spi} onChange={e => setSpi(e.target.value)} />
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Score ESG (0–100)</label>
          <input style={s.input} type="number" min="0" max="100" value={esg} onChange={e => setEsg(e.target.value)} />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#BA7517', background: '#FFF3E0', borderRadius: 6,
            padding: '8px 12px', marginBottom: 12 }}>⚠️ {error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button style={s.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : '✓ Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  )
}
