'use client'

import { motion } from 'framer-motion'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function RecentActivity() {
  // Mock data - in real app this would come from blockchain events
  const activities = [
    {
      id: '1',
      type: 'wrap',
      amount: '0.05000000',
      token: 'WBTC',
      hash: '0x1234...5678',
      timestamp: '2 mins ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'wrap',
      amount: '0.10000000',
      token: 'LBTC',
      hash: '0x2345...6789',
      timestamp: '1 hour ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'wrap',
      amount: '0.25000000',
      token: 'WBTC',
      hash: '0x3456...7890',
      timestamp: '3 hours ago',
      status: 'completed'
    }
  ]

  return (
    <Card className="defi-card">
      <CardHeader>
        <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent wrap activity</p>
            <p className="text-sm mt-1">Your wraps will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-defi-purple-500/20 flex items-center justify-center">
                    <ArrowUpDown className="h-4 w-4 text-defi-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Wrap {activity.amount} {activity.token}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-defi-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-defi-purple-400 hover:text-defi-purple-300"
                    onClick={() => window.open(`https://sepolia.basescan.org/tx/${activity.hash}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 