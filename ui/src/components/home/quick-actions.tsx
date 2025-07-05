'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, ArrowDownUp, Gift, ArrowUpRight, Timer } from 'lucide-react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { useRedemptionStatus } from '@/hooks/web3/use-redemption-status'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { baseSepolia } from 'viem/chains'
import { formatTokenAmount } from '@/lib/utils'

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

export default function QuickActions() {
  const { address } = useAccount()
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC)
  const stakingData = useStakingData(CONTRACT_ADDRESSES[baseSepolia.id].STAKING)
  const redemptionStatus = useRedemptionStatus(CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE)

  const actions = [
    {
      title: "Wrap Bitcoin",
      description: "Convert your Bitcoin to SovaBTC",
      icon: Zap,
      color: "bitcoin",
      href: "/wrap",
      badge: "Start Here",
      badgeColor: "status-badge-success",
      available: true,
      stats: "Multiple tokens supported"
    },
    {
      title: "Stake SovaBTC",
      description: "Earn SOVA rewards by staking",
      icon: TrendingUp,
      color: "emerald",
      href: "/stake",
      badge: `${stakingData.apy.toFixed(2)}% APY`,
      badgeColor: "status-badge-success",
      available: sovaBTCBalance.balance > BigInt(0),
      stats: formatTokenAmount(sovaBTCBalance.balance, 8) + " SovaBTC available"
    },
    {
      title: "Redeem Bitcoin",
      description: "Convert SovaBTC back to Bitcoin",
      icon: ArrowDownUp,
      color: "neon",
      href: "/redeem",
      badge: redemptionStatus.queueData.isActive ? "Active" : "Ready",
      badgeColor: redemptionStatus.queueData.isActive ? "status-badge-warning" : "status-badge-info",
      available: sovaBTCBalance.balance > BigInt(0),
      stats: redemptionStatus.queueData.isActive ? "Queue active" : "No queue"
    },
    {
      title: "Claim Rewards",
      description: "Claim your SOVA staking rewards",
      icon: Gift,
      color: "bitcoin",
      href: "/stake",
      badge: "Rewards Available",
      badgeColor: "status-badge-success",
      available: stakingData.earnedRewards > BigInt(0),
      stats: formatTokenAmount(stakingData.earnedRewards, 18) + " SOVA earned"
    }
  ]

  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      {actions.map((action, index) => (
        <motion.div key={action.title} variants={fadeInUp}>
          <Card className="neo-card group h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  action.color === 'bitcoin' ? 'from-bitcoin-500/20 to-bitcoin-600/20' :
                  action.color === 'neon' ? 'from-neon-500/20 to-neon-600/20' :
                  action.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                  'from-bitcoin-500/20 to-bitcoin-600/20'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className={`w-6 h-6 ${
                    action.color === 'bitcoin' ? 'text-bitcoin-400' :
                    action.color === 'neon' ? 'text-neon-400' :
                    action.color === 'emerald' ? 'text-emerald-400' :
                    'text-bitcoin-400'
                  }`} />
                </div>
                <Badge className={action.badgeColor}>
                  {action.badge}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-obsidian-50">
                {action.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-obsidian-400 mb-4 leading-relaxed">
                {action.description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-obsidian-500">Status</span>
                  <span className={`font-medium ${action.available ? 'text-emerald-400' : 'text-obsidian-400'}`}>
                    {action.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-xs text-obsidian-500">
                  {action.stats}
                </div>
                <Button 
                  asChild 
                  className="neo-button w-full h-10 text-sm"
                  disabled={!action.available}
                >
                  <Link href={action.href}>
                    {action.title}
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}