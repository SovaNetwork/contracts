'use client'

import { useReadContract, useAccount } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'

export function useTokenAllowance(
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  const { address } = useAccount()

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, spenderAddress],
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress,
      refetchInterval: 15000,
    },
  })

  const hasAllowance = (allowance || BigInt(0)) > BigInt(0)
  
  const hasInsufficientAllowance = (amount: string, decimals: number) => {
    if (!amount || !allowance) return true
    try {
      const parsedAmount = parseUnits(amount, decimals)
      return allowance < parsedAmount
    } catch {
      return true
    }
  }

  return {
    allowance: allowance || BigInt(0),
    hasAllowance,
    hasInsufficientAllowance,
    isLoading,
    refetch,
  }
}