'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatUSD, formatTokenAmount } from '@/lib/utils'
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react'
import { baseSepolia } from 'viem/chains'
import { formatUnits } from 'viem'

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

export default function StatsOverview() {
  const stakingData = useStakingData(CONTRACT_ADDRESSES[baseSepolia.id].STAKING)
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC)

  const statCards = [
    {
      title: "Total Value Locked",
      value: stakingData.totalSupply,
      format: (val: bigint) => formatUSD(Number(formatUnits(val, 8)) * 45000), // Assuming ~$45k per BTC
      icon: DollarSign,
      color: "bitcoin",
      trend: "+12.5%",
      description: "Across all protocols"
    },
    {
      title: "Total SovaBTC Supply",
      value: stakingData.totalSupply,
      format: (val: bigint) => formatTokenAmount(val, 8) + " SovaBTC",
      icon: Zap,
      color: "neon",
      trend: "+8.3%",
      description: "Bitcoin wrapped"
    },
    {
      title: "Current APY",
      value: BigInt(Math.floor(stakingData.apy * 100)),
      format: (val: bigint) => `${(Number(val) / 100).toFixed(2)}%`,
      icon: TrendingUp,
      color: "emerald",
      trend: "+2.1%",
      description: "Staking rewards"
    },
    {
      title: "Your SovaBTC Balance",
      value: sovaBTCBalance.balance,
      format: (val: bigint) => formatTokenAmount(val, 8) + " SovaBTC",
      icon: Users,
      color: "bitcoin",
      trend: "0%",
      description: "Available to stake"
    }
  ]

  if (sovaBTCBalance.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="neo-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-obsidian-700/50 rounded shimmer" />
                  <div className="h-8 w-8 bg-obsidian-700/50 rounded-lg shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-32 bg-obsidian-700/50 rounded shimmer" />
                  <div className="h-3 w-20 bg-obsidian-700/50 rounded shimmer" />
                </div>
                <div className="h-3 w-28 bg-obsidian-700/50 rounded shimmer" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      {statCards.map((stat) => (
        <motion.div key={stat.title} variants={fadeInUp}>
          <Card className="neo-card group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-obsidian-400 font-medium">{stat.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-obsidian-50">
                      {stat.format(stat.value)}
                    </span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  stat.color === 'bitcoin' ? 'from-bitcoin-500/20 to-bitcoin-600/20' :
                  stat.color === 'neon' ? 'from-neon-500/20 to-neon-600/20' :
                  stat.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                  'from-bitcoin-500/20 to-bitcoin-600/20'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'bitcoin' ? 'text-bitcoin-400' :
                    stat.color === 'neon' ? 'text-neon-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    'text-bitcoin-400'
                  }`} />
                </div>
              </div>
              <p className="text-sm text-obsidian-400">{stat.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}