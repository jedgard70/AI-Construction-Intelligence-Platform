/**
 * POST /api/juridico/due-diligence/relatorio
 *
 * Gera relatório automático de due diligence jurídica e financeira
 * para investidores em projetos de construção/imobiliário.
 */

import { recordApiCall } from '../../../../lib/observability'

const PROJECT_STAGES = [
  'pre_lancamento',
  'lancamento',
  'em_construcao',
  'concluido',
  'retrofit',
]

function validate(body) {
  const errors = []
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.investor_id) errors.push('investor_id é obrigatório')
  if (!body.project_stage || !PROJECT_STAGES.includes(body.project_stage)) {
    errors.push(`project_stage inválido. Use: ${PROJECT_STAGES.join(', ')}`)
  }
  if (!body.project_data || typeof body.project_data !== 'object') {
    errors.push('project_data (objeto com dados do projeto) é obrigatório')
  }
  return errors
}

function buildPrompt(body) {
  return `Você é o Investment_Analyst_AI com função de due diligence jurídica da AI Construction Intelligence Platform.

Gere um relatório completo de due diligence para um investidor considerando os dados abaixo.

Retorne JSON com estrutura exata (sem texto fora do JSON):
{
  "headline": "string — título executivo do relatório",
  "data_relatorio": "string",
  "situacao_juridica": {
    "status": "regular|irregular|pendente",
    "certidoes": [
      { "tipo": "string", "situacao": "ok|pendente|negativa", "observacao": "string" }
    ],
    "litigios_identificados": ["string"],
    "passivos_ocultos_estimados": "string"
  },
  "regularidade_fiscal_trabalhista": {
    "status": "regular|irregular|pendente",
    "pontos_atencao": ["string"]
  },
  "analise_documental": {
    "documentos_ok": ["string"],
    "documentos_pendentes": ["string"],
    "documentos_criticos_ausentes": ["string"]
  },
  "riscos_identificados": [
    {
      "risco": "string",
      "categoria": "juridico|financeiro|tecnico|ambiental|trabalhista",
      "probabilidade": "alta|media|baixa",
      "impacto": "alto|medio|baixo",
      "mitigacao": "string"
    }
  ],
  "indicadores_financeiros": {
    "vgv_estimado": "string",
    "roi_projetado": "string",
    "cap_rate": "string",
    "payback_estimado": "string"
  },
  "score_due_diligence": 0,
  "rating": "A|B|C|D",
  "recomendacao": "investir|investir_com_ressalvas|aguardar_regularizacao|nao_investir",
  "condicoes_para_investimento": ["string"],
  "proximos_passos": ["string"]
}

score_due_diligence: 0-100.
rating: A (excelente), B (bom), C (atenção), D (alto risco).

PROJETO: ${body.project_id}
ETAPA: ${body.project_stage}
INVESTIDOR: ${body.investor_id}

DADOS DO PROJETO:
${JSON.stringify(body.project_data, null, 2)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.status(500).json({ status: 'error', message: 'ANTHROPIC_API_KEY não configurada no servidor.' })
  }

  const startedAt = new Date()
  let inputTokens = 0
  let outputTokens = 0

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
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(req.body) }],
      }),
    })

    const data = await resp.json()
    inputTokens = data.usage?.input_tokens || 0
    outputTokens = data.usage?.output_tokens || 0

    if (!resp.ok) {
      recordApiCall({
        agentId: 'investment-analyst-ai',
        taskType: 'legal_analysis',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        startedAt,
        inputTokens,
        outputTokens,
        costUSD: 0,
        success: false,
        metadata: { status: resp.status, error: data?.error?.message },
      })
      return res.status(resp.status).json({ status: 'error', message: data?.error?.message || 'Erro na API Claude' })
    }

    const text = data?.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      recordApiCall({
        agentId: 'investment-analyst-ai',
        taskType: 'legal_analysis',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        startedAt,
        inputTokens,
        outputTokens,
        costUSD: (inputTokens * 3 + outputTokens * 15) / 1_000_000,
        success: false,
        metadata: { error: 'JSON parse failed' },
      })
      return res.status(500).json({ status: 'error', message: 'Resposta inválida do modelo — tente novamente' })
    }

    const report = JSON.parse(jsonMatch[0])

    recordApiCall({
      agentId: 'investment-analyst-ai',
      taskType: 'legal_analysis',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD: (inputTokens * 3 + outputTokens * 15) / 1_000_000,
      success: true,
      metadata: {
        project_stage: req.body.project_stage,
        score: report.score_due_diligence,
        rating: report.rating,
        recomendacao: report.recomendacao,
        duration_ms: Date.now() - startedAt.getTime(),
      },
    })

    return res.status(200).json({
      status: 'success',
      agent: 'Investment_Analyst_AI',
      report_id: `DD-${Date.now()}`,
      project_id: req.body.project_id,
      investor_id: req.body.investor_id,
      project_stage: req.body.project_stage,
      generated_at: new Date().toISOString(),
      report,
    })
  } catch (err) {
    recordApiCall({
      agentId: 'investment-analyst-ai',
      taskType: 'legal_analysis',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD: 0,
      success: false,
      metadata: { error: err.message },
    })
    return res.status(500).json({ status: 'error', message: err.message || 'Erro interno do servidor' })
  }
}
