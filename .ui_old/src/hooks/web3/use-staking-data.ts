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
    const totalSupplyValue = typeof totalSupply === 'bigint' ? totalSupply : BigInt(0)
    const rewardRateValue = typeof rewardRate === 'bigint' ? rewardRate : BigInt(0)
    
    if (rewardRateValue === BigInt(0) || totalSupplyValue === BigInt(0)) return 0
    
    const annualRewards = Number(rewardRateValue) * 365 * 24 * 3600
    const totalStakedValue = Number(formatUnits(totalSupplyValue, 8)) // SovaBTC decimals
    
    if (totalStakedValue === 0) return 0
    
    return (annualRewards / totalStakedValue) * 100
  }, [rewardRate, totalSupply])

  // User's share of total staking pool
  const userShare = useMemo(() => {
    const stakedAmountValue = typeof stakedAmount === 'bigint' ? stakedAmount : BigInt(0)
    const totalSupplyValue = typeof totalSupply === 'bigint' ? totalSupply : BigInt(0)
    
    if (stakedAmountValue === BigInt(0) || totalSupplyValue === BigInt(0)) return 0
    return (Number(stakedAmountValue) / Number(totalSupplyValue)) * 100
  }, [stakedAmount, totalSupply])

  // Estimated daily rewards for user
  const dailyRewards = useMemo(() => {
    const stakedAmountValue = typeof stakedAmount === 'bigint' ? stakedAmount : BigInt(0)
    const rewardRateValue = typeof rewardRate === 'bigint' ? rewardRate : BigInt(0)
    const totalSupplyValue = typeof totalSupply === 'bigint' ? totalSupply : BigInt(0)
    
    if (stakedAmountValue === BigInt(0) || rewardRateValue === BigInt(0) || totalSupplyValue === BigInt(0)) return 0
    
    const userStaked = Number(formatUnits(stakedAmountValue, 8))
    const dailyRewardRate = Number(rewardRateValue) * 24 * 3600
    const totalStaked = Number(formatUnits(totalSupplyValue, 8))
    
    if (totalStaked === 0) return 0
    
    return (userStaked / totalStaked) * dailyRewardRate
  }, [stakedAmount, rewardRate, totalSupply])

  return {
    stakedAmount: typeof stakedAmount === 'bigint' ? stakedAmount : BigInt(0),
    earnedRewards: typeof earnedRewards === 'bigint' ? earnedRewards : BigInt(0),
    rewardRate: typeof rewardRate === 'bigint' ? rewardRate : BigInt(0),
    totalSupply: typeof totalSupply === 'bigint' ? totalSupply : BigInt(0),
    rewardPerToken: typeof rewardPerToken === 'bigint' ? rewardPerToken : BigInt(0),
    apy,
    userShare,
    dailyRewards,
    refetchStaked,
    refetchEarned,
  }
} 