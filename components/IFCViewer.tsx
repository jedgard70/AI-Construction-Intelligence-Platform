// @ts-nocheck
'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { IFCLoader } from 'web-ifc-three/IFCLoader'

interface Props { url: string; fileName: string }

export default function IFCViewer({ url, fileName }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string>('')

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f2f5)

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(10, 10, 10)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)

    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0xcccccc, 0xdddddd)
    scene.add(gridHelper)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // IFC Loader
    const ifcLoader = new IFCLoader()
    ifcLoader.ifcManager.setWasmPath('/')

    ifcLoader.load(url, (model) => {
      scene.add(model)
      setLoading(false)
      // Center camera on model
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      camera.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim)
      controls.target.copy(center)
      controls.update()
      setInfo(`IFC carregado — ${fileName}`)
    }, undefined, (err) => {
      setError('Erro ao carregar IFC: ' + String(err))
      setLoading(false)
    })

    // Animation loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [url, fileName])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {loading && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(240,242,245,0.9)', gap: 12 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ width: 40, height: 40, border: '4px solid #e5e8f0', borderTopColor: '#185FA5',
            borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <div style={{ fontSize: 13, color: '#5a6282', fontWeight: 500 }}>Carregando modelo IFC...</div>
          <div style={{ fontSize: 11, color: '#8890a0' }}>{fileName}</div>
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#f8f9fc', gap: 10 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 13, color: '#A32D2D', fontWeight: 600 }}>Erro ao carregar IFC</div>
          <div style={{ fontSize: 11, color: '#8890a0', maxWidth: 300, textAlign: 'center' }}>{error}</div>
        </div>
      )}
      {!loading && !error && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)',
          borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#185FA5', fontWeight: 500,
          border: '1px solid #e5e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {info}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,255,255,0.9)',
        borderRadius: 8, padding: '6px 12px', fontSize: 10, color: '#8890a0',
        border: '1px solid #e5e8f0' }}>
        Rotacionar · Scroll Zoom · Shift+Drag Pan
      </div>
    </div>
  )
}
