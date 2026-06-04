import { IncomingForm, File as FormidableFile } from 'formidable'
import fs from 'fs'
import path from 'path'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

export const config = {
  api: { bodyParser: false },
}

async function analyzeWithAnthropic(base64: string, mediaType: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              { type: 'text', text: 'Analise esta imagem. Descreva o conteúdo principal, contexto e qualquer texto visível. Se for um screenshot ou documento visual, resuma os pontos-chave.' },
            ],
          },
        ],
      }),
    })

    const data = (await res.json()) as any
    if (data.content?.[0]?.text) {
      return data.content[0].text
    }
    return 'Nao foi possivel analisar a imagem.'
  } catch (err) {
    console.error('[ANALYZE_ATTACHMENT] Anthropic error:', err)
    return 'Erro ao analisar imagem com o modelo.'
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfParse = require('pdf-parse')
    const fileBuffer = fs.readFileSync(filePath)
    const data = await pdfParse(fileBuffer)

    const text = data.text || ''
    if (text.trim().length > 0) {
      return `Conteúdo extraído do PDF (${data.numpages} páginas):\n\n${text.substring(0, 1000)}${text.length > 1000 ? '\n[... conteúdo truncado]' : ''}`
    }
    return `PDF com ${data.numpages} páginas. Nao foi possivel extrair texto legível.`
  } catch (err) {
    console.error('[ANALYZE_ATTACHMENT] PDF parse error:', err)
    return 'Erro ao processar PDF. O arquivo pode estar corrompido ou criptografado.'
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  if (!bearerToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await resolveOwnerContext(bearerToken)
  if (!user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const form = new IncomingForm({
    maxFileSize: 15 * 1024 * 1024,
    maxFiles: 1,
  })

  let uploadedFilePath: string | null = null

  try {
    const [fields, files] = await form.parse(req)
    const fileArray = Array.isArray(files.file) ? files.file : files.file ? [files.file] : []

    if (!fileArray.length) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = fileArray[0] as FormidableFile
    uploadedFilePath = file.filepath
    const fileType = file.mimetype || ''

    if (fileType.startsWith('image/')) {
      const buffer = fs.readFileSync(file.filepath)
      const base64 = buffer.toString('base64')
      const analysis = await analyzeWithAnthropic(base64, fileType, apiKey)
      return res.status(200).json({ type: 'image', analysis, filename: file.originalFilename })
    }

    if (fileType === 'application/pdf') {
      const analysis = await extractPdfText(file.filepath)
      return res.status(200).json({ type: 'pdf', analysis, filename: file.originalFilename })
    }

    return res.status(400).json({ error: 'Unsupported file type. Use PNG, JPEG, WebP, or PDF.' })
  } catch (err) {
    console.error('[ANALYZE_ATTACHMENT] Error:', err)
    return res.status(500).json({ error: 'Failed to process attachment' })
  } finally {
    if (uploadedFilePath) {
      try {
        fs.unlinkSync(uploadedFilePath)
      } catch {}
    }
  }
}
