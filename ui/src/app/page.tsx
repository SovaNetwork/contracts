'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { TrendingUp, Shield, Zap, Coins } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  visible: { y: 0, opacity: 1 }
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
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Link href="/wrap">
              <Button size="lg" className="bg-defi-purple-500 hover:bg-defi-purple-600 text-white px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline" size="lg" className="border-defi-purple-500/30 text-defi-purple-300 hover:bg-defi-purple-500/10 px-8 py-3 text-lg">
                View Portfolio
              </Button>
            </Link>
          </motion.div>
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

function StatsGrid() {
  const stats = [
    { label: "Total Value Locked", value: "$0.00", change: "+0.00%" },
    { label: "Total Supply", value: "0 sovaBTC", change: "+0.00%" },
    { label: "Staking APR", value: "0.00%", change: "+0.00%" },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="defi-card p-6 space-y-4"
        >
          <div className="text-sm text-slate-400">{stat.label}</div>
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-defi-green-500">{stat.change}</div>
        </motion.div>
      ))}
    </div>
  )
}

function PortfolioOverview() {
  return (
    <Card className="defi-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl text-white">Portfolio Overview</CardTitle>
        <div className="text-sm text-slate-400">Balance: $0.00</div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-sm text-slate-400">sovaBTC Balance</div>
          <div className="text-2xl font-bold text-white">0.00000000</div>
          <div className="text-xs text-slate-500">~$0.00 USD</div>
        </div>
        <div className="space-y-3">
          <div className="text-sm text-slate-400">SOVA Rewards</div>
          <div className="text-2xl font-bold text-white">0.00000000</div>
          <div className="text-xs text-slate-500">~$0.00 USD</div>
        </div>
      </div>
      <div className="pt-4 border-t border-white/10">
        <div className="text-sm text-slate-400 mb-2">Recent Activity</div>
        <div className="text-slate-500 text-center py-8">
          No transactions yet. Start by wrapping your Bitcoin!
        </div>
      </div>
    </Card>
  )
}

function QuickActions() {
  const actions = [
    { name: "Wrap Bitcoin", href: "/wrap", description: "Convert BTC to sovaBTC" },
    { name: "Stake SOVA", href: "/stake", description: "Earn rewards on SOVA tokens" },
    { name: "Redeem BTC", href: "/redeem", description: "Convert sovaBTC back to BTC" },
  ]

  return (
    <Card className="defi-card p-6 space-y-4">
      <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link key={action.name} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg border border-white/10 hover:border-defi-purple-500/30 hover:bg-defi-purple-500/5 transition-all duration-200 group"
            >
              <div className="text-sm font-medium text-white group-hover:text-defi-purple-300 transition-colors">
                {action.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">{action.description}</div>
            </motion.div>
          </Link>
        ))}
      </div>
    </Card>
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
