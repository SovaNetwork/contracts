'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits, maxUint256 } from 'viem'
import { useToast } from '@/components/providers'
import { useCallback } from 'react'

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Approval Successful",
        description: "You can now proceed with your transaction",
      })
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      })
    },
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