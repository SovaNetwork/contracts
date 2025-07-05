'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, Users, Clock, Shield } from 'lucide-react'
import { formatUSD } from '@/lib/utils'

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function RedemptionStats() {
  // Mock data - replace with real contract data
  const stats = {
    totalInQueue: 1200000,
    avgWaitTime: '10 days',
    successRate: '99.8%',
    queueLength: 47,
  }

  return (
    <motion.div variants={statsVariants}>
      <Card className="defi-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-defi-purple-500/20">
              <TrendingDown className="h-5 w-5 text-defi-purple-400" />
            </div>
            <span className="text-lg font-semibold text-white">Queue Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total in Queue</span>
              <span className="text-sm font-semibold text-white">
                {formatUSD(stats.totalInQueue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Queue Length</span>
              <span className="text-sm font-semibold text-defi-blue-400">
                {stats.queueLength} requests
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Processing Time</span>
              <span className="text-sm font-semibold text-defi-purple-400">
                {stats.avgWaitTime}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Success Rate</span>
              <span className="text-sm font-semibold text-defi-green-400">
                {stats.successRate}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs text-defi-green-400">
              <Shield className="h-3 w-3" />
              <span>Protected by time-lock security</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-defi-blue-400">
              <Clock className="h-3 w-3" />
              <span>Automated fulfillment system</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-defi-purple-400">
              <Users className="h-3 w-3" />
              <span>Community-verified process</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 