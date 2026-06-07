import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, KeyboardEvent } from 'react'
import { useRouter } from 'next/router'
import {
  Bot,
  Clapperboard,
  FileText,
  ImageIcon,
  MessageSquare,
  Play,
  Send,
  Upload,
  Workflow,
} from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { selectApexCopilotSkill } from '../lib/apex-copilot/skill-router'
import type { Profile } from '../pages/dashboard'

type Language = 'en' | 'pt'
type StudioRoute = 'archvis' | 'directcut' | 'bim' | 'document' | 'unknown'
type ViewerState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string }
type AttachmentUnderstanding = {
  kind: 'image'
  filename: string
  analysis: string
  model?: string
}
type StudioResult = {
  route: StudioRoute
  title: string
  summary: string
  prompt: string
  chips: Array<{ label: string; route: StudioRoute }>
}

const COPY = {
  en: {
    badge: 'APEX GLOBAL AI',
    title: 'Apex Copilot Studio',
    lead: 'Upload a construction file and Apex Copilot starts the conversation.',
    upload: 'Upload file',
    start: 'Start analysis',
    talk: 'Talk to Apex Copilot',
    filePanel: 'File / context',
    chatPanel: 'Apex Copilot',
    resultPanel: 'Result / viewer',
    noFile: 'No file uploaded yet',
    drop: 'Images, PDFs, IFC, RVT, DWG, DXF, SKP, video, spreadsheets and any other file.',
    input: 'Ask Apex Copilot what to do next...',
    send: 'Send',
    emptyChat: 'Upload a file or describe the goal. The answer appears here as a real conversation.',
    thinking: 'Apex Copilot is analyzing...',
    noResult: 'The result, viewer or generated output will appear here.',
    ifcLoading: 'Loading uploaded IFC model...',
    ifcReady: 'IFC loaded. Drag to orbit and scroll to zoom.',
    ifcEmpty: 'IFC loaded, but no renderable mesh was found.',
    ifcError: 'IFC viewer failed to load this uploaded model.',
    rvt: 'RVT requires conversion to IFC or glTF before browser preview. Apex Copilot can guide the import path.',
    cad: 'DWG/DXF/SKP require a converter/viewer pipeline before browser preview. No fake viewer is shown.',
    pdf: 'PDF preview is visible when the browser supports it.',
    unknown: 'File accepted. Apex Copilot will inspect metadata and your objective to choose the next path.',
    owner: 'Executive Dashboard',
    archvis: 'Open ArchVis / Humanizacao',
    directcut: 'Open DirectCut',
    bim: 'Open BIM / 3D Viewer',
  },
  pt: {
    badge: 'APEX GLOBAL AI',
    title: 'Apex Copilot Studio',
    lead: 'Anexe um arquivo de construcao e o Apex Copilot inicia a conversa.',
    upload: 'Anexar arquivo',
    start: 'Iniciar analise',
    talk: 'Falar com Apex Copilot',
    filePanel: 'Arquivo / contexto',
    chatPanel: 'Apex Copilot',
    resultPanel: 'Resultado / viewer',
    noFile: 'Nenhum arquivo anexado ainda',
    drop: 'Imagens, PDFs, IFC, RVT, DWG, DXF, SKP, video, planilhas e qualquer outro arquivo.',
    input: 'Pergunte ao Apex Copilot o proximo passo...',
    send: 'Enviar',
    emptyChat: 'Anexe um arquivo ou descreva o objetivo. A resposta aparece aqui como conversa real.',
    thinking: 'Apex Copilot esta analisando...',
    noResult: 'O resultado, viewer ou output gerado aparecera aqui.',
    ifcLoading: 'Carregando modelo IFC enviado...',
    ifcReady: 'IFC carregado. Arraste para orbitar e role para zoom.',
    ifcEmpty: 'IFC carregado, mas nenhum mesh renderizavel foi encontrado.',
    ifcError: 'O viewer IFC falhou ao carregar este modelo enviado.',
    rvt: 'RVT exige conversao para IFC ou glTF antes do preview no navegador. O Apex Copilot pode orientar a importacao.',
    cad: 'DWG/DXF/SKP exigem pipeline de conversao/viewer antes do preview. Nenhum viewer falso e exibido.',
    pdf: 'Preview PDF aparece quando o navegador suporta.',
    unknown: 'Arquivo aceito. O Apex Copilot analisara metadados e objetivo para escolher o caminho.',
    owner: 'Dashboard Executivo',
    archvis: 'Abrir ArchVis / Humanizacao',
    directcut: 'Abrir DirectCut',
    bim: 'Abrir BIM / 3D Viewer',
  },
} satisfies Record<Language, Record<string, string>>

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function extension(fileName = '') {
  const parts = fileName.toLowerCase().split('?')[0].split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  const owners = (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
  return Boolean(
    profile.is_owner ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'diretor_executivo' ||
    owners.includes(String(profile.email || '').toLowerCase())
  )
}

function fileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${size} bytes`
}

function isPreviewableImage(file: File | null) {
  if (!file) return false
  const ext = extension(file.name)
  return file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function routeFor(file: File | null, goal: string): StudioRoute {
  const ext = file ? extension(file.name) : ''
  const text = `${file?.name || ''} ${file?.type || ''} ${goal}`.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext) || /render|planta|floor plan|fachada|humaniza|visual|archvis/i.test(text)) return 'archvis'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || /video|timelapse|directcut|tour|reel/i.test(text)) return 'directcut'
  if (['ifc', 'rvt', 'dwg', 'dxf', 'skp', 'stl', 'obj', 'fbx', 'glb', 'gltf'].includes(ext) || /bim|revit|ifc|clash|cad|modelo/i.test(text)) return 'bim'
  if (['pdf', 'doc', 'docx', 'xlsx', 'xls', 'csv', 'txt'].includes(ext) || /contract|contrato|budget|orcamento|invoice|permit|legal|document/i.test(text)) return 'document'
  return 'unknown'
}

function quickChips(route: StudioRoute, language: Language): StudioResult['chips'] {
  const en = language === 'en'
  if (route === 'archvis') {
    return [
      { label: en ? 'Humanize plan' : 'Humanizar planta', route: 'archvis' },
      { label: en ? 'Create render prompt' : 'Criar prompt de render', route: 'archvis' },
      { label: en ? 'Build sales board' : 'Criar prancha comercial', route: 'archvis' },
    ]
  }
  if (route === 'directcut') {
    return [
      { label: en ? 'Create shot list' : 'Criar shot list', route: 'directcut' },
      { label: en ? 'Build timeline' : 'Criar timeline', route: 'directcut' },
      { label: en ? 'Open DirectCut' : 'Abrir DirectCut', route: 'directcut' },
    ]
  }
  if (route === 'bim') {
    return [
      { label: en ? 'Open 3D viewer' : 'Abrir viewer 3D', route: 'bim' },
      { label: en ? 'Check clashes' : 'Checar clashes', route: 'bim' },
      { label: en ? 'Prepare takeoff' : 'Preparar quantitativo', route: 'bim' },
    ]
  }
  return [
    { label: en ? 'Review as document' : 'Revisar como documento', route: 'document' },
    { label: en ? 'Ask next question' : 'Perguntar proximo passo', route: 'unknown' },
    { label: en ? 'Send to technical review' : 'Enviar para revisao tecnica', route: 'bim' },
  ]
}

function buildResult(file: File | null, goal: string, language: Language): StudioResult {
  const route = routeFor(file, goal)
  const ext = file ? extension(file.name).toUpperCase() || 'FILE' : 'TEXT'
  const en = language === 'en'
  const titleMap: Record<StudioRoute, string> = {
    archvis: en ? 'ArchVis / Humanizacao path' : 'Rota ArchVis / Humanizacao',
    directcut: en ? 'DirectCut / Video path' : 'Rota DirectCut / Video',
    bim: en ? 'BIM / 3D / Viewer path' : 'Rota BIM / 3D / Viewer',
    document: en ? 'Document / budget / legal path' : 'Rota documento / orcamento / juridico',
    unknown: en ? 'General construction intake' : 'Intake geral de construcao',
  }
  const summaryMap: Record<StudioRoute, string> = {
    archvis: en ? 'This should become visual production: humanized plan, render, facade study or sales material.' : 'Isto deve virar producao visual: planta humanizada, render, fachada ou material comercial.',
    directcut: en ? 'This points to video planning: script, shot list, timeline, scenes and delivery format.' : 'Isto aponta para video: roteiro, shot list, timeline, cenas e formato de entrega.',
    bim: en ? 'This belongs to technical model review, viewer, clash, quantities or coordination.' : 'Isto pertence a revisao tecnica, viewer, clash, quantitativo ou coordenacao.',
    document: en ? 'This belongs to document analysis, cost, contract, invoice, permit or proposal review.' : 'Isto pertence a analise documental, custo, contrato, invoice, permit ou proposta.',
    unknown: en ? 'The file is accepted; Apex Copilot needs the desired outcome to choose the safest route.' : 'O arquivo foi aceito; o Apex Copilot precisa do resultado desejado para escolher a rota segura.',
  }
  return {
    route,
    title: titleMap[route],
    summary: summaryMap[route],
    prompt: en
      ? `Respond naturally to this ${ext} intake as a construction consultant. Explain what you can understand now and guide the next practical step.`
      : `Responda naturalmente a este intake ${ext} como consultor de construcao. Explique o que voce consegue entender agora e oriente o proximo passo pratico.`,
    chips: quickChips(route, language),
  }
}

function systemPrompt(language: Language) {
  return [
    'You are Apex Copilot, a real conversational construction AI assistant inside Apex Global AI.',
    'Behave like ChatGPT in a live conversation: natural, attentive, practical, and specialized in construction.',
    'Do not answer as a classifier or report generator. Do not use sections like Assumptions, Risks, Required inputs, or Output format unless the user asks for a formal report.',
    'Specialize in architecture, construction, BIM/Revit/IFC/CAD, ArchVis/render, humanized floor plans, budgets, quantity takeoff, schedules, field operations, contracts, permits, compliance and construction marketing.',
    'When a file is uploaded, react naturally: say what you received, what you can understand from preview or metadata, what you cannot know yet, and the best next practical step.',
    'If only metadata is available, say that clearly. If a viewer, parser or converter is needed, say so honestly and guide the user.',
    'End with one clear next-step question. Offer options in natural language, not card-style output.',
    `Reply in ${language === 'en' ? 'English' : 'Brazilian Portuguese'}.`,
  ].join('\n')
}

function userPrompt(
  file: File | null,
  goal: string,
  result: StudioResult,
  language: Language,
  attachmentUnderstanding: AttachmentUnderstanding | null,
) {
  const skill = selectApexCopilotSkill({
    text: goal,
    fileName: file?.name || '',
    fileType: file?.type || '',
  })
  return [
    'Apex Copilot Studio live chat request.',
    `Language: ${language === 'en' ? 'English' : 'Brazilian Portuguese'}`,
    file
      ? `File metadata:\n- name: ${file.name}\n- extension: ${extension(file.name) || 'unknown'}\n- MIME: ${file.type || 'unknown'}\n- size: ${fileSize(file.size)}`
      : 'No file uploaded yet.',
    `User goal: ${goal.trim() || '(not provided)'}`,
    `Internal route hint: ${result.title}`,
    `Route context: ${result.summary}`,
    `Conversation guidance: ${result.prompt}`,
    `Apex Copilot registry hint: ${skill.domain} - ${skill.title}`,
    attachmentUnderstanding
      ? [
          'Actual attachment content analysis was completed successfully.',
          `Attachment analysis type: ${attachmentUnderstanding.kind}`,
          `Attachment analysis model: ${attachmentUnderstanding.model || 'OpenAI vision-capable model'}`,
          `Ground the answer in this visual understanding:\n${attachmentUnderstanding.analysis}`,
          'Because actual image content was analyzed, do not say you cannot inspect the image. Mention visible construction/architectural features from the analysis.',
        ].join('\n')
      : 'Actual attachment content analysis was not available. If this is not an image, or if analysis failed, be honest and use metadata only.',
    'Now answer as Apex Copilot in a live chat message. Do not output dashboard cards. Do not produce a mechanical report. Ask one useful next-step question.',
  ].join('\n\n')
}

function openCopilot() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('apex-welcome-copilot-focus'))
}

async function saveBimFile(file: File) {
  const buffer = await file.arrayBuffer()
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('bim3d', 1)
    req.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files')
    }
    req.onerror = () => reject(new Error('IndexedDB unavailable'))
    req.onsuccess = (event: any) => {
      const db = event.target.result
      const tx = db.transaction('files', 'readwrite')
      tx.objectStore('files').put(buffer, 'current')
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(new Error('Could not store model file'))
      }
    }
  })
  localStorage.setItem('bim3d_file_ext', extension(file.name))
}

function IfcViewer({ file, language }: { file: File; language: Language }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ViewerState>('loading')
  const [error, setError] = useState('')
  const copy = COPY[language]

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let frame = 0
    let renderer: any = null
    let removeResize: (() => void) | null = null

    async function init() {
      setState('loading')
      setError('')
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls' as any)
        const { IfcAPI } = await import('web-ifc')
        if (disposed) return
        const width = Math.max(320, mount.clientWidth)
        const height = Math.max(260, mount.clientHeight)
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf7f9fc)
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10000)
        camera.position.set(10, 9, 14)
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        mount.appendChild(renderer.domElement)
        scene.add(new THREE.AmbientLight(0xffffff, 0.78))
        const sun = new THREE.DirectionalLight(0xffffff, 1.1)
        sun.position.set(8, 16, 10)
        scene.add(sun)
        scene.add(new THREE.GridHelper(90, 45, 0xcbd5e1, 0xe2e8f0))
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true

        const bytes = new Uint8Array(await file.arrayBuffer())
        const ifc = new IfcAPI()
        ifc.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/')
        await ifc.Init()
        const modelID = ifc.OpenModel(bytes)
        const group = new THREE.Group()
        ifc.StreamAllMeshes(modelID, (mesh: any) => {
          const placed = mesh.geometries
          for (let i = 0; i < placed.size(); i += 1) {
            const pg = placed.get(i)
            const geom = ifc.GetGeometry(modelID, pg.geometryExpressID)
            const verts = ifc.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize())
            const indices = ifc.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize())
            if (!verts.length || !indices.length) {
              geom.delete()
              continue
            }
            const count = verts.length / 6
            const positions = new Float32Array(count * 3)
            const normals = new Float32Array(count * 3)
            for (let j = 0; j < count; j += 1) {
              positions[j * 3] = verts[j * 6]
              positions[j * 3 + 1] = verts[j * 6 + 1]
              positions[j * 3 + 2] = verts[j * 6 + 2]
              normals[j * 3] = verts[j * 6 + 3]
              normals[j * 3 + 1] = verts[j * 6 + 4]
              normals[j * 3 + 2] = verts[j * 6 + 5]
            }
            const buffer = new THREE.BufferGeometry()
            buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            buffer.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
            buffer.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
            const c = pg.color
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(c.x, c.y, c.z),
              opacity: c.w,
              transparent: c.w < 1,
              side: THREE.DoubleSide,
              roughness: 0.75,
            })
            const part = new THREE.Mesh(buffer, material)
            part.applyMatrix4(new THREE.Matrix4().fromArray(pg.flatTransformation))
            group.add(part)
            geom.delete()
          }
        })
        ifc.CloseModel(modelID)
        scene.add(group)
        if (!group.children.length) {
          setState('empty')
        } else {
          const box = new THREE.Box3().setFromObject(group)
          const center = new THREE.Vector3()
          const size = new THREE.Vector3()
          box.getCenter(center)
          box.getSize(size)
          group.position.sub(center)
          const maxDim = Math.max(size.x, size.y, size.z) || 10
          camera.position.set(maxDim * 1.15, maxDim, maxDim * 1.25)
          camera.near = Math.max(0.01, maxDim * 0.001)
          camera.far = maxDim * 80
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
          controls.update()
          setState('ready')
        }
        const animate = () => {
          if (disposed) return
          frame = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()
        const resize = () => {
          if (!mountRef.current || !renderer) return
          const w = Math.max(320, mountRef.current.clientWidth)
          const h = Math.max(260, mountRef.current.clientHeight)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener('resize', resize)
        removeResize = () => window.removeEventListener('resize', resize)
      } catch (err: any) {
        setError(err?.message || 'Unknown IFC load error')
        setState('error')
      }
    }

    init()
    return () => {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
      removeResize?.()
      renderer?.dispose?.()
      renderer?.domElement?.remove?.()
      while (mount.firstChild) mount.removeChild(mount.firstChild)
    }
  }, [file])

  const message =
    state === 'ready' ? copy.ifcReady :
    state === 'empty' ? copy.ifcEmpty :
    state === 'error' ? `${copy.ifcError}${error ? ` ${error}` : ''}` :
    copy.ifcLoading

  return (
    <div style={styles.ifcShell}>
      <div ref={mountRef} style={styles.ifcCanvas} />
      <span style={{ ...styles.viewerBadge, ...(state === 'error' ? styles.errorBadge : null) }}>{message}</span>
    </div>
  )
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const [language, setLanguage] = useState<Language>('en')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [goal, setGoal] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StudioResult | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const copy = COPY[language]
  const ext = file ? extension(file.name) : ''

  useEffect(() => {
    const saved = window.localStorage.getItem('apex-language')
    if (saved === 'en' || saved === 'pt') setLanguage(saved)
    const onLanguage = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail
      if (next === 'en' || next === 'pt') setLanguage(next)
    }
    const focus = () => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.addEventListener('apex-language-change', onLanguage)
    window.addEventListener('apex-welcome-copilot-focus', focus)
    return () => {
      window.removeEventListener('apex-language-change', onLanguage)
      window.removeEventListener('apex-welcome-copilot-focus', focus)
    }
  }, [])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    let active = true
    sb.auth.getSession().then(({ data }) => {
      if (active) setAuthToken(data.session?.access_token || null)
    }).catch(() => {})
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token || null)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!file) {
      setFileUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function askCopilot(nextFile = file, nextGoal = goal, userLabel?: string) {
    const nextResult = buildResult(nextFile, nextGoal, language)
    setResult(nextResult)
    const userText = userLabel || nextGoal.trim() || (nextFile
      ? language === 'en'
        ? `I uploaded ${nextFile.name}. Please inspect it and guide me.`
        : `Anexei ${nextFile.name}. Por favor, analise e me oriente.`
      : copy.start)
    setMessages(prev => [...prev, { id: id(), role: 'user', text: userText }])
    if (!nextFile && !nextGoal.trim()) {
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text: copy.emptyChat }])
      return
    }
    setLoading(true)
    window.setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers.Authorization = `Bearer ${authToken}`
      let attachmentUnderstanding: AttachmentUnderstanding | null = null
      if (nextFile && isPreviewableImage(nextFile) && authToken) {
        try {
          const dataUrl = await readFileAsDataUrl(nextFile)
          const imagePrompt = language === 'en'
            ? 'Analyze this uploaded construction/architecture image directly. Describe visible elements such as floor plan layout, rooms, pool, road, landscaping, deck, circulation, facade, materials, site context, and useful ArchVis/BIM/marketing next steps. Answer factually from what is visible.'
            : 'Analise diretamente esta imagem de construcao/arquitetura enviada. Descreva elementos visiveis como planta, ambientes, piscina, rua, paisagismo, deck, circulacao, fachada, materiais, contexto do terreno e proximos passos uteis para ArchVis/BIM/marketing. Responda com base no que esta visivel.'
          const analysisRes = await fetch('/api/chat/analyze-attachment', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              attachment: {
                name: nextFile.name,
                type: nextFile.type || 'image/*',
                size: nextFile.size,
                dataUrl,
              },
              prompt: imagePrompt,
            }),
          })
          const analysisData = await analysisRes.json().catch(() => ({}))
          if (analysisRes.ok && analysisData?.analysis) {
            attachmentUnderstanding = {
              kind: 'image',
              filename: nextFile.name,
              analysis: String(analysisData.analysis).slice(0, 2400),
              model: analysisData.model,
            }
          }
        } catch {
          attachmentUnderstanding = null
        }
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          max_tokens: 900,
          system: systemPrompt(language),
          messages: [
            ...messages.slice(-8).map(message => ({ role: message.role, content: message.text })),
            { role: 'user', content: userPrompt(nextFile, nextGoal, nextResult, language, attachmentUnderstanding) },
          ],
        }),
      })
      const data = await res.json().catch(() => ({}))
      const text = data?.content?.[0]?.text || data?.reply || data?.error?.message || (language === 'en' ? 'Apex Copilot could not complete the response.' : 'O Apex Copilot nao conseguiu concluir a resposta.')
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text }])
    } catch {
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text: language === 'en' ? 'Apex Copilot is offline right now, but the file was received.' : 'O Apex Copilot esta offline agora, mas o arquivo foi recebido.' }])
    } finally {
      setLoading(false)
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null
    setFile(next)
    if (next) askCopilot(next, goal, language === 'en'
      ? `I uploaded ${next.name}. Please inspect it and guide me.`
      : `Anexei ${next.name}. Por favor, analise e me oriente.`
    ).catch(() => {})
  }

  function send(event?: KeyboardEvent<HTMLInputElement>) {
    if (event && event.key !== 'Enter') return
    askCopilot(file, goal).catch(() => {})
    setGoal('')
  }

  async function openRoute(route: StudioRoute) {
    if (route === 'archvis') {
      sessionStorage.setItem('apex_archvis_context', JSON.stringify({ fileName: file?.name || null, goal, result }))
      router.push('/archvis?from=studio')
      return
    }
    if (route === 'directcut') {
      sessionStorage.setItem('apex_directcut_context', JSON.stringify({ fileName: file?.name || null, goal, result }))
      router.push('/director-cut?from=studio')
      return
    }
    if (route === 'bim') {
      if (file) {
        try { await saveBimFile(file) } catch {}
      }
      router.push(`/bim-3d?name=${encodeURIComponent(file?.name || 'model')}&ext=${encodeURIComponent(ext || 'ifc')}`)
    }
  }

  function preview() {
    if (!file) {
      return (
        <button type="button" style={styles.dropZone} onClick={() => fileRef.current?.click()}>
          <Upload size={34} />
          <strong>{copy.upload}</strong>
          <span>{copy.drop}</span>
        </button>
      )
    }
    if (ext === 'ifc') return <IfcViewer file={file} language={language} />
    if (file.type.startsWith('image/') && !['heic', 'heif'].includes(ext)) return <img src={fileUrl} alt={file.name} style={styles.previewImage} />
    if (file.type === 'application/pdf' || ext === 'pdf') return <iframe src={fileUrl} title={file.name} style={styles.pdfFrame} />
    const warning = ext === 'rvt' ? copy.rvt : ['dwg', 'dxf', 'skp'].includes(ext) ? copy.cad : copy.unknown
    return (
      <div style={styles.filePlaceholder}>
        <FileText size={42} />
        <strong>{file.name}</strong>
        <span>{extension(file.name).toUpperCase() || 'FILE'} - {file.type || 'unknown'} - {fileSize(file.size)}</span>
        <p>{warning}</p>
      </div>
    )
  }

  const activeResult = result || buildResult(file, goal, language)

  return (
    <section style={styles.page}>
      <input ref={fileRef} type="file" accept="*/*" hidden onChange={onFile} />
      <header style={styles.header}>
        <div>
          <span style={styles.kicker}>{copy.badge}</span>
          <h1 style={styles.title}>{copy.title}</h1>
          <p style={styles.lead}>{copy.lead}</p>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.secondaryButton} onClick={() => fileRef.current?.click()}><Upload size={17} />{copy.upload}</button>
          <button type="button" style={styles.secondaryButton} onClick={openCopilot}><MessageSquare size={17} />{copy.talk}</button>
          <button type="button" style={styles.primaryButton} onClick={() => askCopilot()}><Play size={17} />{copy.start}</button>
        </div>
      </header>

      <main style={styles.studioGrid}>
        <aside style={styles.panel}>
          <div style={styles.panelTitle}>{copy.filePanel}</div>
          <div style={styles.fileMeta}>
            <strong>{file?.name || copy.noFile}</strong>
            <span>{file ? `${extension(file.name).toUpperCase() || 'FILE'} - ${file.type || 'unknown'} - ${fileSize(file.size)}` : copy.drop}</span>
          </div>
          <div style={styles.contextList}>
            <span><ImageIcon size={16} /> ArchVis / Humanizacao</span>
            <span><Clapperboard size={16} /> DirectCut / Video</span>
            <span><Workflow size={16} /> BIM / 3D / Viewer</span>
          </div>
        </aside>

        <section ref={chatRef} style={styles.chatPanel}>
          <div style={styles.panelTitle}>{copy.chatPanel}</div>
          <div style={styles.messages}>
            {!messages.length && <p style={styles.empty}>{copy.emptyChat}</p>}
            {messages.map(message => (
              <article key={message.id} style={{ ...styles.bubble, ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble) }}>
                <strong>{message.role === 'user' ? (language === 'en' ? 'You' : 'Voce') : 'Apex Copilot'}</strong>
                <span>{message.text}</span>
              </article>
            ))}
            {loading && <article style={{ ...styles.bubble, ...styles.assistantBubble }}><strong>Apex Copilot</strong><span>{copy.thinking}</span></article>}
          </div>
          <div style={styles.chips}>
            {activeResult.chips.map(chip => (
              <button key={chip.label} type="button" style={styles.chip} onClick={() => openRoute(chip.route)}>
                {chip.label}
              </button>
            ))}
          </div>
          <div style={styles.composer}>
            <input value={goal} onChange={event => setGoal(event.target.value)} onKeyDown={send} placeholder={copy.input} style={styles.input} />
            <button type="button" onClick={() => send()} style={styles.sendButton} aria-label={copy.send}><Send size={19} /></button>
          </div>
        </section>

        <aside style={styles.resultPanel}>
          <div style={styles.panelTitle}>{copy.resultPanel}</div>
          <div style={styles.previewShell}>{preview()}</div>
          <div style={styles.resultCard}>
            <strong>{activeResult.title}</strong>
            <span>{activeResult.summary}</span>
            <p>{activeResult.prompt}</p>
            <div style={styles.routeButtons}>
              <button type="button" onClick={() => openRoute('archvis')} style={styles.routeButton}>{copy.archvis}</button>
              <button type="button" onClick={() => openRoute('directcut')} style={styles.routeButton}>{copy.directcut}</button>
              <button type="button" onClick={() => openRoute('bim')} style={styles.routeButton}>{copy.bim}</button>
            </div>
          </div>
        </aside>
      </main>

      {isOwner && (
        <div style={styles.ownerArea}>
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>{copy.owner}</button>
        </div>
      )}
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: 'calc(100vh - 88px)', background: '#ffffff', color: '#071a33', padding: '22px 28px 28px', maxWidth: 1680, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 18 },
  kicker: { color: '#d7192a', fontWeight: 900, fontSize: 13 },
  title: { margin: '6px 0', fontSize: 38, lineHeight: 1, color: '#071a33' },
  lead: { margin: 0, color: '#526174', fontSize: 16, fontWeight: 700 },
  headerActions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  primaryButton: { border: 'none', borderRadius: 8, background: '#d7192a', color: '#fff', padding: '12px 16px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' },
  secondaryButton: { border: '1px solid #cfd7e6', borderRadius: 8, background: '#fff', color: '#071a33', padding: '11px 14px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' },
  studioGrid: { display: 'grid', gridTemplateColumns: '300px minmax(430px, 1fr) minmax(420px, .9fr)', gap: 16, alignItems: 'stretch' },
  panel: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#f9fbfd', padding: 16, minHeight: 620 },
  chatPanel: { border: '1px solid #cfd7e6', borderRadius: 8, background: '#071a33', color: '#fff', padding: 16, minHeight: 620, display: 'grid', gridTemplateRows: 'auto 1fr auto auto', gap: 12, boxShadow: '0 18px 42px rgba(7,26,51,.12)' },
  resultPanel: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#fff', padding: 16, minHeight: 620 },
  panelTitle: { color: '#d7192a', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', marginBottom: 12 },
  fileMeta: { border: '1px solid #dfe5ee', borderRadius: 8, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, color: '#526174', fontSize: 13, lineHeight: 1.45 },
  contextList: { display: 'grid', gap: 10, marginTop: 14, color: '#071a33', fontWeight: 800, fontSize: 13 },
  messages: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 },
  empty: { margin: 0, color: '#d6dde8', border: '1px solid rgba(255,255,255,.16)', borderRadius: 8, padding: 14, background: 'rgba(255,255,255,.08)' },
  bubble: { borderRadius: 8, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.55, whiteSpace: 'pre-wrap', fontSize: 14 },
  assistantBubble: { background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', alignSelf: 'stretch' },
  userBubble: { background: '#fff', color: '#071a33', alignSelf: 'flex-end', maxWidth: '80%' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { border: '1px solid rgba(255,255,255,.22)', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#fff', padding: '8px 11px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  composer: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 48px', gap: 10 },
  input: { width: '100%', border: '1px solid #cfd7e6', borderRadius: 8, padding: '12px 13px', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' },
  sendButton: { border: 'none', borderRadius: 8, background: '#d7192a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  previewShell: { border: '1px dashed #cfd7e6', borderRadius: 8, minHeight: 330, overflow: 'hidden', background: '#f8fbff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropZone: { width: '100%', minHeight: 330, border: 'none', background: 'transparent', color: '#071a33', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', padding: 20 },
  previewImage: { width: '100%', height: '100%', minHeight: 330, objectFit: 'contain', background: '#fff' },
  pdfFrame: { width: '100%', height: 420, border: 'none', background: '#fff' },
  filePlaceholder: { textAlign: 'center', padding: 24, color: '#526174', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', lineHeight: 1.5 },
  ifcShell: { position: 'relative', width: '100%', height: 430, background: '#f8fbff' },
  ifcCanvas: { width: '100%', height: '100%' },
  viewerBadge: { position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 999, background: 'rgba(7,26,51,.9)', color: '#fff', padding: '8px 12px', fontSize: 12, fontWeight: 800, textAlign: 'center', pointerEvents: 'none' },
  errorBadge: { background: 'rgba(215,25,42,.95)' },
  resultCard: { marginTop: 14, border: '1px solid #dfe5ee', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 9, color: '#526174', lineHeight: 1.5 },
  routeButtons: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 },
  routeButton: { border: '1px solid #cfd7e6', borderRadius: 8, background: '#fff', color: '#071a33', padding: '10px 12px', fontWeight: 900, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  ownerArea: { display: 'flex', justifyContent: 'flex-end', marginTop: 18 },
  ownerButton: { border: 'none', borderRadius: 8, background: '#071a33', color: '#fff', padding: '14px 22px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' },
}
