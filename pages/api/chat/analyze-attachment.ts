import { IncomingForm, File as FormidableFile } from 'formidable'
import fs from 'fs'
import path from 'path'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

export const config = {
  api: { bodyParser: false },
}

type AnalysisResult = {
  success: boolean
  analysis: string
  error?: string
}

async function analyzeImageWithOpenAI(base64: string, mediaType: string, apiKey: string): Promise<AnalysisResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64}`,
                },
              },
              {
                type: 'text',
                text: 'Analise esta imagem. Descreva o conteúdo principal, contexto e qualquer texto visível. Se for um screenshot ou documento visual, resuma os pontos-chave.',
              },
            ],
          },
        ],
      }),
    })

    const data = (await res.json()) as any

    if (!res.ok) {
      const errorMessage = data?.error?.message || `HTTP ${res.status}`
      const isBillingError = errorMessage.includes('insufficient') || errorMessage.includes('billing') || errorMessage.includes('quota')
      const isRateLimit = res.status === 429

      if (isBillingError || isRateLimit) {
        return {
          success: false,
          analysis: '',
          error: isBillingError ? 'billing' : 'rate_limit',
        }
      }

      return {
        success: false,
        analysis: 'Erro ao analisar imagem com OpenAI.',
        error: 'api_error',
      }
    }

    const content = data.choices?.[0]?.message?.content
    if (content) {
      return {
        success: true,
        analysis: content,
      }
    }

    return {
      success: false,
      analysis: 'Nao foi possivel analisar a imagem.',
      error: 'no_response',
    }
  } catch (err) {
    return {
      success: false,
      analysis: '',
      error: 'request_failed',
    }
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

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
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

      const result = await analyzeImageWithOpenAI(base64, fileType, openaiKey)
      if (result.success) {
        return res.status(200).json({ type: 'image', analysis: result.analysis, filename: file.originalFilename })
      }

      return res.status(503).json({ error: 'Attachment analysis is temporarily unavailable. Please check OpenAI API key or billing.' })
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
