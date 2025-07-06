'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Gift, 
  Loader2, 
  TrendingUp, 
  Clock,
  Target
} from 'lucide-react'

import { useClaimRewards } from '@/hooks/web3/use-claim-rewards'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

interface RewardsDisplayProps {
  className?: string
}

export default function RewardsDisplay({ className }: RewardsDisplayProps) {
  const { address, isConnected } = useAccount()
  const stakingAddress = CONTRACT_ADDRESSES[baseSepolia.id].STAKING
  const sovaTokenAddress = CONTRACT_ADDRESSES[baseSepolia.id].SOVA_TOKEN

  const {
    earnedRewards,
    dailyRewards,
    apy,
    stakedAmount,
    userShare,
    refetchEarned,
  } = useStakingData(stakingAddress)

  const sovaBalance = useTokenBalance(sovaTokenAddress)
  const { claimRewards, isPending: isClaiming, isConfirming } = useClaimRewards()

  const [rewardsGrowth, setRewardsGrowth] = useState(0)
  const [lastRewardsAmount, setLastRewardsAmount] = useState(BigInt(0))

  // Track rewards growth for animation
  useEffect(() => {
    const currentRewards = typeof earnedRewards === 'bigint' ? earnedRewards : BigInt(0)
    if (currentRewards > lastRewardsAmount) {
      const growth = Number(formatUnits(currentRewards - lastRewardsAmount, 18))
      setRewardsGrowth(growth)
      setLastRewardsAmount(currentRewards)
      
      // Reset growth animation after 3 seconds
      const timer = setTimeout(() => setRewardsGrowth(0), 3000)
      return () => clearTimeout(timer)
    }
  }, [earnedRewards, lastRewardsAmount])

  const handleClaim = async () => {
    if (!address) return
    try {
      await claimRewards(stakingAddress)
      refetchEarned()
    } catch (error) {
      console.error('Claim error:', error)
    }
  }

  if (!isConnected) {
    return (
      <Card className="defi-card">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-defi-purple-500/20 flex items-center justify-center">
            <Gift className="h-8 w-8 text-defi-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Rewards Center</h3>
          <p className="text-slate-400">
            Connect your wallet to view rewards
          </p>
        </CardContent>
      </Card>
    )
  }

  const rewardsAmount = typeof earnedRewards === 'bigint' ? earnedRewards : BigInt(0)
  const hasRewards = rewardsAmount > BigInt(0)
  const hasStaked = typeof stakedAmount === 'bigint' && stakedAmount > BigInt(0)
  const formattedRewards = formatTokenAmount(rewardsAmount, 18)
  const rewardsValue = Number(formattedRewards) * 0.1 // Mock SOVA price
  const sovaPrice = 0.1

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Rewards Card */}
      <Card className="defi-card border-defi-purple-500/30 bg-gradient-to-br from-defi-purple-500/10 to-defi-pink-500/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              animate={hasRewards ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 2, repeat: hasRewards ? Infinity : 0, repeatDelay: 3 }}
            >
              <Gift className="h-6 w-6 text-defi-purple-400" />
            </motion.div>
            <span className="gradient-text">Your Rewards</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Rewards */}
          <div className="text-center space-y-4">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <div className="text-4xl font-bold gradient-text">
                  {formattedRewards} SOVA
                </div>
                <div className="text-lg text-slate-400">
                  ≈ {formatUSD(rewardsValue)}
                </div>
              </motion.div>
              
              {/* Growth Animation */}
              <AnimatePresence>
                {rewardsGrowth > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -30, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-defi-green-400 font-semibold text-sm"
                  >
                    +{rewardsGrowth.toFixed(4)} SOVA
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Button
              onClick={handleClaim}
              disabled={!hasRewards || isClaiming || isConfirming}
              className="w-full h-12 defi-button bg-gradient-to-r from-defi-purple-600 to-defi-pink-600 hover:from-defi-purple-500 hover:to-defi-pink-500"
              size="lg"
            >
              {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isClaiming 
                ? 'Waiting for signature...'
                : isConfirming 
                ? 'Claiming rewards...'
                : hasRewards
                ? 'Claim Rewards'
                : 'No Rewards Yet'
              }
            </Button>
          </div>

          {/* Rewards Stats */}
          {hasStaked && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>Daily Rate</span>
                </div>
                <p className="text-lg font-semibold text-defi-green-400">
                  {dailyRewards.toFixed(4)} SOVA
                </p>
                <p className="text-xs text-slate-500">
                  {formatUSD(dailyRewards * sovaPrice)}
                </p>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>Current APY</span>
                </div>
                <p className="text-lg font-semibold text-defi-purple-400">
                  {apy.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500">
                  Variable rate
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOVA Balance Card */}
      <Card className="defi-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-defi-purple-400 to-defi-pink-400 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            SOVA Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Balance</span>
            <div className="text-right">
              <div className="font-semibold text-white">
                {sovaBalance.isLoading ? (
                  <span className="shimmer w-20 h-4 rounded inline-block"></span>
                ) : (
                  `${formatTokenAmount(sovaBalance.balance, 18)} SOVA`
                )}
              </div>
              <div className="text-sm text-slate-400">
                {formatUSD(Number(sovaBalance.formattedBalance) * sovaPrice)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Pending Rewards</span>
            <div className="text-right">
              <div className="font-semibold text-defi-purple-400">
                {formattedRewards} SOVA
              </div>
              <div className="text-sm text-slate-400">
                {formatUSD(rewardsValue)}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Total Value</span>
              <div className="text-right">
                <div className="font-bold text-white text-lg">
                  {formatUSD((Number(sovaBalance.formattedBalance) + Number(formattedRewards)) * sovaPrice)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staking Overview */}
      <Card className="defi-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-defi-blue-400" />
            Staking Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Your Stake</span>
              <span className="font-medium text-white">
                {formatTokenAmount(typeof stakedAmount === 'bigint' ? stakedAmount : BigInt(0), 8)} SovaBTC
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pool Share</span>
              <span className="font-medium text-defi-blue-400">
                {userShare.toFixed(3)}%
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Stake Value</span>
              <span className="font-medium text-white">
                {formatUSD(Number(formatUnits(typeof stakedAmount === 'bigint' ? stakedAmount : BigInt(0), 8)) * 45000)}
              </span>
            </div>
          </div>
          
          {hasStaked && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Rewards Progress</span>
                <span>Daily target: {dailyRewards.toFixed(4)} SOVA</span>
              </div>
              <Progress 
                value={Math.min(100, (Number(formattedRewards) / dailyRewards) * 100)} 
                className="h-2 bg-slate-800"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 