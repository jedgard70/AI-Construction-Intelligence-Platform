import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../_auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  const sb = auth.userClient
  const id = req.query.id as string
  if (!id) return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'id is required')

  if (req.method === 'GET') {
    const { data, error } = await sb.from('opportunities').select('*').eq('id', id).single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 404, 'not_found', 'Opportunity not found', error.message)
    return sendSuccess(res, 200, data)
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const allowed = [
      'title',
      'stage_id',
      'value',
      'currency_code',
      'probability',
      'status',
      'close_date',
      'loss_reason',
      'country_code',
      'market_region',
      'metadata',
      'client_id',
      'project_id',
      'owner_user_id',
      'lead_id',
    ]

    const updates: Record<string, unknown> = {}
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) updates[k] = req.body[k]
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'No valid fields to update')
    }

    const { data, error } = await sb.from('opportunities').update(updates).eq('id', id).select('*').single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'update_failed', 'Failed to update opportunity', error.message)
    return sendSuccess(res, 200, data)
  }

  if (req.method === 'DELETE') {
    // Soft delete by status to keep auditability and reduce accidental data loss.
    const { data, error } = await sb
      .from('opportunities')
      .update({
        status: 'lost',
        loss_reason: req.body?.loss_reason ?? 'Deleted via API',
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'delete_failed', 'Failed to soft-delete opportunity', error.message)
    return sendSuccess(res, 200, data)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

