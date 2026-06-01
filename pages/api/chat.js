import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { Buffer } from 'buffer'

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

  const ownerEmails = (process.env.APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const authHeader = req.headers.authorization
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : ''

  const decodeJwtPayload = (token) => {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      return payload
    } catch {
      return null
    }
  }

  const resolveUserContext = async () => {
    const guestContext = {
      role: 'guest',
      is_owner: false,
      user_id: null,
      email: null,
      allowed_scopes: ['public_help'],
      permission_summary:
        'Visitante sem sessao. Pode receber orientacao geral, sem contexto interno sensivel. Fazer login para acessar contexto completo.',
      department: null,
    }

    if (!bearerToken) return guestContext

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceRoleKey) return guestContext

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const serviceClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await userClient.auth.getUser(bearerToken)
    if (error || !data?.user) return guestContext

    const email = (data.user.email || '').toLowerCase()
    const isOwner = ownerEmails.includes(email)

    let role = isOwner ? 'owner' : 'user'
    let allowedScopes = isOwner ? ['all'] : ['department']
    let department = null

    const uid = data.user.id
    const profileQueries = [
      serviceClient.from('profiles').select('role,is_owner,allowed_scopes,department').eq('id', uid).maybeSingle(),
      serviceClient.from('users').select('role,is_owner,allowed_scopes,department').eq('id', uid).maybeSingle(),
      serviceClient.from('user_roles').select('role,is_owner,allowed_scopes,department').eq('user_id', uid).maybeSingle(),
    ]

    for (const query of profileQueries) {
      try {
        const { data: row } = await query
        if (!row) continue
        if (typeof row.role === 'string' && row.role.trim()) role = row.role.trim().toLowerCase()
        if (row.is_owner === true) role = 'owner'
        if (Array.isArray(row.allowed_scopes) && row.allowed_scopes.length) {
          allowedScopes = row.allowed_scopes.map((v) => String(v))
        }
        if (typeof row.department === 'string') department = row.department
        break
      } catch {
        // continue to next table
      }
    }

    const finalIsOwner = role === 'owner' || isOwner
    if (finalIsOwner) {
      role = 'owner'
      allowedScopes = ['all']
    }

    const permissionSummary =
      role === 'owner'
        ? 'Owner com acesso completo a plataforma, roadmap, modulos e departamentos.'
        : role === 'admin'
        ? 'Admin com escopo amplo de operacao, sem acesso ao contexto privado do owner.'
        : role === 'client'
        ? 'Cliente com acesso restrito aos projetos/documentos autorizados.'
        : 'Usuario com acesso restrito por departamento/funcao.'

    return {
      role,
      is_owner: finalIsOwner,
      user_id: uid,
      email,
      allowed_scopes: allowedScopes,
      permission_summary: permissionSummary,
      department,
    }
  }

  const userContext = await resolveUserContext()

  const classifyIntent = (text) => {
    const t = text.toLowerCase()
    if (
      t.includes('service role key') ||
      t.includes('api key') ||
      t.includes('token') ||
      t.includes('pat ') ||
      t.includes('senha') ||
      t.includes('secret')
    ) {
      return 'secret_request'
    }
    if (
      t.includes('apague ') ||
      t.includes('delete ') ||
      t.includes('rm -rf') ||
      t.includes('git reset') ||
      t.includes('drop table') ||
      t.includes('destruir') ||
      t.includes('formatar')
    ) {
      return 'destructive_request'
    }
    if (
      t.includes('publique') ||
      t.includes('poste') ||
      t.includes('envie email') ||
      t.includes('suba no ar') ||
      t.includes('deploy')
    ) {
      return 'external_publish'
    }
    if (
      t.includes('implementar') ||
      t.includes('corrigir') ||
      t.includes('alterar codigo') ||
      t.includes('criar pr')
    ) {
      return 'implementation_guidance'
    }
    if (t.includes('status') || t.includes('como está') || t.includes('como esta')) {
      return 'safe_info'
    }
    return 'unknown'
  }

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
  const roleSeatEnforcement = readDoc('role-seat-enforcement.md')

  const serverGovernancePrompt = [
    systemContext,
    governance && `## Governance\n${governance}`,
    folderStructure && `## Folder Structure\n${folderStructure}`,
    permissions && `## Permissions\n${permissions}`,
    roleSeatEnforcement && `## Role Seat Enforcement\n${roleSeatEnforcement}`,
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

  const seatContextPrompt = `## Seat Context
role: ${userContext.role}
is_owner: ${userContext.is_owner ? 'true' : 'false'}
user_id: ${userContext.user_id || 'guest'}
email: ${userContext.email || 'guest'}
department: ${userContext.department || 'n/a'}
allowed_scopes: ${Array.isArray(userContext.allowed_scopes) ? userContext.allowed_scopes.join(', ') : 'n/a'}
permission_summary: ${userContext.permission_summary}

Policy:
- Nunca vazar dados de outros assentos.
- Admin nao acessa contexto privado do Owner.
- Guest nao recebe status interno sensivel nem roadmap privado.
- Cliente acessa apenas projetos/documentos autorizados.
- Sempre bloquear pedido de token/secret no chat.`

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

  const intentClass = classifyIntent(joinedUserText)

  const safeAuditMeta = {
    timestamp: new Date().toISOString(),
    user_id: userContext.user_id || null,
    role: userContext.role,
    page_path: (() => {
      const m = joinedUserText.match(/page:\s*([^\n]+)/i)
      return m?.[1]?.trim() || null
    })(),
    intent_class: intentClass,
    blocked_by_policy: false,
    reason: null,
  }

  const logHelpAudit = (meta) => {
    try {
      // Contract-only audit trail (non-sensitive, non-blocking)
      console.info('[HELP_AI_AUDIT]', JSON.stringify(meta))
    } catch {
      // never break chat flow if audit log fails
    }
  }

  const asksOwnerPrivate =
    joinedUserText.includes('todos os chats do josé') ||
    joinedUserText.includes('todos os chats do jose') ||
    (joinedUserText.includes('chats do') && joinedUserText.includes('jose'))

  const asksInternalRoadmap =
    joinedUserText.includes('roadmap privado') ||
    joinedUserText.includes('status interno completo') ||
    joinedUserText.includes('dados internos')

  if (
    joinedUserText.includes('clone novo') ||
    (joinedUserText.includes('clonar') && joinedUserText.includes('plataforma'))
  ) {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: true, reason: 'clone_new_blocked' })
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

  if (intentClass === 'secret_request') {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: true, reason: 'secret_request_blocked' })
    return res.status(200).json({
      id: 'help-ai-secret-block',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Bloqueado por seguranca Apex: nao posso fornecer, solicitar ou orientar uso de tokens, keys, service role, PAT ou segredos. Use configuracao segura no ambiente e no backend.',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  if (
    joinedUserText.includes('system prompt completo') ||
    joinedUserText.includes('mostre o system prompt') ||
    joinedUserText.includes('prompt mestre completo')
  ) {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: true, reason: 'system_prompt_disclosure_blocked' })
    return res.status(200).json({
      id: 'help-ai-system-block',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Por seguranca, nao exponho o system prompt completo. Posso explicar as politicas ativas em alto nivel (governanca, role/seat e guardrails).',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  if (intentClass === 'destructive_request' || intentClass === 'external_publish') {
    logHelpAudit({
      ...safeAuditMeta,
      blocked_by_policy: true,
      reason: intentClass === 'destructive_request' ? 'destructive_approval_required' : 'external_publish_approval_required',
    })
    return res.status(200).json({
      id: 'help-ai-approval-required',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Acao sensivel detectada. Antes de executar, preciso de aprovacao explicita com este checklist:\n1) Escopo exato da acao\n2) Ambiente alvo\n3) Impacto esperado\n4) Plano de rollback\n5) Confirmacao final: AUTORIZO EXECUTAR',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  if (!userContext.is_owner && asksOwnerPrivate) {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: true, reason: 'owner_private_scope_blocked' })
    return res.status(200).json({
      id: 'help-ai-seat-block',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Acesso negado por politica de assento: contexto privado do Owner nao pode ser exibido para este perfil.',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  if (userContext.role === 'guest' && asksInternalRoadmap) {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: true, reason: 'guest_sensitive_scope_blocked' })
    return res.status(200).json({
      id: 'help-ai-guest-guard',
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text:
            'Voce esta como visitante. Faca login para acessar contexto interno sensivel da plataforma e roadmap detalhado.',
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  // ── Resolve system prompt ─────────────────────────────────────────────────
  let systemPrompt = `${policySystem}\n\n${seatContextPrompt}`

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
        systemPrompt = `${policySystem}\n\n${seatContextPrompt}\n\n## Prompt Version\n${resolved}`
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
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: false, reason: null })
    return res.status(anthropicRes.status).json(data)
  } catch {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: false, reason: 'provider_error_fallback' })
    return res.status(500).json({ error: { message: 'Erro ao conectar com a API Anthropic.' } })
  }
}
