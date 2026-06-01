import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../crm/_auth'
import { hasProjectAccess } from '../../../lib/storage-access'

type SignedUrlData = {
  document_id: string
  project_id: string
  signed_url: string
  expires_in: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SignedUrlData>>
) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed')
  }

  const auth = await requireAuth(req, res)
  if (!auth) return

  const { document_id: documentId, expires_in: expiresInRaw } = req.body || {}
  const expiresIn = Number(expiresInRaw ?? 600)

  if (!documentId || typeof documentId !== 'string') {
    return sendError(res, 400, 'validation_error', 'document_id is required')
  }
  if (!Number.isFinite(expiresIn) || expiresIn < 60 || expiresIn > 3600) {
    return sendError(res, 400, 'validation_error', 'expires_in must be between 60 and 3600 seconds')
  }

  const { data: doc, error: docError } = await auth.serviceClient
    .from('documents')
    .select('id, project_id, storage_bucket, storage_path')
    .eq('id', documentId)
    .maybeSingle()

  if (docError) {
    return sendError(res, 500, 'query_failed', 'Failed to resolve document', docError.message)
  }
  if (!doc) {
    return sendError(res, 404, 'not_found', 'Document not found')
  }
  if (!doc.project_id || !doc.storage_path) {
    return sendError(res, 409, 'invalid_document', 'Document is missing project or storage path metadata')
  }
  if (doc.storage_bucket !== 'project-files') {
    return sendError(res, 409, 'invalid_bucket', 'Document is not stored in project-files bucket')
  }

  const allowed = await hasProjectAccess(auth.serviceClient, auth.user.id, doc.project_id)
  if (!allowed) {
    return sendError(res, 403, 'forbidden', 'You do not have access to this project file')
  }

  const { data: signed, error: signedError } = await auth.serviceClient
    .storage
    .from('project-files')
    .createSignedUrl(doc.storage_path, expiresIn)

  if (signedError || !signed?.signedUrl) {
    return sendError(res, 500, 'signed_url_failed', 'Failed to create signed URL', signedError?.message)
  }

  return sendSuccess(res, 200, {
    document_id: doc.id,
    project_id: doc.project_id,
    signed_url: signed.signedUrl,
    expires_in: expiresIn,
  })
}
