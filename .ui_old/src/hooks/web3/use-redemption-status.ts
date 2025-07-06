'use client'

import { useReadContract, useAccount } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { useMemo } from 'react'

interface RedemptionRequestData {
  sovaAmount: bigint
  requestTime: bigint
  token: string
}

export function useRedemptionStatus(queueAddress: `0x${string}`) {
  const { address } = useAccount()

  const { data: redemptionRequest, isLoading, refetch } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'pendingRedemptions',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds for countdown
    },
  })

  const { data: redemptionDelay } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
    query: {
      staleTime: Infinity, // Delay doesn't change
    },
  })

  const queueData = useMemo(() => {
    if (!redemptionRequest || !redemptionDelay) {
      return {
        isActive: false,
        isReady: false,
        timeRemaining: 0,
        progress: 0,
        requestTime: 0,
        endTime: 0,
      }
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const requestData = redemptionRequest as RedemptionRequestData
    const requestTime = Number(requestData.requestTime || 0)
    const delay = Number(redemptionDelay)
    const endTime = requestTime + delay
    const timeRemaining = Math.max(0, endTime - currentTime)
    const sovaAmount = BigInt(requestData.sovaAmount || 0)
    const isReady = timeRemaining === 0 && sovaAmount > BigInt(0)
    const isActive = sovaAmount > BigInt(0)
    const progress = delay > 0 ? Math.min(100, ((delay - timeRemaining) / delay) * 100) : 0

    return {
      isActive,
      isReady,
      timeRemaining,
      progress,
      requestTime,
      endTime,
    }
  }, [redemptionRequest, redemptionDelay])

  return {
    redemptionRequest,
    redemptionDelay: Number(redemptionDelay || 0),
    queueData,
    isLoading,
    refetch,
  }
} 