import fs from 'fs'
import path from 'path'

const REPO_MARKERS = ['.git', 'package.json', 'pages', 'docs', 'supabase'] as const

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function safeRealpath(p: string): string {
  try {
    return fs.realpathSync.native(p)
  } catch {
    return p
  }
}

export function normalizePath(inputPath: unknown): string {
  if (!isString(inputPath)) return ''
  const abs = path.win32.resolve(inputPath.trim())
  const real = safeRealpath(abs)
  return real.replace(/\//g, '\\').toLowerCase()
}

export function isCaseInsensitiveSamePath(pathA: unknown, pathB: unknown): boolean {
  if (!isString(pathA) || !isString(pathB)) return false
  return normalizePath(pathA) === normalizePath(pathB)
}

export function hasRepoMarkers(targetPath: unknown): {
  hasMarkers: boolean
  markersFound: string[]
} {
  if (!isString(targetPath)) {
    return {
      hasMarkers: false,
      markersFound: [],
    }
  }
  const abs = path.win32.resolve(targetPath)
  const markersFound = REPO_MARKERS.filter(marker =>
    fs.existsSync(path.win32.join(abs, marker))
  )
  return {
    hasMarkers: markersFound.length > 0,
    markersFound,
  }
}

export function extractWindowsPaths(input: unknown): string[] {
  if (!isString(input)) return []
  const matches = input.match(/[a-zA-Z]:\\[^"'`\n\r\t]+/g) ?? []
  return Array.from(new Set(matches))
}
