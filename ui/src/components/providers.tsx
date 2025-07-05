'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/config/wagmi'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent SSR hydration issues with Web3 providers
  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col">
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
      </div>
    )
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#8b5cf6',
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
    </WagmiProvider>
  )
}