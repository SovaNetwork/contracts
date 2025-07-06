'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Timer,
  TrendingUp
} from 'lucide-react'

export function RedemptionManagement() {
  // Mock redemption data
  const queueStats = [
    { label: 'Queue Length', value: '23', icon: Users, color: 'text-defi-blue-400' },
    { label: 'Total Value', value: '45.2 BTC', icon: DollarSign, color: 'text-defi-green-400' },
    { label: 'Avg Wait Time', value: '8.5 days', icon: Timer, color: 'text-defi-purple-400' },
    { label: 'Success Rate', value: '99.8%', icon: TrendingUp, color: 'text-defi-pink-400' },
  ]

  const pendingRedemptions = [
    {
      id: '1',
      user: '0x1234...5678',
      amount: '5.0',
      token: 'WBTC',
      requestDate: '2024-01-20',
      completionDate: '2024-01-30',
      status: 'pending',
      daysLeft: 3,
    },
    {
      id: '2',
      user: '0x9876...4321', 
      amount: '2.5',
      token: 'LBTC',
      requestDate: '2024-01-18',
      completionDate: '2024-01-28',
      status: 'ready',
      daysLeft: 0,
    },
    {
      id: '3',
      user: '0xabcd...efgh',
      amount: '8.1',
      token: 'USDC',
      requestDate: '2024-01-22',
      completionDate: '2024-02-01',
      status: 'pending',
      daysLeft: 5,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-2 gap-4">
        {queueStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="defi-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-lg font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Redemptions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending Redemptions
        </h3>
        
        <div className="space-y-3">
          {pendingRedemptions.map((redemption, index) => (
            <motion.div
              key={redemption.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="defi-card border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-blue-500 to-defi-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {redemption.token[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{redemption.user}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              redemption.status === 'ready' 
                                ? 'text-defi-green-400 border-defi-green-500/30' 
                                : 'text-defi-blue-400 border-defi-blue-500/30'
                            }`}
                          >
                            {redemption.status === 'ready' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {redemption.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-400">
                            Amount: {redemption.amount} {redemption.token}
                          </span>
                          <span className="text-sm text-slate-400">
                            {redemption.status === 'ready' 
                              ? 'Ready for fulfillment' 
                              : `${redemption.daysLeft} days remaining`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {redemption.status === 'ready' ? (
                        <Button size="sm" className="bg-defi-green-600 hover:bg-defi-green-700">
                          Fulfill
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Pending
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Queue Health */}
      <Card className="defi-card border-defi-green-500/30 bg-defi-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-defi-green-400" />
            <h3 className="font-semibold text-white">Queue Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Processing normally</span>
              <span className="text-defi-green-400 font-medium">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Average processing time</span>
              <span className="text-white font-medium">8.5 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Failed redemptions (30d)</span>
              <span className="text-white font-medium">0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 