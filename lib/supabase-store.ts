/**
 * Supabase persistence layer — camada unificada de armazenamento.
 * Substitui os Maps em memória por Supabase, garantindo que dados
 * sobrevivam a cold starts no Vercel. Zero dependências externas.
 *
 * Padrão write-through: escreve no Supabase e mantém cache local.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Client (server-side, usa service role se disponível) ────────────────────

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||           // preferido: acesso total no servidor
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key, {
    auth: { persistSession: false },
  })
  return _client
}

// ─── Agent Tasks Queue ────────────────────────────────────────────────────────

export interface AgentTask {
  id: string
  tenant_id: string
  project_id?: string
  task: string
  task_type: string
  context: Record<string, unknown>
  priority: number
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  agent_ids: string[]
  result?: Record<string, unknown>
  error?: string
  retry_count: number
  max_retries: number
  scheduled_for: string
  recurring_cron?: string
  triggered_by: string
  trace_id?: string
  created_at: string
  started_at?: string
  finished_at?: string
  duration_ms?: number
}

export async function enqueueTask(task: Omit<AgentTask, 'id' | 'status' | 'retry_count' | 'agent_ids' | 'created_at'>): Promise<AgentTask | null> {
  const db = getClient()
  if (!db) return null
  const { data, error } = await db
    .from('agent_tasks')
    .insert({ ...task, status: 'pending', retry_count: 0, agent_ids: [] })
    .select()
    .single()
  if (error) { console.error('[supabase-store] enqueueTask:', error.message); return null }
  return data as AgentTask
}

export async function claimPendingTasks(limit = 10): Promise<AgentTask[]> {
  const db = getClient()
  if (!db) return []
  const { data, error } = await db.rpc('claim_pending_tasks', { p_limit: limit })
  if (error) { console.error('[supabase-store] claimPendingTasks:', error.message); return [] }
  return (data ?? []) as AgentTask[]
}

export async function completeTask(
  id: string,
  result: Record<string, unknown>,
  agentIds: string[],
  traceId?: string
): Promise<void> {
  const db = getClient()
  if (!db) return
  const now = new Date().toISOString()
  await db.from('agent_tasks').update({
    status: 'done',
    result,
    agent_ids: agentIds,
    trace_id: traceId,
    finished_at: now,
  }).eq('id', id)
}

export async function failTask(id: string, error: string, retryCount: number, maxRetries: number): Promise<void> {
  const db = getClient()
  if (!db) return
  const isExhausted = retryCount >= maxRetries
  await db.from('agent_tasks').update({
    status: isExhausted ? 'failed' : 'pending',
    error,
    retry_count: retryCount + 1,
    scheduled_for: isExhausted ? undefined : new Date(Date.now() + 60_000 * Math.pow(2, retryCount)).toISOString(),
    finished_at: isExhausted ? new Date().toISOString() : undefined,
  }).eq('id', id)
}

export async function scheduleRecurringTasks(): Promise<void> {
  // Re-enqueue recurring tasks that are due
  const db = getClient()
  if (!db) return
  const { data } = await db
    .from('agent_tasks')
    .select()
    .eq('status', 'done')
    .not('recurring_cron', 'is', null)
    .lt('next_run_at', new Date().toISOString())
  if (!data?.length) return
  for (const t of data as AgentTask[]) {
    await enqueueTask({
      tenant_id: t.tenant_id,
      project_id: t.project_id,
      task: t.task,
      task_type: t.task_type,
      context: t.context,
      priority: t.priority,
      max_retries: t.max_retries,
      recurring_cron: t.recurring_cron,
      scheduled_for: new Date().toISOString(),
      triggered_by: 'system:cron',
    })
  }
}

// ─── Knowledge Chunks ─────────────────────────────────────────────────────────

export interface KnowledgeChunk {
  id: string
  doc_id: string
  project_id?: string
  tenant_id: string
  text: string
  embedding?: number[]
  metadata: Record<string, unknown>
  token_count?: number
  created_at: string
}

export async function upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
  const db = getClient()
  if (!db || !chunks.length) return
  const rows = chunks.map(c => ({
    id: c.id,
    doc_id: c.doc_id,
    project_id: c.project_id,
    tenant_id: c.tenant_id,
    text: c.text,
    embedding: c.embedding ? JSON.stringify(c.embedding) : null,
    metadata: c.metadata,
    token_count: c.token_count,
  }))
  const { error } = await db.from('knowledge_chunks').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[supabase-store] upsertChunks:', error.message)
}

export async function loadChunks(tenantId: string, docId?: string): Promise<KnowledgeChunk[]> {
  const db = getClient()
  if (!db) return []
  let q = db.from('knowledge_chunks').select().eq('tenant_id', tenantId)
  if (docId) q = q.eq('doc_id', docId)
  const { data, error } = await q.limit(2000)
  if (error) { console.error('[supabase-store] loadChunks:', error.message); return [] }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    embedding: r.embedding ? JSON.parse(r.embedding as string) : undefined,
  })) as KnowledgeChunk[]
}

export async function fullTextSearch(query: string, tenantId: string, limit = 10): Promise<KnowledgeChunk[]> {
  const db = getClient()
  if (!db) return []
  const { data, error } = await db
    .from('knowledge_chunks')
    .select()
    .eq('tenant_id', tenantId)
    .textSearch('text', query, { type: 'plain', config: 'portuguese' })
    .limit(limit)
  if (error) { console.error('[supabase-store] fullTextSearch:', error.message); return [] }
  return data as KnowledgeChunk[]
}

export async function deleteDocChunks(docId: string, tenantId: string): Promise<number> {
  const db = getClient()
  if (!db) return 0
  const { data, error } = await db
    .from('knowledge_chunks')
    .delete()
    .eq('doc_id', docId)
    .eq('tenant_id', tenantId)
    .select('id')
  if (error) return 0
  return data?.length ?? 0
}

// ─── Persistent Memory (usa memory_long_term existente) ───────────────────────

export async function memorySet(key: string, value: unknown, projectId?: string): Promise<void> {
  const db = getClient()
  if (!db) return
  await db.from('memory_long_term').upsert({
    key,
    title: key,
    content: { value },
    type: 'agent_context',
    tags: ['autonomous', 'runtime'],
    ...(projectId ? { project_id: projectId } : {}),
    review_status: 'aprovado',
  }, { onConflict: 'key' })
}

export async function memoryGet(key: string): Promise<unknown> {
  const db = getClient()
  if (!db) return null
  const { data } = await db
    .from('memory_long_term')
    .select('content')
    .eq('key', key)
    .single()
  return (data?.content as Record<string, unknown>)?.value ?? null
}

export async function memoryGetAll(prefix?: string): Promise<Record<string, unknown>> {
  const db = getClient()
  if (!db) return {}
  let q = db.from('memory_long_term').select('key, content').eq('type', 'agent_context')
  if (prefix) q = q.like('key', `${prefix}%`)
  const { data } = await q.limit(200)
  const result: Record<string, unknown> = {}
  for (const row of data ?? []) {
    result[row.key] = (row.content as Record<string, unknown>)?.value
  }
  return result
}

// ─── Autonomous Alerts ────────────────────────────────────────────────────────

export interface AutonomousAlert {
  project_id?: string
  tenant_id?: string
  type: string
  severity: 'baixo' | 'medio' | 'alto' | 'critico'
  title: string
  description: string
  data?: Record<string, unknown>
  auto_action_taken?: boolean
  auto_action_result?: Record<string, unknown>
}

export async function createAlert(alert: AutonomousAlert): Promise<string | null> {
  const db = getClient()
  if (!db) return null
  const { data, error } = await db
    .from('autonomous_alerts')
    .insert({ ...alert, status: 'open' })
    .select('id')
    .single()
  if (error) { console.error('[supabase-store] createAlert:', error.message); return null }
  return data?.id ?? null
}

export async function getOpenAlerts(projectId?: string): Promise<AutonomousAlert[]> {
  const db = getClient()
  if (!db) return []
  let q = db.from('autonomous_alerts').select().eq('status', 'open')
  if (projectId) q = q.eq('project_id', projectId)
  const { data } = await q.order('created_at', { ascending: false }).limit(50)
  return (data ?? []) as AutonomousAlert[]
}

// ─── Projects (acesso direto às tabelas existentes) ───────────────────────────

export interface ProjectSnapshot {
  id: string
  name: string
  status: string
  execution_mode: string
  budget_total?: number
  budget_spent?: number
  cpi?: number
  spi?: number
  safety_index?: number
  ai_context?: Record<string, unknown>
}

export async function getActiveProjects(): Promise<ProjectSnapshot[]> {
  const db = getClient()
  if (!db) return []
  const { data } = await db
    .from('projects')
    .select('id, name, status, execution_mode, budget_total, budget_spent, cpi, spi, safety_index, ai_context')
    .in('status', ['em_andamento', 'planejamento'])
    .in('execution_mode', ['semi_autonomous', 'fully_autonomous'])
  return (data ?? []) as ProjectSnapshot[]
}

export async function updateProjectAIContext(projectId: string, context: Record<string, unknown>): Promise<void> {
  const db = getClient()
  if (!db) return
  await db.from('projects').update({ ai_context: context, updated_at: new Date().toISOString() }).eq('id', projectId)
}

// ─── Execution Log (usa ai_agent_executions existente) ────────────────────────

export async function logAgentExecution(params: {
  agentName: string
  projectId?: string
  input: unknown
  output: unknown
  status: 'success' | 'failed'
  durationMs: number
  errorMsg?: string
}): Promise<void> {
  const db = getClient()
  if (!db) return
  const { data: agent } = await db
    .from('ai_agents')
    .select('id')
    .eq('name', params.agentName)
    .single()
  if (!agent) return
  await db.from('ai_agent_executions').insert({
    agent_id: agent.id,
    project_id: params.projectId,
    input: params.input,
    output: params.output,
    status: params.status,
    error_msg: params.errorMsg,
    duration_ms: params.durationMs,
    finished_at: new Date().toISOString(),
  })
}

// ─── Digital Twin Site State ──────────────────────────────────────────────────

export async function getSiteState(projectId: string): Promise<Record<string, unknown> | null> {
  const db = getClient()
  if (!db) return null
  const { data } = await db.from('site_states').select().eq('project_id', projectId).single()
  return data ?? null
}

export async function upsertSiteState(projectId: string, state: Record<string, unknown>): Promise<void> {
  const db = getClient()
  if (!db) return
  await db.from('site_states').upsert({
    project_id: projectId,
    ...state,
    last_sync: new Date().toISOString(),
  }, { onConflict: 'project_id' })
}
