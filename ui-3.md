# Phase 3: Contract Integration & Web3 Hooks

## Overview
Setting up type-safe contract interactions with professional error handling and loading states.

## Step 1: Contract Addresses Configuration

```typescript
// src/contracts/addresses.ts
import { baseSepolia } from 'viem/chains'

export const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: {
    SOVABTC: process.env.NEXT_PUBLIC_SOVABTC_ADDRESS! as `0x${string}`,
    SOVA_TOKEN: process.env.NEXT_PUBLIC_SOVA_TOKEN_ADDRESS! as `0x${string}`,
    WRAPPER: process.env.NEXT_PUBLIC_WRAPPER_ADDRESS! as `0x${string}`,
    TOKEN_WHITELIST: process.env.NEXT_PUBLIC_TOKEN_WHITELIST_ADDRESS! as `0x${string}`,
    CUSTODY_MANAGER: process.env.NEXT_PUBLIC_CUSTODY_MANAGER_ADDRESS! as `0x${string}`,
    REDEMPTION_QUEUE: process.env.NEXT_PUBLIC_REDEMPTION_QUEUE_ADDRESS! as `0x${string}`,
    STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS! as `0x${string}`,
    
    // Test Tokens
    WBTC_TEST: process.env.NEXT_PUBLIC_WBTC_TEST_ADDRESS! as `0x${string}`,
    LBTC_TEST: process.env.NEXT_PUBLIC_LBTC_TEST_ADDRESS! as `0x${string}`,
    USDC_TEST: process.env.NEXT_PUBLIC_USDC_TEST_ADDRESS! as `0x${string}`,
  },
} as const

export const SUPPORTED_CHAINS = [baseSepolia.id] as const
export type SupportedChainId = typeof SUPPORTED_CHAINS[number]

export function getContractAddress(
  chainId: SupportedChainId,
  contract: keyof typeof CONTRACT_ADDRESSES[SupportedChainId]
): `0x${string}` {
  return CONTRACT_ADDRESSES[chainId][contract]
}

export const TEST_TOKENS = [
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: CONTRACT_ADDRESSES[baseSepolia.id].WBTC_TEST,
    icon: '₿',
    color: 'from-orange-400 to-orange-600',
  },
  {
    symbol: 'LBTC',
    name: 'Liquid Bitcoin', 
    decimals: 8,
    address: CONTRACT_ADDRESSES[baseSepolia.id].LBTC_TEST,
    icon: '⚡',
    color: 'from-blue-400 to-blue-600',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: CONTRACT_ADDRESSES[baseSepolia.id].USDC_TEST,
    icon: '$',
    color: 'from-green-400 to-green-600',
  },
] as const

export type TestToken = typeof TEST_TOKENS[number]
```

## Step 2: ABI Imports with Type Safety

```typescript
// src/contracts/abis/index.ts

// Import your ABIs here (copy from ../../abis/)
import SovaBTCABI from './SovaBTC.abi.json'
import SOVATokenABI from './SOVAToken.abi.json'
import SovaBTCWrapperABI from './SovaBTCWrapper.abi.json'
import TokenWhitelistABI from './TokenWhitelist.abi.json'
import CustodyManagerABI from './CustodyManager.abi.json'
import RedemptionQueueABI from './RedemptionQueue.abi.json'
import SovaBTCStakingABI from './SovaBTCStaking.abi.json'

// Standard ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const

// Export ABIs with proper typing
export const SOVABTC_ABI = SovaBTCABI as const
export const SOVA_TOKEN_ABI = SOVATokenABI as const
export const SOVABTC_WRAPPER_ABI = SovaBTCWrapperABI as const
export const TOKEN_WHITELIST_ABI = TokenWhitelistABI as const
export const CUSTODY_MANAGER_ABI = CustodyManagerABI as const
export const REDEMPTION_QUEUE_ABI = RedemptionQueueABI as const
export const SOVABTC_STAKING_ABI = SovaBTCStakingABI as const
```

## Step 3: Core Web3 Hooks

### Token Balance Hook with Loading States

```typescript
// src/hooks/web3/use-token-balance.ts
'use client'

import { useReadContract, useAccount, useChainId } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { formatUnits } from 'viem'
import { useMemo } from 'react'

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount()
  const chainId = useChainId()

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
    balance: balance || 0n,
    formattedBalance,
    decimals: decimals || 18,
    symbol: symbol || 'TOKEN',
    name: name || 'Unknown Token',
    isLoading,
    error: balanceError,
    refetch: refetchBalance,
  }
}
```

### Token Allowance Hook

```typescript
// src/hooks/web3/use-token-allowance.ts
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

  const hasAllowance = (allowance || 0n) > 0n
  
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
    allowance: allowance || 0n,
    hasAllowance,
    hasInsufficientAllowance,
    isLoading,
    refetch,
  }
}
```

### Professional Token Approval Hook

```typescript
// src/hooks/web3/use-token-approval.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { parseUnits, maxUint256 } from 'viem'
import { useToast } from '@/hooks/use-toast'
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
        className: "border-defi-green-500/50 bg-defi-green-50/10",
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
```

## Step 4: Advanced Toast Hook

```typescript
// src/hooks/use-toast.ts
'use client'

import * as React from "react"

// This will be generated by shadcn/ui when you add the toast component
// For now, create a simple implementation

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  className?: string
}

export function useToast() {
  const toast = React.useCallback(({ title, description, variant, className }: ToastProps) => {
    // Simple console logging for now - replace with actual toast implementation
    console.log(`Toast [${variant}]:`, title, description)
    
    // You can implement a more sophisticated toast system here
    // or use the shadcn/ui toast component when it's installed
  }, [])

  return { toast }
}
```

## Step 5: Utility Functions

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatUnits, parseUnits } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTokenAmount(
  amount: bigint, 
  decimals: number, 
  displayDecimals = 4
): string {
  const formatted = formatUnits(amount, decimals)
  const num = Number(formatted)
  
  if (num === 0) return '0'
  if (num < 0.0001) return '< 0.0001'
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  }).format(num)
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return parseUnits(amount, decimals)
  } catch {
    return 0n
  }
}
```

## Next Steps

After completing this phase:
1. Copy your actual ABI files to `src/contracts/abis/`
2. Test token balance fetching with your deployed contracts
3. Proceed to Phase 4: Modern Wrap Interface

This phase provides:
- ✅ Type-safe contract interactions
- ✅ Professional error handling
- ✅ Optimized data fetching with caching
- ✅ Reusable Web3 hooks
- ✅ Loading states and user feedback
- ✅ Utility functions for formatting