'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Search, 
  LayoutGrid, 
  Grid3X3, 
  Download, 
  Share2, 
  Maximize2,
  X,
  Upload,
  Calendar,
  Layers,
  Trash2,
  RotateCcw,
  RefreshCw,
  Clock
} from 'lucide-react';

interface GalleryImage {
  id: string;
  title: string;
  type: 'PANORAMA' | 'DETAIL' | 'NIGHT' | 'DAY' | 'INTERIOR';
  img: string;
  resolution: string;
  date: string;
}

const INITIAL_IMAGES: GalleryImage[] = [
  { id: '1', title: 'West Atrium Main Hall', type: 'DAY', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIvYsKTTVdWyXzA8xnfwh62XEWoV7e4FcO5IIq-6loFIcEz8i7H7VjSGqHFl3Q2xt6iCPJb_t5TnZb6J5zfojVLB_Lcz9D-1ds11REOrjQ_GNchKv8-iVXRKl_5ByeWabevsui9Pi5Du4aHFCyZUZlEk4jA-XY9G4GBxBEauPgtRoTxe6dXqlTdawIjb_fQSnsTvEoUUPAmtiG3hUBOuRbg_VuCCqHkA0vqexWEjzWr9-aMBSe6kdybdTyL7AGAYxCbKScLAsIf1qp', resolution: '7680x4320', date: '2024-05-12' },
  { id: '2', title: 'Penthouse Garden Suite', type: 'NIGHT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7_i_4x4u030L9bD0sbFIjv_yROvCgmoYKKVyZani00IA6lzMNIIKI9RQWdevsZMdWM_rknL-4OrF2g2mibdVdmmiPk6ezZphaDOmOG1v7y_hEe9HrRzX61vB4It142V4mDANqe4Y69nZTUmWmccKo7WIRgwSKGEpXpyUmx0_s5BrdgD0DlX18eUbc2E1n3K4AZkFxrmJA_ua4rAW2SagHJiP4NuSWIYFJ7_1IRN9HKfH6OaMnRQQOCwsq3jpeoTw08B0fCUZfqEYz', resolution: '4096x2304', date: '2024-05-11' },
  { id: '3', title: 'Open Concept Kitchen', type: 'INTERIOR', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgnUkoHy7UMfGcDJUHERtKJO0QMgL0m2l8aUU14463aBvQUcJTlwrRLK5WMi0g34kmoSKNklMWSiuNGDOJKJO6dOjskVN2yZd5375m_GHDvSEDxS-qXZxHskDehhm_83CWx8xPwZSR4zQgorsD9i4mpyoEz-mglxZStcUH0xNDBZpcc5XcdIlQ79w1jv2t0M-pkx4lrYJVVuhSdkBX_SEji0L7gu1hN_jddokh7g_-nNeLDcGBgrSfviYJ_2nmCkRqEuaRcDodR8os', resolution: '3840x2160', date: '2024-05-10' },
  { id: '4', title: 'Corporate Lobby South', type: 'DAY', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG-7d6Sb3tQ_Wr2pTDuXDQK8PVjmInIJwf8OHfpWwhPRp7fmEXCQ--y3EZG3ca68lfmN_p8h9IVzQctR7khSK4p5k8wI53ec9uSWOEANzCRc1EGQPRB6Q-ibOAtLApzeYzvS6yVb8p0pRqZE38b9hL4el_rALm1MWqm1GZ-nqeGnIW3MG7oeeom0SNs_7EnwUulz36uoSyYUTamvaY5jDGG88sARZ90FxceTfudrnsT_uoOwEKeIAS4iQWEcHEqd7hwW_maJkxnBom', resolution: '5120x2880', date: '2024-05-09' },
  { id: '5', title: 'Rooftop Lounge 360', type: 'PANORAMA', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_9G6ibHMGcPpnQowZO7gY8q-tADCgjNC9GJK72BfszPTDLImQM4VPmeK2K3uxWflg3IVL_QHBJhx0Ckz2fBTA47U5a6QaCIuYWzxIGayrf5JrWAp5qYIRQ2fdj3CfAV-4YTKiFIIxd_Qvgz6ftPyKr6E_iaLkAe1MiPomCSEa1NrcQEi3q9tc11IUFBuydBtL6XbipWcwp3UREGdMFL8c-wYS-x-ZPvjo7gXYvaheF7yav2s5JKWdBlSZfyBiDvzp-5rZYKYJ-5Rn', resolution: '12000x6000', date: '2024-05-08' },
  { id: '6', title: 'Façade Detail V01', type: 'DETAIL', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsyA0s5OVLfCiv5lWOZ-MWjsz8cscO3ZWLNZLhOOsxAjj0cbzyWAX4b4MhKFLqJdhNdCQyRCrmuBYr0-kT2Nj7A_w9Kc0yoYfZZmzinKdAXjjHhpxOU9ipF6hdVkIy8C97S3vcI1HMTu5RnBSkafRkfrSr7QdR0kvzFDctkOXyVWpZwV8JwhJn-WWdD1PFkM9FRAx3VQNv1IqyQOICOPBUORSwem5IN8zQxODedBvfR72_H8x0zhvmil1TwRVBnqYsemKx1U4BtwEm', resolution: '3000x4500', date: '2024-05-07' },
];

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<GalleryImage[]>([]);
  const [tooltipImage, setTooltipImage] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        const newImg: GalleryImage = {
          id: Math.random().toString(36).substr(2, 9),
          title: files[0].name.replace(/\.[^/.]+$/, ""),
          type: 'INTERIOR',
          img: URL.createObjectURL(files[0]),
          resolution: 'Unknown',
          date: new Date().toISOString().split('T')[0],
        };
        setUploads(prev => [newImg, ...prev]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(img => img.id !== id));
  };

  const filteredImages = [...uploads, ...INITIAL_IMAGES].filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || img.type === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'NEWEST') return new Date(b.date).getTime() - new Date(a.date).getTime();
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 min-h-screen" onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            Assets & Rendering <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-0.5 rounded border border-primary/20">v2.4</span>
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Access and manage your high-fidelity architectural visualizations.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50"
           >
             {isUploading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
             Upload Asset
           </button>
           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center sticky top-[80px] z-40 py-4 glass-panel -mx-4 px-4 border-y border-white/5 shadow-2xl">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
            />
          </div>
          
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-white/5">
            {['ALL', 'DAY', 'NIGHT', 'INTERIOR', 'PANORAMA'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-md text-[10px] font-mono transition-all ${filterType === type ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <select 
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value as any)}
             className="bg-surface-container-low border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-mono"
           >
             <option value="NEWEST">Newest First</option>
             <option value="OLDEST">Oldest First</option>
           </select>
           
           <div className="flex bg-surface-container-low p-1 rounded-lg border border-white/5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white/10 text-primary' : 'text-on-surface-variant'}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('masonry')} className={`p-1.5 rounded-md ${viewMode === 'masonry' ? 'bg-white/10 text-primary' : 'text-on-surface-variant'}`}><LayoutGrid className="w-4 h-4" /></button>
           </div>
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
         {filteredImages.map((img) => (
           <div 
             key={img.id} 
             onClick={() => setSelectedImage(img)}
             className={`group relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all cursor-crosshair aspect-square`}
           >
             <Image 
               fill 
               src={img.img} 
               alt={img.title} 
               sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
               className="object-cover transition-transform duration-700 group-hover:scale-105" 
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <h3 className="text-white font-display font-semibold truncate">{img.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-[10px] text-on-surface-variant font-mono">{img.resolution}</span>
                </div>
             </div>
             <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                <span className="font-mono text-[9px] text-white tracking-widest">{img.type}</span>
             </div>
             {uploads.find(u => u.id === img.id) && (
                <button onClick={(e) => { e.stopPropagation(); removeUpload(img.id); }} className="absolute top-4 right-4 z-20 p-1.5 bg-error/20 text-error rounded-full hover:bg-error/40 transition-all opacity-0 group-hover:opacity-100">
                   <Trash2 className="w-4 h-4" />
                </button>
             )}
           </div>
         ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedImage(null)}></div>
           <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 z-[110] p-2 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
           
           <div className="relative z-[110] w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-center h-full">
              <div className="flex-grow w-full relative h-[60vh] lg:h-full bg-surface-container rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                 <Image src={selectedImage.img} alt={selectedImage.title} fill className="object-contain" referrerPolicy="no-referrer" />
                 <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-4">
                    <button className="bg-black/60 shadow-xl backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-black/80 transition-all font-mono text-xs">
                       <Download className="w-4 h-4 text-primary" /> Download 8K
                    </button>
                    <button className="bg-black/60 shadow-xl backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-black/80 transition-all font-mono text-xs">
                       <Share2 className="w-4 h-4 text-primary" /> Share
                    </button>
                 </div>
              </div>
              
              <div className="w-full lg:w-96 flex flex-col gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/20 rounded font-mono text-[10px]">{selectedImage.type}</span>
                       <span className="text-on-surface-variant text-[10px] font-mono">{selectedImage.date}</span>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white leading-tight">{selectedImage.title}</h2>
                 </div>

                 <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono"><span className="text-on-surface-variant">Resolution</span><span className="text-white">{selectedImage.resolution}</span></div>
                    <div className="flex justify-between items-center text-xs font-mono"><span className="text-on-surface-variant">Date</span><span className="text-white">{selectedImage.date}</span></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
