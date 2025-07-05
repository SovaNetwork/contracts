'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

export function useUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Unstaking Successful",
        description: "Your SovaBTC has been unstaked",
        className: "border-defi-blue-500/50 bg-defi-blue-50/10",
      })
    }
  }, [isSuccess, hash, toast])

  useEffect(() => {
    if (txError) {
      toast({
        title: "Unstaking Failed",
        description: txError.message,
        variant: "destructive",
      })
    }
  }, [txError, toast])

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