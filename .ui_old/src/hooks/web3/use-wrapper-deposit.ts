'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_WRAPPER_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useCallback } from 'react'

export function useWrapperDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = useCallback(async (
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number,
    wrapperAddress: `0x${string}`
  ) => {
    try {
      const parsedAmount = parseUnits(amount, tokenDecimals)
      
      writeContract({
        address: wrapperAddress,
        abi: SOVABTC_WRAPPER_ABI,
        functionName: 'deposit',
        args: [tokenAddress, parsedAmount],
      })
    } catch (error) {
      console.error('Deposit error:', error)
    }
  }, [writeContract])

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
} 