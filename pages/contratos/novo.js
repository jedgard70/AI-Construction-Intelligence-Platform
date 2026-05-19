import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TIPOS_CONTRATO = [
  { value: 'prestacao_servicos_engenharia', label: 'Prestação de Serviços de Engenharia' },
  { value: 'administracao_obra', label: 'Administração de Obra' },
  { value: 'empreitada_global', label: 'Empreitada Global (mão de obra + material)' },
  { value: 'empreitada_mao_obra', label: 'Empreitada de Mão de Obra' },
  { value: 'fornecimento', label: 'Fornecimento de Materiais' },
]

const PERIODICIDADES = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'por_etapa', label: 'Por Etapa / Marco' },
]

const INDICES_REAJUSTE = [
  { value: 'nenhum', label: 'Sem reajuste' },
  { value: 'IPCA', label: 'IPCA (Inflação ao Consumidor)' },
  { value: 'INPC', label: 'INPC (Índice Nacional de Preços)' },
  { value: 'IGPM', label: 'IGP-M (Mercado)' },
  { value: 'SINAPI', label: 'SINAPI (Construção Civil)' },
]

const FIELD_GROUPS = [
  {
    title: 'Tipo e Identificação',
    fields: [
      { key: 'tipo_contrato', label: 'Tipo de Contrato', required: true, type: 'select', options: TIPOS_CONTRATO },
      { key: 'numero_contrato', label: 'Número do Contrato', placeholder: 'CTR-2026-001', required: true },
      { key: 'data_contrato', label: 'Data do Contrato', placeholder: '19 de maio de 2026', required: true },
      { key: 'nome_obra', label: 'Nome da Obra / Projeto', placeholder: 'Reforma Residencial Vila Madalena', required: true },
    ],
  },
  {
    title: 'Sua Empresa (Contratada)',
    fields: [
      { key: 'nome_empresa_contratada', label: 'Nome / Razão Social', placeholder: 'Engenharia Silva Ltda.', required: true },
      { key: 'cnpj_cpf_contratada', label: 'CNPJ / CPF', placeholder: '12.345.678/0001-90', required: true },
      { key: 'nome_responsavel_tecnico', label: 'Responsável Técnico', placeholder: 'Eng. João Silva', required: true },
      { key: 'numero_crea_cau', label: 'CREA / CAU nº', placeholder: 'CREA-SP 123456' },
      { key: 'endereco_contratada', label: 'Endereço', placeholder: 'Rua das Flores, 100 — São Paulo/SP' },
      { key: 'email_contratada', label: 'E-mail', placeholder: 'contato@empresa.com' },
      { key: 'telefone_contratada', label: 'Telefone', placeholder: '(11) 99999-0000' },
    ],
  },
  {
    title: 'Dados Bancários para Recebimento',
    fields: [
      { key: 'chave_pix_contratada', label: 'Chave PIX', placeholder: 'CPF, CNPJ ou e-mail' },
      { key: 'banco', label: 'Banco', placeholder: 'Itaú' },
      { key: 'agencia', label: 'Agência', placeholder: '0001' },
      { key: 'conta', label: 'Conta', placeholder: '12345-6' },
    ],
  },
  {
    title: 'Cliente (Contratante)',
    fields: [
      { key: 'nome_contratante', label: 'Nome Completo / Razão Social', placeholder: 'Maria Oliveira', required: true },
      { key: 'cpf_cnpj_contratante', label: 'CPF / CNPJ', placeholder: '123.456.789-00', required: true },
      { key: 'endereco_contratante', label: 'Endereço', placeholder: 'Av. Paulista, 1000 — São Paulo/SP' },
      { key: 'email_contratante', label: 'E-mail', placeholder: 'cliente@email.com' },
      { key: 'telefone_contratante', label: 'Telefone', placeholder: '(11) 98888-7777' },
    ],
  },
  {
    title: 'Obra',
    fields: [
      { key: 'endereco_obra', label: 'Endereço da Obra', placeholder: 'Rua dos Pinheiros, 500 — São Paulo/SP', required: true },
      { key: 'descricao_escopo_obra', label: 'Descrição da Obra (escopo)', placeholder: 'Reforma completa de apartamento de 80m²: demolição de paredes, revestimentos, elétrica e hidráulica.', required: true, multiline: true },
      { key: 'prazo_execucao', label: 'Prazo de Execução (número)', placeholder: '12', type: 'number', required: true },
      { key: 'periodicidade', label: 'Periodicidade das Medições', type: 'select', options: PERIODICIDADES, required: true },
      { key: 'data_inicio_obra', label: 'Data de Início Prevista', placeholder: '26 de maio de 2026' },
      { key: 'responsavel_materiais', label: 'Responsável pelos Materiais', placeholder: 'O CONTRATANTE' },
      { key: 'responsavel_art', label: 'Responsável pela ART/RRT', placeholder: 'O CONTRATANTE' },
      { key: 'seguro_obra', label: 'Seguro de Obra', type: 'select', options: [{ value: 'nao', label: 'Não exigido' }, { value: 'contratante', label: 'A cargo do Contratante' }, { value: 'contratada', label: 'A cargo da Contratada' }] },
    ],
  },
  {
    title: 'Valores e Condições Financeiras',
    fields: [
      { key: 'valor_entrada', label: 'Valor de Entrada / Mobilização (R$)', placeholder: '15000', type: 'number' },
      { key: 'valor_medicao', label: 'Valor por Medição (R$)', placeholder: '3700', type: 'number', required: true },
      { key: 'prazo_pagamento_dias', label: 'Prazo de Pagamento (dias úteis)', placeholder: '3', type: 'number' },
      { key: 'indice_reajuste', label: 'Índice de Reajuste Anual', type: 'select', options: INDICES_REAJUSTE },
      { key: 'multa_atraso_pct', label: 'Multa por Atraso (%)', placeholder: '2', type: 'number' },
      { key: 'juros_mora_pct', label: 'Juros de Mora (% ao mês)', placeholder: '1', type: 'number' },
      { key: 'multa_rescisao_pct', label: 'Multa Rescisória (%)', placeholder: '20', type: 'number' },
      { key: 'prazo_rescisao_dias', label: 'Aviso Prévio Rescisão (dias)', placeholder: '7', type: 'number' },
    ],
  },
  {
    title: 'Localização e Testemunhas',
    fields: [
      { key: 'cidade_foro', label: 'Cidade do Foro', placeholder: 'São Paulo', required: true },
      { key: 'cidade_assinatura', label: 'Cidade de Assinatura', placeholder: 'São Paulo', required: true },
      { key: 'testemunha_1_nome', label: 'Testemunha 1 — Nome' },
      { key: 'testemunha_1_cpf', label: 'Testemunha 1 — CPF' },
      { key: 'testemunha_2_nome', label: 'Testemunha 2 — Nome' },
      { key: 'testemunha_2_cpf', label: 'Testemunha 2 — CPF' },
    ],
  },
]

const inputStyle = {
  width: '100%', padding: '8px 11px', border: '1px solid #e2e5ed',
  borderRadius: '7px', fontSize: '13px', color: '#1a1f36', outline: 'none',
  boxSizing: 'border-box', background: '#fff', fontFamily: 'system-ui, sans-serif',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

function fmtBRL(n) {
  return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default function NovoContrato() {
  const [form, setForm] = useState({
    tipo_contrato: 'prestacao_servicos_engenharia',
    periodicidade: 'semanal',
    indice_reajuste: 'nenhum',
    seguro_obra: 'nao',
    prazo_execucao: 12,
    valor_entrada: 15000,
    valor_medicao: 3700,
    prazo_pagamento_dias: 3,
    multa_atraso_pct: 2,
    juros_mora_pct: 1,
    multa_rescisao_pct: 20,
    prazo_rescisao_dias: 7,
    responsavel_materiais: 'O CONTRATANTE',
    responsavel_art: 'O CONTRATANTE',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGenerate = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const resp = await fetch('/api/juridico/contratos/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          prazo_execucao: Number(form.prazo_execucao) || 12,
          valor_entrada: Number(form.valor_entrada) || 0,
          valor_medicao: Number(form.valor_medicao) || 0,
          prazo_pagamento_dias: Number(form.prazo_pagamento_dias) || 3,
          multa_atraso_pct: Number(form.multa_atraso_pct) || 2,
          juros_mora_pct: Number(form.juros_mora_pct) || 1,
          multa_rescisao_pct: Number(form.multa_rescisao_pct) || 20,
          prazo_rescisao_dias: Number(form.prazo_rescisao_dias) || 7,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) setError(data.errors ? data.errors.join('\n') : data.message)
      else { setResult(data); setPreview(true) }
    } catch (e) {
      setError('Erro de conexão: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadMarkdown = () => {
    if (!result?.contract_markdown) return
    const blob = new Blob([result.contract_markdown], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `contrato-${form.numero_contrato || 'novo'}.md`
    a.click()
  }

  // Financial summary calc
  const prazo = Number(form.prazo_execucao) || 12
  const entrada = Number(form.valor_entrada) || 0
  const medicao = Number(form.valor_medicao) || 0
  const amortizacao = entrada > 0 && prazo > 0 ? (entrada / prazo) : 0
  const liquido = medicao - amortizacao
  const totalMedicoes = medicao * prazo
  const totalContrato = entrada + totalMedicoes
  const periodLabel = form.periodicidade === 'mensal' ? 'mês' : form.periodicidade === 'por_etapa' ? 'etapa' : 'semana'

  return (
    <>
      <Head><title>Novo Contrato · ConstructAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        <header style={{ background: '#fff', borderBottom: '1px solid #e2e5ed', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
          <Link href="/dashboard" style={{ color: '#6b7490', fontSize: '13px', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ color: '#e2e5ed' }}>|</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1f36' }}>Novo Contrato</span>
        </header>

        <div style={{ maxWidth: '940px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Form */}
          <div style={{ flex: 1 }}>
            {FIELD_GROUPS.map(group => (
              <div key={group.title} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
                  {group.title}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {group.fields.map(f => (
                    <div key={f.key} style={{ gridColumn: f.multiline ? '1 / -1' : 'auto' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5070', display: 'block', marginBottom: '4px' }}>
                        {f.label}{f.required && <span style={{ color: '#A32D2D' }}> *</span>}
                      </label>
                      {f.type === 'select' ? (
                        <select value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={selectStyle}>
                          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : f.multiline ? (
                        <textarea rows={3} placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                      ) : (
                        <input type={f.type || 'text'} placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={inputStyle} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ background: '#A32D2D12', border: '1px solid #A32D2D40', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#A32D2D', whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#a0a8bb' : '#185FA5', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Gerando contrato…' : 'Gerar Contrato'}
            </button>
          </div>

          {/* Sidebar */}
          <div style={{ width: '248px', flexShrink: 0 }}>

            {/* Financial summary */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>Resumo Financeiro</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {entrada > 0 && (
                  <Row2 label="Entrada" value={`R$ ${fmtBRL(entrada)}`} bold />
                )}
                <Row2 label="Períodos" value={`${prazo}×`} />
                <Row2 label={`R$/${periodLabel}`} value={`R$ ${fmtBRL(medicao)}`} />
                {entrada > 0 && (
                  <Row2 label={`Amortização/${periodLabel}`} value={`– R$ ${fmtBRL(amortizacao)}`} color="#BA7517" />
                )}
                {entrada > 0 && (
                  <Row2 label={`Líquido/${periodLabel}`} value={`R$ ${fmtBRL(liquido)}`} color="#3B6D11" />
                )}
                <div style={{ borderTop: '1px solid #e2e5ed', paddingTop: '8px' }}>
                  <Row2 label="Total Medições" value={`R$ ${fmtBRL(totalMedicoes)}`} />
                  <Row2 label="Total Estimado" value={`R$ ${fmtBRL(totalContrato)}`} bold color="#185FA5" big />
                </div>
                {form.indice_reajuste !== 'nenhum' && (
                  <div style={{ fontSize: '10px', color: '#BA7517', background: '#BA751710', borderRadius: '5px', padding: '5px 8px', marginTop: '4px' }}>
                    Reajuste anual pelo {form.indice_reajuste}
                  </div>
                )}
              </div>
            </div>

            {/* Conditions summary */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Condições</div>
              <div style={{ fontSize: '11px', color: '#4a5070', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Pgto em <b>{form.prazo_pagamento_dias || 3} dias úteis</b></div>
                <div>Multa atraso: <b>{form.multa_atraso_pct || 2}% + {form.juros_mora_pct || 1}% a.m.</b></div>
                <div>Multa rescisão: <b>{form.multa_rescisao_pct || 20}%</b></div>
                <div>Aviso prévio: <b>{form.prazo_rescisao_dias || 7} dias</b></div>
              </div>
            </div>

            {/* Post-generation actions */}
            {result && (
              <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #3B6D1140', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>Contrato Gerado ✓</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={downloadMarkdown} style={{ padding: '9px 12px', background: '#f4f5f7', border: '1px solid #e2e5ed', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#1a1f36', cursor: 'pointer', textAlign: 'left' }}>
                    ↓ Baixar .MD
                  </button>
                  {result.pdf?.file_url && (
                    <a href={result.pdf.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '9px 12px', background: '#185FA508', border: '1px solid #185FA530', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                      ↗ Abrir PDF
                    </a>
                  )}
                  {result.pdf?.simulated && (
                    <div style={{ fontSize: '10px', color: '#BA7517', background: '#BA751712', borderRadius: '6px', padding: '7px 9px' }}>
                      Configure LUMIN_API_KEY para gerar PDF.
                    </div>
                  )}
                  <Link href="/juridico/assinatura" style={{ display: 'block', padding: '9px 12px', background: '#185FA5', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#fff', textDecoration: 'none', textAlign: 'center' }}>
                    Enviar para Assinatura →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview modal */}
        {preview && result?.contract_markdown && (
          <div onClick={() => setPreview(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,13,18,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e5ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1f36' }}>Preview — {form.numero_contrato || 'Contrato'}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={downloadMarkdown} style={{ padding: '6px 12px', background: '#f4f5f7', border: '1px solid #e2e5ed', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#1a1f36', fontWeight: 600 }}>↓ .MD</button>
                  <button onClick={() => setPreview(false)} style={{ padding: '6px 12px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#a0a8bb' }}>×</button>
                </div>
              </div>
              <pre style={{ flex: 1, overflow: 'auto', padding: '20px', fontSize: '11px', lineHeight: 1.7, color: '#1a1f36', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {result.contract_markdown}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Row2({ label, value, bold, color, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#6b7490' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: color || '#1a1f36', fontSize: big ? '13px' : '12px' }}>{value}</span>
    </div>
  )
}
