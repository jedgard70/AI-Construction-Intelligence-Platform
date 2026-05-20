/**
 * POST /api/juridico/contratos/gerar
 *
 * Preenche o template de contrato com dados dinâmicos do formulário,
 * gera PDF via Lumin e (opcionalmente) envia para assinatura.
 */

import fs from 'fs'
import path from 'path'

const LUMIN_API = process.env.LUMIN_API_URL || 'https://api.lumin.com'
const LUMIN_KEY = process.env.LUMIN_API_KEY

const NUMERO_POR_EXTENSO = {
  1:'um',2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',
  9:'nove',10:'dez',11:'onze',12:'doze',13:'treze',14:'quatorze',15:'quinze',
  16:'dezesseis',17:'dezessete',18:'dezoito',19:'dezenove',20:'vinte',
  24:'vinte e quatro',36:'trinta e seis',48:'quarenta e oito',
}

const LABEL_PERIODICIDADE = {
  semanal: { singular: 'semana', plural: 'semanas', adj: 'semanais' },
  mensal:  { singular: 'mês',    plural: 'meses',   adj: 'mensais' },
  por_etapa: { singular: 'etapa', plural: 'etapas', adj: 'por etapa' },
}

const LABEL_TIPO = {
  prestacao_servicos_engenharia: 'Prestação de Serviços de Engenharia e Administração de Obra',
  administracao_obra: 'Administração de Obra',
  empreitada_global: 'Empreitada Global (Mão de Obra e Materiais)',
  empreitada_mao_obra: 'Empreitada de Mão de Obra',
  fornecimento: 'Fornecimento de Materiais e Serviços',
}

function numExtenso(n) {
  return NUMERO_POR_EXTENSO[n] ?? String(n)
}

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function validate(body) {
  const errors = []
  const required = [
    'numero_contrato','data_contrato','nome_obra',
    'nome_empresa_contratada','cnpj_cpf_contratada','nome_responsavel_tecnico',
    'nome_contratante','cpf_cnpj_contratante',
    'endereco_obra','descricao_escopo_obra',
    'cidade_foro','cidade_assinatura','valor_medicao',
  ]
  required.forEach(f => { if (!body[f]) errors.push(`${f} é obrigatório`) })
  if (body.send_for_signature && (!body.signers || body.signers.length === 0)) {
    errors.push('signers é obrigatório quando send_for_signature = true')
  }
  return errors
}

function buildFinancialTable(data, prazo, periodo) {
  const entrada = Number(data.valor_entrada) || 0
  const medicao = Number(data.valor_medicao)
  const amort = entrada > 0 ? entrada / prazo : 0
  const liquido = medicao - amort
  const totalMedicoes = medicao * prazo
  const total = entrada + totalMedicoes

  let table = `| ${periodo.singular.charAt(0).toUpperCase() + periodo.singular.slice(1)} | Medição Bruta | Amortização | Valor Líquido |\n`
  table += `|---|---|---|---|\n`

  if (entrada > 0) {
    table += `| 1 a ${prazo} | R$ ${brl(medicao)} | – R$ ${brl(amort)} | **R$ ${brl(liquido)}** |\n`
  } else {
    table += `| 1 a ${prazo} | R$ ${brl(medicao)} | — | **R$ ${brl(medicao)}** |\n`
  }

  return { table, entrada, medicao, amort, liquido, totalMedicoes, total }
}

function buildTotalTable(data, prazo, periodo, fin) {
  let t = `| Item | Valor |\n|---|---|\n`
  if (fin.entrada > 0) {
    t += `| Valor de entrada (mobilização) | R$ ${brl(fin.entrada)} |\n`
  }
  t += `| Medições ${periodo.adj} (${prazo} × R$ ${brl(fin.medicao)}) | R$ ${brl(fin.totalMedicoes)} |\n`
  t += `| **Total estimado** | **R$ ${brl(fin.total)}** |\n`
  return t
}

function fillTemplate(template, data) {
  const prazo = Number(data.prazo_execucao) || 12
  const periodo = LABEL_PERIODICIDADE[data.periodicidade] || LABEL_PERIODICIDADE.semanal
  const fin = buildFinancialTable(data, prazo, periodo)
  const tipoLabel = LABEL_TIPO[data.tipo_contrato] || 'Prestação de Serviços de Engenharia'

  // Seguro clause text
  const seguroTexto = data.seguro_obra === 'nao'
    ? 'As partes acordam que o seguro de obra não é exigido para este contrato.'
    : `O seguro de obra será contratado e mantido por **${data.seguro_obra === 'contratante' ? 'O CONTRATANTE' : 'A CONTRATADA'}** durante toda a vigência do contrato.`

  // Reajuste clause text
  const reajusteTexto = data.indice_reajuste === 'nenhum'
    ? 'Os valores deste contrato não estão sujeitos a reajuste.'
    : `Os valores das medições serão reajustados anualmente pelo índice **${data.indice_reajuste}**, acumulado nos 12 (doze) meses anteriores à data de aniversário do contrato.`

  const vars = {
    TIPO_CONTRATO: tipoLabel,
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
    PRAZO_EXECUCAO: String(prazo),
    PRAZO_EXECUCAO_EXTENSO: numExtenso(prazo),
    UNIDADE_PRAZO: periodo.plural,
    DATA_INICIO_OBRA: data.data_inicio_obra ?? 'a ser definida',
    RESPONSAVEL_MATERIAIS: data.responsavel_materiais ?? 'O CONTRATANTE',
    RESPONSAVEL_ART: data.responsavel_art ?? 'O CONTRATANTE',

    // Financial
    VALOR_ENTRADA: `R$ ${brl(fin.entrada)}`,
    VALOR_MEDICAO: `R$ ${brl(fin.medicao)}`,
    VALOR_AMORTIZACAO: fin.entrada > 0 ? `R$ ${brl(fin.amort)}` : '—',
    VALOR_LIQUIDO: `R$ ${brl(fin.liquido)}`,
    TOTAL_MEDICOES: `R$ ${brl(fin.totalMedicoes)}`,
    TOTAL_CONTRATO: `R$ ${brl(fin.total)}`,
    TABELA_MEDICOES: buildFinancialTable(data, prazo, periodo).table,
    TABELA_TOTAIS: buildTotalTable(data, prazo, periodo, fin),
    PRAZO_PAGAMENTO_DIAS: String(data.prazo_pagamento_dias ?? 3),
    MULTA_ATRASO_PCT: String(data.multa_atraso_pct ?? 2),
    JUROS_MORA_PCT: String(data.juros_mora_pct ?? 1),
    MULTA_RESCISAO_PCT: String(data.multa_rescisao_pct ?? 20),
    PRAZO_RESCISAO_DIAS: String(data.prazo_rescisao_dias ?? 7),
    INDICE_REAJUSTE: data.indice_reajuste ?? 'nenhum',
    CLAUSULA_REAJUSTE: reajusteTexto,
    CLAUSULA_SEGURO: seguroTexto,
    PERIODICIDADE_ADJ: periodo.adj,
    PERIODICIDADE_SINGULAR: periodo.singular,

    CIDADE_FORO: data.cidade_foro,
    CIDADE_ASSINATURA: data.cidade_assinatura,

    NOME_TESTEMUNHA_1: data.testemunha_1_nome ?? '—',
    CPF_TESTEMUNHA_1: data.testemunha_1_cpf ?? '—',
    NOME_TESTEMUNHA_2: data.testemunha_2_nome ?? '—',
    CPF_TESTEMUNHA_2: data.testemunha_2_cpf ?? '—',
  }

  let filled = template
  Object.entries(vars).forEach(([key, val]) => {
    filled = filled.replaceAll(`{{${key}}}`, val)
  })
  return filled
}

async function generatePDFWithLumin(markdown, contractId) {
  if (!LUMIN_KEY) {
    return { simulated: true, pdf_url: null, message: 'LUMIN_API_KEY não configurada — PDF não gerado' }
  }
  const pdfResp = await fetch(`${LUMIN_API}/v1/markdown-to-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LUMIN_KEY}` },
    body: JSON.stringify({ markdown, filename: `contrato-${contractId}.pdf` }),
  })
  if (!pdfResp.ok) throw new Error(`Lumin PDF error ${pdfResp.status}: ${await pdfResp.text()}`)
  return pdfResp.json()
}

async function sendForSignature(pdfUrl, body) {
  const signResp = await fetch(`${LUMIN_API}/v1/signature-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LUMIN_KEY}` },
    body: JSON.stringify({
      signature_request_title: `${body.nome_obra} — Contrato ${body.numero_contrato}`,
      file_url: pdfUrl,
      signers: body.signers.map(s => ({ name: s.name, email_address: s.email })),
      signing_type: 'SAME_TIME',
      expires_at: { days_from_now: 15 },
      custom_email: { title: `Assinatura requerida — ${body.nome_obra}`, subject_name: `Contrato ${body.numero_contrato}` },
    }),
  })
  if (!signResp.ok) throw new Error(`Lumin signature error ${signResp.status}: ${await signResp.text()}`)
  return signResp.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const errors = validate(req.body)
  if (errors.length > 0) return res.status(400).json({ status: 'validation_error', errors })

  // Determine template path based on language and contract type
  const lang = req.body.lang || 'pt'
  const tipoContrato = req.body.tipo_contrato || 'prestacao_servicos_engenharia'

  let templateRelPath
  if (lang === 'en') {
    const EN_TEMPLATE_MAP = {
      engineering_services: 'en/engineering-services-agreement.md',
      prestacao_servicos: 'en/engineering-services-agreement.md',
      prestacao_servicos_engenharia: 'en/engineering-services-agreement.md',
      construction_management: 'en/construction-management-agreement.md',
      administracao_obra: 'en/construction-management-agreement.md',
      subcontract: 'en/subcontractor-agreement.md',
      empreitada: 'en/subcontractor-agreement.md',
      empreitada_global: 'en/subcontractor-agreement.md',
      empreitada_mao_obra: 'en/subcontractor-agreement.md',
    }
    templateRelPath = EN_TEMPLATE_MAP[tipoContrato] || 'en/engineering-services-agreement.md'
  } else {
    templateRelPath = 'prestacao-servicos-engenharia-obra.md'
  }

  const templatePath = path.join(process.cwd(), 'templates', 'contratos', templateRelPath)
  let templateContent
  try {
    templateContent = fs.readFileSync(templatePath, 'utf-8')
  } catch {
    return res.status(500).json({ status: 'error', message: `Template não encontrado no servidor: ${templateRelPath}` })
  }

  const filledContract = fillTemplate(templateContent, req.body)

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
    template: templateRelPath.replace('.md', ''),
    generated_at: new Date().toISOString(),
    contract_markdown: filledContract,
    pdf: pdfResult,
    signature: signatureResult,
  })
}
