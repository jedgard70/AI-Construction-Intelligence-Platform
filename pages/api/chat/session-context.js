import { getBearerToken, getSeatPermissionSummary, resolveOwnerContext } from '../../../lib/owner-auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  if (!bearerToken) {
    return res.status(200).json({
      role: 'guest',
      is_owner: false,
      email: null,
      user_id: null,
      permission_summary: 'Please log in on this Preview before using protected attachment analysis.',
    })
  }

  const user = await resolveOwnerContext(bearerToken)
  if (!user.userId) {
    return res.status(401).json({
      error: { message: 'Please log in on this Preview before using protected attachment analysis.' },
      role: 'guest',
      is_owner: false,
      email: null,
      user_id: null,
    })
  }

  return res.status(200).json({
    role: user.role,
    is_owner: user.isOwner,
    email: user.email,
    user_id: user.userId,
    allowed_scopes: user.allowedScopes,
    department: user.department,
    permission_summary: getSeatPermissionSummary(user),
  })
}
