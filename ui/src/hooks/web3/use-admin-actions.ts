'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TOKEN_WHITELIST_ABI, REDEMPTION_QUEUE_ABI, SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

export function useAdminActions() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle success/error with useEffect
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Admin Action Successful",
        description: "The administrative action has been completed",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    }
  }, [isSuccess, toast])

  useEffect(() => {
    if (error) {
      toast({
        title: "Admin Action Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Token Whitelist Management
  const addToWhitelist = useCallback(async (
    whitelistAddress: `0x${string}`,
    tokenAddress: `0x${string}`
  ) => {
    writeContract({
      address: whitelistAddress,
      abi: TOKEN_WHITELIST_ABI,
      functionName: 'addToken',
      args: [tokenAddress],
    })
  }, [writeContract])

  const removeFromWhitelist = useCallback(async (
    whitelistAddress: `0x${string}`,
    tokenAddress: `0x${string}`
  ) => {
    writeContract({
      address: whitelistAddress,
      abi: TOKEN_WHITELIST_ABI,
      functionName: 'removeToken',
      args: [tokenAddress],
    })
  }, [writeContract])

  // Redemption Queue Management
  const updateRedemptionDelay = useCallback(async (
    queueAddress: `0x${string}`,
    newDelay: bigint
  ) => {
    writeContract({
      address: queueAddress,
      abi: REDEMPTION_QUEUE_ABI,
      functionName: 'setRedemptionDelay',
      args: [newDelay],
    })
  }, [writeContract])

  // Staking Management
  const setRewardRate = useCallback(async (
    stakingAddress: `0x${string}`,
    rewardRate: bigint
  ) => {
    writeContract({
      address: stakingAddress,
      abi: SOVABTC_STAKING_ABI,
      functionName: 'setRewardRate',
      args: [rewardRate],
    })
  }, [writeContract])

  const pauseContract = useCallback(async (
    contractAddress: `0x${string}`,
    abi: any
  ) => {
    writeContract({
      address: contractAddress,
      abi,
      functionName: 'pause',
      args: [],
    })
  }, [writeContract])

  const unpauseContract = useCallback(async (
    contractAddress: `0x${string}`,
    abi: any
  ) => {
    writeContract({
      address: contractAddress,
      abi,
      functionName: 'unpause',
      args: [],
    })
  }, [writeContract])

  return {
    addToWhitelist,
    removeFromWhitelist,
    updateRedemptionDelay,
    setRewardRate,
    pauseContract,
    unpauseContract,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
} 