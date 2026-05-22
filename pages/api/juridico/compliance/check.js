/**
 * POST /api/juridico/compliance/check
 *
 * Valida um projeto/documento contra os padrões de compliance da plataforma:
 *   ISO_19650, ISO_9001, ISO_14001, ISO_45001, LGPD, NR-18, NR-35, NR-10,
 *   NR-06, NR-33, ABNT_NBR_15575, SOC_2_Type_II
 */

import { recordApiCall } from '../../../../lib/observability'

const COMPLIANCE_STANDARDS = {
  ISO_19650: { label: 'ISO 19650 — Gestão de Informação BIM', domain: 'bim' },
  ISO_9001: { label: 'ISO 9001 — Sistema de Gestão da Qualidade', domain: 'quality' },
  ISO_14001: { label: 'ISO 14001 — Gestão Ambiental', domain: 'environment' },
  ISO_45001: { label: 'ISO 45001 — Saúde e Segurança Ocupacional', domain: 'safety' },
  LGPD: { label: 'LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)', domain: 'data' },
  NR_18: { label: 'NR-18 — Condições de Trabalho na Indústria da Construção', domain: 'safety' },
  NR_35: { label: 'NR-35 — Trabalho em Altura', domain: 'safety' },
  NR_10: { label: 'NR-10 — Segurança em Instalações Elétricas', domain: 'safety' },
  NR_06: { label: 'NR-06 — Equipamentos de Proteção Individual', domain: 'safety' },
  NR_33: { label: 'NR-33 — Trabalho em Espaço Confinado', domain: 'safety' },
  ABNT_NBR_15575: { label: 'ABNT NBR 15575 — Desempenho de Edificações', domain: 'quality' },
  SOC_2_Type_II: { label: 'SOC 2 Type II — Controles de Segurança e Disponibilidade', domain: 'data' },
}

const ALL_STANDARDS = Object.keys(COMPLIANCE_STANDARDS)

function validate(body) {
  const errors = []
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.scope || typeof body.scope !== 'object') {
    errors.push('scope (objeto com dados do projeto para avaliação) é obrigatório')
  }
  if (body.standards && !Array.isArray(body.standards)) {
    errors.push('standards deve ser um array')
  }
  if (body.standards) {
    const invalid = body.standards.filter(s => !ALL_STANDARDS.includes(s))
    if (invalid.length > 0) {
      errors.push(`standards inválidos: ${invalid.join(', ')}. Use: ${ALL_STANDARDS.join(', ')}`)
    }
  }
  return errors
}

function buildPrompt(body, standardsToCheck) {
  const standardsList = standardsToCheck
    .map(s => `- ${s}: ${COMPLIANCE_STANDARDS[s].label}`)
    .join('\n')

  return `Você é o Compliance_Agent da AI Construction Intelligence Platform. Avalie o escopo do projeto abaixo contra os padrões de compliance listados.

Para cada padrão, determine se está CONFORME, NÃO_CONFORME ou PARCIALMENTE_CONFORME com base nas informações fornecidas.

Retorne JSON com estrutura exata (sem texto fora do JSON):
{
  "resultado_geral": "conforme|parcialmente_conforme|nao_conforme",
  "score_compliance": 0,
  "resultados": [
    {
      "standard": "string",
      "status": "conforme|parcialmente_conforme|nao_conforme|informacao_insuficiente",
      "evidencias": ["string"],
      "nao_conformidades": ["string"],
      "plano_acao": ["string"],
      "prazo_regularizacao": "string ou null"
    }
  ],
  "nao_conformidades_criticas": ["string"],
  "acoes_imediatas": ["string"],
  "proxima_auditoria_recomendada": "string"
}

score_compliance: 0-100 (percentual de conformidade geral).

PROJETO: ${body.project_id}
PADRÕES A VERIFICAR:
${standardsList}

ESCOPO DO PROJETO:
${JSON.stringify(body.scope, null, 2)}`
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

  const standardsToCheck = req.body.standards ?? ALL_STANDARDS
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
        messages: [{ role: 'user', content: buildPrompt(req.body, standardsToCheck) }],
      }),
    })

    const data = await resp.json()
    inputTokens = data.usage?.input_tokens || 0
    outputTokens = data.usage?.output_tokens || 0

    if (!resp.ok) {
      recordApiCall({
        agentId: 'compliance-agent',
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
        agentId: 'compliance-agent',
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

    const result = JSON.parse(jsonMatch[0])

    recordApiCall({
      agentId: 'compliance-agent',
      taskType: 'legal_analysis',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD: (inputTokens * 3 + outputTokens * 15) / 1_000_000,
      success: true,
      metadata: {
        standards_count: standardsToCheck.length,
        score: result.score_compliance,
        resultado_geral: result.resultado_geral,
        duration_ms: Date.now() - startedAt.getTime(),
      },
    })

    return res.status(200).json({
      status: 'success',
      agent: 'Compliance_Agent',
      project_id: req.body.project_id,
      standards_checked: standardsToCheck,
      checked_at: new Date().toISOString(),
      result,
    })
  } catch (err) {
    recordApiCall({
      agentId: 'compliance-agent',
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
