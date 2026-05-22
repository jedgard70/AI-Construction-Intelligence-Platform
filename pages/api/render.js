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

  const MODELS = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
  ]

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const msg = data.error?.message || ''
        if (msg.includes('quota') || msg.includes('billing') || msg.includes('limit')) {
          return res.status(402).json({
            error: 'Geração de imagens requer billing ativado no Google AI Studio',
            hint: 'Acesse aistudio.google.com → Settings → Billing para ativar. O plano gratuito não inclui geração de imagens.',
            model,
          })
        }
        continue
      }

      const parts = data.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData) {
          return res.json({ imageData: part.inlineData.data, mimeType: part.inlineData.mimeType })
        }
      }
    } catch {
      continue
    }
  }

  return res.status(500).json({
    error: 'Nenhum modelo de imagem disponível',
    hint: 'Verifique se o billing está ativado em aistudio.google.com'
  })
}
