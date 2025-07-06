'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { useCallback } from 'react'

export function useFulfillment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  })

  const fulfillRedemption = useCallback(async (
    userAddress: `0x${string}`,
    queueAddress: `0x${string}`
  ) => {
    try {
      writeContract({
        address: queueAddress,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'fulfillRedemption',
        args: [userAddress],
      })
    } catch (error) {
      console.error('Fulfillment error:', error)
    }
  }, [writeContract])

  return {
    fulfillRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
} 