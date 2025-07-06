'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Clock,
  DollarSign,
  Activity
} from 'lucide-react'

export function UserManagement() {
  // Mock user data for demonstration
  const topUsers = [
    {
      address: '0x1234...5678',
      stakedAmount: '12.5',
      rewards: '0.24',
      joinDate: '2024-01-15',
      status: 'active',
      riskScore: 'low',
    },
    {
      address: '0x9876...4321',
      stakedAmount: '8.3',
      rewards: '0.18',
      joinDate: '2024-01-20',
      status: 'active',
      riskScore: 'low',
    },
    {
      address: '0xabcd...efgh',
      stakedAmount: '25.1',
      rewards: '0.52',
      joinDate: '2024-01-10',
      status: 'active',
      riskScore: 'medium',
    },
  ]

  const userStats = [
    { label: 'Total Users', value: '1,337', icon: Users, color: 'text-defi-blue-400' },
    { label: 'Active Stakers', value: '892', icon: Activity, color: 'text-defi-green-400' },
    { label: 'Avg Stake Size', value: '5.2 BTC', icon: DollarSign, color: 'text-defi-purple-400' },
    { label: 'Avg Stake Duration', value: '45 days', icon: Clock, color: 'text-defi-pink-400' },
  ]

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-2 gap-4">
        {userStats.map((stat, index) => (
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

      {/* Top Users */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top Stakers
        </h3>
        
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <motion.div
              key={user.address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="defi-card border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-purple-500 to-defi-pink-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{user.address}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              user.riskScore === 'low' 
                                ? 'text-defi-green-400 border-defi-green-500/30' 
                                : 'text-defi-yellow-400 border-defi-yellow-500/30'
                            }`}
                          >
                            {user.riskScore} risk
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-400">
                            Staked: {user.stakedAmount} BTC
                          </span>
                          <span className="text-sm text-slate-400">
                            Rewards: {user.rewards} SOVA
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* User Activity Summary */}
      <Card className="defi-card border-defi-blue-500/30 bg-defi-blue-500/5">
        <CardContent className="p-4">
          <h3 className="font-semibold text-white mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">New users (24h)</span>
              <span className="text-white font-medium">+23</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Active stakers (24h)</span>
              <span className="text-white font-medium">156</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total volume (24h)</span>
              <span className="text-white font-medium">$45,123</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 