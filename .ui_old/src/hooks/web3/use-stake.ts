'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Staking Successful! 🎉",
        description: "Your SovaBTC is now earning SOVA rewards",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    }
  }, [isSuccess, hash, toast])

  useEffect(() => {
    if (txError) {
      toast({
        title: "Staking Failed",
        description: txError.message,
        variant: "destructive",
      })
    }
  }, [txError, toast])

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