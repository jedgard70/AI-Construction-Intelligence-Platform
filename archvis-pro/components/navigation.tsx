'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Box, 
  Layers, 
  Library, 
  Image as ImageIcon,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Editor', href: '/editor', icon: Box },
    { label: 'Materials', href: '/materials', icon: Library },
    { label: 'Gallery', href: '/gallery', icon: ImageIcon },
  ];

  if (pathname === '/login') return null;

  return (
    <>
      <header className="h-[80px] border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-[60] flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group transition-all">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-on-primary">
              <Layers className="w-5 h-5 fill-current" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter uppercase group-hover:text-primary transition-colors">ArchVis <span className="font-light opacity-50">PRO</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-all ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Quick search (⌘K)" 
              className="bg-surface-container-high border border-outline-variant rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-mono"
            />
          </div>
          
          <button className="p-2 text-on-surface-variant hover:text-on-surface relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                <div className="w-7 h-7 relative rounded-full overflow-hidden border border-outline bg-surface-container flex items-center justify-center">
                  {user.user_metadata.avatar_url ? (
                    <Image 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      fill
                      sizes="28px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-on-surface-variant" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-mono text-on-surface-variant leading-none truncate max-w-[100px]">
                    {user.email}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-highest border border-outline-variant rounded-xl shadow-2xl z-[70] overflow-hidden py-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
            >
              Log In
            </Link>
          )}
        </div>
      </header>


      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-outline-variant z-[60] flex items-center justify-around px-4">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              pathname === item.href ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
