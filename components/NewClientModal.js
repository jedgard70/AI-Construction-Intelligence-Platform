import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

const TIPOS_CLIENTE = [
  { value: 'pessoa_fisica',   label: 'Pessoa Física' },
  { value: 'pessoa_juridica', label: 'Pessoa Jurídica' },
]

const SEGMENTOS = [
  { value: 'residencial',    label: 'Residencial' },
  { value: 'comercial',      label: 'Comercial' },
  { value: 'industrial',     label: 'Industrial' },
  { value: 'incorporadora',  label: 'Incorporadora' },
  { value: 'construtora',    label: 'Construtora' },
  { value: 'poder_publico',  label: 'Poder Público' },
  { value: 'outro',          label: 'Outro' },
]

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.48)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Geist', system-ui, sans-serif",
  },
  modal: {
    background: '#fff', borderRadius: 16, width: 600,
    maxHeight: '92vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
    border: '1px solid #e5e8f0',
  },
  header: {
    padding: '18px 24px', borderBottom: '1px solid #e5e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, background: '#fff', zIndex: 1,
  },
  body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  section: { fontSize: 10, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 600, color: '#5a6282', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    padding: '9px 12px', border: '1px solid #e5e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    color: '#1a1f36', background: '#f8f9fc', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  select: {
    padding: '9px 12px', border: '1px solid #e5e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    color: '#1a1f36', background: '#f8f9fc', outline: 'none',
    width: '100%', boxSizing: 'border-box', cursor: 'pointer',
  },
  footer: {
    padding: '16px 24px', borderTop: '1px solid #e5e8f0',
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    position: 'sticky', bottom: 0, background: '#fff',
  },
}

function Field({ label, required, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}{required && <span style={{ color: '#A32D2D' }}> *</span>}</label>
      {children}
    </div>
  )
}

export default function NewClientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    tipo: 'pessoa_juridica', segmento: 'comercial', estado: 'SP',
    nome: '', razao_social: '', cpf_cnpj: '',
    email: '', telefone: '', celular: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado_uf: 'SP',
    contato_nome: '', contato_cargo: '', contato_email: '', contato_telefone: '',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return }
    setLoading(true); setError(''); setSuccess('')

    const sb = getSupabase()

    if (!sb) {
      setError('Supabase não configurado.')
      setLoading(false)
      return
    }

    const { data: { user }, error: userErr } = await sb.auth.getUser()
    if (userErr || !user) {
      setError('Usuário autenticado não encontrado.')
      setLoading(false)
      return
    }

    const payload = {
      tipo:           form.tipo,
      segmento:       form.segmento,
      nome:           form.nome.trim(),
      razao_social:   form.razao_social.trim() || null,
      cpf_cnpj:       form.cpf_cnpj.trim() || ('cli_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
      email:          form.email.trim() || null,
      telefone:       form.telefone.trim() || null,
      celular:        form.celular.trim() || null,
      cep:            form.cep.trim() || null,
      endereco:       form.endereco.trim() || null,
      numero:         form.numero.trim() || null,
      complemento:    form.complemento.trim() || null,
      bairro:         form.bairro.trim() || null,
      cidade:         form.cidade.trim() || null,
      estado:         form.estado_uf || null,
      contato_nome:   form.contato_nome.trim() || null,
      contato_cargo:  form.contato_cargo.trim() || null,
      contato_email:  form.contato_email.trim() || null,
      contato_telefone: form.contato_telefone.trim() || null,
      observacoes:    form.observacoes.trim() || null,
      status:         'ativo',
      created_by:     user.id,
    }

    const { error: err } = await sb.from('clients').insert(payload)

    if (err) {
      if (err.code === '23505' || err.message?.includes('clients_cpf_cnpj_key')) {
        setError(`CPF/CNPJ ${form.cpf_cnpj} já está cadastrado. Verifique os clientes existentes ou atualize o registro.`)
      } else {
        setError('Erro ao salvar: ' + err.message)
      }
      setLoading(false)
      return
    }

    setSuccess(`Cliente "${form.nome}" cadastrado com sucesso!`)
    setLoading(false)
    setTimeout(() => { onCreated?.(); onClose() }, 1400)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1f36' }}>👤 Novo Cliente</div>
            <div style={{ fontSize: 12, color: '#8b93a7', marginTop: 2 }}>Cadastro completo de cliente</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8b93a7' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.body}>

            {error   && <div style={{ padding:'10px 14px', background:'#FCEBEB', border:'1px solid #F09595', borderRadius:8, fontSize:12, color:'#A32D2D' }}>⚠ {error}</div>}
            {success && <div style={{ padding:'10px 14px', background:'#EAF3DE', border:'1px solid #97C459', borderRadius:8, fontSize:12, color:'#3B6D11' }}>✅ {success}</div>}

            {/* Tipo e Segmento */}
            <div>
              <div style={s.section}>Identificação</div>
              <div style={s.row}>
                <Field label="Tipo de cliente" required>
                  <select style={s.select} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    {TIPOS_CLIENTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Segmento">
                  <select style={s.select} value={form.segmento} onChange={e => set('segmento', e.target.value)}>
                    {SEGMENTOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Dados principais */}
            <div>
              <div style={s.section}>Dados Principais</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label={form.tipo === 'pessoa_juridica' ? 'Nome fantasia / Apelido' : 'Nome completo'} required>
                  <input style={s.input} placeholder={form.tipo === 'pessoa_juridica' ? 'Ex: Construtora Silva' : 'Ex: João da Silva'} value={form.nome} onChange={e => set('nome', e.target.value)} />
                </Field>
                {form.tipo === 'pessoa_juridica' && (
                  <Field label="Razão Social">
                    <input style={s.input} placeholder="Ex: Construtora Silva e Filhos Ltda." value={form.razao_social} onChange={e => set('razao_social', e.target.value)} />
                  </Field>
                )}
                <div style={s.row}>
                  <Field label={form.tipo === 'pessoa_juridica' ? 'CNPJ' : 'CPF'} required>
                    <input style={s.input} placeholder={form.tipo === 'pessoa_juridica' ? '00.000.000/0001-00' : '000.000.000-00'} value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} />
                  </Field>
                  <Field label="E-mail">
                    <input style={s.input} type="email" placeholder="contato@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </Field>
                </div>
                <div style={s.row}>
                  <Field label="Telefone Fixo">
                    <input style={s.input} placeholder="(11) 3000-0000" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                  </Field>
                  <Field label="Celular / WhatsApp">
                    <input style={s.input} placeholder="(11) 99000-0000" value={form.celular} onChange={e => set('celular', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <div style={s.section}>Endereço</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={s.row}>
                  <Field label="CEP">
                    <input style={s.input} placeholder="00000-000" value={form.cep} onChange={e => set('cep', e.target.value)} />
                  </Field>
                  <Field label="Número">
                    <input style={s.input} placeholder="123" value={form.numero} onChange={e => set('numero', e.target.value)} />
                  </Field>
                </div>
                <Field label="Logradouro (Rua / Av.)">
                  <input style={s.input} placeholder="Rua das Flores" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
                </Field>
                <div style={s.row}>
                  <Field label="Complemento">
                    <input style={s.input} placeholder="Apto 42, Sala 301…" value={form.complemento} onChange={e => set('complemento', e.target.value)} />
                  </Field>
                  <Field label="Bairro">
                    <input style={s.input} placeholder="Centro" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
                  </Field>
                </div>
                <div style={s.row}>
                  <Field label="Cidade">
                    <input style={s.input} placeholder="São Paulo" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                  </Field>
                  <Field label="Estado (UF)">
                    <select style={s.select} value={form.estado_uf} onChange={e => set('estado_uf', e.target.value)}>
                      {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Contato responsável */}
            <div>
              <div style={s.section}>Contato Responsável</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={s.row}>
                  <Field label="Nome do contato">
                    <input style={s.input} placeholder="Maria Souza" value={form.contato_nome} onChange={e => set('contato_nome', e.target.value)} />
                  </Field>
                  <Field label="Cargo / Função">
                    <input style={s.input} placeholder="Diretor de Obras" value={form.contato_cargo} onChange={e => set('contato_cargo', e.target.value)} />
                  </Field>
                </div>
                <div style={s.row}>
                  <Field label="E-mail do contato">
                    <input style={s.input} type="email" placeholder="maria@empresa.com" value={form.contato_email} onChange={e => set('contato_email', e.target.value)} />
                  </Field>
                  <Field label="Telefone do contato">
                    <input style={s.input} placeholder="(11) 98000-0000" value={form.contato_telefone} onChange={e => set('contato_telefone', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <div style={s.section}>Observações</div>
              <textarea
                rows={3} placeholder="Notas internas sobre o cliente, histórico, preferências..."
                value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                style={{ ...s.input, resize: 'vertical' }}
              />
            </div>

          </div>

          <div style={s.footer}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', border:'1px solid #e5e8f0', borderRadius:8, background:'#fff', color:'#5a6282', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ padding:'9px 20px', border:'none', borderRadius:8, background: loading ? '#a0a8bb' : '#534AB7', color:'#fff', fontSize:13, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              {loading ? 'Salvando...' : '👤 Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
