'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
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

const US_CONSTRUCTION_TYPES = [
  { id: 'new_residential',    label: 'New Residential Construction' },
  { id: 'addition_remodel',   label: 'Addition / Remodel' },
  { id: 'commercial_tenant',  label: 'Commercial Tenant Improvement' },
  { id: 'new_commercial',     label: 'New Commercial Construction' },
  { id: 'custom_home',        label: 'Custom Home (Owner-Directed)' },
  { id: 'multi_family',       label: 'Multi-Family (Duplex / ADU / Apt)' },
]

const US_RESIDENTIAL_SYSTEMS = [
  'Wood Framing (Platform / Advanced)',
  'Cold-Formed Steel Framing',
  'Foundation: Slab-on-Grade (Post-Tension)',
  'Foundation: Slab-on-Grade (Conventional)',
  'Foundation: Crawl Space',
  'Foundation: Pier & Beam',
  'Foundation: Basement / Walk-out',
  'Drywall Systems (GWB / Cement Board)',
  'Roofing: Asphalt Shingles (Architectural)',
  'Roofing: Metal (Standing Seam)',
  'Roofing: Tile (Concrete / Clay)',
  'Roofing: Flat / TPO / EPDM',
  'HVAC: Forced Air (Split System)',
  'HVAC: Heat Pump (Air-Source)',
  'HVAC: Mini-Split (Ductless)',
  'HVAC: Geothermal',
  'Electrical: 200A Service & Panel',
  'Electrical: 400A Service (EV + HP)',
  'Electrical: Low-Voltage / Smart Home',
  'Plumbing: PEX Water Supply',
  'Plumbing: DWV (ABS / PVC)',
  'Plumbing: Tankless Water Heater',
  'Exterior: Windows & Exterior Doors',
  'Exterior: Stucco / EIFS Cladding',
  'Exterior: Fiber Cement Siding',
  'Interior: Insulation (Spray Foam / Batt)',
  'Interior: Tile & Stone Flooring',
  'Interior: Hardwood / Engineered Wood',
  'Permit: Building Permit Package',
]

const US_CONTRACT_TYPES = [
  { id: 'fixed_price',  label: 'Fixed-Price Contract',     icon: '📋', desc: 'Lump sum — contractor provides all labor & materials at a set price' },
  { id: 'cost_plus',    label: 'Cost-Plus Contract',        icon: '🏗',  desc: 'Owner pays actual costs + contractor fee/markup (similar to Adm. a Custo)' },
  { id: 'time_material',label: 'Time & Materials (T&M)',   icon: '🔨',  desc: 'Billed at hourly rates + material costs, used for undefined scope' },
  { id: 'design_build', label: 'Design-Build Agreement',   icon: '📐',  desc: 'Single entity responsible for design and construction' },
]
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const ATLAS_US = {
  company: 'Atlas Construction Intelligence LLC',
  ein: '88-1234567',
  license: 'Lic. #GC-20241188',
  state: 'TX',
  address: '5000 Quorum Drive, Suite 700, Dallas, TX 75254',
  rep: 'José Edgard de Oliveira, P.E.',
  pe_license: 'TX PE #12345',
}

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
  const [idioma, setIdioma]             = useState<'pt-BR' | 'en-US'>('pt-BR')
  const [tipoContrato, setTipoContrato] = useState('administracao')
  const [usTipoContrato, setUsTipo]     = useState('fixed_price')
  const [modoContratado, setModo]       = useState<'apex' | 'engenheiro'>('apex')
  const [analisando, setAnalisando]       = useState(false)
  const [usParty, setUsParty] = useState({
    name: '', company: '', ein: '', license: '', phone: '', email: '', address: '', city: '', state: 'TX', zip: '',
  })
  const [usProject, setUsProject] = useState({
    description: '', address: '', city: '', state: 'TX', zip: '', scope: '', startDate: '', endDate: '',
    constructionType: 'new_residential', systems: [] as string[],
  })
  const [usFinancial, setUsFinancial] = useState({
    contractValue: '', deposit: '', milestones: '3', paymentTerms: 'Net 30', retainage: '10',
  })
  const [analiseIA, setAnaliseIA]         = useState('')
  const [uploadStatus, setUploadStatus]   = useState('')
  const [memorial, setMemorial]           = useState('')
  const [gerandoMemorial, setGerandoMem]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const contractSavedRef = useRef(false)

  // Save contract metadata to localStorage when step 7 is reached
  useEffect(() => {
    if (etapa !== 7 || contractSavedRef.current) return
    contractSavedRef.current = true
    try {
      const projectId = (router.query.projectId as string) || null
      const meta = {
        id: crypto.randomUUID(),
        projectId,
        idioma,
        type: idioma === 'en-US' ? usTipoContrato : tipoContrato,
        party: idioma === 'en-US' ? (usParty.name || '') : parte.nome,
        state: idioma === 'en-US' ? (usProject.state || 'TX') : 'BR',
        value: idioma === 'en-US' ? usFinancial.contractValue : financeiro.valor_total,
        date: new Date().toISOString(),
        status: 'draft',
      }
      const existing = JSON.parse(localStorage.getItem('atlas_contracts') || '[]')
      localStorage.setItem('atlas_contracts', JSON.stringify([meta, ...existing].slice(0, 200)))
    } catch {}
  }, [etapa, idioma, usTipoContrato, tipoContrato, usParty.name, parte.nome,
      usProject.state, usFinancial.contractValue, financeiro.valor_total, router.query.projectId])

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
    if (fileRef.current) fileRef.current.value = ''
    setUploadStatus('⏳ Lendo documento com IA Claude Vision…')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Valida tipo de arquivo
      const isPDF     = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isImage   = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      if (!isPDF && !isImage) {
        setUploadStatus('❌ Formato não suportado. Envie PDF, JPG ou PNG.')
        setTimeout(() => setUploadStatus(''), 4000)
        return
      }
      const mediaType = isPDF ? 'application/pdf' : (file.type || 'image/jpeg')

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType, isPDF }),
      })

      const extracted = await response.json()

      if (!response.ok || extracted.error) {
        const msg = extracted.error || `Erro ${response.status}`
        // Exibe erro detalhado para facilitar diagnóstico
        setUploadStatus(`❌ ${msg.length > 80 ? msg.slice(0, 80) + '…' : msg} — Preencha manualmente.`)
        setTimeout(() => setUploadStatus(''), 7000)
        return
      }

      // Preenche apenas campos que vieram preenchidos
      const anyFilled = Object.values(extracted).some(v => v && String(v).trim())
      if (!anyFilled) {
        setUploadStatus('⚠️ Documento lido, mas nenhum dado pessoal encontrado. Preencha manualmente.')
        setTimeout(() => setUploadStatus(''), 5000)
        return
      }

      setParte(prev => ({
        ...prev,
        nome:          extracted.nome          || prev.nome,
        cpf:           extracted.cpf           || prev.cpf,
        rg:            extracted.rg            || prev.rg,
        nacionalidade: extracted.nacionalidade || prev.nacionalidade,
        estado_civil:  extracted.estado_civil  || prev.estado_civil,
        profissao:     extracted.profissao     || prev.profissao,
        endereco:      [extracted.endereco, extracted.cidade, extracted.estado, extracted.cep]
                         .filter(Boolean).join(', ') || prev.endereco,
      }))
      setUploadStatus('✅ Dados extraídos e preenchidos com sucesso!')
    } catch (err: any) {
      console.error('Erro OCR:', err)
      setUploadStatus(`❌ ${err?.message || 'Falha de conexão'}. Preencha manualmente.`)
    }
    setTimeout(() => setUploadStatus(''), 6000)
  }, [])

  // ─── Análise jurídica via Claude ─────────────────────────
  const handleAnaliseIA = useCallback(async () => {
    setAnalisando(true); setAnaliseIA('')
    const JURIDICO_SYSTEM = `Você é o Juridico_Intelligence_AI — advogado sênior especialista em direito da construção civil, contratos de engenharia e investimentos imobiliários.

JURISDIÇÕES E BASES LEGAIS QUE VOCÊ DOMINA:

🇧🇷 BRASIL:
• Código Civil (Lei 10.406/2002): Art. 618 (responsabilidade do empreiteiro), Art. 927 (responsabilidade civil), Arts. 421-480 (contratos)
• Lei 8.666/93 e Lei 14.133/2021 (licitações públicas)
• Lei 13.709/2018 — LGPD
• NR-18 (segurança em obras), PBQP-H, NBR 15575
• CPC/2015 (arbitragem e foro competente), Lei 9.307/96 (arbitragem)
• Código de Defesa do Consumidor (CDC) quando aplicável
• Código Tributário Nacional — retenções ISS, INSS, IRRF sobre contratos
• CLT — aspectos trabalhistas em empreitadas

🇪🇺 EUROPA:
• Diretiva 2014/24/UE — contratos públicos na União Europeia
• Regulamento (UE) 2016/679 — GDPR (proteção de dados em contratos)
• Diretiva 2011/7/UE — combate a atrasos de pagamento em transações comerciais
• EN 1337 / Eurocodes — normas técnicas de construção na UE
• Diretiva 2006/123/CE — serviços no mercado interno
🇵🇹 Portugal: Código Civil Português, DL 18/2008 (CCP — Código dos Contratos Públicos), RGEU
🇩🇪 Alemanha: BGB §§631-651 (Werkvertrag/contrato de empreitada), VOB/B (condições gerais para obras)
🇫🇷 França: Code Civil Art. 1787-1800 (contrat d'entreprise), Loi MOP (maîtrise d'ouvrage public)
🇪🇸 Espanha: Ley de Contratos del Sector Público, Ley de Ordenación de la Edificación (LOE)
🇮🇹 Itália: Codice Civile Art. 1655-1677 (appalto), D.Lgs. 50/2016 (Codice dei contratti pubblici)

COMPETÊNCIAS ADICIONAIS:
• Arbitragem internacional (ICC, CCI, LCIA, CAM-CCBC)
• Contratos FIDIC (Red Book, Yellow Book, Silver Book)
• Force Majeure e cláusulas de variação de preços
• Seguros de obra (RC Engenheiros, Seguro de Garantia, Decennial Liability)
• ESG e critérios de sustentabilidade em contratos

Analise com rigor técnico, cite artigos e normas aplicáveis, e use linguagem acessível ao cliente. Estruture bem a resposta com seções numeradas.`

    try {
      const userPrompt = `Analise este contrato de ${TIPOS_CONTRATO.find(t => t.id === tipoContrato)?.label}:

CONTRATANTE: ${parte.nome || '[não informado]'}, CPF ${parte.cpf || '-'}, ${parte.estado_civil || '-'}, ${parte.profissao || '-'}
CONTRATADO: ${modoContratado === 'apex' ? APEX.nome + ' CNPJ ' + APEX.cnpj : ENG.nome + ' CREA ' + ENG.crea}
OBJETO: ${obra.classificacao || '-'} — ${obra.area_construir || '-'}m² em ${obra.endereco || '-'}
VALORES: Total ${financeiro.valor_total || '-'}, Entrada ${financeiro.entrada || '-'}, ${financeiro.parcelas || '-'} parcelas de ${financeiro.valor_parcela || '-'}

Por favor forneça:
1. ✅ Pontos positivos do contrato
2. ⚠️ Riscos e cláusulas de atenção (com base legal citada)
3. 💡 Sugestões de melhoria
4. 📋 Conformidade com legislação brasileira (Art. 618 CC, NR-18, CLT, LGPD)
5. 🌍 Observações se houver partes ou execução na Europa (diretivas EU aplicáveis)
6. ⚖️ Score de risco geral (0–100) e recomendação final`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: JURIDICO_SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
      const data = await res.json()
      setAnaliseIA(data?.content?.[0]?.text || data.response || 'Análise concluída.')
    } catch { setAnaliseIA('Erro ao conectar ao agente jurídico. Verifique a conexão.') }
    setAnalisando(false)
  }, [tipoContrato, parte, obra, financeiro, modoContratado])

  // ─── Helpers financeiros compartilhados ───────────────────────
  const _contratoCalc = () => {
    const tipo    = TIPOS_CONTRATO.find(t => t.id === tipoContrato)
    const isAdm   = tipoContrato === 'administracao'
    const isEmp   = tipoContrato === 'empreitada'
    const isMao   = tipoContrato === 'mao_de_obra'
    const isProj  = tipoContrato === 'projetos'
    const valTotal = parseFloat((financeiro.valor_total || '0').replace(/\D/g,'')) || 0
    const valEntr  = parseFloat((financeiro.entrada    || '0').replace(/\D/g,'')) || 0
    const nParc    = parseInt(financeiro.parcelas) || 10
    const saldoCalc = valTotal > 0 && valEntr > 0
      ? `R$ ${(valTotal - valEntr).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
      : (financeiro.saldo || '[SALDO DEVEDOR]')
    const valParc = valTotal > 0 && valEntr > 0 && nParc > 0
      ? `R$ ${((valTotal - valEntr)/nParc).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
      : (financeiro.valor_parcela || '[VALOR DA PARCELA]')
    const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
    return { tipo, isAdm, isEmp, isMao, isProj, valTotal, valEntr, nParc, saldoCalc, valParc, hoje }
  }

  // ─── HTML para impressão / DOC ─────────────────────────────────
  const buildContratoHtml = () => {
    const c = _contratoCalc()
    const nomeCtd = modoContratado === 'apex'
      ? `${APEX.nome}, CNPJ ${APEX.cnpj}, rep. por ${APEX.representante} (${APEX.cargo})`
      : `${ENG.nome}, Eng. Civil, CREA ${ENG.crea}, CPF ${ENG.cpf}`

    const cl = (n: number, t: string) =>
      `<h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#185FA5;margin:20px 0 6px;border-bottom:1px solid #e5e8f0;padding-bottom:4px">${n}. ${t}</h2>`
    const p  = (txt: string) => `<p style="margin:4px 0 8px;line-height:1.7">${txt}</p>`
    const li = (items: string[]) => `<ul style="margin:6px 0 10px;padding-left:20px">${items.map(i=>`<li style="margin:3px 0;line-height:1.6">${i}</li>`).join('')}</ul>`

    return `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1f36;max-width:800px;margin:0 auto">
<div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #185FA5">
  <div style="font-size:18px;font-weight:700;color:#185FA5;margin-bottom:4px">CONTRATO DE ${c.tipo?.label.toUpperCase()}</div>
  <div style="font-size:11px;color:#8b93a7">Promissão/SP · ${c.hoje}</div>
</div>
${p('Pelo presente instrumento particular, as partes abaixo qualificadas têm entre si justo e contratado o seguinte:')}

${cl(1,'DAS PARTES')}
${p('<strong>CONTRATANTE:</strong> '+(parte.nome||'[NOME]')+', '+parte.nacionalidade+', '+parte.estado_civil+', '+parte.profissao+', CPF '+parte.cpf+', RG '+parte.rg+', residente em '+parte.endereco+', tel. '+parte.telefone+'.')}
${p('<strong>CONTRATADO:</strong> '+nomeCtd+'. Responsável técnico: '+ENG.nome+' — CREA '+ENG.crea+'.')}

${cl(2,'DO OBJETO')}
${p('O presente contrato tem por objeto a <strong>'+c.tipo?.label+'</strong> para execução de:')}
${p(obra.descricao || (obra.tipo_obra+' — '+obra.classificacao+', conforme projeto arquitetônico, projetos complementares e Memorial Descritivo aprovados, que integram este contrato como Anexo I.'))}
${c.isAdm ? p('No regime de <strong>Administração a Preço de Custo</strong>, o CONTRATANTE fornece todos os materiais; o CONTRATADO é remunerado exclusivamente pela administração, mão de obra e gerenciamento.') : ''}
${c.isEmp ? p('No regime de <strong>Empreitada Global</strong>, o CONTRATADO fornece toda mão de obra, materiais e equipamentos, responsabilizando-se pelo resultado final conforme especificações acordadas.') : ''}
${c.isMao ? p('No regime de <strong>Mão de Obra</strong>, os materiais são fornecidos exclusivamente pelo CONTRATANTE; o CONTRATADO responde apenas pela execução dos serviços.') : ''}
${c.isProj ? p('O objeto compreende a elaboração de <strong>projetos técnicos e laudos</strong>, conforme escopo detalhado no Anexo I.') : ''}

${cl(3,'DOS SERVIÇOS NÃO INCLUSOS')}
${p('NÃO estão inclusos no presente contrato, salvo aditivo escrito expressamente assinado pelas partes:')}
${li([
  'Projetos complementares (estrutural, elétrico, hidrossanitário, SPDA, AVCB), salvo se expressamente listados no objeto',
  'Aprovações e taxas junto à Prefeitura, CREA, CAU, Corpo de Bombeiros e demais órgãos públicos',
  'Laudos, vistorias, análises de solo e sondagens',
  'Demolições totais ou remoção de entulho fora do canteiro de obras, salvo se previsto em planilha',
  'Fornecimento de materiais pelo CONTRATADO (exceto em contratos de Empreitada Global)',
  'ARTs ou RRTs adicionais não previstas no escopo original',
  'Administração financeira de fornecedores ou subcontratados contratados diretamente pelo CONTRATANTE',
  'Mudanças de projeto, upgrades de acabamentos e alterações de escopo solicitadas após a assinatura',
  'Obras de infraestrutura externa ao terreno (ligações de água, esgoto, energia, calçada pública)',
  'Instalação de equipamentos especiais (ar-condicionado, elevadores, automação) salvo previsão expressa',
])}

${cl(4,'DO IMÓVEL')}
${p('A obra será executada no imóvel: <strong>'+(obra.tipo_obra||'')+'</strong> — '+obra.classificacao+
  '<br>Endereço: '+(obra.endereco||'[ENDEREÇO]')+
  (obra.setor?' | Setor: '+obra.setor:'')+
  (obra.quadra?' | Quadra: '+obra.quadra:'')+
  (obra.lote?' | Lote: '+obra.lote:'')+
  '<br>Inscrição: '+(obra.inscricao||'—')+' | Testada: '+(obra.testada||'—')+' m | Terreno: '+(obra.area_terreno||'—')+' m² | A construir: '+(obra.area_construir||'—')+' m²'
)}
${p('O CONTRATANTE declara ser proprietário ou possuidor do imóvel, responsabilizando-se por restrições legais, administrativas ou de vizinhança.')}

${cl(5,'DO PRAZO DE EXECUÇÃO')}
${p('A execução terá prazo de <strong>[PRAZO]</strong> dias corridos, contados da emissão da ART/RRT junto ao CREA e do depósito da primeira parcela.')}
${p('O prazo ficará automaticamente suspenso em caso de: (a) atraso no fornecimento de materiais pelo CONTRATANTE; (b) paralisação por autoridade pública; (c) força maior ou caso fortuito (art. 393 CC); (d) chuvas que impeçam a execução por mais de 3 dias consecutivos, registradas no RDO; (e) inadimplência financeira do CONTRATANTE por mais de 5 dias corridos.')}

${cl(6,'DO PREÇO E FORMA DE PAGAMENTO')}
${p('Valor total contratado: <strong>'+(financeiro.valor_total||'[R$ VALOR TOTAL]')+'</strong>, correspondente a '+c.tipo?.label.toLowerCase()+', conforme planilha orçamentária (Anexo II).')}
${p('Forma de pagamento:<br>• Entrada (assinatura): <strong>'+(financeiro.entrada||'[R$ ENTRADA]')+'</strong><br>• Saldo devedor: '+c.saldoCalc+'<br>• Parcelamento: '+c.nParc+' parcelas mensais de '+c.valParc+'<br>• Vencimento: dia '+(financeiro.dia_vencimento||'10')+' de cada mês a partir do 1º mês de obra.')}
${p('Pagamentos via PIX ou transferência:<br>Beneficiário: '+APEX.nome+' | CNPJ '+APEX.cnpj+'<br>Banco '+PAGAMENTO.banco+' | Ag. '+PAGAMENTO.agencia+' | C/C '+PAGAMENTO.conta+' | PIX: '+PAGAMENTO.pix)}
${p('<strong>6.4.</strong> O atraso no pagamento superior a 5 (cinco) dias corridos autoriza o CONTRATADO a <strong>suspender imediatamente</strong> todos os serviços, sem qualquer penalidade, até a regularização do débito acrescido de multa de 2%, juros de 1%/mês e correção pelo INCC-M/IPCA.')}
${p('<strong>6.5.</strong> A entrada/sinal pago na assinatura é <strong>não reembolsável</strong> em caso de desistência injustificada do CONTRATANTE, servindo como indenização mínima pelos custos de mobilização, projeto e reserva de agenda do CONTRATADO.')}

${cl(7,'DO REAJUSTE DE PREÇOS')}
${p('Os valores serão reajustados anualmente pelo INCC-M (FGV). Em caso de elevação de insumos acima de 15% verificada pelo SINAPI/IBGE, as partes negociarão revisão extraordinária em 10 dias úteis.')}

${cl(8,'DOS SERVIÇOS EXTRAS E ADITIVOS')}
${p('Quaisquer serviços não previstos no objeto original somente serão executados mediante:')}
${li([
  'Solicitação <strong>escrita</strong> do CONTRATANTE (e-mail, WhatsApp ou Termo Aditivo)',
  'Aprovação <strong>prévia e escrita</strong> do orçamento pelo CONTRATANTE, com valor e prazo definidos',
  'Assinatura de Termo Aditivo antes do início da execução',
])}
${p('<strong>8.2.</strong> Autorizações verbais NÃO são vinculantes. O CONTRATADO reserva-se o direito de não executar serviços extras sem autorização escrita e prévia.')}
${p('<strong>8.3.</strong> Alterações de projeto solicitadas pelo CONTRATANTE após o início da obra poderão implicar em revisão do prazo e do valor total, formalizadas por Termo Aditivo.')}

${cl(9,'DA MEDIÇÃO E APROVAÇÃO DOS SERVIÇOS')}
${p('O CONTRATADO realizará medições mensais dos serviços executados, apresentando relatório discriminado ao CONTRATANTE.')}
${p('<strong>9.2.</strong> O CONTRATANTE terá prazo de <strong>5 (cinco) dias úteis</strong> para aprovar, contestar ou solicitar complementação das medições. Decorrido este prazo sem manifestação, a medição será considerada <strong>tacitamente aprovada</strong> e o pagamento torna-se exigível.')}
${p('<strong>9.3.</strong> Contestações parciais não suspendem o pagamento da parte não contestada.')}

${cl(10,'DAS OBRIGAÇÕES DO CONTRATADO')}
${li([
  'Executar os serviços com boa técnica, observando ABNT NBR 12721, 6118, 9050 e 15575',
  'Manter responsável técnico habilitado no local da obra',
  'Elaborar e manter atualizado o Diário de Obra (RDO)',
  'Providenciar ART/RRT junto ao CREA antes do início das obras',
  'Gerenciar equipe de mão de obra e subcontratados',
  'Apresentar medições mensais detalhadas ao CONTRATANTE',
  'Guardar documentos fiscais relativos à obra pelo prazo de 5 anos',
  'Comunicar imediatamente ao CONTRATANTE fatos que afetem prazo, custo ou qualidade',
  'Cumprir integralmente as NRs de segurança do trabalho (NR-18, NR-06, NR-10, NR-35)',
  c.isAdm ? 'Apresentar notas fiscais de todas as compras realizadas com verbas do CONTRATANTE' : '',
].filter(Boolean))}

${cl(11,'DAS OBRIGAÇÕES DO CONTRATANTE')}
${li([
  'Efetuar os pagamentos nas datas e condições pactuadas',
  'Fornecer documentação do imóvel necessária ao licenciamento',
  'Providenciar aprovações junto à Prefeitura e órgãos competentes, salvo se incluídos no objeto',
  'Garantir livre acesso ao imóvel para execução dos serviços',
  'Comunicar alterações de projeto com antecedência mínima de 5 dias úteis por escrito',
  'Assinar o Diário de Obra quando solicitado',
  'Não contratar diretamente funcionários ou subcontratados do CONTRATADO durante a vigência e por 12 meses após o término',
  'Designar um representante com poderes para aprovar medições, aditivos e alterações',
  c.isAdm ? 'Manter conta bancária específica para a obra e aprovar previamente compras acima de R$ 500,00' : '',
].filter(Boolean))}

${cl(12,'DA RESPONSABILIDADE TÉCNICA')}
${p('O CONTRATADO assume responsabilidade técnica pelos serviços conforme o <strong>Art. 618 do Código Civil</strong> (Lei 10.406/2002): <em>"Nos contratos de empreitada de edifícios ou outras construções consideráveis, o empreiteiro de materiais e execução responderá, durante o prazo irredutível de cinco anos, pela solidez e segurança do trabalho, assim em razão dos materiais, como do solo."</em>')}
${p('Responsável técnico: '+ENG.nome+' — CREA '+ENG.crea+' | ART/RRT nº: ___________________________ (a ser anotada)')}

${cl(13,'DOS VÍCIOS OCULTOS E CONDIÇÕES PREEXISTENTES')}
${p('Em obras de <strong>reforma, ampliação ou adaptação</strong>, o CONTRATADO <strong>não responde</strong> por:')}
${li([
  'Vícios ocultos da construção preexistente não detectáveis por inspeção visual (infiltrações latentes, fissuras estruturais ocultas, instalações fora de norma embutidas, fundações subdimensionadas)',
  'Danos decorrentes de estrutura, solo ou fundação preexistentes não declarados pelo CONTRATANTE',
  'Inadequações de projeto não elaborado pelo CONTRATADO',
  'Problemas oriundos de materiais fornecidos pelo CONTRATANTE ou por ele especificados',
])}
${p('<strong>13.2.</strong> Constatada condição preexistente que afete a execução ou a segurança, o CONTRATADO notificará o CONTRATANTE por escrito e os serviços serão suspensos até solução, sem penalidade ao CONTRATADO.')}
${p('<strong>13.3.</strong> Reformas são regidas pela <strong>NBR 16280:2015</strong> (Reforma em edificações). O CONTRATANTE é responsável por obter todas as aprovações condominiais ou municipais exigidas.')}

${cl(14,'DA LIMITAÇÃO DE RESPONSABILIDADE')}
${p('O CONTRATADO <strong>não se responsabiliza</strong> por:')}
${li([
  'Qualidade, resistência ou adequação de materiais escolhidos, comprados ou fornecidos pelo CONTRATANTE',
  'Serviços executados por terceiros contratados diretamente pelo CONTRATANTE, sem supervisão do CONTRATADO',
  'Danos causados por uso inadequado, falta de manutenção preventiva ou reformas não autorizadas após a entrega',
  'Perdas indiretas, lucros cessantes ou danos imateriais do CONTRATANTE',
  'Atrasos causados por greves, desabastecimento do mercado, pandemia ou eventos de força maior (art. 393 CC)',
])}
${p('<strong>14.2.</strong> A propriedade intelectual de projetos, memoriais e especificações elaborados pelo CONTRATADO permanece com o CONTRATADO até o pagamento integral do contrato. O CONTRATANTE recebe licença de uso para execução da obra objeto deste instrumento.')}

${cl(15,'DAS GARANTIAS DE EXECUÇÃO')}
${p('O CONTRATADO garante os serviços executados pelo prazo mínimo de:')}
${li([
  '<strong>5 anos:</strong> solidez estrutural e estanqueidade (art. 618 CC)',
  '<strong>3 anos:</strong> impermeabilizações, instalações hidrossanitárias e elétricas (NBR 15575)',
  '<strong>1 ano:</strong> revestimentos, pinturas e acabamentos em geral',
])}
${p('O prazo de garantia inicia-se na data do Termo de Entrega da Obra. A garantia não cobre danos por mau uso, falta de manutenção, reformas não autorizadas ou força maior.')}

${cl(16,'DO SEGURO DA OBRA')}
${p('Recomenda-se que o CONTRATANTE contrate seguro de obra (Risco de Engenharia) para cobertura de danos materiais e responsabilidade civil durante a execução. O CONTRATADO manterá apólice de RC Profissional vigente durante toda a execução.')}

${cl(17,'DAS PENALIDADES E MULTAS')}
${p('Em caso de inadimplência:')}
${li([
  'Multa compensatória: 10% sobre o valor total do contrato',
  'Multa moratória: 0,5% ao dia sobre o valor da obrigação descumprida, limitada a 10%',
  'Perdas e danos: nos termos dos arts. 402-404 CC',
])}
${p('Atraso injustificado na entrega superior a 30 dias corridos: multa de 0,1%/dia sobre o valor total, limitada a 5%.')}

${cl(18,'DA RESCISÃO CONTRATUAL')}
${p('O contrato poderá ser rescindido mediante notificação escrita com <strong>15 (quinze) dias corridos</strong> de antecedência nas seguintes hipóteses: descumprimento de cláusula; inadimplência superior a 30 dias; paralisação injustificada superior a 15 dias; insolvência ou falência; acordo mútuo.')}
${p('<strong>18.2. Rescisão pelo CONTRATANTE sem justa causa:</strong> O CONTRATANTE pagará ao CONTRATADO o valor dos serviços executados e medidos, <strong>a entrada/sinal é retida integralmente pelo CONTRATADO</strong> como indenização mínima, acrescida de multa compensatória de 10% sobre o saldo contratual restante e despesas de desmobilização comprovadas.')}
${p('<strong>18.3. Rescisão pelo CONTRATADO sem justa causa:</strong> O CONTRATADO devolverá materiais e equipamentos do CONTRATANTE, pagará multa compensatória de 10% sobre o saldo contratual e garantirá continuidade mínima da obra por 30 dias para contratação de substituto.')}
${p('<strong>18.4.</strong> Todos os documentos técnicos (projetos, RDO, planilhas, ARTs) serão entregues ao CONTRATANTE somente após quitação integral de todas as obrigações financeiras.')}

${cl(19,'DA SEGURANÇA E MEDICINA DO TRABALHO')}
${p('O CONTRATADO cumpre integralmente: <strong>NR-18</strong> (Construção Civil), <strong>NR-06</strong> (EPIs), <strong>NR-10</strong> (Eletricidade), <strong>NR-35</strong> (Trabalho em Altura). O CONTRATADO é único responsável por acidentes com seus empregados e subcontratados, respondendo perante o INSS, FGTS e demais obrigações trabalhistas.')}

${cl(20,'DA PROTEÇÃO DE DADOS PESSOAIS — LGPD')}
${p('As partes tratam dados pessoais em conformidade com a <strong>Lei 13.709/2018</strong> (LGPD), exclusivamente para execução deste contrato, emissão de documentos fiscais e cumprimento de obrigações legais. Nenhuma das partes compartilhará dados pessoais com terceiros sem consentimento prévio, salvo por determinação legal.')}

${cl(21,'DAS DISPOSIÇÕES GERAIS')}
${p('21.1. Alterações somente por Termo Aditivo escrito, assinado pelas partes e por duas testemunhas.')}
${p('21.2. A tolerância de qualquer descumprimento não importa em novação ou renúncia.')}
${p('21.3. Casos omissos regidos pelo Código Civil Brasileiro (Lei 10.406/2002).')}
${p('21.4. As partes elegem o foro da <strong>Comarca de Promissão/SP</strong> para dirimir litígios, renunciando a qualquer outro.')}
</div>`
  }

  // ─── US Contract HTML builder ────────────────────────────────
  const buildUSContractHtml = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const usTipo = US_CONTRACT_TYPES.find(t => t.id === usTipoContrato)
    const depositPct = usFinancial.deposit && usFinancial.contractValue
      ? Math.round((parseFloat(usFinancial.deposit.replace(/\D/g,'')) / parseFloat(usFinancial.contractValue.replace(/\D/g,''))) * 100)
      : 10
    const cl = (n: number, t: string) =>
      `<h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0F4C81;margin:18px 0 6px;border-bottom:1px solid #d0dcea;padding-bottom:4px">${n}. ${t}</h2>`
    const p  = (txt: string) => `<p style="margin:4px 0 8px;line-height:1.7">${txt}</p>`
    const li = (items: string[]) => `<ul style="margin:6px 0 10px;padding-left:20px">${items.map(i=>`<li style="margin:3px 0;line-height:1.6">${i}</li>`).join('')}</ul>`

    return `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a2b3c;max-width:800px;margin:0 auto">
<div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0F4C81">
  <div style="font-size:17px;font-weight:700;color:#0F4C81;margin-bottom:2px">${usTipo?.label.toUpperCase()}</div>
  <div style="font-size:11px;color:#5C7A99">${usProject.city || 'City'}, ${usProject.state || 'TX'} · ${today}</div>
</div>
${p('This <strong>' + (usTipo?.label || 'Construction Contract') + '</strong> ("Agreement") is entered into as of <strong>' + today + '</strong>, by and between the parties listed below.')}

${cl(1,'PARTIES')}
${p('<strong>OWNER (Client):</strong> ' + (usParty.name || '[Owner Name]') + (usParty.company ? ', ' + usParty.company : '') + (usParty.ein ? ', EIN ' + usParty.ein : '') + ', located at ' + [usParty.address, usParty.city, usParty.state, usParty.zip].filter(Boolean).join(', ') + '.')}
${p('<strong>CONTRACTOR:</strong> ' + ATLAS_US.company + ', ' + ATLAS_US.license + ', EIN ' + ATLAS_US.ein + ', located at ' + ATLAS_US.address + '. Licensed Professional Engineer: ' + ATLAS_US.rep + ', ' + ATLAS_US.pe_license + '.')}

${cl(2,'PROJECT & SCOPE OF WORK')}
${p('<strong>Project Address:</strong> ' + [usProject.address, usProject.city, usProject.state, usProject.zip].filter(Boolean).join(', '))}
${p('<strong>Description:</strong> ' + (usProject.description || '[Project description per attached plans and specifications]'))}
${p('<strong>Construction Type:</strong> ' + (US_CONSTRUCTION_TYPES.find(t => t.id === usProject.constructionType)?.label || 'New Residential Construction'))}
${usProject.systems.length > 0 ? p('<strong>Construction Systems:</strong> ' + usProject.systems.join(' · ')) : ''}
${p('<strong>Scope:</strong> ' + (usProject.scope || 'Construction services as described in the attached Exhibit A — Scope of Work, Plans, and Specifications, incorporated herein by reference.'))}
${usTipoContrato === 'fixed_price' ? p('Contract Type: <strong>Fixed-Price (Lump Sum)</strong>. The Contract Price is firm and all-inclusive unless a written Change Order is executed per Section 7.') : ''}
${usTipoContrato === 'cost_plus'   ? p('Contract Type: <strong>Cost-Plus with GMP</strong>. Owner pays actual documented costs plus a Contractor Fee of 15%, subject to a Guaranteed Maximum Price (GMP) established in Exhibit B.') : ''}
${usTipoContrato === 'time_material'? p('Contract Type: <strong>Time & Materials</strong>. Contractor invoices at the rates established in Exhibit C (Labor Rate Schedule) plus actual material costs with a 12% markup.') : ''}
${usTipoContrato === 'design_build' ? p('Contract Type: <strong>Design-Build</strong>. Contractor assumes full responsibility for design services and construction under a single point of accountability.') : ''}

${cl(3,'CONTRACT PRICE & PAYMENT')}
${p('3.1 <strong>Contract Value:</strong> $' + (usFinancial.contractValue || '[CONTRACT VALUE]') + ' USD.')}
${p('3.2 <strong>Deposit:</strong> ' + depositPct + '% ($' + (usFinancial.deposit || '[DEPOSIT]') + ') due upon execution. No work commences until deposit is received.')}
${p('3.3 <strong>Progress Payments:</strong> Invoiced at project milestones (Exhibit D). Payment terms: <strong>' + (usFinancial.paymentTerms || 'Net 30') + ' days</strong> from invoice date.')}
${p('3.4 <strong>Retainage:</strong> ' + (usFinancial.retainage || '10') + '% withheld from each progress payment, released upon final completion and lien waiver.')}
${p('3.5 <strong>Late Payment:</strong> Unpaid invoices accrue interest at 1.5%/month (18% APR). Contractor may suspend work after 10 days written notice.')}
${p('3.6 <strong>Payment Method:</strong> ACH/wire transfer. Checks accepted with 5-business-day clearing period.')}

${cl(4,'SCHEDULE')}
${p('4.1 <strong>Commencement:</strong> ' + (usProject.startDate || '[Start Date]') + ', contingent on Owner securing permits and deposit payment.')}
${p('4.2 <strong>Substantial Completion:</strong> ' + (usProject.endDate || '[Target Completion Date]') + ', subject to excusable delays per Section 9.')}
${p('4.3 Time is of the essence. Contractor shall maintain a project schedule updated weekly and provided to Owner upon request.')}

${cl(5,'CONTRACTOR RESPONSIBILITIES')}
${li([
  'Provide all labor, supervision, tools, and equipment necessary to complete the Work',
  'Comply with all applicable federal, state, and local codes: IBC 2021, ADA, OSHA 29 CFR 1926, NFPA 101, local ordinances',
  'Obtain all required building permits (cost included in Contract Price unless noted in Exhibit A)',
  'Maintain a clean and safe jobsite in compliance with OSHA safety regulations',
  'Carry all required insurance: $1M/$2M Commercial General Liability, Workers\' Compensation per state requirements',
  'Provide lien waivers (conditional + unconditional) per progress payment',
  'Coordinate all subcontractors and suppliers; remain solely responsible for their performance',
])}

${cl(6,'OWNER RESPONSIBILITIES')}
${li([
  'Provide site access during normal working hours (7 AM – 5 PM, Mon–Fri)',
  'Make timely payments per Section 3; failure to pay is grounds for work suspension',
  'Designate an authorized representative with decision-making authority',
  'Provide accurate survey, soils reports, and utility as-builts if required',
  'Secure and pay for all HOA, architectural review, or utility connection approvals unless noted otherwise',
])}

${cl(7,'CHANGE ORDERS')}
${p('7.1 No changes to the Work or Contract Price shall be made without a written Change Order signed by both parties.')}
${p('7.2 Contractor shall provide a written quote for any requested change within 5 business days. Owner has 5 business days to approve or reject.')}
${p('7.3 Differing site conditions discovered after commencement (undisclosed utilities, hazardous materials, unanticipated soils) entitle Contractor to equitable adjustment per AIA A201-2017 §3.7.4 equivalent.')}
${p('7.4 All verbal change authorizations are void. Any work performed without written Change Order is at Contractor\'s sole risk.')}

${cl(8,'EXCLUDED WORK')}
${p('The following are expressly excluded from this Agreement unless added by written Change Order:')}
${li([
  'Hazardous material abatement (asbestos, lead paint, mold remediation)',
  'Off-site utility extension beyond property line',
  'Landscaping, irrigation, and site restoration beyond construction footprint',
  'Furniture, fixtures, appliances, and equipment not listed in Exhibit A',
  'Survey, geotechnical, or environmental testing',
  'HOA or architectural review fees',
  'Pre-existing code violations or defects discovered during construction',
])}

${cl(9,'DELAYS & FORCE MAJEURE')}
${p('9.1 Excusable delays (Acts of God, labor strikes, material shortages, governmental actions, pandemic-related disruptions) extend the Schedule without penalty.')}
${p('9.2 Contractor shall notify Owner in writing within 7 days of any delay event. Failure to notify waives the right to Schedule extension for that event.')}
${p('9.3 Owner-caused delays (late decisions, slow payments, design changes) entitle Contractor to time extension plus direct costs.')}

${cl(10,'WARRANTIES')}
${p('10.1 <strong>One-Year Workmanship Warranty:</strong> Contractor warrants all Work against defects in workmanship for 1 year from Substantial Completion date.')}
${p('10.2 <strong>Manufacturer Warranties:</strong> Equipment and materials carry manufacturer warranties, which Contractor assigns to Owner at Substantial Completion.')}
${p('10.3 <strong>Hidden/Latent Defects:</strong> Pre-existing concealed conditions (rot, corrosion, faulty prior work) discovered during construction are not covered by this warranty and shall be addressed by Change Order.')}
${p('10.4 Warranty is voided by Owner\'s unauthorized modifications, failure to maintain, or use beyond design specifications.')}

${cl(11,'INSURANCE & BONDS')}
${p('11.1 Contractor shall maintain, at minimum: Commercial General Liability $1M/$2M aggregate; Umbrella $5M; Workers\' Compensation per statutory limits; Professional Liability (E&O) $1M.')}
${p('11.2 Owner shall be named as additional insured on Contractor\'s CGL policy. Certificates shall be provided prior to commencement.')}
${p('11.3 Contractor is not responsible for Owner-provided builder\'s risk policy. Owner shall secure builder\'s risk insurance prior to commencement.')}

${cl(12,'LIEN RIGHTS')}
${p('12.1 This Agreement does not waive Contractor\'s statutory lien rights. Contractor may file a Mechanic\'s Lien in accordance with ' + (usProject.state || 'TX') + ' state law upon non-payment.')}
${p('12.2 Preliminary lien notice will be sent per state requirements. Conditional lien waivers provided with each invoice; unconditional upon payment receipt.')}

${cl(13,'LIMITATION OF LIABILITY')}
${p('13.1 Contractor\'s liability for any claim shall not exceed the total Contract Price paid to date.')}
${p('13.2 Neither party shall be liable for consequential, incidental, special, or punitive damages (loss of use, lost profits, delay penalties with third parties).')}
${p('13.3 <strong>Intellectual Property:</strong> All plans, drawings, BIM models, and specifications prepared by Contractor remain Contractor\'s property until full payment. Upon final payment, Owner receives a non-exclusive license to use them for the Project only.')}

${cl(14,'TERMINATION')}
${p('14.1 <strong>By Owner for Convenience:</strong> Owner may terminate with 14 days written notice. Owner shall pay all Work performed to date, plus 15% overhead/profit on incomplete work, and demobilization costs.')}
${p('14.2 <strong>By Owner for Cause:</strong> If Contractor materially breaches and fails to cure within 10 days of written notice, Owner may terminate and hire substitute contractor. Contractor is liable for excess costs.')}
${p('14.3 <strong>By Contractor for Non-Payment:</strong> If Owner fails to pay an undisputed invoice within 30 days, Contractor may suspend work and terminate after 10 additional days notice. Contractor retains all completed work and is owed full payment for same.')}

${cl(15,'DISPUTE RESOLUTION')}
${p('15.1 The parties agree to attempt mediation (AAA Construction Mediation Rules) before initiating arbitration or litigation.')}
${p('15.2 Any unresolved disputes shall be settled by binding arbitration under <strong>AAA Construction Industry Arbitration Rules</strong>.')}
${p('15.3 Governing Law: This Agreement is governed by the laws of the State of <strong>' + (usProject.state || 'TX') + '</strong>, without regard to conflict of law provisions.')}
${p('15.4 Venue: Arbitration shall take place in ' + (usProject.city || 'Dallas') + ', ' + (usProject.state || 'TX') + '.')}

${cl(16,'GENERAL PROVISIONS')}
${p('16.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.')}
${p('16.2 Amendments require written Change Orders signed by both parties (Section 7).')}
${p('16.3 If any provision is found unenforceable, the remainder of the Agreement remains in full effect.')}
${p('16.4 Notices shall be in writing delivered by email (with read receipt), certified mail, or overnight courier to the addresses stated herein.')}
${p('16.5 Neither party may assign this Agreement without the other\'s written consent, except Contractor may assign to an affiliate.')}

<div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
  <div>
    <div style="font-weight:700;font-size:11px;color:#0F4C81;margin-bottom:4px">OWNER / CLIENT</div>
    <div style="border-bottom:1px solid #0F4C81;margin:16px 0 4px"></div>
    <div style="font-size:11px;color:#5C7A99">${usParty.name || '[Owner Name]'}</div>
    <div style="font-size:11px;color:#5C7A99">Date: ___________________</div>
  </div>
  <div>
    <div style="font-weight:700;font-size:11px;color:#0F4C81;margin-bottom:4px">CONTRACTOR</div>
    <div style="border-bottom:1px solid #0F4C81;margin:16px 0 4px"></div>
    <div style="font-size:11px;color:#5C7A99">${ATLAS_US.rep} — ${ATLAS_US.company}</div>
    <div style="font-size:11px;color:#5C7A99">Date: ___________________</div>
  </div>
</div>
</div>`
  }

  // ─── Gera memorial descritivo via IA ──────────────────────────
  const gerarMemorial = async () => {
    setGerandoMem(true); setMemorial('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          system: `Você é um engenheiro civil sênior especialista em elaboração de memoriais descritivos para obras no Brasil. Gere memoriais técnicos completos, claros e padronizados conforme NBR 12721 e boas práticas da ABNT. Use linguagem técnica precisa. Formate com seções numeradas e sub-itens.`,
          messages: [{ role: 'user', content: `Gere um Memorial Descritivo completo para a seguinte obra:

TIPO: ${obra.tipo_obra} — ${obra.classificacao}
ENDEREÇO: ${obra.endereco || 'Promissão/SP'}
ÁREA CONSTRUÍDA: ${obra.area_construir || '[não informado]'} m²
ÁREA TERRENO: ${obra.area_terreno || '[não informado]'} m²
DESCRIÇÃO: ${obra.descricao || 'Construção residencial unifamiliar'}
REGIME: ${TIPOS_CONTRATO.find(t=>t.id===tipoContrato)?.label}
CONTRATANTE: ${parte.nome || '[CONTRATANTE]'}
RESPONSÁVEL TÉCNICO: ${ENG.nome} — CREA ${ENG.crea}

O memorial deve conter:
1. Identificação da obra e das partes
2. Descrição geral do projeto
3. Fundações e movimentação de terra
4. Estrutura (tipo, materiais, normas)
5. Alvenaria e vedações
6. Cobertura e telhamento
7. Revestimentos internos e externos
8. Esquadrias (portas e janelas)
9. Pisos e pavimentações
10. Instalações elétricas e de comunicações (normas ABNT)
11. Instalações hidrossanitárias (normas ABNT)
12. Pintura e acabamentos
13. Instalações especiais (se aplicável)
14. Disposições gerais, normas aplicáveis e responsabilidades
15. Assinatura e ART

Seja específico, técnico e completo. Use as normas ABNT aplicáveis em cada seção.` }],
        }),
      })
      const data = await res.json()
      setMemorial(data?.content?.[0]?.text || data.response || 'Erro ao gerar memorial.')
    } catch { setMemorial('Erro ao conectar ao agente. Verifique a conexão.') }
    setGerandoMem(false)
  }

  // ─── Gera contrato completo (texto — usado na preview etapa 6) ─
  const gerarContrato = () => {
    const c = _contratoCalc()
    const { tipo, isAdm, isEmp, saldoCalc, valParc, nParc } = c

    const sep   = '═'.repeat(56)
    const linha = '─'.repeat(56)

    return `${sep}
                    CONTRATO DE ${tipo?.label.toUpperCase()}
${sep}

Pelo presente instrumento particular de contrato, as partes abaixo qualificadas
têm entre si justo e contratado o seguinte, que mutuamente aceitam e outorgam:

${linha}
1. DAS PARTES
${linha}

1.1. CONTRATANTE:

     ${parte.nome || '[NOME COMPLETO DO CONTRATANTE]'}, ${parte.nacionalidade || 'brasileiro(a)'},
     ${parte.estado_civil || '[ESTADO CIVIL]'}, ${parte.profissao || '[PROFISSÃO]'},
     CPF: ${parte.cpf || '[000.000.000-00]'}  |  RG: ${parte.rg || '[XXXXXXX-X]'}
     Endereço: ${parte.endereco || '[LOGRADOURO, NÚMERO, BAIRRO, CIDADE, UF, CEP]'}
     Tel/WhatsApp: ${parte.telefone || '[TELEFONE]'}  |  E-mail: ${parte.email || '[E-MAIL]'}

1.2. CONTRATADO:

     ${nomeContratado}.
     Responsável técnico: ${ENG.nome} — CREA ${ENG.crea}

As partes acima identificadas são doravante denominadas simplesmente
CONTRATANTE e CONTRATADO.

${linha}
2. DO OBJETO
${linha}

2.1. O presente contrato tem por objeto a ${tipo?.label} para execução de:
     ${obra.descricao || `${obra.tipo_obra} — ${obra.classificacao}, conforme projeto arquitetônico, projetos complementares e Memorial Descritivo aprovados (Anexo I).`}

${isAdm ? `2.2. REGIME: ADMINISTRAÇÃO A PREÇO DE CUSTO — o CONTRATANTE fornece todos
     os materiais; o CONTRATADO é remunerado pela administração e mão de obra.` :
isEmp ? `2.2. REGIME: EMPREITADA GLOBAL — o CONTRATADO fornece toda mão de obra,
     materiais e equipamentos, responsabilizando-se pelo resultado final.` :
c.isMao ? `2.2. REGIME: MÃO DE OBRA — materiais fornecidos exclusivamente pelo CONTRATANTE;
     o CONTRATADO responde apenas pela execução dos serviços.` :
`2.2. REGIME: PROJETOS E LAUDOS — elaboração de projetos técnicos conforme Anexo I.`}

${linha}
3. DOS SERVIÇOS NÃO INCLUSOS
${linha}

3.1. NÃO estão inclusos neste contrato, salvo Termo Aditivo escrito:
     a) Projetos complementares (estrutural, elétrico, hidro, SPDA, AVCB)
        não listados expressamente no objeto;
     b) Aprovações e taxas junto à Prefeitura, CREA, CAU, Bombeiros;
     c) Laudos, vistorias, análises de solo e sondagens;
     d) Remoção de entulho fora do canteiro, salvo se previsto em planilha;
     e) Fornecimento de materiais pelo CONTRATADO (exceto Empreitada Global);
     f) ARTs ou RRTs adicionais não previstas no escopo original;
     g) Administração financeira de terceiros contratados diretamente pelo
        CONTRATANTE sem supervisão do CONTRATADO;
     h) Alterações de projeto e upgrades de acabamento após a assinatura;
     i) Obras de infraestrutura externa ao terreno (ligações de água, esgoto,
        energia elétrica, calçada pública);
     j) Instalação de equipamentos especiais (ar-condicionado, elevadores,
        automação residencial) salvo previsão expressa.

${linha}
4. DO IMÓVEL
${linha}

4.1. A obra será executada no imóvel abaixo identificado:

     Tipo / Classificação: ${obra.tipo_obra} — ${obra.classificacao}
     Endereço:             ${obra.endereco || '[LOGRADOURO, NÚMERO, BAIRRO, CIDADE/UF]'}
     Setor: ${obra.setor||'—'} | Quadra: ${obra.quadra||'—'} | Lote: ${obra.lote||'—'}
     Inscrição imobiliária: ${obra.inscricao||'—'}
     Testada: ${obra.testada||'—'} m | Terreno: ${obra.area_terreno||'—'} m² | A construir: ${obra.area_construir||'—'} m²

4.2. O CONTRATANTE declara ser proprietário ou possuidor do imóvel,
     responsabilizando-se por restrições legais, administrativas ou de vizinhança.

${linha}
5. DO PRAZO DE EXECUÇÃO
${linha}

5.1. A execução terá prazo de [PRAZO] dias corridos, contados da emissão da
     ART/RRT junto ao CREA e do depósito da primeira parcela.

5.2. O prazo ficará automaticamente suspenso em caso de:
     a) Atraso no fornecimento de materiais imputável ao CONTRATANTE;
     b) Paralisação por autoridade pública;
     c) Força maior ou caso fortuito (art. 393 CC);
     d) Chuvas que impeçam a execução por mais de 3 dias consecutivos (RDO);
     e) Inadimplência financeira do CONTRATANTE por mais de 5 dias corridos.

${linha}
6. DO PREÇO E FORMA DE PAGAMENTO
${linha}

6.1. Valor total: ${financeiro.valor_total || '[R$ VALOR TOTAL]'} — ${tipo?.label.toLowerCase()},
     conforme planilha orçamentária (Anexo II).

6.2. Forma de pagamento:
     Entrada (assinatura): ${financeiro.entrada || '[R$ ENTRADA]'}
     Saldo devedor:        ${saldoCalc}
     Parcelamento:         ${nParc} parcelas mensais de ${valParc}
     Vencimento:           Dia ${financeiro.dia_vencimento||'10'} de cada mês (1º mês de obra)

6.3. Pagamentos via PIX/transferência:
     Beneficiário: ${APEX.nome} | CNPJ ${APEX.cnpj}
     Banco ${PAGAMENTO.banco} | Ag. ${PAGAMENTO.agencia} | C/C ${PAGAMENTO.conta}
     Chave PIX: ${PAGAMENTO.pix}

6.4. Atraso no pagamento gera: multa de 2% + juros de 1%/mês + INCC-M/IPCA.
     Após 5 (cinco) dias corridos de inadimplência, o CONTRATADO poderá
     SUSPENDER IMEDIATAMENTE os serviços, sem penalidade.

6.5. A entrada/sinal pago na assinatura é NÃO REEMBOLSÁVEL em caso de
     desistência injustificada do CONTRATANTE, servindo como indenização
     mínima pelos custos de mobilização e reserva de agenda do CONTRATADO.

${linha}
7. DO REAJUSTE DE PREÇOS
${linha}

7.1. Os valores serão reajustados anualmente pelo INCC-M (FGV).
7.2. Elevação de insumos acima de 15% (SINAPI/IBGE): revisão extraordinária
     negociada em 10 dias úteis.

${linha}
8. DOS SERVIÇOS EXTRAS E ADITIVOS
${linha}

8.1. Serviços não previstos no objeto original somente serão executados
     mediante:
     a) Solicitação ESCRITA do CONTRATANTE (e-mail, WhatsApp ou Termo Aditivo);
     b) Aprovação PRÉVIA E ESCRITA do orçamento, com valor e prazo definidos;
     c) Assinatura de Termo Aditivo antes do início da execução.

8.2. Autorizações VERBAIS NÃO são vinculantes. O CONTRATADO reserva-se o
     direito de não executar serviços extras sem autorização escrita prévia.

8.3. Alterações de projeto após o início da obra poderão implicar em revisão
     do prazo e do valor total, formalizadas por Termo Aditivo.

${linha}
9. DA MEDIÇÃO E APROVAÇÃO DOS SERVIÇOS
${linha}

9.1. O CONTRATADO realizará medições mensais dos serviços executados,
     apresentando relatório discriminado ao CONTRATANTE.

9.2. O CONTRATANTE terá prazo de 5 (cinco) dias úteis para aprovar,
     contestar ou solicitar complementação. Decorrido este prazo sem
     manifestação, a medição será TACITAMENTE APROVADA e o pagamento
     torna-se exigível.

9.3. Contestações parciais não suspendem o pagamento da parte não contestada.

${linha}
10. DAS OBRIGAÇÕES DO CONTRATADO
${linha}

10.1. Constituem obrigações do CONTRATADO:
     a) Executar com boa técnica (ABNT NBR 12721, 6118, 9050, 15575);
     b) Manter responsável técnico habilitado no local da obra;
     c) Elaborar e manter atualizado o Diário de Obra (RDO);
     d) Providenciar ART/RRT junto ao CREA antes do início das obras;
     e) Gerenciar equipe de mão de obra e subcontratados;
     f) Apresentar medições mensais detalhadas ao CONTRATANTE;
     g) Guardar documentos fiscais da obra por 5 (cinco) anos;
     h) Comunicar imediatamente fatos que afetem prazo, custo ou qualidade;
     i) Cumprir integralmente NR-18, NR-06, NR-10 e NR-35.
${isAdm ? `     j) Apresentar notas fiscais de todas as compras com verbas do CONTRATANTE;
     k) Não efetuar pagamentos acima de R$ 500,00 sem aprovação prévia.` : ''}

${linha}
11. DAS OBRIGAÇÕES DO CONTRATANTE
${linha}

11.1. Constituem obrigações do CONTRATANTE:
     a) Efetuar os pagamentos nas datas e condições pactuadas;
     b) Fornecer documentação do imóvel para licenciamento;
     c) Providenciar aprovações junto à Prefeitura e órgãos competentes
        (salvo se incluídas no objeto);
     d) Garantir livre acesso ao imóvel para execução dos serviços;
     e) Comunicar alterações de projeto com mínimo de 5 dias úteis, por escrito;
     f) Assinar o Diário de Obra quando solicitado;
     g) Não contratar diretamente funcionários ou subcontratados do CONTRATADO
        durante a vigência e por 12 meses após o término;
     h) Designar representante com poderes para aprovar medições e aditivos.
${isAdm ? `     i) Manter conta bancária específica para a obra;
     j) Aprovar previamente compras acima de R$ 500,00.` : ''}

${linha}
12. DA RESPONSABILIDADE TÉCNICA
${linha}

12.1. O CONTRATADO assume responsabilidade técnica conforme:

      Art. 618 do Código Civil (Lei 10.406/2002):
      "Nos contratos de empreitada de edifícios ou outras construções
      consideráveis, o empreiteiro de materiais e execução responderá,
      durante o prazo irredutível de cinco anos, pela solidez e segurança
      do trabalho, assim em razão dos materiais, como do solo."

12.2. Responsável técnico: ${ENG.nome} — CREA ${ENG.crea}
      ART/RRT nº: ___________________________ (a ser anotada)

${linha}
13. DOS VÍCIOS OCULTOS E CONDIÇÕES PREEXISTENTES
${linha}

13.1. Em obras de REFORMA, AMPLIAÇÃO ou ADAPTAÇÃO, o CONTRATADO NÃO
      responde por:
      a) Vícios ocultos da construção preexistente não detectáveis por
         inspeção visual (infiltrações latentes, fissuras estruturais ocultas,
         instalações fora de norma embutidas, fundações subdimensionadas);
      b) Danos decorrentes de estrutura, solo ou fundação preexistentes
         não declarados pelo CONTRATANTE;
      c) Inadequações de projeto não elaborado pelo CONTRATADO;
      d) Problemas de materiais fornecidos ou especificados pelo CONTRATANTE.

13.2. Constatada condição preexistente que afete a execução ou a segurança,
      o CONTRATADO notificará o CONTRATANTE por escrito e os serviços serão
      suspensos até solução, SEM PENALIDADE ao CONTRATADO.

13.3. Reformas são regidas pela NBR 16280:2015. O CONTRATANTE é responsável
      por obter todas as aprovações condominiais ou municipais exigidas.

${linha}
14. DA LIMITAÇÃO DE RESPONSABILIDADE
${linha}

14.1. O CONTRATADO NÃO SE RESPONSABILIZA por:
      a) Qualidade de materiais escolhidos, comprados ou fornecidos pelo
         CONTRATANTE;
      b) Serviços executados por terceiros contratados diretamente pelo
         CONTRATANTE sem supervisão do CONTRATADO;
      c) Danos por uso inadequado, falta de manutenção ou reformas não
         autorizadas após a entrega da obra;
      d) Perdas indiretas, lucros cessantes ou danos imateriais;
      e) Atrasos por greves, desabastecimento, pandemia ou força maior
         (art. 393 CC).

14.2. Propriedade intelectual de projetos, memoriais e especificações
      elaborados pelo CONTRATADO permanece com o CONTRATADO até o
      pagamento integral. O CONTRATANTE recebe licença de uso restrita
      à execução desta obra.

${linha}
15. DAS GARANTIAS DE EXECUÇÃO
${linha}

15.1. O CONTRATADO garante os serviços executados pelo prazo mínimo de:
      — 5 (cinco) anos: solidez estrutural e estanqueidade (art. 618 CC);
      — 3 (três) anos: impermeabilizações, inst. hidrossanitárias e elétricas
        (NBR 15575);
      — 1 (um) ano: revestimentos, pinturas e acabamentos em geral.

15.2. O prazo de garantia inicia-se na data do Termo de Entrega da Obra.
      A garantia não cobre danos por mau uso, falta de manutenção preventiva,
      reformas não autorizadas ou eventos de força maior.

${linha}
16. DO SEGURO DA OBRA
${linha}

16.1. Recomenda-se que o CONTRATANTE contrate seguro de Risco de Engenharia
      para cobertura de danos materiais e responsabilidade civil durante a
      execução. O CONTRATADO manterá apólice de RC Profissional vigente.

${linha}
17. DAS PENALIDADES E MULTAS
${linha}

17.1. Em caso de inadimplência:
      a) Multa compensatória: 10% sobre o valor total do contrato;
      b) Multa moratória: 0,5% ao dia sobre o valor da obrigação, limitada a 10%;
      c) Perdas e danos: arts. 402-404 do Código Civil.

17.2. Atraso injustificado superior a 30 dias: multa de 0,1%/dia sobre o
      valor total, limitada a 5%.

${linha}
18. DA RESCISÃO CONTRATUAL
${linha}

18.1. O contrato pode ser rescindido com notificação escrita de 15 (quinze)
      dias corridos por: descumprimento de cláusula; inadimplência superior
      a 30 dias; paralisação injustificada por mais de 15 dias; insolvência
      ou falência; acordo mútuo.

18.2. RESCISÃO PELO CONTRATANTE SEM JUSTA CAUSA:
      — Paga ao CONTRATADO o valor dos serviços executados e medidos;
      — A ENTRADA/SINAL é RETIDA INTEGRALMENTE pelo CONTRATADO como
        indenização mínima pelos custos de mobilização e perda de agenda;
      — Multa compensatória de 10% sobre o saldo contratual restante;
      — Despesas de desmobilização comprovadas.

18.3. RESCISÃO PELO CONTRATADO SEM JUSTA CAUSA:
      — Devolve materiais e equipamentos do CONTRATANTE;
      — Paga multa de 10% sobre o saldo contratual;
      — Garante continuidade mínima da obra por 30 dias.

18.4. Todos os documentos técnicos (projetos, RDO, planilhas, ARTs) serão
      entregues ao CONTRATANTE somente após quitação integral do contrato.

${linha}
19. DA SEGURANÇA E MEDICINA DO TRABALHO
${linha}

19.1. O CONTRATADO cumpre: NR-18 (Construção Civil), NR-06 (EPIs),
      NR-10 (Eletricidade), NR-35 (Trabalho em Altura).

19.2. O CONTRATADO é único responsável por acidentes com seus empregados
      e subcontratados, respondendo perante o INSS, FGTS e obrigações
      trabalhistas e previdenciárias.

${linha}
20. DA PROTEÇÃO DE DADOS PESSOAIS — LGPD
${linha}

20.1. As partes tratam dados pessoais em conformidade com a Lei 13.709/2018
      (LGPD), exclusivamente para: execução deste contrato; emissão de
      documentos fiscais; cumprimento de obrigações legais.

20.2. Nenhuma das partes compartilhará dados pessoais com terceiros sem
      consentimento prévio, salvo por determinação legal.

${linha}
21. DAS DISPOSIÇÕES GERAIS
${linha}

21.1. Alterações somente por Termo Aditivo escrito, assinado pelas partes
      e por duas testemunhas.
21.2. Tolerância de descumprimento não importa em novação ou renúncia.
21.3. Casos omissos regidos pelo Código Civil Brasileiro (Lei 10.406/2002).
21.4. Foro eleito: Comarca de Promissão/SP, renunciando-se a qualquer outro.

      ${sep}
      Promissão / SP, _____ de _________________ de _________

${sep}
22. DAS ASSINATURAS
${sep}

_______________________________________________   _______________________________________________
${(parte.nome||'[NOME DO CONTRATANTE]').toUpperCase().slice(0,44).padEnd(44)}   ${ENG.nome.toUpperCase().slice(0,44)}
CPF: ${parte.cpf||'[CPF DO CONTRATANTE]'}                            CPF: ${ENG.cpf}  CREA: ${ENG.crea}
CONTRATANTE                                       CONTRATADO


_______________________________________________   _______________________________________________
TESTEMUNHA 1                                      TESTEMUNHA 2
Nome: ________________________________            Nome: ________________________________
RG:   ________________________________            RG:   ________________________________`
  }

  const etapas = ['Tipo', 'Contratado', 'Partes', 'Objeto', 'Valores', 'Revisão IA', 'Contrato', 'Memorial']

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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', border: '1px solid #e5e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => { setIdioma('pt-BR'); setEtapa(1) }} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, background: idioma === 'pt-BR' ? '#185FA5' : '#fff', color: idioma === 'pt-BR' ? '#fff' : '#8b93a7' }}>🇧🇷 PT-BR</button>
              <button onClick={() => { setIdioma('en-US'); setEtapa(1) }} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, background: idioma === 'en-US' ? '#0F4C81' : '#fff', color: idioma === 'en-US' ? '#fff' : '#8b93a7' }}>🇺🇸 EN-US</button>
            </div>
            {idioma === 'pt-BR' && (
              <div style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: modoContratado === 'apex' ? '#E6F1FB' : '#EAF3DE', color: modoContratado === 'apex' ? '#185FA5' : '#3B6D11' }}>
                {modoContratado === 'apex' ? `${APEX.nome} · CNPJ ${APEX.cnpj}` : `${ENG.nome} · Pessoa Física`}
              </div>
            )}
            {idioma === 'en-US' && (
              <div style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: '#E8F0F9', color: '#0F4C81' }}>
                {ATLAS_US.company} · {ATLAS_US.license}
              </div>
            )}
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
          {etapa === 1 && idioma === 'pt-BR' && (
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

          {/* ─── ETAPA 1 (EN-US): Contract Type ───────────── */}
          {etapa === 1 && idioma === 'en-US' && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>📄 Contract Type</div>
                <div style={{ padding: '8px 12px', background: '#E8F0F9', borderRadius: 8, fontSize: 12, color: '#0F4C81', marginBottom: 14, fontWeight: 500 }}>
                  🇺🇸 US Market — English contract with applicable US law (AIA standards, UCC, OSHA, state construction lien laws)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {US_CONTRACT_TYPES.map(t => (
                    <div key={t.id} onClick={() => setUsTipo(t.id)} style={{ ...s.tipoCard(usTipoContrato === t.id), borderColor: usTipoContrato === t.id ? '#0F4C81' : '#e5e8f0', background: usTipoContrato === t.id ? '#E8F0F9' : '#fff' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: usTipoContrato === t.id ? '#0F4C81' : '#1a1f36' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#8b93a7', marginTop: 3 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ ...s.btnPrimary, background: '#0F4C81' }} onClick={() => setEtapa(2)}>Next: Owner Info →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 2 (EN-US): Owner Info ──────────────── */}
          {etapa === 2 && idioma === 'en-US' && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>👤 Owner / Client Information</div>
                <div style={s.grid2}>
                  <div style={s.field}><label style={s.label}>Full Name *</label>
                    <input style={s.input} placeholder="John Smith" value={usParty.name} onChange={e => setUsParty(p => ({...p, name: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>Company (if applicable)</label>
                    <input style={s.input} placeholder="Smith Development LLC" value={usParty.company} onChange={e => setUsParty(p => ({...p, company: e.target.value}))} /></div>
                </div>
                <div style={s.grid2}>
                  <div style={s.field}><label style={s.label}>EIN / SSN (last 4)</label>
                    <input style={s.input} placeholder="XX-XXXXXXX" value={usParty.ein} onChange={e => setUsParty(p => ({...p, ein: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>Contractor License #</label>
                    <input style={s.input} placeholder="GC-XXXXXXXX (if Owner-Builder)" value={usParty.license} onChange={e => setUsParty(p => ({...p, license: e.target.value}))} /></div>
                </div>
                <div style={s.field}><label style={s.label}>Street Address</label>
                  <input style={s.input} placeholder="123 Main Street" value={usParty.address} onChange={e => setUsParty(p => ({...p, address: e.target.value}))} /></div>
                <div style={{ ...s.grid3, marginTop: 8 }}>
                  <div style={s.field}><label style={s.label}>City</label>
                    <input style={s.input} placeholder="Dallas" value={usParty.city} onChange={e => setUsParty(p => ({...p, city: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>State</label>
                    <select style={s.select} value={usParty.state} onChange={e => setUsParty(p => ({...p, state: e.target.value}))}>
                      {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>ZIP Code</label>
                    <input style={s.input} placeholder="75201" value={usParty.zip} onChange={e => setUsParty(p => ({...p, zip: e.target.value}))} /></div>
                </div>
                <div style={s.grid2}>
                  <div style={s.field}><label style={s.label}>Phone</label>
                    <input style={s.input} placeholder="(214) 555-0100" value={usParty.phone} onChange={e => setUsParty(p => ({...p, phone: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>Email</label>
                    <input style={s.input} placeholder="owner@email.com" value={usParty.email} onChange={e => setUsParty(p => ({...p, email: e.target.value}))} /></div>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏢 Contractor (Pre-filled — Atlas)</div>
                <div style={{ padding: '10px 14px', background: '#E8F0F9', borderRadius: 8, fontSize: 12, color: '#0F4C81' }}>
                  <strong>{ATLAS_US.company}</strong> · {ATLAS_US.license} · EIN {ATLAS_US.ein}<br />
                  {ATLAS_US.address}<br />
                  Licensed PE: {ATLAS_US.rep} · {ATLAS_US.pe_license}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(1)}>← Back</button>
                <button style={{ ...s.btnPrimary, background: '#0F4C81' }} onClick={() => setEtapa(3)}>Next: Project Info →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 2: Quem é o CONTRATADO ─────────────── */}
          {etapa === 2 && idioma === 'pt-BR' && (
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

          {/* ─── ETAPA 3 (EN-US): Project Info ────────────── */}
          {etapa === 3 && idioma === 'en-US' && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏗️ Project Information</div>
                <div style={s.field}><label style={s.label}>Project Description *</label>
                  <input style={s.input} placeholder="New residential construction, 2,800 SF, 4 bed / 3 bath" value={usProject.description} onChange={e => setUsProject(p => ({...p, description: e.target.value}))} /></div>

                <div style={{ ...s.field, marginTop: 10 }}><label style={s.label}>Construction Type</label>
                  <select style={s.select} value={usProject.constructionType} onChange={e => setUsProject(p => ({...p, constructionType: e.target.value}))}>
                    {US_CONSTRUCTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                <div style={{ ...s.field, marginTop: 10 }}>
                  <label style={s.label}>Construction Systems & Scope Items (select all that apply)</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:6 }}>
                    {US_RESIDENTIAL_SYSTEMS.map(sys => (
                      <label key={sys} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12,
                        padding:'4px 8px', borderRadius:6, cursor:'pointer',
                        background: usProject.systems.includes(sys) ? '#E6F1FB' : '#f8f9fa',
                        border: usProject.systems.includes(sys) ? '1px solid #185FA5' : '1px solid #e5e8f0' }}>
                        <input type="checkbox" checked={usProject.systems.includes(sys)}
                          onChange={e => setUsProject(p => ({...p,
                            systems: e.target.checked ? [...p.systems, sys] : p.systems.filter(s => s !== sys)
                          }))} style={{ accentColor:'#185FA5' }} />
                        {sys}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ ...s.field, marginTop: 10 }}><label style={s.label}>Scope of Work</label>
                  <textarea style={s.textarea} placeholder="Full scope per plans and specifications attached as Exhibit A..." value={usProject.scope} onChange={e => setUsProject(p => ({...p, scope: e.target.value}))} /></div>
                <div style={{ ...s.field, marginTop: 10 }}><label style={s.label}>Project Address</label>
                  <input style={s.input} placeholder="456 Oak Lane" value={usProject.address} onChange={e => setUsProject(p => ({...p, address: e.target.value}))} /></div>
                <div style={{ ...s.grid3, marginTop: 8 }}>
                  <div style={s.field}><label style={s.label}>City</label>
                    <input style={s.input} placeholder="Dallas" value={usProject.city} onChange={e => setUsProject(p => ({...p, city: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>State</label>
                    <select style={s.select} value={usProject.state} onChange={e => setUsProject(p => ({...p, state: e.target.value}))}>
                      {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>ZIP Code</label>
                    <input style={s.input} placeholder="75201" value={usProject.zip} onChange={e => setUsProject(p => ({...p, zip: e.target.value}))} /></div>
                </div>
                <div style={s.grid2}>
                  <div style={s.field}><label style={s.label}>Start Date</label>
                    <input style={s.input} type="date" value={usProject.startDate} onChange={e => setUsProject(p => ({...p, startDate: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>Target Completion</label>
                    <input style={s.input} type="date" value={usProject.endDate} onChange={e => setUsProject(p => ({...p, endDate: e.target.value}))} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(2)}>← Back</button>
                <button style={{ ...s.btnPrimary, background: '#0F4C81' }} onClick={() => setEtapa(5)}>Next: Financials →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 3: Partes ───────────────────────────── */}
          {etapa === 3 && idioma === 'pt-BR' && (
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
          {etapa === 4 && idioma === 'pt-BR' && (
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
          {etapa === 5 && idioma === 'pt-BR' && (
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

          {/* ─── ETAPA 5 (EN-US): Financials ──────────────── */}
          {etapa === 5 && idioma === 'en-US' && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>💰 Contract Value & Payment Terms</div>
                <div style={s.grid2}>
                  <div style={s.field}><label style={s.label}>Contract Value ($) *</label>
                    <input style={s.input} placeholder="185,000" value={usFinancial.contractValue} onChange={e => setUsFinancial(p => ({...p, contractValue: e.target.value}))} /></div>
                  <div style={s.field}><label style={s.label}>Deposit / Down Payment ($)</label>
                    <input style={s.input} placeholder="18,500" value={usFinancial.deposit} onChange={e => setUsFinancial(p => ({...p, deposit: e.target.value}))} /></div>
                </div>
                <div style={s.grid3}>
                  <div style={s.field}><label style={s.label}>Payment Milestones</label>
                    <select style={s.select} value={usFinancial.milestones} onChange={e => setUsFinancial(p => ({...p, milestones: e.target.value}))}>
                      {['2','3','4','5','Monthly'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>Payment Terms</label>
                    <select style={s.select} value={usFinancial.paymentTerms} onChange={e => setUsFinancial(p => ({...p, paymentTerms: e.target.value}))}>
                      {['Net 7','Net 15','Net 30','Net 45','Due on Receipt'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div style={s.field}><label style={s.label}>Retainage %</label>
                    <select style={s.select} value={usFinancial.retainage} onChange={e => setUsFinancial(p => ({...p, retainage: e.target.value}))}>
                      {['5','10','15','0'].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select></div>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>🏦 Payment To</div>
                <div style={{ padding: '10px 14px', background: '#E8F0F9', borderRadius: 8, fontSize: 12, color: '#0F4C81' }}>
                  <strong>{ATLAS_US.company}</strong> · EIN {ATLAS_US.ein}<br />
                  ACH / Wire: Please request banking details via email · Checks payable to: Atlas Construction Intelligence LLC
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(3)}>← Back</button>
                <button style={{ ...s.btnPrimary, background: '#0F4C81' }} onClick={() => setEtapa(6)}>Next: AI Review →</button>
              </div>
            </>
          )}

          {/* ─── ETAPA 6: Revisão IA ───────────────────────── */}
          {etapa === 6 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>🤖 {idioma === 'en-US' ? 'AI Legal Review' : 'Agente Jurídico IA'}</div>
                <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 16, lineHeight: 1.6 }}>
                  {idioma === 'en-US'
                    ? 'AI reviews the contract for compliance with US construction law (AIA standards, state lien law, OSHA, UCC), identifies risks, and suggests improvements.'
                    : 'O agente analisa o contrato, verifica conformidade com o Código Civil, aponta riscos e sugere melhorias.'}
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
              {idioma === 'pt-BR' && (
                <div style={s.card}>
                  <div style={s.sectionTitle}>👁 Pré-visualização</div>
                  <div style={s.previewBox}>{gerarContrato()}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(5)}>← {idioma === 'en-US' ? 'Back' : 'Voltar'}</button>
                <button style={{ ...s.btnPrimary, background: idioma === 'en-US' ? '#0F4C81' : '#185FA5' }} onClick={() => setEtapa(7)}>
                  {idioma === 'en-US' ? 'Generate Contract →' : 'Gerar contrato final →'}
                </button>
              </div>
            </>
          )}

          {/* ─── ETAPA 7: Contrato final ───────────────────── */}
          {etapa === 7 && idioma === 'en-US' && (
            <>
              <div style={{ ...s.card, borderColor: '#2D7A4F', background: '#f0f8f4' }} className="no-print">
                <div style={{ fontSize: 18, marginBottom: 4 }}>✅ US Contract — 16 Clauses Ready!</div>
                <div style={{ fontSize: 13, color: '#5a6282' }}>
                  Owner: <strong>{usParty.name || '[Owner]'}</strong> · Contractor: <strong>{ATLAS_US.company}</strong>
                  {' '}· Governing Law: <strong>{usProject.state || 'TX'}</strong>
                  {' '}· Covers: AIA standards, OSHA, UCC, {(usProject.state || 'TX')} lien law
                </div>
              </div>
              <div style={{ ...s.card, padding: '24px 32px' }} className="print-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #0F4C81' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F4C81' }}>{ATLAS_US.company}</div>
                    <div style={{ fontSize: 11, color: '#5C7A99' }}>{ATLAS_US.license} · EIN {ATLAS_US.ein} · {ATLAS_US.pe_license}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2b3c' }}>
                      {US_CONTRACT_TYPES.find(t => t.id === usTipoContrato)?.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: '#5C7A99' }}>16 clauses · US Law</div>
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: buildUSContractHtml() }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }} className="no-print">
                <button style={s.btnSecondary} onClick={() => setEtapa(6)}>← Back</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btnSecondary} onClick={() => {
                    const name = (usParty.name || 'contract').replace(/\s+/g,'_')
                    const html = `<!DOCTYPE html><html lang="en-US"><head><meta charset="UTF-8"><title>Contract — ${usParty.name}</title>
<style>body{font-family:'Calibri',Arial,sans-serif;font-size:12pt;margin:2cm;color:#000}
h2{font-size:11pt;font-weight:bold;text-transform:uppercase;color:#0F4C81;margin:18pt 0 6pt;border-bottom:1pt solid #0F4C81;padding-bottom:2pt}
p{margin:4pt 0 8pt;line-height:1.6}ul{margin:6pt 0;padding-left:20pt}li{margin:3pt 0}</style>
</head><body>${buildUSContractHtml()}</body></html>`
                    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                    a.download = `contract_${name}.doc`; a.click()
                  }}>💾 Save .doc (Word)</button>
                  <button style={{ ...s.btnSecondary, color: '#0F4C81', borderColor: '#0F4C81' }} onClick={() => {
                    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return
                    w.document.write(`<!DOCTYPE html><html lang="en-US"><head><meta charset="UTF-8"><title>Contract — ${usParty.name}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a2b3c;padding:32px;max-width:800px;margin:0 auto}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0F4C81;margin:20px 0 6px;border-bottom:1px solid #d0dcea;padding-bottom:4px}
p{margin:4px 0 8px;line-height:1.7}ul{margin:6px 0;padding-left:20px}li{margin:3px 0}
@media print{body{padding:16px}@page{margin:1cm}}</style>
</head><body>${buildUSContractHtml()}
<script>window.onload=()=>window.print()<\/script></body></html>`)
                    w.document.close()
                  }}>🖨️ Print / PDF</button>
                </div>
              </div>
            </>
          )}

          {etapa === 7 && idioma === 'pt-BR' && (
            <>
              <div style={{ ...s.card, borderColor: '#97C459', background: '#f7fbf0' }} className="no-print">
                <div style={{ fontSize: 18, marginBottom: 4 }}>✅ Contrato com 22 cláusulas pronto!</div>
                <div style={{ fontSize: 13, color: '#5a6282' }}>
                  Assinado por: <strong>{modoContratado === 'apex' ? APEX.nome : ENG.nome}</strong>
                  {modoContratado === 'apex' ? ` (CNPJ ${APEX.cnpj})` : ` (CREA ${ENG.crea})`}
                  {' '}· Inclui cláusulas de proteção: vícios ocultos, serviços extras, limitação de responsabilidade.
                </div>
              </div>

              {/* Contrato renderizado em HTML formatado */}
              <div style={{ ...s.card, padding: '24px 32px' }} className="print-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #185FA5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {modoContratado === 'apex' && (
                      <img src="/logo_apex_nova.jpeg" alt="Apex Global"
                        style={{ height: 52, borderRadius: 6 }}
                        onError={(e: any) => e.target.style.display = 'none'} />
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#185FA5' }}>
                        {modoContratado === 'apex' ? APEX.nome : ENG.nome}
                      </div>
                      <div style={{ fontSize: 11, color: '#8b93a7' }}>
                        {modoContratado === 'apex' ? `CNPJ ${APEX.cnpj}` : `CREA ${ENG.crea} · CPF ${ENG.cpf}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1f36' }}>CONTRATO COMPLETO · 22 CLÁUSULAS</div>
                    <div style={{ fontSize: 11, color: '#8b93a7' }}>{TIPOS_CONTRATO.find(t => t.id === tipoContrato)?.label}</div>
                  </div>
                </div>

                {/* HTML do contrato */}
                <div dangerouslySetInnerHTML={{ __html: buildContratoHtml() }} />

                {/* Bloco de assinaturas */}
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e8f0' }}>
                  <div style={{ fontSize: 12, color: '#5a6282', marginBottom: 24 }}>
                    Promissão / SP, ________ / ________ / ____________
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
                    <div>
                      <div style={{ borderTop: '2px solid #1a1f36', paddingTop: 8, marginBottom: 4 }} />
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{parte.nome || '[NOME DO CONTRATANTE]'}</div>
                      <div style={{ fontSize: 12, color: '#5a6282' }}>CPF: {parte.cpf || '___________________'}</div>
                      {parte.rg && <div style={{ fontSize: 12, color: '#5a6282' }}>RG: {parte.rg}</div>}
                      <div style={{ fontWeight: 700, marginTop: 6, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>CONTRATANTE</div>
                    </div>
                    <div>
                      <div style={{ borderTop: '2px solid #1a1f36', paddingTop: 8, marginBottom: 4 }} />
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{modoContratado === 'apex' ? APEX.nome : ENG.nome}</div>
                      {modoContratado === 'apex' ? (
                        <><div style={{ fontSize: 12, color: '#5a6282' }}>CNPJ: {APEX.cnpj}</div>
                        <div style={{ fontSize: 12, color: '#5a6282' }}>Rep.: {APEX.representante}</div></>
                      ) : (
                        <><div style={{ fontSize: 12, color: '#5a6282' }}>CPF: {ENG.cpf}</div>
                        <div style={{ fontSize: 12, color: '#5a6282' }}>CREA: {ENG.crea}</div></>
                      )}
                      <div style={{ fontWeight: 700, marginTop: 6, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>CONTRATADO</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                    {['TESTEMUNHA 1', 'TESTEMUNHA 2'].map(t => (
                      <div key={t}>
                        <div style={{ borderTop: '1.5px solid #1a1f36', paddingTop: 8, marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.08em' }}>{t}</div>
                        <div style={{ fontSize: 12, color: '#5a6282', marginTop: 4 }}>Nome: _________________________</div>
                        <div style={{ fontSize: 12, color: '#5a6282', marginTop: 4 }}>RG: ___________________________</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }} className="no-print">
                <button style={s.btnSecondary} onClick={() => setEtapa(6)}>← Voltar</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btnSecondary}
                    onClick={() => {
                      const nomeArq = (parte.nome || 'contrato').replace(/\s+/g,'_')
                      const docHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Contrato — ${parte.nome}</title>
<style>body{font-family:'Calibri',Arial,sans-serif;font-size:12pt;margin:2cm;color:#000}
h1{font-size:16pt;color:#185FA5;text-align:center}
h2{font-size:11pt;font-weight:bold;text-transform:uppercase;color:#185FA5;margin:18pt 0 6pt;border-bottom:1pt solid #185FA5;padding-bottom:2pt}
p{margin:4pt 0 8pt;line-height:1.6}ul{margin:6pt 0;padding-left:20pt}li{margin:3pt 0}</style>
</head><body>${buildContratoHtml()}</body></html>`
                      const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = `contrato_${nomeArq}.doc`
                      a.click()
                    }}>💾 Salvar .doc (Word)</button>
                  <button style={{ ...s.btnSecondary, color: '#185FA5', borderColor: '#185FA5' }}
                    onClick={() => {
                      const w = window.open('', '_blank', 'width=900,height=700')
                      if (!w) return
                      w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Contrato — ${parte.nome}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1f36;padding:32px;max-width:800px;margin:0 auto}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#185FA5;margin:20px 0 6px;border-bottom:1px solid #e5e8f0;padding-bottom:4px}
p{margin:4px 0 8px;line-height:1.7}ul{margin:6px 0;padding-left:20px}li{margin:3px 0}
.footer{margin-top:32px;border-top:1px solid #e5e8f0;padding-top:12px;font-size:10px;color:#b0b8cc;display:flex;justify-content:space-between}
@media print{body{padding:16px}@page{margin:1cm}}</style>
</head><body>${buildContratoHtml()}
<div class="footer"><span>${modoContratado === 'apex' ? APEX.nome + ' — CNPJ ' + APEX.cnpj : ENG.nome + ' — CREA ' + ENG.crea}</span><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span></div>
<script>window.onload=()=>window.print()</script></body></html>`)
                      w.document.close()
                    }}>🖨️ Imprimir / PDF</button>
                  <button style={s.btnPrimary} onClick={() => { setMemorial(''); setEtapa(8) }}>
                    📐 Gerar Memorial Descritivo →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── ETAPA 8: Memorial Descritivo ──────────────── */}
          {etapa === 8 && (
            <>
              <div style={s.card}>
                <div style={s.sectionTitle}>📐 Memorial Descritivo da Obra <span style={s.autoBadge}>IA Claude</span></div>
                <div style={{ fontSize: 13, color: '#5a6282', marginBottom: 14, lineHeight: 1.6 }}>
                  O agente gera um memorial técnico completo conforme <strong>NBR 12721</strong>, com todas as seções obrigatórias (fundações, estrutura, instalações, revestimentos etc.) usando os dados do contrato.
                </div>
                {!memorial && (
                  <button style={{ ...s.btnPrimary, width: '100%', padding: 12, fontSize: 14 }}
                    onClick={gerarMemorial} disabled={gerandoMemorial}>
                    {gerandoMemorial ? '⏳ Gerando memorial técnico...' : '📐 Gerar Memorial Descritivo com IA'}
                  </button>
                )}
              </div>

              {memorial && (
                <>
                  <div style={{ ...s.card, borderColor: '#97C459', background: '#f7fbf0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11' }}>✅ Memorial gerado!</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.btnSecondary}
                          onClick={() => {
                            const nomeArq = (parte.nome||'memorial').replace(/\s+/g,'_')
                            const docHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Memorial — ${parte.nome}</title>
<style>body{font-family:'Calibri',Arial,sans-serif;font-size:12pt;margin:2cm;line-height:1.7}
h1{font-size:16pt;color:#185FA5}h2{font-size:12pt;color:#185FA5;margin:16pt 0 6pt}
p{margin:4pt 0}pre{font-family:inherit;white-space:pre-wrap}</style>
</head><body><h1>Memorial Descritivo</h1><pre>${memorial}</pre></body></html>`
                            const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' })
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(blob)
                            a.download = `memorial_${nomeArq}.doc`
                            a.click()
                          }}>💾 Salvar .doc</button>
                        <button style={{ ...s.btnSecondary, color: '#185FA5', borderColor: '#185FA5' }}
                          onClick={() => {
                            const w = window.open('', '_blank', 'width=900,height=700')
                            if (!w) return
                            w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Memorial Descritivo</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;padding:32px;max-width:800px;margin:0 auto;white-space:pre-wrap;line-height:1.8}
h1{font-size:18px;color:#185FA5;margin-bottom:16px}
.footer{margin-top:32px;border-top:1px solid #e5e8f0;padding-top:12px;font-size:10px;color:#8b93a7}
@media print{@page{margin:1cm}}</style>
</head><body><h1>📐 Memorial Descritivo</h1>${memorial.replace(/\n/g,'<br>')}
<div class="footer">${ENG.nome} — CREA ${ENG.crea} · Gerado em ${new Date().toLocaleString('pt-BR')}</div>
<script>window.onload=()=>window.print()</script></body></html>`)
                            w.document.close()
                          }}>🖨️ Imprimir</button>
                        <button style={s.btnSecondary} onClick={gerarMemorial}>🔄 Regenerar</button>
                      </div>
                    </div>
                    <div style={s.previewBox}>{memorial}</div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button style={s.btnSecondary} onClick={() => setEtapa(7)}>← Voltar ao Contrato</button>
                <button style={s.btnPrimary} onClick={() => router.push('/dashboard')}>🏠 Ir ao Dashboard</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
