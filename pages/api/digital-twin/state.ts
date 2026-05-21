/**
 * POST /api/digital-twin/state   — update site state (IoT/sensor events)
 * GET  /api/digital-twin/state   — get current site state
 * POST /api/digital-twin/simulate — run a simulation scenario
 *
 * Digital Twin: real-time 3D site state, IoT stream processing,
 * construction sequence simulation, safety simulation, resource simulation.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export interface SiteElement {
  id: string
  type: 'structure' | 'equipment' | 'worker' | 'material' | 'zone'
  name: string
  position: { x: number; y: number; z: number }
  dimensions?: { width: number; height: number; depth: number }
  status: 'active' | 'idle' | 'alert' | 'offline' | 'complete'
  progress?: number   // 0–100 for construction elements
  metadata: Record<string, unknown>
  lastUpdated: string
}

export interface IoTEvent {
  sensorId: string
  type: 'temperature' | 'humidity' | 'vibration' | 'load' | 'position' | 'safety' | 'progress'
  value: number
  unit: string
  elementId?: string
  timestamp: string
  alert?: boolean
  alertMessage?: string
}

export interface SiteState {
  projectId: string
  elements: Record<string, SiteElement>
  iotEvents: IoTEvent[]
  lastSync: string
  overallProgress: number
  activeAlerts: string[]
  resourceUtilization: {
    workers: number
    equipment: number
    materials: number
  }
  simulationResults: SimulationResult[]
}

export interface SimulationResult {
  id: string
  type: 'construction_sequence' | 'safety_simulation' | 'resource_simulation'
  input: Record<string, unknown>
  output: Record<string, unknown>
  riskScore?: number
  recommendations: string[]
  runAt: string
  durationMs: number
}

// Per-project site state store
const SITE_STATES: Map<string, SiteState> = new Map()
const IOT_BUFFER_MAX = 500

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = (req.query.projectId as string) || (req.body?.projectId as string) || 'default'

  if (req.method === 'GET') {
    const state = SITE_STATES.get(projectId)
    if (!state) {
      return res.status(200).json(createInitialState(projectId))
    }
    return res.status(200).json(state)
  }

  if (req.method === 'POST' && req.query.action === 'simulate') {
    return handleSimulation(req, res, projectId)
  }

  if (req.method === 'POST') {
    return handleStateUpdate(req, res, projectId)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ─── State Update (IoT stream processing) ────────────────────────────────────

async function handleStateUpdate(req: NextApiRequest, res: NextApiResponse, projectId: string) {
  const {
    elements = [],
    iotEvents = [],
  }: {
    elements?: Partial<SiteElement>[]
    iotEvents?: IoTEvent[]
  } = req.body

  let state = SITE_STATES.get(projectId) ?? createInitialState(projectId)

  // Update elements
  for (const el of elements) {
    if (!el.id) continue
    const existing = state.elements[el.id]
    state.elements[el.id] = {
      ...existing,
      ...el,
      id: el.id,
      lastUpdated: new Date().toISOString(),
    } as SiteElement
  }

  // Process IoT events
  const newAlerts: string[] = []
  for (const event of iotEvents) {
    state.iotEvents.unshift({ ...event, timestamp: event.timestamp ?? new Date().toISOString() })
    if (event.alert && event.alertMessage) {
      newAlerts.push(event.alertMessage)
    }
    // Update linked element status
    if (event.elementId && state.elements[event.elementId]) {
      if (event.alert) state.elements[event.elementId].status = 'alert'
      if (event.type === 'progress' && event.value != null) {
        state.elements[event.elementId].progress = Math.min(100, Math.max(0, event.value))
      }
    }
  }

  // Trim IoT buffer
  state.iotEvents = state.iotEvents.slice(0, IOT_BUFFER_MAX)

  // Recalculate aggregate metrics
  state.lastSync = new Date().toISOString()
  state.activeAlerts = Array.from(new Set([...state.activeAlerts, ...newAlerts])).slice(0, 20)
  state.overallProgress = computeProgress(state)
  state.resourceUtilization = computeUtilization(state)

  SITE_STATES.set(projectId, state)

  return res.status(200).json({
    projectId,
    updated: elements.length,
    iotEventsProcessed: iotEvents.length,
    alerts: newAlerts.length,
    overallProgress: state.overallProgress,
    lastSync: state.lastSync,
  })
}

// ─── Simulation Engine ────────────────────────────────────────────────────────

async function handleSimulation(req: NextApiRequest, res: NextApiResponse, projectId: string) {
  const { type, params } = req.body as {
    type: SimulationResult['type']
    params: Record<string, unknown>
  }

  if (!type) return res.status(400).json({ error: 'type é obrigatório' })

  const start = Date.now()
  let output: Record<string, unknown>
  let riskScore: number
  let recommendations: string[]

  if (type === 'construction_sequence') {
    ;({ output, riskScore, recommendations } = simConstructionSequence(params))
  } else if (type === 'safety_simulation') {
    ;({ output, riskScore, recommendations } = simSafety(params))
  } else if (type === 'resource_simulation') {
    ;({ output, riskScore, recommendations } = simResource(params))
  } else {
    return res.status(400).json({ error: `Tipo de simulação inválido: ${type}` })
  }

  const result: SimulationResult = {
    id: `sim_${Date.now()}`,
    type,
    input: params,
    output,
    riskScore,
    recommendations,
    runAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  }

  const state = SITE_STATES.get(projectId) ?? createInitialState(projectId)
  state.simulationResults.unshift(result)
  state.simulationResults = state.simulationResults.slice(0, 20)
  SITE_STATES.set(projectId, state)

  return res.status(200).json(result)
}

// ─── Simulation Algorithms ────────────────────────────────────────────────────

function simConstructionSequence(params: Record<string, unknown>) {
  const tasks = (params.tasks as string[]) ?? []
  const daysPerTask = (params.days_per_task as number) ?? 5
  const parallelism = (params.parallelism as number) ?? 2

  const sequenced = tasks.map((t, i) => ({
    task: t,
    startDay: Math.floor(i / parallelism) * daysPerTask,
    endDay: (Math.floor(i / parallelism) + 1) * daysPerTask,
    criticalPath: i % parallelism === 0,
  }))

  const totalDays = sequenced.length > 0 ? Math.max(...sequenced.map(s => s.endDay)) : 0
  const criticalCount = sequenced.filter(s => s.criticalPath).length

  return {
    output: { sequence: sequenced, totalDays, criticalPathLength: criticalCount },
    riskScore: criticalCount > tasks.length * 0.5 ? 0.7 : 0.3,
    recommendations: [
      `Sequência otimizada para ${totalDays} dias`,
      criticalCount > 3 ? 'Alta dependência no caminho crítico — considerar buffer' : 'Caminho crítico aceitável',
      `Paralelismo de ${parallelism} tarefas simultâneas aplicado`,
    ],
  }
}

function simSafety(params: Record<string, unknown>) {
  const workers = (params.workers as number) ?? 10
  const height = (params.max_height_m as number) ?? 5
  const hasScaffolding = !!(params.scaffolding)
  const hasPPE = !!(params.ppe_compliant)

  const heightRisk = height > 10 ? 0.8 : height > 4 ? 0.5 : 0.2
  const ppeRisk = hasPPE ? 0 : 0.4
  const scaffoldRisk = height > 4 && !hasScaffolding ? 0.6 : 0
  const riskScore = Math.min(1, (heightRisk + ppeRisk + scaffoldRisk) / 3)

  const violations: string[] = []
  if (!hasPPE) violations.push('NR-06: EPIs obrigatórios não conformes')
  if (height > 4 && !hasScaffolding) violations.push('NR-18: Andaime obrigatório acima de 4m')
  if (height > 10) violations.push('NR-35: Trabalho em altura — treinamento específico exigido')

  return {
    output: { workers, maxHeight: height, violations, riskLevel: riskScore > 0.6 ? 'Alto' : riskScore > 0.3 ? 'Médio' : 'Baixo' },
    riskScore,
    recommendations: violations.length
      ? violations
      : ['Condições de segurança dentro dos parâmetros NR-18 e ISO 45001'],
  }
}

function simResource(params: Record<string, unknown>) {
  const budget = (params.budget_brl as number) ?? 100000
  const duration = (params.duration_days as number) ?? 30
  const workers = (params.workers as number) ?? 5

  const dailyLaborCost = workers * 250  // R$ 250/dia por trabalhador
  const totalLabor = dailyLaborCost * duration
  const materialBudget = budget * 0.6
  const remainingBudget = budget - totalLabor

  const utilization = Math.min(1, (totalLabor / budget))
  const riskScore = remainingBudget < 0 ? 0.9 : remainingBudget < budget * 0.1 ? 0.6 : 0.2

  return {
    output: {
      totalLaborCost: totalLabor,
      materialBudget,
      remainingBudget,
      dailyCost: dailyLaborCost,
      utilizationRate: utilization,
      projectedCompletion: new Date(Date.now() + duration * 86400000).toISOString().split('T')[0],
    },
    riskScore,
    recommendations: [
      remainingBudget < 0
        ? `ALERTA: Estouro de orçamento projetado de R$ ${Math.abs(remainingBudget).toLocaleString('pt-BR')}`
        : `Orçamento de mão de obra controlado (${(utilization * 100).toFixed(0)}% do total)`,
      `Custo diário: R$ ${dailyLaborCost.toLocaleString('pt-BR')}`,
      `Orçamento de materiais disponível: R$ ${materialBudget.toLocaleString('pt-BR')}`,
    ],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createInitialState(projectId: string): SiteState {
  return {
    projectId,
    elements: {},
    iotEvents: [],
    lastSync: new Date().toISOString(),
    overallProgress: 0,
    activeAlerts: [],
    resourceUtilization: { workers: 0, equipment: 0, materials: 0 },
    simulationResults: [],
  }
}

function computeProgress(state: SiteState): number {
  const structural = Object.values(state.elements).filter(e => e.type === 'structure')
  if (!structural.length) return 0
  return structural.reduce((s, e) => s + (e.progress ?? 0), 0) / structural.length
}

function computeUtilization(state: SiteState): SiteState['resourceUtilization'] {
  const elements = Object.values(state.elements)
  const active = (type: SiteElement['type']) =>
    elements.filter(e => e.type === type && e.status === 'active').length
  const total = (type: SiteElement['type']) =>
    elements.filter(e => e.type === type).length

  const safeDiv = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0

  return {
    workers: safeDiv(active('worker'), total('worker')),
    equipment: safeDiv(active('equipment'), total('equipment')),
    materials: safeDiv(elements.filter(e => e.type === 'material' && (e.progress ?? 0) > 0).length, total('material')),
  }
}
