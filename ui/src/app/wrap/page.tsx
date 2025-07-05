'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { WrapStats } from '@/components/wrap/wrap-stats'
import { RecentActivity } from '@/components/wrap/recent-activity'
import { ArrowUpDown } from 'lucide-react'

// Dynamically import components that use wagmi hooks to prevent SSR issues
const DepositForm = dynamic(() => import('@/components/wrap/deposit-form').then(mod => ({ default: mod.DepositForm })), {
  ssr: false,
  loading: () => <DepositFormSkeleton />
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
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
}

export default function WrapPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
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
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-xl bg-defi-purple-500/20 border border-defi-purple-500/30"
            >
              <ArrowUpDown className="h-8 w-8 text-defi-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Wrap Tokens</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Deposit BTC-pegged tokens to mint SovaBTC. 1:1 satoshi conversion with transparent reserves.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="defi-card p-8">
              <Suspense fallback={<DepositFormSkeleton />}>
                <DepositForm />
              </Suspense>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-6">
            <Suspense fallback={<WrapStatsSkeleton />}>
              <WrapStats />
            </Suspense>
            
            <Suspense fallback={<RecentActivitySkeleton />}>
              <RecentActivity />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function DepositFormSkeleton() {
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

function WrapStatsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-24 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
            <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-700/50 rounded-full shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 bg-slate-700/50 rounded shimmer" />
              <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}