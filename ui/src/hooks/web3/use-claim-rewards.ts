'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Rewards Claimed! 💰",
        description: "Your SOVA rewards have been claimed successfully",
        className: "border-defi-purple-500/50 bg-defi-purple-50/10",
      })
    }
  }, [isSuccess, hash, toast])

  useEffect(() => {
    if (txError) {
      toast({
        title: "Claim Failed",
        description: txError.message,
        variant: "destructive",
      })
    }
  }, [txError, toast])

  const claimRewards = useCallback(async (stakingAddress: `0x${string}`) => {
    try {
      writeContract({
        address: stakingAddress,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'getReward',
        args: [],
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