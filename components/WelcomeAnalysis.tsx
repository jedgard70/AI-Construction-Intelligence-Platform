import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useRouter } from 'next/router'
import {
  BadgeCheck,
  Bot,
  Clapperboard,
  DollarSign,
  FileText,
  HardHat,
  ImageIcon,
  ListChecks,
  Megaphone,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
  Upload,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { runCp32SmartRouting } from '../lib/cp3-smart-routing'
import type { Cp32Objective, Cp32RouteId, Cp32SmartRoute } from '../lib/cp3-smart-routing'
import { getSupabase } from '../lib/supabase'
import type { Profile } from '../pages/dashboard'

type IntakeKind = 'visual' | 'bim' | 'legal' | 'finance' | 'marketing' | 'field' | 'generic'
type Language = 'en' | 'pt'

type RouteOption = {
  title: string
  description: string
  href: string
}

type LiveAgent = {
  name: string
  signal: string
  finding: string
  action: string
}

type IntakeResult = {
  code: string
  kind: IntakeKind
  headline: string
  explanation: string
  interpretation: string
  nextSteps: RouteOption[]
  routes: RouteOption[]
  agents: LiveAgent[]
  smartRoutes: Cp32SmartRoute[]
}

type IntentCard = {
  kind: IntakeKind
  label: string
  description: string
  prompt: string
}

type IntentVisual = {
  icon: LucideIcon
  color: string
  background: string
}

type LivingAgentId =
  | 'archvis-render'
  | 'bim-clash'
  | 'budget-quantity'
  | 'contract-legal'
  | 'marketing'
  | 'field-operations'
  | 'directcut-video'

type LivingAgentCard = {
  id: LivingAgentId
  icon: LucideIcon
  accent: string
  tint: string
  name: Record<Language, string>
  category: Record<Language, string>
  does: Record<Language, string>
  inputs: Record<Language, string>
  outputs: Record<Language, string>
  correct: Record<Language, string>
  attention: Record<Language, string>
  action: Record<Language, string>
}

type CopilotMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type IfcViewerStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const UI_COPY = {
  en: {
    welcome: 'Welcome',
    lead: 'Show what you have or tell Apex Copilot what you want to do.',
    sublead: 'Apex Copilot reads the context, explains what it sees and opens the next step.',
    attach: 'Attach document',
    talk: 'Talk to Apex Copilot',
    start: 'Start analysis',
    dropTitle: 'Drop a file here or click to select',
    dropText: 'Images, BIM/IFC, CAD, PDF, videos, spreadsheets and more.',
    previewDeep: 'Deep preview will be handled by the correct module.',
    previewHint: 'Apex Copilot identifies the path.',
    heicPreview: 'HEIC image received. Preview conversion will be handled in a future checkpoint.',
    noFile: 'No file selected',
    waiting: 'Waiting for input',
    intentQuestion: 'What do you want to do with this?',
    intentPlaceholder: 'Example: turn this into a sellable render, validate IFC, review contract, create budget...',
    identify: 'Identify path',
    intentCards: 'Quick construction intents',
    analysis: 'Visual / technical analysis',
    copilotConversation: 'Apex Copilot conversation',
    copilotThinking: 'Apex Copilot is reading this intake...',
    copilotEmpty: 'Upload any file or describe your goal. Apex Copilot will answer here like a construction specialist.',
    copilotConnectionError: 'Apex Copilot could not complete the live AI response. The file was received; try again or continue with a short objective.',
    chatPlaceholder: 'Message Apex Copilot about this file or objective...',
    sendMessage: 'Send message',
    chooseAnother: 'Choose file',
    ifcLoading: 'Loading IFC model...',
    ifcReady: 'IFC model loaded. Drag to orbit, scroll to zoom.',
    ifcEmpty: 'IFC received, but no renderable mesh was found in this model.',
    ifcError: 'IFC viewer could not load this file. Apex Copilot can still guide the BIM review from metadata.',
    rvtConversion: 'RVT received. Revit files require conversion to IFC or glTF before browser viewing.',
    cadConversion: 'CAD/SKP received. This format requires a viewer/conversion pipeline before browser viewing.',
    aiUnderstood: 'Apex Copilot understood',
    recommendedNextSteps: 'Recommended next steps',
    emptyGuidance: 'Upload a file or describe your goal so Apex Copilot can identify the path.',
    routes: 'Smart routes',
    agents: 'Supporting actions',
    agentsIntro: 'Supporting modules can continue the workflow after Apex Copilot leads the conversation.',
    agentDoes: 'What it does',
    agentInputs: 'Accepted inputs',
    agentOutputs: 'Expected outputs',
    agentCorrect: 'What looks correct',
    agentAttention: 'Needs attention',
    agentRecommended: 'Recommended first',
    agentAvailable: 'Available',
    ownerTitle: 'Executive control',
    ownerText: 'Owner control and executive indicators remain separate from the first experience.',
    ownerButton: 'Executive Dashboard',
    trustOne: 'Secure intake',
    trustTwo: 'AI routing',
    trustThree: 'Owner governed',
  },
  pt: {
    welcome: 'Bem-vindo',
    lead: 'Mostre o que voce tem ou diga ao Apex Copilot o que deseja fazer.',
    sublead: 'O Apex Copilot le o contexto, explica o que entendeu e abre o proximo passo.',
    attach: 'Anexar documento',
    talk: 'Falar com Apex Copilot',
    start: 'Iniciar analise',
    dropTitle: 'Solte um arquivo aqui ou clique para selecionar',
    dropText: 'Imagens, BIM/IFC, CAD, PDF, videos, planilhas e mais.',
    previewDeep: 'Preview profundo sera tratado pelo modulo correto.',
    previewHint: 'O Apex Copilot identifica o caminho.',
    heicPreview: 'Imagem HEIC recebida. A conversao para preview sera tratada em checkpoint futuro.',
    noFile: 'Nenhum arquivo selecionado',
    waiting: 'Aguardando entrada',
    intentQuestion: 'O que voce deseja fazer com isso?',
    intentPlaceholder: 'Ex: transformar em render vendavel, validar IFC, revisar contrato, gerar orcamento...',
    identify: 'Identificar caminho',
    intentCards: 'Intencoes rapidas de construcao',
    analysis: 'Analise visual / tecnica',
    copilotConversation: 'Conversa com Apex Copilot',
    copilotThinking: 'Apex Copilot esta lendo este intake...',
    copilotEmpty: 'Anexe qualquer arquivo ou descreva o objetivo. O Apex Copilot respondera aqui como especialista em construcao.',
    copilotConnectionError: 'O Apex Copilot nao conseguiu concluir a resposta de IA ao vivo. O arquivo foi recebido; tente novamente ou continue com um objetivo curto.',
    chatPlaceholder: 'Escreva para o Apex Copilot sobre este arquivo ou objetivo...',
    sendMessage: 'Enviar mensagem',
    chooseAnother: 'Escolher arquivo',
    ifcLoading: 'Carregando modelo IFC...',
    ifcReady: 'Modelo IFC carregado. Arraste para orbitar, role para zoom.',
    ifcEmpty: 'IFC recebido, mas nenhum mesh renderizavel foi encontrado neste modelo.',
    ifcError: 'O viewer IFC nao conseguiu carregar este arquivo. O Apex Copilot ainda pode orientar a revisao BIM por metadados.',
    rvtConversion: 'RVT recebido. Arquivos Revit exigem conversao para IFC ou glTF antes da visualizacao no navegador.',
    cadConversion: 'CAD/SKP recebido. Este formato exige pipeline de viewer/conversao antes da visualizacao no navegador.',
    aiUnderstood: 'Apex Copilot entendeu',
    recommendedNextSteps: 'Proximos passos recomendados',
    emptyGuidance: 'Anexe um arquivo ou descreva seu objetivo para o Apex Copilot identificar o caminho.',
    routes: 'Rotas inteligentes',
    agents: 'Acoes de apoio',
    agentsIntro: 'Modulos de apoio podem continuar o fluxo depois que o Apex Copilot lidera a conversa.',
    agentDoes: 'O que faz',
    agentInputs: 'Entradas aceitas',
    agentOutputs: 'Saidas esperadas',
    agentCorrect: 'O que parece correto',
    agentAttention: 'Precisa de atencao',
    agentRecommended: 'Recomendado primeiro',
    agentAvailable: 'Disponivel',
    ownerTitle: 'Executive control',
    ownerText: 'Controle Owner e indicadores executivos continuam separados da primeira experiencia.',
    ownerButton: 'Dashboard Executivo',
    trustOne: 'Intake seguro',
    trustTwo: 'Rota por IA',
    trustThree: 'Governanca Owner',
  },
} satisfies Record<Language, Record<string, string>>

const INTENT_VISUALS: Record<IntakeKind, IntentVisual> = {
  visual: { icon: ImageIcon, color: '#ff2d21', background: '#ffe1e1' },
  bim: { icon: Workflow, color: '#1d32ff', background: '#e4e5ff' },
  finance: { icon: DollarSign, color: '#14aa52', background: '#def9e8' },
  legal: { icon: BadgeCheck, color: '#8d25de', background: '#efd9ff' },
  marketing: { icon: Megaphone, color: '#ff6f1a', background: '#ffe8d8' },
  field: { icon: HardHat, color: '#18b58c', background: '#dbf6ef' },
  generic: { icon: Bot, color: '#0d2b52', background: '#eaf2ff' },
}

const LIVING_AGENTS: Record<LivingAgentId, LivingAgentCard> = {
  'archvis-render': {
    id: 'archvis-render',
    icon: ImageIcon,
    accent: '#ff2d21',
    tint: '#ffe1e1',
    name: { en: 'ArchVis Render Agent', pt: 'Agente ArchVis Render' },
    category: { en: 'Visual sales / presentation', pt: 'Venda visual / apresentacao' },
    does: {
      en: 'Turns plans, photos, sketches or visual intent into a render, facade study, humanized plan or presentation path.',
      pt: 'Transforma plantas, fotos, croquis ou intencao visual em rota de render, fachada, planta humanizada ou apresentacao.',
    },
    inputs: { en: 'JPG, PNG, HEIC, PDF floor plan, sketch, visual brief.', pt: 'JPG, PNG, HEIC, PDF de planta, croqui, briefing visual.' },
    outputs: { en: 'Render brief, visual direction, required views and next production step.', pt: 'Briefing de render, direcao visual, vistas necessarias e proximo passo produtivo.' },
    correct: { en: 'Image/plan has enough context for view, style, material or sales purpose.', pt: 'Imagem/planta tem contexto suficiente de vista, estilo, material ou objetivo comercial.' },
    attention: { en: 'Missing dimensions, unclear camera angle, low-resolution plans or no target audience.', pt: 'Faltam medidas, angulo de camera, planta legivel ou publico-alvo.' },
    action: { en: 'Prepare ArchVis brief', pt: 'Preparar briefing ArchVis' },
  },
  'bim-clash': {
    id: 'bim-clash',
    icon: Workflow,
    accent: '#1d32ff',
    tint: '#e4e5ff',
    name: { en: 'BIM / Clash Agent', pt: 'Agente BIM / Clash' },
    category: { en: 'Model coordination', pt: 'Coordenacao de modelo' },
    does: {
      en: 'Routes IFC, RVT, DWG, DXF or SKP context to model review, coordination, clash triage and technical validation.',
      pt: 'Encaminha IFC, RVT, DWG, DXF ou SKP para revisao de modelo, coordenacao, triagem de clash e validacao tecnica.',
    },
    inputs: { en: 'IFC, RVT, DWG, DXF, SKP, coordination notes.', pt: 'IFC, RVT, DWG, DXF, SKP, notas de compatibilizacao.' },
    outputs: { en: 'Model review path, clash questions, discipline context and validation checklist.', pt: 'Rota de revisao, perguntas de clash, contexto por disciplina e checklist de validacao.' },
    correct: { en: 'Model file type or intent clearly points to coordination, quantities or technical review.', pt: 'Arquivo ou intencao aponta claramente para coordenacao, quantitativo ou revisao tecnica.' },
    attention: { en: 'No discipline list, no model version, no coordinate origin or unclear target deliverable.', pt: 'Sem lista de disciplinas, versao, origem de coordenadas ou entrega alvo clara.' },
    action: { en: 'Prepare model review', pt: 'Preparar revisao do modelo' },
  },
  'budget-quantity': {
    id: 'budget-quantity',
    icon: DollarSign,
    accent: '#14aa52',
    tint: '#def9e8',
    name: { en: 'Budget / Quantity Agent', pt: 'Agente Orcamento / Quantitativo' },
    category: { en: 'Cost and proposal', pt: 'Custo e proposta' },
    does: {
      en: 'Organizes budget, quantity, invoice or spreadsheet intent into a controlled estimating path.',
      pt: 'Organiza intencao de orcamento, quantitativo, nota ou planilha em uma rota controlada de estimativa.',
    },
    inputs: { en: 'XLSX, CSV, invoice, quantity list, scope notes, BIM quantity request.', pt: 'XLSX, CSV, nota, lista de quantitativos, escopo, pedido de quantitativo BIM.' },
    outputs: { en: 'Budget draft, assumptions to collect, cost categories and proposal next step.', pt: 'Rascunho de orcamento, premissas a coletar, categorias de custo e proximo passo de proposta.' },
    correct: { en: 'Scope, unit, quantity, budget or proposal intent is visible.', pt: 'Escopo, unidade, quantidade, orcamento ou intencao de proposta estao claros.' },
    attention: { en: 'Missing units, region, currency, labor/material split or client approval stage.', pt: 'Faltam unidades, regiao, moeda, separacao mao de obra/material ou etapa de aprovacao.' },
    action: { en: 'Start budget draft', pt: 'Iniciar rascunho de orcamento' },
  },
  'contract-legal': {
    id: 'contract-legal',
    icon: BadgeCheck,
    accent: '#8d25de',
    tint: '#efd9ff',
    name: { en: 'Contract / Legal Agent', pt: 'Agente Contrato / Juridico' },
    category: { en: 'Legal, permit and compliance', pt: 'Juridico, permit e compliance' },
    does: {
      en: 'Classifies contracts, permits, compliance documents and signature workflows before execution.',
      pt: 'Classifica contratos, permits, documentos de compliance e fluxos de assinatura antes da execucao.',
    },
    inputs: { en: 'PDF, DOCX, contract, permit, compliance note, signature request.', pt: 'PDF, DOCX, contrato, permit, nota de compliance, pedido de assinatura.' },
    outputs: { en: 'Document type, legal checklist, risk questions and responsible next step.', pt: 'Tipo documental, checklist juridico, perguntas de risco e proximo responsavel.' },
    correct: { en: 'Document has parties, scope, jurisdiction, deadline or approval requirement.', pt: 'Documento tem partes, escopo, jurisdicao, prazo ou requisito de aprovacao.' },
    attention: { en: 'Missing jurisdiction, signer, version control, attachments or execution deadline.', pt: 'Faltam jurisdicao, assinante, versao, anexos ou prazo de execucao.' },
    action: { en: 'Open legal checklist', pt: 'Abrir checklist juridico' },
  },
  marketing: {
    id: 'marketing',
    icon: Megaphone,
    accent: '#ff6f1a',
    tint: '#ffe8d8',
    name: { en: 'Marketing Agent', pt: 'Agente Marketing' },
    category: { en: 'Campaign, website and sales story', pt: 'Campanha, website e narrativa de venda' },
    does: {
      en: 'Converts visual/project intent into campaign, portfolio, website, social or sales material direction.',
      pt: 'Converte intencao visual/projeto em direcao de campanha, portfolio, website, social ou material de venda.',
    },
    inputs: { en: 'Render, photo, project story, brand goal, website/social request.', pt: 'Render, foto, narrativa do projeto, objetivo de marca, pedido de website/social.' },
    outputs: { en: 'Campaign angle, asset list, content path and supporting ArchVis needs.', pt: 'Angulo de campanha, lista de ativos, rota de conteudo e necessidades ArchVis.' },
    correct: { en: 'The goal is to sell, publish, promote or position the project.', pt: 'O objetivo e vender, publicar, divulgar ou posicionar o projeto.' },
    attention: { en: 'Missing audience, offer, region, brand tone, visual assets or deadline.', pt: 'Faltam publico, oferta, regiao, tom de marca, ativos visuais ou prazo.' },
    action: { en: 'Prepare campaign path', pt: 'Preparar rota de campanha' },
  },
  'field-operations': {
    id: 'field-operations',
    icon: HardHat,
    accent: '#18b58c',
    tint: '#dbf6ef',
    name: { en: 'Field Operations Agent', pt: 'Agente Operacao de Obra' },
    category: { en: 'Jobsite execution', pt: 'Execucao de campo' },
    does: {
      en: 'Routes jobsite evidence, RDO, quality, progress and execution requests into field operations.',
      pt: 'Encaminha evidencias de obra, RDO, qualidade, progresso e pedidos de execucao para operacao de campo.',
    },
    inputs: { en: 'Site photos, RDO notes, quality issue, material/progress evidence.', pt: 'Fotos de obra, notas RDO, problema de qualidade, evidencia de material/progresso.' },
    outputs: { en: 'Field record path, progress questions, risk flags and next operational action.', pt: 'Rota de registro de campo, perguntas de progresso, alertas de risco e proxima acao operacional.' },
    correct: { en: 'Input includes location, progress, material, crew, quality or execution evidence.', pt: 'Entrada inclui local, progresso, material, equipe, qualidade ou evidencia de execucao.' },
    attention: { en: 'Missing date, location, responsible party, photo context or severity.', pt: 'Faltam data, local, responsavel, contexto da foto ou severidade.' },
    action: { en: 'Prepare field record', pt: 'Preparar registro de campo' },
  },
  'directcut-video': {
    id: 'directcut-video',
    icon: Clapperboard,
    accent: '#0d2b52',
    tint: '#eaf2ff',
    name: { en: 'DirectCut Video Agent', pt: 'Agente DirectCut Video' },
    category: { en: 'Video, tour and timelapse', pt: 'Video, tour e timelapse' },
    does: {
      en: 'Shapes video, timelapse, tour or audiovisual storytelling requests into a production brief.',
      pt: 'Transforma pedidos de video, timelapse, tour ou narrativa audiovisual em briefing de producao.',
    },
    inputs: { en: 'MP4, MOV, image sequence, render set, project story, timelapse goal.', pt: 'MP4, MOV, sequencia de imagens, renders, historia do projeto, objetivo de timelapse.' },
    outputs: { en: 'Scene outline, duration target, asset needs and delivery format.', pt: 'Roteiro de cenas, duracao alvo, ativos necessarios e formato de entrega.' },
    correct: { en: 'Intent mentions video, movement, tour, sequence, timelapse or presentation.', pt: 'Intencao menciona video, movimento, tour, sequencia, timelapse ou apresentacao.' },
    attention: { en: 'Missing scenes, duration, audience, music/voice direction or source asset order.', pt: 'Faltam cenas, duracao, publico, direcao de musica/voz ou ordem dos ativos.' },
    action: { en: 'Prepare DirectCut brief', pt: 'Preparar briefing DirectCut' },
  },
}

const ROUTE_AGENT_MAP: Record<Cp32RouteId, LivingAgentId[]> = {
  'archvis-render': ['archvis-render', 'marketing', 'directcut-video'],
  'directcut-video': ['directcut-video', 'marketing', 'archvis-render'],
  'bim-clash': ['bim-clash', 'budget-quantity', 'field-operations'],
  'quantity-budget': ['budget-quantity', 'bim-clash', 'field-operations'],
  'legal-permits': ['contract-legal', 'field-operations', 'budget-quantity'],
  'marketing-social': ['marketing', 'archvis-render', 'directcut-video'],
  'field-operations': ['field-operations', 'budget-quantity', 'bim-clash'],
  'general-unknown': ['archvis-render', 'bim-clash', 'budget-quantity'],
}

const INTENT_CARDS: Record<Language, IntentCard[]> = {
  en: [
    { kind: 'visual', label: 'Create render', description: 'Image, facade, interior, portfolio or visual sales material.', prompt: 'create a sellable render or visual presentation' },
    { kind: 'bim', label: 'Analyze BIM/CAD', description: 'IFC, RVT, DWG, DXF, SKP, clash, quantities or coordination.', prompt: 'analyze BIM CAD model for technical routing' },
    { kind: 'finance', label: 'Estimate cost', description: 'Budget, proposal, invoice, cost or financial workflow.', prompt: 'prepare budget cost estimate and proposal path' },
    { kind: 'legal', label: 'Review contract', description: 'Contract, permit, compliance, legal document or signature.', prompt: 'review contract permit compliance or legal document' },
    { kind: 'marketing', label: 'Build marketing', description: 'Website, portfolio, campaign, video or social material.', prompt: 'prepare marketing design website or video material' },
    { kind: 'field', label: 'Route field work', description: 'Jobsite, RDO, quality, progress, materials or execution.', prompt: 'route jobsite field RDO quality and execution work' },
  ],
  pt: [
    { kind: 'visual', label: 'Criar render', description: 'Imagem, fachada, interior, portfolio ou material visual de venda.', prompt: 'transformar em render vendavel ou apresentacao visual' },
    { kind: 'bim', label: 'Analisar BIM/CAD', description: 'IFC, RVT, DWG, DXF, SKP, clash, quantitativo ou coordenacao.', prompt: 'analisar modelo BIM CAD para rota tecnica' },
    { kind: 'finance', label: 'Gerar orcamento', description: 'Orcamento, proposta, nota, custo ou fluxo financeiro.', prompt: 'preparar orcamento custo proposta e rota financeira' },
    { kind: 'legal', label: 'Revisar contrato', description: 'Contrato, permit, compliance, documento legal ou assinatura.', prompt: 'revisar contrato permit compliance ou documento juridico' },
    { kind: 'marketing', label: 'Criar marketing', description: 'Website, portfolio, campanha, video ou material social.', prompt: 'preparar marketing design website ou video' },
    { kind: 'field', label: 'Encaminhar obra', description: 'Obra, RDO, qualidade, progresso, materiais ou execucao.', prompt: 'encaminhar obra campo RDO qualidade e execucao' },
  ],
}

const CLASSIFY_COPY: Record<Language, Record<IntakeKind, { headline: string; explanation: string }>> = {
  en: {
    visual: { headline: 'Image or visual material detected', explanation: 'This input can become a render, humanized plan, portfolio asset, sales board, marketing piece or video.' },
    bim: { headline: 'Technical BIM/CAD model detected', explanation: 'This material should move to BIM/3D, coordination, technical validation, clash review, quantities or estimating.' },
    legal: { headline: 'Legal or regulatory document detected', explanation: 'The correct path involves contracts, permits, compliance, signatures or legal document organization.' },
    finance: { headline: 'Financial or commercial input detected', explanation: 'The input can support estimating, proposals, financial flow, revenue tracking or cost audit.' },
    marketing: { headline: 'Marketing, design or video material detected', explanation: 'The input can move to Design/Web, DirectCut, portfolio, campaign or institutional content.' },
    field: { headline: 'Field operations input detected', explanation: 'The input can become jobsite evidence, RDO, pending item, quality record, measurement or real cost support.' },
    generic: { headline: 'Input received for intelligent triage', explanation: 'Apex Copilot needs the user intention to choose the safest operational path.' },
  },
  pt: {
    visual: { headline: 'Imagem ou material visual detectado', explanation: 'Esta entrada pode virar render, planta humanizada, portfolio, prancha comercial, marketing ou video.' },
    bim: { headline: 'Modelo tecnico BIM/CAD detectado', explanation: 'Este material deve seguir para BIM/3D, compatibilizacao, validacao tecnica, clash, quantitativo ou orcamento.' },
    legal: { headline: 'Documento juridico ou regulatorio detectado', explanation: 'O caminho correto envolve contratos, permits, compliance, assinatura ou organizacao legal.' },
    finance: { headline: 'Entrada financeira ou comercial detectada', explanation: 'A entrada pode alimentar orcamento, proposta, fluxo financeiro, revenue ou auditoria de custos.' },
    marketing: { headline: 'Material de marketing, design ou video detectado', explanation: 'A entrada pode seguir para Design/Web, DirectCut, portfolio, campanha ou conteudo institucional.' },
    field: { headline: 'Entrada operacional de obra detectada', explanation: 'A entrada pode ser tratada como evidencia de campo, RDO, pendencia, qualidade, medicao ou custo real.' },
    generic: { headline: 'Entrada recebida para triagem inteligente', explanation: 'O Apex Copilot precisa da intencao do usuario para escolher o caminho operacional correto.' },
  },
}

const AGENT_LIBRARY: Record<IntakeKind, LiveAgent[]> = {
  visual: [
    { name: 'Render Agent', signal: 'visual', finding: 'Material pode virar planta humanizada, fachada, interior ou prancha comercial.', action: 'Encaminhar para ArchVis' },
    { name: 'DirectCut Agent', signal: 'motion', finding: 'Se houver sequencia de imagens, pode virar video, tour ou timelapse.', action: 'Preparar roteiro audiovisual' },
    { name: 'Marketing Agent', signal: 'brand', finding: 'Imagem pode alimentar portfolio, website, social media e material de venda.', action: 'Abrir rota Marketing' },
  ],
  bim: [
    { name: 'BIM Agent', signal: 'model', finding: 'Arquivo parece tecnico e deve ser tratado como modelo/coordenação, nao como imagem simples.', action: 'Abrir BIM / 3D' },
    { name: 'Clash Agent', signal: 'coordination', finding: 'Checkpoint futuro pode sobrepor disciplinas e destacar interferencias.', action: 'Preparar compatibilizacao' },
    { name: 'Quantitativo Agent', signal: 'measure', finding: 'Modelo tecnico pode alimentar quantitativo, orçamento e cronograma.', action: 'Encaminhar para Orcamento' },
  ],
  legal: [
    { name: 'Legal Agent', signal: 'contract', finding: 'Documento deve ser classificado para contrato, aditivo, compliance, permit ou assinatura.', action: 'Abrir Juridico / Contratos' },
    { name: 'Compliance Agent', signal: 'risk', finding: 'Pode exigir regras por pais, cidade, county ou norma local.', action: 'Preparar checklist legal' },
    { name: 'Signature Agent', signal: 'workflow', finding: 'Se for documento final, pode seguir para assinatura e controle de status.', action: 'Encaminhar assinatura' },
  ],
  finance: [
    { name: 'Finance Agent', signal: 'cost', finding: 'Entrada parece custo, nota, orcamento, invoice ou documento financeiro.', action: 'Abrir Financeiro / Orcamento' },
    { name: 'Proposal Agent', signal: 'commercial', finding: 'Pode alimentar proposta, curva de desembolso ou fluxo financeiro.', action: 'Preparar proposta' },
    { name: 'Audit Agent', signal: 'control', finding: 'Documento financeiro deve preservar rastreabilidade e evitar exposicao sensivel.', action: 'Registrar trilha futura' },
  ],
  marketing: [
    { name: 'Marketing Agent', signal: 'campaign', finding: 'Entrada aponta para website, portfolio, posts, campanha ou material institucional.', action: 'Abrir Design/Web' },
    { name: 'DirectCut Agent', signal: 'video', finding: 'Arquivos de video ou sequencia visual podem virar reels, tour ou apresentacao.', action: 'Abrir DirectCut' },
    { name: 'Brand Agent', signal: 'identity', finding: 'Logos, fotos e renders podem montar kit visual da empresa/projeto.', action: 'Preparar material' },
  ],
  field: [
    { name: 'Field Agent', signal: 'obra', finding: 'Entrada parece relacionada a obra, campo, equipe, RDO ou execucao.', action: 'Abrir Obras/Campo' },
    { name: 'Progress Agent', signal: 'status', finding: 'Pode virar registro de avanço fisico, pendencia ou evidencia de obra.', action: 'Preparar RDO' },
    { name: 'Cost Agent', signal: 'materials', finding: 'Campo pode acionar material, compra, medicao e pagamento.', action: 'Conectar financeiro' },
  ],
  generic: [
    { name: 'Apex Router', signal: 'triage', finding: 'Ainda preciso de uma intencao para escolher a rota com seguranca.', action: 'Perguntar objetivo' },
    { name: 'Document Agent', signal: 'file', finding: 'Arquivo aceito no intake; leitura profunda depende do formato e checkpoint.', action: 'Classificar entrada' },
    { name: 'Operations Agent', signal: 'next step', finding: 'Posso encaminhar para visual, tecnico, juridico, financeiro, marketing ou obra.', action: 'Sugerir rotas' },
  ],
}

const CP4_ATTACHMENT_ANALYSIS_LIMIT = 10 * 1024 * 1024

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function formatFileSize(size: number, language: Language) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return language === 'en' ? `${size} bytes` : `${size} bytes`
}

function ownerEmails() {
  return (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  return Boolean(
    profile.is_owner === true ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'diretor_executivo' ||
    ownerEmails().includes(String(profile.email || '').toLowerCase())
  )
}

function openApexAi() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('apex-copilot-open'))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      const value = event.target?.result
      if (typeof value === 'string') resolve(value)
      else reject(new Error('Failed to read file.'))
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

function extensionFrom(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function intakeCode() {
  const now = new Date()
  return `APX-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`
}

function routesFor(kind: IntakeKind, language: Language): RouteOption[] {
  if (kind === 'visual') {
    return [
      { title: 'ArchVis', description: language === 'en' ? 'Render, humanized plan, facade, interiors and sales board.' : 'Render, planta humanizada, fachada, interiores e prancha comercial.', href: '/archvis' },
      { title: 'Marketing / Design', description: language === 'en' ? 'Portfolio, presentation, website, social media and sales material.' : 'Portfolio, apresentacao, website, social media e material de venda.', href: '/platform' },
      { title: 'DirectCut', description: language === 'en' ? 'Video, tour, timelapse and visual project story.' : 'Video, tour, timelapse e roteiro visual do projeto.', href: '/director-cut' },
    ]
  }
  if (kind === 'bim') {
    return [
      { title: 'BIM / 3D', description: language === 'en' ? 'Technical view, coordination, clash and validation.' : 'Visualizacao tecnica, compatibilizacao, clash e validacao.', href: '/bim-3d' },
      { title: 'Orcamento', description: language === 'en' ? 'Quantities, costs, proposal and physical-financial schedule.' : 'Quantitativo, custos, proposta e cronograma fisico-financeiro.', href: '/orcamento' },
      { title: 'Obras / Campo', description: language === 'en' ? 'Prepare execution, RDO, crews and field control.' : 'Preparar execucao, RDO, equipes e controle de obra.', href: '/rdo' },
    ]
  }
  if (kind === 'legal') {
    return [
      { title: 'Juridico / Contratos', description: language === 'en' ? 'Contract, scope, addendum, compliance, permit and signature.' : 'Contrato, memorial, aditivo, compliance, permit e assinatura.', href: '/juridico/contratos' },
      { title: 'Documentos legais', description: language === 'en' ? 'Organize evidence, attachments and document trail.' : 'Organizar evidencias, anexos e trilha documental.', href: '/documentos' },
      { title: 'Compliance', description: language === 'en' ? 'Check country, city, county or applicable code rules.' : 'Checar regras por pais, cidade, county ou norma aplicavel.', href: '/juridico/compliance' },
    ]
  }
  if (kind === 'finance') {
    return [
      { title: 'Financeiro / Orcamento', description: language === 'en' ? 'Invoice, cost, composition, proposal and financial flow.' : 'Nota, invoice, custo, composicao, proposta e fluxo financeiro.', href: '/orcamento' },
      { title: 'CRM Revenue', description: language === 'en' ? 'Connect proposal, contract, installments and financial status.' : 'Conectar proposta, contrato, parcelas e status financeiro.', href: '/crm/revenue' },
      { title: 'Documentos', description: language === 'en' ? 'Keep document support for future audit.' : 'Guardar suporte documental para auditoria futura.', href: '/documentos' },
    ]
  }
  if (kind === 'marketing') {
    return [
      { title: 'Marketing / Design', description: language === 'en' ? 'Website, materials, portfolio, content and campaigns.' : 'Website, materiais, portfolio, conteudo e campanhas.', href: '/platform' },
      { title: 'DirectCut', description: language === 'en' ? 'Video, reels, tour and audiovisual presentation.' : 'Video, reels, tour e apresentacao audiovisual.', href: '/director-cut' },
      { title: 'ArchVis', description: language === 'en' ? 'Generate sales-ready imagery to feed the campaign.' : 'Gerar imagens vendaveis para alimentar campanha.', href: '/archvis' },
    ]
  }
  if (kind === 'field') {
    return [
      { title: 'Obras / Campo', description: language === 'en' ? 'RDO, crews, materials, pending items and execution.' : 'RDO, equipes, materiais, pendencias e execucao.', href: '/rdo' },
      { title: 'Qualidade', description: language === 'en' ? 'NCIs, evidence, photos and nonconformities.' : 'NCIs, evidencias, fotos e nao conformidades.', href: '/qualidade' },
      { title: 'Financeiro / Orcamento', description: language === 'en' ? 'Materials, measurement, payment and real cost.' : 'Materiais, medicao, pagamento e custo real.', href: '/orcamento' },
    ]
  }
  return [
    {
      title: 'ArchVis',
      description: language === 'en' ? 'Turn an image, plan or model into sales-ready visual material.' : 'Transformar imagem, planta ou modelo em material visual vendavel.',
      href: '/archvis',
    },
    {
      title: 'BIM / 3D',
      description: language === 'en' ? 'Open the technical path for model, coordination, clash and quantities.' : 'Abrir caminho tecnico para modelo, compatibilizacao, clash e quantitativo.',
      href: '/bim-3d',
    },
    {
      title: 'Orcamento',
      description: language === 'en' ? 'Prepare cost, proposal and physical-financial schedule basis.' : 'Preparar base para custo, proposta e cronograma fisico-financeiro.',
      href: '/orcamento',
    },
  ]
}

function interpretationFor(kind: IntakeKind, fileName: string, intent: string, language: Language) {
  const ext = extensionFrom(fileName).toUpperCase()
  const hasFile = Boolean(fileName)
  const label = ext || (language === 'en' ? 'input' : 'entrada')

  if (!hasFile && !intent.trim()) {
    return UI_COPY[language].emptyGuidance
  }
  if (kind === 'visual') {
    return language === 'en'
      ? `I received a ${label} visual asset. This appears to be an architectural image, floor plan, render source or sales visual that can move directly into visual production.`
      : `Recebi um ativo visual ${label}. Isto parece uma imagem arquitetonica, planta, base de render ou material visual de venda que pode seguir direto para producao visual.`
  }
  if (kind === 'bim') {
    return language === 'en'
      ? `I received a ${label} BIM/CAD asset. This should be routed as a technical model for BIM / 3D / Clash, quantity review or coordination.`
      : `Recebi um ativo BIM/CAD ${label}. Ele deve ser encaminhado como modelo tecnico para BIM / 3D / Clash, quantitativo ou coordenacao.`
  }
  if (kind === 'legal') {
    return language === 'en'
      ? `I received a ${label} document that looks legal, contractual, regulatory or permit-related. Apex recommends legal classification before execution.`
      : `Recebi um documento ${label} com perfil juridico, contratual, regulatorio ou de permit. A Apex recomenda classificacao juridica antes da execucao.`
  }
  if (kind === 'finance') {
    return language === 'en'
      ? `I received a ${label} financial or estimating input. This can become a budget, quantity, invoice or proposal workflow.`
      : `Recebi uma entrada financeira ou de orcamento ${label}. Ela pode virar fluxo de orcamento, quantitativo, invoice, nota ou proposta.`
  }
  if (kind === 'marketing') {
    return language === 'en'
      ? `I received a ${label} marketing or video-oriented asset. This can become campaign, website, social, portfolio or DirectCut material.`
      : `Recebi um ativo ${label} com perfil de marketing ou video. Ele pode virar campanha, website, social, portfolio ou material DirectCut.`
  }
  if (kind === 'field') {
    return language === 'en'
      ? `I received jobsite or field operations context. This should be routed to RDO, progress, quality, materials or execution coordination.`
      : `Recebi contexto de obra ou operacao de campo. Isto deve seguir para RDO, progresso, qualidade, materiais ou coordenacao de execucao.`
  }
  return language === 'en'
    ? 'File received. Apex Copilot will inspect the filename, extension and your objective to decide the best route.'
    : 'Arquivo recebido. O Apex Copilot ira analisar o nome, a extensao e seu objetivo para decidir o melhor caminho.'
}

function nextStepsFor(kind: IntakeKind, language: Language): RouteOption[] {
  const visual = [
    { title: language === 'en' ? 'Create render' : 'Criar render', description: language === 'en' ? 'Start ArchVis with this image or plan as the source.' : 'Iniciar ArchVis usando esta imagem ou planta como base.', href: '/archvis' },
    { title: language === 'en' ? 'Humanize plan' : 'Humanizar planta', description: language === 'en' ? 'Prepare a humanized plan or facade study.' : 'Preparar planta humanizada ou estudo de fachada.', href: '/archvis' },
    { title: language === 'en' ? 'Build marketing presentation' : 'Criar apresentacao de marketing', description: language === 'en' ? 'Turn the asset into a portfolio, sales board or campaign piece.' : 'Transformar o ativo em portfolio, prancha comercial ou campanha.', href: '/platform?area=marketing' },
    { title: language === 'en' ? 'Generate visual sales package' : 'Gerar pacote visual de venda', description: language === 'en' ? 'Combine renders, story, social and sales-ready visuals.' : 'Combinar renders, narrativa, social e visuais de venda.', href: '/platform?area=portfolio' },
    { title: language === 'en' ? 'Continue with BIM/3D if applicable' : 'Continuar com BIM/3D se aplicavel', description: language === 'en' ? 'Use technical model review if the image comes from a model.' : 'Usar revisao tecnica se a imagem vier de um modelo.', href: '/bim-3d' },
  ]
  if (kind === 'visual') return visual
  if (kind === 'bim') {
    return [
      { title: 'BIM / 3D / Clash', description: language === 'en' ? 'Review model, coordination and clash context.' : 'Revisar modelo, coordenacao e contexto de clash.', href: '/bim-3d' },
      { title: language === 'en' ? 'Quantity / Budget' : 'Quantitativo / Orcamento', description: language === 'en' ? 'Prepare quantities, cost assumptions and proposal path.' : 'Preparar quantitativos, premissas de custo e rota de proposta.', href: '/orcamento' },
      { title: 'Render / ArchVis', description: language === 'en' ? 'Use the model as a visual output source if the goal is presentation.' : 'Usar o modelo como fonte visual se o objetivo for apresentacao.', href: '/archvis' },
      { title: language === 'en' ? 'Field coordination' : 'Coordenacao de campo', description: language === 'en' ? 'Route to execution if construction coordination is the goal.' : 'Encaminhar para execucao se o objetivo for coordenar obra.', href: '/rdo' },
    ]
  }
  if (kind === 'legal') {
    return [
      { title: language === 'en' ? 'Classify contract/legal document' : 'Classificar contrato/documento juridico', description: language === 'en' ? 'Identify document type, parties, scope and jurisdiction.' : 'Identificar tipo, partes, escopo e jurisdicao.', href: '/juridico/contratos' },
      { title: language === 'en' ? 'Prepare permit/compliance checklist' : 'Preparar checklist de permit/compliance', description: language === 'en' ? 'Check regulatory or approval path before execution.' : 'Checar rota regulatoria ou de aprovacao antes da execucao.', href: '/juridico/compliance' },
      { title: language === 'en' ? 'Organize legal documents' : 'Organizar documentos legais', description: language === 'en' ? 'Keep attachments and evidence ready for the legal workflow.' : 'Manter anexos e evidencias prontos para o fluxo juridico.', href: '/documentos' },
    ]
  }
  if (kind === 'finance') {
    return [
      { title: language === 'en' ? 'Generate budget' : 'Gerar orcamento', description: language === 'en' ? 'Start a cost or quantity draft from this input.' : 'Iniciar rascunho de custo ou quantitativo a partir da entrada.', href: '/orcamento' },
      { title: language === 'en' ? 'Prepare proposal' : 'Preparar proposta', description: language === 'en' ? 'Connect costs to a commercial proposal path.' : 'Conectar custos a uma rota de proposta comercial.', href: '/crm/proposals' },
      { title: language === 'en' ? 'Review invoice/cost evidence' : 'Revisar invoice/nota/custo', description: language === 'en' ? 'Classify financial evidence for audit or approval.' : 'Classificar evidencia financeira para auditoria ou aprovacao.', href: '/crm/revenue' },
    ]
  }
  if (kind === 'marketing') {
    return [
      { title: language === 'en' ? 'Build marketing presentation' : 'Criar apresentacao de marketing', description: language === 'en' ? 'Prepare campaign, portfolio or website story.' : 'Preparar campanha, portfolio ou narrativa de website.', href: '/platform?area=marketing' },
      { title: 'DirectCut', description: language === 'en' ? 'Shape video, tour, reel or timelapse material.' : 'Estruturar video, tour, reel ou timelapse.', href: '/director-cut' },
      { title: 'ArchVis', description: language === 'en' ? 'Generate visual assets that support the campaign.' : 'Gerar ativos visuais que apoiam a campanha.', href: '/archvis' },
    ]
  }
  if (kind === 'field') {
    return [
      { title: language === 'en' ? 'Create field record' : 'Criar registro de campo', description: language === 'en' ? 'Route evidence to RDO, progress or quality context.' : 'Encaminhar evidencia para RDO, progresso ou qualidade.', href: '/rdo' },
      { title: language === 'en' ? 'Review quality issue' : 'Revisar qualidade', description: language === 'en' ? 'Prepare nonconformity or inspection path.' : 'Preparar rota de nao conformidade ou inspecao.', href: '/qualidade' },
      { title: language === 'en' ? 'Connect budget impact' : 'Conectar impacto financeiro', description: language === 'en' ? 'Relate field evidence to material, measurement or cost.' : 'Relacionar evidencia de campo com material, medicao ou custo.', href: '/orcamento' },
    ]
  }
  return [
    { title: language === 'en' ? 'Ask Apex Copilot' : 'Perguntar ao Apex Copilot', description: language === 'en' ? 'Open the assistant with this file context and clarify the best route.' : 'Abrir o assistente com o contexto do arquivo e esclarecer a melhor rota.', href: '/dashboard' },
    { title: language === 'en' ? 'Describe objective' : 'Descrever objetivo', description: language === 'en' ? 'Tell Apex what outcome you want from this file.' : 'Diga a Apex qual resultado deseja a partir deste arquivo.', href: '/dashboard' },
    { title: language === 'en' ? 'Send to technical review' : 'Enviar para revisao tecnica', description: language === 'en' ? 'Treat the file as a technical asset until the route is clear.' : 'Tratar o arquivo como ativo tecnico ate a rota ficar clara.', href: '/bim-3d' },
    { title: language === 'en' ? 'Build marketing path' : 'Construir rota de marketing', description: language === 'en' ? 'Use the file as source material for portfolio, website or campaign planning.' : 'Usar o arquivo como base para portfolio, website ou campanha.', href: '/platform?area=marketing' },
    { title: language === 'en' ? 'Review as document' : 'Revisar como documento', description: language === 'en' ? 'Classify it as a document and organize the next review step.' : 'Classificar como documento e organizar o proximo passo de revisao.', href: '/documentos' },
  ]
}

function classify(fileName: string, intent: string, language: Language): IntakeResult {
  const ext = extensionFrom(fileName)
  const text = `${fileName} ${intent}`.toLowerCase()
  let kind: IntakeKind = 'generic'

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext) || /(render|imagem|fachada|interior|planta humanizada|vendavel|visual)/i.test(text)) {
    kind = 'visual'
  } else if (['ifc', 'rvt', 'dwg', 'dxf', 'skp'].includes(ext) || /(bim|revit|ifc|dwg|cad|clash|modelo|quantitativo)/i.test(text)) {
    kind = 'bim'
  } else if (['xlsx', 'xls', 'csv'].includes(ext) || /(nota fiscal|invoice|financeiro|orcamento|orçamento|custo|pagamento|budget|proposta|planilha)/i.test(text)) {
    kind = 'finance'
  } else if (['pdf', 'doc', 'docx'].includes(ext) || /(contrato|juridico|jurídico|permit|compliance|assinatura|aditivo|memorial|report|relatorio|relatório)/i.test(text)) {
    kind = 'legal'
  } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || /(marketing|website|site|social|instagram|video|vídeo|directcut|portfolio|campanha)/i.test(text)) {
    kind = 'marketing'
  } else if (/(obra|campo|rdo|equipe|material|medicao|medição|diario|diário|nci|qualidade)/i.test(text)) {
    kind = 'field'
  }

  const copy = CLASSIFY_COPY[language][kind]
  return {
    code: intakeCode(),
    kind,
    headline: copy.headline,
    explanation: copy.explanation,
    interpretation: interpretationFor(kind, fileName, intent, language),
    nextSteps: nextStepsFor(kind, language),
    routes: routesFor(kind, language),
    agents: AGENT_LIBRARY[kind],
    smartRoutes: runCp32SmartRouting({ fileName, goal: intent, objective: kind as Cp32Objective }),
  }
}

function buildCopilotSystemPrompt(language: Language) {
  return [
    'You are Apex Copilot, the live conversational construction AI inside Apex Global AI.',
    'You behave like ChatGPT, but your domain is construction, architecture, engineering, BIM/Revit/IFC/CAD, render/ArchVis, construction budget, quantity takeoff, schedule, field operations, contracts, permits/compliance, and marketing for construction projects.',
    'You are not a static card classifier. You must speak naturally as the assistant leading the workflow.',
    'After upload, answer in this structure: I received this file; I understand it as; here are the best construction paths; what do you want to do next?',
    'If only metadata is available, be transparent that deep file parsing/viewer conversion is not complete yet.',
    'Do not ask for secrets. Do not expose tokens, keys, service role, PATs, or private credentials.',
    `Reply in ${language === 'en' ? 'English' : 'Brazilian Portuguese'}.`,
  ].join('\n')
}

function buildCopilotUserPrompt(params: {
  file: File | null
  intent: string
  objective: IntakeKind
  result: IntakeResult
  language: Language
  attachmentAnalysis?: string
}) {
  const { file, intent, objective, result, language, attachmentAnalysis } = params
  const routes = result.smartRoutes
    .map(route => `- ${route.title.en} / ${route.title.pt} (${route.confidence}%): ${route.reason[language]}`)
    .join('\n')
  const nextSteps = result.nextSteps.slice(0, 6).map(step => `- ${step.title}: ${step.description}`).join('\n')
  const fileSummary = file
    ? [
        `name: ${file.name}`,
        `extension: ${extensionFrom(file.name) || 'unknown'}`,
        `mime: ${file.type || 'unknown'}`,
        `size: ${formatFileSize(file.size, language)}`,
      ].join('\n')
    : 'No file uploaded.'
  const ext = file ? extensionFrom(file.name) : ''
  const viewerRule =
    ext === 'ifc'
      ? 'IFC viewer is available in the preview. Refer to the visible model and guide BIM/model review.'
      : ext === 'rvt'
        ? 'RVT cannot be viewed directly in this browser checkpoint. Do not pretend it is viewable; explain that Revit conversion to IFC or glTF is required.'
        : ['dwg', 'dxf', 'skp'].includes(ext)
          ? 'This CAD/SKP format cannot be viewed directly in this checkpoint. Do not pretend it is viewable; explain that a viewer/conversion pipeline is required.'
          : 'Use the available preview/metadata honestly.'

  return [
    'Apex Copilot intake event.',
    '',
    'User-visible language:',
    language,
    '',
    'Uploaded file metadata:',
    fileSummary,
    '',
    'Viewer/conversion rule:',
    viewerRule,
    '',
    'User objective / typed intent:',
    intent.trim() || '(not provided yet)',
    '',
    'Selected objective:',
    objective,
    '',
    'Local routing context for support only, not as final answer:',
    routes || '- General / Unknown',
    '',
    'Suggested construction paths for support only:',
    nextSteps || '- Ask a clarifying construction question',
    '',
    attachmentAnalysis
      ? `Image/file analysis context from the existing attachment analyzer:\n${attachmentAnalysis}`
      : 'No deep file analysis is available yet. Use file metadata and the user objective.',
    '',
    'Write the actual Apex Copilot chat response now. The main response must be conversational, construction-specialized, and must ask the user what they want to do next.',
  ].join('\n')
}

function previewLabel(file: File | null, language: Language) {
  if (!file) return language === 'en' ? 'Show what you have' : 'Mostre o que voce tem'
  const ext = extensionFrom(file.name).toUpperCase() || 'FILE'
  return language === 'en' ? `${ext} received` : `${ext} recebido`
}

function fileKindLabel(file: File | null, language: Language) {
  if (!file) return ''
  const ext = extensionFrom(file.name).toUpperCase() || (language === 'en' ? 'UNKNOWN' : 'DESCONHECIDO')
  const mime = file.type || (language === 'en' ? 'Unknown type' : 'Tipo desconhecido')
  const size = `${Math.max(1, Math.round(file.size / 1024))} KB`
  return `${ext} · ${mime} · ${size}`
}

function isHeicFile(file: File | null) {
  if (!file) return false
  const ext = extensionFrom(file.name)
  const mime = file.type.toLowerCase()
  return ext === 'heic' || ext === 'heif' || mime === 'image/heic' || mime === 'image/heif'
}

function isIfcFile(file: File | null) {
  return Boolean(file && extensionFrom(file.name) === 'ifc')
}

function needsRevitConversion(file: File | null) {
  return Boolean(file && extensionFrom(file.name) === 'rvt')
}

function needsCadConversion(file: File | null) {
  if (!file) return false
  return ['dwg', 'dxf', 'skp'].includes(extensionFrom(file.name))
}

function IfcModelViewer({ file, language }: { file: File; language: Language }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<IfcViewerStatus>('loading')
  const copy = UI_COPY[language]

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let frameId = 0
    let renderer: any = null
    let cleanupResize: (() => void) | null = null

    const init = async () => {
      setStatus('loading')
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls' as any)
        const { IfcAPI } = await import('web-ifc')
        if (disposed || !mountRef.current) return

        const width = Math.max(320, mount.clientWidth)
        const height = Math.max(240, mount.clientHeight)
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf8fbff)

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 5000)
        camera.position.set(12, 10, 16)

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        mount.appendChild(renderer.domElement)

        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const key = new THREE.DirectionalLight(0xffffff, 1.15)
        key.position.set(12, 18, 10)
        scene.add(key)
        scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x43566f, 0.5))
        scene.add(new THREE.GridHelper(80, 40, 0xcfd7e6, 0xe8edf5))

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08

        const fitCamera = (object: any) => {
          const box = new THREE.Box3().setFromObject(object)
          const center = new THREE.Vector3()
          const size = new THREE.Vector3()
          box.getCenter(center)
          box.getSize(size)
          object.position.sub(center)
          const maxDim = Math.max(size.x, size.y, size.z) || 10
          camera.position.set(maxDim * 1.1, maxDim * 0.9, maxDim * 1.25)
          camera.near = Math.max(0.01, maxDim * 0.001)
          camera.far = maxDim * 80
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
          controls.update()
        }

        const bytes = new Uint8Array(await file.arrayBuffer())
        const ifcAPI = new IfcAPI()
        ifcAPI.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/')
        await ifcAPI.Init()
        const modelID = ifcAPI.OpenModel(bytes)
        const group = new THREE.Group()

        ifcAPI.StreamAllMeshes(modelID, (mesh: any) => {
          const placedGeometries = mesh.geometries
          for (let i = 0; i < placedGeometries.size(); i += 1) {
            const placedGeometry = placedGeometries.get(i)
            const geometry = ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID)
            const verts = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize())
            const indices = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize())
            if (!verts.length || !indices.length) {
              geometry.delete()
              continue
            }

            const vertexCount = verts.length / 6
            const positions = new Float32Array(vertexCount * 3)
            const normals = new Float32Array(vertexCount * 3)
            for (let j = 0; j < vertexCount; j += 1) {
              positions[j * 3] = verts[j * 6]
              positions[j * 3 + 1] = verts[j * 6 + 1]
              positions[j * 3 + 2] = verts[j * 6 + 2]
              normals[j * 3] = verts[j * 6 + 3]
              normals[j * 3 + 1] = verts[j * 6 + 4]
              normals[j * 3 + 2] = verts[j * 6 + 5]
            }

            const bufferGeometry = new THREE.BufferGeometry()
            bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
            bufferGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))

            const c = placedGeometry.color
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(c.x, c.y, c.z),
              opacity: c.w,
              transparent: c.w < 1,
              side: THREE.DoubleSide,
              metalness: 0.05,
              roughness: 0.72,
            })
            const part = new THREE.Mesh(bufferGeometry, material)
            part.applyMatrix4(new THREE.Matrix4().fromArray(placedGeometry.flatTransformation))
            group.add(part)
            geometry.delete()
          }
        })

        ifcAPI.CloseModel(modelID)
        scene.add(group)
        if (group.children.length) {
          fitCamera(group)
          setStatus('ready')
        } else {
          setStatus('empty')
        }

        const animate = () => {
          if (disposed) return
          frameId = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
          if (!mountRef.current || !renderer) return
          const nextWidth = Math.max(320, mountRef.current.clientWidth)
          const nextHeight = Math.max(240, mountRef.current.clientHeight)
          camera.aspect = nextWidth / nextHeight
          camera.updateProjectionMatrix()
          renderer.setSize(nextWidth, nextHeight)
        }
        window.addEventListener('resize', onResize)
        cleanupResize = () => window.removeEventListener('resize', onResize)
      } catch {
        if (!disposed) setStatus('error')
      }
    }

    init()

    return () => {
      disposed = true
      if (frameId) cancelAnimationFrame(frameId)
      cleanupResize?.()
      if (renderer) {
        renderer.dispose?.()
        renderer.domElement?.remove?.()
      }
      while (mount.firstChild) mount.removeChild(mount.firstChild)
    }
  }, [file])

  const statusText =
    status === 'ready'
      ? copy.ifcReady
      : status === 'empty'
        ? copy.ifcEmpty
        : status === 'error'
          ? copy.ifcError
          : copy.ifcLoading

  return (
    <div style={styles.ifcViewerShell}>
      <div ref={mountRef} style={styles.ifcCanvas} />
      <span style={{
        ...styles.viewerStatus,
        ...(status === 'error' ? styles.viewerStatusError : null),
      }}>
        {statusText}
      </span>
    </div>
  )
}

function routeHref(routeId: Cp32SmartRoute['routeId']) {
  if (routeId === 'archvis-render') return '/archvis'
  if (routeId === 'directcut-video') return '/director-cut'
  if (routeId === 'bim-clash') return '/bim-3d'
  if (routeId === 'quantity-budget') return '/orcamento'
  if (routeId === 'legal-permits') return '/juridico/contratos'
  if (routeId === 'marketing-social') return '/platform?area=marketing'
  if (routeId === 'field-operations') return '/rdo'
  return '/documentos'
}

function livingAgentsFor(routes: Cp32SmartRoute[]) {
  const ordered: LivingAgentId[] = []
  routes.forEach(route => {
    ROUTE_AGENT_MAP[route.routeId].forEach(agentId => {
      if (!ordered.includes(agentId)) ordered.push(agentId)
    })
  })
  return ordered.slice(0, 5).map(agentId => LIVING_AGENTS[agentId])
}

function agentHref(agentId: LivingAgentId) {
  if (agentId === 'archvis-render') return '/archvis'
  if (agentId === 'directcut-video') return '/director-cut'
  if (agentId === 'bim-clash') return '/bim-3d'
  if (agentId === 'budget-quantity') return '/orcamento'
  if (agentId === 'contract-legal') return '/juridico/contratos'
  if (agentId === 'marketing') return '/platform?area=marketing'
  if (agentId === 'field-operations') return '/rdo'
  return '/documentos'
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const copilotRef = useRef<HTMLDivElement>(null)
  const copilotRequestRef = useRef(0)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const [language, setLanguage] = useState<Language>('en')
  const [file, setFile] = useState<File | null>(null)
  const [intent, setIntent] = useState('')
  const [selectedObjective, setSelectedObjective] = useState<IntakeKind>('generic')
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([])
  const [copilotLoading, setCopilotLoading] = useState(false)
  const copy = UI_COPY[language]
  const intentCards = INTENT_CARDS[language]

  useEffect(() => {
    if (!file || !file.type.startsWith('image/') || isHeicFile(file)) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('apex-language')
    if (saved === 'en' || saved === 'pt') setLanguage(saved)
    function handleLanguage(event: Event) {
      const nextLanguage = (event as CustomEvent<Language>).detail
      if (nextLanguage === 'en' || nextLanguage === 'pt') setLanguage(nextLanguage)
    }
    window.addEventListener('apex-language-change', handleLanguage)
    return () => window.removeEventListener('apex-language-change', handleLanguage)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const focus = () => {
      copilotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener('apex-welcome-copilot-focus', focus)
    return () => window.removeEventListener('apex-welcome-copilot-focus', focus)
  }, [])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    let active = true

    async function syncSession() {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (!active) return
      const token = typeof session?.access_token === 'string' ? session.access_token.trim() : ''
      setAuthToken(token || null)
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const token = typeof session?.access_token === 'string' ? session.access_token.trim() : ''
      setAuthToken(token || null)
    })

    syncSession().catch(() => {
      if (active) setAuthToken(null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (result) {
      setResult(buildIntakeResult(file, intent, selectedObjective))
    }
  }, [language])

  function buildIntakeResult(nextFile = file, nextIntent = intent, nextObjective = selectedObjective) {
    const base = classify(nextFile?.name || '', nextIntent, language)
    return {
      ...base,
      smartRoutes: runCp32SmartRouting({
        fileName: nextFile?.name || '',
        fileType: nextFile?.type || '',
        goal: nextIntent,
        objective: nextObjective as Cp32Objective,
      }),
    }
  }

  async function analyzePreviewableImage(nextFile: File, prompt: string) {
    if (!authToken) return ''
    if (nextFile.size > CP4_ATTACHMENT_ANALYSIS_LIMIT) return ''
    if (!nextFile.type.startsWith('image/') || isHeicFile(nextFile)) return ''

    try {
      const dataUrl = await readFileAsDataUrl(nextFile)
      const res = await fetch('/api/chat/analyze-attachment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          prompt,
          attachment: {
            name: nextFile.name,
            type: nextFile.type || 'application/octet-stream',
            size: nextFile.size,
            dataUrl,
          },
        }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : {}
      if (!res.ok) return ''
      return typeof data?.analysis === 'string' ? data.analysis.trim() : ''
    } catch {
      return ''
    }
  }

  async function requestCopilotResponse(nextFile: File | null, nextIntent: string, nextObjective: IntakeKind, nextResult: IntakeResult) {
    const requestId = ++copilotRequestRef.current
    const previousMessages = copilotMessages
    const promptSeed = nextIntent.trim() || nextResult.interpretation
    const userText = nextFile
      ? nextIntent.trim() || (language === 'en'
        ? `Uploaded ${nextFile.name}`
        : `Arquivo enviado: ${nextFile.name}`)
      : promptSeed

    setCopilotMessages(prev => [
      ...prev,
      { id: messageId(), role: 'user', text: userText || (language === 'en' ? 'Start analysis' : 'Iniciar analise') },
    ])

    if (!nextFile && !nextIntent.trim()) {
      setCopilotMessages(prev => [
        ...prev,
        { id: messageId(), role: 'assistant', text: copy.emptyGuidance },
      ])
      return
    }

    setCopilotLoading(true)
    window.setTimeout(() => {
      copilotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)

    try {
      const attachmentAnalysis = nextFile
        ? await analyzePreviewableImage(nextFile, promptSeed)
        : ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers.Authorization = `Bearer ${authToken}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 900,
          system: buildCopilotSystemPrompt(language),
          messages: [
            ...previousMessages.slice(-8).map(message => ({
              role: message.role,
              content: message.text,
            })),
            {
              role: 'user',
              content: buildCopilotUserPrompt({
                file: nextFile,
                intent: nextIntent,
                objective: nextObjective,
                result: nextResult,
                language,
                attachmentAnalysis,
              }),
            },
          ],
        }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : {}
      const text =
        typeof data?.content?.[0]?.text === 'string'
          ? data.content[0].text.trim()
          : typeof data?.reply === 'string'
            ? data.reply.trim()
            : ''

      if (requestId !== copilotRequestRef.current) return

      setCopilotMessages(prev => [
        ...prev,
        {
          id: messageId(),
          role: 'assistant',
          text: res.ok && text ? text : data?.error?.message || copy.copilotConnectionError,
        },
      ])
    } catch {
      if (requestId !== copilotRequestRef.current) return
      setCopilotMessages(prev => [
        ...prev,
        { id: messageId(), role: 'assistant', text: copy.copilotConnectionError },
      ])
    } finally {
      if (requestId === copilotRequestRef.current) setCopilotLoading(false)
    }
  }

  function runIntake(nextFile = file, nextIntent = intent, nextObjective = selectedObjective) {
    const nextResult = buildIntakeResult(nextFile, nextIntent, nextObjective)
    setResult(nextResult)
    requestCopilotResponse(nextFile, nextIntent, nextObjective, nextResult).catch(() => {})
  }

  function selectIntent(card: IntentCard) {
    setIntent(card.prompt)
    setSelectedObjective(card.kind)
    runIntake(file, card.prompt, card.kind)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    if (nextFile) runIntake(nextFile, intent, selectedObjective)
  }

  function focusCopilot() {
    copilotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section style={styles.page}>
      <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={handleFile} />

      <div style={styles.hero}>
        <div style={styles.heroCopy}>
          <span style={styles.kicker}>APEX GLOBAL AI</span>
          <h1 style={styles.title}>{copy.welcome}</h1>
          <p style={styles.lead}>{copy.lead}</p>
          <p style={styles.sublead}>{copy.sublead}</p>
          <div style={styles.heroActions}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.primaryButton}><Upload size={17} />{copy.attach}</button>
            <button type="button" onClick={focusCopilot} style={styles.secondaryButton}><MessageSquare size={17} />{copy.talk}</button>
            <button type="button" onClick={() => runIntake()} style={styles.secondaryButton}><Play size={17} />{copy.start}</button>
          </div>
          <div style={styles.trustGrid}>
            <span style={styles.trustItem}><FileText size={17} strokeWidth={2.1} />{copy.trustOne}</span>
            <span style={styles.trustItem}><Bot size={17} strokeWidth={2.1} />{copy.trustTwo}</span>
            <span style={styles.trustItem}><ShieldCheck size={17} strokeWidth={2.1} />{copy.trustThree}</span>
          </div>
        </div>
        <div style={styles.previewPanel}>
          <div style={styles.previewStage}>
            {file && isIfcFile(file) ? (
              <IfcModelViewer file={file} language={language} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview do arquivo enviado" style={styles.previewImage} />
            ) : (
              <div style={styles.previewPlaceholder}>
                <span style={styles.uploadIcon}><Upload size={31} strokeWidth={2.1} /></span>
                <strong>{file ? previewLabel(file, language) : copy.dropTitle}</strong>
                {file && <span style={styles.fileKind}>{fileKindLabel(file, language)}</span>}
                <small>
                  {file
                    ? isHeicFile(file)
                      ? copy.heicPreview
                      : needsRevitConversion(file)
                        ? copy.rvtConversion
                        : needsCadConversion(file)
                          ? copy.cadConversion
                          : copy.previewDeep
                    : copy.dropText}
                </small>
              </div>
            )}
          </div>
          <div style={styles.previewMeta}>
            <span>{file ? file.name : copy.noFile}</span>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.previewChooseButton}>
              {file ? copy.chooseAnother : copy.waiting}
            </button>
          </div>
        </div>
      </div>

      <section style={styles.intentCardsPanel}>
        <div style={styles.sectionKicker}>{copy.intentCards}</div>
        <div style={styles.intentCardsGrid}>
          {intentCards.map(card => {
            const visual = INTENT_VISUALS[card.kind]
            const Icon = visual.icon
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => selectIntent(card)}
                style={{ ...styles.intentCard, ...(result?.kind === card.kind ? styles.intentCardActive : null) }}
              >
                <span style={{ ...styles.intentIcon, color: visual.color, background: visual.background }}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span style={styles.intentCopy}>
                  <strong>{card.label}</strong>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div style={styles.intentPanel}>
        <label style={styles.intentLabel}>{copy.intentQuestion}</label>
        <div style={styles.intentRow}>
          <input
            value={intent}
            onChange={event => setIntent(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') runIntake()
            }}
            style={styles.intentInput}
            placeholder={result ? copy.chatPlaceholder : copy.intentPlaceholder}
          />
          <button type="button" onClick={() => runIntake()} style={styles.redButton} aria-label={copy.identify} title={copy.identify}>
            <Send size={22} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      {result && (
        <div ref={copilotRef} style={styles.analysisBand}>
          <section style={styles.copilotPanel}>
            <div style={styles.copilotHeader}>
              <div>
                <div style={styles.sectionKicker}>{copy.copilotConversation}</div>
                <h2 style={styles.analysisTitle}>Apex Copilot</h2>
              </div>
              <span style={styles.code}>{result.code}</span>
            </div>
            <div style={styles.chatStack}>
              {copilotMessages.length === 0 && (
                <p style={styles.copilotEmpty}>{copy.copilotEmpty}</p>
              )}
              {copilotMessages.map(message => (
                <article
                  key={message.id}
                  style={{
                    ...styles.chatBubble,
                    ...(message.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant),
                  }}
                >
                  <strong>{message.role === 'user' ? (language === 'en' ? 'You' : 'Voce') : 'Apex Copilot'}</strong>
                  <span>{message.text}</span>
                </article>
              ))}
              {copilotLoading && (
                <article style={{ ...styles.chatBubble, ...styles.chatBubbleAssistant }}>
                  <strong>Apex Copilot</strong>
                  <span>{copy.copilotThinking}</span>
                </article>
              )}
            </div>
          </section>

          <section style={styles.routesPanel}>
            <div style={styles.sectionKicker}>{copy.recommendedNextSteps}</div>
            <p style={styles.routesIntro}>
              {result.smartRoutes[0]?.recommendedNextAction[language] || result.explanation}
            </p>
            <div style={styles.nextStepGrid}>
              {result.nextSteps.slice(0, 6).map(step => (
                <button key={`${step.title}-${step.href}`} type="button" onClick={() => (step.href === '/dashboard' ? focusCopilot() : router.push(step.href))} style={styles.nextStepCard}>
                  <strong>{step.title}</strong>
                </button>
              ))}
            </div>
            <div style={styles.smartRouteStrip}>
              {result.smartRoutes.map(route => (
                <span key={route.routeId} style={styles.smartRoutePill}>
                  {route.confidence}% · {route.title[language]}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}

      {isOwner && (
        <div style={styles.ownerArea}>
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>
            {copy.ownerButton}
          </button>
        </div>
      )}
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 88px)',
    background: '#ffffff',
    border: 'none',
    borderRadius: 0,
    padding: '24px 42px 26px',
    color: '#071a33',
    width: 'calc(100% - 28px)',
    maxWidth: 1600,
    margin: '0 auto',
    boxShadow: 'none',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(460px, .43fr) minmax(620px, .57fr)',
    gap: 48,
    alignItems: 'stretch',
  },
  heroCopy: {
    borderLeft: '5px solid #d7192a',
    padding: '12px 0 12px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  kicker: {
    color: '#d7192a',
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 0,
  },
  title: {
    margin: '10px 0 0',
    fontSize: 43,
    lineHeight: 1,
    letterSpacing: 0,
    color: '#071a33',
  },
  lead: {
    margin: '14px 0 0',
    color: '#0d2b52',
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  sublead: {
    margin: '8px 0 0',
    color: '#0d2b52',
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  heroActions: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 22,
  },
  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 20,
    marginTop: 24,
    maxWidth: 570,
  },
  trustItem: {
    color: '#0d2b52',
    padding: '4px 0',
    fontSize: 14,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 11,
    lineHeight: 1.35,
  },
  primaryButton: {
    border: 'none',
    borderRadius: 8,
    background: '#d7192a',
    color: '#ffffff',
    padding: '13px 20px',
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 14px 24px rgba(215,25,42,.18)',
  },
  secondaryButton: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    color: '#071a33',
    padding: '12px 18px',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 10px 24px rgba(7,26,51,.04)',
  },
  previewPanel: {
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    minHeight: 328,
    display: 'grid',
    gridTemplateRows: '1fr auto',
    gap: 14,
    fontFamily: 'inherit',
    textAlign: 'left',
    boxShadow: '0 20px 46px rgba(7,26,51,.07)',
  },
  previewStage: {
    minHeight: 232,
    border: '1px dashed #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#ffffff',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 232,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    color: '#0d2b52',
    textAlign: 'center',
    padding: 24,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: '#e9edf5',
    color: '#071a33',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    color: '#d7192a',
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  },
  fileKind: {
    borderRadius: 999,
    background: '#f1f5fb',
    color: '#5f6b7a',
    padding: '5px 9px',
    fontSize: 12,
    fontWeight: 800,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    color: '#0d2b52',
    fontSize: 14,
  },
  previewChooseButton: {
    border: 'none',
    borderRadius: 999,
    background: '#e9edf5',
    color: '#071a33',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  ifcViewerShell: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 276,
    background: '#f8fbff',
  },
  ifcCanvas: {
    width: '100%',
    height: '100%',
    minHeight: 276,
  },
  viewerStatus: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 999,
    background: 'rgba(7, 26, 51, .88)',
    color: '#ffffff',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'center',
    boxShadow: '0 12px 24px rgba(7,26,51,.20)',
    pointerEvents: 'none',
  },
  viewerStatusError: {
    background: 'rgba(215, 25, 42, .92)',
  },
  intentCardsPanel: {
    marginTop: 12,
    border: 'none',
    borderRadius: 0,
    background: '#ffffff',
    padding: 0,
    boxShadow: 'none',
  },
  intentCardsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  intentCard: {
    minHeight: 0,
    border: '1px solid #cfd7e6',
    borderRadius: 999,
    background: '#ffffff',
    color: '#071a33',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 8px 18px rgba(7,26,51,.045)',
  },
  intentCardActive: {
    borderColor: '#d7192a',
    boxShadow: '0 0 0 3px rgba(215,25,42,.10), 0 16px 30px rgba(7,26,51,.08)',
  },
  intentIcon: {
    flex: '0 0 auto',
    width: 30,
    height: 30,
    borderRadius: 9,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    fontSize: 13,
    lineHeight: 1.2,
  },
  intentPanel: {
    marginTop: 14,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    width: 'min(100%, 1280px)',
    boxShadow: '0 18px 42px rgba(7,26,51,.045)',
  },
  intentLabel: {
    display: 'block',
    color: '#071a33',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 10,
  },
  intentRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 58px',
    gap: 12,
  },
  intentInput: {
    width: '100%',
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  redButton: {
    border: 'none',
    borderRadius: 8,
    background: '#d8deea',
    color: '#ffffff',
    width: 58,
    minHeight: 48,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisBand: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 18,
    marginTop: 20,
  },
  copilotPanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: 'linear-gradient(180deg, #071a33 0%, #0d2b52 100%)',
    color: '#ffffff',
    padding: 18,
    minHeight: 420,
    boxShadow: '0 20px 46px rgba(7,26,51,.12)',
  },
  copilotHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  chatStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: 520,
    overflowY: 'auto',
    paddingRight: 4,
  },
  copilotEmpty: {
    margin: 0,
    border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 8,
    background: 'rgba(255,255,255,.08)',
    color: '#d6dde8',
    padding: 14,
    fontSize: 14,
    lineHeight: 1.6,
  },
  chatBubble: {
    borderRadius: 8,
    padding: '13px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 14,
    lineHeight: 1.58,
    whiteSpace: 'pre-wrap',
  },
  chatBubbleAssistant: {
    alignSelf: 'stretch',
    border: '1px solid rgba(255,255,255,.16)',
    background: 'rgba(255,255,255,.09)',
    color: '#ffffff',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    background: '#ffffff',
    color: '#071a33',
    boxShadow: '0 12px 24px rgba(0,0,0,.12)',
  },
  analysisPanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#071a33',
    color: '#ffffff',
    padding: 18,
  },
  sectionKicker: {
    color: '#d7192a',
    fontSize: 14,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 12,
  },
  code: {
    display: 'inline-flex',
    border: '1px solid rgba(255,255,255,.22)',
    borderRadius: 8,
    padding: '6px 9px',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 14,
  },
  analysisTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
  },
  analysisText: {
    margin: '12px 0 0',
    color: '#d6dde8',
    fontSize: 13,
    lineHeight: 1.65,
  },
  nextAction: {
    margin: '14px 0 0',
    borderTop: '1px solid rgba(255,255,255,.18)',
    paddingTop: 12,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  },
  routesPanel: {
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 14,
  },
  routesIntro: {
    margin: '-4px 0 14px',
    color: '#5f6b7a',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.55,
  },
  nextStepGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
  },
  nextStepCard: {
    border: '1px solid #cfd7e6',
    borderRadius: 999,
    background: '#f9fbfd',
    color: '#071a33',
    padding: '9px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    boxShadow: '0 8px 18px rgba(7,26,51,.045)',
  },
  smartRouteStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  smartRoutePill: {
    borderRadius: 999,
    background: '#fff5f6',
    color: '#d7192a',
    border: '1px solid #ffd7dc',
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 900,
  },
  smartRouteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  smartRouteCard: {
    minHeight: 198,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#f9fbfd',
    color: '#071a33',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 10px 22px rgba(7,26,51,.055)',
  },
  confidence: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    background: '#fff5f6',
    color: '#d7192a',
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 900,
  },
  routeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  routeCard: {
    minHeight: 130,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#f9fbfd',
    color: '#071a33',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  agentsPanel: {
    marginTop: 20,
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
    padding: 20,
    boxShadow: '0 18px 42px rgba(7,26,51,.055)',
  },
  agentHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
  },
  agentIntro: {
    margin: '-4px 0 0',
    color: '#5f6b7a',
    fontSize: 14,
    lineHeight: 1.55,
    maxWidth: 760,
  },
  agentWorkspaceBadge: {
    borderRadius: 999,
    background: '#071a33',
    color: '#ffffff',
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '.04em',
  },
  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
  },
  agentCard: {
    minHeight: 360,
    border: '1px solid #cfd7e6',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    textAlign: 'left',
    color: '#071a33',
    fontFamily: 'inherit',
    boxShadow: '0 14px 28px rgba(7,26,51,.06)',
  },
  agentCardPrimary: {
    borderColor: '#d7192a',
    boxShadow: '0 0 0 3px rgba(215,25,42,.08), 0 20px 38px rgba(7,26,51,.09)',
  },
  agentTopLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  agentIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentSignal: {
    borderRadius: 999,
    background: '#fff5f6',
    color: '#d7192a',
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  agentName: {
    margin: 0,
    color: '#071a33',
    fontSize: 22,
    lineHeight: 1.15,
  },
  agentCategory: {
    margin: '-6px 0 0',
    color: '#5f6b7a',
    fontSize: 13,
    fontWeight: 800,
  },
  agentFactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 9,
  },
  agentFact: {
    border: '1px solid #e3e8f2',
    borderRadius: 8,
    background: '#f9fbfd',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 118,
  },
  agentQualityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  agentPositive: {
    borderLeft: '4px solid #14aa52',
    borderRadius: 8,
    background: '#f0fbf4',
    color: '#0d2b52',
    padding: 11,
    fontSize: 13,
    lineHeight: 1.45,
  },
  agentAttention: {
    borderLeft: '4px solid #d7192a',
    borderRadius: 8,
    background: '#fff5f6',
    color: '#0d2b52',
    padding: 11,
    fontSize: 13,
    lineHeight: 1.45,
  },
  agentAction: {
    marginTop: 'auto',
    border: 'none',
    borderRadius: 8,
    color: '#ffffff',
    padding: '12px 14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 12px 24px rgba(7,26,51,.14)',
  },
  ownerArea: {
    marginTop: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  ownerTitle: {
    margin: 0,
    color: '#071a33',
    fontSize: 18,
  },
  ownerText: {
    margin: '6px 0 0',
    color: '#5f6b7a',
    fontSize: 13,
  },
  ownerButton: {
    border: 'none',
    borderRadius: 8,
    background: '#071a33',
    color: '#fff',
    padding: '17px 30px',
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    boxShadow: '0 18px 34px rgba(7,26,51,.18)',
  },
}
