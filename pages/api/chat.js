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

  const { model, max_tokens, system: inlineSystem, messages, promptKey, vars = {} } = req.body

  // ── Resolve system prompt ───────────────────────────�