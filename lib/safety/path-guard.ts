import fs from 'fs'
import path from 'path'

const REPO_MARKERS = ['.git', 'package.json', 'pages', 'docs', 'supabase'] as const

function safeRealpath(p: string): string {
  try {
    return fs.realpathSync.native(p)
  } catch {
    return p
  }
}

export function normalizePath(inputPath: string): string {
  const abs = path.win32.resolve(inputPath.trim())
  const real = safeRealpath(abs)
  return real.replace(/\//g, '\\').toLowerCase()
}

export function isCaseInsensitiveSamePath(pathA: string, pathB: string): boolean {
  return normalizePath(pathA) === normalizePath(pathB)
}

export function hasRepoMarkers(targetPath: string): {
  hasMarkers: boolean
  markersFound: string[]
} {
  const abs = path.win32.resolve(targetPath)
  const markersFound = REPO_MARKERS.filter(marker =>
    fs.existsSync(path.win32.join(abs, marker))
  )
  return {
    hasMarkers: markersFound.length > 0,
    markersFound,
  }
}

export function extractWindowsPaths(input: string): string[] {
  const matches = input.match(/[a-zA-Z]:\\[^"'`\n\r\t]+/g) ?? []
  return Array.from(new Set(matches))
}
