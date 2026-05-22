import { recordApiCall } from '../../lib/observability'

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

// Pricing per token (USD) — updated May 2026
const COST_RATES = {
  'claude-sonnet-4-6':         { in: 3 / 1_000_000,  out: 15 / 1_000_000 },
  'claude-opus-4-7':           { in: 15 / 1_000_000, out: 75 / 1_000_000 },
  'claude-opus-4-1':           { in: 15 / 1_000_000, out: 75 / 1_000_000 },
  'claude-haiku-4-5-20251001': { in: 0.8 / 1_000_000, out: 4 / 1_000_000 },
}

function calcCost(model, inputTokens, outputTokens) {
  const r = COST_RATES[model] || COST_RATES['claude-sonnet-4-6']
  return inputTokens * r.in + outputTokens * r.out
}

function detectTaskType(messages, system) {
  const text = JSON.stringify(messages) + (system || '')
  if (text.includes('planta') || text.includes('floor plan') || text.includes('BIM')) return 'plant_analysis'
  if (text.includes('contrato') || text.includes('jurídico') || text.includes('legal')) return 'legal_analysis'
  if (text.includes('orçamento') || text.includes('budget') || text.includes('EVM')) return 'budget_analysis'
  if (text.includes('vendas') || text.includes('sales') || text.includes('lead')) return 'sales_copy'
  if (text.includes('documento') || text.includes('document') || text.includes('PDF')) return 'document_ocr'
  if (text.includes('marketing') || text.includes('instagram') || text.includes('whatsapp')) return 'marketing_copy'
  return 'llm_completion'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY não configurada no servidor.' } })
  }

  const { model, max_tokens, system, messages } = req.body
  const usedModel = model || 'claude-sonnet-4-6'
  const startedAt = new Date()

  try {
    const hasPDF = Array.isArray(messages) && messages.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.type === 'document')
    )

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        ...(hasPDF ? { 'anthropic-beta': 'pdfs-2024-09-25' } : {}),
      },
      body: JSON.stringify({
        model:      usedModel,
        max_tokens: max_tokens || 1500,
        system,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      recordApiCall({
        agentId: 'claude-chat',
        taskType: detectTaskType(messages, system),
        model: usedModel,
        provider: 'anthropic',
        startedAt,
        inputTokens: 0,
        outputTokens: 0,
        costUSD: 0,
        success: false,
        metadata: { status: response.status, error: data?.error?.message },
      })
      return res.status(response.status).json(data)
    }

    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0
    const costUSD = calcCost(usedModel, inputTokens, outputTokens)

    recordApiCall({
      agentId: 'claude-chat',
      taskType: detectTaskType(messages, system),
      model: usedModel,
      provider: 'anthropic',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD,
      success: true,
      metadata: {
        hasPDF,
        stop_reason: data.stop_reason,
        duration_ms: Date.now() - startedAt.getTime(),
      },
    })

    return res.status(200).json(data)
  } catch (err) {
    recordApiCall({
      agentId: 'claude-chat',
      taskType: 'llm_completion',
      model: usedModel,
      provider: 'anthropic',
      startedAt,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      success: false,
      metadata: { error: err.message },
    })
    return res.status(500).json({ error: { message: err.message || 'Erro interno do servidor.' } })
  }
}
