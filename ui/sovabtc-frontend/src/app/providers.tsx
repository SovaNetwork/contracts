'use client'

import React, { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'
import { ThemeProvider } from '@/components/theme/theme-provider'
import '@rainbow-me/rainbowkit/styles.css'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000, // 30 seconds
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted (prevents SSR issues)
  if (!mounted) {
    return (
      <ThemeProvider defaultTheme="light">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="light">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: '#84F29B', // Sova Mint
                accentColorForeground: '#191C19', // Sova Black
                borderRadius: 'medium',
                fontStack: 'system',
              }),
              darkMode: darkTheme({
                accentColor: '#84F29B', // Sova Mint
                accentColorForeground: '#191C19', // Sova Black
                borderRadius: 'medium',
                fontStack: 'system',
              }),
            }}
            modalSize="compact"
            coolMode
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
} 