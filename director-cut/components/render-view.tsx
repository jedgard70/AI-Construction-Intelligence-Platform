import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings2, Camera, Film, Loader2, Download, CheckCircle2 } from 'lucide-react';

export function RenderView() {
  const [samples, setSamples] = useState(1024);
  const [bounces, setBounces] = useState(12);
  const [roughness, setRoughness] = useState(0.45);

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRendering && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/render?jobId=${jobId}`);
          const data = await res.json();
          if (data.success && data.job) {
            setRenderProgress(data.job.progress);
            if (data.job.status === 'completed') {
              setIsRendering(false);
              setResultUrl(data.job.resultUrl);
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error('Failed to poll render status', e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRendering, jobId]);

  const startRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setResultUrl(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples, bounces, roughness })
      });
      const data = await res.json();
      if (data.success) {
        setJobId(data.jobId);
      } else {
        setIsRendering(false);
      }
    } catch (e) {
      console.error('Render request failed', e);
      setIsRendering(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Viewport Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={resultUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBdotJeeiZPphzeQ4zqOiLZR8oIwbJacGg1Xp9gqGQkl_MAxb5ao78O77ejvQiX3jl_qkja3fKAAXa6-pUsgVv1Gki3tr4YwcJscIz13Cy-XfEBlkgl-HJY9XFwmAVnN0dZMz7cFV7UMu9sgywdQhMvyeebNgy3Pv9qficmTmNcFMOTyuluprPulyYtYgeKviJLl3hVRqKhpTUbXN-rAxfNeJBThdOQ1t9K4POH6rTXshxT0GFJ1brIzvj2HLTFGR3NBvKgdmSR3Tr_"} 
          alt="3D Render Viewport"
          fill
          className="object-cover transition-all duration-1000"
          unoptimized
        />
        {/* Gradient overlay to make text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 pointer-events-none"></div>
        
        {/* Render Overlay */}
        {isRendering && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-xl p-6 shadow-2xl flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-bold text-on-surface mb-1">Rendering Sequence</h3>
              <p className="text-xs text-on-surface-variant font-mono mb-6">JOB ID: {jobId}</p>
              
              <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className="bg-primary-container h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)]" 
                  style={{ width: `${renderProgress}%` }}
                ></div>
              </div>
              <div className="w-full flex justify-between text-xs font-bold">
                <span className="text-primary-fixed-dim bg-primary/10 px-2 py-0.5 rounded">{renderProgress}%</span>
                <span className="text-on-surface-variant">Estimating time...</span>
              </div>
            </div>
          </div>
        )}

        {/* Render Success Toast */}
        {!isRendering && resultUrl && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-surface-container-highest border border-primary/30 text-on-surface px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold">Render Complete</span>
            <button className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-xs font-bold hover:opacity-90 ml-2 flex items-center gap-1">
              <Download className="w-3 h-3" /> Save
            </button>
          </div>
        )}
      </div>

      {/* Floating Viewport Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-surface-container/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.6)]"></span>
            <span className="text-xs font-bold text-primary uppercase">RT Active</span>
          </div>
          <div className="h-4 w-px bg-outline-variant"></div>
          <span className="text-xs font-semibold text-on-surface">CAM_01</span>
        </div>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col gap-3">
        <button className="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline outline-1 outline-outline-variant">
          <Camera className="w-5 h-5" />
        </button>
        <button 
          onClick={startRender}
          disabled={isRendering}
          className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <Film className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Bottom Sheet - Rendering Properties */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        <div className="bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant rounded-t-2xl px-6 pt-4 pb-8 max-w-3xl mx-auto">
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Rendering Properties</h2>
            <button className="text-primary-fixed-dim text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors">
              <Settings2 className="w-4 h-4" /> RESET
            </button>
          </div>

          <div className="space-y-6">
            {/* Slider 1 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-outline">Samples per Pixel</label>
                <span className="text-sm font-semibold text-primary">{samples}</span>
              </div>
              <input 
                type="range" min="1" max="4096" value={samples} 
                onChange={(e) => setSamples(parseInt(e.target.value))}
                style={{ background: `linear-gradient(to right, var(--color-primary-container) ${(samples/4096)*100}%, var(--color-outline-variant) ${(samples/4096)*100}%)` }}
              />
            </div>

            {/* Slider 2 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-outline">Max Bounces</label>
                <span className="text-sm font-semibold text-primary">{bounces}</span>
              </div>
              <input 
                type="range" min="1" max="32" value={bounces} 
                onChange={(e) => setBounces(parseInt(e.target.value))}
                style={{ background: `linear-gradient(to right, var(--color-primary-container) ${(bounces/32)*100}%, var(--color-outline-variant) ${(bounces/32)*100}%)` }}
              />
            </div>

            {/* Slider 3 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-outline">Roughness Multiplier</label>
                <span className="text-sm font-semibold text-primary">{roughness.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" value={roughness} 
                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                style={{ background: `linear-gradient(to right, var(--color-primary-container) ${roughness*100}%, var(--color-outline-variant) ${roughness*100}%)` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
