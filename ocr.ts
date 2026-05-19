import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { base64, mediaType, isPDF } = req.body

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: isPDF ? 'document' : 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          } as any,
          {
            type: 'text',
            text: `Extraia os dados pessoais deste documento (RG, CPF ou comprovante de residência).
Responda SOMENTE com JSON válido neste formato exato, sem texto antes ou depois:
{"nome":"","cpf":"","rg":"","nacionalidade":"brasileiro(a)","estado_civil":"","profissao":"","endereco":"","cep":"","cidade":"","estado":""}
Se algum campo não estiver visível, deixe como string vazia.`
          }
        ]
      }]
    })

    const text    = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean   = text.replace(/```json|```/g, '').trim()
    const dados   = JSON.parse(clean)
    res.status(200).json(dados)
  } catch (err: any) {
    console.error('OCR error:', err)
    res.status(500).json({ error: err.message })
  }
}
