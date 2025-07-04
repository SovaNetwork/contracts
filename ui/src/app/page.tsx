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
    transition: { duration: 0.5 }
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
