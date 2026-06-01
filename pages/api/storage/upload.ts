import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'
import { requireAuth, sendError, sendSuccess, type ApiResponse } from '../crm/_auth'
import { hasProjectAccess } from '../../../lib/storage-access'

type UploadResponse = {
  document_id: string
  project_id: string
  storage_bucket: string
  storage_path: string
  original_name: string
  mime_type: string | null
  file_size: number
}

function sanitizeFilename(input: string): string {
  const fallback = 'file.bin'
  const trimmed = (input || '').trim()
  if (!trimmed) return fallback
  const safe = trimmed.replace(/[^\w.\-() ]+/g, '_').replace(/\s+/g, '_')
  return safe.slice(0, 180) || fallback
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<UploadResponse>>
) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed')
  }

  const auth = await requireAuth(req, res)
  if (!auth) return

  const {
    project_id: projectId,
    original_name: originalNameRaw,
    mime_type: mimeTypeRaw,
    file_base64: fileBase64Raw,
    metadata: metadataRaw,
  } = req.body || {}

  if (!projectId || typeof projectId !== 'string') {
    return sendError(res, 400, 'validation_error', 'project_id is required')
  }
  if (!fileBase64Raw || typeof fileBase64Raw !== 'string') {
    return sendError(res, 400, 'validation_error', 'file_base64 is required')
  }

  const allowed = await hasProjectAccess(auth.serviceClient, auth.user.id, projectId)
  if (!allowed) {
    return sendError(res, 403, 'forbidden', 'You do not have access to this project')
  }

  let fileBuffer: Buffer
  try {
    fileBuffer = Buffer.from(fileBase64Raw, 'base64')
  } catch {
    return sendError(res, 400, 'validation_error', 'file_base64 is invalid base64')
  }
  if (!fileBuffer.length) {
    return sendError(res, 400, 'validation_error', 'Decoded file content is empty')
  }
  if (fileBuffer.length > 25 * 1024 * 1024) {
    return sendError(res, 413, 'payload_too_large', 'File too large (max 25MB)')
  }

  const originalName = sanitizeFilename(typeof originalNameRaw === 'string' ? originalNameRaw : 'file.bin')
  const mimeType = typeof mimeTypeRaw === 'string' && mimeTypeRaw.trim() ? mimeTypeRaw.trim() : null
  const documentId = randomUUID()
  const storagePath = `projects/${projectId}/${documentId}/${originalName}`
  const metadata = metadataRaw && typeof metadataRaw === 'object' ? metadataRaw : {}

  const { error: uploadError } = await auth.serviceClient
    .storage
    .from('project-files')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return sendError(res, 500, 'upload_failed', 'Failed to upload file to project-files', uploadError.message)
  }

  const { data: inserted, error: insertError } = await auth.serviceClient
    .from('documents')
    .insert({
      id: documentId,
      project_id: projectId,
      owner_user_id: auth.user.id,
      created_by: auth.user.id,
      storage_bucket: 'project-files',
      storage_path: storagePath,
      original_name: originalName,
      mime_type: mimeType,
      file_size: fileBuffer.length,
      metadata,
    })
    .select('id, project_id, storage_bucket, storage_path, original_name, mime_type, file_size')
    .maybeSingle()

  if (insertError || !inserted) {
    await auth.serviceClient.storage.from('project-files').remove([storagePath])
    return sendError(res, 500, 'metadata_insert_failed', 'File uploaded but metadata insert failed', insertError?.message)
  }

  return sendSuccess(res, 201, {
    document_id: inserted.id,
    project_id: inserted.project_id,
    storage_bucket: inserted.storage_bucket,
    storage_path: inserted.storage_path,
    original_name: inserted.original_name,
    mime_type: inserted.mime_type,
    file_size: inserted.file_size,
  })
}
