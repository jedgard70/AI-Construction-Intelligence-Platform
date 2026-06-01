import type { SupabaseClient } from '@supabase/supabase-js'

const ELEVATED_ROLES = ['diretor_executivo', 'coordenador_projetos']

export async function hasProjectAccess(
  serviceClient: SupabaseClient,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!profileError && profile?.role && ELEVATED_ROLES.includes(profile.role)) {
    return true
  }

  const { data: membership, error: membershipError } = await serviceClient
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) return false
  return Boolean(membership?.project_id)
}

