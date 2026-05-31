import type { NextApiRequest, NextApiResponse } from 'next'
import { parsePagination, requireAuth, sendError, sendSuccess, type ApiResponse } from '../_auth'

function proposalCode() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `PROP-${year}-${random}`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  const sb = auth.userClient

  if (req.method === 'GET') {
    const { page, limit, from, to } = parsePagination(req)
    const status = req.query.status as string | undefined
    const opportunityId = req.query.opportunity_id as string | undefined

    let query = sb
      .from('proposals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)
    if (opportunityId) query = query.eq('opportunity_id', opportunityId)

    const { data, error, count } = await query
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list proposals', error.message)

    return sendSuccess(res, 200, data ?? [], {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    })
  }

  if (req.method === 'POST') {
    const {
      opportunity_id,
      title,
      proposal_type = 'consulting',
      status = 'draft',
      valid_until = null,
      currency_code = 'BRL',
      metadata = {},
    } = req.body ?? {}

    if (!opportunity_id) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'opportunity_id is required')
    }
    if (!title || String(title).trim().length === 0) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'title is required')
    }

    const { data: oppServices, error: osErr } = await sb
      .from('opportunity_services')
      .select(`
        id,
        service_id,
        quantity,
        unit,
        unit_price,
        currency_code,
        discount_pct,
        line_total,
        services_catalog(service_code, name, category)
      `)
      .eq('opportunity_id', opportunity_id)

    if (osErr) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to load opportunity services', osErr.message)
    }

    const { data: proposal, error: proposalErr } = await sb
      .from('proposals')
      .insert({
        opportunity_id,
        proposal_code: proposalCode(),
        title: String(title).trim(),
        proposal_type,
        status,
        version_number: 1,
        currency_code,
        issued_at: new Date().toISOString(),
        valid_until,
        metadata,
      })
      .select('*')
      .single()

    if (proposalErr) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'insert_failed', 'Failed to create proposal', proposalErr.message)
    }

    if (oppServices && oppServices.length > 0) {
      const items = oppServices.map((s: any) => {
        const base = Number(s.unit_price ?? 0) * Number(s.quantity ?? 1)
        const discount = Number(s.discount_pct ?? 0) / 100
        return {
          proposal_id: proposal.id,
          service_id: s.service_id,
          source_opportunity_service_id: s.id,
          service_code: s.services_catalog?.service_code ?? 'custom',
          service_name: s.services_catalog?.name ?? 'Service',
          category: s.services_catalog?.category ?? null,
          quantity: s.quantity ?? 1,
          unit: s.unit ?? 'package',
          unit_price: s.unit_price ?? 0,
          currency_code: s.currency_code ?? currency_code,
          discount_pct: s.discount_pct ?? 0,
          line_total: s.line_total ?? base - base * discount,
          metadata: {},
        }
      })

      const { error: itemErr } = await sb.from('proposal_items').insert(items)
      if (itemErr) {
        return sendError(
          res as NextApiResponse<ApiResponse<never>>,
          500,
          'insert_failed',
          'Proposal created, but failed to create proposal items',
          itemErr.message
        )
      }
    }

    return sendSuccess(res, 201, proposal)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

