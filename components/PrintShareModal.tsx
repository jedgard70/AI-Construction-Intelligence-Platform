'use client'
import { useState } from 'react'

export function printDocument(title: string, html: string, generatedBy = '') {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank', 'width=960,height=750')
  if (!w) return
  const now = new Date()
  const dateFmt = now.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
  const timeFmt = now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  const docId = 'ATLAS-' + Date.now().toString(36).toUpperCase()
  const by = generatedBy || 'Usuário do Sistema'

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1f36; font-size: 12px; line-height: 1.65; }

  /* ── LETTERHEAD ── */
  .lh-wrap { border-bottom: 3px solid #185FA5; padding: 18px 40px 14px; display: flex; align-items: center; justify-content: space-between; }
  .lh-logo { display: flex; align-items: center; gap: 12px; }
  .lh-icon { width: 42px; height: 42px; background: #185FA5; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .lh-icon svg { display: block; }
  .lh-name { font-size: 15px; font-weight: 700; color: #185FA5; letter-spacing: -.01em; }
  .lh-sub  { font-size: 10px; color: #8890a0; letter-spacing: .06em; margin-top: 1px; }
  .lh-meta { text-align: right; font-size: 10px; color: #8890a0; line-height: 1.8; }
  .lh-meta strong { color: #1a1f36; }

  /* ── DOC TITLE BAR ── */
  .doc-titlebar { background: #f0f4f8; border-bottom: 1px solid #d8e0ec; padding: 10px 40px; }
  .doc-titlebar h1 { font-size: 16px; font-weight: 700; color: #185FA5; margin: 0; }
  .doc-titlebar .doc-sub { font-size: 10px; color: #8890a0; margin-top: 2px; }

  /* ── BODY ── */
  .doc-body { padding: 24px 40px; max-width: 860px; margin: 0 auto; }
  h2 { font-size: 13px; font-weight: 700; color: #185FA5; border-bottom: 1px solid #e5e8f0; padding-bottom: 5px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: .06em; }
  h3 { font-size: 12px; font-weight: 700; color: #1a1f36; margin: 14px 0 6px; }
  p  { margin-bottom: 8px; }
  pre, .text-area { white-space: pre-wrap; background: #f8f9fc; border: 1px solid #e5e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; font-family: inherit; font-size: 12px; line-height: 1.65; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
  th, td { padding: 7px 10px; border: 1px solid #e5e8f0; text-align: left; font-size: 11px; }
  th { background: #f0f4f8; font-weight: 700; color: #5a6282; text-transform: uppercase; letter-spacing: .04em; }
  tr:nth-child(even) td { background: #fafbfd; }
  .meta { display: flex; gap: 16px; flex-wrap: wrap; background: #EFF4FF; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 11px; color: #185FA5; }
  .meta span::before { content: '▸ '; }
  .field { margin-bottom: 10px; }
  .field label { font-size: 10px; font-weight: 700; color: #8890a0; text-transform: uppercase; letter-spacing: .08em; display: block; margin-bottom: 3px; }
  .grid, .grid3 { display: grid; gap: 10px; margin-bottom: 14px; }
  .grid { grid-template-columns: 1fr 1fr; }
  .grid3 { grid-template-columns: 1fr 1fr 1fr; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-red { background: #FCEBEB; color: #A32D2D; }
  .badge-green { background: #EAF3DE; color: #3B6D11; }
  .badge-blue { background: #EFF4FF; color: #185FA5; }
  .progress { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
  .progress-bar { height: 100%; border-radius: 3px; }

  /* ── SIGNATURE BLOCK ── */
  .sig-section { margin-top: 40px; border-top: 2px solid #e5e8f0; padding-top: 24px; }
  .sig-title { font-size: 10px; font-weight: 700; color: #8890a0; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 18px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-box { }
  .sig-line { border-bottom: 1px solid #1a1f36; margin-bottom: 6px; height: 36px; }
  .sig-name { font-size: 11px; font-weight: 600; color: #1a1f36; }
  .sig-role { font-size: 10px; color: #8890a0; margin-top: 1px; }
  .sig-date { font-size: 10px; color: #8890a0; margin-top: 4px; }

  /* ── FOOTER ── */
  .doc-footer { margin-top: 32px; border-top: 1px solid #e5e8f0; padding: 10px 40px; display: flex; justify-content: space-between; font-size: 10px; color: #b0b8cc; }
  .doc-footer strong { color: #8890a0; }

  /* ── PRINT ── */
  @media print {
    @page { margin: 1.2cm 1.5cm; size: A4; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .lh-wrap { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc-titlebar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
</style>
</head><body>

<!-- LETTERHEAD -->
<div class="lh-wrap">
  <div class="lh-logo">
    <div class="lh-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/>
      </svg>
    </div>
    <div>
      <div class="lh-name">Atlas Construction Intelligence</div>
      <div class="lh-sub">PLATAFORMA DE INTELIGÊNCIA EM CONSTRUÇÃO CIVIL · v5.3</div>
    </div>
  </div>
  <div class="lh-meta">
    <div>Doc. Nº: <strong>${docId}</strong></div>
    <div>Data: <strong>${dateFmt}</strong></div>
    <div>Hora: <strong>${timeFmt}</strong></div>
  </div>
</div>

<!-- TITLE BAR -->
<div class="doc-titlebar">
  <h1>${title}</h1>
  <div class="doc-sub">Gerado por: <strong>${by}</strong> · ${dateFmt} às ${timeFmt}</div>
</div>

<!-- BODY -->
<div class="doc-body">
${html}

<!-- SIGNATURE -->
<div class="sig-section">
  <div class="sig-title">Autorizações e Assinaturas</div>
  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">${by}</div>
      <div class="sig-role">Gerado por / Responsável Técnico</div>
      <div class="sig-date">Data: ${dateFmt}</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">___________________________</div>
      <div class="sig-role">Aprovado por / Diretor Responsável</div>
      <div class="sig-date">Data: _____ / _____ / _________</div>
    </div>
  </div>
</div>
</div>

<!-- FOOTER -->
<div class="doc-footer">
  <span>Atlas Construction Intelligence · Plataforma de IA para Engenharia Civil</span>
  <span>Doc. <strong>${docId}</strong> · Gerado em ${dateFmt} ${timeFmt}</span>
</div>

<script>window.onload = () => window.print()</script>
</body></html>`)
  w.document.close()
}

interface Props {
  title: string
  onClose: () => void
  buildHtml: () => string
  buildText?: () => string
  defaultUser?: string
}

export default function PrintShareModal({ title, onClose, buildHtml, buildText, defaultUser = '' }: Props) {
  const [userName, setUserName] = useState(() => {
    if (defaultUser) return defaultUser
    try { return localStorage.getItem('atlas_user_name') || '' } catch { return '' }
  })

  function saveAndPrint() {
    try { localStorage.setItem('atlas_user_name', userName) } catch {}
    printDocument(title, buildHtml(), userName)
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
    try { localStorage.setItem('atlas_user_name', userName) } catch {}
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.7}
h1{color:#185FA5}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc}</style>
</head><body><h1>${title}</h1>${html}<p style="margin-top:32px;font-size:10px;color:#8890a0">Gerado por: ${userName || 'Usuário do Sistema'} · ${new Date().toLocaleString('pt-BR')}</p></body></html>`],
      { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const s = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 16, padding: 28, width: 460,
      boxShadow: '0 8px 40px rgba(0,0,0,0.22)' },
    title: { fontSize: 17, fontWeight: 700, color: '#0F4C81', marginBottom: 4, textAlign: 'center' as const },
    sub: { fontSize: 12, color: '#8b93a7', marginBottom: 20, textAlign: 'center' as const },
    label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#5a6282', marginBottom: 5, letterSpacing: '.04em' },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #e5e8f0', borderRadius: 8,
      fontSize: 13, fontFamily: 'inherit', color: '#1a1f36', background: '#f8f9fc',
      outline: 'none', marginBottom: 18, boxSizing: 'border-box' as const },
    btn: { display: 'block' as const, width: '100%', padding: '12px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8, border: 'none', fontFamily: 'inherit' },
    btnGhost: { padding: '10px', background: 'transparent', border: '1.5px solid #e2e8f0',
      borderRadius: 8, fontSize: 13, color: '#8b93a7', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>📄 {title}</div>
        <div style={s.sub}>Exportar documento com timbrado e assinatura</div>

        <label style={s.label}>GERADO POR (será impresso no documento)</label>
        <input
          style={s.input}
          placeholder="Nome do responsável / engenheiro"
          value={userName}
          onChange={e => setUserName(e.target.value)}
        />

        <button style={{ ...s.btn, background: '#185FA5', color: '#fff' }} onClick={saveAndPrint}>
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
