export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY não configurado',
      hint: 'Configure GEMINI_API_KEY no .env.local para gerar renders reais'
    })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err.error?.message || 'Erro Gemini API' })
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData) {
        return res.json({ imageData: part.inlineData.data, mimeType: part.inlineData.mimeType })
      }
    }
    return res.status(500).json({ error: 'Nenhuma imagem retornada pelo Gemini' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
