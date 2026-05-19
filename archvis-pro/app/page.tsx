import { 
  BarChart3, 
  Clock, 
  Cpu, 
  HardDrive, 
  Layers, 
  Library,
  Zap, 
  ArrowUpRight,
  Monitor
} from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const recentProjects = [
    { name: "Neo-Modern Atrium", status: "Render Complete", date: "2h ago", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIvYsKTTVdWyXzA8xnfwh62XEWoV7e4FcO5IIq-6loFIcEz8i7H7VjSGqHFl3Q2xt6iCPJb_t5TnZb6J5zfojVLB_Lcz9D-1ds11REOrjQ_GNchKv8-iVXRKl_5ByeWabevsui9Pi5Du4aHFCyZUZlEk4jA-XY9G4GBxBEauPgtRoTxe6dXqlTdawIjb_fQSnsTvEoUUPAmtiG3hUBOuRbg_VuCCqHkA0vqexWEjzWr9-aMBSe6kdybdTyL7AGAYxCbKScLAsIf1qp" },
    { name: "Corporate Lobby v2", status: "Syncing Assets", date: "5h ago", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAG-7d6Sb3tQ_Wr2pTDuXDQK8PVjmInIJwf8OHfpWwhPRp7fmEXCQ--y3EZG3ca68lfmN_p8h9IVzQctR7khSK4p5k8wI53ec9uSWOEANzCRc1EGQPRB6Q-ibOAtLApzeYzvS6yVb8p0pRqZE38b9hL4el_rALm1MWqm1GZ-nqeGnIW3MG7oeeom0SNs_7EnwUulz36uoSyYUTamvaY5jDGG88sARZ90FxceTfudrnsT_uoOwEKeIAS4iQWEcHEqd7hwW_maJkxnBom" },
    { name: "Kitchen Interior", status: "Optimization Running", date: "yesterday", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgnUkoHy7UMfGcDJUHERtKJO0QMgL0m2l8aUU14463aBvQUcJTlwrRLK5WMi0g34kmoSKNklMWSiuNGDOJKJO6dOjskVN2yZd5375m_GHDvSEDxS-qXZxHskDehhm_83CWx8xPwZSR4zQgorsD9i4mpyoEz-mglxZStcUH0xNDBZpcc5XcdIlQ79w1jv2t0M-pkx4lrYJVVuhSdkBX_SEji0L7gu1hN_jddokh7g_-nNeLDcGBgrSfviYJ_2nmCkRqEuaRcDodR8os" }
  ];

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Workstation Dashboard</h1>
          <p className="text-on-surface-variant">System Status: <span className="text-primary">Optimized</span> • Node: US-EAST-01</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="font-mono text-xs">GPU: RTX 6000 Ada</span>
           </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Renders", value: "04", icon: Monitor, color: "text-primary" },
          { label: "Storage Used", value: "42.8GB", icon: HardDrive, color: "text-tertiary" },
          { label: "Avg Speed", value: "2.4s", icon: Zap, color: "text-secondary" },
          { label: "Uptime", value: "99.9%", icon: Clock, color: "text-on-surface-variant" }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <ArrowUpRight className="w-4 h-4 text-on-surface-variant opacity-50" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Recent Visualizations</h2>
            <button className="text-primary font-mono text-xs hover:underline">View All Projects</button>
          </div>
          
          <div className="space-y-4">
             {recentProjects.map((project, i) => (
               <div key={i} className="group flex items-center gap-4 p-4 bg-surface-container rounded-2xl border border-outline-variant hover:border-primary/50 transition-all cursor-pointer">
                 <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-surface-dim flex-shrink-0">
                    <Image src={project.img} alt={project.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="96px" referrerPolicy="no-referrer" />
                 </div>
                 <div className="flex-grow">
                    <div className="font-display font-bold text-white">{project.name}</div>
                    <div className="text-xs text-on-surface-variant font-mono">{project.status}</div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <div className="text-xs text-on-surface-variant font-mono">{project.date}</div>
                    <button className="mt-1 text-primary scale-0 group-hover:scale-100 transition-transform">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* System & Tools */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold">Workspace Tools</h2>
          <div className="grid grid-cols-2 gap-4">
             {[
               { name: "Neural Denoise", icon: Cpu },
               { name: "PBR Library", icon: Library },
               { name: "Scene Layers", icon: Layers },
               { name: "Analytics", icon: BarChart3 }
             ].map((tool, i) => (
               <button key={i} className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-container border border-outline-variant rounded-2xl hover:bg-surface-container-high transition-colors text-center group">
                 <tool.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                 <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{tool.name}</span>
               </button>
             ))}
          </div>
          
          <div className="p-6 bg-primary-container/20 border border-primary/20 rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-primary">Deployment Hub</h3>
            <p className="text-xs text-on-surface-variant">Your latest render is ready for client review. Sync to cloud now.</p>
            <button className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all active:scale-95">
              Sync Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
