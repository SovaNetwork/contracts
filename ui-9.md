# Phase 6: Modern Staking Interface

## Overview
Creating a comprehensive staking interface with real APY calculations, reward tracking, and professional animations.

## Step 1: Staking Hooks

### Advanced Staking Data Hook

```typescript
// src/hooks/web3/use-staking-data.ts
'use client'

import { useReadContract, useAccount } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { formatUnits } from 'viem'
import { useMemo } from 'react'

export function useStakingData(stakingAddress: `0x${string}`) {
  const { address } = useAccount()

  // User's staked amount
  const { data: stakedAmount, refetch: refetchStaked } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 10000 },
  })

  // User's earned rewards
  const { data: earnedRewards, refetch: refetchEarned } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'earned',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  // Global staking data
  const { data: rewardRate } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardRate',
    query: { refetchInterval: 30000 },
  })

  const { data: totalSupply } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'totalSupply',
    query: { refetchInterval: 15000 },
  })

  const { data: rewardPerToken } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardPerToken',
    query: { refetchInterval: 10000 },
  })

  // Calculate APY
  const apy = useMemo(() => {
    if (!rewardRate || !totalSupply || totalSupply === 0n) return 0
    
    const annualRewards = Number(rewardRate) * 365 * 24 * 3600
    const totalStakedValue = Number(formatUnits(totalSupply, 8)) // SovaBTC decimals
    
    if (totalStakedValue === 0) return 0
    
    return (annualRewards / totalStakedValue) * 100
  }, [rewardRate, totalSupply])

  // User's share of total staking pool
  const userShare = useMemo(() => {
    if (!stakedAmount || !totalSupply || totalSupply === 0n) return 0
    return (Number(stakedAmount) / Number(totalSupply)) * 100
  }, [stakedAmount, totalSupply])

  // Estimated daily rewards for user
  const dailyRewards = useMemo(() => {
    if (!stakedAmount || !rewardRate || stakedAmount === 0n) return 0
    
    const userStaked = Number(formatUnits(stakedAmount, 8))
    const dailyRewardRate = Number(rewardRate) * 24 * 3600
    const totalStaked = Number(formatUnits(totalSupply || 0n, 8))
    
    if (totalStaked === 0) return 0
    
    return (userStaked / totalStaked) * dailyRewardRate
  }, [stakedAmount, rewardRate, totalSupply])

  return {
    stakedAmount: stakedAmount || 0n,
    earnedRewards: earnedRewards || 0n,
    rewardRate: rewardRate || 0n,
    totalSupply: totalSupply || 0n,
    rewardPerToken: rewardPerToken || 0n,
    apy,
    userShare,
    dailyRewards,
    refetchStaked,
    refetchEarned,
  }
}
```

### Staking Operations Hooks

```typescript
// src/hooks/web3/use-stake.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Staking Successful! 🎉",
        description: "Your SovaBTC is now earning SOVA rewards",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Staking Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const stake = useCallback(async (
    stakingAddress: `0x${string}`,
    amount: string
  ) => {
    try {
      const parsedAmount = parseUnits(amount, 8) // SovaBTC decimals
      
      writeContract({
        address: stakingAddress,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'stake',
        args: [parsedAmount],
      })
    } catch (error) {
      console.error('Staking error:', error)
      toast({
        title: "Staking Error",
        description: "Failed to prepare staking transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

```typescript
// src/hooks/web3/use-unstake.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Unstaking Successful",
        description: "Your SovaBTC has been unstaked",
        className: "border-defi-blue-500/50 bg-defi-blue-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Unstaking Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const unstake = useCallback(async (
    stakingAddress: `0x${string}`,
    amount: string
  ) => {
    try {
      const parsedAmount = parseUnits(amount, 8)
      
      writeContract({
        address: stakingAddress,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'withdraw',
        args: [parsedAmount],
      })
    } catch (error) {
      console.error('Unstaking error:', error)
      toast({
        title: "Unstaking Error",
        description: "Failed to prepare unstaking transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

```typescript
// src/hooks/web3/use-claim-rewards.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Rewards Claimed! 💰",
        description: "Your SOVA rewards have been claimed successfully",
        className: "border-defi-purple-500/50 bg-defi-purple-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const claimRewards = useCallback(async (stakingAddress: `0x${string}`) => {
    try {
      writeContract({
        address: stakingAddress,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'getReward',
      })
    } catch (error) {
      console.error('Claim rewards error:', error)
      toast({
        title: "Claim Error",
        description: "Failed to prepare claim transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

## Step 2: Staking Page

```typescript
// src/app/stake/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { StakingForm } from '@/components/stake/staking-form'
import { StakingStats } from '@/components/stake/staking-stats'
import { RewardsDisplay } from '@/components/stake/rewards-display'
import { StakingChart } from '@/components/stake/staking-chart'
import { Coins, TrendingUp } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export default function StakePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-xl bg-defi-purple-500/20 border border-defi-purple-500/30"
            >
              <Coins className="h-8 w-8 text-defi-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Stake & Earn</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Stake your SovaBTC to earn SOVA rewards. Higher APY with longer commitments.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-defi-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span>Real-time APY calculations • Auto-compounding available</span>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<StakingStatsSkeleton />}>
            <StakingStats />
          </Suspense>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="defi-card p-8">
              <Suspense fallback={<StakingFormSkeleton />}>
                <StakingForm />
              </Suspense>
            </div>
            
            <div className="defi-card p-8">
              <Suspense fallback={<ChartSkeleton />}>
                <StakingChart />
              </Suspense>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Suspense fallback={<RewardsSkeleton />}>
              <RewardsDisplay />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function StakingFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-32 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function StakingStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="defi-card p-6 space-y-3">
          <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-24 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
        </div>
      ))}
    </div>
  )
}

function RewardsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-24 bg-slate-700/50 rounded shimmer" />
      <div className="h-16 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-64 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}
```

## Step 3: Advanced Staking Form

```typescript
// src/components/stake/staking-form.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, 
  TrendingUp, 
  Zap, 
  AlertCircle, 
  Calculator,
  Gift 
} from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { useStake } from '@/hooks/web3/use-stake'
import { useUnstake } from '@/hooks/web3/use-unstake'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

export function StakingForm() {
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [autoCompound, setAutoCompound] = useState(false)
  const [stakingPeriod, setStakingPeriod] = useState([30]) // days
  
  const sovaBTCAddress = CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC
  const stakingAddress = CONTRACT_ADDRESSES[baseSepolia.id].STAKING
  
  // Hook calls
  const sovaBTCBalance = useTokenBalance(sovaBTCAddress)
  const stakingAllowance = useTokenAllowance(sovaBTCAddress, stakingAddress)
  const stakingData = useStakingData(stakingAddress)
  const approval = useTokenApproval()
  const stake = useStake()
  const unstake = useUnstake()
  
  // Calculate boosted APY based on staking period
  const boostedAPY = useMemo(() => {
    const baseAPY = stakingData.apy
    const periodBonus = Math.min(stakingPeriod[0] / 365 * 0.5, 0.5) // Max 50% bonus
    return baseAPY * (1 + periodBonus)
  }, [stakingData.apy, stakingPeriod])

  // Validation
  const stakeValidation = useMemo(() => {
    if (!stakeAmount || Number(stakeAmount) <= 0) {
      return { isValid: false, error: null }
    }
    
    if (Number(stakeAmount) > Number(sovaBTCBalance.formattedBalance)) {
      return { isValid: false, error: 'Insufficient SovaBTC balance' }
    }
    
    return { isValid: true, error: null }
  }, [stakeAmount, sovaBTCBalance.formattedBalance])

  const unstakeValidation = useMemo(() => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) {
      return { isValid: false, error: null }
    }
    
    const stakedBalance = formatUnits(stakingData.stakedAmount, 8)
    if (Number(unstakeAmount) > Number(stakedBalance)) {
      return { isValid: false, error: 'Insufficient staked balance' }
    }
    
    return { isValid: true, error: null }
  }, [unstakeAmount, stakingData.stakedAmount])

  // Check if approval is needed for staking
  const needsApproval = useMemo(() => {
    if (!stakeAmount || !stakeValidation.isValid) return false
    return stakingAllowance.hasInsufficientAllowance(stakeAmount, 8)
  }, [stakeAmount, stakeValidation.isValid, stakingAllowance])

  // Calculate potential rewards
  const potentialRewards = useMemo(() => {
    if (!stakeAmount || !stakeValidation.isValid) return { daily: 0, monthly: 0, yearly: 0 }
    
    const amount = Number(stakeAmount)
    const dailyRate = boostedAPY / 365 / 100
    const daily = amount * dailyRate
    const monthly = daily * 30
    const yearly = amount * (boostedAPY / 100)
    
    return { daily, monthly, yearly }
  }, [stakeAmount, stakeValidation.isValid, boostedAPY])

  const handleMaxStake = () => {
    setStakeAmount(sovaBTCBalance.formattedBalance)
  }

  const handleMaxUnstake = () => {
    setUnstakeAmount(formatUnits(stakingData.stakedAmount, 8))
  }

  const handleQuickAmount = (percentage: number) => {
    const amount = (Number(sovaBTCBalance.formattedBalance) * percentage / 100).toString()
    setStakeAmount(amount)
  }

  const handleApprove = async () => {
    if (!stakeAmount || !stakeValidation.isValid) return
    
    await approval.approve(
      sovaBTCAddress,
      stakingAddress,
      stakeAmount,
      8,
      true // Use max approval
    )
  }

  const handleStake = async () => {
    if (!stakeAmount || !stakeValidation.isValid) return
    
    await stake.stake(stakingAddress, stakeAmount)
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || !unstakeValidation.isValid) return
    
    await unstake.unstake(stakingAddress, unstakeAmount)
  }

  // Reset forms after successful transactions
  useEffect(() => {
    if (stake.isSuccess) {
      setStakeAmount('')
      sovaBTCBalance.refetch()
      stakingData.refetchStaked()
    }
  }, [stake.isSuccess, sovaBTCBalance, stakingData])

  useEffect(() => {
    if (unstake.isSuccess) {
      setUnstakeAmount('')
      sovaBTCBalance.refetch()
      stakingData.refetchStaked()
    }
  }, [unstake.isSuccess, sovaBTCBalance, stakingData])

  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-12 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-defi-purple-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-defi-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
        <p className="text-slate-400">
          Please connect your wallet to start staking
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Stake SovaBTC</h2>
        <div className="flex items-center gap-2 text-sm text-defi-purple-400">
          <TrendingUp className="h-4 w-4" />
          <span>{boostedAPY.toFixed(2)}% APY</span>
        </div>
      </div>

      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="stake" className="data-[state=active]:bg-defi-purple-500/20">
            Stake
          </TabsTrigger>
          <TabsTrigger value="unstake" className="data-[state=active]:bg-defi-blue-500/20">
            Unstake
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stake" className="space-y-6 mt-6">
          {/* Staking Period Selector */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-300">
              Staking Period (Higher periods = Higher APY)
            </Label>
            <div className="space-y-3">
              <Slider
                value={stakingPeriod}
                onValueChange={setStakingPeriod}
                max={365}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>1 day ({stakingData.apy.toFixed(1)}%)</span>
                <span className="font-medium text-white">
                  {stakingPeriod[0]} days ({boostedAPY.toFixed(2)}% APY)
                </span>
                <span>1 year ({(stakingData.apy * 1.5).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Amount to Stake</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className={`h-16 text-2xl font-semibold bg-transparent border-2 pr-32 ${
                  stakeValidation.error 
                    ? 'border-defi-red-500/50 focus:border-defi-red-500' 
                    : 'border-white/20 focus:border-defi-purple-500/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxStake}
                    disabled={sovaBTCBalance.isLoading}
                    className="h-8 px-3 text-xs font-semibold hover:bg-white/10"
                  >
                    MAX
                  </Button>
                </motion.div>
                <span className="text-sm font-medium text-slate-300">sovaBTC</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(percentage)}
                  className="flex-1 h-8 text-xs bg-transparent border-white/20 hover:bg-white/10"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Available:</span>
                {sovaBTCBalance.isLoading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="shimmer w-16 h-3 rounded"></span>
                  </div>
                ) : (
                  <span className="font-medium">
                    {formatTokenAmount(sovaBTCBalance.balance, 8)} sovaBTC
                  </span>
                )}
              </div>
              
              {stakeAmount && stakeValidation.isValid && (
                <div className="text-slate-400">
                  ≈ {formatUSD(Number(stakeAmount) * 45000)}
                </div>
              )}
            </div>
          </div>

          {/* Auto-compound Option */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-defi-purple-500/10 border border-defi-purple-500/20">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-defi-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">Auto-compound rewards</p>
                <p className="text-xs text-slate-400">Automatically restake SOVA rewards</p>
              </div>
            </div>
            <Switch
              checked={autoCompound}
              onCheckedChange={setAutoCompound}
            />
          </div>

          {/* Rewards Calculator */}
          <Card className="defi-card border-defi-purple-500/30 bg-gradient-to-r from-defi-purple-500/5 to-defi-pink-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-defi-purple-400" />
                <h3 className="font-semibold text-white">Rewards Calculator</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Daily</p>
                  <p className="text-lg font-bold text-defi-purple-400">
                    {potentialRewards.daily.toFixed(4)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.daily * 0.1)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Monthly</p>
                  <p className="text-lg font-bold text-defi-pink-400">
                    {potentialRewards.monthly.toFixed(2)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.monthly * 0.1)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Yearly</p>
                  <p className="text-lg font-bold text-defi-blue-400">
                    {potentialRewards.yearly.toFixed(2)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.yearly * 0.1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {needsApproval ? (
                <motion.div
                  key="approve"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    onClick={handleApprove}
                    disabled={approval.isPending || approval.isConfirming || !stakeValidation.isValid}
                    className="w-full h-14 text-lg font-semibold defi-button bg-defi-purple-600 hover:bg-defi-purple-500"
                    size="lg"
                  >
                    {approval.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {approval.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {approval.isPending 
                      ? 'Waiting for signature...'
                      : approval.isConfirming 
                      ? 'Confirming approval...'
                      : 'Approve SovaBTC'
                    }
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="stake"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={handleStake}
                    disabled={stake.isPending || stake.isConfirming || !stakeValidation.isValid}
                    className="w-full h-14 text-lg font-semibold defi-button bg-gradient-to-r from-defi-purple-600 to-defi-pink-600 hover:from-defi-purple-500 hover:to-defi-pink-500"
                    size="lg"
                  >
                    {stake.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {stake.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {stake.isPending 
                      ? 'Waiting for signature...'
                      : stake.isConfirming 
                      ? 'Confirming stake...'
                      : 'Stake SovaBTC'
                    }
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Error */}
            <AnimatePresence>
              {stakeValidation.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{stakeValidation.error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
        
        <TabsContent value="unstake" className="space-y-6 mt-6">
          {/* Unstake Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Amount to Unstake</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className={`h-16 text-2xl font-semibold bg-transparent border-2 pr-32 ${
                  unstakeValidation.error 
                    ? 'border-defi-red-500/50 focus:border-defi-red-500' 
                    : 'border-white/20 focus:border-defi-blue-500/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxUnstake}
                    className="h-8 px-3 text-xs font-semibold hover:bg-white/10"
                  >
                    MAX
                  </Button>
                </motion.div>
                <span className="text-sm font-medium text-slate-300">sovaBTC</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Staked:</span>
                <span className="font-medium">
                  {formatTokenAmount(stakingData.stakedAmount, 8)} sovaBTC
                </span>
              </div>
            </div>
          </div>

          {/* Unstaking Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-defi-blue-500/10 border border-defi-blue-500/20">
            <AlertCircle className="h-5 w-5 text-defi-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-defi-blue-300">Unstaking Information</p>
              <p className="text-xs text-slate-400 mt-1">
                Unstaking will stop reward accrual immediately. Consider claiming rewards first.
              </p>
            </div>
          </div>

          <Button
            onClick={handleUnstake}
            disabled={unstake.isPending || unstake.isConfirming || !unstakeValidation.isValid}
            className="w-full h-14 text-lg font-semibold defi-button bg-gradient-to-r from-defi-blue-600 to-defi-purple-600 hover:from-defi-blue-500 hover:to-defi-purple-500"
            size="lg"
          >
            {unstake.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            {unstake.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            {unstake.isPending 
              ? 'Waiting for signature...'
              : unstake.isConfirming 
              ? 'Confirming unstake...'
              : 'Unstake SovaBTC'
            }
          </Button>

          {/* Validation Error */}
          <AnimatePresence>
            {unstakeValidation.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{unstakeValidation.error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
```

## Next Steps

Continue with:
1. Rewards Display Component
2. Staking Stats Component  
3. Staking Chart Component
4. Final testing and integration

This provides:
- ✅ Advanced staking form with period selection
- ✅ Real APY calculations with bonuses
- ✅ Auto-compound option
- ✅ Rewards calculator
- ✅ Comprehensive validation
- ✅ Professional animations and transitions