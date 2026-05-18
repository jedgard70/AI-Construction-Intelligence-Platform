/**
 * POST /api/plantas/analisar
 *
 * BIM_Coordinator_AI — análise de plantas e drawings via IA.
 *
 * Recebe dados de uma planta/sheet e retorna:
 *   - findings: lista de achados (code, clash, missing, accessibility, dimension)
 *   - resumo executivo
 *   - estatísticas
 *
 * Body:
 * {
 *   sheet_id:      string,
 *   project_id:    string,
 *   sheet_name:    string,
 *   scale:         string,   // e.g. "1:100"
 *   description?:  string,   // texto descrevendo o que está na planta
 *   document_url?: string,   // URL do PDF/DWG (futuro: processamento real)
 *   findings?:     array,    // findings manuais a incluir/enriquecer
 * }
 */

const FINDING_CATEGORIES = ['code', 'clash', 'missing', 'accessibility', 'dimension']
const SEVERITY_LEVELS = ['high', 'med', 'low']

function validate(body) {
  const errors = []
  if (!body.sheet_id)   errors.push('sheet_id é obrigatório')
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.sheet_name) errors.push('sheet_name é obrigatório')
  if (!body.scale)      errors.push('scale é obrigatório (ex: "1:100")')
  return errors
}

function buildPrompt(body) {
  const context = body.description
    ? `Descrição da planta: ${body.description}`
    : `Planta: ${body.sheet_name} (escala ${body.scale})`

  const existingFindings = body.findings?.length
    ? `\n\nFindings já identificados:\n${JSON.stringify(body.findings, null, 2)}`
    : ''

  return `Você é o BIM_Coordinator_AI, especialista em análise de plantas arquitetônicas e conformidade com normas técnicas brasileiras.

Analise a planta abaixo e identifique achados (findings) técnicos.

Para cada finding retorne:
- id: string no formato "F-XXX" (número sequencial de 3 dígitos)
- cat: uma de: ${FINDING_CATEGORIES.join(', ')}
- sev: uma de: ${SEVERITY_LEVELS.join(', ')}
- conf: número 0.0-1.0 (confiança da análise)
- title: título curto e técnico (máx 60 chars)
- body: descrição técnica detalhada com medidas e referências normativas
- ref: referência normativa (ex: "NBR 9077 §4.5.3", "NR-18", "ADA §304.3")
- room: ambiente afetado

Retorne JSON com:
{
  "resumo_executivo": "string — 2-3 frases resumindo o estado geral da planta",
  "sheet_id": "${body.sheet_id}",
  "findings": [...],
  "estatisticas": {
    "total": number,
    "high": number,
    "med": number,
    "low": number,
    "por_categoria": { "code": number, "clash": number, "missing": number, "accessibility": number, "dimension": number },
    "confianca_media": number
  },
  "recomendacao": "aprovar|revisar_menor|revisar_maior|reprovar"
}

Projeto: ${body.project_id}
Folha: ${body.sheet_id} — ${body.sheet_name}
Escala: ${body.scale}
${context}${existingFindings}`
}

async function analyzeWithAI(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    })
    const data = await resp.json()
    const text = data?.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

// Demo findings for when no API key is configured
function demoAnalysis(body) {
  return {
    resumo_executivo: `Análise demo da folha ${body.sheet_id}. Configure ANTHROPIC_API_KEY para análise real com IA.`,
    sheet_id: body.sheet_id,
    findings: [
      {
        id: 'F-014', cat: 'code', sev: 'high', conf: 0.94,
        title: 'Largura de saída abaixo do mínimo normativo',
        body: 'Corredor A04 mede 1.05 m livre. NBR 9077 exige ≥ 1.20 m para lotação > 50 pessoas.',
        ref: 'NBR 9077 §4.5.3', room: 'A04 · Circulação',
      },
      {
        id: 'F-021', cat: 'clash', sev: 'high', conf: 0.88,
        title: 'Conflito duto HVAC × viga estrutural',
        body: 'Duto Ø450 mm roteado a FFL+2.85 conflita com viga W14×30 na linha de grid C-4.',
        ref: 'Quadro de Vigas §2.1', room: 'A03 · Sala de Reuniões',
      },
      {
        id: 'F-027', cat: 'accessibility', sev: 'med', conf: 0.91,
        title: 'Raio de giro WC abaixo do mínimo ADA',
        body: 'Raio de giro para cadeirante A05 é 1.42 m. ADA exige mínimo de 1.50 m de diâmetro.',
        ref: 'ADA §304.3 / NBR 9050', room: 'A05 · Banheiro',
      },
    ],
    estatisticas: {
      total: 3, high: 2, med: 1, low: 0,
      por_categoria: { code: 1, clash: 1, missing: 0, accessibility: 1, dimension: 0 },
      confianca_media: 0.91,
    },
    recomendacao: 'revisar_maior',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  const analysis = (await analyzeWithAI(req.body)) ?? demoAnalysis(req.body)

  return res.status(200).json({
    status: 'success',
    agent: 'BIM_Coordinator_AI',
    analyzed_at: new Date().toISOString(),
    ...analysis,
  })
}
