'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Timer, Clock } from 'lucide-react'

const RedemptionForm = dynamic(() => import('@/components/redeem/redemption-form').then(mod => ({ default: mod.RedemptionForm })), {
  ssr: false,
  loading: () => <RedemptionFormSkeleton />
})

const QueueStatus = dynamic(() => import('@/components/redeem/queue-status').then(mod => ({ default: mod.QueueStatus })), {
  ssr: false,
  loading: () => <QueueStatusSkeleton />
})

const RedemptionStats = dynamic(() => import('@/components/redeem/redemption-stats').then(mod => ({ default: mod.RedemptionStats })), {
  ssr: false,
  loading: () => <RedemptionStatsSkeleton />
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

export default function RedeemPage() {
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
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-xl bg-defi-blue-500/20 border border-defi-blue-500/30"
            >
              <Timer className="h-8 w-8 text-defi-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Redemption Queue</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Queue your SovaBTC for redemption with a secure 10-day processing period.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-defi-blue-400">
            <Clock className="h-4 w-4" />
            <span>10-day security delay • Transparent processing</span>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="defi-card p-8">
              <RedemptionForm />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-6">
            <QueueStatus />
            <RedemptionStats />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function RedemptionFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 bg-slate-700/50 rounded shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-24 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function QueueStatusSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-32 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function RedemptionStatsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-28 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
            <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}