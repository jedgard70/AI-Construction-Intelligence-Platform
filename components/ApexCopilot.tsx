import { useRouter } from 'next/router'
import { useState } from 'react'

type Mode = 'manual' | 'supervisor' | 'status'
type Msg = { role: 'user' | 'assistant'; text: string }

const MODE_LABEL: Record<Mode, string> = {
  manual: 'Manual',
  supervisor: 'Supervisor',
  status: 'Status',
}

const SYSTEM = `Voce e o Apex AI Copilot da AI Construction Intelligence Platform.
Funcoes:
- Manual: orientar uso da plataforma, modulos, fluxo Nova Analise, Workspace e Mission Control.
- Supervisor: revisar o que o usuario pretende fazer e apontar riscos antes de executar.
- Status: explicar estado atual do Pacote Master 001, sem inventar metricas.
Responda em portugues do Brasil, direto, com foco operacional.`

export default function ApexCopilot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Apex AI Copilot pronto. Posso orientar uso da plataforma, supervisionar uma acao ou resumir o status do Master 001.',
    },
  ])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return

    setInput('')
    const nextMessages: Msg[] = [...messages, { role: 'user', text: question }]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 900,
          system: SYSTEM,
          messages: [
            {
              role: 'user',
              content: `Modo: ${MODE_LABEL[mode]}\nPagina atual: ${router.pathname}\nPergunta: ${question}`,
            },
          ],
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data?.content?.[0]?.text || 'Nao consegui obter resposta do Copilot.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erro ao chamar o Copilot. Verifique a API.' }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Status Master 001', text: 'Resuma o status atual do Pacote Master 001 e o proximo passo.' },
    { label: 'Como usar Nova Analise', text: 'Explique como usar a tela Nova Analise para criar um projeto automatico.' },
    { label: 'Abrir Mission Control', text: '' },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        title="Apex AI Copilot"
        style={{
          position: 'fixed',
          left: 18,
          bottom: 18,
          zIndex: 30000,
          border: 0,
          borderRadius: 999,
          background: open ? '#2f7d32' : '#0f4c81',
          color: '#fff',
          padding: '11px 15px',
          fontSize: 12,
          fontWeight: 900,
          boxShadow: '0 10px 28px rgba(0,0,0,.24)',
          cursor: 'pointer',
        }}
      >
        Apex AI
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          left: 18,
          bottom: 70,
          width: 'min(430px, calc(100vw - 28px))',
          height: 'min(610px, calc(100vh - 96px))',
          zIndex: 30001,
          background: '#fff',
          border: '1px solid #d8e0ee',
          borderRadius: 10,
          boxShadow: '0 18px 60px rgba(0,0,0,.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Geist', system-ui, sans-serif",
        }}>
          <div style={{ padding: '12px 14px', background: '#0f4c81', color: '#fff', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Apex AI Copilot</div>
              <div style={{ fontSize: 10, opacity: .78 }}>Manual · Supervisor · Status</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 0, background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>x</button>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: 10, borderBottom: '1px solid #e2e8f0' }}>
            {(['manual', 'supervisor', 'status'] as Mode[]).map(item => (
              <button
                key={item}
                onClick={() => setMode(item)}
                style={{
                  flex: 1,
                  border: '1px solid #d8e0ee',
                  borderRadius: 7,
                  background: mode === item ? '#edf3ff' : '#fff',
                  color: mode === item ? '#0f4c81' : '#667085',
                  padding: '7px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {MODE_LABEL[item]}
              </button>
            ))}
          </div>

          <div style={{ padding: 12, display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => action.text ? send(action.text) : router.push('/mission-control')}
                style={{ border: '1px solid #d8e0ee', background: '#f8fafc', color: '#0f4c81', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', background: message.role === 'user' ? '#0f4c81' : '#f3f6fb', color: message.role === 'user' ? '#fff' : '#172033', borderRadius: 10, padding: '8px 10px', fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {message.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: '#667085' }}>Apex analisando...</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') send() }}
              placeholder={`Perguntar no modo ${MODE_LABEL[mode]}`}
              style={{ flex: 1, border: '1px solid #cfd6e4', borderRadius: 8, padding: '9px 10px', fontSize: 12 }}
            />
            <button onClick={() => send()} disabled={loading} style={{ border: 0, borderRadius: 8, background: '#0f4c81', color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}>
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
