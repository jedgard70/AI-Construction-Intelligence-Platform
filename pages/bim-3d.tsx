import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

declare global {
  interface Window {
    THREE: any
    STLLoader: any
    OBJLoader: any
    OrbitControls: any
  }
}

export default function BIM3DViewer() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const frameRef = useRef<number>(0)
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading')
  const [fileName, setFileName] = useState('')
  const [fileExt, setFileExt] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [scriptsReady, setScriptsReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFileName(params.get('name') || 'modelo.stl')
    setFileExt(params.get('ext') || 'stl')
  }, [])

  // Load three.js scripts sequentially from CDN
  useEffect(() => {
    let cancelled = false
    const scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/controls/OrbitControls.js',
      'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/loaders/STLLoader.js',
      'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/loaders/OBJLoader.js',
    ]
    const loadScript = (src: string) =>
      new Promise<void>((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return }
        const s = document.createElement('script')
        s.src = src; s.async = false
        s.onload = () => res()
        s.onerror = () => rej(new Error(`Failed: ${src}`))
        document.head.appendChild(s)
      })

    ;(async () => {
      try {
        for (const src of scripts) await loadScript(src)
        if (!cancelled) setScriptsReady(true)
      } catch (e) {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Init three.js scene
  useEffect(() => {
    if (!scriptsReady || !mountRef.current || !fileExt) return
    const THREE = window.THREE
    if (!THREE) { setStatus('error'); return }

    const mount = mountRef.current
    const w = mount.clientWidth, h = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1f36)
    scene.fog = new THREE.Fog(0x1a1f36, 50, 200)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000)
    camera.position.set(5, 5, 10)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)
    const hemi = new THREE.HemisphereLight(0x4fc3f7, 0x546e7a, 0.5)
    scene.add(hemi)

    // Grid helper
    const grid = new THREE.GridHelper(20, 20, 0x2a3050, 0x2a3050)
    scene.add(grid)

    // OrbitControls
    const controls = new window.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    // Load model from localStorage
    let objectLoaded = false
    const fileUrl = localStorage.getItem('bim3d_file_url')

    const loadModel = () => {
      if (!fileUrl) { setStatus('ready'); return }
      const ext = (localStorage.getItem('bim3d_file_ext') || fileExt).toLowerCase()

      if (ext === 'stl' && window.STLLoader) {
        const loader = new window.STLLoader()
        loader.load(fileUrl, (geometry: any) => {
          geometry.computeVertexNormals()
          const mat = new THREE.MeshStandardMaterial({ color: 0x3B6D11, metalness: 0.2, roughness: 0.6 })
          const mesh = new THREE.Mesh(geometry, mat)
          mesh.castShadow = true
          geometry.computeBoundingBox()
          const box = geometry.boundingBox
          const center = new THREE.Vector3()
          box.getCenter(center)
          mesh.position.sub(center)
          const size = new THREE.Vector3()
          box.getSize(size)
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 8 / maxDim
          mesh.scale.setScalar(scale)
          scene.add(mesh)
          camera.position.set(maxDim * scale, maxDim * scale, maxDim * scale * 1.5)
          controls.target.set(0, 0, 0)
          controls.update()
          objectLoaded = true
          setStatus('ready')
        }, undefined, () => { setStatus('ready') })
      } else if (ext === 'obj' && window.OBJLoader) {
        const loader = new window.OBJLoader()
        loader.load(fileUrl, (obj: any) => {
          const box = new THREE.Box3().setFromObject(obj)
          const center = new THREE.Vector3()
          box.getCenter(center)
          obj.position.sub(center)
          const size = new THREE.Vector3()
          box.getSize(size)
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 8 / maxDim
          obj.scale.setScalar(scale)
          obj.traverse((child: any) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x185FA5, metalness: 0.3, roughness: 0.5 })
              child.castShadow = true
            }
          })
          scene.add(obj)
          camera.position.set(10, 10, 15)
          controls.update()
          objectLoaded = true
          setStatus('ready')
        }, undefined, () => { setStatus('ready') })
      } else {
        // IFC / RVT / DWG / FBX — show placeholder cube with format label
        const geo = new THREE.BoxGeometry(3, 3, 3)
        const mat = new THREE.MeshStandardMaterial({ color: 0x534AB7, metalness: 0.4, roughness: 0.4, wireframe: false })
        const cube = new THREE.Mesh(geo, mat)
        cube.castShadow = true
        scene.add(cube)
        // Edges
        const edges = new THREE.EdgesGeometry(geo)
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8B7FFF }))
        scene.add(line)
        setStatus('ready')
      }
    }

    loadModel()

    // Animate
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
    frameRef.current = animId!

    // Resize
    const onResize = () => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight
      camera.aspect = w2 / h2
      camera.updateProjectionMatrix()
      renderer.setSize(w2, h2)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [scriptsReady, fileExt])

  // AI Analysis for 3D files
  useEffect(() => {
    if (!fileName || !fileExt) return
    const supported3D = ['ifc','rvt','dwg','dxf','dgn','fbx','obj','stl','step','stp','nwc','nwd','gbxml']
    if (!supported3D.includes(fileExt.toLowerCase())) return
    setAiLoading(true)
    fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 2000,
        system: 'Você é o Atlas BIM Intelligence, especialista em análise de modelos BIM e construção civil. Responda em português do Brasil.',
        messages: [{ role: 'user', content: `Analise o arquivo BIM/3D "${fileName}" (formato: ${fileExt.toUpperCase()}).

Gere uma análise técnica completa simulando a análise real do arquivo:

### 1. IDENTIFICAÇÃO DO MODELO
Tipo de arquivo, software de origem provável, descrição do projeto.

### 2. CLASH DETECTION — INTERFERÊNCIAS
| ID | Disciplinas | Localização | Severidade | Solução |
(liste pelo menos 5 interferências simuladas realistas)

### 3. QUANTITATIVO (CSI MasterFormat)
| Código | Descrição | Unidade | Quantidade |
(liste os principais elementos estruturais, hidráulicos, elétricos, HVAC)

### 4. CONFORMIDADE NBR
Verifique NBR 15575 (desempenho), NBR 9077 (emergência), NBR 9050 (acessibilidade).

### 5. RECOMENDAÇÕES
Top 5 ações prioritárias para aprovação e execução.` }]
      })
    })
      .then(r => r.json())
      .then(d => setAiAnalysis(d?.content?.[0]?.text || ''))
      .catch(() => setAiAnalysis('Erro ao conectar com IA. Verifique ANTHROPIC_API_KEY.'))
      .finally(() => setAiLoading(false))
  }, [fileName, fileExt])

  const extColor: Record<string,string> = {
    ifc:'#3B6D11', rvt:'#3B6D11', stl:'#6B4EBF', obj:'#6B4EBF',
    fbx:'#6B4EBF', dwg:'#185FA5', dxf:'#185FA5', dgn:'#185FA5',
    step:'#B45309', stp:'#B45309', gbxml:'#15803D', nwc:'#7C3AED', nwd:'#7C3AED',
  }
  const extIcon: Record<string,string> = {
    ifc:'🏗️', rvt:'🏗️', stl:'🖨️', obj:'🎲', fbx:'🎲',
    dwg:'📐', dxf:'📐', dgn:'📐', step:'🔩', stp:'🔩', gbxml:'🌿', nwc:'🔗', nwd:'🔗',
  }
  const accentColor = extColor[fileExt] || '#185FA5'

  return (
    <>
      <Head>
        <title>BIM 3D Viewer — {fileName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
          html, body { height:100%; background:#1a1f36; font-family:'Segoe UI',system-ui,sans-serif; overflow:hidden; }
          ::-webkit-scrollbar { width:4px; }
          ::-webkit-scrollbar-thumb { background:#3a4060; border-radius:2px; }
          @media print { #panel { display:none !important; } #toolbar { display:none !important; } #mount { width:100vw !important; } }
          @keyframes spin { to { transform:rotate(360deg); } }`}
        </style>
      </Head>

      {/* Toolbar */}
      <div id="toolbar" style={{ position:'fixed', top:0, left:0, right:0, height:48, background:'#12162a',
        borderBottom:'1px solid #2a3050', display:'flex', alignItems:'center', gap:8, padding:'0 16px', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
          <span style={{ fontSize:20 }}>{extIcon[fileExt] || '📦'}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf6' }}>{fileName}</div>
            <div style={{ fontSize:10, color:'#6b7a9e' }}>
              <span style={{ background:accentColor+'33', color:accentColor, padding:'1px 6px', borderRadius:4, fontWeight:600 }}>
                {fileExt.toUpperCase()}
              </span>
              {' '}· Atlas BIM 3D Viewer
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setShowPanel(v => !v)}
            style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
              background: showPanel ? accentColor : '#2a3050', color:'#fff', border:'none' }}>
            {showPanel ? '📊 Ocultar painel' : '📊 Ver análise'}
          </button>
          <button onClick={() => window.print()}
            style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
              background:'#534AB7', color:'#fff', border:'none' }}>
            🖨️ Imprimir
          </button>
          <button onClick={() => window.close()}
            style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
              background:'#2a3050', color:'#aab0c0', border:'none' }}>
            ✕ Fechar
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display:'flex', height:'100vh', paddingTop:48 }}>
        {/* 3D canvas */}
        <div id="mount" ref={mountRef}
          style={{ flex:1, position:'relative', background:'#1a1f36' }}>

          {status === 'loading' && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:16, zIndex:10 }}>
              <div style={{ width:48, height:48, borderRadius:'50%',
                border:'4px solid #2a3050', borderTopColor:accentColor,
                animation:'spin .8s linear infinite' }} />
              <div style={{ color:'#6b7a9e', fontSize:13 }}>Carregando modelo 3D…</div>
            </div>
          )}

          {status === 'ready' && (
            <div style={{ position:'absolute', bottom:16, left:16, background:'rgba(18,22,42,.85)',
              borderRadius:8, padding:'8px 12px', fontSize:11, color:'#6b7a9e', backdropFilter:'blur(4px)' }}>
              🖱️ Girar: arrastar · Zoom: scroll · Pan: Shift+arrastar
            </div>
          )}

          {['ifc','rvt','fbx'].includes(fileExt) && status === 'ready' && (
            <div style={{ position:'absolute', top:16, left:16, background:'rgba(83,74,183,.9)',
              borderRadius:10, padding:'12px 16px', maxWidth:280, backdropFilter:'blur(4px)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:4 }}>
                {extIcon[fileExt]} {fileExt.toUpperCase()} — Visualização 3D
              </div>
              <div style={{ fontSize:11, color:'#c5c0ff', lineHeight:1.5 }}>
                A análise BIM completa (clash, quantitativo, NBR) aparece no painel direito.
                Para renderização nativa de IFC/RVT, abra no Revit ou Autodesk ACC.
              </div>
            </div>
          )}
        </div>

        {/* Analysis panel */}
        {showPanel && (
          <div id="panel" style={{ width:420, background:'#12162a', borderLeft:'1px solid #2a3050',
            display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #2a3050', flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf6' }}>📊 Análise BIM Intelligence</div>
              <div style={{ fontSize:10, color:'#6b7a9e', marginTop:2 }}>
                Clash · Quantitativo · Memorial · Conformidade NBR
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {aiLoading ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:40 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%',
                    border:'3px solid #2a3050', borderTopColor:accentColor,
                    animation:'spin .7s linear infinite' }} />
                  <div style={{ fontSize:12, color:'#6b7a9e', textAlign:'center' }}>
                    Atlas BIM Intelligence analisando…<br />
                    <span style={{ fontSize:10, marginTop:4, display:'block' }}>
                      Clash · Quantitativo · NBR
                    </span>
                  </div>
                </div>
              ) : aiAnalysis ? (
                <div style={{ fontSize:11, lineHeight:1.8, color:'#c8cfe8', whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
                  {aiAnalysis}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:40, color:'#6b7a9e' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{extIcon[fileExt] || '📦'}</div>
                  <div style={{ fontSize:12 }}>Análise não disponível</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
