import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PrintShareModal from '../components/PrintShareModal'

const CONDICOES = ['Ensolarado', 'Nublado', 'Chuvoso', 'Parcialmente nublado']
const TURNOS = ['Manhã (07h–12h)', 'Tarde (12h–17h)', 'Noturno (17h–22h)']

interface RDO {
  id: string
  projeto: string
  projetoNome: string
  data: string
  turno: string
  clima: string
  efetivo_proprio: string
  efetivo_terceiro: string
  atividades: string
  ocorrencias: string
  equipamentos: string
  materiais: string
  observacoes: string
  responsavel: string
  savedAt: string
}

interface AtlasProject { id: string; name: string; code?: string }

export default function RDOPage() {
  const router = useRouter()
  const [saving, setSaving]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState<AtlasProject[]>([])
  const [noProjects, setNoProjects] = useState(false)
  const [history, setHistory] = useState<RDO[]>([])
  const [form, setForm] = useState({
    projeto: '',
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
  })
  const [errors, setErrors] = useState<{ atividades?: string; responsavel?: string }>({})

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('atlas_projects') || '[]') as AtlasProject[]
      if (stored.length > 0) {
        setProjects(stored)
        setForm(f => ({ ...f, projeto: stored[0].id }))
      } else {
        setNoProjects(true)
      }
    } catch {
      setNoProjects(true)
    }
    try {
      const rdos = JSON.parse(localStorage.getItem('atlas_rdos') || '[]') as RDO[]
      setHistory(rdos.slice(0, 10))
    } catch {}
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const projetoNome = projects.find(p => p.id === form.projeto)?.name ?? form.projeto
  const dataFmt = form.data ? new Date(form.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''
  const rdoTitle = `RDO — ${projetoNome} — ${dataFmt}`

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
      `📋 *RELATÓRIO DIÁRIO DE OBRA*`,
      `Projeto: ${projetoNome}`,
      `Data: ${dataFmt} | Turno: ${form.turno} | Clima: ${form.clima}`,
      `Efetivo: ${total} pessoas (${form.efetivo_proprio || 0} próprios + ${form.efetivo_terceiro || 0} terceiros)`,
      ``,
      `📌 ATIVIDADES:`,
      form.atividades || '—',
      ``,
      form.ocorrencias ? `⚠️ OCORRÊNCIAS:\n${form.ocorrencias}` : '',
      form.observacoes ? `📝 OBSERVAÇÕES:\n${form.observacoes}` : '',
      ``,
      `✍️ Responsável: ${form.responsavel || '—'}`,
    ].filter(l => l !== undefined).join('\n')
  }

  async function handleSalvar() {
    const errs: typeof errors = {}
    if (!form.atividades.trim()) errs.atividades = 'Campo obrigatório'
    if (!form.responsavel.trim()) errs.responsavel = 'Campo obrigatório'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)

    try {
      const rdo: RDO = {
        id: crypto.randomUUID(),
        projeto: form.projeto,
        projetoNome,
        data: form.data,
        turno: form.turno,
        clima: form.clima,
        efetivo_proprio: form.efetivo_proprio,
        efetivo_terceiro: form.efetivo_terceiro,
        atividades: form.atividades,
        ocorrencias: form.ocorrencias,
        equipamentos: form.equipamentos,
        materiais: form.materiais,
        observacoes: form.observacoes,
        responsavel: form.responsavel,
        savedAt: new Date().toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem('atlas_rdos') || '[]') as RDO[]
      const updated = [rdo, ...existing].slice(0, 100)
      localStorage.setItem('atlas_rdos', JSON.stringify(updated))
      setHistory(updated.slice(0, 10))
    } catch {}

    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setShowModal(true)
  }

  const s: Record<string, React.CSSProperties> = {
    page:     { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar:   { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px',
      height:52, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:10 },
    back:     { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', textDecoration:'none', background:'none',
      border:'none', fontFamily:'inherit' },
    body:     { maxWidth:860, margin:'0 auto', padding:'28px 20px' },
    card:     { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12,
      padding:'20px 22px', marginBottom:16 },
    title:    { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0',
      textTransform:'uppercase' as 'uppercase', marginBottom:14 },
    grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 },
    field:    { display:'flex', flexDirection:'column' as 'column', gap:4 },
    label:    { fontSize:11, fontWeight:600, color:'#5a6282', letterSpacing:'.04em' },
    input:    { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%', boxSizing:'border-box' as 'border-box' },
    textarea: { padding:'10px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%', resize:'vertical' as 'vertical',
      minHeight:90, boxSizing:'border-box' as 'border-box' },
    select:   { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%' },
    btn:      { padding:'11px 28px', background:'#185FA5', color:'#fff', border:'none',
      borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
      fontFamily:'inherit', transition:'opacity .15s' },
    errTxt:   { fontSize:11, color:'#A32D2D', marginTop:2 },
  }

  return (
    <>
      <Head><title>RDO — Relatório Diário de Obra</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>📋 RDO — Relatório Diário de Obra</div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>AI Construction Platform v5.3</div>
        </div>

        <div style={s.body}>
          {/* Identificação */}
          <div style={s.card}>
            <div style={s.title}>Identificação</div>
            <div style={{ ...s.grid3, marginBottom:12 }}>
              <div style={s.field}>
                <label style={s.label}>Projeto</label>
                {noProjects && (
                  <div style={{ background:'#FEF3CD', border:'1px solid #FBBF24', borderRadius:8, padding:'10px 14px',
                    fontSize:12, color:'#92400E', marginBottom:12, display:'flex', gap:8, alignItems:'center' }}>
                    <span>⚠️</span>
                    <span>Nenhum projeto encontrado. <a href="/dashboard" style={{ color:'#185FA5', fontWeight:600 }}>Crie um projeto no Dashboard</a> para vinculá-lo ao RDO.</span>
                  </div>
                )}
                <select style={s.select} value={form.projeto} onChange={e => set('projeto', e.target.value)}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Data</label>
                <input style={s.input} type="date" value={form.data} onChange={e => set('data', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Turno</label>
                <select style={s.select} value={form.turno} onChange={e => set('turno', e.target.value)}>
                  {TURNOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={s.grid3}>
              <div style={s.field}>
                <label style={s.label}>Condição climática</label>
                <select style={s.select} value={form.clima} onChange={e => set('clima', e.target.value)}>
                  {CONDICOES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Efetivo próprio</label>
                <input style={s.input} type="number" placeholder="Nº pessoas" value={form.efetivo_proprio}
                  onChange={e => set('efetivo_proprio', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Efetivo terceirizado</label>
                <input style={s.input} type="number" placeholder="Nº pessoas" value={form.efetivo_terceiro}
                  onChange={e => set('efetivo_terceiro', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Atividades */}
          <div style={s.card}>
            <div style={s.title}>Atividades Executadas *</div>
            <textarea
              style={{ ...s.textarea, borderColor: errors.atividades ? '#A32D2D' : '#e5e8f0' }}
              placeholder="Descreva as atividades realizadas no turno..."
              value={form.atividades} onChange={e => set('atividades', e.target.value)} rows={4} />
            {errors.atividades && <div style={s.errTxt}>{errors.atividades}</div>}
          </div>

          {/* Ocorrências */}
          <div style={s.card}>
            <div style={s.title}>Ocorrências e Interferências</div>
            <textarea style={s.textarea}
              placeholder="Registre ocorrências, acidentes, paralisações, problemas de segurança..."
              value={form.ocorrencias} onChange={e => set('ocorrencias', e.target.value)} rows={3} />
          </div>

          {/* Equipamentos e Materiais */}
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.title}>Equipamentos Utilizados</div>
              <textarea style={s.textarea} placeholder="Ex: Grua, betoneira, andaime..."
                value={form.equipamentos} onChange={e => set('equipamentos', e.target.value)} rows={3} />
            </div>
            <div style={s.card}>
              <div style={s.title}>Materiais Aplicados</div>
              <textarea style={s.textarea} placeholder="Ex: Concreto fck25, aço CA-50..."
                value={form.materiais} onChange={e => set('materiais', e.target.value)} rows={3} />
            </div>
          </div>

          {/* Observações e Responsável */}
          <div style={s.card}>
            <div style={s.title}>Observações Gerais</div>
            <textarea style={{ ...s.textarea, marginBottom:14 }}
              placeholder="Observações adicionais, pendências, comunicados..."
              value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} />
            <div style={s.field}>
              <label style={s.label}>Responsável pelo RDO *</label>
              <input
                style={{ ...s.input, borderColor: errors.responsavel ? '#A32D2D' : '#e5e8f0' }}
                placeholder="Nome do engenheiro responsável"
                value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
              {errors.responsavel && <div style={s.errTxt}>{errors.responsavel}</div>}
            </div>
          </div>

          {/* Ações */}
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
            <button style={{ ...s.btn, background:'transparent', color:'#185FA5', border:'1px solid #185FA5' }}
              onClick={() => router.back()}>
              Cancelar
            </button>
            <button style={{ ...s.btn, opacity: saving ? .6 : 1 }}
              onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar RDO'}
            </button>
          </div>

          {/* Histórico */}
          {history.length > 0 && (
            <div style={{ ...s.card, marginTop:24 }}>
              <div style={s.title}>Histórico — Últimos RDOs salvos</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {history.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', border:'1px solid #e5e8f0', borderRadius:8,
                    background:'#f8f9fc' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#1a1f36', marginBottom:2 }}>
                        {r.projetoNome}
                      </div>
                      <div style={{ fontSize:11, color:'#8890a0' }}>
                        {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')} · {r.turno} · {r.responsavel}
                      </div>
                    </div>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#8890a0', flexShrink:0 }}>
                      {new Date(r.savedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <PrintShareModal
          title={rdoTitle}
          onClose={() => setShowModal(false)}
          buildHtml={buildHtml}
          buildText={buildText}
        />
      )}
    </>
  )
}
