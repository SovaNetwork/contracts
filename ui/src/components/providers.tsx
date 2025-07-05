'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig, chains } from '@/config/wagmi'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }))
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show loading state during SSR and initial hydration
  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-obsidian-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-500"></div>
        </div>
      </div>
    )
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: '#f59e0b',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(222.2 84% 4.9%)',
                color: 'hsl(210 40% 98%)',
                border: '1px solid hsl(217.2 32.6% 17.5%)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}