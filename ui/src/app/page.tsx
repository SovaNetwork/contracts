'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { TrendingUp, Shield, Zap, Coins } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

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
    opacity: 1
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

const quickActions = [
  {
    title: "Wrap Bitcoin",
    description: "Convert your Bitcoin assets to SovaBTC",
    href: "/wrap",
    gradient: "from-defi-purple-500 to-defi-pink-500"
  },
  {
    title: "Stake SovaBTC",
    description: "Earn SOVA rewards by staking your tokens",
    href: "/stake",
    gradient: "from-defi-pink-500 to-defi-blue-500"
  },
  {
    title: "Redeem Assets",
    description: "Queue redemption for your wrapped Bitcoin",
    href: "/redeem",
    gradient: "from-defi-blue-500 to-defi-purple-500"
  }
]

export default function HomePage() {
  const { isConnected } = useAccount()

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
          
          {!isConnected && (
            <motion.div 
              variants={itemVariants}
              className="flex justify-center pt-4"
            >
              <ConnectButton />
            </motion.div>
          )}
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

function PortfolioOverview() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Connect your wallet to view your portfolio</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <ConnectButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your SovaBTC holdings and rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Total SovaBTC</p>
            <p className="text-2xl font-bold">0.00000000</p>
            <p className="text-sm text-slate-500">≈ $0.00</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-slate-400">SOVA Rewards</p>
            <p className="text-2xl font-bold">0.00</p>
            <p className="text-sm text-slate-500">≈ $0.00</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400 mb-2">Recent Activity</p>
          <p className="text-sm text-slate-500">No recent transactions</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Get started with SovaBTC</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.map((action, index) => (
          <Link key={action.title} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg bg-gradient-to-r ${action.gradient} bg-opacity-10 border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer`}
            >
              <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {action.description}
              </p>
            </motion.div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

function StatsGrid() {
  const stats = [
    { label: "Total Value Locked", value: "$0.00", change: "+0.00%" },
    { label: "SovaBTC Supply", value: "0.00", change: "+0.00%" },
    { label: "Active Stakers", value: "0", change: "+0%" },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-defi-green-500">{stat.change}</p>
            </div>
          </CardContent>
        </Card>
      ))}
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
