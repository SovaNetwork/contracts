import { useEffect, useState, useCallback } from 'react'
import { useAccount, useBlockNumber, useReadContract, useChainId } from 'wagmi'
import { Address } from 'viem'
import { useERC20 } from './use-contracts'
import { useSovaBTC } from './use-contracts'
import { TokenInfo, Balance } from '@/types/contracts'
import { formatTokenAmount, formatUnits } from '@/lib/decimal-conversion'
import { REFRESH_INTERVALS } from '@/lib/constants'
import { 
  ERC20_ABI, 
  CONTRACT_CONFIG, 
  CONTRACT_ADDRESSES, 
  isSupportedChain,
  type SupportedChainId 
} from '@/config/contracts'
import type { SupportedChainId as ContractAddressesSupportedChainId } from '@/contracts/addresses'

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
export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!tokenAddress && isSupportedChain(chainId),
      refetchInterval: CONTRACT_CONFIG.BALANCE_REFRESH_INTERVAL,
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress && isSupportedChain(chainId),
      staleTime: CONTRACT_CONFIG.STATIC_DATA_STALE_TIME,
    },
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress && isSupportedChain(chainId),
      staleTime: CONTRACT_CONFIG.STATIC_DATA_STALE_TIME,
    },
  });

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress && isSupportedChain(chainId),
      staleTime: CONTRACT_CONFIG.STATIC_DATA_STALE_TIME,
    },
  });

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  return {
    balance: balance || BigInt(0),
    formattedBalance,
    decimals: decimals || 18,
    symbol: symbol || 'TOKEN',
    name: name || 'Unknown Token',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if user has sufficient balance for an amount
 */
export function useBalanceCheck(tokenAddress: `0x${string}` | undefined, requiredAmount: bigint) {
  const { balance } = useTokenBalance(tokenAddress);
  
  const hasSufficientBalance = balance >= requiredAmount;
  const shortage = balance < requiredAmount ? requiredAmount - balance : BigInt(0);

  return {
    hasSufficientBalance,
    shortage,
    currentBalance: balance,
  };
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

// Hook specifically for SovaBTC balance
export function useSovaBTCBalance() {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      balance: BigInt(0),
      formattedBalance: '0',
      decimals: CONTRACT_CONFIG.SOVABTC_DECIMALS,
      symbol: 'SovaBTC',
      name: 'Sova Bitcoin',
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const sovaBTCAddress = CONTRACT_ADDRESSES[chainId].SOVABTC;
  
  return {
    ...useTokenBalance(sovaBTCAddress),
    decimals: CONTRACT_CONFIG.SOVABTC_DECIMALS,
    symbol: 'SovaBTC',
    name: 'Sova Bitcoin',
  };
}

// Hook specifically for SOVA token balance
export function useSOVATokenBalance() {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      balance: BigInt(0),
      formattedBalance: '0',
      decimals: CONTRACT_CONFIG.SOVA_TOKEN_DECIMALS,
      symbol: 'SOVA',
      name: 'Sova Token',
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const sovaTokenAddress = CONTRACT_ADDRESSES[chainId].SOVA_TOKEN;
  
  return {
    ...useTokenBalance(sovaTokenAddress),
    decimals: CONTRACT_CONFIG.SOVA_TOKEN_DECIMALS,
    symbol: 'SOVA',
    name: 'Sova Token',
  };
}

// Hook for multiple token balances
export function useMultipleTokenBalances(tokenAddresses: `0x${string}`[]) {
  const { address } = useAccount();
  const chainId = useChainId();

  const balanceQueries = tokenAddresses.map(tokenAddress => ({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [address!],
    query: {
      enabled: !!address && !!tokenAddress && isSupportedChain(chainId),
      refetchInterval: CONTRACT_CONFIG.BALANCE_REFRESH_INTERVAL,
    },
  }));

  // Note: This would need a batch read contract hook for optimal performance
  // For now, returning individual calls pattern
  return tokenAddresses.map(tokenAddress => useTokenBalance(tokenAddress));
}

// Hook for test token balances (WBTC, LBTC, USDC)
export function useTestTokenBalances() {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      wbtcBalance: { 
        balance: BigInt(0), 
        formattedBalance: '0', 
        decimals: 8, 
        symbol: 'WBTC', 
        isLoading: false, 
        error: null, 
        refetch: () => {} 
      },
      lbtcBalance: { 
        balance: BigInt(0), 
        formattedBalance: '0', 
        decimals: 8, 
        symbol: 'LBTC', 
        isLoading: false, 
        error: null, 
        refetch: () => {} 
      },
      usdcBalance: { 
        balance: BigInt(0), 
        formattedBalance: '0', 
        decimals: 6, 
        symbol: 'USDC', 
        isLoading: false, 
        error: null, 
        refetch: () => {} 
      },
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  
  const wbtcBalance = useTokenBalance(addresses.WBTC_TEST);
  const lbtcBalance = useTokenBalance(addresses.LBTC_TEST);
  const usdcBalance = useTokenBalance(addresses.USDC_TEST);

  return {
    wbtcBalance: {
      ...wbtcBalance,
      decimals: 8,
      symbol: 'WBTC',
      name: 'Mock Wrapped Bitcoin',
    },
    lbtcBalance: {
      ...lbtcBalance,
      decimals: 8,
      symbol: 'LBTC',
      name: 'Mock Liquid Bitcoin',
    },
    usdcBalance: {
      ...usdcBalance,
      decimals: 6,
      symbol: 'USDC',
      name: 'Mock USD Coin',
    },
  };
}

// Hook for aggregated portfolio balances
export function usePortfolioBalances() {
  const sovaBTCBalance = useSovaBTCBalance();
  const sovaTokenBalance = useSOVATokenBalance();
  const testTokenBalances = useTestTokenBalances();

  const isLoading = sovaBTCBalance.isLoading || 
                   sovaTokenBalance.isLoading || 
                   testTokenBalances.wbtcBalance.isLoading ||
                   testTokenBalances.lbtcBalance.isLoading ||
                   testTokenBalances.usdcBalance.isLoading;

  const hasError = sovaBTCBalance.error || 
                  sovaTokenBalance.error || 
                  testTokenBalances.wbtcBalance.error ||
                  testTokenBalances.lbtcBalance.error ||
                  testTokenBalances.usdcBalance.error;

  const refetchAll = () => {
    sovaBTCBalance.refetch();
    sovaTokenBalance.refetch();
    testTokenBalances.wbtcBalance.refetch();
    testTokenBalances.lbtcBalance.refetch();
    testTokenBalances.usdcBalance.refetch();
  };

  return {
    sovaBTC: sovaBTCBalance,
    sovaToken: sovaTokenBalance,
    testTokens: testTokenBalances,
    isLoading,
    hasError,
    refetchAll,
  };
} 