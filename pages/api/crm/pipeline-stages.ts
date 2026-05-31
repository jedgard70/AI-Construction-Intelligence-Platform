import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from './_auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  if (req.method !== 'GET') {
    return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
  }

  const onlyActive = req.query.only_active !== 'false'

  let query = auth.userClient
    .from('pipeline_stages')
    .select('*')
    .order('stage_order', { ascending: true })

  if (onlyActive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list pipeline stages', error.message)

  return sendSuccess(res, 200, data ?? [])
}

