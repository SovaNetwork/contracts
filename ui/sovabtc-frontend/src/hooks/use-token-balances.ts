import { useEffect, useState, useCallback } from 'react'
import { useAccount, useBlockNumber } from 'wagmi'
import { Address, formatUnits } from 'viem'
import { useERC20 } from './use-contracts'
import { useSovaBTC } from './use-contracts'
import { TokenInfo, Balance } from '@/types/contracts'
import { formatTokenAmount } from '@/lib/decimal-conversion'
import { REFRESH_INTERVALS } from '@/lib/constants'

interface TokenBalance {
  token: TokenInfo
  balance: Balance
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface UseTokenBalancesReturn {
  balances: Record<Address, TokenBalance>
  sovaBTCBalance: TokenBalance | null
  isLoading: boolean
  error: Error | null
  refetchAll: () => void
  getBalance: (tokenAddress: Address) => TokenBalance | undefined
  getTotalValue: () => number | undefined
}

/**
 * Hook for managing multiple token balances with automatic refresh
 */
export function useTokenBalances(tokens: TokenInfo[]): UseTokenBalancesReturn {
  const { address } = useAccount()
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const [balances, setBalances] = useState<Record<Address, TokenBalance>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // SovaBTC balance (special handling)
  const {
    balance: sovaBTCRaw,
    balanceLoading: sovaBTCLoading,
    refetchBalance: refetchSovaBTC,
  } = useSovaBTC()

  // Create a balance object for SovaBTC
  const sovaBTCBalance: TokenBalance | null = sovaBTCRaw !== undefined ? {
    token: {
      address: '0x0000000000000000000000000000000000000000' as Address, // Will be updated with actual address
      symbol: 'sovaBTC',
      name: 'SovaBTC',
      decimals: 8,
      icon: '/icons/sovabtc.svg',
      isWhitelisted: true,
    },
    balance: {
      raw: sovaBTCRaw,
      formatted: formatTokenAmount(sovaBTCRaw, 8, 8),
      decimals: 8,
      symbol: 'sovaBTC',
    },
    isLoading: sovaBTCLoading,
    error: null,
    refetch: refetchSovaBTC,
  } : null

  // Fetch balance for a single token
  const fetchTokenBalance = useCallback(async (token: TokenInfo) => {
    if (!address) return

    try {
      setBalances(prev => ({
        ...prev,
        [token.address]: {
          ...prev[token.address],
          isLoading: true,
          error: null,
        }
      }))

      // This would ideally use the useERC20 hook results
      // For now, we'll create a placeholder
      const balance: Balance = {
        raw: BigInt(0), // Placeholder
        formatted: '0',
        decimals: token.decimals,
        symbol: token.symbol,
      }

      setBalances(prev => ({
        ...prev,
        [token.address]: {
          token,
          balance,
          isLoading: false,
          error: null,
          refetch: () => fetchTokenBalance(token),
        }
      }))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance')
      setBalances(prev => ({
        ...prev,
        [token.address]: {
          ...prev[token.address],
          isLoading: false,
          error,
        }
      }))
    }
  }, [address])

  // Fetch all token balances
  const fetchAllBalances = useCallback(async () => {
    if (!address || tokens.length === 0) {
      setBalances({})
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await Promise.all(tokens.map(token => fetchTokenBalance(token)))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balances'))
    } finally {
      setIsLoading(false)
    }
  }, [address, tokens, fetchTokenBalance])

  // Refetch all balances
  const refetchAll = useCallback(() => {
    fetchAllBalances()
    refetchSovaBTC()
  }, [fetchAllBalances, refetchSovaBTC])

  // Get balance for specific token
  const getBalance = useCallback((tokenAddress: Address): TokenBalance | undefined => {
    return balances[tokenAddress]
  }, [balances])

  // Calculate total portfolio value (placeholder)
  const getTotalValue = useCallback((): number | undefined => {
    // This would calculate total USD value across all tokens
    // Requires price data integration
    return undefined
  }, [])

  // Fetch balances when dependencies change
  useEffect(() => {
    if (address && tokens.length > 0) {
      fetchAllBalances()
    } else {
      setBalances({})
    }
  }, [address, tokens, fetchAllBalances])

  // Auto-refresh on new blocks (throttled)
  useEffect(() => {
    if (blockNumber && address && tokens.length > 0) {
      const intervalId = setInterval(() => {
        fetchAllBalances()
      }, REFRESH_INTERVALS.BALANCES)

      return () => clearInterval(intervalId)
    }
  }, [blockNumber, address, tokens, fetchAllBalances])

  return {
    balances,
    sovaBTCBalance,
    isLoading,
    error,
    refetchAll,
    getBalance,
    getTotalValue,
  }
}

/**
 * Hook for a single token balance with real-time updates
 */
export function useTokenBalance(tokenAddress?: Address) {
  const { address } = useAccount()
  const { balance, decimals, symbol, balanceLoading } = useERC20(tokenAddress)

  const formatted = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0.0000'

  return {
    balance,
    decimals,
    symbol,
    formatted,
    isLoading: balanceLoading,
    refetch: () => {
      // The useERC20 hook handles refetching internally
    }
  }
}

/**
 * Hook for checking if user has sufficient balance for an amount
 */
export function useBalanceCheck(tokenAddress?: Address, requiredAmount?: bigint) {
  const { balance } = useTokenBalance(tokenAddress)
  
  const hasSufficientBalance = balance !== undefined && requiredAmount !== undefined
    ? balance >= requiredAmount
    : false

  const shortage = balance !== undefined && requiredAmount !== undefined && balance < requiredAmount
    ? requiredAmount - balance
    : BigInt(0)

  return {
    hasSufficientBalance,
    shortage,
    balance,
  }
}

/**
 * Hook for watching balance changes
 */
export function useBalanceWatcher(
  tokenAddress?: Address,
  onBalanceChange?: (newBalance: bigint, oldBalance: bigint) => void
) {
  const { balance } = useTokenBalance(tokenAddress)
  const [previousBalance, setPreviousBalance] = useState<bigint | undefined>()

  useEffect(() => {
    if (balance !== undefined && previousBalance !== undefined && balance !== previousBalance) {
      onBalanceChange?.(balance, previousBalance)
    }
    setPreviousBalance(balance)
  }, [balance, previousBalance, onBalanceChange])

  return { balance, previousBalance }
} 