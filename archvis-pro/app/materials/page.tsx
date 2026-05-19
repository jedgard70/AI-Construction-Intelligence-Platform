import Image from "next/image";
import { Filter, Eye, Star, Download } from "lucide-react";

export default function MaterialLibrary() {
  const materials = [
    { title: "Industrial Concrete v02", type: "Concrete", resolution: "PBR • 8K • Procedural", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCU2rPha9UZnVhMc3zavz3UrLEU7YaK6akGjy2b_b9geqN5psGA4BM_MGWAJ1SagIYm-Gcte5MEWsYi_MlZIDsQkRG2PaLWhZuryulcoqxH3G90ezxz8TjHhM1jnH3KjUpG0SxK30UdE9fM-QksAX_ETCkMxJUFnLg_RbKofymwfBizHjcfCy_AW-JI9CCyNtckJq7_4GhdPqd3TC8ysZnZw-bgyxW4ol73VMjD4TT_Ydoa5Wj7RWLY4WzWNYeDKv954KJBdH02yZDz", active: true },
    { title: "Dark Oak Chevron", type: "Wood", resolution: "PBR • 4K • Photogrammetry", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwThQl2_x0P_zhafmdQQgxScVEVLEvURG5f_zLUoS2NIfMZShBuO4BzD0v2qx8EXWWRm8SXVrfuJyiwbzReFsFo_SM8jKfaRV_mfME6NZissaExPiLw1IvJ3_J_1yzKIlc16aByq94HPHg_HfelL8n9U6s57ri9PGiTdCv9mg_dlTx8AraYOtbCTMhKvbtOlhRadxKhfQRfB0PKHAT5MTgx18Dmw-ctFFeoBFzhZxniY3FOOY13jLVnFlhfS2rdFhlszk_ievh4Wog", active: false },
    { title: "Acid Etched Glass 12%", type: "Glass", resolution: "Shader • Procedural", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAElt4wK2h7JTm7Fj9vkroRf9g_QBaX0J7g2vpfIof03qectyhcfiwI-3OFckqFC5bSItaIY0IGdpSTB90wjiVUccDkQyTyiupJMnIRHPOHtXDfeS3-3inDARG1Lsua9sZGFfXBYo1MqsTPn4lJWFpImUzSkEIPLUQvVd4lJUA9Hlhhbm0UOoD7_muzuSxtaYQIamU4BCI4Lw_p7t-ZJAElyoCuVzhiHtxac4G1FFdBNUWQCyJpyqLepGGEFfvqALWZhCV6TxK2HmVS", active: false },
    { title: "Weathered Corten v04", type: "Metal", resolution: "PBR • 8K • Scan", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXzQhge5A_VTO_xhVxb3CJTt_y7RDJl9boKCuuWLJMmRoV0hIdFn73d0D-kknx2erbKGGu7KgKl_C0GBvzBL-BcTjtx1lp7Fy09SSuf43cW_R1bbJSNMF_SqOHlLdVvce8FKDESygG7PdsETrw_2DE1vz-kfD5-WQ5So_WcYtBJVCBTtqjUcNOGZh3VLCzwPjPLMk2gS__FMdnO-2TuqIjEyoitg29UVp6Uchg-yKLm5ZmRUBDM6g71hCIA6eIE3KEijNlMslGCjy4", active: false }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      {/* Categories Sidebar */}
      <div className="w-full lg:w-64 bg-surface-container-low border-r border-outline-variant flex flex-col p-4 gap-4 lg:fixed lg:left-[var(--sidebar-width)] lg:top-[var(--toolbar-height)] lg:bottom-0 overflow-y-auto">
        <div className="font-mono text-xs text-primary uppercase tracking-widest opacity-80 mb-2">Categories</div>
        <div className="space-y-1">
          <div className="flex justify-between items-center px-2 py-1.5 bg-surface-variant/30 rounded border border-white/5 cursor-pointer">
            <span className="text-sm">All Materials</span>
            <span className="font-mono text-[10px] opacity-50">142</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 hover:bg-surface-variant/20 rounded cursor-pointer transition-colors">
            <span className="text-sm">Concrete</span>
            <span className="font-mono text-[10px] opacity-50">24</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 hover:bg-surface-variant/20 rounded cursor-pointer transition-colors">
            <span className="text-sm">Wood</span>
            <span className="font-mono text-[10px] opacity-50">38</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 hover:bg-surface-variant/20 rounded cursor-pointer transition-colors">
            <span className="text-sm">Metal</span>
            <span className="font-mono text-[10px] opacity-50">41</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 hover:bg-surface-variant/20 rounded cursor-pointer transition-colors">
            <span className="text-sm">Glass</span>
            <span className="font-mono text-[10px] opacity-50">12</span>
          </div>
        </div>
        
        <div className="mt-4 font-mono text-xs text-primary uppercase tracking-widest opacity-80 mb-2">Properties</div>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-on-surface-variant block mb-2">Roughness</label>
            <input type="range" className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-on-surface-variant block mb-2">Reflectivity</label>
            <input type="range" className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 rounded border-outline bg-surface-container text-primary focus:ring-primary" />
            <span className="text-sm">Seamless Only</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-outline bg-surface-container text-primary focus:ring-primary" />
            <span className="text-sm">PBR Ready</span>
          </div>
        </div>
      </div>

      {/* Material Grid */}
      <div className="flex-1 bg-background overflow-y-auto p-4 md:p-6 lg:ml-64 lg:mr-[320px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold">Explorar</h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-highest rounded-lg text-sm text-on-surface hover:bg-surface-variant transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {materials.map((m, i) => (
            <div key={i} className={`group bg-surface-container-low border ${m.active ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant hover:border-primary/50'} rounded-xl overflow-hidden transition-all cursor-pointer`}>
              <div className="aspect-square bg-surface-dim relative p-2">
                <div className="relative w-full h-full overflow-hidden rounded-lg">
                  <Image 
                    src={m.img} 
                    alt={m.title} 
                    fill 
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover shadow-inner" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={`absolute top-4 right-4 ${m.active ? 'bg-primary text-on-primary' : 'bg-background/60 backdrop-blur-md text-white border border-white/10'} px-2 py-0.5 rounded text-[10px] font-mono uppercase`}>
                  {m.type}
                </div>
                {m.active && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="p-3 flex justify-between items-start">
                <div className="min-w-0">
                  <div className={`font-mono text-xs truncate ${m.active ? 'text-primary' : 'text-on-surface'}`}>{m.title}</div>
                  <div className="font-mono text-[9px] text-on-surface-variant opacity-60 mt-1 flex gap-1">
                     <span className="px-1 border border-outline-variant bg-surface-container rounded">{m.resolution.split(' • ')[0]}</span>
                     <span className="px-1 border border-outline-variant bg-surface-container rounded">{m.resolution.split(' • ')[1]}</span>
                  </div>
                </div>
                <Star className={`w-4 h-4 flex-shrink-0 ${m.active ? 'text-primary fill-current' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="w-full lg:w-[320px] bg-surface-container border-l border-outline-variant flex flex-col lg:fixed lg:right-0 lg:top-[var(--toolbar-height)] lg:bottom-0 overflow-y-auto z-30">
        <div className="p-4 border-b border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-display text-lg font-semibold">Material Detail</h2>
          </div>
          <div className="aspect-video relative rounded bg-surface-dim mb-4 border border-outline-variant overflow-hidden">
            <Image 
              src={materials[0].img} 
              fill 
              sizes="320px"
              className="object-cover" 
              alt="Preview"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col gap-1">
             <div className="font-display text-xl text-on-surface">{materials[0].title}</div>
             <div className="font-mono text-xs text-primary">ID: MAT_CONC_082</div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Texture Maps</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-high border border-outline-variant rounded p-1 flex flex-col items-center">
                <div className="w-full aspect-square bg-surface-dim rounded mb-1 bg-gray-500"></div>
                <span className="font-mono text-[10px] opacity-60">Albedo</span>
              </div>
              <div className="bg-surface-container-high border border-outline-variant rounded p-1 flex flex-col items-center">
                <div className="w-full aspect-square bg-surface-dim rounded mb-1 bg-gradient-to-tr from-purple-500 to-blue-400 opacity-50"></div>
                <span className="font-mono text-[10px] opacity-60">Normal</span>
              </div>
              <div className="bg-surface-container-high border border-outline-variant rounded p-1 flex flex-col items-center">
                <div className="w-full aspect-square bg-surface-dim rounded mb-1 bg-white/20"></div>
                <span className="font-mono text-[10px] opacity-60">Roughness</span>
              </div>
              <div className="bg-surface-container-high border border-outline-variant rounded p-1 flex flex-col items-center">
                <div className="w-full aspect-square bg-surface-dim rounded mb-1 bg-black/40"></div>
                <span className="font-mono text-[10px] opacity-60">Displace</span>
              </div>
            </div>
          </div>

          <div>
             <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Parameters</div>
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <span className="font-mono text-xs text-on-surface opacity-80">UV Scale</span>
                 <div className="flex items-center gap-1">
                   <input type="text" defaultValue="1.0" className="w-12 bg-surface-container-lowest border-none font-mono text-[10px] text-center py-1 rounded" />
                   <input type="text" defaultValue="1.0" className="w-12 bg-surface-container-lowest border-none font-mono text-[10px] text-center py-1 rounded" />
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="font-mono text-xs text-on-surface opacity-80">Rotation</span>
                 <input type="text" defaultValue="0.0°" className="w-12 bg-surface-container-lowest border-none font-mono text-[10px] text-center py-1 rounded" />
               </div>
               <div className="flex items-center justify-between">
                 <span className="font-mono text-xs text-on-surface opacity-80">IOR</span>
                 <input type="text" defaultValue="1.54" className="w-12 bg-surface-container-lowest border-none font-mono text-[10px] text-center py-1 rounded" />
               </div>
             </div>
          </div>

          <button className="w-full bg-primary-container text-on-primary-container rounded py-3 font-mono text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4"/> Download Asset
          </button>
        </div>
      </div>
    </div>
  );
}
