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
    const { data: contract, error } = await sb.from('contracts').select('*').eq('id', id).single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 404, 'not_found', 'Contract not found', error.message)

    const { data: items, error: itemsErr } = await sb.from('contract_items').select('*').eq('contract_id', id).order('created_at', { ascending: true })
    if (itemsErr) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to load contract items', itemsErr.message)

    return sendSuccess(res, 200, { ...contract, items: items ?? [] })
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const allowed = [
      'title',
      'status',
      'version_number',
      'parent_contract_id',
      'signed_at',
      'effective_start_date',
      'effective_end_date',
      'total_value',
      'currency_code',
      'terms_markdown',
      'pdf_path',
      'metadata',
    ]
    const updates: Record<string, unknown> = {}
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) updates[k] = req.body[k]
    }
    if (Object.keys(updates).length === 0) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'No valid fields to update')
    }

    const { data, error } = await sb.from('contracts').update(updates).eq('id', id).select('*').single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'update_failed', 'Failed to update contract', error.message)
    return sendSuccess(res, 200, data)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

