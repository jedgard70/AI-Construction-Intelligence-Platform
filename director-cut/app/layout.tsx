import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Director's Cut Workspace",
  description: 'Cinematic production and VFX workspace tailored for high-end film editing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
