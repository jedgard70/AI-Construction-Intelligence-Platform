/**
 * POST /api/juridico/contratos/gerar
 *
 * Preenche o template de contrato com os dados do cliente,
 * gera PDF via Lumin e (opcionalmente) envia para assinatura.
 *
 * Body:
 * {
 *   template: "prestacao-servicos-engenharia-obra" (único por ora)
 *
 *   // Dados das partes
 *   numero_contrato:        string   (ex: "CTR-2026-001")
 *   data_contrato:          string   (ex: "18 de maio de 2026")
 *   nome_obra:              string
 *
 *   // Contratada
 *   nome_empresa_contratada:  string
 *   cnpj_cpf_contratada:      string
 *   endereco_contratada:      string
 *   nome_responsavel_tecnico: string
 *   numero_crea_cau:          string
 *   email_contratada:         string
 *   telefone_contratada:      string
 *   chave_pix_contratada:     string
 *   banco:                    string
 *   agencia:                  string
 *   conta:                    string
 *
 *   // Contratante
 *   nome_contratante:    string
 *   cpf_cnpj_contratante: string
 *   endereco_contratante: string
 *   email_contratante:    string
 *   telefone_contratante: string
 *
 *   // Obra
 *   endereco_obra:            string
 *   descricao_escopo_obra:    string   (markdown ou texto)
 *   prazo_semanas:            number   (default: 12)
 *   data_inicio_obra:         string
 *   responsavel_materiais:    string   (default: "O CONTRATANTE")
 *   responsavel_art:          string   (default: "O CONTRATANTE")
 *
 *   // Localização
 *   cidade_foro:        string
 *   cidade_assinatura:  string
 *
 *   // Testemunhas (opcional)
 *   testemunha_1_nome?: string
 *   testemunha_1_cpf?:  string
 *   testemunha_2_nome?: string
 *   testemunha_2_cpf?:  string
 *
 *   // Ação após gerar
 *   send_for_signature?: boolean   (default: false)
 *   signers?: [{ name, email }]    (obrigatório se send_for_signature = true)
 * }
 */

import fs from 'fs'
import path from 'path'

const LUMIN_API = process.env.LUMIN_API_URL || 'https://api.lumin.com'
const LUMIN_KEY = process.env.LUMIN_API_KEY

const NUMERO_POR_EXTENSO = {
  1: 'uma', 2: 'duas', 3: 'três', 4: 'quatro', 5: 'cinco',
  6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
  11: 'onze', 12: 'doze', 13: 'treze', 14: 'quatorze', 15: 'quinze',
  16: 'dezesseis', 17: 'dezessete', 18: 'dezoito', 19: 'dezenove', 20: 'vinte',
}

function semanasExtenso(n) {
  return NUMERO_POR_EXTENSO[n] ?? String(n)
}

function validate(body) {
  const errors = []
  const required = [
    'numero_contrato', 'data_contrato', 'nome_obra',
    'nome_empresa_contratada', 'cnpj_cpf_contratada', 'nome_responsavel_tecnico',
    'nome_contratante', 'cpf_cnpj_contratante',
    'endereco_obra', 'descricao_escopo_obra',
    'cidade_foro', 'cidade_assinatura',
  ]
  required.forEach(f => { if (!body[f]) errors.push(`${f} é obrigatório`) })
  if (body.send_for_signature && (!body.signers || body.signers.length === 0)) {
    errors.push('signers é obrigatório quando send_for_signature = true')
  }
  return errors
}

function fillTemplate(template, data) {
  const prazo = data.prazo_semanas ?? 12
  const amortizacao = (15000 / prazo).toFixed(2)
  const liquido = (3700 - parseFloat(amortizacao)).toFixed(2)
  const totalMedicoes = (3700 * prazo).toFixed(2)

  const vars = {
    NUMERO_CONTRATO: data.numero_contrato,
    DATA_CONTRATO: data.data_contrato,
    NOME_OBRA: data.nome_obra,

    NOME_EMPRESA_CONTRATADA: data.nome_empresa_contratada,
    CNPJ_CPF_CONTRATADA: data.cnpj_cpf_contratada,
    ENDERECO_CONTRATADA: data.endereco_contratada ?? '—',
    NOME_RESPONSAVEL_TECNICO: data.nome_responsavel_tecnico,
    NUMERO_CREA_CAU: data.numero_crea_cau ?? '—',
    EMAIL_CONTRATADA: data.email_contratada ?? '—',
    TELEFONE_CONTRATADA: data.telefone_contratada ?? '—',
    CHAVE_PIX_CONTRATADA: data.chave_pix_contratada ?? '—',
    BANCO: data.banco ?? '—',
    AGENCIA: data.agencia ?? '—',
    CONTA: data.conta ?? '—',

    NOME_CONTRATANTE: data.nome_contratante,
    CPF_CNPJ_CONTRATANTE: data.cpf_cnpj_contratante,
    ENDERECO_CONTRATANTE: data.endereco_contratante ?? '—',
    EMAIL_CONTRATANTE: data.email_contratante ?? '—',
    TELEFONE_CONTRATANTE: data.telefone_contratante ?? '—',

    ENDERECO_OBRA: data.endereco_obra,
    DESCRICAO_ESCOPO_OBRA: data.descricao_escopo_obra,
    PRAZO_SEMANAS: String(prazo),
    PRAZO_SEMANAS_EXTENSO: semanasExtenso(prazo),
    DATA_INICIO_OBRA: data.data_inicio_obra ?? 'a ser definida',
    RESPONSAVEL_MATERIAIS: data.responsavel_materiais ?? 'O CONTRATANTE',
    RESPONSAVEL_ART: data.responsavel_art ?? 'O CONTRATANTE',

    CIDADE_FORO: data.cidade_foro,
    CIDADE_ASSINATURA: data.cidade_assinatura,

    NOME_TESTEMUNHA_1: data.testemunha_1_nome ?? '—',
    CPF_TESTEMUNHA_1: data.testemunha_1_cpf ?? '—',
    NOME_TESTEMUNHA_2: data.testemunha_2_nome ?? '—',
    CPF_TESTEMUNHA_2: data.testemunha_2_cpf ?? '—',
  }

  // Fix the payment table with calculated values
  let filled = template
  Object.entries(vars).forEach(([key, val]) => {
    filled = filled.replaceAll(`{{${key}}}`, val)
  })

  // Update the amortization table dynamically
  filled = filled.replace(
    /\| 1 a 12 \| R\$ 3\.700,00 \| – R\$ 1\.250,00 \| \*\*R\$ 2\.450,00\*\* \|/,
    `| 1 a ${prazo} | R$ 3.700,00 | – R$ ${amortizacao} | **R$ ${liquido}** |`
  )
  filled = filled.replace(
    '| Medições semanais (12 × R$ 3.700,00) | R$ 44.400,00 |',
    `| Medições semanais (${prazo} × R$ 3.700,00) | R$ ${Number(totalMedicoes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} |`
  )

  return filled
}

async function generatePDFWithLumin(markdown, contractId) {
  if (!LUMIN_KEY) {
    return { simulated: true, pdf_url: null, message: 'LUMIN_API_KEY não configurada — PDF não gerado' }
  }

  const pdfResp = await fetch(`${LUMIN_API}/v1/markdown-to-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LUMIN_KEY}`,
    },
    body: JSON.stringify({ markdown, filename: `contrato-${contractId}.pdf` }),
  })

  if (!pdfResp.ok) {
    const err = await pdfResp.text()
    throw new Error(`Lumin PDF error ${pdfResp.status}: ${err}`)
  }

  return pdfResp.json()
}

async function sendForSignature(pdfUrl, body) {
  const signResp = await fetch(`${LUMIN_API}/v1/signature-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LUMIN_KEY}`,
    },
    body: JSON.stringify({
      signature_request_title: `${body.nome_obra} — Contrato ${body.numero_contrato}`,
      file_url: pdfUrl,
      signers: body.signers.map(s => ({ name: s.name, email_address: s.email })),
      signing_type: 'SAME_TIME',
      expires_at: { days_from_now: 15 },
      custom_email: {
        title: `Assinatura requerida — ${body.nome_obra}`,
        subject_name: `Contrato ${body.numero_contrato}`,
      },
    }),
  })

  if (!signResp.ok) {
    const err = await signResp.text()
    throw new Error(`Lumin signature error ${signResp.status}: ${err}`)
  }

  return signResp.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  // Load template
  const templatePath = path.join(process.cwd(), 'templates', 'contratos', 'prestacao-servicos-engenharia-obra.md')
  let templateContent
  try {
    templateContent = fs.readFileSync(templatePath, 'utf-8')
  } catch {
    return res.status(500).json({ status: 'error', message: 'Template não encontrado no servidor' })
  }

  const filledContract = fillTemplate(templateContent, req.body)

  // Try to generate PDF via Lumin
  let pdfResult = null
  let signatureResult = null

  try {
    pdfResult = await generatePDFWithLumin(filledContract, req.body.numero_contrato)

    if (req.body.send_for_signature && pdfResult?.file_url && LUMIN_KEY) {
      signatureResult = await sendForSignature(pdfResult.file_url, req.body)
    }
  } catch (err) {
    return res.status(502).json({ status: 'error', message: err.message })
  }

  return res.status(200).json({
    status: 'success',
    contract_id: req.body.numero_contrato,
    template: 'prestacao-servicos-engenharia-obra',
    generated_at: new Date().toISOString(),
    contract_markdown: filledContract,
    pdf: pdfResult,
    signature: signatureResult,
  })
}
