'use client'
import { useState } from 'react'

const HELP_ITEMS = [
  { icon: '🏗️', label: 'BIM Ops', desc: 'Coordenação, clash, quantitativos, viabilidade', href: '/bim-ops' },
  { icon: '⚖️', label: 'Jurídico', desc: 'Contratos PT-BR e EN-US com IA', href: '/juridico' },
  { icon: '💰', label: 'Orçamento', desc: 'Estimativas e curva S', href: '/orcamento' },
  { icon: '📊', label: 'Investimentos', desc: 'ROI, TIR, ESG', href: '/investimentos' },
  { icon: '🎨', label: 'ArchVis Pro', desc: 'Renderização e visualização 3D', href: '/archvis' },
  { icon: '🎬', label: 'Director Cut', desc: 'Apresentações executivas', href: '/director-cut' },
  { icon: '🌎', label: 'US Brand', desc: 'Estratégia para mercado americano', href: '/us-brand' },
  { icon: '🗺️', label: 'Platform Map', desc: 'Visão geral da plataforma', href: '/platform' },
]

export default function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg,#185FA5,#0F4C81)',
          color: '#fff', fontSize: 20, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(24,95,165,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Ajuda"
      >
        ?
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, zIndex: 9998,
          background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 16, width: 300, border: '1px solid #e5e8f0',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F4C81', marginBottom: 12 }}>
            Atlas Construction Intelligence
          </div>
          {HELP_ITEMS.map(item => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0', borderBottom: '1px solid #f0f2f5',
                textDecoration: 'none',
              }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#8b93a7' }}>{item.desc}</div>
              </div>
            </a>
          ))}
          <div style={{ fontSize: 10, color: '#c0c7d0', marginTop: 10, textAlign: 'center' }}>
            Atlas Construction Intelligence LLC · Dallas, TX
          </div>
        </div>
      )}
    </>
  )
}
