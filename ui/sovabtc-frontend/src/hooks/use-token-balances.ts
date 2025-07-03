import { useChainId } from 'wagmi'
import { Address } from 'viem'
import { useTokenBalance } from './use-token-balance'
import { useMultiChainSovaBTCBalances, useTestTokenBalances, useAllBalances } from './use-multi-chain-balances'
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/contracts/config'

// Re-export the main hooks for compatibility
export { useTokenBalance } from './use-token-balance'
export { useTokenAllowance } from './use-token-allowance'
export { useMultiChainSovaBTCBalances, useTestTokenBalances, useAllBalances } from './use-multi-chain-balances'

interface TokenBalance {
  address: Address
  symbol: string
  name: string
  decimals: number
  balance: bigint
  formattedBalance: string
  displayBalance: string
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface UseTokenBalancesReturn {
  sovaBTC: TokenBalance
  testTokens: {
    WBTC: TokenBalance
    LBTC: TokenBalance  
    USDC: TokenBalance
  }
  isLoading: boolean
  refetchAll: () => void
}

/**
 * Hook for managing all token balances with real contract interactions
 */
export function useTokenBalances(): UseTokenBalancesReturn {
  const chainId = useChainId()
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  
  // Get SovaBTC balance
  const sovaBTCBalance = useTokenBalance(addresses?.SOVABTC as `0x${string}`)
  
  // Get test token balances
  const wbtcBalance = useTokenBalance(addresses?.WBTC_TEST as `0x${string}`)
  const lbtcBalance = useTokenBalance(addresses?.LBTC_TEST as `0x${string}`)
  const usdcBalance = useTokenBalance(addresses?.USDC_TEST as `0x${string}`)

  // Transform balance data to match interface
  const createTokenBalance = (
    balance: ReturnType<typeof useTokenBalance>,
    address: Address,
    metadata: typeof TOKEN_METADATA[keyof typeof TOKEN_METADATA]
  ): TokenBalance => ({
    address,
    symbol: metadata.symbol,
    name: metadata.name,
    decimals: metadata.decimals,
    balance: balance.balance,
    formattedBalance: balance.formattedBalance,
    displayBalance: balance.displayBalance,
    isLoading: balance.isLoading,
    error: balance.error,
    refetch: balance.refetch,
  })

  const refetchAll = () => {
    sovaBTCBalance.refetch()
    wbtcBalance.refetch()
    lbtcBalance.refetch()
    usdcBalance.refetch()
  }

  return {
    sovaBTC: createTokenBalance(
      sovaBTCBalance,
      addresses?.SOVABTC as Address,
      TOKEN_METADATA.SOVABTC
    ),
    testTokens: {
      WBTC: createTokenBalance(
        wbtcBalance,
        addresses?.WBTC_TEST as Address,
        TOKEN_METADATA.WBTC
      ),
      LBTC: createTokenBalance(
        lbtcBalance,
        addresses?.LBTC_TEST as Address,
        TOKEN_METADATA.LBTC
      ),
      USDC: createTokenBalance(
        usdcBalance,
        addresses?.USDC_TEST as Address,
        TOKEN_METADATA.USDC
      ),
    },
    isLoading: sovaBTCBalance.isLoading || wbtcBalance.isLoading || lbtcBalance.isLoading || usdcBalance.isLoading,
    refetchAll,
  }
}

/**
 * Hook for checking if user has sufficient balance for an amount
 */
export function useBalanceCheck(tokenAddress?: Address, requiredAmount?: bigint) {
  const balance = useTokenBalance(tokenAddress)
  
  const hasSufficientBalance = balance.balance !== undefined && requiredAmount !== undefined
    ? balance.balance >= requiredAmount
    : false

  const shortage = balance.balance !== undefined && requiredAmount !== undefined && balance.balance < requiredAmount
    ? requiredAmount - balance.balance
    : BigInt(0)

  return {
    hasSufficientBalance,
    shortage,
    balance: balance.balance,
    formattedBalance: balance.formattedBalance,
    isLoading: balance.isLoading,
    error: balance.error,
    refetch: balance.refetch,
  }
}

/**
 * Hook for getting a specific token balance
 */
export function useSingleTokenBalance(tokenAddress?: Address) {
  return useTokenBalance(tokenAddress)
} 