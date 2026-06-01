import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../crm/_auth'
import { ARCHVIS_PROMPTS, type ArchvisPromptTemplate } from '../../../lib/archvis/prompts'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ArchvisPromptTemplate[]>>
) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed')
  }

  const auth = await requireAuth(req, res)
  if (!auth) return

  const category = typeof req.query.category === 'string' ? req.query.category : null
  const data = category
    ? ARCHVIS_PROMPTS.filter(item => item.category === category)
    : ARCHVIS_PROMPTS

  return sendSuccess(res, 200, data)
}
