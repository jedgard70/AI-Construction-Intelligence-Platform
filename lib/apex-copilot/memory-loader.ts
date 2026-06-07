import fs from 'fs'
import path from 'path'
import type { ApexCopilotSkill } from './skill-registry'
import {
  APEX_COPILOT_MEMORY_HARD_RULES,
  classifyApexCopilotMemoryDoc,
  type ApexCopilotMemoryDoc,
} from './memory-index'

type LoadedMemoryDoc = ApexCopilotMemoryDoc & {
  excerpt: string
}

const MAX_DOCS_PER_PROMPT = 8
const MAX_EXCERPT_CHARS = 520

let cache: LoadedMemoryDoc[] | null = null

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return safeReadDir(fullPath)
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) return [fullPath]
      return []
    })
  } catch {
    return []
  }
}

function relativeRepoPath(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

function extractTitle(markdown: string, fallback: string) {
  const heading = markdown.split(/\r?\n/).find(line => /^#\s+/.test(line))
  return heading ? heading.replace(/^#\s+/, '').trim() : fallback
}

function extractCompactExcerpt(markdown: string) {
  const lines = markdown
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('```'))

  const useful = lines.filter(line => /^#{1,3}\s+/.test(line) || /^[-*]\s+/.test(line) || /^Objetivo:|^Goal:|^Status:|^Rules?:|^Regras?:/i.test(line))
  const excerpt = (useful.length ? useful : lines).slice(0, 10).join(' ')
  return excerpt.length > MAX_EXCERPT_CHARS ? `${excerpt.slice(0, MAX_EXCERPT_CHARS - 3)}...` : excerpt
}

function loadMarkdownDoc(filePath: string): LoadedMemoryDoc | null {
  try {
    const relativePath = relativeRepoPath(filePath)
    const markdown = fs.readFileSync(filePath, 'utf8')
    const meta = classifyApexCopilotMemoryDoc(relativePath)
    return {
      ...meta,
      title: extractTitle(markdown, meta.title),
      excerpt: extractCompactExcerpt(markdown),
    }
  } catch {
    return null
  }
}

export function loadApexCopilotMemoryIndex() {
  if (cache) return cache

  const repoRoot = process.cwd()
  const docsDir = path.join(repoRoot, 'docs')
  const markdownPaths = [
    path.join(repoRoot, 'README.md'),
    ...safeReadDir(docsDir),
  ].filter(filePath => fs.existsSync(filePath))

  cache = markdownPaths
    .map(loadMarkdownDoc)
    .filter((doc): doc is LoadedMemoryDoc => Boolean(doc))
    .sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1
      return a.path.localeCompare(b.path)
    })

  return cache
}

export function buildApexCopilotMemoryContext(skill: ApexCopilotSkill) {
  const docs = loadApexCopilotMemoryIndex()
  const currentDocs = docs.filter(doc => doc.current)
  const relevant = currentDocs
    .filter(doc => doc.domains.includes(skill.domain) || doc.domains.includes('exploration'))
    .slice(0, MAX_DOCS_PER_PROMPT)
  const historicalCount = docs.length - currentDocs.length

  const memoryLines = relevant.map(doc => [
    `- ${doc.title}`,
    `  path: ${doc.path}`,
    `  category: ${doc.category}`,
    `  use: ${doc.reason}`,
    `  excerpt: ${doc.excerpt}`,
  ].join('\n'))

  return [
    '## Apex Copilot Memory Context',
    'Apex Copilot should use these compact project memories as operating context. Historical/superseded docs are indexed for provenance but are not current truth.',
    '',
    'Master direction summary:',
    '- Apex Global AI is a private construction intelligence platform.',
    '- Apex Copilot is the chat-first construction-specialized assistant and must lead intake conversations.',
    '- Current product direction favors honest live conversation, real previews/viewers where available, and explicit conversion requirements where not available.',
    '',
    'Hard rules:',
    ...APEX_COPILOT_MEMORY_HARD_RULES.map(rule => `- ${rule}`),
    '',
    `Selected domain: ${skill.domain}`,
    `Current docs considered: ${currentDocs.length}`,
    `Historical/superseded docs excluded from prompt truth: ${historicalCount}`,
    '',
    'Relevant memory docs:',
    ...(memoryLines.length ? memoryLines : ['- No domain-specific memory found. Ask focused follow-up questions.']),
  ].join('\n')
}

export function summarizeApexCopilotMemoryIndex() {
  const docs = loadApexCopilotMemoryIndex()
  return docs.reduce((acc, doc) => {
    acc.total += 1
    acc.byCategory[doc.category] = (acc.byCategory[doc.category] || 0) + 1
    if (!doc.current) acc.historical += 1
    return acc
  }, { total: 0, historical: 0, byCategory: {} as Record<string, number> })
}
