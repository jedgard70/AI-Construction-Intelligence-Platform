import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const PROJETOS = [
  { id: 'horizonte', nome: 'Edifício Horizonte — Torre A' },
  { id: 'industrial', nome: 'Complexo Industrial Norte' },
  { id: 'valeverde', nome: 'Condomínio Vale Verde' },
]

const CONDICOES = ['Ensolarado', 'Nublado', 'Chuvoso', 'Parcialmente nublado']
const TURNOS = ['Manhã (07h–12h)', 'Tarde (12h–17h)', 'Noturno (17h–22h)']

export default function RDOPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    projeto: 'horizonte',
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

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSalvar() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight:'100vh', background:'#f4f5f7', fontFamily:"'Geist',system-ui,sans-serif" },
    topbar: { background:'#fff', borderBottom:'1px solid #e5e8f0', padding:'0 24px',
      height:52, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:10 },
    back: { display:'flex', alignItems:'center', gap:8, color:'#185FA5', fontSize:13,
      fontWeight:600, cursor:'pointer', textDecoration:'none', background:'none',
      border:'none', fontFamily:'inherit' },
    body: { maxWidth:860, margin:'0 auto', padding:'28px 20px' },
    card: { background:'#fff', border:'1px solid #e5e8f0', borderRadius:12,
      padding:'20px 22px', marginBottom:16 },
    title: { fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'#8890a0',
      textTransform:'uppercase', marginBottom:14 },
    grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    grid3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 },
    field: { display:'flex', flexDirection:'column', gap:4 },
    label: { fontSize:11, fontWeight:600, color:'#5a6282', letterSpacing:'.04em' },
    input: { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%', boxSizing:'border-box' as 'border-box' },
    textarea: { padding:'10px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%', resize:'vertical' as 'vertical',
      minHeight:90, boxSizing:'border-box' as 'border-box' },
    select: { padding:'8px 12px', border:'1px solid #e5e8f0', borderRadius:8,
      fontSize:13, color:'#1a1f36', background:'#f8f9fc', outline:'none',
      fontFamily:'inherit', width:'100%' },
    btn: { padding:'11px 28px', background:'#185FA5', color:'#fff', border:'none',
      borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
      fontFamily:'inherit', transition:'opacity .15s' },
  }

  return (
    <>
      <Head><title>RDO — Relatório Diário de Obra</title></Head>
      <div style={s.page}>
        <div style={s.topbar}>
          <button style={s.back} onClick={() => router.back()}>← Voltar ao Dashboard</button>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36' }}>
            📋 RDO — Relatório Diário de Obra
          </div>
          <div style={{ fontSize:11, color:'#8890a0', fontFamily:'monospace' }}>
            AI Construction Platform v5.3
          </div>
        </div>

        <div style={s.body}>
          {/* Identificação */}
          <div style={s.card}>
            <div style={s.title}>Identificação</div>
            <div style={{ ...s.grid3, marginBottom:12 }}>
              <div style={s.field}>
                <label style={s.label}>Projeto</label>
                <select style={s.select} value={form.projeto} onChange={e => set('projeto', e.target.value)}>
                  {PROJETOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
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
            <div style={s.title}>Atividades Executadas</div>
            <textarea style={s.textarea} placeholder="Descreva as atividades realizadas no turno..."
              value={form.atividades} onChange={e => set('atividades', e.target.value)} rows={4} />
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
              <label style={s.label}>Responsável pelo RDO</label>
              <input style={s.input} placeholder="Nome do engenheiro responsável"
                value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
          </div>

          {/* Ações */}
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
            <button style={{ ...s.btn, background:'transparent', color:'#185FA5',
              border:'1px solid #185FA5' }} onClick={() => router.back()}>
              Cancelar
            </button>
            <button style={{ ...s.btn, opacity: saving ? .6 : 1 }}
              onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar RDO'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
