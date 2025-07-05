import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "SovaBTC - Modern Bitcoin DeFi Protocol",
  description: "Professional Bitcoin DeFi with transparent wrapping, staking, and yield farming",
  keywords: "DeFi, Bitcoin, SovaBTC, Staking, Wrapping, Base",
  authors: [{ name: "SovaBTC Team" }],
  openGraph: {
    title: "SovaBTC - Modern Multi-Chain Bitcoin Protocol",
    description: "Professional DeFi experience for Bitcoin holders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 relative">
              {/* Enhanced Background Effects */}
              <div className="fixed inset-0 -z-10 overflow-hidden">
                {/* Primary gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-defi-purple-500/8 via-transparent to-defi-blue-500/8" />
                
                {/* Animated mesh gradient */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0 bg-mesh-gradient animate-gradient-xy" />
                </div>
                
                                 {/* Floating orbs */}
                 <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-defi-purple-500/20 rounded-full filter blur-3xl animate-float opacity-60" />
                 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-defi-pink-500/20 rounded-full filter blur-3xl animate-float opacity-60" style={{ animationDelay: '1s' } as React.CSSProperties} />
                 <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-defi-blue-500/15 rounded-full filter blur-2xl animate-pulse-slow opacity-40" />
                
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_70%)]" />
                
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.02"/%3E%3C/svg%3E')] opacity-20" />
                
                {/* Subtle radial gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.1)_100%)]" />
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
