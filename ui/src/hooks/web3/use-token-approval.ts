'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits, maxUint256 } from 'viem'
import { useCallback } from 'react'

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = useCallback(async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number,
    useMaxApproval = false
  ) => {
    try {
      const parsedAmount = useMaxApproval 
        ? maxUint256 
        : parseUnits(amount, decimals)
      
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, parsedAmount],
      })
    } catch (error) {
      console.error('Approval error:', error)
    }
  }, [writeContract])

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}