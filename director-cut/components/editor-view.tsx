import React, { useState } from 'react';
import Image from 'next/image';
import { Play, SkipBack, SkipForward, Maximize, Layers, Wand2, SlidersHorizontal, Eye, EyeOff, Lock, Unlock, Mic, Send, Zap, Clapperboard, Plus, MoreVertical } from 'lucide-react';

type SceneType = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  dependsOn: string[];
};

export function EditorView() {
  const [activeTab, setActiveTab] = useState<'scenes' | 'layers' | 'ai' | 'properties'>('scenes');
  const [scenes, setScenes] = useState<SceneType[]>([
    { id: '1', name: 'Intro Sequence_v04', description: 'Establishing shot of the cyberpunk city at night.', thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLqI1fobD_rZsM4gcu8oKs3k9C-JUPP8AO-ongKOrFyqIA3p02D19g849PoNZVrz1PRbHlQm2XCN_RVMTeKGMZsQPXFxNUr0O5m1SFg6ZmTX3E0FbbhtxY29RhHHhOSs1inGB4uMj4Kr1uGBCyk_GIQtHVN6qWGX-VWxCEBxJOXsUDpUQawHp6OrKYyLOBmX0QnybQ56P12mjYX45dL9lzAP1hwEzGFVp7P7xKBlqQ9HAsEDBxnHKrbZYnEhAiJ5JBMuHVz-PnBYEN', dependsOn: [] },
    { id: '2', name: 'Action Chase_v02', description: 'Drone pursuit through the narrow neon-lit alleys.', thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQPr0WKUz-FBNAl1pR-oLz0SCPHTSk4NayOts_HX2bfEnra94SquoaWn0klfm5u9kXQTj2Gbd7-Qc3UOufHCO8Jc2UITZC8bQ-NPHxJNMCn1AxYJh9_uMSJIE1CLUL5S9FGF9WqvX2PTbfPziMIvFE6a26nsYY7hYNZY54KWdRcHXwmL-777Ms_BdXNmMvxE8XA31_YYJogANQFhsM3J2xnitC_5e9vXVGn4XhM4u_YRykNmAYdKUrHi5xiSPDsB55c08sOtxqfBsL', dependsOn: ['1'] },
  ]);
  const [activeSceneId, setActiveSceneId] = useState('1');
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSceneId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedSceneId) {
      setDragOverSceneId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverSceneId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverSceneId(null);
    
    if (draggedSceneId && draggedSceneId !== targetId) {
      const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId);
      const dropIndex = scenes.findIndex(s => s.id === targetId);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newScenes = [...scenes];
        const [draggedScene] = newScenes.splice(draggedIndex, 1);
        newScenes.splice(dropIndex, 0, draggedScene);
        setScenes(newScenes);
      }
    }
    setDraggedSceneId(null);
  };

  const handleDragEnd = () => {
    setDraggedSceneId(null);
    setDragOverSceneId(null);
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      {/* Video Viewport */}
      <section className="relative w-full aspect-video bg-black group flex-shrink-0">
        <Image 
          src={activeScene.thumbnail} 
          alt="Viewport"
          fill
          className="object-cover opacity-80"
          unoptimized
        />
        
        {/* Viewport Overlay */}
        <div className="absolute inset-0 p-2 sm:p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-surface-dim/80 backdrop-blur-md border border-outline-variant px-2 py-1 flex items-center gap-2 rounded shadow-lg">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,180,171,0.8)]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Live Preview</span>
            </div>
            <button className="pointer-events-auto bg-surface-dim/80 backdrop-blur-md border border-outline-variant p-2 rounded hover:bg-surface-container-high transition-colors">
              <Maximize className="w-4 h-4 text-on-surface" />
            </button>
          </div>
          
          <div className="flex justify-center gap-4 pb-2">
            <button className="pointer-events-auto bg-surface-dim/80 backdrop-blur-xl border border-outline-variant w-10 h-10 rounded-full flex items-center justify-center text-primary-fixed-dim hover:text-primary transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button className="pointer-events-auto bg-primary-container text-on-primary-container w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Play className="w-6 h-6 fill-current" />
            </button>
            <button className="pointer-events-auto bg-surface-dim/80 backdrop-blur-xl border border-outline-variant w-10 h-10 rounded-full flex items-center justify-center text-primary-fixed-dim hover:text-primary transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Editor Tools Workspace */}
      <section className="flex-1 bg-surface flex flex-col min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant overflow-x-auto hide-scrollbar bg-surface-container">
          <TabButton icon={<Clapperboard/>} label="Scenes" active={activeTab === 'scenes'} onClick={() => setActiveTab('scenes')} />
          <TabButton icon={<Layers/>} label="Scene Layers" active={activeTab === 'layers'} onClick={() => setActiveTab('layers')} />
          <TabButton icon={<Wand2/>} label="AI Generation" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <TabButton icon={<SlidersHorizontal/>} label="Properties" active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {activeTab === 'scenes' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-xs font-bold text-outline uppercase tracking-widest">Project Scenes</span>
                <button 
                  onClick={() => {
                    setScenes([...scenes, { id: Date.now().toString(), name: 'New Scene', description: 'Describe your scene here.', thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLqI1fobD_rZsM4gcu8oKs3k9C-JUPP8AO-ongKOrFyqIA3p02D19g849PoNZVrz1PRbHlQm2XCN_RVMTeKGMZsQPXFxNUr0O5m1SFg6ZmTX3E0FbbhtxY29RhHHhOSs1inGB4uMj4Kr1uGBCyk_GIQtHVN6qWGX-VWxCEBxJOXsUDpUQawHp6OrKYyLOBmX0QnybQ56P12mjYX45dL9lzAP1hwEzGFVp7P7xKBlqQ9HAsEDBxnHKrbZYnEhAiJ5JBMuHVz-PnBYEN', dependsOn: [] }]);
                  }}
                  className="text-primary-fixed-dim hover:text-primary flex items-center gap-1 text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Scene
                </button>
              </div>
              {scenes.map(scene => (
                <div 
                  key={scene.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, scene.id)}
                  onDragOver={(e) => handleDragOver(e, scene.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, scene.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    activeSceneId === scene.id ? 'bg-primary-container/10 border-primary-fixed-dim/50' : 'bg-surface-container-low border-outline-variant hover:border-outline'
                  } ${draggedSceneId === scene.id ? 'opacity-50 scale-[0.98]' : ''} ${dragOverSceneId === scene.id ? 'border-primary-fixed-dim bg-primary/5' : ''}`}
                  onClick={() => setActiveSceneId(scene.id)}
                >
                  <div className="w-24 h-16 relative rounded overflow-hidden flex-shrink-0 border border-outline-variant/50">
                    <Image src={scene.thumbnail} alt={scene.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start">
                       <input 
                         type="text"
                         value={scene.name}
                         onChange={(e) => {
                           setScenes(scenes.map(s => s.id === scene.id ? { ...s, name: e.target.value } : s));
                         }}
                         onClick={(e) => e.stopPropagation()}
                         className={`text-sm font-bold bg-transparent outline-none truncate w-full border-b border-transparent focus:border-primary-fixed-dim/50 ${activeSceneId === scene.id ? 'text-primary-fixed-dim' : 'text-on-surface'}`}
                       />
                       <button className="text-outline hover:text-on-surface p-1 -mt-1 -mr-1 transition-colors" onClick={(e) => e.stopPropagation()}>
                         <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                    <input 
                       type="text"
                       value={scene.description}
                       onChange={(e) => {
                         setScenes(scenes.map(s => s.id === scene.id ? { ...s, description: e.target.value } : s));
                       }}
                       onClick={(e) => e.stopPropagation()}
                       className="text-xs text-on-surface-variant bg-transparent outline-none truncate w-full mt-1 border-b border-transparent focus:border-outline-variant/50"
                    />
                    <div className="mt-2 flex flex-wrap gap-1 items-center">
                      {scene.dependsOn.length > 0 && <span className="text-[10px] text-outline uppercase tracking-wider font-bold mr-1">Depends on:</span>}
                      {scene.dependsOn.map(depId => {
                        const depScene = scenes.find(s => s.id === depId);
                        return depScene ? (
                          <div key={depId} className="flex items-center gap-1 bg-surface-container-highest border border-outline-variant px-1.5 py-0.5 rounded text-[10px] text-on-surface-variant group">
                            <span className="truncate max-w-[80px]">{depScene.name}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setScenes(scenes.map(s => s.id === scene.id ? { ...s, dependsOn: s.dependsOn.filter(d => d !== depId) } : s));
                              }}
                              className="opacity-50 hover:opacity-100 hover:text-error transition-opacity"
                            >
                               &times;
                            </button>
                          </div>
                        ) : null;
                      })}
                      <select 
                        className="text-[10px] bg-transparent text-primary-fixed-dim outline-none border border-dashed border-primary-fixed-dim/30 rounded px-1 py-0.5 cursor-pointer max-w-[100px] hover:bg-primary/5 transition-colors"
                        value=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newDepId = e.target.value;
                          if (newDepId && !scene.dependsOn.includes(newDepId)) {
                             setScenes(scenes.map(s => s.id === scene.id ? { ...s, dependsOn: [...s.dependsOn, newDepId] } : s));
                          }
                        }}
                      >
                         <option value="" disabled>+ Link</option>
                         {scenes.filter(s => s.id !== scene.id && !scene.dependsOn.includes(s.id)).map(s => (
                           <option key={s.id} value={s.id} className="text-on-surface bg-surface-container">{s.name}</option>
                         ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'layers' && (
            <>
              <LayerItem name="Foreground_Characters" visible={true} locked={false} active={false} />
              <LayerItem name="Atmospheric_FX_Smoke" visible={true} locked={true} active={true} />
              <LayerItem name="Background_Buildings" visible={false} locked={false} active={false} />
            </>
          )}
          {activeTab === 'ai' && (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 opacity-60">
              <Wand2 className="w-12 h-12 text-primary-fixed-dim mb-4" />
              <h3 className="text-lg font-bold text-on-surface mb-2">AI Assisted Generation</h3>
              <p className="text-sm text-on-surface-variant">Use natural language to generate new assets or modify existing layers in the scene.</p>
            </div>
          )}
          {activeTab === 'properties' && (
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded text-sm text-on-surface-variant text-center">
              Select a layer to view its properties.
            </div>
          )}
        </div>
      </section>

      {/* Floating AI Prompt Input (visible on AI tab or always available) */}
      <div className="absolute bottom-20 left-4 right-4 z-40 max-w-2xl mx-auto">
        <div className="bg-surface-container-high border border-outline-variant p-3 rounded-xl shadow-2xl flex flex-col gap-3 backdrop-blur-xl">
           <div className="flex justify-between items-center px-1">
             <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest flex items-center gap-1">
               <Zap className="w-3 h-3 fill-current" /> AI Prompt
             </span>
           </div>
           <div className="relative">
             <textarea 
               className="w-full bg-surface-dim border border-outline-variant rounded-lg p-3 text-sm text-on-surface focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim resize-none outline-none" 
               placeholder="Describe the scene transition..." 
               rows={2}
               defaultValue=""
             ></textarea>
             <div className="absolute bottom-2 right-2 flex gap-2">
               <button className="bg-surface-container p-1.5 rounded border border-outline-variant hover:bg-surface-bright transition-colors text-outline hover:text-on-surface">
                 <Mic className="w-4 h-4" />
               </button>
               <button className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all">
                 Generate <Send className="w-3 h-3" />
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-colors border-b-2
        ${active ? 'border-primary-fixed-dim text-primary-fixed-dim bg-primary/5' : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container-high'}
      `}
    >
      <div className="w-4 h-4 flex items-center justify-center">{icon}</div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function LayerItem({ name, visible, locked, active }: { name: string, visible: boolean, locked: boolean, active: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded border transition-colors cursor-pointer
      ${active ? 'bg-primary-container/10 border-primary-fixed-dim/50' : 'bg-surface-container-low border-outline-variant hover:border-outline'}
    `}>
      <div className="flex items-center gap-3">
        {visible ? <Eye className={`w-4 h-4 ${active ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`} /> : <EyeOff className="w-4 h-4 text-outline" />}
        <span className={`text-sm ${active ? 'text-primary-fixed-dim font-semibold' : visible ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {name}
        </span>
      </div>
      {locked ? <Lock className={`w-4 h-4 ${active ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`} /> : <Unlock className="w-4 h-4 text-outline" />}
    </div>
  )
}
