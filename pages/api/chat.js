import { createClient } from '@supabase/supabase-js'

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

  // ── Resolve system prompt ─────────────────────────────────────────────────
  let systemPrompt = inlineSystem ?? null

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
        systemPrompt = resolved
      }
    } catch {
      // fall through to inlineSystem
    }
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
