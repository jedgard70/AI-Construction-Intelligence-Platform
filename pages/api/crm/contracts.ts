import type { NextApiRequest, NextApiResponse } from 'next'
import { parsePagination, requireAuth, sendError, sendSuccess, type ApiResponse } from './_auth'

function contractCode() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `CTR-${year}-${random}`
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
    const proposalId = req.query.proposal_id as string | undefined

    let query = sb
      .from('contracts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)
    if (proposalId) query = query.eq('proposal_id', proposalId)

    const { data, error, count } = await query
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list contracts', error.message)

    return sendSuccess(res, 200, data ?? [], {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    })
  }

  if (req.method === 'POST') {
    const {
      proposal_id,
      title,
      status = 'draft',
      currency_code = 'BRL',
      metadata = {},
      terms_markdown = null,
      effective_start_date = null,
      effective_end_date = null,
    } = req.body ?? {}

    if (!proposal_id) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'proposal_id is required')
    }

    const { data: proposal, error: proposalErr } = await sb.from('proposals').select('*').eq('id', proposal_id).single()
    if (proposalErr || !proposal) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 404, 'not_found', 'Proposal not found', proposalErr?.message)
    }
    if (proposal.status !== 'approved') {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'Contract can only be created from approved proposal')
    }

    const { data: opportunity } = await sb
      .from('opportunities')
      .select('id, client_id, project_id')
      .eq('id', proposal.opportunity_id)
      .maybeSingle()

    const finalTitle = title?.trim?.() || `Contract for ${proposal.title}`

    const { data: contract, error: contractErr } = await sb
      .from('contracts')
      .insert({
        proposal_id: proposal.id,
        opportunity_id: proposal.opportunity_id,
        client_id: opportunity?.client_id ?? null,
        project_id: opportunity?.project_id ?? null,
        contract_code: contractCode(),
        title: finalTitle,
        status,
        version_number: 1,
        total_value: proposal.total_value ?? null,
        currency_code,
        terms_markdown,
        effective_start_date,
        effective_end_date,
        metadata,
      })
      .select('*')
      .single()

    if (contractErr) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'insert_failed', 'Failed to create contract', contractErr.message)

    const { data: proposalItems } = await sb.from('proposal_items').select('*').eq('proposal_id', proposal.id)
    if (proposalItems && proposalItems.length > 0) {
      const items = proposalItems.map((it: any) => ({
        contract_id: contract.id,
        proposal_item_id: it.id,
        service_code: it.service_code,
        service_name: it.service_name,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        currency_code: it.currency_code,
        discount_pct: it.discount_pct,
        line_total: it.line_total,
        metadata: it.metadata ?? {},
      }))
      const { error: itemsErr } = await sb.from('contract_items').insert(items)
      if (itemsErr) {
        return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'insert_failed', 'Contract created, but failed to create contract items', itemsErr.message)
      }
    }

    return sendSuccess(res, 201, contract)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

