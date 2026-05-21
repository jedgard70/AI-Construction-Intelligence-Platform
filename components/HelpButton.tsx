'use client'
import { useState, useRef, useEffect } from 'react'

const LINKS = [
  { icon: '🏗️', label: 'BIM Ops',        href: '/bim-ops' },
  { icon: '🌿', label: 'Plantas / Viewer', href: '/dashboard' },
  { icon: '⚖️', label: 'Jurídico',         href: '/juridico' },
  { icon: '💰', label: 'Orçamento',         href: '/orcamento' },
  { icon: '📊', label: 'Investimentos',     href: '/investimentos' },
  { icon: '🎨', label: 'ArchVis Pro',       href: '/archvis' },
  { icon: '🎬', label: 'Director Cut',      href: '/director-cut' },
  { icon: '🌎', label: 'US Brand',          href: '/us-brand' },
  { icon: '🗺️', label: 'Platform Map',      href: '/platform' },
]

const SYSTEM = `Você é o Atlas AI — assistente de inteligência artificial de propósito geral da plataforma Atlas Construction Intelligence, desenvolvida pela JEDGARD.

Você é um assistente completo e pode responder sobre QUALQUER assunto: tecnologia, ciência, negócios, direito, saúde, finanças, história, idiomas, programação, matemática, marketing, redação, criatividade e muito mais. Não existe tema fora do seu escopo.

Você também conhece profundamente a plataforma Atlas e seus módulos:
- Visualizador de Plantas e BIM (IFC, RVT, DWG, DXF, STL, OBJ, PDF, imagens)
- BIM Ops: clash detection, quantitativos CSI MasterFormat, BIM 4D/5D
- Jurídico: contratos de obras PT-BR e EN-US, Memorial Descritivo
- Orçamento: SINAPI, curva S, EVM (CPI, SPI, EAC)
- Investimentos: ROI, TIR, análise ESG
- ArchVis Pro: renderização arquitetônica e humanização de plantas
- Director Cut: apresentações executivas
- US Brand: estratégia para mercado americano
- Conformidade: NBR 9077, NBR 9050, NBR 15575, NR-18, NR-6

Diretrizes:
- Responda sempre em português do Brasil (a menos que o usuário escreva em outro idioma)
- Seja direto, útil e completo — nunca recuse ajudar por achar que o assunto está "fora do escopo"
- Para perguntas da plataforma, oriente com clareza sobre o módulo correto
- Para qualquer outro assunto, responda como um especialista generoso
- Use emojis com moderação para clareza visual`

interface Msg { role: 'user' | 'assistant'; text: string }

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'chat' | 'links'>('chat')
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: 'Olá! Sou o Atlas AI 👋\nSou um assistente de propósito geral — pergunte qualquer coisa: plataforma, negócios, tecnologia, direito, finanças, programação, ou qualquer outro assunto.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', text }]
    setMsgs(newMsgs)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM,
          messages: newMsgs.map(m => ({ role: m.role, content: m.text }))
        })
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.'
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', text: '⚠️ Erro de conexão. Verifique a API.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Atlas AI — Assistente"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
          width: 54, height: 54, borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg,#3B6D11,#2d5409)'
            : 'linear-gradient(135deg,#185FA5,#0F4C81)',
          color: '#fff', fontSize: 22,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(24,95,165,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
        }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 9999,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          border: '1px solid #e5e8f0',
          width: 440, height: 620,
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Segoe UI',system-ui,sans-serif",
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px', flexShrink: 0,
            background: 'linear-gradient(135deg,#185FA5,#0F4C81)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 22 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Atlas AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>
                Assistente IA de propósito geral · Plataforma · Qualquer assunto
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['chat', 'links'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: tab === t ? 'rgba(255,255,255,.25)' : 'transparent',
                    color: '#fff',
                  }}>
                  {t === 'chat' ? '💬 Chat' : '🔗 Links'}
                </button>
              ))}
            </div>
          </div>

          {/* Chat tab */}
          {tab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {m.role === 'assistant' && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF4FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                        🤖
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%', padding: '9px 13px', borderRadius: 12,
                      fontSize: 12, lineHeight: 1.65, whiteSpace: 'pre-wrap',
                      background: m.role === 'user' ? '#185FA5' : '#f4f6fb',
                      color: m.role === 'user' ? '#fff' : '#1a1f36',
                      borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                      borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF4FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      🤖
                    </div>
                    <div style={{ background: '#f4f6fb', borderRadius: '12px 12px 12px 2px',
                      padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%', background: '#185FA5',
                          animation: `bounce .9s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {msgs.length <= 1 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Como usar o Viewer de Plantas?',
                    'Explique ROI e TIR para um investimento',
                    'Como escrever um e-mail profissional?',
                    'O que é BIM e para que serve?',
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q); setTimeout(() => { setInput(''); send() }, 0); setInput(q) }}
                      style={{ padding: '5px 10px', border: '1px solid #e5e8f0', borderRadius: 20,
                        fontSize: 10, color: '#185FA5', background: '#EFF4FF',
                        cursor: 'pointer', fontFamily: 'inherit' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e8f0', flexShrink: 0,
                display: 'flex', gap: 8, alignItems: 'center', background: '#fafafa' }}>
                <input ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Pergunte qualquer coisa…"
                  disabled={loading}
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid #e5e8f0',
                    borderRadius: 10, fontSize: 12, outline: 'none',
                    fontFamily: 'inherit', background: '#fff', color: '#1a1f36' }} />
                <button onClick={send} disabled={!input.trim() || loading}
                  style={{ width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: input.trim() && !loading ? '#185FA5' : '#e5e8f0',
                    color: '#fff', fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  ➤
                </button>
              </div>
            </>
          )}

          {/* Links tab */}
          {tab === 'links' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8890a0', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 12 }}>Módulos da plataforma</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LINKS.map(item => (
                  <a key={item.href} href={item.href}
                    onClick={() => setOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 10, textDecoration: 'none', transition: 'background .12s',
                      background: '#f8f9fc', border: '1px solid #e5e8f0' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EFF4FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f8f9fc')}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f36' }}>{item.label}</div>
                    <span style={{ marginLeft: 'auto', fontSize: 14, color: '#b0b8cc' }}>→</span>
                  </a>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8f9fc',
                borderRadius: 10, border: '1px solid #e5e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>
                  💬 Tem dúvidas?
                </div>
                <div style={{ fontSize: 11, color: '#8890a0', lineHeight: 1.5 }}>
                  Clique em "Chat" e pergunte ao Atlas AI — responde sobre qualquer módulo, normas ABNT, BIM e construção civil.
                </div>
                <button onClick={() => setTab('chat')}
                  style={{ marginTop: 8, padding: '6px 14px', background: '#185FA5', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit' }}>
                  Abrir chat →
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: '#c0c7d0', textAlign: 'center' }}>
                Atlas Construction Intelligence LLC · Dallas, TX
              </div>
            </div>
          )}

          <style>{`
            @keyframes bounce {
              0%,80%,100%{transform:scale(0.6);opacity:.4}
              40%{transform:scale(1);opacity:1}
            }
          `}</style>
        </div>
      )}
    </>
  )
}
