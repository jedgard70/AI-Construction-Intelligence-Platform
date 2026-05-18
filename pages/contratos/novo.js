import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const FIELD_GROUPS = [
  {
    title: 'Identificação do Contrato',
    fields: [
      { key: 'numero_contrato', label: 'Número do Contrato', placeholder: 'CTR-2026-001', required: true },
      { key: 'data_contrato', label: 'Data do Contrato', placeholder: '18 de maio de 2026', required: true },
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
      { key: 'prazo_semanas', label: 'Prazo Estimado (semanas)', placeholder: '12', type: 'number' },
      { key: 'data_inicio_obra', label: 'Data de Início Prevista', placeholder: '26 de maio de 2026' },
      { key: 'responsavel_materiais', label: 'Responsável pelos Materiais', placeholder: 'O CONTRATANTE' },
      { key: 'responsavel_art', label: 'Responsável pela ART/RRT', placeholder: 'O CONTRATANTE' },
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
  width: '100%',
  padding: '8px 11px',
  border: '1px solid #e2e5ed',
  borderRadius: '7px',
  fontSize: '13px',
  color: '#1a1f36',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  fontFamily: 'system-ui, sans-serif',
}

export default function NovoContrato() {
  const [form, setForm] = useState({ prazo_semanas: 12, responsavel_materiais: 'O CONTRATANTE', responsavel_art: 'O CONTRATANTE' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch('/api/juridico/contratos/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, prazo_semanas: Number(form.prazo_semanas) || 12 }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.errors ? data.errors.join('\n') : data.message)
      } else {
        setResult(data)
        setPreview(true)
      }
    } catch (e) {
      setError('Erro de conexão: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadMarkdown = () => {
    if (!result?.contract_markdown) return
    const blob = new Blob([result.contract_markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato-${form.numero_contrato || 'novo'}.md`
    a.click()
  }

  // Payment summary
  const prazo = Number(form.prazo_semanas) || 12
  const totalMedicoes = 3700 * prazo
  const totalContrato = 15000 + totalMedicoes
  const amortizacao = (15000 / prazo).toFixed(2)
  const liquido = (3700 - parseFloat(amortizacao)).toFixed(2)

  return (
    <>
      <Head>
        <title>Novo Contrato · ConstructAI</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Header */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e5ed',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Link href="/dashboard" style={{ color: '#6b7490', fontSize: '13px', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ color: '#e2e5ed' }}>|</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1f36' }}>
            Novo Contrato — Prestação de Serviços de Engenharia
          </span>
        </header>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Form column */}
          <div style={{ flex: 1 }}>
            {FIELD_GROUPS.map(group => (
              <div key={group.title} style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1px solid #e2e5ed',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
                  {group.title}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {group.fields.map(f => (
                    <div key={f.key} style={{ gridColumn: f.multiline ? '1 / -1' : 'auto' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5070', display: 'block', marginBottom: '4px' }}>
                        {f.label}{f.required && <span style={{ color: '#A32D2D' }}> *</span>}
                      </label>
                      {f.multiline ? (
                        <textarea
                          rows={3}
                          placeholder={f.placeholder}
                          value={form[f.key] || ''}
                          onChange={e => set(f.key, e.target.value)}
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                      ) : (
                        <input
                          type={f.type || 'text'}
                          placeholder={f.placeholder}
                          value={form[f.key] || ''}
                          onChange={e => set(f.key, e.target.value)}
                          style={inputStyle}
                        />
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

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#a0a8bb' : '#185FA5',
                color: '#fff',
                border: 'none',
                borderRadius: '9px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Gerando contrato…' : 'Gerar Contrato'}
            </button>
          </div>

          {/* Sidebar: summary + preview */}
          <div style={{ width: '240px', flexShrink: 0 }}>

            {/* Payment summary */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e5ed', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                Resumo Financeiro
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7490' }}>Entrada</span>
                  <span style={{ fontWeight: 700, color: '#1a1f36' }}>R$ 15.000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7490' }}>Semanas</span>
                  <span style={{ fontWeight: 700, color: '#1a1f36' }}>{prazo}×</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7490' }}>R$/semana</span>
                  <span style={{ fontWeight: 700, color: '#1a1f36' }}>R$ 3.700</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7490' }}>Amortização</span>
                  <span style={{ fontWeight: 600, color: '#BA7517' }}>– R$ {amortizacao}/sem</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7490' }}>Líquido/sem</span>
                  <span style={{ fontWeight: 700, color: '#3B6D11' }}>R$ {liquido}</span>
                </div>
                <div style={{ borderTop: '1px solid #e2e5ed', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#1a1f36', fontWeight: 700 }}>Total estimado</span>
                  <span style={{ fontWeight: 700, color: '#185FA5', fontSize: '13px' }}>
                    R$ {totalContrato.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions after generation */}
            {result && (
              <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #3B6D1140', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                  Contrato Gerado ✓
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={downloadMarkdown}
                    style={{
                      padding: '9px 12px',
                      background: '#f4f5f7',
                      border: '1px solid #e2e5ed',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1a1f36',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    ↓ Baixar .MD
                  </button>
                  {result.pdf?.file_url && (
                    <a
                      href={result.pdf.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        padding: '9px 12px',
                        background: '#185FA508',
                        border: '1px solid #185FA530',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#185FA5',
                        textDecoration: 'none',
                      }}
                    >
                      ↗ Abrir PDF
                    </a>
                  )}
                  {result.pdf?.simulated && (
                    <div style={{ fontSize: '11px', color: '#BA7517', background: '#BA751712', borderRadius: '6px', padding: '8px 10px' }}>
                      PDF não gerado — configure LUMIN_API_KEY para gerar PDF automaticamente.
                    </div>
                  )}
                  <Link
                    href="/juridico/assinatura"
                    style={{
                      display: 'block',
                      padding: '9px 12px',
                      background: '#185FA5',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#fff',
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Enviar para Assinatura →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview modal */}
        {preview && result?.contract_markdown && (
          <div
            onClick={() => setPreview(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(10,13,18,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50,
              padding: '20px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e5ed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1f36' }}>
                  Preview — {form.numero_contrato || 'Contrato'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={downloadMarkdown} style={{ padding: '6px 12px', background: '#f4f5f7', border: '1px solid #e2e5ed', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#1a1f36', fontWeight: 600 }}>
                    ↓ .MD
                  </button>
                  <button onClick={() => setPreview(false)} style={{ padding: '6px 12px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#a0a8bb' }}>×</button>
                </div>
              </div>
              <pre style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                fontSize: '11px',
                lineHeight: 1.7,
                color: '#1a1f36',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                margin: 0,
              }}>
                {result.contract_markdown}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
