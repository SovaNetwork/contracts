'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Coins, TrendingUp } from 'lucide-react'

// Dynamic imports to avoid SSR issues
const StakingForm = dynamic(() => import('@/components/staking/staking-form'), {
  ssr: false,
  loading: () => <StakingFormSkeleton />,
})

const StakingStats = dynamic(() => import('@/components/staking/staking-stats'), {
  ssr: false,
  loading: () => <StakingStatsSkeleton />,
})

const RewardsDisplay = dynamic(() => import('@/components/staking/rewards-display'), {
  ssr: false,
  loading: () => <RewardsSkeleton />,
})

const StakingChart = dynamic(() => import('@/components/staking/staking-chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

// Skeleton components
function StakingFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-32 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function StakingStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="defi-card p-6 space-y-3">
          <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-24 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
        </div>
      ))}
    </div>
  )
}

function RewardsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-24 bg-slate-700/50 rounded shimmer" />
      <div className="h-16 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-64 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

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

export default function StakePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-xl bg-defi-purple-500/20 border border-defi-purple-500/30"
            >
              <Coins className="h-8 w-8 text-defi-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Stake & Earn</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Stake your SovaBTC to earn SOVA rewards. Higher APY with longer commitments.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-defi-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span>Real-time APY calculations • Auto-compounding available</span>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<StakingStatsSkeleton />}>
            <StakingStats />
          </Suspense>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="defi-card p-8">
              <Suspense fallback={<StakingFormSkeleton />}>
                <StakingForm />
              </Suspense>
            </div>
            
            <div className="defi-card p-8">
              <Suspense fallback={<ChartSkeleton />}>
                <StakingChart />
              </Suspense>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Suspense fallback={<RewardsSkeleton />}>
              <RewardsDisplay />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}