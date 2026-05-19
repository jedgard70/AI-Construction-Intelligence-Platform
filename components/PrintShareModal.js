import { useState } from 'react'

/**
 * Abre janela de impressão com HTML formatado.
 * @param {string} title  — título do documento
 * @param {string} html   — corpo HTML do relatório
 */
export function printDocument(title, html) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { window.print(); return }
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1f36; padding: 32px; }
  h1 { font-size: 18px; margin-bottom: 4px; color: #185FA5; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #8890a0; margin: 18px 0 8px; border-bottom: 1px solid #e5e8f0; padding-bottom: 4px; }
  .meta { font-size: 11px; color: #8890a0; margin-bottom: 18px; display: flex; gap: 20px; flex-wrap: wrap; }
  .meta span { display: flex; align-items: center; gap: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #5a6282; display: block; margin-bottom: 2px; }
  .field p { font-size: 12px; color: #1a1f36; min-height: 16px; }
  .text-area { background: #f8f9fc; border: 1px solid #e5e8f0; border-radius: 6px; padding: 8px 10px; font-size: 12px; line-height: 1.6; margin-bottom: 8px; white-space: pre-wrap; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .badge-red { background: #fcebeb; color: #A32D2D; }
  .badge-yellow { background: #fef3cd; color: #BA7517; }
  .badge-blue { background: #EFF4FF; color: #185FA5; }
  .badge-green { background: #EAF3DE; color: #3B6D11; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f8f9fc; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #5a6282; padding: 6px 10px; border: 1px solid #e5e8f0; text-align: left; }
  td { padding: 8px 10px; border: 1px solid #f0f0f0; font-size: 11px; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer { margin-top: 32px; border-top: 1px solid #e5e8f0; padding-top: 12px; font-size: 10px; color: #b0b8cc; display: flex; justify-content: space-between; }
  .progress { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .progress-bar { height: 100%; border-radius: 3px; }
  @media print {
    body { padding: 16px; }
    @page { margin: 1cm; }
  }
</style>
</head><body>
${html}
<div class="footer">
  <span>AI Construction Intelligence Platform v5.3</span>
  <span>Gerado em ${new Date().toLocaleString('pt-BR')}</span>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`)
  w.document.close()
}

/**
 * Modal de impressão e compartilhamento que aparece após salvar um relatório.
 *
 * Props:
 *  - title:      string   — ex: "RDO — 19/05/2026"
 *  - onClose:    function
 *  - buildHtml:  function → string    (HTML para impressão)
 *  - buildText:  function → string    (texto para WhatsApp / clipboard)
 */
export default function PrintShareModal({ title, onClose, buildHtml, buildText }) {
  const [copied, setCopied] = useState(false)

  function handlePrint() {
    const html = buildHtml()
    printDocument(title, html)
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`*${title}*\n\n${buildText()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleEmail() {
    const subject = encodeURIComponent(title)
    const body    = encodeURIComponent(buildText())
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${buildText()}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = `${title}\n\n${buildText()}`
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10002,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Geist',system-ui,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, width:420,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', border:'1px solid #e5e8f0', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #e5e8f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#1a1f36' }}>✅ Relatório salvo!</div>
              <div style={{ fontSize:12, color:'#8890a0', marginTop:2 }}>{title}</div>
            </div>
            <button onClick={onClose}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#8890a0', lineHeight:1 }}>✕</button>
          </div>
        </div>

        {/* Opções */}
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#8890a0', textTransform:'uppercase',
            letterSpacing:'.08em', marginBottom:2 }}>O que deseja fazer com este relatório?</div>

          {/* Imprimir / PDF */}
          <button onClick={handlePrint}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
              border:'1px solid #e5e8f0', borderRadius:10, background:'#fff',
              cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .12s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <div style={{ width:38, height:38, borderRadius:8, background:'#EFF4FF',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🖨️</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>Imprimir / Salvar PDF</div>
              <div style={{ fontSize:11, color:'#8890a0' }}>Abre o diálogo de impressão do navegador</div>
            </div>
          </button>

          {/* WhatsApp */}
          <button onClick={handleWhatsApp}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
              border:'1px solid #e5e8f0', borderRadius:10, background:'#fff',
              cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .12s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <div style={{ width:38, height:38, borderRadius:8, background:'#EAF3DE',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📲</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>Compartilhar via WhatsApp</div>
              <div style={{ fontSize:11, color:'#8890a0' }}>Abre o WhatsApp Web com o relatório</div>
            </div>
          </button>

          {/* E-mail */}
          <button onClick={handleEmail}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
              border:'1px solid #e5e8f0', borderRadius:10, background:'#fff',
              cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .12s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <div style={{ width:38, height:38, borderRadius:8, background:'#FFF5E6',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📧</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>Enviar por E-mail</div>
              <div style={{ fontSize:11, color:'#8890a0' }}>Abre seu cliente de e-mail padrão</div>
            </div>
          </button>

          {/* Copiar */}
          <button onClick={handleCopy}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
              border:'1px solid #e5e8f0', borderRadius:10, background:'#fff',
              cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .12s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <div style={{ width:38, height:38, borderRadius:8, background: copied ? '#EAF3DE' : '#f4f5f7',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
              transition:'background .2s' }}>{copied ? '✅' : '📋'}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1a1f36' }}>
                {copied ? 'Copiado!' : 'Copiar para área de transferência'}
              </div>
              <div style={{ fontSize:11, color:'#8890a0' }}>Cola em qualquer app (Word, Notion, etc.)</div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid #e5e8f0',
          display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', border:'1px solid #e5e8f0', borderRadius:8,
              background:'#fff', color:'#5a6282', fontSize:13, fontWeight:500,
              cursor:'pointer', fontFamily:'inherit' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
