'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, ArrowUpRight, ArrowDownLeft, TrendingUp, Gift, Clock } from 'lucide-react'
import { useAccount } from 'wagmi'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface ActivityItem {
  id: string
  type: 'wrap' | 'stake' | 'unstake' | 'claim' | 'redeem'
  amount: string
  token: string
  txHash: string
  timestamp: number
  status: 'completed' | 'pending' | 'failed'
}

export default function RecentActivity() {
  useAccount()
  const activities: ActivityItem[] = []

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'wrap':
        return ArrowUpRight
      case 'stake':
        return TrendingUp
      case 'unstake':
        return ArrowDownLeft
      case 'claim':
        return Gift
      case 'redeem':
        return ArrowDownLeft
      default:
        return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'wrap':
        return 'bitcoin'
      case 'stake':
        return 'emerald'
      case 'unstake':
        return 'neon'
      case 'claim':
        return 'bitcoin'
      case 'redeem':
        return 'neon'
      default:
        return 'bitcoin'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'wrap':
        return 'Wrapped'
      case 'stake':
        return 'Staked'
      case 'unstake':
        return 'Unstaked'
      case 'claim':
        return 'Claimed'
      case 'redeem':
        return 'Redeemed'
      default:
        return 'Activity'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-badge-success'
      case 'pending':
        return 'status-badge-warning'
      case 'failed':
        return 'status-badge-error'
      default:
        return 'status-badge-info'
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }


  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      <Card className="neo-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-obsidian-50">Recent Activity</CardTitle>
            <Badge className="status-badge-info">
              Last 7 days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <motion.div variants={fadeInUp} className="text-center py-8">
              <Clock className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
              <p className="text-obsidian-400 mb-2">No recent activity</p>
              <p className="text-sm text-obsidian-500">Start by wrapping some Bitcoin to see your activity here</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                const color = getActivityColor(activity.type)
                
                return (
                  <motion.div 
                    key={activity.id} 
                    variants={fadeInUp}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-obsidian-800/30 transition-colors group"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${
                      color === 'bitcoin' ? 'from-bitcoin-500/20 to-bitcoin-600/20' :
                      color === 'neon' ? 'from-neon-500/20 to-neon-600/20' :
                      color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                      'from-bitcoin-500/20 to-bitcoin-600/20'
                    } group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${
                        color === 'bitcoin' ? 'text-bitcoin-400' :
                        color === 'neon' ? 'text-neon-400' :
                        color === 'emerald' ? 'text-emerald-400' :
                        'text-bitcoin-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-obsidian-50">
                          {getActivityLabel(activity.type)} {activity.amount} {activity.token}
                        </span>
                        <Badge className={getStatusBadge(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-obsidian-500">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-obsidian-700/50"
                      onClick={() => window.open(`https://sepolia.basescan.org/tx/${activity.txHash}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 text-obsidian-400" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}