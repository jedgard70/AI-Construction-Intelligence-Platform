import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PrintShareModal from '../components/PrintShareModal'
import { getSupabase } from '../lib/supabase'

const CONDICOES = ['Ensolarado', 'Nublado', 'Chuvoso', 'Parcialmente nublado']
const TURNOS = ['Manhã (07h–12h)', 'Tarde (12h–17h)', 'Noturno (17h–22h)']

const DEFAULT_PROJECTS = [
  { id: 'horizonte', name: 'Edifício Horizonte — Torre A' },
  { id: 'industrial', name: 'Complexo Industrial Norte' },
  { id: 'valeverde', name: 'Condomínio Vale Verde' },
]

interface RdoReport {
  id: string
  project_name: string
  data_relatorio: string
  clima: string
  responsavel: string
  equipe_count: number
  atividades: string
  ocorrencias: string
  materiais: string
  equipamentos: string
  progresso_pct: number
  status: string
  created_at: string
}

interface AtlasProject { id: string; name: string; code?: string }

export default function RDOPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState<AtlasProject[]>(DEFAULT_PROJECTS)
  const [history, setHistory] = useState<RdoReport[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [form, setForm] = useState({
    projeto: DEFAULT_PROJECTS[0].id,
    data: new Date().toISOString().split('T')[0],
    turno: 'Manhã (07h–12h)',
    clima: 'Ensolarado',
    efetivo_proprio: '',
    efetivo_terceiro: '',
    atividades: '',
    ocorrencias: '',
    equipamentos: '',
    materiais: '',
    observacoes: '',
    responsavel: '',
    progresso: '',
  })
  const [errors, setErrors] = useState<{ atividades?: string; responsavel?: string }>({})

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    const sb = getSupabase()
    if (sb) {
      const { data } = await sb.from('rdo_reports').select('*').order('data_relatorio', { ascending: false }).limit(20)
      if (data) setHistory(data)
    }
    setLoadingHistory(false)
  }, [])

  useEffect(() => {
    // Load projects from Supabase or localStorage fallback
    const sb = getSupabase()
    if (sb) {
      sb.from('projects').select('id, name, code').then(({ data }) => {
        if (data && data.length > 0) {
          setProjects(data)
          setForm(f => ({ ...f, projeto: data[0].id }))
        }
      })
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('atlas_projects') || '[]') as AtlasProject[]
        if (stored.length > 0) {
          setProjects(stored)
          setForm(f => ({ ...f, projeto: stored[0].id }))
        }
      } catch {}
    }
    loadHistory()
  }, [loadHistory])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const projetoNome = projects.find(p => p.id === form.projeto)?.name ?? form.projeto
  const dataFmt = form.data ? new Date(form.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''

  function buildHtml() {
    return `
<h1>📋 Relatório Diário de Obra (RDO)</h1>
<div class="meta">
  <span>🏗️ ${projetoNome}</span>
  <span>📅 ${dataFmt}</span>
  <span>⏰ ${form.turno}</span>
  <span>🌤️ ${form.clima}</span>
</div>
<h2>Identificação</h2>
<div class="grid3">
  <div class="field"><label>Projeto</label><p>${projetoNome}</p></div>
  <div class="field"><label>Data</label><p>${dataFmt}</p></div>
  <div class="field"><label>Turno</label><p>${form.turno}</p></div>
  <div class="field"><label>Condição Climática</label><p>${form.clima}</p></div>
  <div class="field"><label>Efetivo Próprio</label><p>${form.efetivo_proprio || '—'} pessoas</p></div>
  <div class="field"><label>Efetivo Terceirizado</label><p>${form.efetivo_terceiro || '—'} pessoas</p></div>
</div>
<h2>Atividades Executadas</h2>
<div class="text-area">${form.atividades || '—'}</div>
<h2>Ocorrências e Interferências</h2>
<div class="text-area">${form.ocorrencias || 'Nenhuma ocorrência registrada.'}</div>
<h2>Equipamentos Utilizados</h2>
<div class="text-area">${form.equipamentos || '—'}</div>
<h2>Materiais Aplicados</h2>
<div class="text-area">${form.materiais || '—'}</div>
<h2>Observações Gerais</h2>
<div class="text-area">${form.observacoes || '—'}</div>
<h2>Responsável</h2>
<p><strong>${form.responsavel || '—'}</strong></p>`
  }

  function buildText() {
    const total = (parseInt(form.efetivo_proprio || '0') + parseInt(form.efetivo_terceiro || '0'))
    return [
      '📋 *RELATÓRIO DIÁRIO DE OBRA*',
      'Projeto: ' + projetoNome,
      'Data: ' + dataFmt + ' | Turno: ' + form.turno + ' | Clima: ' + form.clima,
      'Efetivo: ' + total + ' pessoas (' + (form.efetivo_proprio || 0) + ' próprios + ' + (form.efetivo_terceiro || 0) + ' terceiros)',
      '',
      '📌 ATIVIDADES:',
      form.atividades || '—',
      '',
      form.ocorrencias ? '⚠️ OCORRÊNCIAS:
' + form.ocorrencias : '',
      form.observacoes ? '📝 OBSERVAÇÕES:
' + form.observacoes : '',
      '',
      '✍️ Responsável: ' + (form.responsavel || '—'),
    ].filter(l => l !== undefined).join('
')
  }

  async function handleSalvar() {
    const errs: typeof errors = {}
    if (!form.atividades.trim()) errs.atividades = 'Campo obrigatório'
    if (!form.responsavel.trim()) errs.responsavel = 'Campo obrigatório'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      const total = parseInt(form.efetivo_proprio || '0') + parseInt(form.efetivo_terceiro || '0')
      const sb = getSupabase()
      if (sb) {
        await sb.from('rdo_reports').insert({
          project_id: form.projeto !== DEFAULT_PROJECTS[0].id && form.projeto !== DEFAULT_PROJECTS[1].id && form.projeto !== DEFAULT_PROJECTS[2].id ? form.projeto : null,
          project_name: projetoNome,
          data_relatorio: form.data,
          clima: form.clima,
          temperatura: null,
          responsavel: form.responsavel,
          equipe_count: total,
          atividades: form.atividades,
          ocorrencias: form.ocorrencias,
          materiais: form.materiais,
          equipamentos: form.equipamentos,
          progresso_pct: parseInt(form.progresso || '0') || 0,
          status: 'Finalizado',
        })
        await loadHistory()
      }
    } catch {}
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    setShowModal(true)
  }

  const s: Record<string, React.CSSProperties> = {
    page:     { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar:   { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 },
    back:     { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none', background:'none', border:'none', fontFamily:'inherit' },
    body:     { maxWidth:860, margin:'0 auto', padding:'28px 20px' },
    card:     { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12, padding:'20px 22px', marginBottom:16 },
    title:    { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0', textTransform:'uppercase' as const, marginBottom:14 },
    grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 },
    field:    { display:'flex', flexDirection:'column' as const, gap:4 },
    label:    { fontSize:11, fontWeight:600, color:'#5a6282', letterSpacing:'.04em' },
    input:    { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const },
    textarea: { padding:'10px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none', fontFamily:'inherit', width:'100%', resize:'vertical' as const, minHeight:90, boxSizing:'border-box' as const },
    select:   { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8, fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const },
    error:    { fontSize:11, color:'#e53e3e', marginTop:2 },
    btn:      { background:'#185FA5', color:'#fff', border:'none', borderRadius:8, padding:'11px 28px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
    histRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f0f2f7' },
  }

  return (
    <>
      <Head><title>RDO | AI Construction Intelligence</title></Head>
      {showModal && (
        <PrintShareModal
          title={`RDO — ${projetoNome} — ${dataFmt}`}
          htmlContent={buildHtml()}
          textContent={buildText()}
          onClose={() => setShowModal(false)}
        />
      )}
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar</button>
          <div style={{ fontWeight:700, fontSize:15, color:'#1a1f36' }}>📋 RDO — Relatório Diário de Obra</div>
          <div style={{ fontSize:12, color:'#8890a0' }}>Supabase ✓</div>
        </div>

        <div style={s.body}>
          {/* Form */}
          <div style={s.card}>
            <div style={s.title}>Identificação</div>
            <div style={{ ...s.grid3, marginBottom:12 }}>
              <div style={s.field}>
                <label style={s.label}>Projeto *</label>
                <select style={s.select} value={form.projeto} onChange={e => set('projeto', e.target.value)}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Data *</label>
                <input type="date" style={s.input} value={form.data} onChange={e => set('data', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Turno</label>
                <select style={s.select} value={form.turno} onChange={e => set('turno', e.target.value)}>
                  {TURNOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Clima</label>
                <select style={s.select} value={form.clima} onChange={e => set('clima', e.target.value)}>
                  {CONDICOES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Efetivo Próprio</label>
                <input type="number" min="0" style={s.input} value={form.efetivo_proprio} onChange={e => set('efetivo_proprio', e.target.value)} placeholder="0" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Efetivo Terceirizado</label>
                <input type="number" min="0" style={s.input} value={form.efetivo_terceiro} onChange={e => set('efetivo_terceiro', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div style={{ ...s.grid2, marginBottom:12 }}>
              <div style={s.field}>
                <label style={s.label}>Progresso (%)</label>
                <input type="number" min="0" max="100" style={s.input} value={form.progresso} onChange={e => set('progresso', e.target.value)} placeholder="0–100" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Responsável *</label>
                <input style={s.input} value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" />
                {errors.responsavel && <span style={s.error}>{errors.responsavel}</span>}
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.title}>Atividades &amp; Ocorrências</div>
            <div style={{ marginBottom:12 }}>
              <div style={s.field}>
                <label style={s.label}>Atividades Executadas *</label>
                <textarea style={s.textarea} value={form.atividades} onChange={e => set('atividades', e.target.value)} placeholder="Descreva as atividades realizadas..." />
                {errors.atividades && <span style={s.error}>{errors.atividades}</span>}
              </div>
            </div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Ocorrências / Interferências</label>
                <textarea style={s.textarea} value={form.ocorrencias} onChange={e => set('ocorrencias', e.target.value)} placeholder="Registre ocorrências..." />
              </div>
              <div style={s.field}>
                <label style={s.label}>Observações Gerais</label>
                <textarea style={s.textarea} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações adicionais..." />
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.title}>Recursos</div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Equipamentos Utilizados</label>
                <textarea style={s.textarea} value={form.equipamentos} onChange={e => set('equipamentos', e.target.value)} placeholder="Liste equipamentos..." />
              </div>
              <div style={s.field}>
                <label style={s.label}>Materiais Aplicados</label>
                <textarea style={s.textarea} value={form.materiais} onChange={e => set('materiais', e.target.value)} placeholder="Liste materiais..." />
              </div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:32 }}>
            <button style={s.btn} onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar RDO'}
            </button>
          </div>

          {/* History */}
          <div style={s.card}>
            <div style={s.title}>Histórico de RDOs {loadingHistory ? '⏳' : `(${history.length})`}</div>
            {history.length === 0 && !loadingHistory && (
              <p style={{ color:'#8890a0', fontSize:13, textAlign:'center', padding:'16px 0' }}>Nenhum RDO salvo ainda.</p>
            )}
            {history.map(r => (
              <div key={r.id} style={s.histRow}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>{r.project_name}</div>
                  <div style={{ fontSize:12, color:'#8890a0' }}>
                    {new Date(r.data_relatorio + 'T12:00:00').toLocaleDateString('pt-BR')} · {r.clima} · {r.equipe_count} pessoas
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#185FA5' }}>{r.progresso_pct}%</div>
                  <div style={{ fontSize:11, color:'#8890a0' }}>{r.responsavel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
