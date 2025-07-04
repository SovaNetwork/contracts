'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits, maxUint256 } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useEffect } from 'react'

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle success and error states
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Approval Successful",
        description: "You can now proceed with your transaction",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    }
  }, [isSuccess, toast])

  useEffect(() => {
    if (receiptError) {
      toast({
        title: "Approval Failed",
        description: receiptError.message,
        variant: "destructive",
      })
    }
  }, [receiptError, toast])

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
      toast({
        title: "Approval Error",
        description: "Failed to prepare approval transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}