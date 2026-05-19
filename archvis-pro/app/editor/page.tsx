import Image from "next/image";
import { Sun, Camera, Sliders, Play, Plus, Trash2, ChevronDown, SkipBack, PlayCircle, SkipForward } from "lucide-react";

export default function RenderingEditor() {
  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      {/* Main Viewport */}
      <div className="flex-1 relative bg-surface-container-lowest overflow-hidden lg:mr-[320px]">
        <Image 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_9G6ibHMGcPpnQowZO7gY8q-tADCgjNC9GJK72BfszPTDLImQM4VPmeK2K3uxWflg3IVL_QHBJhx0Ckz2fBTA47U5a6QaCIuYWzxIGayrf5JrWAp5qYIRQ2fdj3CfAV-4YTKiFIIxd_Qvgz6ftPyKr6E_iaLkAe1MiPomCSEa1NrcQEi3q9tc11IUFBuydBtL6XbipWcwp3UREGdMFL8c-wYS-x-ZPvjo7gXYvaheF7yav2s5JKWdBlSZfyBiDvzp-5rZYKYJ-5Rn" 
          alt="Viewport"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700 absolute inset-0 style-layer" 
          referrerPolicy="no-referrer"
        />
        
        {/* Realtime stats overlay */}
        <div className="absolute top-6 left-6 glass-panel px-4 py-2 rounded-xl shadow-lg z-10">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-primary tracking-widest uppercase">Real-Time Preview</span>
            <span className="font-mono text-xs text-on-surface">Samples: 124 / 500</span>
            <div className="w-32 h-1 bg-surface-variant rounded-full mt-1 overflow-hidden">
              <div className="w-[24%] h-full bg-gradient-to-r from-tertiary to-primary"></div>
            </div>
          </div>
        </div>
        
        {/* Viewport Gizmo */}
        <div className="absolute bottom-6 right-6 lg:bottom-[160px]">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <div className="absolute w-full h-full border border-outline-variant/30 rounded-full"></div>
            <div className="font-mono text-xs text-on-surface-variant">FRONT</div>
          </div>
        </div>

        {/* Timeline (Bottom overlay on large screens) */}
        <div className="absolute bottom-0 left-0 right-0 h-[140px] bg-surface-container border-t border-outline-variant hidden lg:flex flex-col px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-on-surface flex items-center gap-2">
                <Play className="w-4 h-4 text-primary" /> Timeline
              </span>
              <div className="h-4 w-[1px] bg-outline-variant"></div>
              <div className="flex items-center gap-4">
                <button className="text-on-surface-variant hover:text-on-surface"><SkipBack className="w-4 h-4" /></button>
                <button className="text-on-surface-variant hover:text-on-surface"><PlayCircle className="w-6 h-6" /></button>
                <button className="text-on-surface-variant hover:text-on-surface"><SkipForward className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-on-surface-variant">FPS: <span className="text-on-surface">60</span></span>
              <span className="font-mono text-xs text-on-surface-variant">Frames: <span className="text-on-surface">240</span></span>
              <span className="font-mono text-xs px-3 py-1 bg-surface-container-highest border border-outline-variant rounded">00:04:00</span>
            </div>
          </div>
          
          <div className="relative w-full h-12 bg-surface-container-low border border-outline-variant rounded overflow-hidden mt-auto">
            <div className="absolute top-1/2 left-[12%] -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border border-white/20"></div>
            <div className="absolute top-1/2 left-[45%] -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border border-white/20"></div>
            <div className="absolute top-1/2 left-[82%] -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border border-white/20"></div>
            <div className="absolute top-0 left-[35%] h-full w-[2px] bg-error z-10">
               <div className="absolute -top-1 -left-[6px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-error"></div>
            </div>
            <div className="absolute top-0 left-[12%] h-full w-[33%] bg-primary/10 border-x border-primary/30"></div>
          </div>
        </div>
      </div>

      {/* Right Property Sidebar */}
      <div className="w-full lg:w-[320px] bg-surface-container/90 backdrop-blur border-l border-outline-variant flex flex-col lg:fixed lg:right-0 lg:top-[80px] lg:bottom-0 overflow-y-auto p-4 z-30">
        
        {/* Environment */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base text-on-surface flex items-center gap-2">
              <Sun className="text-primary w-4 h-4" /> Environment
            </h3>
            <ChevronDown className="w-4 h-4 text-on-surface-variant" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-on-surface-variant block mb-1">Time of Day</label>
              <div className="flex items-center gap-4">
                <input type="range" className="flex-grow accent-primary h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer" />
                <span className="font-mono text-xs text-on-surface bg-surface-container-highest px-2 py-0.5 rounded">14:30</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-highest p-2 border border-outline-variant rounded">
                <label className="font-mono text-[10px] text-on-surface-variant block mb-1">Sun Intensity</label>
                <span className="font-mono text-xs text-on-surface">1.25 lx</span>
              </div>
              <div className="bg-surface-container-highest p-2 border border-outline-variant rounded">
                <label className="font-mono text-[10px] text-on-surface-variant block mb-1">Cloud Cover</label>
                <span className="font-mono text-xs text-on-surface">45%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Camera */}
        <section className="mb-6 pt-6 border-t border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base text-on-surface flex items-center gap-2">
              <Camera className="text-primary w-4 h-4" /> Camera
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-on-surface-variant block mb-1">Exposure Value (EV)</label>
              <div className="flex items-center gap-4">
                <input type="range" className="flex-grow accent-primary h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer" />
                <span className="font-mono text-xs text-on-surface bg-surface-container-highest px-2 py-0.5 rounded">12.0</span>
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] text-on-surface-variant block mb-2">Focal Length</label>
              <div className="flex gap-2">
                <button className="flex-1 font-mono text-xs py-1.5 border border-outline-variant rounded hover:bg-surface-variant/50">24mm</button>
                <button className="flex-1 font-mono text-xs py-1.5 bg-secondary-container text-on-secondary-container rounded">35mm</button>
                <button className="flex-1 font-mono text-xs py-1.5 border border-outline-variant rounded hover:bg-surface-variant/50">50mm</button>
              </div>
            </div>
          </div>
        </section>

        {/* Quality */}
        <section className="mb-6 pt-6 border-t border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base text-on-surface flex items-center gap-2">
              <Sliders className="text-primary w-4 h-4" /> Quality Settings
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 hover:bg-surface-container-highest rounded cursor-pointer">
               <span className="font-mono text-xs text-on-surface-variant">Ray Tracing</span>
               <div className="w-8 h-4 bg-primary-container rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-surface-container-highest rounded cursor-pointer">
               <span className="font-mono text-xs text-on-surface-variant">DLSS Sharpness</span>
               <span className="font-mono text-xs">0.6</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-surface-container-highest rounded cursor-pointer">
               <span className="font-mono text-xs text-on-surface-variant">Global Illumination</span>
               <span className="font-mono text-[10px] text-primary">ULTRA</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
