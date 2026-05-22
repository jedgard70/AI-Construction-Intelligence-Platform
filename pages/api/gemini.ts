import type { NextApiRequest, NextApiResponse } from 'next'
import { recordApiCall } from '../../lib/observability'

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

// Gemini 2.0 Flash pricing (USD per token)
const GEMINI_RATES: Record<string, { in: number; out: number }> = {
  'gemini-2.0-flash':        { in: 0.075 / 1_000_000, out: 0.30 / 1_000_000 },
  'gemini-2.5-flash':        { in: 0.15 / 1_000_000,  out: 0.60 / 1_000_000 },
  'gemini-2.5-flash-image':  { in: 0.15 / 1_000_000,  out: 0.60 / 1_000_000 },
  'gemini-3.1-flash-image-preview': { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
}

function geminiCost(model: string, inputTokens: number, outputTokens: number): number {
  const r = GEMINI_RATES[model] || GEMINI_RATES['gemini-2.0-flash']
  return inputTokens * r.in + outputTokens * r.out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  const { model = 'gemini-2.0-flash', ...body } = req.body
  const startedAt = new Date()

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    const data = await resp.json()

    const inputTokens = data.usageMetadata?.promptTokenCount || 0
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0
    const success = resp.ok && !data.error

    recordApiCall({
      agentId: 'gemini',
      taskType: 'llm_completion',
      model,
      provider: 'google',
      startedAt,
      inputTokens,
      outputTokens,
      costUSD: geminiCost(model, inputTokens, outputTokens),
      success,
      metadata: {
        status: resp.status,
        duration_ms: Date.now() - startedAt.getTime(),
        ...(data.error ? { error: data.error.message } : {}),
      },
    })

    res.status(resp.status).json(data)
  } catch (err: any) {
    recordApiCall({
      agentId: 'gemini',
      taskType: 'llm_completion',
      model,
      provider: 'google',
      startedAt,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      success: false,
      metadata: { error: err.message },
    })
    res.status(500).json({ error: err.message || 'Gemini API error' })
  }
}
