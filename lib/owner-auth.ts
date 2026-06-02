import { Buffer } from 'buffer'
import { createClient } from '@supabase/supabase-js'

export type SeatRole = 'owner' | 'admin' | 'user' | 'client' | 'guest'

export type OwnerContext = {
  userId: string | null
  email: string | null
  role: SeatRole | string
  isOwner: boolean
  allowedScopes: string[]
  department: string | null
}

export type OwnerThreadAccessInput = {
  ownerUserId?: string | null
  assignedTo?: string | string[] | null
  department?: string | null
  allowedScopes?: string[] | null
  visibility?: 'owner_private' | 'seat' | 'department' | 'authorized' | 'global' | null
  requiresOwnerApproval?: boolean | null
}

export type OwnerThreadAccessDecision = {
  allowed: boolean
  canContinue: boolean
  canView: boolean
  canApproveCritical: boolean
  scope: 'global' | 'own' | 'assigned' | 'department' | 'authorized' | 'denied'
  reason: string
}

type ProfileRow = {
  role?: string | null
  is_owner?: boolean | null
  allowed_scopes?: string[] | null
  department?: string | null
}

const DEFAULT_OWNER_EMAILS = 'jedgard70@gmail.com'

export function hasOwnerAuthConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export function resolveConfiguredOwnerEmails(): string[] {
  const configuredOwnerEmails =
    process.env.OWNER_EMAILS ||
    process.env.OWNER_EMAIL ||
    process.env.APEX_OWNER_EMAILS ||
    DEFAULT_OWNER_EMAILS

  return configuredOwnerEmails
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
}

export function getBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) return null
  const token = authorizationHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

export function normalizeRole(role: string | null | undefined, isOwner: boolean): SeatRole | string {
  if (isOwner) return 'owner'
  const normalized = String(role || 'user').trim().toLowerCase()
  if (normalized === 'owner' || normalized === 'admin' || normalized === 'user' || normalized === 'client' || normalized === 'guest') {
    return normalized
  }
  return normalized || 'user'
}

export async function resolveOwnerContext(bearerToken: string | null): Promise<OwnerContext> {
  const guest: OwnerContext = {
    userId: null,
    email: null,
    role: 'guest',
    isOwner: false,
    allowedScopes: ['public_help'],
    department: null,
  }

  if (!bearerToken) return guest

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceRoleKey) return guest

  const ownerEmails = resolveConfiguredOwnerEmails()

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await userClient.auth.getUser(bearerToken)
  if (error || !data?.user) return guest

  const email = (data.user.email || '').toLowerCase()
  const userId = data.user.id
  const ownerByEmail = ownerEmails.includes(email)

  let role: SeatRole | string = ownerByEmail ? 'owner' : 'user'
  let isOwner = ownerByEmail
  let allowedScopes: string[] = ownerByEmail ? ['all'] : ['department']
  let department: string | null = null

  const profileQueries = [
    serviceClient.from('profiles').select('role,is_owner,allowed_scopes,department').eq('id', userId).maybeSingle(),
    serviceClient.from('users').select('role,is_owner,allowed_scopes,department').eq('id', userId).maybeSingle(),
    serviceClient.from('user_roles').select('role,is_owner,allowed_scopes,department').eq('user_id', userId).maybeSingle(),
  ]

  for (const query of profileQueries) {
    try {
      const { data: row } = await query
      const profile = row as ProfileRow | null
      if (!profile) continue

      if (typeof profile.role === 'string' && profile.role.trim()) role = profile.role.trim().toLowerCase()
      if (profile.is_owner === true) isOwner = true
      if (Array.isArray(profile.allowed_scopes) && profile.allowed_scopes.length) {
        allowedScopes = profile.allowed_scopes.map(v => String(v).trim()).filter(Boolean)
      }
      if (typeof profile.department === 'string' && profile.department.trim()) department = profile.department.trim()
      break
    } catch {
      // try next table
    }
  }

  role = normalizeRole(role, isOwner)
  if (isOwner || role === 'owner') {
    role = 'owner'
    isOwner = true
    allowedScopes = ['all']
  }

  return {
    userId,
    email: email || null,
    role,
    isOwner,
    allowedScopes,
    department,
  }
}

function normalizeScopeList(scopes?: string[] | null): string[] {
  return Array.isArray(scopes)
    ? scopes.map(value => String(value).trim().toLowerCase()).filter(Boolean)
    : []
}

function normalizeAssignees(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

function hasSharedScope(userScopes: string[], threadScopes: string[]): boolean {
  if (userScopes.includes('all')) return true
  return threadScopes.some(scope => userScopes.includes(scope))
}

export function getSeatPermissionSummary(user: OwnerContext): string {
  if (user.isOwner) {
    return 'Owner/Dr. Edgard com continuidade global, acesso total a historicos operacionais e aprovacao critica exclusiva.'
  }
  if (user.role === 'admin') {
    return 'Segundo assento/admin com acesso operacional restrito ao proprio contexto, atribuicoes e escopos autorizados; sem contexto privado do Owner.'
  }
  if (user.role === 'guest') {
    return 'Guest sem acesso a historico interno global.'
  }
  return 'Assento autenticado com acesso apenas ao proprio contexto, atribuicoes, departamento e escopos autorizados.'
}

export function evaluateOwnerThreadAccess(
  user: OwnerContext,
  thread: OwnerThreadAccessInput = {},
): OwnerThreadAccessDecision {
  if (user.isOwner) {
    return {
      allowed: true,
      canContinue: true,
      canView: true,
      canApproveCritical: true,
      scope: 'global',
      reason: 'Owner continuity enabled for Dr. Edgard across all operational chats, tasks and handoffs.',
    }
  }

  if (!user.userId || user.role === 'guest') {
    return {
      allowed: false,
      canContinue: false,
      canView: false,
      canApproveCritical: false,
      scope: 'denied',
      reason: 'Guest users cannot access internal operational history.',
    }
  }

  const ownerUserId = typeof thread.ownerUserId === 'string' && thread.ownerUserId.trim() ? thread.ownerUserId.trim() : null
  const threadDepartment = typeof thread.department === 'string' && thread.department.trim() ? thread.department.trim().toLowerCase() : null
  const threadScopes = normalizeScopeList(thread.allowedScopes)
  const assignees = normalizeAssignees(thread.assignedTo)
  const visibility = thread.visibility || null
  const requiresOwnerApproval = thread.requiresOwnerApproval === true

  if (visibility === 'owner_private') {
    return {
      allowed: false,
      canContinue: false,
      canView: false,
      canApproveCritical: false,
      scope: 'denied',
      reason: 'Owner private threads are not visible to second-seat, admin, or subordinate users.',
    }
  }

  if (ownerUserId && ownerUserId !== user.userId) {
    return {
      allowed: false,
      canContinue: false,
      canView: false,
      canApproveCritical: false,
      scope: 'denied',
      reason: 'Only the Owner can assume tasks owned by a different seat when they are marked as owner-owned.',
    }
  }

  if (requiresOwnerApproval) {
    return {
      allowed: false,
      canContinue: false,
      canView: false,
      canApproveCritical: false,
      scope: 'denied',
      reason: 'Critical approvals remain exclusive to the Owner/Dr. Edgard.',
    }
  }

  if (assignees.includes(user.userId)) {
    return {
      allowed: true,
      canContinue: true,
      canView: true,
      canApproveCritical: false,
      scope: 'assigned',
      reason: 'Thread access granted because the task is assigned to this seat.',
    }
  }

  if (ownerUserId === user.userId) {
    return {
      allowed: true,
      canContinue: true,
      canView: true,
      canApproveCritical: false,
      scope: 'own',
      reason: 'Thread access granted because the seat owns this conversation.',
    }
  }

  if (threadDepartment && user.department && threadDepartment === user.department.toLowerCase()) {
    return {
      allowed: true,
      canContinue: true,
      canView: true,
      canApproveCritical: false,
      scope: 'department',
      reason: 'Thread access granted through department continuity.',
    }
  }

  if (threadScopes.length && hasSharedScope(normalizeScopeList(user.allowedScopes), threadScopes)) {
    return {
      allowed: true,
      canContinue: true,
      canView: true,
      canApproveCritical: false,
      scope: 'authorized',
      reason: 'Thread access granted through allowed scopes.',
    }
  }

  return {
    allowed: false,
    canContinue: false,
    canView: false,
    canApproveCritical: false,
    scope: 'denied',
    reason: 'This seat cannot view or continue the requested context.',
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}
