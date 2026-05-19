import React from 'react';
import Image from 'next/image';
import { Plus, MoreVertical } from 'lucide-react';

export function DashboardView() {
  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Projects</h2>
          <p className="text-xs font-semibold text-outline uppercase tracking-widest mt-1">Workspace / Alpha Phase</p>
        </div>
        <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all font-semibold">
          <Plus className="w-5 h-5" />
          <span className="text-sm">New Project</span>
        </button>
      </section>

      {/* Featured Active Project */}
      <section>
        <div className="relative group rounded-xl overflow-hidden border border-primary/30 bg-surface-container-highest cursor-pointer">
          <div className="aspect-video w-full relative">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXqau7YTuus4IUciqMj-vD5UgYJU9zh78BEJf22koEm0s0FcO679yaH106Gusz1VgLXT--o5zh4SIPZoKhGf57hPcKNvLtiMbCqndETdzWGzp_klu_gWMxR4dbWrZytwbZG-jziUAZMmSJIfY6ZjfFlsdl3NNx1OspcVP2TmodaMA3n8BuUbOusQwdpzTb7Sme6LLziyg3QNmZ7HOzG-6wZdGyLqvsj6PBeSbAdglnKuYp0uKU5igM2XCYWgcg94fgyVlL62gWCl1w" 
              alt="Cyberpunk Overdrive" 
              fill 
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
          
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-surface-container-low/60 backdrop-blur-md border border-primary/50 text-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(0,219,233,0.2)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
              ACTIVE
            </span>
          </div>

          <div className="p-5 relative z-10 -mt-16 sm:-mt-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-md mb-2">Cyberpunk Overdrive</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant font-medium drop-shadow-md">Last edited: 2 mins ago</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border border-surface bg-surface-container-low flex items-center justify-center text-xs font-bold text-on-surface">JD</div>
                <div className="w-8 h-8 rounded-full border border-surface bg-surface-container-low flex items-center justify-center text-xs font-bold text-on-surface">MK</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Projects Grid */}
      <section>
        <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3 px-1">Recent Releases</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCard 
            title="Void Echoes" 
            phase="VFX Phase: Compositing" 
            progress={75}
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBYpFepFRprp-x7g-B2LLCRnAVFYEHnCop_9YFEGeElCANl1cw0ggDVnMakc7Kdqs3NdQZWzc2r0U2AVBD0ufsEEHLxO9MdQl91vZfW20Xs9uxXqYDIhsalgQ-HSDx-_brr-reSjxg4NoqDeFMIhNOCLjjdVGGygh1PcJKa0JFhsNLqDZfIrFKC2eSi6ksiR619AUzdoQ9tR8kJ3gLBU9OV6NngM0DjTi38w8mOprePHg2WyGDvI8OrErd98BrpZlyIMwuGPwvZYN4V"
          />
          <ProjectCard 
            title="Dune Rider" 
            phase="VFX Phase: Animation" 
            progress={40}
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDBE7LfUWluTmjQfh69MMrFHWH8-b2XWfKqES2BUMQYtw_yYtnwxIMUXvdPttPthEKfceCeIOC8zDve5hMujIViIFq1ZNl-oMKzDrJw1PK-Zctp8gKOdcJBK0ln0IJUFCsXQAHSj-56Ooy3w7IpcGuM9HbbUYku1thCKs0DiIehPO_ghIe_rvXrOd3BzBpcJ3y78gZ8n10-4rs89buFzQjs2StLPM-fdbRxGn0cvIaRFne_tXbXWs4DvVebcoy9cNguhwABC0BJI848"
          />
          <ProjectCard 
            title="London Fog" 
            phase="VFX Phase: Lighting" 
            progress={90}
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuAKF5JV_hWdoSCZxNMU1RE17XlUJLVJ3zc7WqSW957w0fxQeQh_JeVB_KVQmM0LxnUHqeMIhKPlgqDLYKvw5lwg781dA6G4EEEMuQNbUWieIJXvD8lXN7mFS4wQoFDrNxI9zERHMhHcJ96wOmJ45-mdQf-6CorXUmPOzPQgi09n_vHUH0qb4PQVQOvMtSJ_lV1sXY1ab7Wu0s_axZ2w9jQyGnpYaK8atnC4uz1bFVNBIACPuhMd6hc5mcomFuvrea54u0qLcajTOGvS"
          />
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ title, phase, progress, image }: { title: string, phase: string, progress: number, image: string }) {
  return (
    <div className="flex gap-4 p-3 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container hover:border-outline transition-all group cursor-pointer">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded overflow-hidden relative flex-shrink-0 bg-surface">
        <Image src={image} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out" unoptimized />
      </div>
      <div className="flex flex-col justify-center flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-semibold text-on-surface">{title}</h3>
          <button className="text-outline hover:text-primary p-1 -mr-1"><MoreVertical className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">{phase}</p>
        <div className="mt-3 w-full bg-surface-variant h-1 rounded-full overflow-hidden">
          <div className="bg-secondary-container h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
