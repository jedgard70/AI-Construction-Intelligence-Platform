import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import {
  getBearerToken,
  getSeatPermissionSummary,
  resolveOwnerContext,
} from '../../lib/owner-auth'

/**
 * POST /api/chat
 *
 * Body params:
 *   model        — ignored for CP1 runtime; OpenAI model is server-side env controlled
 *   max_tokens   — integer (optional)
 *   messages     — array of {role, content} (required)
 *   system       — inline system prompt (optional, used as fallback)
 *   promptKey    — key in prompt_versions table (optional, overrides system)
 *   vars         — Record<string,string> for {{variable}} interpolation (optional)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const {
    max_tokens = 1024,
    system: inlineSystem,
    messages,
    promptKey,
    vars = {},
  } = req.body

  const bearerToken = getBearerToken(req.headers.authorization)

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

    const user = await resolveOwnerContext(bearerToken)
    if (!user.userId) return guestContext

    const permissionSummary = getSeatPermissionSummary(user)

    return {
      role: String(user.role),
      is_owner: user.isOwner,
      user_id: user.userId,
      email: user.email,
      allowed_scopes: user.allowedScopes,
      permission_summary: permissionSummary,
      department: user.department,
    }
  }

  const userContext = await resolveUserContext()
  const apexContextPayload = {
    role: userContext.role,
    is_owner: userContext.is_owner,
    email: userContext.email,
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'OPENAI_API_KEY nao configurada no servidor.' },
      apex_context: apexContextPayload,
    })
  }
  const openaiModel = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const classifyIntent = (text) => {
    const t = text.toLowerCase()
    const hasSecretTerm = [
      'service role',
      'api key',
      'api_key',
      'openai_api_key',
      'token',
      'pat ',
      'personal access token',
      'chave',
      'senha',
      'secret',
      'segredo',
      'credencial',
    ].some(term => t.includes(term))
    const hasAllowedSecretContext = [
      'não expor secrets',
      'nao expor secrets',
      'não expor segredos',
      'nao expor segredos',
      'do not expose secrets',
      'sem secrets',
      'sem segredos',
      'tokens temporários',
      'tokens temporarios',
      'env var',
      'environment variable',
      'environment configuration',
      'configuro openai_api_key',
      'configurar openai_api_key',
      'openai_api_key configurada',
      'safety gate',
      'checklist',
      'status',
      'audit',
      'auditoria',
      'security policy',
      'política de segurança',
      'politica de seguranca',
      'pr status',
      'cp1',
      'cp0',
      'documentação',
      'documentacao',
      'safe setup',
      'configuração segura',
      'configuracao segura',
    ].some(term => t.includes(term))
    const hasSecretExtractionAction = [
      'me mostre',
      'mostre o',
      'mostra o',
      'reveal',
      'revele',
      'provide',
      'forneça',
      'forneca',
      'cole o',
      'paste',
      'print',
      'imprima',
      'exponha',
      'expose',
      'retrieve',
      'recupere',
      'bypass',
      'ignore a política',
      'ignore a politica',
      'gere um token',
      'generate token',
      'gera um token',
      'qual é o token',
      'qual e o token',
      'qual é a key',
      'qual e a key',
    ].some(term => t.includes(term))
    if (hasSecretTerm && hasSecretExtractionAction) {
      return 'secret_request'
    }
    if (hasSecretTerm && hasAllowedSecretContext) {
      return 'safe_info'
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
      model: openaiModel,
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
      model: openaiModel,
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
      model: openaiModel,
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
      model: openaiModel,
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
      model: openaiModel,
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
      model: openaiModel,
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
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

  const normalizeContent = (content) => {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part?.text === 'string') return part.text
          if (typeof part?.content === 'string') return part.content
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }
    return ''
  }

  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(messages) ? messages : [])
      .map((message) => ({
        role: message?.role === 'assistant' ? 'assistant' : 'user',
        content: normalizeContent(message?.content),
      }))
      .filter((message) => message.content.trim()),
  ]

  const body = {
    model: openaiModel,
    max_tokens,
    messages: openaiMessages,
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await openaiRes.json()
    const text = data?.choices?.[0]?.message?.content || ''
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: false, reason: null })
    return res.status(openaiRes.status).json({
      id: data?.id || 'openai-chat-completion',
      type: 'message',
      role: 'assistant',
      model: data?.model || openaiModel,
      content: [{ type: 'text', text }],
      stop_reason: data?.choices?.[0]?.finish_reason || 'stop',
      usage: {
        input_tokens: data?.usage?.prompt_tokens,
        output_tokens: data?.usage?.completion_tokens,
      },
      error: data?.error,
      apex_context: apexContextPayload,
    })
  } catch {
    logHelpAudit({ ...safeAuditMeta, blocked_by_policy: false, reason: 'provider_error_fallback' })
    return res.status(500).json({
      error: { message: 'Erro ao conectar com a API OpenAI.' },
      apex_context: apexContextPayload,
    })
  }
}
