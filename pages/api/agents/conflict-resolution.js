/**
 * POST /api/agents/conflict-resolution
 *
 * Weighted Consensus Protocol — resolve conflitos entre agentes via Executive_Board_AI.
 *
 * resolution_matrix:
 *   safety_vs_cost      → override_to_safety_always
 *   quality_vs_schedule → evaluate_risk_penalty_matrix
 *   design_vs_budget    → escalate_to_investor_agent_for_roi_impact
 *
 * Retorna a decisão final, o agente árbitro e o raciocínio.
 */

const RESOLUTION_MATRIX = {
  safety_vs_cost: {
    rule: 'override_to_safety_always',
    winner: 'safety',
    rationale: 'Segurança sempre prevalece sobre custo — NR-06/NR-33 e ISO 45001 não são negociáveis.',
  },
  quality_vs_schedule: {
    rule: 'evaluate_risk_penalty_matrix',
  },
  design_vs_budget: {
    rule: 'escalate_to_investor_agent_for_roi_impact',
  },
}

const CONFLICT_TYPES = Object.keys(RESOLUTION_MATRIX)

function validate(body) {
  const errors = []
  if (!body.conflict_type || !CONFLICT_TYPES.includes(body.conflict_type)) {
    errors.push(`conflict_type inválido. Use: ${CONFLICT_TYPES.join(', ')}`)
  }
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.requesting_agent) errors.push('requesting_agent é obrigatório')
  if (!body.context || typeof body.context !== 'object') {
    errors.push('context (objeto com detalhes do conflito) é obrigatório')
  }
  return errors
}

async function resolveWithAI(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = `Você é o Executive_Board_AI, árbitro de conflitos entre agentes de construção.
Conflito: ${body.conflict_type}
Projeto: ${body.project_id}
Agente solicitante: ${body.requesting_agent}
Contexto: ${JSON.stringify(body.context, null, 2)}

Regra aplicável: ${RESOLUTION_MATRIX[body.conflict_type].rule}

Retorne JSON com:
- decision: string (decisão final)
- rationale: string (justificativa técnica)
- risk_flags: array de strings (riscos identificados, pode ser vazio)
- recommended_actions: array de strings`

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
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await resp.json()
    const text = data?.content?.[0]?.text || ''
    return JSON.parse(text)
  } catch {
    return null
  }
}

function staticResolution(conflictType, context) {
  const matrix = RESOLUTION_MATRIX[conflictType]

  if (conflictType === 'safety_vs_cost') {
    return {
      decision: `Manter requisito de segurança. Custo adicional de R$ ${context.cost_delta ?? '?'} aprovado automaticamente.`,
      rationale: matrix.rationale,
      risk_flags: [],
      recommended_actions: ['Registrar ocorrência no Safety_Monitor_AI', 'Notificar gestor_segurança'],
    }
  }

  if (conflictType === 'quality_vs_schedule') {
    const penalty = context.penalty_per_day_brl ?? 0
    const rework_cost = context.rework_cost_brl ?? 0
    const winner = rework_cost > penalty * (context.delay_days ?? 1) ? 'schedule' : 'quality'
    return {
      decision: `Priorizar ${winner} com base na matriz de penalidades.`,
      rationale: `Custo de retrabalho (R$ ${rework_cost}) vs penalidade de atraso (R$ ${penalty}/dia × ${context.delay_days ?? 1} dias).`,
      risk_flags: winner === 'schedule' ? ['Risco de não-conformidade de qualidade — monitorar'] : [],
      recommended_actions: [`Ajustar cronograma com buffer de ${context.delay_days ?? 1} dia(s)`, 'Atualizar EVM'],
    }
  }

  // design_vs_budget → escalate
  return {
    decision: 'Escalado para investor_agent — impacto no ROI requer aprovação.',
    rationale: 'Conflito design vs budget excede autonomia dos agentes operacionais.',
    risk_flags: ['ROI pode ser afetado — aguardar avaliação do investor_agent'],
    recommended_actions: ['Enviar relatório de impacto para investor_agent', 'Congelar decisão de design até retorno'],
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

  const { conflict_type, project_id, requesting_agent, context } = req.body

  const aiResolution = await resolveWithAI(req.body)
  const resolution = aiResolution ?? staticResolution(conflict_type, context)

  return res.status(200).json({
    status: 'resolved',
    arbiter: 'Executive_Board_AI',
    mechanism: 'Weighted Consensus Protocol',
    conflict_type,
    project_id,
    requesting_agent,
    rule_applied: RESOLUTION_MATRIX[conflict_type].rule,
    resolution,
    resolved_at: new Date().toISOString(),
  })
}
