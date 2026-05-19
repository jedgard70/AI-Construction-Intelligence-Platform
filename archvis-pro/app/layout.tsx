import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "ArchVis Pro",
  description: "High-fidelity architectural visualization platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}>
      <body className="bg-background text-on-surface antialiased overflow-x-hidden">
        <Navigation />
        <main className="min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
