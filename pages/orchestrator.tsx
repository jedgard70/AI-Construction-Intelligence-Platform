// ============================================================
// AI Executive Orchestrator — Frontend Page
// pages/orchestrator.tsx
//
// Interface para geração e revisão de planos de execução.
// O usuário descreve uma intenção, recebe um plano com
// classificação de risco, e pode aprovar ou rejeitar cada step.
//
// IMPORTANTE: Nenhuma ação é executada automaticamente.
// ============================================================

import React, { useState } from 'react'
import Head from 'next/head'

// ─── Types (local — mirrors API response) ────────────────────
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface RiskClassification {
  level: RiskLevel
  score: number
  requires_approval: boolean
  blocked: boolean
  reason: string
  jurisdiction_flags: string[]
}

interface PlanStep {
  id: string
  action: string
  category: string
  target: string
  description: string
  estimated_impact: string
  risk: RiskClassification
  requires_approval: boolean
  order: number
}

interface Plan {
  id: string
  intent: string
  jurisdiction: string
  steps: PlanStep[]
  overall_risk: RiskLevel
  overall_score: number
  blocked_steps: PlanStep[]
  requires_human_approval: boolean
  status: string
  created_at: string
}

interface ApiResponse {
  plan: Plan
  risk_summary: {
    overall_risk: RiskLevel
    overall_score: number
    total_steps: number
    blocked_steps: number
    steps_requiring_approval: number
  }
  blocked_actions: string[]
  requires_human_approval: boolean
  status: string
  advisory: string
}

type StepApproval = 'pending' | 'approved' | 'rejected'

// ─── Risk Colors ─────────────────────────────────────────────
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  LOW:      { bg: '#F0FFF4', text: '#276749', border: '#9AE6B4' },
  MEDIUM:   { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  HIGH:     { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  CRITICAL: { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF' },
}

const RISK_EMOJI: Record<RiskLevel, string> = {
  LOW: '✅',
  MEDIUM: '🔶',
  HIGH: '⚠️',
  CRITICAL: '🚨',
}

const CATEGORY_EMOJI: Record<string, string> = {
  READ: '📖',
  WRITE: '✏️',
  DELETE: '🗑️',
  DEPLOY: '🚀',
  MIGRATE: '🔄',
  FINANCIAL: '💰',
  AUTH: '🔐',
  CONFIG: '⚙️',
}

// ─── Component ───────────────────────────────────────────────
export default function OrchestratorPage() {
  const [intent, setIntent] = useState('')
  const [jurisdiction, setJurisdiction] = useState<'BR' | 'PT' | 'US' | 'EU'>('BR')
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [approvals, setApprovals] = useState<Record<string, StepApproval>>({})

  async function handleGeneratePlan() {
    if (!intent.trim()) {
      setError('Descreva uma intenção antes de gerar o plano.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setApprovals({})

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, jurisdiction, environment, dry_run: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar plano')
        return
      }
      setResult(data as ApiResponse)
      // Initialize all steps as pending
      const initial: Record<string, StepApproval> = {}
      for (const step of data.plan.steps ?? []) {
        initial[step.id] = 'pending'
      }
      setApprovals(initial)
    } catch (err) {
      setError('Erro de rede ao conectar com o orquestrador.')
    } finally {
      setLoading(false)
    }
  }

  function setStepApproval(stepId: string, value: StepApproval) {
    setApprovals(prev => ({ ...prev, [stepId]: value }))
  }

  const allStepsReviewed = result
    ? result.plan.steps.every(s => approvals[s.id] !== 'pending')
    : false

  const allApproved = result
    ? result.plan.steps.every(s => approvals[s.id] === 'approved')
    : false

  const hasRejected = result
    ? result.plan.steps.some(s => approvals[s.id] === 'rejected')
    : false

  function getRiskColors(level: RiskLevel) {
    return RISK_COLORS[level] ?? RISK_COLORS.MEDIUM
  }

  return (
    <>
      <Head>
        <title>AI Executive Orchestrator | Platform</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#E2E8F0',
        padding: '32px 16px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>🧠</span>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#F8FAFC' }}>
                AI Executive Orchestrator
              </h1>
              <span style={{
                background: '#1D4ED8',
                color: '#BFDBFE',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: '0.05em',
              }}>FASE 1 · ADVISOR</span>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>
              Descreva uma intenção em linguagem natural. O sistema gera um plano com classificação
              de risco por step para aprovação humana. <strong style={{ color: '#CBD5E1' }}>Nenhuma ação é executada automaticamente.</strong>
            </p>
          </div>

          {/* Input Panel */}
          <div style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Intenção
            </label>
            <textarea
              value={intent}
              onChange={e => setIntent(e.target.value)}
              placeholder='Ex: "Criar novo projeto de construção em São Paulo" ou "Gerar relatório de clientes ativos"'
              rows={3}
              style={{
                width: '100%',
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#E2E8F0',
                fontSize: 15,
                padding: '12px 14px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Jurisdição</label>
                <select
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value as 'BR' | 'PT' | 'US' | 'EU')}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#E2E8F0',
                    fontSize: 14,
                    padding: '8px 10px',
                  }}
                >
                  <option value="BR">🇧🇷 Brasil (LGPD)</option>
                  <option value="PT">🇵🇹 Portugal (GDPR)</option>
                  <option value="US">🇺🇸 USA (SOC2)</option>
                  <option value="EU">🇪🇺 EU (GDPR)</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Ambiente</label>
                <select
                  value={environment}
                  onChange={e => setEnvironment(e.target.value as 'development' | 'staging' | 'production')}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#E2E8F0',
                    fontSize: 14,
                    padding: '8px 10px',
                  }}
                >
                  <option value="development">🔧 Development</option>
                  <option value="staging">🧪 Staging</option>
                  <option value="production">🚀 Production</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleGeneratePlan}
                  disabled={loading || !intent.trim()}
                  style={{
                    background: loading || !intent.trim() ? '#334155' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    color: loading || !intent.trim() ? '#64748B' : '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading || !intent.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {loading ? '⏳ Gerando...' : '⚡ Gerar Plano'}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#450A0A',
              border: '1px solid #991B1B',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24,
              color: '#FCA5A5',
              fontSize: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Advisory Banner */}
              <div style={{
                background: getRiskColors(result.plan.overall_risk).bg,
                border: `1px solid ${getRiskColors(result.plan.overall_risk).border}`,
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 20,
                color: getRiskColors(result.plan.overall_risk).text,
                fontSize: 14,
                fontWeight: 600,
              }}>
                {result.advisory}
              </div>

              {/* Risk Summary Cards */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Risco Global', value: `${RISK_EMOJI[result.risk_summary.overall_risk]} ${result.risk_summary.overall_risk}` },
                  { label: 'Score', value: `${result.risk_summary.overall_score}/100` },
                  { label: 'Total Steps', value: result.risk_summary.total_steps },
                  { label: 'Bloqueados', value: result.risk_summary.blocked_steps, alert: result.risk_summary.blocked_steps > 0 },
                  { label: 'Req. Aprovação', value: result.risk_summary.steps_requiring_approval },
                ].map((card, i) => (
                  <div key={i} style={{
                    flex: '1 1 120px',
                    background: card.alert ? '#450A0A' : '#1E293B',
                    border: `1px solid ${card.alert ? '#991B1B' : '#334155'}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: card.alert ? '#FCA5A5' : '#F8FAFC' }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Blocked Steps */}
              {result.plan.blocked_steps.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#FCA5A5', fontWeight: 600 }}>
                    ⛔ Ações Bloqueadas Permanentemente
                  </h3>
                  {result.plan.blocked_steps.map(step => (
                    <div key={step.id} style={{
                      background: '#1A0000',
                      border: '1px solid #7F1D1D',
                      borderRadius: 8,
                      padding: '14px 16px',
                      marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>⛔</span>
                        <code style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 700 }}>{step.action}</code>
                        <span style={{ fontSize: 11, color: '#991B1B', marginLeft: 'auto' }}>BLOQUEADO</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>{step.description}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{step.risk.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Plan Steps */}
              {result.plan.steps.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#CBD5E1', fontWeight: 600 }}>
                    📋 Plano de Execução — {result.plan.id}
                  </h3>
                  {result.plan.steps.map(step => {
                    const approval = approvals[step.id] ?? 'pending'
                    const riskColors = getRiskColors(step.risk.level)
                    return (
                      <div key={step.id} style={{
                        background: '#1E293B',
                        border: `1px solid ${approval === 'approved' ? '#166534' : approval === 'rejected' ? '#991B1B' : '#334155'}`,
                        borderRadius: 10,
                        padding: '16px',
                        marginBottom: 12,
                        transition: 'border-color 0.2s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          {/* Step Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[step.category] ?? '🔧'}</span>
                              <span style={{ fontWeight: 700, fontSize: 14, color: '#F8FAFC' }}>{step.action}</span>
                              <span style={{
                                background: riskColors.bg,
                                color: riskColors.text,
                                border: `1px solid ${riskColors.border}`,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '1px 7px',
                                borderRadius: 4,
                              }}>
                                {RISK_EMOJI[step.risk.level]} {step.risk.level}
                              </span>
                              <span style={{
                                background: '#1E3A5F',
                                color: '#93C5FD',
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}>{step.category}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>{step.description}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              <span style={{ color: '#475569' }}>🎯 Alvo:</span> <code style={{ color: '#7DD3FC' }}>{step.target}</code>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              <span style={{ color: '#475569' }}>💥 Impacto:</span> {step.estimated_impact}
                            </div>
                            {step.risk.jurisdiction_flags.length > 0 && (
                              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {step.risk.jurisdiction_flags.map(f => (
                                  <span key={f} style={{
                                    background: '#1C1917',
                                    color: '#A8A29E',
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    fontFamily: 'monospace',
                                  }}>{f}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Approval Buttons */}
                          {step.requires_approval && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
                              <button
                                onClick={() => setStepApproval(step.id, 'approved')}
                                style={{
                                  background: approval === 'approved' ? '#166534' : '#14532D',
                                  border: `1px solid ${approval === 'approved' ? '#22C55E' : '#166534'}`,
                                  borderRadius: 6,
                                  color: approval === 'approved' ? '#86EFAC' : '#4ADE80',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: '6px 14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >✓ Aprovar</button>
                              <button
                                onClick={() => setStepApproval(step.id, 'rejected')}
                                style={{
                                  background: approval === 'rejected' ? '#7F1D1D' : '#1C0000',
                                  border: `1px solid ${approval === 'rejected' ? '#EF4444' : '#7F1D1D'}`,
                                  borderRadius: 6,
                                  color: approval === 'rejected' ? '#FCA5A5' : '#F87171',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: '6px 14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >✕ Rejeitar</button>
                            </div>
                          )}
                          {!step.requires_approval && (
                            <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600, padding: '6px 0' }}>
                              ✅ Auto-aprovado
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Final Action */}
              {result.plan.steps.length > 0 && allStepsReviewed && (
                <div style={{
                  background: allApproved ? '#052E16' : '#1A0000',
                  border: `1px solid ${allApproved ? '#166534' : '#7F1D1D'}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: allApproved ? '#86EFAC' : '#FCA5A5', marginBottom: 4 }}>
                      {allApproved ? '✅ Todos os steps aprovados' : '✕ Plano com rejeições'}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      {allApproved
                        ? 'O plano está pronto para execução. Um executor autorizado deve prosseguir.'
                        : 'Revisão necessária. Alguns steps foram rejeitados.'}
                    </div>
                  </div>
                  {allApproved && (
                    <div style={{
                      background: '#166534',
                      color: '#86EFAC',
                      border: '1px solid #22C55E',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'default',
                    }}>
                      ⚡ Pronto para Execução
                    </div>
                  )}
                </div>
              )}

              {/* Plan ID footer */}
              <div style={{ marginTop: 16, fontSize: 11, color: '#334155', textAlign: 'right' }}>
                Plan ID: <code style={{ color: '#475569' }}>{result.plan.id}</code> ·
                Criado em: {new Date(result.plan.created_at).toLocaleString('pt-BR')} ·
                Jurisdição: {result.plan.jurisdiction}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
