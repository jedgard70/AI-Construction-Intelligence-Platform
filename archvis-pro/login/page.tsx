'use client';

import { useState } from "react";
import Image from "next/image";
import { Lock, User, ArrowRight, Zap, ShieldCheck, Globe, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row items-stretch">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container overflow-hidden p-12 flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://picsum.photos/seed/archvis/1920/1080" 
            alt="Hero Background" 
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-20 grayscale brightness-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-primary/5"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary mb-12">
            <Zap className="w-8 h-8 fill-current" />
            <span className="font-display text-2xl font-bold tracking-tighter uppercase">ArchVis Pro</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-5xl font-bold text-white mb-6 leading-tight">Your vision, rendered into reality.</h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">Experience a new standard of architectural visualization with real-time GPU acceleration.</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-8">
           <div className="flex flex-col gap-1">
              <span className="font-mono text-2xl font-bold text-white italic">2.4s</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Avg Render Time</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="font-mono text-2xl font-bold text-white italic">1.2M</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Global Assets</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold text-on-surface">Welcome back</h2>
            <p className="text-on-surface-variant">Sign in to your workstation to continue.</p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Official Email Address" 
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all font-mono text-sm" 
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Master Passkey" 
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all font-mono text-sm" 
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-xs font-mono bg-error/10 p-3 rounded-lg border border-error/20">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-on-surface text-background font-display font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Authenticate <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button className="flex items-center justify-center gap-2 p-3 bg-surface-container border border-outline-variant rounded-xl text-sm font-mono hover:bg-surface-container-high transition-all">
              <ShieldCheck className="w-4 h-4 text-primary" /> SSO
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-surface-container border border-outline-variant rounded-xl text-sm font-mono hover:bg-surface-container-high transition-all">
              <Globe className="w-4 h-4 text-primary" /> Web3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

