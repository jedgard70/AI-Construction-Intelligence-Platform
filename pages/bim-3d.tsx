import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

export default function BIM3DViewer() {
  const mountRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading')
  const [fileName, setFileName] = useState('')
  const [fileExt, setFileExt] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name') || 'modelo'
    const ext = params.get('ext') || 'stl'
    setFileName(name)
    setFileExt(ext)
  }, [])

  // Init Three.js via npm dynamic imports
  useEffect(() => {
    if (!fileExt || !mountRef.current) return
    const mount = mountRef.current
    let animId = 0
    let renderer: any = null

    const init = async () => {
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js' as any)

        const w = mount.clientWidth, h = mount.clientHeight

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1f36)

        // Camera
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000)
        camera.position.set(8, 8, 14)

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        mount.appendChild(renderer.domElement)

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.7))
        const dir = new THREE.DirectionalLight(0xffffff, 1.2)
        dir.position.set(10, 20, 10); dir.castShadow = true
        scene.add(dir)
        scene.add(new THREE.HemisphereLight(0x4fc3f7, 0x546e7a, 0.4))

        // Grid
        scene.add(new THREE.GridHelper(30, 30, 0x2a3050, 0x2a3050))

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08

        // Load model from IndexedDB
        const ext = (localStorage.getItem('bim3d_file_ext') || fileExt).toLowerCase()

        const getFileBuffer = (): Promise<ArrayBuffer | null> =>
          new Promise(resolve => {
            const req = indexedDB.open('bim3d', 1)
            req.onsuccess = (ev: any) => {
              const db = ev.target.result
              if (!db.objectStoreNames.contains('files')) { db.close(); resolve(null); return }
              const tx = db.transaction('files', 'readonly')
              const r2 = tx.objectStore('files').get('current')
              r2.onsuccess = (e: any) => { db.close(); resolve(e.target.result ?? null) }
              r2.onerror = () => { db.close(); resolve(null) }
            }
            req.onerror = () => resolve(null)
          })

        const addMesh = (geometry: any, color: number) => {
          geometry.computeVertexNormals?.()
          const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 })
          const mesh = new THREE.Mesh(geometry, mat)
          mesh.castShadow = true
          geometry.computeBoundingBox()
          const box = geometry.boundingBox
          const center = new THREE.Vector3(); box.getCenter(center)
          mesh.position.sub(center)
          const size = new THREE.Vector3(); box.getSize(size)
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          mesh.scale.setScalar(10 / maxDim)
          scene.add(mesh)
          camera.position.set(12, 12, 18); controls.target.set(0, 0, 0); controls.update()
        }

        const fileBuffer = await getFileBuffer()
        const fileUrl = fileBuffer ? URL.createObjectURL(new Blob([fileBuffer])) : null

        if (fileUrl && ext === 'stl') {
          const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js' as any)
          new STLLoader().load(fileUrl, (geo: any) => { addMesh(geo, 0x3B6D11); setStatus('ready') },
            undefined, () => { fallbackCube(THREE, scene); setStatus('ready') })
        } else if (fileUrl && ext === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js' as any)
          new OBJLoader().load(fileUrl, (obj: any) => {
            const box = new THREE.Box3().setFromObject(obj)
            const center = new THREE.Vector3(); box.getCenter(center)
            const size = new THREE.Vector3(); box.getSize(size)
            obj.position.sub(center)
            const maxDim = Math.max(size.x, size.y, size.z) || 1
            obj.scale.setScalar(10 / maxDim)
            obj.traverse((c: any) => {
              if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x185FA5, metalness: 0.3, roughness: 0.5 })
            })
            scene.add(obj)
            camera.position.set(12, 12, 18); controls.update()
            setStatus('ready')
          }, undefined, () => { fallbackCube(THREE, scene); setStatus('ready') })
        } else {
          // IFC / RVT / DWG / FBX — placeholder building geometry
          buildingPlaceholder(THREE, scene)
          setStatus('ready')
        }

        // Animate
        const animate = () => {
          animId = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()
        frameRef.current = animId

        // Resize
        const onResize = () => {
          const w2 = mount.clientWidth, h2 = mount.clientHeight
          camera.aspect = w2 / h2; camera.updateProjectionMatrix()
          renderer.setSize(w2, h2)
        }
        window.addEventListener('resize', onResize)

        return () => { window.removeEventListener('resize', onResize) }
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }

    const cleanup = init()
    return () => {
      cancelAnimationFrame(animId)
      cleanup.then(fn => fn?.())
      if (renderer && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
        renderer.dispose()
      }
    }
  }, [fileExt])

  // AI Analysis
  useEffect(() => {
    if (!fileName || !fileExt) return
    setAiLoading(true)
    fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 2000,
        system: 'Você é o Atlas BIM Intelligence, especialista em modelos BIM e construção civil. Responda em português do Brasil.',
        messages: [{ role: 'user', content:
          `Analise o arquivo BIM/3D "${fileName}" (formato: ${fileExt.toUpperCase()}).

### 1. IDENTIFICAÇÃO
Tipo de arquivo, software de origem provável, disciplinas presentes.

### 2. CLASH DETECTION
| ID | Disciplinas | Localização | Severidade | Resolução |
(simule 6 interferências realistas para uma edificação brasileira de médio porte)

### 3. QUANTITATIVO CSI MASTERFORMAT
| Código | Descrição | Unidade | Quantidade |
(liste os principais elementos: estrutura, vedação, cobertura, hidráulica, elétrica, HVAC)

### 4. CONFORMIDADE NBR
NBR 15575 · NBR 9077 · NBR 9050 — status de cada item.

### 5. RECOMENDAÇÕES
Top 5 ações prioritárias para aprovação e execução.` }]
      })
    })
      .then(r => r.json())
      .then(d => setAiAnalysis(d?.content?.[0]?.text || 'Análise não disponível.'))
      .catch(() => setAiAnalysis('Erro ao conectar. Verifique ANTHROPIC_API_KEY no Vercel.'))
      .finally(() => setAiLoading(false))
  }, [fileName, fileExt])

  const EXT_COLOR: Record<string,string> = {
    ifc:'#3B6D11',rvt:'#3B6D11',stl:'#6B4EBF',obj:'#6B4EBF',
    fbx:'#6B4EBF',dwg:'#185FA5',dxf:'#185FA5',dgn:'#185FA5',
    step:'#B45309',stp:'#B45309',gbxml:'#15803D',nwc:'#7C3AED',nwd:'#7C3AED',
  }
  const EXT_ICON: Record<string,string> = {
    ifc:'🏗️',rvt:'🏗️',stl:'🖨️',obj:'🎲',fbx:'🎲',
    dwg:'📐',dxf:'📐',dgn:'📐',step:'🔩',stp:'🔩',gbxml:'🌿',nwc:'🔗',nwd:'🔗',
  }
  const accent = EXT_COLOR[fileExt] || '#185FA5'

  return (
    <>
      <Head>
        <title>BIM 3D — {fileName}</title>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html,body{height:100%;background:#1a1f36;font-family:'Segoe UI',system-ui,sans-serif;overflow:hidden}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#3a4060;border-radius:2px}
          @keyframes spin{to{transform:rotate(360deg)}}
          @media print{#toolbar{display:none!important}#panel{display:none!important}#mount{width:100vw!important}}
        `}</style>
      </Head>

      {/* Toolbar */}
      <div id="toolbar" style={{ position:'fixed',top:0,left:0,right:0,height:48,
        background:'#12162a',borderBottom:'1px solid #2a3050',
        display:'flex',alignItems:'center',gap:8,padding:'0 16px',zIndex:100 }}>
        <span style={{ fontSize:18 }}>{EXT_ICON[fileExt]||'📦'}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#e8eaf6' }}>{fileName}</div>
          <div style={{ fontSize:10,color:'#6b7a9e' }}>
            <span style={{ background:accent+'33',color:accent,padding:'1px 6px',borderRadius:4,fontWeight:600 }}>
              {fileExt.toUpperCase()}
            </span>{' '}· Atlas BIM 3D Viewer
          </div>
        </div>
        <div style={{ display:'flex',gap:6 }}>
          <button onClick={() => setShowPanel(v => !v)}
            style={{ padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',
              background:showPanel?accent:'#2a3050',color:'#fff',border:'none' }}>
            {showPanel?'📊 Ocultar análise':'📊 Ver análise'}
          </button>
          <button onClick={() => {
            // Capture WebGL canvas as image before printing
            const canvas = mountRef.current?.querySelector('canvas')
            let imgEl: HTMLImageElement | null = null
            if (canvas) {
              const dataUrl = canvas.toDataURL('image/png')
              imgEl = document.createElement('img')
              imgEl.src = dataUrl
              imgEl.id = '__print_canvas__'
              imgEl.style.cssText = 'display:none;width:100%;max-width:700px;border-radius:8px;margin-bottom:16px'
              mountRef.current?.appendChild(imgEl)
            }
            const st = document.createElement('style')
            st.id = '__print_style__'
            st.textContent = '@media print{canvas{display:none!important}#__print_canvas__{display:block!important}}'
            document.head.appendChild(st)
            window.print()
            setTimeout(() => { imgEl?.remove(); st.remove() }, 500)
          }}
            style={{ padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',
              background:'#534AB7',color:'#fff',border:'none' }}>
            🖨️ Imprimir
          </button>
          <button onClick={() => window.close()}
            style={{ padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',
              background:'#2a3050',color:'#aab0c0',border:'none' }}>
            ✕ Fechar
          </button>
        </div>
      </div>

      <div style={{ display:'flex',height:'100vh',paddingTop:48 }}>
        {/* 3D canvas */}
        <div id="mount" ref={mountRef}
          style={{ flex:1,position:'relative',background:'#1a1f36',minWidth:0 }}>
          {status === 'loading' && (
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:16,zIndex:10 }}>
              <div style={{ width:48,height:48,borderRadius:'50%',
                border:'4px solid #2a3050',borderTopColor:accent,animation:'spin .8s linear infinite' }} />
              <div style={{ color:'#6b7a9e',fontSize:13 }}>Carregando modelo 3D…</div>
            </div>
          )}
          {status === 'error' && (
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:12,color:'#f87171',padding:32,textAlign:'center' }}>
              <div style={{ fontSize:40 }}>⚠️</div>
              <div style={{ fontSize:14,fontWeight:600 }}>Erro ao carregar modelo</div>
              <div style={{ fontSize:12,color:'#6b7a9e' }}>A análise BIM está disponível no painel ao lado.</div>
            </div>
          )}
          {status === 'ready' && (
            <div style={{ position:'absolute',bottom:16,left:16,
              background:'rgba(18,22,42,.85)',color:'#6b7a9e',
              borderRadius:8,padding:'7px 12px',fontSize:11,backdropFilter:'blur(4px)' }}>
              🖱️ Girar: arrastar · Zoom: scroll · Pan: Shift+arrastar
            </div>
          )}
        </div>

        {/* Analysis panel */}
        {showPanel && (
          <div id="panel" style={{ width:440,background:'#12162a',
            borderLeft:'1px solid #2a3050',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0 }}>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid #2a3050',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:'#e8eaf6' }}>📊 Análise BIM Intelligence</div>
                <div style={{ fontSize:10,color:'#6b7a9e',marginTop:2 }}>Clash · Quantitativo · Memorial · NBR</div>
              </div>
              {aiAnalysis && !aiLoading && (
                <button onClick={() => {
                  // Capture 3D canvas + analysis into a print window
                  const canvas = mountRef.current?.querySelector('canvas')
                  const canvasImg = canvas ? `<img src="${canvas.toDataURL('image/png')}" style="width:100%;max-width:680px;border-radius:8px;margin-bottom:24px;display:block"/>` : ''
                  const w = window.open('','_blank','width=900,height=750')
                  if (!w) return
                  w.document.write(`<html><head><title>BIM — ${fileName}</title><style>body{font-family:monospace;padding:32px;font-size:12px;line-height:1.9;color:#1a1f36;white-space:pre-wrap;max-width:900px;margin:0 auto}h1{font-size:18px;font-family:sans-serif;margin-bottom:16px}@media print{.noprint{display:none}}</style></head><body><h1>📊 ${EXT_ICON[fileExt]||''} ${fileName}</h1>${canvasImg}${aiAnalysis}<br/><br/><button class="noprint" onclick="window.print()" style="padding:10px 24px;background:#185FA5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">🖨️ Imprimir</button></body></html>`)
                  w.document.close()
                }} style={{ padding:'4px 10px',background:'#185FA5',color:'#fff',border:'none',
                  borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
                  🖨️ Imprimir
                </button>
              )}
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:16 }}>
              {aiLoading ? (
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:40 }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',
                    border:'3px solid #2a3050',borderTopColor:accent,animation:'spin .7s linear infinite' }} />
                  <div style={{ fontSize:12,color:'#6b7a9e',textAlign:'center' }}>
                    Atlas BIM Intelligence analisando…<br/>
                    <span style={{ fontSize:10,marginTop:4,display:'block' }}>Clash · Quantitativo · NBR</span>
                  </div>
                </div>
              ) : aiAnalysis ? (
                <div style={{ fontSize:11,lineHeight:1.85,color:'#c8cfe8',whiteSpace:'pre-wrap',fontFamily:'monospace' }}>
                  {aiAnalysis}
                </div>
              ) : (
                <div style={{ textAlign:'center',padding:40,color:'#6b7a9e' }}>
                  <div style={{ fontSize:32,marginBottom:8 }}>{EXT_ICON[fileExt]||'📦'}</div>
                  <div style={{ fontSize:12 }}>Carregando análise…</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function fallbackCube(THREE: any, scene: any) {
  const geo = new THREE.BoxGeometry(4, 4, 4)
  const mat = new THREE.MeshStandardMaterial({ color: 0x534AB7, metalness: 0.3, roughness: 0.5 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  scene.add(mesh)
  scene.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0x8B7FFF })
  ))
}

function buildingPlaceholder(THREE: any, scene: any) {
  // Simple building: base + floors + roof
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, color: number) => {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true
    scene.add(mesh)
    scene.add(Object.assign(new THREE.LineSegments(
      new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x4a5078 })
    ), { position: mesh.position.clone() }))
  }
  addBox(8, 0.5, 6, 0, 0.25, 0, 0x3a4060)  // slab
  addBox(8, 3,   6, 0, 2,    0, 0x4a5580)  // floor 1
  addBox(7, 3,   5, 0, 5,    0, 0x534AB7)  // floor 2
  addBox(6, 3,   4, 0, 8,    0, 0x3B6D11)  // floor 3
  addBox(5, 1,   3, 0, 10.5, 0, 0x185FA5)  // penthouse
}
