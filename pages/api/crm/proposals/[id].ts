import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../_auth'

function nextVersionCode(previousCode: string) {
  return `${previousCode}-V${Date.now().toString().slice(-4)}`
}

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
    const { data: proposal, error } = await sb.from('proposals').select('*').eq('id', id).single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 404, 'not_found', 'Proposal not found', error.message)

    const { data: items, error: itemsErr } = await sb.from('proposal_items').select('*').eq('proposal_id', id).order('created_at', { ascending: true })
    if (itemsErr) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to load proposal items', itemsErr.message)

    return sendSuccess(res, 200, { ...proposal, items: items ?? [] })
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { create_new_version = false, ...rest } = req.body ?? {}

    if (create_new_version) {
      const { data: current, error: curErr } = await sb.from('proposals').select('*').eq('id', id).single()
      if (curErr || !current) return sendError(res as NextApiResponse<ApiResponse<never>>, 404, 'not_found', 'Proposal not found for versioning', curErr?.message)

      const { data: nextProposal, error: nextErr } = await sb
        .from('proposals')
        .insert({
          opportunity_id: current.opportunity_id,
          proposal_code: nextVersionCode(current.proposal_code),
          title: rest.title ?? current.title,
          proposal_type: rest.proposal_type ?? current.proposal_type,
          status: 'draft',
          version_number: Number(current.version_number ?? 1) + 1,
          parent_proposal_id: current.parent_proposal_id ?? current.id,
          total_value: rest.total_value ?? current.total_value,
          currency_code: rest.currency_code ?? current.currency_code,
          issued_at: null,
          valid_until: rest.valid_until ?? current.valid_until,
          metadata: rest.metadata ?? current.metadata ?? {},
        })
        .select('*')
        .single()

      if (nextErr) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'versioning_failed', 'Failed to create proposal version', nextErr.message)

      const { data: oldItems } = await sb.from('proposal_items').select('*').eq('proposal_id', current.id)
      if (oldItems && oldItems.length > 0) {
        const cloned = oldItems.map((it: any) => ({
          proposal_id: nextProposal.id,
          service_id: it.service_id,
          source_opportunity_service_id: it.source_opportunity_service_id,
          service_code: it.service_code,
          service_name: it.service_name,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          currency_code: it.currency_code,
          discount_pct: it.discount_pct,
          line_total: it.line_total,
          metadata: it.metadata ?? {},
        }))
        const { error: cloneErr } = await sb.from('proposal_items').insert(cloned)
        if (cloneErr) {
          return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'versioning_failed', 'Created proposal version, but failed to clone items', cloneErr.message)
        }
      }

      return sendSuccess(res, 201, nextProposal)
    }

    const allowed = [
      'title',
      'proposal_type',
      'status',
      'total_value',
      'currency_code',
      'issued_at',
      'valid_until',
      'pdf_path',
      'metadata',
    ]
    const updates: Record<string, unknown> = {}
    for (const k of allowed) {
      if (rest[k] !== undefined) updates[k] = rest[k]
    }
    if (Object.keys(updates).length === 0) {
      return sendError(res as NextApiResponse<ApiResponse<never>>, 400, 'validation_error', 'No valid fields to update')
    }

    const { data, error } = await sb.from('proposals').update(updates).eq('id', id).select('*').single()
    if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'update_failed', 'Failed to update proposal', error.message)
    return sendSuccess(res, 200, data)
  }

  return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
}

