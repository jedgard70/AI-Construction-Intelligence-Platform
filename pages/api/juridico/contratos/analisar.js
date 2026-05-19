/**
 * POST /api/juridico/contratos/analisar
 *
 * Document_Intelligence_AI — análise jurídica de contratos de construção/investimento.
 *
 * Extrai via IA:
 *   - cláusulas críticas (penalidades, rescisão, reajuste, garantias)
 *   - riscos jurídicos classificados por severidade
 *   - alertas de vencimento contratual
 *   - inconsistências e pontos de atenção
 *   - resumo executivo
 *
 * Inputs aceitos:
 *   - texto do contrato (campo "contract_text")
 *   - URL do documento (campo "document_url") — para PDFs hospedados
 */

const CONTRACT_TYPES = [
  'empreitada',
  'fornecimento',
  'prestacao_servicos',
  'compra_venda_imovel',
  'investimento_imobiliario',
  'locacao',
  'parceria',
  'outro',
]

function validate(body) {
  const errors = []
  if (!body.contract_id) errors.push('contract_id é obrigatório')
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.contract_type || !CONTRACT_TYPES.includes(body.contract_type)) {
    errors.push(`contract_type inválido. Use: ${CONTRACT_TYPES.join(', ')}`)
  }
  if (!body.contract_text && !body.document_url) {
    errors.push('Forneça contract_text ou document_url')
  }
  if (body.contract_text && body.contract_text.length < 50) {
    errors.push('contract_text muito curto (mínimo 50 caracteres)')
  }
  return errors
}

function buildPrompt(body) {
  const source = body.contract_text
    ? `TEXTO DO CONTRATO:\n${body.contract_text}`
    : `URL DO DOCUMENTO: ${body.document_url}`

  return `Você é o Document_Intelligence_AI, especialista em análise jurídica de contratos de construção civil e investimento imobiliário no Brasil.

Analise o contrato abaixo e retorne um JSON com a estrutura exata:
{
  "resumo_executivo": "string — visão geral do contrato em 2-3 frases",
  "partes_identificadas": {
    "contratante": "string ou null",
    "contratado": "string ou null",
    "intervenientes": ["string"]
  },
  "clausulas_criticas": [
    {
      "tipo": "penalidade|rescisao|reajuste|garantia|prazo|pagamento|responsabilidade|outro",
      "descricao": "string",
      "risco": "alto|medio|baixo",
      "recomendacao": "string"
    }
  ],
  "alertas_vencimento": [
    {
      "item": "string",
      "prazo_descrito": "string",
      "urgencia": "critico|atencao|informativo"
    }
  ],
  "inconsistencias": ["string"],
  "riscos_juridicos": [
    {
      "risco": "string",
      "severidade": "alto|medio|baixo",
      "base_legal": "string"
    }
  ],
  "score_risco_geral": 0,
  "recomendacao_final": "aprovar|revisar_clausulas|rejeitar"
}

score_risco_geral: número de 0 (sem risco) a 100 (risco máximo).

Tipo de contrato: ${body.contract_type}
Projeto: ${body.project_id}

${source}`
}

async function analyzeWithAI(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: 'Responda APENAS com JSON válido, sem texto antes ou depois. Sem markdown, sem code fences.',
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    })
    const data = await resp.json()
    if (data.error) { console.error('[Document_Intelligence_AI] API error:', data.error.message); return null }
    const text = data?.content?.[0]?.text?.trim() || ''
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    return JSON.parse(text.slice(start, end + 1))
  } catch (err) {
    console.error('[Document_Intelligence_AI] parse error:', err?.message)
    return null
  }
}

function fallbackAnalysis(body) {
  return {
    resumo_executivo: `Contrato do tipo ${body.contract_type} recebido para análise. ANTHROPIC_API_KEY não configurada — análise IA indisponível.`,
    partes_identificadas: { contratante: null, contratado: null, intervenientes: [] },
    clausulas_criticas: [],
    alertas_vencimento: [],
    inconsistencias: ['Análise automática indisponível — configure ANTHROPIC_API_KEY'],
    riscos_juridicos: [],
    score_risco_geral: 0,
    recomendacao_final: 'revisar_clausulas',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  const analysis = (await analyzeWithAI(req.body)) ?? fallbackAnalysis(req.body)

  return res.status(200).json({
    status: 'success',
    agent: 'Document_Intelligence_AI',
    contract_id: req.body.contract_id,
    project_id: req.body.project_id,
    contract_type: req.body.contract_type,
    analyzed_at: new Date().toISOString(),
    analysis,
  })
}
