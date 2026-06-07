import { useEffect, useRef, useState, useCallback } from 'react'
import Head from 'next/head'
import { getSupabase } from '../lib/supabase'
import AgentWindow from '../components/AgentWindow'

// Proprietary formats that cannot be parsed in browser
const UNSUPPORTED_FORMATS = ['rvt','dwg','dxf','dgn','dwf','dwfx','gbxml','nwc','nwd','sat']
// Formats with dedicated loaders
const SUPPORTED_FORMATS = ['stl','obj','gltf','glb','fbx','ifc','step','stp']

export default function BIM3DViewer() {
  const mountRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading')
  const [isUnsupported, setIsUnsupported] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileExt, setFileExt] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [loadMsg, setLoadMsg] = useState('Carregando modelo 3D…')

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
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls' as any)

        const w = mount.clientWidth, h = mount.clientHeight

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1f36)

        // Camera
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 5000)
        camera.position.set(8, 8, 14)

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
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
        scene.add(new THREE.GridHelper(60, 60, 0x2a3050, 0x2a3050))

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08

        // Helpers
        const fitCamera = (obj: any) => {
          const box = new THREE.Box3().setFromObject(obj)
          const center = new THREE.Vector3(); box.getCenter(center)
          const size = new THREE.Vector3(); box.getSize(size)
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          obj.position.sub(center)
          camera.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5)
          camera.near = maxDim * 0.001; camera.far = maxDim * 50
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0); controls.update()
        }

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
          const scale = 10 / maxDim
          mesh.scale.setScalar(scale)
          scene.add(mesh)
          camera.near = 10 * 0.001; camera.far = 10 * 50
          camera.updateProjectionMatrix()
          camera.position.set(12, 12, 18); controls.target.set(0, 0, 0); controls.update()
        }

        // Load file from IndexedDB
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

        const fileBuffer = await getFileBuffer()
        const fileUrl = fileBuffer ? URL.createObjectURL(new Blob([fileBuffer])) : null
        const fileBytes = fileBuffer ? new Uint8Array(fileBuffer as ArrayBuffer) : null

        // ─── STL ───
        if (fileUrl && ext === 'stl') {
          const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader' as any)
          new STLLoader().load(fileUrl,
            (geo: any) => { addMesh(geo, 0x3B6D11); setStatus('ready') },
            undefined,
            () => { fallbackCube(THREE, scene); setStatus('ready') }
          )

        // ─── OBJ ───
        } else if (fileUrl && ext === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader' as any)
          new OBJLoader().load(fileUrl, (obj: any) => {
            obj.traverse((c: any) => {
              if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x185FA5, metalness: 0.3, roughness: 0.5 })
            })
            scene.add(obj)
            fitCamera(obj)
            setStatus('ready')
          }, undefined, () => { fallbackCube(THREE, scene); setStatus('ready') })

        // ─── GLTF / GLB ───
        } else if (fileUrl && (ext === 'gltf' || ext === 'glb')) {
          setLoadMsg('Carregando modelo GLTF…')
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader' as any)
          new GLTFLoader().load(fileUrl, (gltf: any) => {
            const obj = gltf.scene
            scene.add(obj)
            fitCamera(obj)
            setStatus('ready')
          }, undefined, () => { fallbackCube(THREE, scene); setStatus('ready') })

        // ─── FBX ───
        } else if (fileUrl && ext === 'fbx') {
          setLoadMsg('Carregando modelo FBX…')
          try {
            const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader' as any)
            new FBXLoader().load(fileUrl, (obj: any) => {
              obj.traverse((c: any) => {
                if (c.isMesh && (!c.material || !c.material.map)) {
                  c.material = new THREE.MeshStandardMaterial({ color: 0x185FA5, metalness: 0.2, roughness: 0.5 })
                }
              })
              scene.add(obj)
              fitCamera(obj)
              setStatus('ready')
            }, undefined, () => { fallbackCube(THREE, scene); setStatus('ready') })
          } catch (_) {
            fallbackCube(THREE, scene)
            setStatus('ready')
          }

        // ─── IFC — web-ifc with CDN WASM ───
        } else if (fileBytes && ext === 'ifc') {
          setLoadMsg('Carregando IFC… pode demorar alguns segundos')
          try {
            const { IfcAPI } = await import('web-ifc')
            const ifcAPI = new IfcAPI()
            // Use CDN so WASM doesn't need to be copied to /public
            ifcAPI.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/')
            await ifcAPI.Init()
            const modelID = ifcAPI.OpenModel(fileBytes)
            const meshGroup = new THREE.Group()
            ifcAPI.StreamAllMeshes(modelID, (mesh: any) => {
              const pgs = mesh.geometries
              for (let i = 0; i < pgs.size(); i++) {
                const pg = pgs.get(i)
                const g = ifcAPI.GetGeometry(modelID, pg.geometryExpressID)
                const verts  = ifcAPI.GetVertexArray(g.GetVertexData(), g.GetVertexDataSize())
                const idxArr = ifcAPI.GetIndexArray(g.GetIndexData(), g.GetIndexDataSize())
                if (!verts.length || !idxArr.length) { g.delete(); continue }
                const nV = verts.length / 6
                const pos = new Float32Array(nV * 3)
                const nor = new Float32Array(nV * 3)
                for (let j = 0; j < nV; j++) {
                  pos[j*3]   = verts[j*6];   pos[j*3+1] = verts[j*6+1]; pos[j*3+2] = verts[j*6+2]
                  nor[j*3]   = verts[j*6+3]; nor[j*3+1] = verts[j*6+4]; nor[j*3+2] = verts[j*6+5]
                }
                const geo3 = new THREE.BufferGeometry()
                geo3.setAttribute('position', new THREE.BufferAttribute(pos, 3))
                geo3.setAttribute('normal',   new THREE.BufferAttribute(nor, 3))
                geo3.setIndex(new THREE.BufferAttribute(new Uint32Array(idxArr), 1))
                const c = pg.color
                const mat3 = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(c.x, c.y, c.z),
                  opacity: c.w, transparent: c.w < 1,
                  side: THREE.DoubleSide,
                  metalness: 0.1, roughness: 0.7,
                })
                const m3 = new THREE.Mesh(geo3, mat3)
                m3.applyMatrix4(new THREE.Matrix4().fromArray(pg.flatTransformation))
                m3.castShadow = true
                meshGroup.add(m3)
                g.delete()
              }
            })
            scene.add(meshGroup)
            ifcAPI.CloseModel(modelID)
            if (meshGroup.children.length > 0) {
              fitCamera(meshGroup)
            } else {
              setLoadMsg('IFC carregado, mas nenhum mesh renderizavel foi encontrado no arquivo enviado.')
              setStatus('error')
              return
            }
            setStatus('ready')
          } catch (e) {
            console.error('IFC load error:', e)
            setLoadMsg(`Erro real ao carregar IFC: ${e instanceof Error ? e.message : String(e)}`)
            setStatus('error')
            return
          }

        // ─── STEP / STP — partial geometry via placeholder ───
        } else if (fileUrl && (ext === 'step' || ext === 'stp')) {
          setIsUnsupported(true)
          setStatus('ready')

        // ─── Proprietary formats — not parseable in browser ───
        } else if (UNSUPPORTED_FORMATS.includes(ext)) {
          setIsUnsupported(true)
          setStatus('ready')

        // ─── Unknown / no file ───
        } else {
          setLoadMsg('Nenhum modelo real foi encontrado para carregar no viewer.')
          setStatus('error')
          return
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

  // Load previous BIM analysis from Supabase cache
  const loadPreviousAnalysis = useCallback(async (name: string, ext: string): Promise<boolean> => {
    try {
      const sb = getSupabase()
      if (!sb) return false
      const { data } = await sb
        .from('bim3d_analyses')
        .select('analysis_text')
        .eq('file_name', name)
        .eq('file_ext', ext)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0 && data[0].analysis_text) {
        setAiAnalysis(data[0].analysis_text)
        return true
      }
    } catch (_) {}
    return false
  }, [])

  // AI Analysis
  useEffect(() => {
    if (!fileName || !fileExt) return
    setAiLoading(true)
    loadPreviousAnalysis(fileName, fileExt).then(found => {
      if (found) { setAiLoading(false); return }
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
        .then(async d => {
          const text = d?.content?.[0]?.text || 'Análise não disponível.'
          setAiAnalysis(text)
          try {
            const sb = getSupabase()
            if (sb && text && text !== 'Análise não disponível.') {
              await sb.from('bim3d_analyses').insert({ file_name: fileName, file_ext: fileExt, analysis_text: text })
            }
          } catch (_) {}
        })
        .catch(() => setAiAnalysis('Erro ao conectar. Verifique ANTHROPIC_API_KEY no Vercel.'))
        .finally(() => setAiLoading(false))
    })
  }, [fileName, fileExt, loadPreviousAnalysis])

  const EXT_COLOR: Record<string,string> = {
    ifc:'#3B6D11',rvt:'#3B6D11',stl:'#6B4EBF',obj:'#6B4EBF',
    fbx:'#6B4EBF',dwg:'#185FA5',dxf:'#185FA5',dgn:'#185FA5',
    step:'#B45309',stp:'#B45309',gbxml:'#15803D',nwc:'#7C3AED',nwd:'#7C3AED',
    gltf:'#0EA5E9',glb:'#0EA5E9',
  }
  const EXT_ICON: Record<string,string> = {
    ifc:'🏗️',rvt:'🏗️',stl:'🖨️',obj:'🎲',fbx:'🎲',
    dwg:'📐',dxf:'📐',dgn:'📐',step:'🔩',stp:'🔩',gbxml:'🌿',nwc:'🔗',nwd:'🔗',
    gltf:'🌐',glb:'🌐',
  }
  const accent = EXT_COLOR[fileExt] || '#185FA5'

  const printReport = () => {
    const canvas = mountRef.current?.querySelector('canvas')
    const canvasImg = canvas
      ? `<img src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block;page-break-inside:avoid"/>`
      : ''
    const w = window.open('', '_blank', 'width=960,height=800')
    if (!w) return
    w.document.write(`<html><head><title>BIM — ${fileName}</title><style>
*{box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;padding:24px 32px;color:#1a1f36;margin:0}
h1{font-size:18px;margin-bottom:16px;color:#185FA5}
pre{font-family:monospace;font-size:11px;line-height:1.85;white-space:pre-wrap;background:#f8f9fc;padding:16px;border-radius:8px;border:1px solid #e5e8f0}
@page{size:auto;margin:15mm}
@media print{.noprint{display:none}img{page-break-inside:avoid;max-height:200mm}}
</style></head><body>
<h1>${EXT_ICON[fileExt]||'📦'} ${fileName} — Análise BIM Intelligence</h1>
${canvasImg}
<pre>${aiAnalysis}</pre>
<br/>
<button class="noprint" onclick="window.print()" style="padding:10px 24px;background:#185FA5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">🖨️ Imprimir</button>
</body></html>`)
    w.document.close()
  }

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
          <button onClick={printReport}
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

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:16,zIndex:10 }}>
              <div style={{ width:48,height:48,borderRadius:'50%',
                border:'4px solid #2a3050',borderTopColor:accent,animation:'spin .8s linear infinite' }} />
              <div style={{ color:'#6b7a9e',fontSize:13 }}>{loadMsg}</div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:12,color:'#f87171',padding:32,textAlign:'center' }}>
              <div style={{ fontSize:40 }}>⚠️</div>
              <div style={{ fontSize:14,fontWeight:600 }}>Erro ao carregar modelo</div>
              <div style={{ fontSize:12,color:'#aab0c0',maxWidth:560,lineHeight:1.6 }}>{loadMsg}</div>
              <div style={{ fontSize:12,color:'#6b7a9e' }}>A análise BIM está disponível no painel ao lado sem viewer falso.</div>
            </div>
          )}

          {/* Unsupported format overlay */}
          {status === 'ready' && isUnsupported && (
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:20,padding:40,textAlign:'center',
              background:'rgba(18,22,42,0.97)',zIndex:5 }}>
              <div style={{ fontSize:52 }}>🚫</div>
              <div>
                <div style={{ fontSize:17,fontWeight:700,color:'#e8eaf6',marginBottom:8 }}>
                  Formato {fileExt.toUpperCase()} não suportado no viewer
                </div>
                <div style={{ fontSize:12,color:'#8b92b0',lineHeight:1.8,maxWidth:380 }}>
                  Arquivos <strong style={{color:'#aab0c0'}}>{fileExt.toUpperCase()}</strong> são formatos
                  proprietários que não podem ser renderizados diretamente no browser.<br/>
                  A análise BIM inteligente está disponível no painel ao lado.
                </div>
              </div>
              <div style={{ background:'#1a2035',borderRadius:12,padding:'14px 22px',
                border:'1px solid #2a3050',maxWidth:360 }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#3B6D11',marginBottom:8 }}>
                  ✅ Formatos suportados no viewer 3D
                </div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center' }}>
                  {['IFC','STL','OBJ','GLTF','GLB','FBX'].map(f => (
                    <span key={f} style={{ background:'#2a3050',color:'#aab0c0',
                      padding:'3px 10px',borderRadius:5,fontSize:11,fontWeight:600 }}>{f}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:11,color:'#6b7a9e',background:'#12162a',
                borderRadius:8,padding:'10px 18px',border:'1px solid #2a3050' }}>
                💡 No Revit: Arquivo → Exportar → IFC &nbsp;|&nbsp; No ArchiCAD: Arquivo → Publicar → IFC
              </div>
            </div>
          )}

          {/* Controls hint */}
          {status === 'ready' && !isUnsupported && (
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
                <button onClick={printReport} style={{ padding:'4px 10px',background:'#185FA5',color:'#fff',border:'none',
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
      <AgentWindow
        moduleKey="bim-3d"
        title="BIM 3D Agent"
        defaultMessage="Analise o modelo BIM/3D em contexto. Liste clashes provaveis, riscos de compatibilizacao, quantitativos iniciais, acoes recomendadas e artefatos para o workspace."
        context={{ file_name: fileName, file_extension: fileExt, current_analysis: aiAnalysis }}
        accent={accent}
        dark
      />
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
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, color: number) => {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true
    scene.add(mesh)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x4a5078 })
    )
    edges.position.set(x, y, z)
    scene.add(edges)
  }
  addBox(8, 0.5, 6, 0, 0.25,  0, 0x3a4060)
  addBox(8, 3,   6, 0, 2,     0, 0x4a5580)
  addBox(7, 3,   5, 0, 5,     0, 0x534AB7)
  addBox(6, 3,   4, 0, 8,     0, 0x3B6D11)
  addBox(5, 1,   3, 0, 10.5,  0, 0x185FA5)
}
