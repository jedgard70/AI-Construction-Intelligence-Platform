import path from 'path'
import { isCaseInsensitiveSamePath, normalizePath } from './path-guard'

export const OFFICIAL_WORKSPACE_PATH = 'D:\\AI-constr\\AI-Construction-Intelligence-Platform'

export function isOfficialWorkspace(candidatePath: string): boolean {
  return isCaseInsensitiveSamePath(candidatePath, OFFICIAL_WORKSPACE_PATH)
}

export function isInsideOfficialWorkspace(candidatePath: string): boolean {
  const official = normalizePath(OFFICIAL_WORKSPACE_PATH)
  const target = normalizePath(path.win32.resolve(candidatePath))
  return target === official || target.startsWith(`${official}\\`)
}
