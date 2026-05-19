import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `Você é o Manual_Assistant_AI da AI Construction Intelligence Platform v5.3.
Seu papel é ajudar usuários a usar a plataforma. Responda APENAS sobre funcionalidades da plataforma.
Seja direto, amigável e didático. Use português brasileiro.

MÓDULOS DA PLATAFORMA:
- Dashboard: visão geral adaptada por role com KPIs e alertas
- EVM: CPI, SPI, EAC, VAC, TCPI e Curva S por projeto
- Agentes IA: BIM Coordinator, Construction Planner, Cost Controller, Risk Analysis, Safety Monitor, Investment Analyst, Quality Control, Doc Intelligence
- RDO: registro diário de obra com equipe, clima e ocorrências
- Qualidade / NCIs: não conformidades com prazo e plano de ação
- Segurança: NR-06/10/18/33/35, EPIs e TFA
- BIM: upload IFC/RVT, clash detection, 6D e 7D
- Investimentos: ROI, TIR, NOI, Cap Rate, ESG Score
- Documentos: upload PDF/DWG, OCR e classificação automática
- SINAPI: preços unitários em tempo real

KPIs PRINCIPAIS:
- CPI = EV/AC (>1 abaixo do orçamento, <1 acima)
- SPI = EV/PV (>1 adiantado, <1 atrasado)
- EAC = BAC/CPI (projeção custo final)
- VAC = BAC-EAC (positivo=economia, negativo=estouro)
- ESG Score: 0-50 Insuficiente | 50-70 Adequado | 70-85 Bom | 85-100 Excelente

AGENTES — quando usar cada um:
- BIM Coordinator: interferências, modelos IFC/RVT, 6D/7D
- Construction Planner: cronograma, caminho crítico, atrasos
- Cost Controller: orçamento, EVM, desvios SINAPI
- Risk Analysis: riscos ativos, matriz, planos de resposta
- Safety Monitor: NRs, EPIs, ocorrências de segurança
- Investment Analyst: ROI, TIR, pitch para investidores
- Quality Control: NCIs, NBR 15575, retrabalho
- Doc Intelligence: análise de PDFs, contratos, laudos

Se a dúvida for técnica de engenharia, indique o agente especialista correto.
Termine sempre com: "Posso ajudar com mais alguma dúvida sobre a plataforma?"`

const FAQS = [
  'Como registrar um RDO?',
  'Como interpretar o CPI?',
  'Como abrir uma NCI?',
  'Qual agente usar para analisar cronograma?',
  'Como funciona o Doc Intelligence?',
  'O que é o ESG Score?',
]

export default function HelpButton() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Olá! Sou o assistente da plataforma. Como posso ajudar você hoje?' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage(text) {
    const question = text || input.trim()
    if (!question || loading) return
    setInput('')
    const userMsg = { role: 'user', content: question }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: newMessages.filter(m => m.role !== 'assistant' || m !== messages[0])
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar. Tente novamente.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Botão fixo */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ajuda — Manual da Plataforma"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 50, height: 50, borderRadius: '50%',
          background: open ? '#0C447C' : '#185FA5',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 22, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(24,95,165,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
        {open ? '✕' : '?'}
      </button>

      {/* Painel de ajuda */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, zIndex: 9998,
          width: 360, height: 520,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Geist', sans-serif",
          border: '1px solid #e5e8f0',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px', background: '#185FA5',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                Manual da Plataforma
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                ConstructAI v5.3 · Assistente de ajuda
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 10,
            background: '#f8f9fc',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 12px',
                  borderRadius: m.role === 'user'
                    ? '12px 4px 12px 12px'
                    : '4px 12px 12px 12px',
                  background: m.role === 'user' ? '#185FA5' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1a1f36',
                  fontSize: 12, lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid #e5e8f0' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '9px 14px', background: '#fff', borderRadius: '4px 12px 12px 12px',
                  border: '1px solid #e5e8f0', fontSize: 12, color: '#8b93a7',
                }}>
                  Buscando resposta...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* FAQs rápidas */}
          {messages.length <= 1 && (
            <div style={{
              padding: '8px 14px', background: '#fff',
              borderTop: '1px solid #e5e8f0', flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: '#8b93a7', marginBottom: 6, fontWeight: 500 }}>
                PERGUNTAS FREQUENTES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {FAQS.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{
                      fontSize: 10, padding: '4px 9px',
                      background: '#EFF4FF', color: '#185FA5',
                      border: '1px solid #B5D4F4', borderRadius: 20,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px', background: '#fff',
            borderTop: '1px solid #e5e8f0',
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Tire sua dúvida sobre a plataforma..."
              style={{
                flex: 1, padding: '8px 12px',
                border: '1px solid #e5e8f0', borderRadius: 8,
                fontSize: 12, fontFamily: 'inherit',
                background: '#f8f9fc', color: '#1a1f36',
                outline: 'none',
              }}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px', background: '#185FA5', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}