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
              {/* Background Effects */}
              <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-defi-purple-500/10 via-transparent to-defi-blue-500/10" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-defi-purple-500/20 rounded-full filter blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-defi-pink-500/20 rounded-full filter blur-3xl animate-pulse-slow" />
              </div>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
