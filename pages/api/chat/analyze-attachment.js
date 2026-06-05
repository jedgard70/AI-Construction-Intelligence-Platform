import { Buffer } from 'buffer'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_PDF_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return null
  const mediaType = match[1].toLowerCase()
  const base64 = match[2]
  return {
    mediaType,
    base64,
    bytes: Buffer.byteLength(base64, 'base64'),
  }
}

function extractOpenAIText(data) {
  return data?.choices?.[0]?.message?.content || ''
}

async function callOpenAI(messages, maxTokens = 900) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY nao configurada no servidor.')
    error.statusCode = 500
    throw error
  }

  // Direct fetch keeps CP1 independent from a new SDK dependency.
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Erro ao conectar com a API OpenAI.')
    error.statusCode = response.status
    throw error
  }
  return {
    text: extractOpenAIText(data),
    model: data?.model || OPENAI_MODEL,
    usage: data?.usage || null,
  }
}

async function analyzeImage({ dataUrl, mediaType, prompt, fileName }) {
  return callOpenAI([
    {
      role: 'system',
      content:
        'You are Apex Copilot. Analyze construction, BIM, EVM, operational and business images. Do not expose secrets. Be concise, factual and useful.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: [
            `Attachment name: ${fileName || 'image'}`,
            `Media type: ${mediaType}`,
            prompt ? `User request: ${prompt}` : 'User request: analyze this attachment.',
          ].join('\n'),
        },
        {
          type: 'image_url',
          image_url: { url: dataUrl },
        },
      ],
    },
  ])
}

async function analyzePdf({ base64, prompt, fileName }) {
  const pdfParse = (await import('pdf-parse')).default
  const buffer = Buffer.from(base64, 'base64')
  const parsed = await pdfParse(buffer)
  const text = String(parsed?.text || '').trim().slice(0, 18000)
  if (!text) {
    return {
      text: 'Nao consegui extrair texto pesquisavel deste PDF. OCR ainda nao esta habilitado no CP1.',
      model: 'pdf-parse',
      usage: null,
    }
  }

  return callOpenAI([
    {
      role: 'system',
      content:
        'You are Apex Copilot. Analyze extracted PDF text for construction, BIM, EVM, operational and business context. Do not expose secrets.',
    },
    {
      role: 'user',
      content: [
        `Attachment name: ${fileName || 'document.pdf'}`,
        prompt ? `User request: ${prompt}` : 'User request: analyze this PDF.',
        'Extracted PDF text:',
        text,
      ].join('\n\n'),
    },
  ], 1100)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  if (!bearerToken) {
    return res.status(401).json({ error: { message: 'Authentication required.' } })
  }

  const userContext = await resolveOwnerContext(bearerToken)
  if (!userContext.userId) {
    return res.status(401).json({ error: { message: 'Invalid authentication token.' } })
  }

  const { attachment, prompt = '' } = req.body || {}
  const dataUrl = attachment?.dataUrl
  const fileName = typeof attachment?.name === 'string' ? attachment.name.slice(0, 180) : 'attachment'
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    return res.status(400).json({ error: { message: 'Invalid attachment payload.' } })
  }

  try {
    let result
    if (ALLOWED_IMAGE_TYPES.has(parsed.mediaType)) {
      if (parsed.bytes > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: { message: 'Image attachment exceeds 5MB.' } })
      }
      result = await analyzeImage({
        dataUrl,
        mediaType: parsed.mediaType,
        prompt: String(prompt || '').slice(0, 2000),
        fileName,
      })
    } else if (parsed.mediaType === 'application/pdf') {
      if (parsed.bytes > MAX_PDF_BYTES) {
        return res.status(413).json({ error: { message: 'PDF attachment exceeds 10MB.' } })
      }
      result = await analyzePdf({
        base64: parsed.base64,
        prompt: String(prompt || '').slice(0, 2000),
        fileName,
      })
    } else {
      return res.status(415).json({ error: { message: 'Unsupported attachment type.' } })
    }

    return res.status(200).json({
      id: 'apex-attachment-analysis',
      role: 'assistant',
      model: result.model,
      content: [{ type: 'text', text: result.text || 'OpenAI returned an empty attachment analysis.' }],
      usage: result.usage
        ? {
            input_tokens: result.usage.prompt_tokens,
            output_tokens: result.usage.completion_tokens,
          }
        : null,
      apex_context: {
        role: userContext.role,
        is_owner: userContext.isOwner,
        email: userContext.email,
      },
    })
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      error: { message: error?.message || 'Attachment analysis failed.' },
    })
  }
}
