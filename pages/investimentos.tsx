import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getSupabase } from '../lib/supabase'

interface Investment {
  id: string
  nome: string
  vgv: number
  roi: number
  tir: number
  noi: number
  cap_rate: number
  esg: number
  status: string
  fase: string
  pitch_gerado: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  'Análise': '#f0a500',
  'Em Andamento': '#3b82f6',
  'Concluído': '#22c55e',
  'Pausado': '#ef4444',
}

export default function Investimentos() {
  const [projetos, setProjetos] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Investment | null>(null)
  const [pitch, setPitch] = useState('')
  const [loadingPitch, setLoadingPitch] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [novo, setNovo] = useState({ nome: '', vgv: '', roi: '', tir: '', noi: '', cap_rate: '', esg: '', status: 'Análise', fase: 'Estudo de Viabilidade' })

  const loadProjetos = useCallback(async () => {
    setLoading(true)
    const sb = getSupabase()
    if (!sb) { setLoading(false); return }
    const { data } = await sb.from('investments').select('*').order('created_at', { ascending: false })
    if (data) setProjetos(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadProjetos() }, [loadProjetos])

  async function gerarPitch(proj: Investment) {
    setSelected(proj)
    setPitch('')
    setLoadingPitch(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gere um pitch de investimento profissional em português para o projeto "${proj.nome}". VGV: R$ ${proj.vgv.toLocaleString('pt-BR')}M, ROI: ${proj.roi}%, TIR: ${proj.tir}%, NOI: ${proj.noi}%, Cap Rate: ${proj.cap_rate}%, Score ESG: ${proj.esg}/100. Fase: ${proj.fase}. Seja conciso, convincente e profissional.`
        })
      })
      const json = await res.json()
      const pitchText = json.result || 'Erro ao gerar pitch.'
      setPitch(pitchText)
      const sb = getSupabase()
      if (sb) await sb.from('investments').update({ pitch_gerado: pitchText }).eq('id', proj.id)
    } catch {
      setPitch('Erro ao conectar com IA.')
    }
    setLoadingPitch(false)
  }

  async function salvarNovo() {
    if (!novo.nome) return
    setSaving(true)
    const sb = getSupabase()
    if (sb) {
      await sb.from('investments').insert({
        nome: novo.nome,
        vgv: parseFloat(novo.vgv) || 0,
        roi: parseFloat(novo.roi) || 0,
        tir: parseFloat(novo.tir) || 0,
        noi: parseFloat(novo.noi) || 0,
        cap_rate: parseFloat(novo.cap_rate) || 0,
        esg: parseInt(novo.esg) || 0,
        status: novo.status,
        fase: novo.fase,
      })
      await loadProjetos()
    }
    setShowAdd(false)
    setNovo({ nome: '', vgv: '', roi: '', tir: '', noi: '', cap_rate: '', esg: '', status: 'Análise', fase: 'Estudo de Viabilidade' })
    setSaving(false)
  }

  async function deletarProjeto(id: string) {
    if (!confirm('Excluir este investimento?')) return
    const sb = getSupabase()
    if (sb) {
      await sb.from('investments').delete().eq('id', id)
      await loadProjetos()
      if (selected?.id === id) setSelected(null)
    }
  }

  return (
    <>
      <Head><title>Investimentos | AI Construction</title></Head>
      <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#e8ecf5', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/dashboard" style={{ color: '#6b7a99', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#f0a500' }}>📈 Investimentos</h1>
              <p style={{ margin: '4px 0 0', color: '#6b7a99', fontSize: 14 }}>Análise e Pitch de Projetos com IA</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: '#f0a500', color: '#0a0d12', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Novo Investimento
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 80, color: '#6b7a99' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p>Carregando investimentos...</p>
          </div>
        )}

        {!loading && projetos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: '#6b7a99' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <p style={{ fontSize: 18, marginBottom: 8 }}>Nenhum investimento cadastrado</p>
            <p style={{ fontSize: 14 }}>Clique em "+ Novo Investimento" para começar</p>
          </div>
        )}

        {!loading && projetos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left: project list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projetos.map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background: selected?.id === p.id ? '#1a1f2e' : '#0f1117', border: `1px solid ${selected?.id === p.id ? '#f0a500' : '#1e2330'}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e8ecf5' }}>{p.nome}</h3>
                      <p style={{ margin: '4px 0 0', color: '#6b7a99', fontSize: 13 }}>{p.fase}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: STATUS_COLORS[p.status] || '#6b7a99', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{p.status}</span>
                      <button onClick={e => { e.stopPropagation(); deletarProjeto(p.id) }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'VGV', value: `R$ ${p.vgv}M` },
                      { label: 'ROI', value: `${p.roi}%` },
                      { label: 'TIR', value: `${p.tir}%` },
                      { label: 'NOI', value: `${p.noi}%` },
                      { label: 'Cap Rate', value: `${p.cap_rate}%` },
                      { label: 'ESG', value: `${p.esg}/100` },
                    ].map(m => (
                      <div key={m.label} style={{ background: '#161b27', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ color: '#f0a500', fontSize: 15, fontWeight: 700 }}>{m.value}</div>
                        <div style={{ color: '#6b7a99', fontSize: 11, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: pitch panel */}
            <div style={{ background: '#0f1117', border: '1px solid #1e2330', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 24 }}>
              {!selected ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#6b7a99' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                  <p>Selecione um projeto para gerar pitch com IA</p>
                </div>
              ) : (
                <>
                  <h2 style={{ margin: '0 0 4px', color: '#f0a500', fontSize: 20 }}>{selected.nome}</h2>
                  <p style={{ margin: '0 0 20px', color: '#6b7a99', fontSize: 13 }}>{selected.fase} • {selected.status}</p>
                  <button onClick={() => gerarPitch(selected)} disabled={loadingPitch}
                    style={{ background: loadingPitch ? '#2a3040' : '#f0a500', color: loadingPitch ? '#6b7a99' : '#0a0d12', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, cursor: loadingPitch ? 'not-allowed' : 'pointer', width: '100%', fontSize: 15, marginBottom: 20 }}>
                    {loadingPitch ? '⏳ Gerando pitch...' : '🤖 Gerar Pitch com IA'}
                  </button>
                  {pitch && (
                    <div style={{ background: '#161b27', border: '1px solid #f0a500', borderRadius: 10, padding: 20 }}>
                      <h4 style={{ margin: '0 0 12px', color: '#f0a500', fontSize: 14 }}>📄 Pitch Gerado</h4>
                      <p style={{ margin: 0, color: '#e8ecf5', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pitch}</p>
                    </div>
                  )}
                  {!pitch && selected.pitch_gerado && (
                    <div style={{ background: '#161b27', border: '1px solid #2a3040', borderRadius: 10, padding: 20 }}>
                      <h4 style={{ margin: '0 0 12px', color: '#6b7a99', fontSize: 14 }}>📄 Último Pitch</h4>
                      <p style={{ margin: 0, color: '#c8d0e0', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.pitch_gerado}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Add modal */}
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0f1117', border: '1px solid #f0a500', borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw' }}>
              <h3 style={{ margin: '0 0 24px', color: '#f0a500' }}>Novo Investimento</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Nome do Projeto', key: 'nome', full: true, type: 'text' },
                  { label: 'VGV (R$ M)', key: 'vgv', type: 'number' },
                  { label: 'ROI (%)', key: 'roi', type: 'number' },
                  { label: 'TIR (%)', key: 'tir', type: 'number' },
                  { label: 'NOI (%)', key: 'noi', type: 'number' },
                  { label: 'Cap Rate (%)', key: 'cap_rate', type: 'number' },
                  { label: 'Score ESG', key: 'esg', type: 'number' },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                    <label style={{ display: 'block', color: '#6b7a99', fontSize: 12, marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} value={(novo as Record<string, string>)[f.key]} onChange={e => setNovo(n => ({ ...n, [f.key]: e.target.value }))}
                      style={{ width: '100%', background: '#161b27', border: '1px solid #2a3040', borderRadius: 8, padding: '10px 14px', color: '#e8ecf5', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a3040', borderRadius: 8, padding: '12px', color: '#6b7a99', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={salvarNovo} disabled={saving} style={{ flex: 2, background: '#f0a500', border: 'none', borderRadius: 8, padding: '12px', color: '#0a0d12', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Salvar Investimento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
