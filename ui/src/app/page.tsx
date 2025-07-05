'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Shield, Zap, Coins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PortfolioOverview = dynamic(() => import('@/components/dashboard/portfolio-overview').then(mod => ({ default: mod.PortfolioOverview })), {
  ssr: false,
  loading: () => <PortfolioSkeleton />
})

const QuickActions = dynamic(() => import('@/components/dashboard/quick-actions').then(mod => ({ default: mod.QuickActions })), {
  ssr: false,
  loading: () => <QuickActionsSkeleton />
})

const StatsGrid = dynamic(() => import('@/components/dashboard/stats-grid').then(mod => ({ default: mod.StatsGrid })), {
  ssr: false,
  loading: () => <StatsGridSkeleton />
})

const RecentActivity = dynamic(() => import('@/components/dashboard/recent-activity').then(mod => ({ default: mod.RecentActivity })), {
  ssr: false,
  loading: () => <ActivitySkeleton />
})

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
          <StatsGrid />
        </motion.div>

        {/* Main Dashboard */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PortfolioOverview />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <RecentActivity />
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
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

function QuickActionsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-slate-700/50 rounded-lg shimmer" />
        <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 bg-slate-700/50 rounded-lg shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-slate-700/50 rounded shimmer" />
                <div className="h-3 w-32 bg-slate-700/50 rounded shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-slate-700/50 rounded-lg shimmer" />
        <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 bg-slate-700/50 rounded-lg shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
              <div className="h-3 w-32 bg-slate-700/50 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
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
