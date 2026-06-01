import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../crm/_auth'
import { createArchvisBrief, type ArchvisPromptTemplate, ARCHVIS_PROMPTS } from '../../../lib/archvis/prompts'
import type { ArchvisBriefInput } from '../../../lib/archvis/guided-flow'

type BriefResponse = {
  prompt: string
  generated_at: string
  style_preset: string
  matched_template: ArchvisPromptTemplate | null
}

function isValidBody(body: any): body is ArchvisBriefInput {
  return Boolean(
    body &&
    typeof body.stylePreset === 'string' &&
    typeof body.objective === 'string' &&
    typeof body.propertyStandard === 'string' &&
    typeof body.lighting === 'string' &&
    typeof body.landscaping === 'string' &&
    typeof body.materials === 'string'
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<BriefResponse>>
) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed')
  }

  const auth = await requireAuth(req, res)
  if (!auth) return

  if (!isValidBody(req.body)) {
    return sendError(res, 400, 'validation_error', 'Invalid body for Archvis brief generation')
  }

  const brief = createArchvisBrief(req.body)
  const templateMatch = ARCHVIS_PROMPTS.find(item => item.stylePreset === req.body.stylePreset) ?? null

  return sendSuccess(res, 200, {
    ...brief,
    matched_template: templateMatch,
  })
}
