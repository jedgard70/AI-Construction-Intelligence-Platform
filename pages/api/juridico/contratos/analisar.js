/**
 * POST /api/juridico/contratos/analisar
 *
 * Document_Intelligence_AI — análise jurídica de contratos de construção/investimento.
 */

import { recordApiCall } from '../../../../lib/observability'

const CONTRACT_TYPES = [
  'empreitada','fornecimento','prestacao_servicos','compra_venda_imovel',
  'investimento_imobiliario','locacao','parceria','administracao_obra',
  'empreitada_global','empreitada_mao_obra','outro',
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

  return `Você é o Document_Intelligence_AI, especialista em análise jurídica de contratos de construção civil, engenharia e investimento imobiliário — com domínio da legislação brasileira e europeia.

BASES LEGAIS — BRASIL: Código Civil Arts. 618/927/421-480, Lei 14.133/2021, NR-18, LGPD (Lei 13.709/2018), Lei de Arbitragem 9.307/96, CDC, CTN (ISS/INSS/IRRF), CLT.
BASES LEGAIS — EUROPA: Diretiva 2014/24/UE (contratos públicos), GDPR 2016/679, Diretiva 2011/7/UE (atrasos de pagamento), contratos FIDIC (Red/Yellow/Silver Book), BGB §§631-651 (Alemanha), DL 18/2008 CCP (Portugal), LOE (Espanha), Codice Civile Art.1655-1677 (Itália), Code Civil Art.1787-1800 (França).

Analise o contrato abaixo com rigor técnico e retorne um JSON com a estrutura exata a seguir. Não inclua texto fora do JSON.

{
  "resumo_executivo": "string — visão geral em 2-3 frases: objeto, partes, valor estimado, prazo",
  "partes_identificadas": {
    "contratante": "string ou null",
    "contratado": "string ou null",
    "intervenientes": ["string"]
  },
  "clausulas_criticas": [
    {
      "tipo": "penalidade|rescisao|reajuste|garantia|prazo|pagamento|responsabilidade|subcontratacao|ambiental|nr18_seguranca|fiscal_tributario|seguro|arbitragem|lgpd|propriedade_intelectual|outro",
      "descricao": "string — descrição objetiva da cláusula",
      "risco": "alto|medio|baixo",
      "recomendacao": "string — ação recomendada ao contratante/contratado"
    }
  ],
  "alertas_vencimento": [
    {
      "item": "string",
      "prazo_descrito": "string",
      "urgencia": "critico|atencao|informativo"
    }
  ],
  "inconsistencias": ["string — descrição da inconsistência ou lacuna encontrada"],
  "riscos_juridicos": [
    {
      "risco": "string — descrição do risco",
      "severidade": "alto|medio|baixo",
      "base_legal": "string — lei, artigo ou norma aplicável",
      "categoria": "contratual|trabalhista|fiscal_tributario|ambiental|responsabilidade_civil|penal|regulatorio|outro"
    }
  ],
  "checklist_conformidade": {
    "tem_objeto_definido": true,
    "tem_prazo_definido": true,
    "tem_valor_definido": true,
    "tem_clausula_rescisao": true,
    "tem_clausula_reajuste": true,
    "tem_clausula_garantia": true,
    "tem_foro_definido": true,
    "tem_assinaturas_previstas": true,
    "menciona_art_rrt": true,
    "menciona_nr18": true,
    "menciona_seguro_obra": false,
    "menciona_subcontratacao": false
  },
  "pontos_de_atencao": [
    "string — observação importante não coberta pelos riscos acima"
  ],
  "score_risco_geral": 0,
  "recomendacao_final": "aprovar|revisar_clausulas|rejeitar"
}

Instruções de scoring:
- score_risco_geral: 0 (sem risco) a 100 (risco máximo)
- Penalize fortemente: ausência de foro, cláusulas de rescisão unilateral sem multa, valores indefinidos, ausência de ART/RRT, violação da NR-18
- Penalize moderadamente: ausência de reajuste definido, prazo de pagamento muito longo, ausência de garantia de execução
- recomendacao_final: "aprovar" se score < 35, "revisar_clausulas" se 35–65, "rejeitar" se > 65

Tipo de contrato: ${body.contract_type}
Projeto: ${body.project_id}

${source}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const errors = validate(req.body)
  if (errors.length > 0) return res.status(400).json({ status: 'validation_error', errors })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.status(500).json({ status: 'error', message: 'ANTHROPIC_API_KEY não configurada no servidor.' })
  }

  const startedAt = new Date()
  let inputTokens = 0
  let outputTokens = 0
  let success = false

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
        messages: [{ role: 'user', content: buildPrompt(req.body) }],
      }),
    })

    const data = await resp.json()

    inputTokens = data.usage?.input_tokens || 0
    outputTokens = data.usage?.output_tokens || 0

    if (!resp.ok) {
      recordApiCall({
        agentId: 'document-intelligence-ai',
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
        agentId: 'document-intelligence-ai',
        taskType: 'legal_analysis',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        startedAt,
        inputTokens,
        outputTokens,
        costUSD: (inputTokens * 3 + outputTokens * 15) / 1_000_000,
        success: false,
        metadata: { error: 'JSON parse failed', raw: text.slice(0, 200) },
      })
      return res.status(500).json({ status: 'error', message: 'Resposta inválida do modelo — tente novamente' })
    }

    const analysis = JSON.parse(jsonMatch[0])
    success = true

    recordApiCall({
      agentId: 'document-intelligence-ai',
      taskType: 'legal_analysis',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD: (inputTokens * 3 + outputTokens * 15) / 1_000_000,
      success: true,
      metadata: {
        contract_type: req.body.contract_type,
        score: analysis.score_risco_geral,
        recomendacao: analysis.recomendacao_final,
        duration_ms: Date.now() - startedAt.getTime(),
      },
    })

    return res.status(200).json({
      status: 'success',
      agent: 'Document_Intelligence_AI',
      contract_id: req.body.contract_id,
      project_id: req.body.project_id,
      contract_type: req.body.contract_type,
      analyzed_at: new Date().toISOString(),
      analysis,
    })
  } catch (err) {
    recordApiCall({
      agentId: 'document-intelligence-ai',
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
