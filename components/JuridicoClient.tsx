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

  // ─── Gera contrato completo com 16 cláusulas ───────────────
  const gerarContrato = () => {
    const tipo  = TIPOS_CONTRATO.find(t => t.id === tipoContrato)
    const sep   = '═'.repeat(56)
    const linha = '─'.repeat(56)
    const hoje  = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
    const isAdm = tipoContrato === 'administracao'
    const isEmp = tipoContrato === 'empreitada'

    // Calcula saldo automaticamente se possível
    const valTotal = parseFloat((financeiro.valor_total || '0').replace(/\D/g, '')) || 0
    const valEntr  = parseFloat((financeiro.entrada || '0').replace(/\D/g, '')) || 0
    const saldoCalc = valTotal > 0 && valEntr > 0 ? `R$ ${(valTotal - valEntr).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : (financeiro.saldo || '[SALDO DEVEDOR]')
    const nParc = parseInt(financeiro.parcelas) || 10
    const valParc = valTotal > 0 && valEntr > 0 && nParc > 0
      ? `R$ ${((valTotal - valEntr) / nParc).toLocaleString('pt-BR', {minimumFractionDigits:2})}`
      : (financeiro.valor_parcela || '[VALOR DA PARCELA]')

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

     ${obra.descricao || `${obra.tipo_obra} — ${obra.classificacao}, conforme projeto arquitetônico, projetos complementares (estrutural, elétrico, hidrossanitário) e Memorial Descritivo aprovados, que integram este contrato como Anexo I.`}

${isAdm ? `2.2. No regime de ADMINISTRAÇÃO A PREÇO DE CUSTO, cabe ao CONTRATANTE o
     fornecimento de todos os materiais de construção, sendo o CONTRATADO
     remunerado exclusivamente pela administração, mão de obra e gerenciamento.` :
isEmp ? `2.2. No regime de EMPREITADA GLOBAL, o CONTRATADO fornece toda a mão de
     obra, materiais e equipamentos necessários, responsabilizando-se pelo
     resultado final da obra conforme especificações técnicas acordadas.` :
`2.2. Os serviços serão executados conforme especificações técnicas e
     cronograma físico aprovados pelas partes.`}

${linha}
3. DO IMÓVEL
${linha}

3.1. A obra objeto deste contrato será executada no imóvel com as seguintes
     características:

     Tipo / Classificação:   ${obra.tipo_obra} — ${obra.classificacao}
     Endereço completo:      ${obra.endereco || '[LOGRADOURO, NÚMERO, BAIRRO, CIDADE/UF]'}
     Setor: ${obra.setor || '—'}  |  Quadra: ${obra.quadra || '—'}  |  Lote: ${obra.lote || '—'}
     Inscrição imobiliária:  ${obra.inscricao || '—'}
     Testada:                ${obra.testada || '—'} m
     Área do terreno:        ${obra.area_terreno || '—'} m²
     Área a construir:       ${obra.area_construir || '—'} m²

3.2. O CONTRATANTE declara ser proprietário ou possuidor do imóvel
     descrito acima, responsabilizando-se por eventuais restrições legais,
     administrativas ou de vizinhança que possam afetar a execução da obra.

${linha}
4. DO PRAZO DE EXECUÇÃO
${linha}

4.1. A execução dos serviços terá prazo de [PRAZO] dias corridos, contados
     a partir da data de emissão da Anotação de Responsabilidade Técnica — ART/RRT
     junto ao CREA/CAU e do depósito da primeira parcela.

4.2. O cronograma físico-financeiro detalhado consta do Anexo II, podendo
     ser reprogramado de comum acordo entre as partes, mediante aditivo escrito.

4.3. O prazo ficará automaticamente suspenso em caso de:
     a) Atraso no fornecimento de materiais imputável ao CONTRATANTE;
     b) Paralisação por determinação de autoridade pública;
     c) Eventos de força maior ou caso fortuito (art. 393 do Código Civil);
     d) Chuvas que impeçam a execução por período superior a 3 (três) dias
        consecutivos, devidamente registradas no Diário de Obra (RDO).

4.4. O descumprimento injustificado do prazo pelo CONTRATADO sujeita-o à
     multa prevista na Cláusula 12 deste instrumento.

${linha}
5. DO PREÇO E FORMA DE PAGAMENTO
${linha}

5.1. O valor total contratado é de ${financeiro.valor_total || '[R$ VALOR TOTAL]'},
     correspondente à ${tipo?.label.toLowerCase()}, conforme planilha orçamentária
     (Anexo III), que integra este contrato.

5.2. Forma de pagamento:

     Entrada (assinatura do contrato): ${financeiro.entrada || '[R$ VALOR DA ENTRADA]'}
     Saldo devedor:  ${saldoCalc}
     Parcelamento:   ${nParc} parcelas mensais de ${valParc}
     Vencimento:     Dia ${financeiro.dia_vencimento || '10'} de cada mês, a partir do 1º mês de obra.

5.3. Pagamentos deverão ser realizados via PIX ou transferência bancária:

     Beneficiário: ${modoContratado === 'apex' ? APEX.nome + ' — CNPJ ' + APEX.cnpj : ENG.nome + ' — CPF ' + ENG.cpf}
     Banco ${PAGAMENTO.banco}  |  Agência ${PAGAMENTO.agencia}  |  C/C ${PAGAMENTO.conta}
     Chave PIX: ${PAGAMENTO.pix}

5.4. O CONTRATANTE que atrasar o pagamento por mais de 5 (cinco) dias
     corridos ficará sujeito a:
     — Multa moratória de 2% (dois por cento) sobre o valor da parcela;
     — Juros de mora de 1% (um por cento) ao mês (pro rata die);
     — Correção monetária pelo INCC-M (FGV) ou IPCA/IBGE, o que for maior.

5.5. O CONTRATADO poderá suspender os serviços após 15 (quinze) dias de
     inadimplência, sem que tal suspensão configure descumprimento contratual.

${linha}
6. DO REAJUSTE DE PREÇOS
${linha}

6.1. Os valores contratados serão reajustados anualmente pelo índice do
     INCC-M (Índice Nacional de Custo da Construção — FGV), medido no
     período entre a data de assinatura e a data de reajuste.

6.2. Em caso de elevação de insumos acima de 15% (quinze por cento)
     verificada pelo SINAPI (IBGE), as partes se comprometem a negociar
     revisão extraordinária no prazo de 10 (dez) dias úteis.

6.3. O reajuste não se aplica às parcelas já vencidas e não pagas
     em decorrência de inadimplência do CONTRATANTE.

${linha}
7. DAS OBRIGAÇÕES DO CONTRATADO
${linha}

7.1. Constituem obrigações do CONTRATADO:

     a) Executar os serviços com boa técnica, primando pela qualidade,
        observando as normas técnicas da ABNT, especialmente NBR 12721,
        NBR 6118, NBR 9050 e NBR 15575 (quando aplicável);
     b) Manter responsável técnico habilitado no local da obra;
     c) Elaborar e manter atualizado o Diário de Obra (RDO);
     d) Providenciar a Anotação de Responsabilidade Técnica — ART/RRT junto
        ao CREA/CAU antes do início das obras;
     e) Gerenciar a equipe de mão de obra e subcontratados;
     f) Fiscalizar a qualidade dos serviços executados por terceiros;
     g) Apresentar medições mensais detalhadas ao CONTRATANTE;
     h) Guardar todos os documentos fiscais relativos à obra pelo prazo de
        5 (cinco) anos;
     i) Comunicar imediatamente o CONTRATANTE sobre qualquer fato que
        possa afetar prazo, custo ou qualidade da obra;
     j) Cumprir integralmente as normas de segurança do trabalho (NR-18).

${isAdm ? `7.2. No regime de Administração a Preço de Custo, o CONTRATADO obriga-se
     ainda a: (i) apresentar notas fiscais e recibos de todas as compras
     realizadas com verbas do CONTRATANTE; (ii) não efetuar pagamentos sem
     prévia aprovação do CONTRATANTE para valores superiores a R$ 500,00.` : ''}

${linha}
8. DAS OBRIGAÇÕES DO CONTRATANTE
${linha}

8.1. Constituem obrigações do CONTRATANTE:

     a) Efetuar os pagamentos nas datas e condições pactuadas;
     b) Fornecer a documentação do imóvel necessária ao licenciamento;
     c) Providenciar os projetos e aprovações junto à Prefeitura e órgãos
        competentes, salvo se expressamente incluídos no objeto deste contrato;
     d) Garantir livre acesso ao imóvel para execução dos serviços;
     e) Comunicar ao CONTRATADO qualquer alteração de projeto com
        antecedência mínima de 5 (cinco) dias úteis;
     f) Assinar o Diário de Obra quando solicitado;
     g) Não contratar diretamente os funcionários ou subcontratados do
        CONTRATADO durante a vigência e por 12 (doze) meses após o término.

${isAdm ? `8.2. No regime de Administração a Preço de Custo, o CONTRATANTE obriga-se
     a: (i) destinar verba separada para aquisição de materiais; (ii)
     aprovar previamente as requisições de compra acima de R$ 500,00;
     (iii) manter conta bancária específica para a obra.` : ''}

${linha}
9. DA RESPONSABILIDADE TÉCNICA
${linha}

9.1. O CONTRATADO assume a responsabilidade técnica pelos serviços de
     engenharia executados, conforme:

     Art. 618 do Código Civil Brasileiro (Lei 10.406/2002):
     "Nos contratos de empreitada de edifícios ou outras construções
     consideráveis, o empreiteiro de materiais e execução responderá,
     durante o prazo irredutível de cinco anos, pela solidez e segurança
     do trabalho, assim em razão dos materiais, como do solo."

9.2. Responsável técnico: ${ENG.nome} — CREA ${ENG.crea}
     ART/RRT nº: _________________________________ (a ser anotada)

9.3. A responsabilidade civil do CONTRATADO por danos a terceiros, vizinhos
     ou à via pública causados pela execução da obra é de sua exclusividade,
     nos termos do art. 927 do Código Civil.

${linha}
10. DAS GARANTIAS DE EXECUÇÃO
${linha}

10.1. O CONTRATADO garante a qualidade dos serviços executados pelo prazo
      mínimo de:
      — 5 (cinco) anos: solidez estrutural e estanqueidade (art. 618 CC);
      — 3 (três) anos: impermeabilizações, instalações hidrossanitárias
        e elétricas (NBR 15575);
      — 1 (um) ano: revestimentos, pinturas e acabamentos em geral.

10.2. O prazo de garantia inicia-se na data do Termo de Entrega da Obra,
      firmado por ambas as partes.

10.3. A garantia não cobre danos decorrentes de mau uso, ausência de
      manutenção preventiva, reformas não autorizadas ou eventos de
      força maior.

${linha}
11. DO SEGURO DA OBRA
${linha}

11.1. Recomenda-se que o CONTRATANTE contrate seguro de obra (Risco de
      Engenharia) para cobertura de danos materiais, responsabilidade
      civil de operações e danos a terceiros durante a execução.

11.2. O CONTRATADO manterá apólice de Responsabilidade Civil Profissional
      (RC Engenheiro) vigente durante toda a execução do contrato.

${linha}
12. DAS PENALIDADES E MULTAS
${linha}

12.1. Em caso de inadimplência de qualquer das partes, aplica-se:

      a) Multa compensatória: 10% (dez por cento) sobre o valor total
         do contrato;
      b) Multa moratória: 0,5% (zero vírgula cinco por cento) ao dia,
         sobre o valor da obrigação descumprida, limitada a 10%;
      c) Perdas e danos: apurados nos termos dos arts. 402 a 404 do CC.

12.2. O atraso injustificado na entrega da obra superior a 30 (trinta)
      dias corridos sujeita o CONTRATADO à multa de 0,1% ao dia sobre
      o valor total contratado, limitada a 5% do valor total.

12.3. A multa poderá ser compensada com créditos existentes ou cobrada
      judicialmente, sem prejuízo das demais sanções contratuais e legais.

${linha}
13. DA RESCISÃO CONTRATUAL
${linha}

13.1. O contrato poderá ser rescindido por qualquer das partes, mediante
      notificação prévia e escrita de 30 (trinta) dias corridos, nos
      seguintes casos:

      a) Descumprimento de qualquer cláusula por qualquer das partes;
      b) Inadimplência financeira do CONTRATANTE superior a 30 (trinta)
         dias corridos;
      c) Paralisação injustificada da obra por mais de 15 (quinze) dias
         consecutivos imputável ao CONTRATADO;
      d) Insolvência, falência ou recuperação judicial de qualquer das partes;
      e) Acordo mútuo entre as partes.

13.2. Na rescisão imputada ao CONTRATANTE, este deverá pagar ao CONTRATADO:
      — O valor dos serviços já executados e medidos;
      — A multa compensatória de 10% sobre o saldo contratual restante;
      — As despesas de desmobilização já incorridas.

13.3. Na rescisão imputada ao CONTRATADO, este deverá:
      — Devolver ao CONTRATANTE os materiais e equipamentos de sua propriedade;
      — Pagar a multa compensatória de 10% sobre o saldo contratual restante;
      — Garantir a continuidade mínima da obra por 30 dias.

${linha}
14. DA SEGURANÇA E MEDICINA DO TRABALHO
${linha}

14.1. O CONTRATADO obriga-se a cumprir integralmente as Normas
      Regulamentadoras aplicáveis à construção civil, especialmente:

      NR-18 — Segurança e Saúde no Trabalho na Indústria da Construção
      NR-06 — Equipamentos de Proteção Individual (EPI)
      NR-10 — Segurança em Instalações e Serviços em Eletricidade
      NR-35 — Trabalho em Altura

14.2. O CONTRATADO é o único responsável por acidentes de trabalho
      ocorridos com seus empregados e subcontratados, respondendo perante
      o INSS, FGTS e demais obrigações trabalhistas e previdenciárias.

14.3. O CONTRATANTE poderá paralisar os serviços que apresentem risco
      iminente à segurança de trabalhadores ou terceiros, sem que tal
      paralisação caracterize inadimplência ou rescisão contratual.

${linha}
15. DA PROTEÇÃO DE DADOS PESSOAIS — LGPD
${linha}

15.1. As partes comprometem-se a tratar os dados pessoais compartilhados
      neste contrato em conformidade com a Lei 13.709/2018 (LGPD),
      utilizando-os exclusivamente para as finalidades contratuais.

15.2. Os dados coletados (nome, CPF, RG, endereço, e-mail, telefone)
      serão utilizados exclusivamente para:
      — Execução deste contrato;
      — Emissão de notas fiscais e documentos contábeis;
      — Cumprimento de obrigações legais e regulatórias.

15.3. Ambas as partes se comprometem a não compartilhar dados pessoais
      com terceiros sem consentimento prévio, salvo por determinação legal.

${linha}
16. DAS DISPOSIÇÕES GERAIS
${linha}

16.1. Alterações contratuais somente serão válidas mediante Termo Aditivo
      escrito, assinado por ambas as partes e por duas testemunhas.

16.2. A tolerância de qualquer das partes quanto ao descumprimento de
      alguma disposição contratual não importará em novação, renúncia ou
      precedente para futuros descumprimentos.

16.3. Os casos omissos neste contrato serão regulados pelo Código Civil
      Brasileiro (Lei 10.406/2002) e demais disposições legais pertinentes.

16.4. Este contrato é firmado em caráter irrevogável e irretratável,
      exceto nas hipóteses previstas na Cláusula 13.

16.5. As partes elegem o foro da Comarca de Promissão/SP para dirimir
      quaisquer dúvidas ou litígios decorrentes deste contrato, renunciando
      a qualquer outro, por mais privilegiado que seja.

      ${sep}
      Promissão / SP, _____ de _________________ de _________

${sep}
17. DAS ASSINATURAS
${sep}

_______________________________________________   _______________________________________________
${(parte.nome || '[NOME DO CONTRATANTE]').toUpperCase().slice(0,45)}   ${(ENG.nome).toUpperCase().slice(0,45)}
CPF: ${parte.cpf || '[CPF DO CONTRATANTE]'}                              CPF: ${ENG.cpf}  CREA: ${ENG.crea}
CONTRATANTE                                       CONTRATADO


_______________________________________________   _______________________________________________
TESTEMUNHA 1                                      TESTEMUNHA 2
Nome: ________________________________            Nome: ________________________________
RG:   ________________________________            RG:   ________________________________`
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
