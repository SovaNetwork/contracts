'use client'

import { useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'

export function useRedemptionRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  })

  const requestRedemption = useCallback(async (
    tokenAddress: `0x${string}`,
    sovaAmount: string,
    queueAddress: `0x${string}`
  ) => {
    try {
      const parsedAmount = parseUnits(sovaAmount, 8) // SovaBTC has 8 decimals
      
      writeContract({
        address: queueAddress,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'redeem',
        args: [tokenAddress, parsedAmount],
      })
    } catch (error) {
      console.error('Redemption error:', error)
    }
  }, [writeContract])

  return {
    requestRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
} 