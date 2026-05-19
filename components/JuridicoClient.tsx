'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'

interface Parte {
  nome: string; nacionalidade: string; estado_civil: string
  profissao: string; cpf: string; rg: string
  telefone: string; email: string; endereco: string
}
interface DadosObra {
  endereco: string; setor: string; quadra: string; lote: string
  inscricao: string; testada: string; area_terreno: string
  area_construir: string; tipo_obra: string; classificacao: string; descricao: string
}
interface DadosFinanceiros {
  valor_total: string; entrada: string; saldo: string
  parcelas: string; valor_parcela: string; dia_vencimento: string
}

const ENG = {
  nome: 'José Edgard de Oliveira', crea: '5071162007',
  cpf: '153.882.388-81', rg: '19.972.729-SP',
  estado_civil: 'divorciado', profissao: 'Engenheiro Civil',
  endereco: 'Rua Anna Martins Barbosa, 112, Jardim São Paulo, Promissão, SP',
}
const APEX = {
  nome: 'Apex Global Ltda', cnpj: '45.239.918/0001-26',
  representante: 'José Edgard de Oliveira', cargo: 'Sócio Administrador',
}
const PAGAMENTO = {
  banco: 'Sicredi', agencia: '3021', conta: '46702-2', pix: '45.239.918/0001-26',
}
const TIPOS_CONTRATO = [
  { id: 'administracao', label: 'Administração a Preço de Custo', icon: '📋', desc: 'Cliente compra materiais, contratado administra a obra' },
  { id: 'empreitada',   label: 'Empreitada Global',              icon: '🏗',  desc: 'Contratado fornece mão de obra e materiais' },
  { id: 'mao_de_obra',  label: 'Mão de Obra',                    icon: '🔨',  desc: 'Apenas execução, cliente fornece materiais' },
  { id: 'projetos',     label: 'Projetos e Laudos',              icon: '📐',  desc: 'Elaboração de projetos técnicos' },
]
const ESTADOS_CIVIS = ['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)', 'união estável']
const CLASSIFICACOES = ['Residencial Unifamiliar', 'Residencial Multifamiliar', 'Comercial', 'Industrial', 'Misto']

const s = {
  page:    { minHeight: '100vh', background: '#f4f5f7', fontFamily: "'Geist', sans-serif" },
  topbar:  { background: '#fff', borderBottom: '1px solid #e5e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
  body:    { padding: '20px 24px', maxWidth: 900, margin: '0 auto' },
  card:    { background: '#fff', border: '1px solid #e5e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: '#8b93a7', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 },
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  field:   { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label:   { fontSize: 11, fontWeight: 600, color: '#5a6282', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input:   { padding: '8px 10px', border: '1px solid #e5e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#1a1f36', background: '#f8f9fc', outline: 'none', width: '100%' },
  inputLocked: { padding: '8px 10px', border: '1px solid #e5e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#5a6282', background: '#f0f2f7', outline: 'none', width: '100%' },
  select:  { padding: '8px 10px', border: '1px solid #e5e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#1a1f36', background: '#f8f9fc', cursor: 'pointer', outline: 'none', width: '100%' },
  textarea: { padding: '8px 10px', border: '1px solid #e5e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#1a1f36', background: '#f8f9fc', outline: 'none', resize: 'vertical' as const, minHeight: 80, width: '100%' },
  btnPrimary:   { padding: '9px 20px', border: 'none', borderRadius: 8, background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 18px', border: '1px solid #e5e8f0', borderRadius: 8, background: '#fff', color: '#5a6282', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  step: (active: boolean, done: boolean) => ({
    flex: 1, padding: '8px 6px', borderRadius: 8, textAlign: 'center' as const,
    fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid',
    borderColor: done ? '#97C459' : active ? '#185FA5' : '#e5e8f0',
    background:  done ? '#EAF3DE' : active ? '#E6F1FB' : '#fff',
    color:       done ? '#3B6D11' : active ? '#185FA5' : '#8b93a7',
  }),
  autoBadge: { fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#EAF3DE', color: '#3B6D11', fontWeight: 600 as const, marginLeft: 6 },
  lockNote:  { fontSize: 12, color: '#5a6282', padding: '8px 12px', background: '#f0f2f7', borderRadius: 8, marginBottom: 12 },
  warnNote:  { fontSize: 12, padding: '10px 14px', background: '#FAEEDA', borderLeft: '3px solid #BA7517', borderRadius: '0 8px 8px 0', marginBottom: 12 },
  previewBox: { background: '#f8f9fc', borderLeft: '3px solid #185FA5', borderRadius: '0 8px 8px 0', padding: '14px 16px', fontSize: 12, lineHeight: 2.0, color: '#1a1f36', whiteSpace: 'pre-wrap' as const, fontFamily: 'monospace' },
  uploadZone: { border: '2px dashed #e5e8f0', borderRadius: 12, padding: '24px', textAlign: 'center' as const, cursor: 'pointer' },
  tagBox: { fontSize: 11, padding: '3px 8px', borderRadius: 10, background: '#f0f2f7', border: '1px solid #e5e8f0', color: '#5a6282' },
  modoCard: (ativo: boolean) => ({ flex: 1, padding: '16px', borderRadius: 10, cursor: 'pointer', border: ativo ? '2px solid #185FA5' : '1px solid #e5e8f0', background: ativo ? '#E6F1FB' : '#fff', transition: 'all 0.15s' }),
  tipoCard: (ativo: boolean) => ({ padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: ativo ? '2px solid #185FA5' : '1px solid #e5e8f0', background: ativo ? '#E6F1FB' : '#fff' }),
}

export default function JuridicoClient() {
  const router = useRouter()
  const [etapa, setEtapa]               = useState(1)
  const [tipoContrato, setTipoContrato] = useState('administracao')
  const [modoContratado, setModo]       = useState<'apex' | 'engenheiro'>('apex')
  const [analisando, setAnalisando]     = useState(false)
  const [analiseIA, setAnaliseIA]       = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [parte, setParte] = useState<Parte>({
    nome: '', nacionalidade: 'brasileiro(a)', estado_civil: 'casado(a)',
    profissao: '', cpf: '', rg: '', telefone: '', email: '', endereco: ''
  })
  const [obra, setObra] = useState<DadosObra>({
    endereco: '', setor: '', quadra: '', lote: '', inscricao: '',
    testada: '', area_terreno: '', area_construir: '',
    tipo_obra: 'CONSTRUÇÃO DE RESIDÊNCIA', classificacao: 'Residencial Unifamiliar', descricao: ''
  })
  const [financeiro, setFinanceiro] = useState<DadosFinanceiros>({
    valor_total: '', entrada: '', saldo: '', parcelas: '10',
    valor_parcela: '', dia_vencimento: '10'
  })

  function setPar(f: keyof Parte, v: string)            { setParte(p => ({ ...p, [f]: v })) }
  function setObr(f: keyof DadosObra, v: string)        { setObra(p  => ({ ...p, [f]: v })) }
  function setFin(f: keyof DadosFinanceiros, v: string) { setFinanceiro(p => ({ ...p, [f]: v })) }

  const nomeContratado = modoContratado === 'apex'
    ? `${APEX.nome}, inscrita no CNPJ sob o n. ${APEX.cnpj}, neste ato representada por ${APEX.representante}, ${APEX.cargo}`
    : `${ENG.nome}, ${ENG.profissao}, CREA ${ENG.crea}, portador do RG nº ${ENG.rg} e CPF nº ${ENG.cpf}, residente e domiciliado na ${ENG.endereco}`

  // ─── Upload e leitura real via Claude Vision ─────────────
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadStatus('⏳ Analisando documento com IA...')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const isPDF     = file.type === 'application/pdf'
      const mediaType = isPDF ? 'application/pdf' : file.type as any
      const response  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: `Extraia os dados pessoais deste documento (RG, CPF ou comprovante de residência).
Responda SOMENTE com JSON válido neste formato exato, sem texto antes ou depois:
{"nome":"","cpf":"","rg":"","nacionalidade":"brasileiro(a)","estado_civil":"","profissao":"","endereco":"","cep":"","cidade":"","estado":""}
Se algum campo não estiver visível, deixe como string vazia.` }
            ]
          }]
        })
      })
      const data      = await response.json()
      const text      = data.content?.[0]?.text || ''
      const clean     = text.replace(/```json|```/g, '').trim()
      const extracted = JSON.parse(clean)
      setParte(prev => ({
        ...prev,
        nome:          extracted.nome          || prev.nome,
        cpf:           extracted.cpf           || prev.cpf,
        rg:            extracted.rg            || prev.rg,
        nacionalidade: extracted.nacionalidade || prev.nacionalidade,
        estado_civil:  extracted.estado_civil  || prev.estado_civil,
        profissao:     extracted.profissao     || prev.profissao,
        endereco:      [extracted.endereco, extracted.cidade, extracted.estado, extracted.cep].filter(Boolean).join(', ') || prev.endereco,
      }))
      setUploadStatus('✅ Dados extraídos com sucesso!')
    } catch (err) {
      console.error('Erro OCR:', err)
      setUploadStatus('❌ Erro ao ler documento. Preencha manualmente.')
    }
    setTimeout(() => setUploadStatus(''), 4000)
  }, [])

  // ─── Análise jurídica via Claude ─────────────────────────
  const handleAnaliseIA = useCallback(async () => {
    setAnalisando(true); setAnaliseIA('')
    try {
      const prompt = `Você é advogado especialista em direito da construção civil no Brasil.
Analise este contrato de ${TIPOS_CONTRATO.find(t => t.id === tipoContrato)?.label}:
CONTRATANTE: ${parte.nome}, CPF ${parte.cpf}, ${parte.estado_civil}, ${parte.profissao}
CONTRATADO: ${modoContratado === 'apex' ? APEX.nome + ' CNPJ ' + APEX.cnpj : ENG.nome + ' CREA ' + ENG.crea}
OBJETO: ${obra.classificacao} — ${obra.area_construir}m² em ${obra.endereco}
VALORES: Total ${financeiro.valor_total}, Entrada ${financeiro.entrada}, ${financeiro.parcelas} parcelas de ${financeiro.valor_parcela}
Aponte: 1) Pontos positivos 2) Riscos e cláusulas de atenção 3) Sugestões de melhoria 4) Conformidade com Art. 618 do Código Civil. Use linguagem acessível.`
      const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], agent: 'juridico' }) })
      const data = await res.json()
      setAnaliseIA(data.response || data.content?.[0]?.text || 'Análise concluída.')
    } catch { setAnaliseIA('Erro ao conectar ao agente jurídico.') }
    setAnalisando(false)
  }, [tipoContrato, parte, obra, financeiro, modoContratado])

  // ─── Gera texto do contrato (sem bloco de assinaturas) ───
  const gerarContrato = () => {
    const tipo  = TIPOS_CONTRATO.find(t => t.id === tipoContrato)
    const linha = '─'.repeat(50)
    return `CONTRATO DE ${tipo?.label.toUpperCase()}
${linha}

1. DAS PARTES

1.1. CONTRATANTE:
     ${parte.nome || '[NOME DO CONTRATANTE]'}, ${parte.nacionalidade}, ${parte.estado_civil}, ${parte.profissao},
     CPF: ${parte.cpf || '[CPF]'}  |  RG: ${parte.rg || '[RG]'}
     Endereço: ${parte.endereco || '[ENDEREÇO]'}
     Tel: ${parte.telefone || '[TELEFONE]'}  |  E-mail: ${parte.email || '[E-MAIL]'}

1.2. CONTRATADO:
     ${nomeContratado}.
     Responsável técnico: ${ENG.nome} — CREA ${ENG.crea}

${linha}
2. DO IMÓVEL

     Tipo / Classificação: ${obra.tipo_obra} — ${obra.classificacao}
     Endereço: ${obra.endereco || '[ENDEREÇO DA OBRA]'}
     Setor: ${obra.setor || '—'}  |  Quadra: ${obra.quadra || '—'}  |  Lote: ${obra.lote || '—'}
     Inscrição imobiliária: ${obra.inscricao || '—'}
     Testada: ${obra.testada || '—'} m  |  Área do terreno: ${obra.area_terreno || '—'} m²
     Área a construir: ${obra.area_construir || '—'} m²

${linha}
3. DO OBJETO

     ${obra.descricao || `Construção de ${obra.classificacao} conforme projeto e Memorial Descritivo anexo.`}

${linha}
4. DO PREÇO E FORMA DE PAGAMENTO

     Valor total:       ${financeiro.valor_total || '[VALOR TOTAL]'}
     Entrada:           ${financeiro.entrada || '[ENTRADA]'}
     Saldo devedor:     ${financeiro.saldo || '[SALDO]'} em ${financeiro.parcelas} parcelas de ${financeiro.valor_parcela || '[VALOR PARCELA]'}
     Vencimento:        Dia ${financeiro.dia_vencimento} de cada mês

     Pagamento via PIX ou transferência para:
     ${APEX.nome} — CNPJ ${APEX.cnpj}
     Banco ${PAGAMENTO.banco}  |  Agência ${PAGAMENTO.agencia}  |  C/C ${PAGAMENTO.conta}
     PIX: ${PAGAMENTO.pix}

${linha}
5. RESPONSABILIDADE TÉCNICA

     Responsável técnico: ${ENG.nome} — CREA ${ENG.crea}
     Art. 618 Código Civil: 5 (cinco) anos de responsabilidade por solidez e segurança.

${linha}
6. DO FORO

     Fica eleito o foro da Comarca de Promissão/SP.`
  }

  const etapas = ['Tipo', 'Contratado', 'Partes', 'Objeto', 'Valores', 'Revisão IA', 'Contrato']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div style={s.page}>

        {/* Topbar */}
        <div style={s.topbar} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b93a7', fontSize: 20 }}>←</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1f36' }}>⚖️ Módulo Jurídico</div>
              <div style={{ fontSize: 11, color: '#8b93a7' }}>Contratos · Memorial · Agente IA</div>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: modoContratado === 'apex' ? '#E6F1FB' : '#EAF3DE', color: modoContratado === 'apex' ? '#185FA5' : '#3B6D11' }}>
            {modoContratado === 'apex' ? `${APEX.nome} · CNPJ ${APEX.cnpj}` : `${ENG.nome} · Pessoa Física`}
          </div>
        </div>

        <div style={s.body}>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 20 }} className="no-print">
            {etapas.map((e, i) => (
              <div key={i} style={s.step(etapa === i + 1, etapa > i + 1)} onClick={() => etapa > i + 1 && setEtapa(i + 1)}>
                {etapa > i + 1 ? '✓ ' : ''}{i + 1}. {e}
              </div>
            ))}
          </div>

          {/* ─── ETAPA 1: Tipo ─────────────────────────────── */}
          {etapa === 1 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>📄 Tipo de contrato</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {TIPOS_CONTRATO.map(t => (
                    <div key={t.id} onClick={() => setTipoContrato(t.id)} style={s.tipoCard(tipoContrato === t.id)}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tipoContrato === t.id ? '#185FA5' : '#1a1f36' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#8b93a7', marginTop: 3 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={s.btnPrimary} onClick={() => setEtapa(2)}>Próximo →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 2: Quem é o CONTRATADO ─────────────── */}
          {etapa === 2 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏢 Quem assina como CONTRATADO?</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={s.modoCard(modoContratado === 'apex')} onClick={() => setModo('apex')}>
                    <div style={{ width: 80, height: 52, borderRadius: 8, marginBottom: 10, overflow: 'hidden', background: '#1a2a4a' }}>
                      <img src="/logo_apex_nova.jpeg" alt="Apex Global" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: any) => { e.target.style.display = 'none' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: modoContratado === 'apex' ? '#185FA5' : '#1a1f36' }}>Apex Global Ltda</div>
                    <div style={{ fontSize: 11, color: '#8b93a7', marginTop: 3 }}>CNPJ {APEX.cnpj}</div>
                    <div style={{ fontSize: 11, color: '#8b93a7' }}>Rep. por {APEX.representante}</div>
                    <div style={{ marginTop: 8, fontSize: 11, padding: '3px 8px', borderRadius: 10, display: 'inline-block', background: modoContratado === 'apex' ? '#E6F1FB' : '#f0f2f7', color: modoContratado === 'apex' ? '#185FA5' : '#8b93a7' }}>
                      Inclui logo no contrato
                    </div>
                  </div>
                  <div style={s.modoCard(modoContratado === 'engenheiro')} onClick={() => setModo('engenheiro')}>
                    <div style={{ width: 52, height: 52, borderRadius: 26, marginBottom: 10, background: modoContratado === 'engenheiro' ? '#3B6D11' : '#e5e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>JE</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: modoContratado === 'engenheiro' ? '#3B6D11' : '#1a1f36' }}>José Edgard de Oliveira</div>
                    <div style={{ fontSize: 11, color: '#8b93a7', marginTop: 3 }}>Engenheiro Civil · CREA {ENG.crea}</div>
                    <div style={{ fontSize: 11, color: '#8b93a7' }}>CPF {ENG.cpf}</div>
                    <div style={{ marginTop: 8, fontSize: 11, padding: '3px 8px', borderRadius: 10, display: 'inline-block', background: modoContratado === 'engenheiro' ? '#EAF3DE' : '#f0f2f7', color: modoContratado === 'engenheiro' ? '#3B6D11' : '#8b93a7' }}>
                      Pessoa física · sem logo
                    </div>
                  </div>
                </div>
                <div style={s.warnNote}>
                  💳 <strong>Pagamento sempre na conta da Apex Global Ltda</strong> — independente de quem assina.
                  Banco {PAGAMENTO.banco} | Ag. {PAGAMENTO.agencia} | C/C {PAGAMENTO.conta} | PIX {PAGAMENTO.pix}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(1)}>← Voltar</button>
                <button style={s.btnPrimary} onClick={() => setEtapa(3)}>Próximo: Partes →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 3: Partes ───────────────────────────── */}
          {etapa === 3 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>📸 Leitura automática de documentos <span style={s.autoBadge}>IA Claude Vision</span></div>
                <div style={s.uploadZone} onClick={() => fileRef.current?.click()}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1f36', marginBottom: 4 }}>
                    Clique para enviar RG, CPF ou comprovante de residência
                  </div>
                  <div style={{ fontSize: 12, color: '#8b93a7' }}>PDF, JPG, PNG aceitos · Claude lê e preenche os campos automaticamente</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    {['RG / CNH', 'CPF', 'Comprovante', 'Contrato Social'].map(t => <span key={t} style={s.tagBox}>{t}</span>)}
                  </div>
                  {uploadStatus && (
                    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600,
                      color: uploadStatus.startsWith('✅') ? '#3B6D11' : uploadStatus.startsWith('❌') ? '#A32D2D' : '#185FA5',
                      padding: '8px 14px', borderRadius: 8,
                      background: uploadStatus.startsWith('✅') ? '#EAF3DE' : uploadStatus.startsWith('❌') ? '#FCEBEB' : '#E6F1FB',
                    }}>{uploadStatus}</div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleUpload} />
              </div>

              <div style={s.card}>
                <div style={s.sectionTitle}>
                  👤 Contratante {parte.nome && <span style={s.autoBadge}>preenchido via IA</span>}
                </div>
                <div style={{ ...s.grid2, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Nome completo</label>
                    <input style={s.input} value={parte.nome} onChange={e => setPar('nome', e.target.value)} placeholder="Nome completo" /></div>
                  <div style={s.field}><label style={s.label}>Nacionalidade</label>
                    <input style={s.input} value={parte.nacionalidade} onChange={e => setPar('nacionalidade', e.target.value)} /></div>
                </div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Estado civil</label>
                    <select style={s.select} value={parte.estado_civil} onChange={e => setPar('estado_civil', e.target.value)}>
                      {ESTADOS_CIVIS.map(ec => <option key={ec}>{ec}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>Profissão</label>
                    <input style={s.input} value={parte.profissao} onChange={e => setPar('profissao', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>CPF</label>
                    <input style={s.input} value={parte.cpf} onChange={e => setPar('cpf', e.target.value)} placeholder="000.000.000-00" /></div>
                </div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>RG</label>
                    <input style={s.input} value={parte.rg} onChange={e => setPar('rg', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Telefone</label>
                    <input style={s.input} value={parte.telefone} onChange={e => setPar('telefone', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>E-mail</label>
                    <input style={s.input} value={parte.email} onChange={e => setPar('email', e.target.value)} /></div>
                </div>
                <div style={s.field}><label style={s.label}>Endereço completo</label>
                  <input style={s.input} value={parte.endereco} onChange={e => setPar('endereco', e.target.value)} /></div>
              </div>

              <div style={s.card}>
                <div style={s.sectionTitle}>{modoContratado === 'apex' ? '🏢 Contratado — Apex Global Ltda' : '👷 Contratado — José Edgard de Oliveira'}</div>
                <div style={s.lockNote}>🔒 Dados fixos — preenchidos automaticamente</div>
                {modoContratado === 'apex' ? (
                  <div style={s.grid2}>
                    <div style={s.field}><label style={s.label}>Razão social</label><input style={s.inputLocked} value={APEX.nome} readOnly /></div>
                    <div style={s.field}><label style={s.label}>CNPJ</label><input style={s.inputLocked} value={APEX.cnpj} readOnly /></div>
                    <div style={s.field}><label style={s.label}>Representante</label><input style={s.inputLocked} value={APEX.representante} readOnly /></div>
                    <div style={s.field}><label style={s.label}>Cargo</label><input style={s.inputLocked} value={APEX.cargo} readOnly /></div>
                  </div>
                ) : (
                  <div style={s.grid3}>
                    <div style={s.field}><label style={s.label}>Nome</label><input style={s.inputLocked} value={ENG.nome} readOnly /></div>
                    <div style={s.field}><label style={s.label}>CREA</label><input style={s.inputLocked} value={ENG.crea} readOnly /></div>
                    <div style={s.field}><label style={s.label}>CPF</label><input style={s.inputLocked} value={ENG.cpf} readOnly /></div>
                    <div style={s.field}><label style={s.label}>RG</label><input style={s.inputLocked} value={ENG.rg} readOnly /></div>
                    <div style={s.field}><label style={s.label}>Estado civil</label><input style={s.inputLocked} value={ENG.estado_civil} readOnly /></div>
                    <div style={s.field}><label style={s.label}>Profissão</label><input style={s.inputLocked} value={ENG.profissao} readOnly /></div>
                    <div style={{ gridColumn: '1/-1' }}><div style={s.field}><label style={s.label}>Endereço</label><input style={s.inputLocked} value={ENG.endereco} readOnly /></div></div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(2)}>← Voltar</button>
                <button style={s.btnPrimary} onClick={() => setEtapa(4)}>Próximo: Objeto →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 4: Objeto ───────────────────────────── */}
          {etapa === 4 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏠 Dados do imóvel e obra</div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Tipo de obra</label>
                    <input style={s.input} value={obra.tipo_obra} onChange={e => setObr('tipo_obra', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Classificação</label>
                    <select style={s.select} value={obra.classificacao} onChange={e => setObr('classificacao', e.target.value)}>
                      {CLASSIFICACOES.map(c => <option key={c}>{c}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>Área a construir (m²)</label>
                    <input style={s.input} value={obra.area_construir} onChange={e => setObr('area_construir', e.target.value)} /></div>
                </div>
                <div style={{ ...s.field, marginBottom: 12 }}><label style={s.label}>Endereço do imóvel</label>
                  <input style={s.input} value={obra.endereco} onChange={e => setObr('endereco', e.target.value)} placeholder="Rua, número, bairro" /></div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Setor</label><input style={s.input} value={obra.setor} onChange={e => setObr('setor', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Quadra</label><input style={s.input} value={obra.quadra} onChange={e => setObr('quadra', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Lote</label><input style={s.input} value={obra.lote} onChange={e => setObr('lote', e.target.value)} /></div>
                </div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Inscrição imobiliária</label><input style={s.input} value={obra.inscricao} onChange={e => setObr('inscricao', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Testada (m)</label><input style={s.input} value={obra.testada} onChange={e => setObr('testada', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Área terreno (m²)</label><input style={s.input} value={obra.area_terreno} onChange={e => setObr('area_terreno', e.target.value)} /></div>
                </div>
                <div style={s.field}><label style={s.label}>Escopo / descrição dos serviços</label>
                  <textarea style={s.textarea} value={obra.descricao} onChange={e => setObr('descricao', e.target.value)} placeholder="Descreva os serviços incluídos..." /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(3)}>← Voltar</button>
                <button style={s.btnPrimary} onClick={() => setEtapa(5)}>Próximo: Valores →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 5: Valores ──────────────────────────── */}
          {etapa === 5 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>💰 Valores e pagamento</div>
                <div style={{ ...s.grid3, marginBottom: 12 }}>
                  <div style={s.field}><label style={s.label}>Valor total</label><input style={s.input} value={financeiro.valor_total} onChange={e => setFin('valor_total', e.target.value)} placeholder="R$ 195.000,00" /></div>
                  <div style={s.field}><label style={s.label}>Entrada</label><input style={s.input} value={financeiro.entrada} onChange={e => setFin('entrada', e.target.value)} placeholder="R$ 145.000,00" /></div>
                  <div style={s.field}><label style={s.label}>Saldo devedor</label><input style={s.input} value={financeiro.saldo} onChange={e => setFin('saldo', e.target.value)} placeholder="R$ 50.000,00" /></div>
                </div>
                <div style={s.grid3}>
                  <div style={s.field}><label style={s.label}>Nº de parcelas</label><input style={s.input} value={financeiro.parcelas} onChange={e => setFin('parcelas', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>Valor da parcela</label><input style={s.input} value={financeiro.valor_parcela} onChange={e => setFin('valor_parcela', e.target.value)} placeholder="R$ 5.000,00" /></div>
                  <div style={s.field}><label style={s.label}>Dia do vencimento</label><input style={s.input} value={financeiro.dia_vencimento} onChange={e => setFin('dia_vencimento', e.target.value)} /></div>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏦 Conta para recebimento</div>
                <div style={s.warnNote}>💳 Pagamento sempre direcionado à <strong>Apex Global Ltda</strong></div>
                <div style={s.grid3}>
                  <div style={s.field}><label style={s.label}>Empresa</label><input style={s.inputLocked} value={APEX.nome} readOnly /></div>
                  <div style={s.field}><label style={s.label}>CNPJ</label><input style={s.inputLocked} value={APEX.cnpj} readOnly /></div>
                  <div style={s.field}><label style={s.label}>Banco</label><input style={s.inputLocked} value={PAGAMENTO.banco} readOnly /></div>
                  <div style={s.field}><label style={s.label}>Agência</label><input style={s.inputLocked} value={PAGAMENTO.agencia} readOnly /></div>
                  <div style={s.field}><label style={s.label}>Conta</label><input style={s.inputLocked} value={PAGAMENTO.conta} readOnly /></div>
                  <div style={s.field}><label style={s.label}>PIX (CNPJ)</label><input style={s.inputLocked} value={PAGAMENTO.pix} readOnly /></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(4)}>← Voltar</button>
                <button style={s.btnPrimary} onClick={() => setEtapa(6)}>Próximo: Revisão IA →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 6: Revisão IA ───────────────────────── */}
          {etapa === 6 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>🤖 Agente Jurídico IA</div>
                <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 16, lineHeight: 1.6 }}>
                  O agente analisa o contrato, verifica conformidade com o Código Civil, aponta riscos e sugere melhorias.
                </div>
                <button style={{ ...s.btnPrimary, width: '100%', padding: 12, fontSize: 14 }}
                  onClick={handleAnaliseIA} disabled={analisando}>
                  {analisando ? '⏳ Analisando contrato...' : '🔍 Analisar contrato com IA'}
                </button>
              </div>
              {analiseIA && (
                <div style={s.card}>
                  <div style={s.sectionTitle}>📋 Resultado da análise</div>
                  <div style={s.previewBox}>{analiseIA}</div>
                </div>
              )}
              <div style={s.card}>
                <div style={s.sectionTitle}>👁 Pré-visualização</div>
                <div style={s.previewBox}>{gerarContrato()}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(5)}>← Voltar</button>
                <button style={s.btnPrimary} onClick={() => setEtapa(7)}>Gerar contrato final →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 7: Contrato final ───────────────────── */}
          {etapa === 7 && (
            <>
              <div style={{ ...s.card, borderColor: '#97C459', background: '#f7fbf0' }} className="no-print">
                <div style={{ fontSize: 18, marginBottom: 4 }}>✅ Contrato pronto!</div>
                <div style={{ fontSize: 13, color: '#5a6282' }}>
                  Assinado por: <strong>{modoContratado === 'apex' ? APEX.nome : ENG.nome}</strong>
                  {modoContratado === 'apex' ? ` (CNPJ ${APEX.cnpj})` : ` (CREA ${ENG.crea})`}
                </div>
              </div>

              {/* Contrato para impressão */}
              <div style={{ ...s.card, padding: '24px 32px' }} className="print-card">

                {/* Cabeçalho com logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #e5e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {modoContratado === 'apex' && (
                      <img src="/logo_apex_nova.jpeg" alt="Apex Global"
                        style={{ height: 52, borderRadius: 6 }}
                        onError={(e: any) => e.target.style.display = 'none'} />
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1f36' }}>
                        {modoContratado === 'apex' ? APEX.nome : ENG.nome}
                      </div>
                      <div style={{ fontSize: 11, color: '#8b93a7' }}>
                        {modoContratado === 'apex' ? `CNPJ ${APEX.cnpj}` : `CREA ${ENG.crea} · CPF ${ENG.cpf}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f36' }}>CONTRATO COMPLETO</div>
                    <div style={{ fontSize: 11, color: '#8b93a7' }}>{TIPOS_CONTRATO.find(t => t.id === tipoContrato)?.label}</div>
                  </div>
                </div>

                {/* Corpo do contrato */}
                <div style={s.previewBox}>{gerarContrato()}</div>

                {/* ─── Bloco de assinaturas com grid HTML ─── */}
                <div style={{ marginTop: 32, fontFamily: 'monospace', fontSize: 12 }}>
                  <div style={{ marginBottom: 24, color: '#1a1f36' }}>
                    Promissão / SP, ________ / ________ / ____________
                  </div>

                  {/* Assinaturas principais */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
                    <div>
                      <div style={{ borderTop: '1.5px solid #1a1f36', paddingTop: 8, marginBottom: 6 }}></div>
                      <div style={{ fontWeight: 600, color: '#1a1f36', marginBottom: 3 }}>
                        {parte.nome || '[NOME DO CONTRATANTE]'}
                      </div>
                      <div style={{ color: '#5a6282' }}>CPF: {parte.cpf || '___________________'}</div>
                      {parte.rg && <div style={{ color: '#5a6282' }}>RG: {parte.rg}</div>}
                      <div style={{ fontWeight: 700, marginTop: 6, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em' }}>CONTRATANTE</div>
                    </div>
                    <div>
                      <div style={{ borderTop: '1.5px solid #1a1f36', paddingTop: 8, marginBottom: 6 }}></div>
                      <div style={{ fontWeight: 600, color: '#1a1f36', marginBottom: 3 }}>
                        {modoContratado === 'apex' ? APEX.nome : ENG.nome}
                      </div>
                      {modoContratado === 'apex' ? (
                        <>
                          <div style={{ color: '#5a6282' }}>CNPJ: {APEX.cnpj}</div>
                          <div style={{ color: '#5a6282' }}>Rep.: {APEX.representante}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ color: '#5a6282' }}>CPF: {ENG.cpf}</div>
                          <div style={{ color: '#5a6282' }}>CREA: {ENG.crea}</div>
                        </>
                      )}
                      <div style={{ fontWeight: 700, marginTop: 6, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em' }}>CONTRATADO</div>
                    </div>
                  </div>

                  {/* Testemunhas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                    <div>
                      <div style={{ borderTop: '1.5px solid #1a1f36', paddingTop: 8, marginBottom: 6 }}></div>
                      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', marginBottom: 6 }}>TESTEMUNHA 1</div>
                      <div style={{ color: '#5a6282' }}>Nome: _________________________</div>
                      <div style={{ color: '#5a6282', marginTop: 4 }}>RG: ___________________________</div>
                    </div>
                    <div>
                      <div style={{ borderTop: '1.5px solid #1a1f36', paddingTop: 8, marginBottom: 6 }}></div>
                      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', marginBottom: 6 }}>TESTEMUNHA 2</div>
                      <div style={{ color: '#5a6282' }}>Nome: _________________________</div>
                      <div style={{ color: '#5a6282', marginTop: 4 }}>RG: ___________________________</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }} className="no-print">
                <button style={s.btnSecondary} onClick={() => setEtapa(6)}>← Voltar</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btnSecondary}
                    onClick={() => {
                      const blob = new Blob([gerarContrato()], { type: 'text/plain;charset=utf-8' })
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                      a.download = `contrato_${parte.nome.replace(/ /g,'_') || 'novo'}.txt`; a.click()
                    }}>💾 Salvar .txt</button>
                  <button style={s.btnPrimary} onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
