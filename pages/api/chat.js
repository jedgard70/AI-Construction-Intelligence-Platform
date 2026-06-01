import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/chat
 *
 * Body params:
 *   model        — Anthropic model string (required)
 *   max_tokens   — integer (required)
 *   messages     — array of {role, content} (required)
 *   system       — inline system prompt (optional, used as fallback)
 *   promptKey    — key in prompt_versions table (optional, overrides system)
 *   vars         — Record<string,string> for {{variable}} interpolation (optional)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY não configurada no servidor.' } })
  }

  const {
    model = 'claude-sonnet-4-6',
    max_tokens = 1024,
    system: inlineSystem,
    messages,
    promptKey,
    vars = {},
  } = req.body

  const docsDir = path.join(process.cwd(), 'docs', 'copilot_knowledge')
  const fallbackSystem = `Voce e o Apex Help AI da AI Construction Intelligence Platform.
Regras obrigatorias:
- Use o workspace oficial: D:\\AI-constr\\AI-Construction-Intelligence-Platform.
- Nao orientar criacao de clone novo da plataforma.
- Nao pedir token, chave secreta ou credencial no chat.
- Responder em portugues do Brasil, foco operacional e seguro.`

  const readDoc = (name) => {
    try {
      const p = path.join(docsDir, name)
      if (!fs.existsSync(p)) return ''
      return fs.readFileSync(p, 'utf8').trim()
    } catch {
      return ''
    }
  }

  const readMarkdownTree = (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) return []
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      const files = []
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          files.push(...readMarkdownTree(full))
          continue
        }
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
        const content = fs.readFileSync(full, 'utf8').trim()
        if (!content) continue
        const rel = path.relative(docsDir, full).replace(/\\/g, '/')
        files.push({ rel, content })
      }
      return files.sort((a, b) => a.rel.localeCompare(b.rel))
    } catch {
      return []
    }
  }

  const governance = readDoc('governance.md')
  const folderStructure = readDoc('folder-structure.md')
  const permissions = readDoc('permissions.md')
  const platformStatus = readDoc('platform-status.md')
  const systemContext = readDoc('APEX_COPILOT_SYSTEM_CONTEXT.md')

  const serverGovernancePrompt = [
    systemContext,
    governance && `## Governance\n${governance}`,
    folderStructure && `## Folder Structure\n${folderStructure}`,
    permissions && `## Permissions\n${permissions}`,
    platformStatus && `## Platform Status\n${platformStatus}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const skillsKnowledge = readMarkdownTree(path.join(docsDir, 'skills'))
  const skillsPrompt = skillsKnowledge.length
    ? skillsKnowledge
        .map((doc) => `### ${doc.rel}\n${doc.content}`)
        .join('\n\n')
    : ''

  const policySystem = [serverGovernancePrompt || fallbackSystem, skillsPrompt && `## Apex Skills Knowledge\n${skillsPrompt}`]
    .filter(Boolean)
    .join('\n\n')

  const joinedUserText = Array.isArray(messages)
    ? messages
        .map((m) => {
          if (typeof m?.content === 'string') return m.content
          if (Array.isArray(m?.content)) return m.content.map((c) => c?.text || '').join(' ')
          return ''
        })
        .join(' ')
        .toLowerCase()
    : ''

  if (
    joinedUserText.includes('clone novo') ||
    (joinedUserText.includes('clonar') && joinedUserText.includes('plataforma'))
  ) {
    return res.status(200).json({
      id: 'help-ai-policy-block',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Bloqueado por governanca Apex: nao criar clone novo da plataforma. Use somente o workspace oficial D:\\AI-constr\\AI-Construction-Intelligence-Platform.',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  // ── Resolve system prompt ─────────────────────────────────────────────────
  let systemPrompt = policySystem

  if (promptKey) {
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data } = await sb
        .from('prompt_versions')
        .select('content')
        .eq('key', promptKey)
        .eq('active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (data?.content) {
        let resolved = data.content
        // {{variable}} interpolation
        for (const [k, v] of Object.entries(vars)) {
          resolved = resolved.replaceAll(`{{${k}}}`, String(v))
        }
        systemPrompt = `${policySystem}\n\n## Prompt Version\n${resolved}`
      }
    } catch {
      // keep policySystem fallback
    }
  }

  if (inlineSystem && typeof inlineSystem === 'string' && inlineSystem.trim()) {
    systemPrompt = `${systemPrompt}\n\n## Client Context\n${inlineSystem.trim()}`
  }

  // ── Forward to Anthropic ──────────────────────────────────────────────────
  const body = { model, max_tokens, messages }
  if (systemPrompt) body.system = systemPrompt

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await anthropicRes.json()
    return res.status(anthropicRes.status).json(data)
  } catch {
    return res.status(500).json({ error: { message: 'Erro ao conectar com a API Anthropic.' } })
  }
}
