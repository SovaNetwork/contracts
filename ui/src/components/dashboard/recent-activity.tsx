'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ArrowUpDown, Coins, Timer, ExternalLink } from 'lucide-react'

const activityVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Mock activity data - replace with real data from your contracts
const activities = [
  {
    id: '1',
    type: 'wrap',
    amount: '0.5',
    token: 'WBTC',
    hash: '0x1234...5678',
    timestamp: '2 hours ago',
    status: 'completed',
  },
  {
    id: '2',
    type: 'stake',
    amount: '1.2',
    token: 'sovaBTC',
    hash: '0x2345...6789',
    timestamp: '5 hours ago',
    status: 'completed',
  },
  {
    id: '3',
    type: 'redeem',
    amount: '0.8',
    token: 'sovaBTC',
    hash: '0x3456...7890',
    timestamp: '1 day ago',
    status: 'pending',
  },
  {
    id: '4',
    type: 'claim',
    amount: '25.5',
    token: 'SOVA',
    hash: '0x4567...8901',
    timestamp: '2 days ago',
    status: 'completed',
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'wrap':
      return ArrowUpDown
    case 'stake':
      return Coins
    case 'redeem':
      return Timer
    case 'claim':
      return Activity
    default:
      return Activity
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'wrap':
      return 'from-defi-purple-400 to-defi-pink-400'
    case 'stake':
      return 'from-defi-blue-400 to-defi-purple-400'
    case 'redeem':
      return 'from-defi-pink-400 to-defi-blue-400'
    case 'claim':
      return 'from-defi-green-400 to-defi-blue-400'
    default:
      return 'from-slate-400 to-slate-600'
  }
}

export function RecentActivity() {
  return (
    <motion.div variants={activityVariants}>
      <Card className="defi-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-defi-green-500/20">
              <Activity className="h-5 w-5 text-defi-green-400" />
            </div>
            <span className="gradient-text">Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400">No recent activity</p>
              <p className="text-sm text-slate-500">Your transactions will appear here</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group cursor-pointer"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white capitalize">
                        {activity.type}
                      </p>
                      <div className={`px-2 py-0.5 rounded-full text-xs ${
                        activity.status === 'completed'
                          ? 'bg-defi-green-500/20 text-defi-green-400'
                          : 'bg-defi-blue-500/20 text-defi-blue-400'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {activity.amount} {activity.token} • {activity.timestamp}
                    </p>
                  </div>
                  
                  <motion.a
                    href={`https://sepolia.basescan.org/tx/${activity.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </motion.a>
                </motion.div>
              )
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 