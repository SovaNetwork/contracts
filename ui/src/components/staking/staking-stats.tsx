'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Lock, Zap } from 'lucide-react'

interface StakingStatsProps {
  className?: string
}

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut" as const
    },
  }),
}

export default function StakingStats({ className }: StakingStatsProps) {
  const stakingAddress = CONTRACT_ADDRESSES[84532].STAKING

  const {
    totalSupply,
    apy,
  } = useStakingData(stakingAddress)

  const totalStaked = totalSupply as bigint || BigInt(0)
  const totalStakedFormatted = formatTokenAmount(totalStaked, 8)
  const totalValueLocked = Number(totalStakedFormatted) * 45000 // Mock BTC price

  // Mock additional data - replace with real contract calls
  const additionalStats = {
    totalStakers: 1337,
    avgStakingPeriod: 45, // days
    totalRewardsDistributed: 125000,
  }

  const stats = [
    {
      title: 'Total Value Locked',
      value: `$${totalValueLocked.toLocaleString()}`,
      subValue: `${totalStakedFormatted} SovaBTC`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Lock,
      gradient: 'from-defi-green-400 to-defi-blue-400',
      color: 'text-defi-green-400',
      bgColor: 'bg-defi-green-500/20',
    },
    {
      title: 'Current APY',
      value: `${apy.toFixed(2)}%`,
      subValue: 'Annual Percentage Yield',
      change: '+0.8%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      gradient: 'from-defi-purple-400 to-defi-pink-400',
      color: 'text-defi-purple-400',
      bgColor: 'bg-defi-purple-500/20',
    },
    {
      title: 'Active Stakers',
      value: additionalStats.totalStakers.toLocaleString(),
      subValue: `${additionalStats.avgStakingPeriod}d avg period`,
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-defi-pink-400 to-defi-blue-400',
      color: 'text-defi-blue-400',
      bgColor: 'bg-defi-blue-500/20',
    },
    {
      title: 'Rewards Distributed',
      value: `${(additionalStats.totalRewardsDistributed / 1000).toFixed(0)}K SOVA`,
      subValue: `$${(additionalStats.totalRewardsDistributed * 0.1).toFixed(0)}`,
      change: '+18.3%',
      changeType: 'positive' as const,
      icon: Zap,
      gradient: 'from-defi-blue-400 to-defi-purple-400',
      color: 'text-defi-pink-400',
      bgColor: 'bg-defi-pink-500/20',
    },
  ]

  return (
    <motion.div
      variants={statsVariants}
      initial="hidden"
      animate="visible"
      className={`grid gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          custom={index}
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="defi-card border-white/20 hover:border-white/30 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.changeType === 'positive' 
                    ? 'bg-defi-green-500/20 text-defi-green-400' 
                    : 'bg-defi-red-500/20 text-defi-red-400'
                }`}>
                  {stat.change}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-white group-hover:gradient-text transition-all duration-200">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">
                  {stat.subValue}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
} 