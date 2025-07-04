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
        address: stak


*NOTE TO CLAUDE: THIS GOT CUT OFF! - TRY TO FIX AND CONTINUE THE IMPLEMENTATION*