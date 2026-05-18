/**
 * POST /api/campaigns/launch
 * Dispara uma nova campanha de captação imobiliária com dados estratégicos, criativos e roteamento CRM.
 *
 * Payload esperado:
 * {
 *   action: "launch_new_campaign",
 *   project_id: string,
 *   strategic_data: { target_audience, expected_roi, esg_score_label },
 *   creatives: { primary_image_url, ad_copy },
 *   crm_routing: { pipeline_stage, assign_to }
 * }
 */

const ALLOWED_ACTIONS = ['launch_new_campaign']

function validatePayload(body) {
  const errors = []

  if (!body.action || !ALLOWED_ACTIONS.includes(body.action)) {
    errors.push(`action inválida. Use: ${ALLOWED_ACTIONS.join(', ')}`)
  }
  if (!body.project_id || typeof body.project_id !== 'string') {
    errors.push('project_id é obrigatório')
  }

  const sd = body.strategic_data || {}
  if (!sd.target_audience) errors.push('strategic_data.target_audience é obrigatório')
  if (typeof sd.expected_roi !== 'number') errors.push('strategic_data.expected_roi deve ser número')
  if (!sd.esg_score_label) errors.push('strategic_data.esg_score_label é obrigatório')

  const cr = body.creatives || {}
  if (!cr.primary_image_url) errors.push('creatives.primary_image_url é obrigatório')
  if (!cr.ad_copy) errors.push('creatives.ad_copy é obrigatório')

  const crm = body.crm_routing || {}
  if (!crm.pipeline_stage) errors.push('crm_routing.pipeline_stage é obrigatório')
  if (!crm.assign_to) errors.push('crm_routing.assign_to é obrigatório')

  return errors
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body

  const validationErrors = validatePayload(body)
  if (validationErrors.length > 0) {
    return res.status(400).json({
      status: 'validation_error',
      errors: validationErrors,
    })
  }

  const { project_id, strategic_data, creatives, crm_routing } = body

  const campaign = {
    campaign_id: `CAMP-${Date.now()}`,
    project_id,
    status: 'launched',
    launched_at: new Date().toISOString(),
    strategic_data: {
      target_audience: strategic_data.target_audience,
      expected_roi: strategic_data.expected_roi,
      esg_score_label: strategic_data.esg_score_label,
    },
    creatives: {
      primary_image_url: creatives.primary_image_url,
      ad_copy: creatives.ad_copy,
    },
    crm_routing: {
      pipeline_stage: crm_routing.pipeline_stage,
      assign_to: crm_routing.assign_to,
    },
  }

  return res.status(201).json({
    status: 'success',
    message: `Campanha lançada com sucesso para o projeto ${project_id}`,
    campaign,
  })
}
