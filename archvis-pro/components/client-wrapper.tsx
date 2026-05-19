'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { AICopilot } from '@/components/ai-copilot';
import { useEffect, useState } from 'react';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('auth_token');
    if (!auth && pathname !== '/login') {
      window.location.href = '/login';
    } else {
      setTimeout(() => setIsAuthChecking(false), 0);
    }
  }, [pathname]);

  const isLoginPage = pathname === '/login';

  return (
    <div style={{ opacity: isAuthChecking ? 0 : 1, transition: 'opacity 0.2s' }}>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <>
          <Navigation />
          <main className="pt-toolbar-height lg:pl-[280px] min-h-screen pb-20 lg:pb-0 relative z-10">
            {children}
          </main>
          <AICopilot />
        </>
      )}
    </div>
  );
}
