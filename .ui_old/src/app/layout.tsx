import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

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
      <body
        className={cn(
          "min-h-screen bg-gray-900 text-gray-100 font-sans"
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <NavBar />
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
                <div 
                  className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-defi-pink-500/20 rounded-full filter blur-3xl animate-float opacity-60" 
                  style={{ animationDelay: '1s' }}
                />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-defi-blue-500/15 rounded-full filter blur-2xl animate-pulse-slow opacity-40" />
                
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_70%)]" />
                
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.02%22/%3E%3C/svg%3E')] opacity-20" />
                
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
