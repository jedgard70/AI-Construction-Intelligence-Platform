/**
 * Graph-based agent execution engine.
 * Supports DAG dependency resolution, parallel layers, priority scheduling,
 * fallback agents, and memory routing between nodes.
 */

export type AgentStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface AgentNode {
  id: string
  name: string
  role: string
  systemPrompt?: string
  userPrompt: string
  dependencies: string[]   // IDs that must complete before this runs
  priority: number         // Higher → runs first within same layer
  fallbackId?: string      // ID of fallback node if this fails
  maxRetries?: number
  model?: string
  maxTokens?: number
  // Runtime fields (populated during execution)
  status: AgentStatus
  output?: string
  outputJson?: Record<string, unknown>
  error?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  retries?: number
}

export interface AgentGraph {
  taskId: string
  description: string
  nodes: AgentNode[]
  memory: Record<string, unknown>  // Shared memory across all nodes
}

export interface ExecutionResult {
  taskId: string
  description: string
  layers: string[][]           // Execution order (each array = parallel batch)
  nodes: Record<string, AgentNode>
  memory: Record<string, unknown>
  finalOutput?: string
  status: 'completed' | 'partial' | 'failed'
  totalDurationMs: number
  executedAt: string
}

/** Topological sort into parallel execution layers, sorted by priority within each layer. */
export function buildExecutionLayers(graph: AgentGraph): string[][] {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]))
  const remaining = new Map(graph.nodes.map(n => [n.id, new Set(n.dependencies)]))
  const layers: string[][] = []

  while (remaining.size > 0) {
    const ready = Array.from(remaining.entries())
      .filter(([, deps]) => deps.size === 0)
      .map(([id]) => id)
      .sort((a, b) => (nodeMap.get(b)!.priority) - (nodeMap.get(a)!.priority))

    if (ready.length === 0) {
      const cycle = Array.from(remaining.keys()).join(', ')
      throw new Error(`Ciclo detectado no grafo de agentes: [${cycle}]`)
    }

    layers.push(ready)
    ready.forEach(id => {
      remaining.delete(id)
      remaining.forEach(deps => deps.delete(id))
    })
  }

  return layers
}

/** Resolve template variables in a prompt string from memory and completed node outputs. */
export function resolvePrompt(template: string, memory: Record<string, unknown>, nodes: Record<string, AgentNode>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
    const parts = path.split('.')
    // Check memory first
    if (parts[0] in memory) {
      let val: unknown = memory[parts[0]]
      for (let i = 1; i < parts.length; i++) val = (val as Record<string, unknown>)?.[parts[i]]
      return val != null ? String(val) : `{{${path}}}`
    }
    // Check node output: {{nodeId.output}} or {{nodeId.field}}
    const node = nodes[parts[0]]
    if (node) {
      if (parts[1] === 'output' || parts.length === 1) return node.output ?? `{{${path}}}`
      return String(node.outputJson?.[parts[1]] ?? `{{${path}}}`)
    }
    return `{{${path}}}`
  })
}

/** Extract JSON from LLM output text (handles markdown fences). */
export function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text.trim()
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    // Try to find first {...} block
    const block = raw.match(/\{[\s\S]*\}/)
    if (block) {
      try { return JSON.parse(block[0]) } catch { return null }
    }
    return null
  }
}

/** Determine which node to use if the primary fails (walks the fallback chain). */
export function resolveFallback(failedId: string, nodeMap: Map<string, AgentNode>): AgentNode | null {
  let current = nodeMap.get(failedId)
  const visited = new Set<string>()
  while (current?.fallbackId && !visited.has(current.fallbackId)) {
    visited.add(current.id)
    current = nodeMap.get(current.fallbackId) ?? undefined
  }
  return current && current.id !== failedId ? current : null
}

/** Route outputs from completed nodes into shared memory for downstream agents. */
export function routeMemory(
  completedNode: AgentNode,
  memory: Record<string, unknown>,
  memoryKeys?: string[]
): void {
  // Auto-route: store output under nodeId
  memory[completedNode.id] = {
    output: completedNode.output,
    ...(completedNode.outputJson ?? {}),
  }
  // Explicit key routing
  if (memoryKeys && completedNode.outputJson) {
    memoryKeys.forEach(key => {
      if (key in (completedNode.outputJson ?? {})) {
        memory[key] = completedNode.outputJson![key]
      }
    })
  }
}
