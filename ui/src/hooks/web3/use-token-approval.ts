'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits, maxUint256 } from 'viem'
import { toast } from 'sonner'
import { useCallback } from 'react'

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle success/error states
  if (isSuccess) {
    toast.success("Approval Successful", {
      description: "You can now proceed with your transaction",
    })
  }

  if (isError) {
    toast.error("Approval Failed", {
      description: "Transaction failed or was reverted",
    })
  }

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
      toast.error("Approval Error", {
        description: "Failed to prepare approval transaction",
      })
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