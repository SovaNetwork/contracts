'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Calendar, DollarSign, PieChart } from 'lucide-react'

interface StakingChartProps {
  className?: string
}

export default function StakingChart({ className }: StakingChartProps) {
  const [timeFrame, setTimeFrame] = useState('7d')

  // Mock data for demonstration
  const stakingData = {
    '7d': [
      { date: 'Mon', apy: 12.3, tvl: 2400000, rewards: 150 },
      { date: 'Tue', apy: 12.5, tvl: 2420000, rewards: 160 },
      { date: 'Wed', apy: 12.4, tvl: 2380000, rewards: 155 },
      { date: 'Thu', apy: 12.6, tvl: 2450000, rewards: 165 },
      { date: 'Fri', apy: 12.8, tvl: 2480000, rewards: 170 },
      { date: 'Sat', apy: 12.7, tvl: 2460000, rewards: 168 },
      { date: 'Sun', apy: 12.9, tvl: 2500000, rewards: 175 },
    ],
    '30d': [
      { date: 'Week 1', apy: 11.8, tvl: 2200000, rewards: 1200 },
      { date: 'Week 2', apy: 12.2, tvl: 2350000, rewards: 1350 },
      { date: 'Week 3', apy: 12.5, tvl: 2420000, rewards: 1420 },
      { date: 'Week 4', apy: 12.9, tvl: 2500000, rewards: 1500 },
    ],
    '90d': [
      { date: 'Month 1', apy: 10.5, tvl: 1800000, rewards: 4500 },
      { date: 'Month 2', apy: 11.8, tvl: 2200000, rewards: 5200 },
      { date: 'Month 3', apy: 12.9, tvl: 2500000, rewards: 6000 },
    ],
  }

  // Staking distribution data from ui-10.md
  const stakingDistribution = [
    { period: '1-30 days', percentage: 35, color: 'defi-purple-500' },
    { period: '30-90 days', percentage: 40, color: 'defi-pink-500' },
    { period: '90-180 days', percentage: 20, color: 'defi-blue-500' },
    { period: '180+ days', percentage: 5, color: 'defi-green-500' },
  ]

  const currentData = stakingData[timeFrame as keyof typeof stakingData]
  const maxTVL = Math.max(...currentData.map(d => d.tvl))
  const maxAPY = Math.max(...currentData.map(d => d.apy))
  const maxRewards = Math.max(...currentData.map(d => d.rewards))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={className}
    >
      <Card className="defi-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="gradient-text flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Staking Analytics
            </CardTitle>
            <div className="flex gap-1">
              {['7d', '30d', '90d'].map((period) => (
                <Button
                  key={period}
                  variant={timeFrame === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeFrame(period)}
                  className="h-8 px-3 text-xs"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="apy" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="apy" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                APY
              </TabsTrigger>
              <TabsTrigger value="tvl" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                TVL
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Distribution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apy" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">APY Trend</h4>
                  <div className="text-2xl font-bold text-defi-green-400">
                    {currentData[currentData.length - 1].apy.toFixed(1)}%
                  </div>
                </div>
                
                <div className="h-48 flex items-end gap-2">
                  {currentData.map((data, i) => {
                    const height = (data.apy / maxAPY) * 100
                    return (
                      <motion.div
                        key={data.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-defi-green-500 to-defi-green-400 rounded-t-md min-h-[20px] relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.apy.toFixed(1)}%
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                          {data.date}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tvl" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Total Value Locked</h4>
                  <div className="text-2xl font-bold text-defi-purple-400">
                    ${(currentData[currentData.length - 1].tvl / 1000000).toFixed(1)}M
                  </div>
                </div>
                
                <div className="h-48 flex items-end gap-2">
                  {currentData.map((data, i) => {
                    const height = (data.tvl / maxTVL) * 100
                    return (
                      <motion.div
                        key={data.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-defi-purple-500 to-defi-purple-400 rounded-t-md min-h-[20px] relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          ${(data.tvl / 1000000).toFixed(1)}M
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                          {data.date}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Rewards Distributed</h4>
                  <div className="text-2xl font-bold text-defi-pink-400">
                    {currentData[currentData.length - 1].rewards.toLocaleString()} SOVA
                  </div>
                </div>
                
                <div className="h-48 flex items-end gap-2">
                  {currentData.map((data, i) => {
                    const height = (data.rewards / maxRewards) * 100
                    return (
                      <motion.div
                        key={data.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-defi-pink-500 to-defi-pink-400 rounded-t-md min-h-[20px] relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.rewards.toLocaleString()}
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                          {data.date}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Staking Period Distribution
                </h4>
                
                {stakingDistribution.map((item, index) => (
                  <motion.div
                    key={item.period}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.period}</span>
                      <span className="font-medium text-white">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`bg-gradient-to-r from-${item.color} to-${item.color}/80 h-2 rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
                
                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Avg Period</p>
                    <p className="text-lg font-bold text-white">67 days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Total Stakers</p>
                    <p className="text-lg font-bold text-white">1,337</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Average APY</p>
              <p className="text-xl font-bold text-defi-green-400">
                {(currentData.reduce((acc, d) => acc + d.apy, 0) / currentData.length).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Peak TVL</p>
              <p className="text-xl font-bold text-defi-purple-400">
                ${(maxTVL / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Total Rewards</p>
              <p className="text-xl font-bold text-defi-pink-400">
                {currentData.reduce((acc, d) => acc + d.rewards, 0).toLocaleString()} SOVA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 