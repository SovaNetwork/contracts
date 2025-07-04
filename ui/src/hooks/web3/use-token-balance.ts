'use client'

import { useReadContract, useAccount } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { formatUnits } from 'viem'
import { useMemo } from 'react'

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount()

  const { 
    data: balance, 
    isLoading: balanceLoading, 
    error: balanceError, 
    refetch: refetchBalance 
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    },
  })

  const { 
    data: decimals,
    isLoading: decimalsLoading 
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Decimals never change
    },
  })

  const { 
    data: symbol,
    isLoading: symbolLoading 
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity,
    },
  })

  const { 
    data: name,
    isLoading: nameLoading 
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity,
    },
  })

  const formattedBalance = useMemo(() => {
    if (!balance || !decimals) return '0'
    return formatUnits(balance, decimals)
  }, [balance, decimals])

  const isLoading = balanceLoading || decimalsLoading || symbolLoading || nameLoading

  return {
    balance: balance || BigInt(0),
    formattedBalance,
    decimals: decimals || 18,
    symbol: symbol || 'TOKEN',
    name: name || 'Unknown Token',
    isLoading,
    error: balanceError,
    refetch: refetchBalance,
  }
}