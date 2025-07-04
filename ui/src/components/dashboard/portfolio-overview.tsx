'use client'

import { motion } from 'framer-motion'

export function PortfolioOverview() {
  return (
    <motion.div 
      className="defi-card p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Portfolio Overview</h2>
        <p className="text-sm text-slate-400">Last updated: Just now</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Total SovaBTC Balance</p>
          <p className="text-3xl font-bold text-white">0.00000000</p>
          <p className="text-sm text-slate-500">≈ $0.00 USD</p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Staked Balance</p>
          <p className="text-3xl font-bold text-defi-purple-400">0.00000000</p>
          <p className="text-sm text-defi-green-500">+0.00% APY</p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          Connect your wallet to view your portfolio
        </p>
      </div>
    </motion.div>
  )
}