import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from './_auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  const sb = auth.userClient

  if (req.method === 'GET') {
    const opportunityId = req.query.opportunity_id as string | undefined
    if (!opportunityId) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'opportunity_id is required')
    }

    const { data, error } = await sb
      .from('opportunity_services')
      .select('*, services_catalog(id, service_code, name, category, base_price, default_currency_code)')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: true })

    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list opportunity services', error.message)
    return sendSuccess(res, 200, data ?? [])
  }

  if (req.method === 'POST') {
    const {
      opportunity_id,
      service_id,
      quantity = 1,
      unit = 'package',
      unit_price = 0,
      currency_code = 'BRL',
      discount_pct = 0,
      line_total = null,
      scope_notes = null,
      is_primary = false,
      metadata = {},
    } = req.body ?? {}

    if (!opportunity_id || !service_id) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'opportunity_id and service_id are required')
    }

    const payload = {
      opportunity_id,
      service_id,
      quantity,
      unit,
      unit_price,
      currency_code,
      discount_pct,
      line_total,
      scope_notes,
      is_primary,
      metadata,
    }

    const { data, error } = await sb
      .from('opportunity_services')
      .upsert(payload, { onConflict: 'opportunity_id,service_id' })
      .select('*')
      .single()

    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'upsert_failed', 'Failed to add service to opportunity', error.message)
    return sendSuccess(res, 201, data)
  }

  if (req.method === 'DELETE') {
    const id = (req.query.id as string | undefined) ?? req.body?.id
    const opportunityId = req.query.opportunity_id as string | undefined
    const serviceId = req.query.service_id as string | undefined

    if (!id && !(opportunityId && serviceId)) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'Provide id or (opportunity_id + service_id)')
    }

    let q = sb.from('opportunity_services').delete()
    if (id) {
      q = q.eq('id', id)
    } else {
      q = q.eq('opportunity_id', opportunityId as string).eq('service_id', serviceId as string)
    }

    const { error } = await q
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'delete_failed', 'Failed to remove opportunity service', error.message)
    return sendSuccess(res, 200, { deleted: true })
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

