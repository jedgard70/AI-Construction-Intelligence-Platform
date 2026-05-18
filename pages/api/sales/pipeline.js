/**
 * POST /api/sales/pipeline
 *
 * Executa o Sales & Investment Captation Engine em 4 etapas:
 *   1. asset_compilation   – coleta URLs de renders e score financeiro/ESG
 *   2. copywriting         – gera variações A/B via Claude (Anthropic API)
 *   3. audience_targeting  – monta parâmetros de segmentação
 *   4. webhook_dispatch    – empacota e envia o payload para plataformas externas
 *
 * Trigger events válidos:
 *   cinematic_assets_approved | roi_and_valuation_locked | esg_score_published
 */

const VALID_TRIGGERS = [
  'cinematic_assets_approved',
  'roi_and_valuation_locked',
  'esg_score_published',
]

function validate(body) {
  const errors = []
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.trigger_event || !VALID_TRIGGERS.includes(body.trigger_event)) {
    errors.push(`trigger_event inválido. Use: ${VALID_TRIGGERS.join(', ')}`)
  }

  const assets = body.assets || {}
  if (!Array.isArray(assets.creative_urls) || assets.creative_urls.length === 0) {
    errors.push('assets.creative_urls deve ser um array não vazio')
  }
  if (typeof assets.esg_score !== 'number') {
    errors.push('assets.esg_score deve ser número')
  }
  if (typeof assets.expected_roi !== 'number') {
    errors.push('assets.expected_roi deve ser número')
  }

  const audience = body.audience || {}
  if (!Array.isArray(audience.interests) || audience.interests.length === 0) {
    errors.push('audience.interests deve ser um array não vazio')
  }
  if (!Array.isArray(audience.locations) || audience.locations.length === 0) {
    errors.push('audience.locations deve ser um array não vazio')
  }

  return errors
}

async function generateCopyVariations({ projectId, esgScore, expectedRoi }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return [
      `Invista no futuro da construção autônoma. ESG Score: ${esgScore}. ROI projetado: ${expectedRoi}% a.a.`,
      `Rentabilidade previsível com engenharia autônoma. Conheça o padrão ${projectId}.`,
    ]
  }

  const prompt = `Você é um copywriter especialista em captação de investimentos imobiliários de alto padrão.
Gere 2 variações de texto para anúncio (A/B testing), cada uma com no máximo 2 frases.
Dados do projeto:
- ID: ${projectId}
- ESG Score: ${esgScore}/100
- ROI projetado: ${expectedRoi}% ao ano
Responda em JSON com a chave "variations": ["variação A", "variação B"]`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await resp.json()
    const text = data?.content?.[0]?.text || ''
    const parsed = JSON.parse(text)
    return parsed.variations
  } catch {
    return [
      `Invista no futuro da construção autônoma. ESG Score: ${esgScore}. ROI projetado: ${expectedRoi}% a.a.`,
      `Rentabilidade previsível com engenharia autônoma. Conheça o padrão ${projectId}.`,
    ]
  }
}

async function dispatchWebhook(webhookUrl, payload) {
  if (!webhookUrl) return { skipped: true, reason: 'SALES_WEBHOOK_URL não configurada' }
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { status: resp.status, ok: resp.ok }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  const { project_id, trigger_event, assets, audience, daily_budget } = req.body
  const pipeline_run_id = `SPL-${Date.now()}`
  const steps = {}

  // Step 1 – Asset Compilation
  steps.step_1_asset_compilation = {
    status: 'completed',
    creative_urls: assets.creative_urls,
    esg_score: assets.esg_score,
    expected_roi: assets.expected_roi,
  }

  // Step 2 – Copywriting Generation (A/B)
  const adCopyVariations = await generateCopyVariations({
    projectId: project_id,
    esgScore: assets.esg_score,
    expectedRoi: assets.expected_roi,
  })
  steps.step_2_copywriting_generation = {
    status: 'completed',
    ad_copy_variations: adCopyVariations,
  }

  // Step 3 – Audience Targeting
  steps.step_3_audience_targeting = {
    status: 'completed',
    target_audience_parameters: {
      interests: audience.interests,
      locations: audience.locations,
    },
  }

  // Step 4 – Webhook Dispatch (webhook_payload_standard)
  const webhookPayload = {
    pipeline_run_id,
    project_id,
    trigger_event,
    campaign_objective: 'lead_generation',
    daily_budget_allocation: daily_budget ?? 'definido_pelo_budget_agent',
    creative_assets_urls: assets.creative_urls,
    ad_copy_variations: adCopyVariations,
    target_audience_parameters: {
      interests: audience.interests,
      locations: audience.locations,
    },
    dispatched_at: new Date().toISOString(),
  }

  const dispatchResult = await dispatchWebhook(
    process.env.SALES_WEBHOOK_URL,
    webhookPayload
  )
  steps.step_4_webhook_dispatch = {
    status: dispatchResult.ok === false ? 'failed' : 'completed',
    ...dispatchResult,
    payload_sent: webhookPayload,
  }

  return res.status(201).json({
    status: 'success',
    pipeline_run_id,
    project_id,
    trigger_event,
    steps,
  })
}
