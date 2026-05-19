import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTmGoRXqkAlYw07FCYhgt5vdLXu51vcw2k9826Nb8EyrKOR_drdvcGFWQz6JKFZTF_xqRvg2v96TNv2zmqNxytGvDDmWqMRREakhbd5VVq10KqM4PjkfnXdB3yuATmXD7MdR5l-wd1Wr6z3ASBmfQq5w8QExW3Pq3BDeYdpvdoEjlqf3tjmcrbrAnKin2hoPk7C2uz1DkNysHTeN4JAEP63k-SJ6HWs2_KckSODYH971L0u_PBuR5pdAA3VdHKygrgrbyrR7YU4tOA"
          alt="Cinematic Background"
          fill
          className="object-cover opacity-40"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tighter text-primary-fixed-dim uppercase mb-2">
              Director's Cut
            </h1>
            <p className="text-xs font-medium text-outline uppercase tracking-widest">
              Secure Workspace Authentication
            </p>
          </div>

          <div className="mb-6 p-3 bg-primary-container/10 border border-primary-container/30 rounded-lg text-center">
            <p className="text-xs text-primary-fixed-dim font-medium uppercase tracking-wider">
              Demo Mode: Any email & password will work
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-outline" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface text-sm focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim outline-none transition-all placeholder:text-outline/50"
                    placeholder="name@production.co"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest" htmlFor="password">
                    Password
                  </label>
                  <button type="button" className="text-[10px] uppercase font-bold text-primary hover:text-primary-fixed-dim transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-outline" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface text-sm focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim outline-none transition-all placeholder:text-outline/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-container text-on-primary-container hover:opacity-90 active:scale-[0.98] py-3 rounded-lg font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.15)] group"
            >
              Sign In
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-outline">
            By signing in, you agree to our <br/> <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
