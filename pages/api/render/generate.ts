import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt } = req.body as { prompt?: string }
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(200).json({
      error: 'OPENAI_API_KEY não configurado. Para gerar renderizações, adicione OPENAI_API_KEY nas variáveis de ambiente do Vercel.',
      demo: true,
    })
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || 'Erro ao chamar DALL-E 3' })
    }

    const url = data.data?.[0]?.url
    if (!url) return res.status(500).json({ error: 'Sem URL retornada pelo DALL-E' })

    return res.status(200).json({ url })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
