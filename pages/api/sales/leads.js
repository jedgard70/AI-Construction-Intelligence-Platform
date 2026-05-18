/**
 * POST /api/sales/leads
 *
 * Lead handling: ingestão via JSON + qualificação por IA preditiva (Claude).
 * Retorna score de qualificação, tier e próxima ação recomendada para o CRM.
 */

function validate(body) {
  const errors = []
  if (!body.lead_id) errors.push('lead_id é obrigatório')
  if (!body.name) errors.push('name é obrigatório')
  if (!body.contact?.email && !body.contact?.phone) {
    errors.push('contact deve ter email ou phone')
  }
  if (!body.project_interest) errors.push('project_interest é obrigatório')
  return errors
}

async function qualifyLead(lead) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackQualification(lead)

  const prompt = `Você é um agente de qualificação de leads imobiliários de alto padrão.
Avalie o lead abaixo e retorne um JSON com:
- qualification_score: número 0-100
- tier: "hot" | "warm" | "cold"
- next_action: string com a próxima ação recomendada para o time de vendas

Lead:
${JSON.stringify(lead, null, 2)}

Responda APENAS com o JSON, sem texto adicional.`

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
    return JSON.parse(text)
  } catch {
    return fallbackQualification(lead)
  }
}

function fallbackQualification(lead) {
  const score = lead.investment_capacity_brl >= 500000 ? 80 : lead.investment_capacity_brl >= 100000 ? 55 : 30
  return {
    qualification_score: score,
    tier: score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'cold',
    next_action: score >= 70 ? 'Agendar call com equipe_vendas_vip' : 'Incluir em nurturing ESG automatizado',
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

  const qualification = await qualifyLead(req.body)

  return res.status(201).json({
    status: 'success',
    lead_id: req.body.lead_id,
    ingested_at: new Date().toISOString(),
    qualification,
  })
}
