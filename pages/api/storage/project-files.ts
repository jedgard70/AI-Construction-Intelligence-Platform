import type { NextApiRequest, NextApiResponse } from 'next'
import { parsePagination, requireAuth, sendError, sendSuccess, type ApiResponse } from '../crm/_auth'
import { hasProjectAccess } from '../../../lib/storage-access'

type ProjectFileRow = {
  id: string
  project_id: string | null
  original_name: string
  mime_type: string | null
  file_size: number | null
  storage_bucket: string
  storage_path: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ProjectFileRow[]>>
) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed')
  }

  const auth = await requireAuth(req, res)
  if (!auth) return

  const projectId = typeof req.query.project_id === 'string' ? req.query.project_id.trim() : ''
  if (!projectId) {
    return sendError(res, 400, 'validation_error', 'project_id is required')
  }

  const allowed = await hasProjectAccess(auth.serviceClient, auth.user.id, projectId)
  if (!allowed) {
    return sendError(res, 403, 'forbidden', 'You do not have access to this project')
  }

  const { page, limit, from, to } = parsePagination(req)

  const { data, error, count } = await auth.serviceClient
    .from('documents')
    .select(
      'id, project_id, original_name, mime_type, file_size, storage_bucket, storage_path, metadata, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('project_id', projectId)
    .eq('storage_bucket', 'project-files')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return sendError(res, 500, 'query_failed', 'Failed to list project files', error.message)
  }

  return sendSuccess(res, 200, (data || []) as ProjectFileRow[], {
    page,
    limit,
    total: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
  })
}
