'use client'

export function printDocument(title: string, html: string) {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.7}
h1{color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:8px}
pre{white-space:pre-wrap;font-family:inherit}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{padding:8px 12px;border:1px solid #e5e8f0;text-align:left;font-size:12px}
th{background:#f0f4f8;font-weight:600}
.footer{margin-top:32px;border-top:1px solid #e5e8f0;padding-top:12px;font-size:10px;color:#8b93a7}
@media print{@page{margin:1.5cm}}</style>
</head><body>
<h1>${title}</h1>
${html}
<div class="footer">Atlas Construction Intelligence · ${new Date().toLocaleString('pt-BR')}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`)
  w.document.close()
}

interface Props {
  title: string
  onClose: () => void
  buildHtml: () => string
  buildText?: () => string
}

export default function PrintShareModal({ title, onClose, buildHtml, buildText }: Props) {
  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 16, padding: 28, width: 440,
      boxShadow: '0 8px 40px rgba(0,0,0,0.22)', textAlign: 'center' as const },
    title: { fontSize: 17, fontWeight: 700, color: '#0F4C81', marginBottom: 8 },
    sub: { fontSize: 12, color: '#8b93a7', marginBottom: 24 },
    btn: { display: 'block' as const, width: '100%', padding: '12px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 10, border: 'none' },
    btnGhost: { padding: '10px', background: 'transparent', border: '1.5px solid #e2e8f0',
      borderRadius: 8, fontSize: 13, color: '#8b93a7', cursor: 'pointer', width: '100%' },
  }

  function handlePrint() {
    printDocument(title, buildHtml())
    onClose()
  }

  function handleCopy() {
    const text = buildText ? buildText() : buildHtml().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    navigator.clipboard?.writeText(text).then(() => {
      alert('Copiado para a área de transferência!')
    }).catch(() => {})
  }

  function handleDownload() {
    const html = buildHtml()
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.7}
h1{color:#185FA5}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc}</style>
</head><body><h1>${title}</h1>${html}</body></html>`], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>📄 {title}</div>
        <div style={s.sub}>Escolha como deseja exportar este documento</div>

        <button style={{ ...s.btn, background: '#185FA5', color: '#fff' }} onClick={handlePrint}>
          🖨️ Imprimir / Salvar PDF
        </button>
        <button style={{ ...s.btn, background: '#3B6D11', color: '#fff' }} onClick={handleDownload}>
          ⬇️ Baixar como HTML
        </button>
        <button style={{ ...s.btn, background: '#BA7517', color: '#fff' }} onClick={handleCopy}>
          📋 Copiar Texto
        </button>
        <button style={s.btnGhost} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}
