'use client'

import { motion } from 'framer-motion'
import { useReadContract } from 'wagmi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Activity,
  Database
} from 'lucide-react'

import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { SOVABTC_ABI, SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'

export function ProtocolStats() {
  // Read protocol data
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC,
    abi: SOVABTC_ABI,
    functionName: 'totalSupply',
  })

  const { data: totalStaked } = useReadContract({
    address: CONTRACT_ADDRESSES[baseSepolia.id].STAKING,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'totalSupply',
  })

  const { data: rewardRate } = useReadContract({
    address: CONTRACT_ADDRESSES[baseSepolia.id].STAKING,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardRate',
  })

  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Value Locked',
      value: totalSupply && typeof totalSupply === 'bigint' ? `${formatUnits(totalSupply, 8)} BTC` : '0 BTC',
      usdValue: totalSupply && typeof totalSupply === 'bigint' ? `$${(Number(formatUnits(totalSupply, 8)) * 45000).toLocaleString()}` : '$0',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-defi-green-400',
      bgColor: 'bg-defi-green-500/20',
      borderColor: 'border-defi-green-500/30',
    },
    {
      title: 'Total Staked',
      value: totalStaked && typeof totalStaked === 'bigint' ? `${formatUnits(totalStaked, 8)} SovaBTC` : '0 SovaBTC',
      usdValue: totalStaked && typeof totalStaked === 'bigint' ? `$${(Number(formatUnits(totalStaked, 8)) * 45000).toLocaleString()}` : '$0',
      change: '+8.7%',
      trend: 'up',
      icon: Database,
      color: 'text-defi-blue-400',
      bgColor: 'bg-defi-blue-500/20',
      borderColor: 'border-defi-blue-500/30',
    },
    {
      title: 'Active Users',
      value: '1,337',
      usdValue: 'All time high',
      change: '+15.2%',
      trend: 'up',
      icon: Users,
      color: 'text-defi-purple-400',
      bgColor: 'bg-defi-purple-500/20',
      borderColor: 'border-defi-purple-500/30',
    },
    {
      title: 'Reward Rate',
      value: rewardRate && typeof rewardRate === 'bigint' ? `${formatUnits(rewardRate, 18)} SOVA/sec` : '0 SOVA/sec',
      usdValue: rewardRate && typeof rewardRate === 'bigint' ? `${(Number(formatUnits(rewardRate, 18)) * 86400).toFixed(2)} SOVA/day` : '0 SOVA/day',
      change: '+2.1%',
      trend: 'up',
      icon: Activity,
      color: 'text-defi-pink-400',
      bgColor: 'bg-defi-pink-500/20',
      borderColor: 'border-defi-pink-500/30',
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative"
        >
          <Card className={`defi-card ${stat.borderColor} ${stat.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">{stat.usdValue}</p>
                <Badge 
                  variant={stat.trend === 'up' ? 'default' : 'destructive'}
                  className={`${stat.trend === 'up' 
                    ? 'bg-defi-green-500/20 text-defi-green-400 border-defi-green-500/30' 
                    : 'bg-defi-red-500/20 text-defi-red-400 border-defi-red-500/30'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
} 