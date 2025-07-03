import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { Header } from "@/components/layout/header";
import { ThemeToggleLarge } from "@/components/theme/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SovaBTC Protocol",
  description: "Cross-chain Bitcoin wrapper protocol powered by LayerZero",
  keywords: ["bitcoin", "defi", "cross-chain", "layerzero", "wrapper"],
  authors: [{ name: "SovaBTC Team" }],
  creator: "SovaBTC Protocol",
  publisher: "SovaBTC Protocol",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sovabtc.com",
    title: "SovaBTC Protocol",
    description: "Cross-chain Bitcoin wrapper protocol powered by LayerZero",
    siteName: "SovaBTC Protocol",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SovaBTC Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SovaBTC Protocol",
    description: "Cross-chain Bitcoin wrapper protocol powered by LayerZero",
    images: ["/og-image.png"],
    creator: "@sovabtc",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t bg-muted/30 backdrop-blur-sm">
              <div className="container py-8">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Theme Demo */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Theme System</h3>
                    <p className="text-sm text-muted-foreground">
                      Experience SovaBTC in both light and dark modes with our beautiful Sova-branded theme system.
                    </p>
                    <div className="flex flex-col gap-3">
                      <ThemeToggleLarge />
                      <div className="text-xs text-muted-foreground">
                        Switch between light mode and Sova's signature dark theme with mint accents
                      </div>
                    </div>
                  </div>

                  {/* Brand Colors Demo */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Sova Colors</h3>
                    <div className="grid grid-cols-2 gap-2">
                                          <div className="p-3 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-lg">
                      <div className="text-sova-black-500 text-xs font-medium">Mint Gradient</div>
                    </div>
                      <div className="p-3 bg-sova-black-500 rounded-lg">
                        <div className="text-white text-xs font-medium">Sova Black</div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 border border-border rounded-lg">
                        <div className="text-sova-black-500 dark:text-white text-xs font-medium">Subtle</div>
                      </div>
                      <div className="p-3 border border-border rounded-lg bg-card">
                        <div className="text-foreground text-xs font-medium">Card</div>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">SovaBTC Protocol</h3>
                    <p className="text-sm text-muted-foreground">
                      A unified cross-chain Bitcoin wrapper protocol enabling seamless Bitcoin transfers across multiple blockchains.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-sova-black-500 text-xs rounded-full font-medium">
                        Cross-Chain
                      </span>
                      <span className="px-2 py-1 bg-card border border-border text-foreground text-xs rounded-full">
                        Bitcoin
                      </span>
                      <span className="px-2 py-1 bg-card border border-border text-foreground text-xs rounded-full">
                        LayerZero
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    © 2024 SovaBTC Protocol. Built with ❤️ for Bitcoin DeFi.
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Testnet Version</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
