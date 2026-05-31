import type { NextApiRequest, NextApiResponse } from 'next'
import { parsePagination, requireAuth, sendError, sendSuccess, type ApiResponse } from '../_auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  const sb = auth.userClient

  if (req.method === 'GET') {
    const { page, limit, from, to } = parsePagination(req)
    const stageId = req.query.stage_id as string | undefined
    const status = req.query.status as string | undefined
    const ownerUserId = req.query.owner_user_id as string | undefined
    const search = req.query.search as string | undefined

    let query = sb
      .from('opportunities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (stageId) query = query.eq('stage_id', stageId)
    if (status) query = query.eq('status', status)
    if (ownerUserId) query = query.eq('owner_user_id', ownerUserId)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list opportunities', error.message)

    return sendSuccess(res, 200, data ?? [], {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    })
  }

  if (req.method === 'POST') {
    const {
      lead_id,
      client_id = null,
      project_id = null,
      title,
      stage_id = null,
      value = null,
      currency_code = 'BRL',
      probability = 0,
      status = 'open',
      owner_user_id = auth.user.id,
      close_date = null,
      loss_reason = null,
      country_code = 'BR',
      market_region = 'LATAM',
      metadata = {},
    } = req.body ?? {}

    if (!lead_id) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'lead_id is required')
    }
    if (!title || String(title).trim().length === 0) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'title is required')
    }

    let finalStageId = stage_id
    if (!finalStageId) {
      const { data: firstStage, error: stageErr } = await sb
        .from('pipeline_stages')
        .select('id')
        .eq('is_active', true)
        .order('stage_order', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (stageErr) {
        return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'stage_lookup_failed', 'Failed to resolve default pipeline stage', stageErr.message)
      }
      finalStageId = firstStage?.id ?? null
    }

    if (!finalStageId) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'stage_id is required (or at least one active stage must exist)')
    }

    const { data, error } = await sb
      .from('opportunities')
      .insert({
        lead_id,
        client_id,
        project_id,
        title: String(title).trim(),
        stage_id: finalStageId,
        value,
        currency_code,
        probability,
        status,
        owner_user_id,
        close_date,
        loss_reason,
        country_code,
        market_region,
        metadata,
      })
      .select('*')
      .single()

    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'insert_failed', 'Failed to create opportunity', error.message)
    return sendSuccess(res, 201, data)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

