'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Film, Cuboid, FolderOpen, MessageSquareText, Search, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';

import { DashboardView } from '@/components/dashboard-view';
import { EditorView } from '@/components/editor-view';
import { RenderView } from '@/components/render-view';
import { AssetsView } from '@/components/assets-view';
import { ReviewView } from '@/components/review-view';
import { LoginView } from '@/components/login-view';

type ViewType = 'dashboard' | 'editor' | 'render' | 'assets' | 'review';

export default function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-on-surface overflow-hidden">
      {/* Top App Bar */}
      <header className="shrink-0 h-14 border-b border-outline-variant flex justify-between items-center px-4 bg-surface-container-low z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tighter text-primary-fixed-dim uppercase">
            Director's Cut
          </h1>
          {activeView !== 'dashboard' && (
            <div className="hidden sm:flex items-center gap-2 border-l border-outline-variant pl-4">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                Project Alpha
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-on-surface-variant hover:text-error transition-colors ml-2"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden relative ml-2">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY3xG6zsBlV2Pm8eWG-lqYlnlFqA1hm0RRXvoDT5jPlBkH-aMeSwwtTHET66WKWryKI_Lk_xCDZhotx3JHGAJAOS2ymsWG7mFuPp6KaOVOdjGWPzz2G0F4VUlS9QqqBmCOAdM2VB54ZDemIebHWUlEz0AD-d2xYN1YF6uPgjZRu9_KuBWWpUeNc9cw-MsBSalKb2ut8lLBt4Yr1eW5eA4IgRHDl7WvgfdyvWrDHvy1w85ZuJ6OQfkv8w-pTWnBXbVTaW5v4nlF-4Mt" 
              alt="User" 
              fill 
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-safe">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'editor' && <EditorView />}
        {activeView === 'render' && <RenderView />}
        {activeView === 'assets' && <AssetsView />}
        {activeView === 'review' && <ReviewView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 h-16 border-t border-outline-variant bg-surface-container flex justify-around items-center px-2 z-50">
        <NavButton id="dashboard" icon={<LayoutDashboard className="w-6 h-6" />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <NavButton id="editor" icon={<Film className="w-6 h-6" />} label="Editor" active={activeView === 'editor'} onClick={() => setActiveView('editor')} />
        <NavButton id="render" icon={<Cuboid className="w-6 h-6" />} label="Render" active={activeView === 'render'} onClick={() => setActiveView('render')} />
        <NavButton id="assets" icon={<FolderOpen className="w-6 h-6" />} label="Assets" active={activeView === 'assets'} onClick={() => setActiveView('assets')} />
        <NavButton id="review" icon={<MessageSquareText className="w-6 h-6" />} label="Review" active={activeView === 'review'} onClick={() => setActiveView('review')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { id: string, icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full pt-1 transition-all active:scale-95 duration-100 ${
        active 
          ? 'text-primary border-t-2 border-primary bg-primary/5' 
          : 'text-outline hover:text-on-surface'
      }`}
    >
      <div className={`mb-1 ${active ? 'animate-in zoom-in duration-200' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
