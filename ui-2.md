# Phase 2: Modern DeFi Layout & Navigation

## Overview
Creating a professional Uniswap-style layout with animated components and modern Web3 integration.

## Step 1: Providers Component

```typescript
// src/components/providers.tsx
'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/config/wagmi'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

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
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

## Step 2: Modern Header Component

```typescript
// src/components/layout/header.tsx
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bitcoin, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const navigation = [
  { name: 'Wrap', href: '/wrap' },
  { name: 'Redeem', href: '/redeem' },
  { name: 'Stake', href: '/stake' },
  { name: 'Portfolio', href: '/portfolio' },
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/10 defi-card backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative"
          >
            <Bitcoin className="h-8 w-8 text-defi-purple-400" />
            <div className="absolute -inset-1 bg-defi-purple-500/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300" />
          </motion.div>
          <motion.span 
            className="text-xl font-bold gradient-text"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            SovaBTC
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-4 py-2 rounded-lg transition-all duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-defi-purple-500/20 border border-defi-purple-500/30 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-defi-purple-300' 
                      : 'text-slate-300 hover:text-white'
                  }`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
          <div className="sm:hidden">
            <ConnectButton 
              showBalance={false}
              chainStatus="none"
              accountStatus="avatar"
            />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="defi-card border-white/10">
              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: 10 }}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname === item.href
                          ? 'bg-defi-purple-500/20 text-defi-purple-300 border border-defi-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
```

## Step 3: Main Layout Update

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SovaBTC - Modern Multi-Chain Bitcoin Protocol',
  description: 'Wrap, stake, and redeem Bitcoin across multiple chains with professional DeFi experience',
  keywords: 'DeFi, Bitcoin, SovaBTC, Staking, Wrapping, Base',
  authors: [{ name: 'SovaBTC Team' }],
  openGraph: {
    title: 'SovaBTC - Modern Multi-Chain Bitcoin Protocol',
    description: 'Professional DeFi experience for Bitcoin holders',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
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
  )
}
```

## Step 4: Modern Home Page

```typescript
// src/app/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { TrendingUp, Shield, Zap, Coins } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

const features = [
  {
    icon: Shield,
    title: "Secure Wrapping",
    description: "Multi-signature custody with transparent reserves"
  },
  {
    icon: TrendingUp,
    title: "Yield Generation",
    description: "Earn SOVA rewards through staking mechanisms"
  },
  {
    icon: Zap,
    title: "Fast Redemption",
    description: "Efficient queue system with predictable timing"
  },
  {
    icon: Coins,
    title: "Multi-Chain",
    description: "Cross-chain Bitcoin representation"
  }
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold gradient-text leading-tight"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            Next-Gen Bitcoin DeFi
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Wrap, stake, and earn with Bitcoin-backed tokens. Professional DeFi experience 
            with institutional-grade security and transparency.
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<StatsGridSkeleton />}>
            <StatsGrid />
          </Suspense>
        </motion.div>

        {/* Main Dashboard */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Suspense fallback={<PortfolioSkeleton />}>
              <PortfolioOverview />
            </Suspense>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="defi-card p-6 text-center space-y-4 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-defi-purple-500/20 group-hover:bg-defi-purple-500/30 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-defi-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="defi-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
        <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-40 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-32 bg-slate-700/50 rounded shimmer" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-40 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-32 bg-slate-700/50 rounded shimmer" />
        </div>
      </div>
    </div>
  )
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="defi-card p-6 space-y-4">
          <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-32 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-24 bg-slate-700/50 rounded shimmer" />
        </div>
      ))}
    </div>
  )
}