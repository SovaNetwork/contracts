'use client'

import React, { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'
import { ThemeProvider } from '@/components/theme/theme-provider'

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

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Initializing Web3...</p>
      </div>
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Add a small delay to ensure all browser APIs are available
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Don't render Web3 providers until fully mounted client-side
  if (!mounted) {
    return (
      <ThemeProvider defaultTheme="light">
        <LoadingScreen />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="light">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
} 