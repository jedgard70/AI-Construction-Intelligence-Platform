import type { NextApiRequest, NextApiResponse } from 'next'
import { parsePagination, requireAuth, sendError, sendSuccess, type ApiResponse } from './_auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
) {
  const auth = await requireAuth(req, res as NextApiResponse<ApiResponse<never>>)
  if (!auth) return

  if (req.method !== 'GET') {
    return sendError(res as NextApiResponse<ApiResponse<never>>, 405, 'method_not_allowed', 'Method not allowed')
  }

  const { page, limit, from, to } = parsePagination(req)
  const category = req.query.category as string | undefined
  const activeOnly = req.query.active !== 'false'
  const search = req.query.search as string | undefined

  let query = auth.userClient
    .from('services_catalog')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (activeOnly) query = query.eq('is_active', true)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query
  if (error) return sendError(res as NextApiResponse<ApiResponse<never>>, 500, 'query_failed', 'Failed to list services', error.message)

  return sendSuccess(res, 200, data ?? [], {
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  })
}

