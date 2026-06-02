import { extractWindowsPaths, hasRepoMarkers, isCaseInsensitiveSamePath } from './path-guard'
import { OFFICIAL_WORKSPACE_PATH, isInsideOfficialWorkspace } from './workspace-guard'

export type DestructiveRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type DestructiveRiskReport = {
  risk: DestructiveRiskLevel
  action: string
  targets: string[]
  reasons: string[]
  requiresOwnerApproval: boolean
}

const DESTRUCTIVE_KEYWORDS = [
  'delete',
  'remove',
  'rm ',
  'rmdir',
  'del ',
  'erase',
  'cleanup',
  'wipe',
  'reset --hard',
  'checkout --',
  'move',
] as const

export function classifyDestructiveRisk(actionText: string, candidatePaths: string[] = []): DestructiveRiskReport {
  const lowered = actionText.toLowerCase()
  const keywordMatch = DESTRUCTIVE_KEYWORDS.some(k => lowered.includes(k))
  const extracted = extractWindowsPaths(actionText)
  const targets = Array.from(new Set([...candidatePaths, ...extracted]))
  const reasons: string[] = []

  let risk: DestructiveRiskLevel = keywordMatch ? 'medium' : 'low'

  for (const t of targets) {
    if (isCaseInsensitiveSamePath(t, OFFICIAL_WORKSPACE_PATH)) {
      risk = 'critical'
      reasons.push(`Target resolves to official workspace: ${t}`)
      continue
    }

    if (isInsideOfficialWorkspace(t)) {
      risk = risk === 'critical' ? risk : 'high'
      reasons.push(`Target is inside official workspace: ${t}`)
    }

    const markers = hasRepoMarkers(t)
    if (markers.hasMarkers) {
      risk = risk === 'critical' ? risk : 'high'
      reasons.push(`Repository markers found in ${t}: ${markers.markersFound.join(', ')}`)
    }
  }

  if (!keywordMatch && targets.length === 0) {
    reasons.push('No destructive intent detected')
  }

  const requiresOwnerApproval = risk === 'high' || risk === 'critical'
  return {
    risk,
    action: actionText,
    targets,
    reasons,
    requiresOwnerApproval,
  }
}

export function requireOwnerApproval(params: {
  report: DestructiveRiskReport
  ownerApproved: boolean
}): { allowed: boolean; reason: string } {
  const { report, ownerApproved } = params
  if (!report.requiresOwnerApproval) {
    return { allowed: true, reason: 'No owner approval required' }
  }
  if (!ownerApproved) {
    return {
      allowed: false,
      reason: `Owner approval required for ${report.risk} risk action`,
    }
  }
  return { allowed: true, reason: 'Owner approval provided' }
}
