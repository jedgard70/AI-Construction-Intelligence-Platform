import { Buffer } from 'buffer'
import zlib from 'zlib'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const CP1_LARGE_FILE_MESSAGE = 'Arquivo recebido, mas excede o limite CP1 de 10MB. Será tratado em checkpoint de arquivos grandes.'
const TEXT_LIMIT = 18000
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const CP1_ENDPOINT_MARKER = 'CP1 endpoint: analyze-attachment v125-forensic-universal-intake'
const TEXT_TYPES = new Set([
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
])
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'

const EXTENSION_TYPE = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  pdf: 'pdf',
  txt: 'text',
  md: 'text',
  csv: 'text',
  json: 'text',
  xml: 'text',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  doc: 'office',
  docx: 'office',
  ppt: 'office',
  pptx: 'office',
  ifc: 'bim',
  rvt: 'bim',
  skp: 'bim',
  dwg: 'cad',
  dxf: 'cad',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
}

function getExtension(fileName = '') {
  const clean = String(fileName).toLowerCase().split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts.pop() : ''
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:([^;,]*)(?:;[^,]*)?;base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return null
  const mediaType = (match[1] || 'application/octet-stream').toLowerCase()
  const base64 = match[2]
  return {
    mediaType,
    base64,
    bytes: Buffer.byteLength(base64, 'base64'),
  }
}

function classifyAttachment(fileName, mediaType) {
  const extension = getExtension(fileName)
  if (IMAGE_TYPES.has(mediaType)) return 'image'
  if (mediaType === 'application/pdf') return 'pdf'
  if (TEXT_TYPES.has(mediaType) || mediaType.startsWith('text/')) return 'text'
  if (mediaType.includes('spreadsheet') || mediaType.includes('excel')) return 'spreadsheet'
  if (mediaType.includes('wordprocessingml') || mediaType.includes('msword') || mediaType.includes('presentation')) return 'office'
  if (mediaType.includes('zip') || mediaType.includes('compressed')) return 'archive'
  if (mediaType.startsWith('video/')) return 'video'
  return EXTENSION_TYPE[extension] || 'unknown'
}

function workflowFor(type) {
  const workflows = {
    image: 'image/vision analysis',
    pdf: 'checkpoint documental/OCR',
    text: 'checkpoint documental/text intelligence',
    spreadsheet: 'checkpoint planilhas/Excel',
    bim: 'checkpoint BIM/3D',
    cad: 'checkpoint CAD/DWG/DXF',
    office: 'checkpoint Office/document intelligence',
    archive: 'checkpoint arquivos compactados',
    video: 'checkpoint video/director analysis',
    unknown: 'universal file intake triage',
  }
  return workflows[type] || workflows.unknown
}

function humanFormatLabel(fileName, type) {
  const ext = getExtension(fileName).toUpperCase()
  if (type === 'bim') return ext ? `BIM/${ext}` : 'BIM'
  if (type === 'cad') return ext ? `CAD/${ext}` : 'CAD'
  if (type === 'spreadsheet') return ext ? `Spreadsheet/${ext}` : 'Spreadsheet'
  if (type === 'office') return ext ? `Office/${ext}` : 'Office'
  if (type === 'archive') return ext ? `Archive/${ext}` : 'Archive'
  if (type === 'video') return ext ? `Video/${ext}` : 'Video'
  if (type === 'text') return ext ? `Text/${ext}` : 'Text'
  if (type === 'pdf') return 'PDF'
  if (type === 'image') return ext ? `Image/${ext}` : 'Image'
  return ext || 'unknown'
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

  // Direct fetch keeps CP1 independent from a new OpenAI SDK dependency.
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
  const result = await callOpenAI([
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
  return {
    analysis: result.text || 'Imagem recebida, mas a analise retornou vazia.',
    supportedAnalysis: true,
    model: result.model,
    usage: result.usage,
  }
}

function decodePdfLiteral(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}

function extractTextFromPdfChunk(text) {
  const out = []
  const literalMatches = text.matchAll(/\((?:\\.|[^\\()])*\)\s*Tj/g)
  for (const match of literalMatches) {
    out.push(decodePdfLiteral(match[0].replace(/\)\s*Tj$/, '').slice(1)))
  }

  const arrayMatches = text.matchAll(/\[((?:\s*\((?:\\.|[^\\()])*\)\s*)+)\]\s*TJ/g)
  for (const match of arrayMatches) {
    const literals = match[1].matchAll(/\((?:\\.|[^\\()])*\)/g)
    const parts = []
    for (const literal of literals) {
      parts.push(decodePdfLiteral(literal[0].slice(1, -1)))
    }
    if (parts.length) out.push(parts.join(''))
  }

  return out.join('\n')
}

function inflatePdfStreams(raw) {
  const chunks = []
  const streamMatches = raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)
  for (const match of streamMatches) {
    const streamBytes = Buffer.from(match[1], 'binary')
    try {
      chunks.push(zlib.inflateSync(streamBytes).toString('latin1'))
      continue
    } catch {
      // try raw deflate next
    }
    try {
      chunks.push(zlib.inflateRawSync(streamBytes).toString('latin1'))
    } catch {
      // ignore unreadable compressed stream
    }
  }
  return chunks
}

function extractPdfTextBestEffort(buffer) {
  const raw = buffer.toString('latin1')
  const chunks = [raw, ...inflatePdfStreams(raw)]
  return chunks
    .map(extractTextFromPdfChunk)
    .join('\n')
    .replace(/\s{3,}/g, ' ')
    .trim()
    .slice(0, TEXT_LIMIT)
}

async function analyzePdf({ base64, prompt, fileName }) {
  try {
    const buffer = Buffer.from(base64, 'base64')
    const text = extractPdfTextBestEffort(buffer)
    if (!text || text.length < 20) {
      return {
        analysis: 'PDF recebido. Extração de texto falhou no CP1. O arquivo foi aceito e será tratado em checkpoint documental/OCR.',
        supportedAnalysis: false,
        model: 'apex-pdf-best-effort',
        usage: null,
      }
    }

    const result = await callOpenAI([
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

    return {
      analysis: result.text || 'PDF recebido, mas a analise retornou vazia.',
      supportedAnalysis: true,
      model: result.model,
      usage: result.usage,
    }
  } catch {
    return {
      analysis: 'PDF recebido. Extração de texto falhou no CP1. O arquivo foi aceito e será tratado em checkpoint documental/OCR.',
      supportedAnalysis: false,
      model: 'apex-pdf-best-effort',
      usage: null,
    }
  }
}

async function analyzeText({ base64, prompt, fileName, mediaType }) {
  const text = Buffer.from(base64, 'base64').toString('utf8').replace(/\0/g, '').trim().slice(0, TEXT_LIMIT)
  if (!text) {
    return {
      analysis: `Arquivo recebido e classificado como texto, mas nao ha conteudo textual legivel. Workflow: ${workflowFor('text')}.`,
      supportedAnalysis: false,
      model: 'apex-text-intake',
      usage: null,
    }
  }

  const result = await callOpenAI([
    {
      role: 'system',
      content:
        'You are Apex Copilot. Summarize and classify text, CSV, JSON, Markdown or XML files for operational construction/business workflows. Do not expose secrets.',
    },
    {
      role: 'user',
      content: [
        `Attachment name: ${fileName}`,
        `Media type: ${mediaType}`,
        prompt ? `User request: ${prompt}` : 'User request: summarize and classify this file.',
        'File text:',
        text,
      ].join('\n\n'),
    },
  ], 900)

  return {
    analysis: result.text || 'Arquivo textual recebido, mas a analise retornou vazia.',
    supportedAnalysis: true,
    model: result.model,
    usage: result.usage,
  }
}

function classifyOnly({ fileName, mediaType, type, bytes }) {
  const label = humanFormatLabel(fileName, type)
  return {
    analysis: [
      `Arquivo recebido e classificado como ${label}.`,
      'Leitura profunda será tratada em checkpoint específico; CP1 registra intake e classificação sem deep parse para este formato.',
      `Arquivo: ${fileName}`,
      `Tipo classificado: ${type}`,
      `MIME: ${mediaType || 'application/octet-stream'}`,
      `Tamanho: ${(bytes / 1024).toFixed(1)} KB`,
      `Workflow recomendado: ${workflowFor(type)}.`,
    ].join('\n'),
    supportedAnalysis: false,
    model: 'apex-universal-intake',
    usage: null,
  }
}

function sendNormalized(res, status, payload) {
  return res.status(status).json({
    id: 'apex-attachment-analysis',
    role: 'assistant',
    type: payload.type,
    analysis: payload.analysis,
    filename: payload.filename,
    supportedAnalysis: payload.supportedAnalysis,
    model: payload.model,
    content: [{ type: 'text', text: payload.analysis }],
    usage: payload.usage
      ? {
          input_tokens: payload.usage.prompt_tokens,
          output_tokens: payload.usage.completion_tokens,
        }
      : null,
    runtime_marker: CP1_ENDPOINT_MARKER,
    deployed_commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || null,
    apex_context: payload.apex_context,
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  if (!bearerToken) {
    return res.status(401).json({ error: { message: 'Please log in on this Preview before using protected attachment analysis.' } })
  }

  const userContext = await resolveOwnerContext(bearerToken)
  if (!userContext.userId) {
    return res.status(401).json({ error: { message: 'Please log in on this Preview before using protected attachment analysis.' } })
  }

  const { attachment, prompt = '' } = req.body || {}
  const dataUrl = attachment?.dataUrl
  const fileName = typeof attachment?.name === 'string' ? attachment.name.slice(0, 180) : 'attachment'
  const providedType = typeof attachment?.type === 'string' ? attachment.type.toLowerCase() : ''
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    return res.status(400).json({ error: { message: 'Invalid attachment payload.' } })
  }

  const mediaType = providedType || parsed.mediaType || 'application/octet-stream'
  const type = classifyAttachment(fileName, mediaType)
  const apex_context = {
    role: userContext.role,
    is_owner: userContext.isOwner,
    email: userContext.email,
  }

  if (parsed.bytes > MAX_ATTACHMENT_BYTES) {
    return sendNormalized(res, 413, {
      type,
      filename: fileName,
      analysis: CP1_LARGE_FILE_MESSAGE,
      supportedAnalysis: false,
      model: 'apex-universal-intake',
      usage: null,
      apex_context,
    })
  }

  try {
    let result
    if (type === 'image') {
      result = await analyzeImage({
        dataUrl,
        mediaType,
        prompt: String(prompt || '').slice(0, 2000),
        fileName,
      })
    } else if (type === 'pdf') {
      result = await analyzePdf({
        base64: parsed.base64,
        prompt: String(prompt || '').slice(0, 2000),
        fileName,
      })
    } else {
      result = classifyOnly({ fileName, mediaType, type, bytes: parsed.bytes })
    }

    return sendNormalized(res, 200, {
      type,
      filename: fileName,
      analysis: result.analysis,
      supportedAnalysis: result.supportedAnalysis,
      model: result.model,
      usage: result.usage,
      apex_context,
    })
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      error: {
        message: error?.statusCode
          ? 'OpenAI Vision/analysis provider unavailable for this attachment. The file was accepted by CP1 intake; try again or route it to the next checkpoint.'
          : 'Attachment analysis failed.',
      },
    })
  }
}
