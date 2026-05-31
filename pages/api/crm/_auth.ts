import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type ApiError = {
  code: string
  message: string
  details?: string
}

export type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: ApiError | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function envOrThrow(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getBearerToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  return token.length > 0 ? token : null
}

export function sendError(
  res: NextApiResponse<ApiResponse<never>>,
  status: number,
  code: string,
  message: string,
  details?: string
) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details },
  })
}

export function sendSuccess<T>(
  res: NextApiResponse<ApiResponse<T>>,
  status: number,
  data: T,
  pagination?: ApiResponse<T>['pagination']
) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    ...(pagination ? { pagination } : {}),
  })
}

export type AuthContext = {
  token: string
  user: User
  userClient: SupabaseClient
  serviceClient: SupabaseClient
}

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<never>>
): Promise<AuthContext | null> {
  const token = getBearerToken(req)
  if (!token) {
    sendError(res, 401, 'unauthorized', 'Bearer token required')
    return null
  }

  let url: string
  let anonKey: string
  let serviceRoleKey: string

  try {
    url = envOrThrow('NEXT_PUBLIC_SUPABASE_URL')
    anonKey = envOrThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    serviceRoleKey = envOrThrow('SUPABASE_SERVICE_ROLE_KEY')
  } catch (err) {
    sendError(res, 500, 'server_config_error', 'Supabase configuration missing', String(err))
    return null
  }

  const userClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) {
    sendError(res, 401, 'unauthorized', 'Invalid or expired token', error?.message)
    return null
  }

  return {
    token,
    user: data.user,
    userClient,
    serviceClient,
  }
}

export function parsePagination(req: NextApiRequest) {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { page, limit, from, to }
}

