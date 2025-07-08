import { useCallback, useState, useEffect } from 'react';
import { useTokenBalance } from './useTokenBalance';
import { type Address } from 'viem';

interface UseEnhancedBalanceRefreshProps {
  tokenAddress: Address | undefined;
  accountAddress: Address | undefined;
  enabled?: boolean;
  chainName?: string;
  isAfterCrossChainTx?: boolean;
}

/**
 * Enhanced balance refresh hook with manual refresh and adaptive polling
 * Optimized for cross-chain scenarios where balance updates may be delayed
 */
export function useEnhancedBalanceRefresh({
  tokenAddress,
  accountAddress,
  enabled = true,
  chainName = 'Unknown',
  isAfterCrossChainTx = false,
}: UseEnhancedBalanceRefreshProps) {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);

  // Adaptive polling - faster after cross-chain transactions
  const refetchInterval = isAfterCrossChainTx ? 2000 : 5000; // 2s vs 5s
  const staleTime = isAfterCrossChainTx ? 1000 : 30000; // 1s vs 30s

  // Use the existing token balance hook with enhanced polling
  const {
    balance,
    error,
    isLoading,
    isError,
    refetch,
  } = useTokenBalance({
    tokenAddress: tokenAddress || '0x0000000000000000000000000000000000000000',
    accountAddress,
    enabled: enabled && !!tokenAddress && !!accountAddress,
    refetchInterval,
  });

  // Manual refresh function with loading state
  const handleManualRefresh = useCallback(async () => {
    if (!tokenAddress || !accountAddress) return;

    setIsManualRefreshing(true);
    setLastRefreshTime(Date.now());
    
    try {
      console.log(`🔄 Manual refresh: ${chainName} balance...`);
      await refetch();
    } catch (error) {
      console.error(`❌ Manual refresh failed for ${chainName}:`, error);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch, tokenAddress, accountAddress, chainName]);

  // Auto-refresh after successful refetch
  useEffect(() => {
    if (!isLoading && !isError && balance !== undefined) {
      console.log(`✅ ${chainName} balance updated: ${balance.toString()}`);
    }
  }, [balance, isLoading, isError, chainName]);

  return {
    // Balance data
    balance,
    error,
    isLoading,
    isError,
    
    // Refresh functionality
    refetch,
    handleManualRefresh,
    isManualRefreshing,
    lastRefreshTime,
    
    // Configuration info
    isEnhancedPolling: isAfterCrossChainTx,
    refetchInterval,
    staleTime,
  };
}

/**
 * Multi-chain balance refresh for cross-chain scenarios
 * Manages balances on multiple networks with enhanced refresh
 */
export function useMultiChainBalanceRefresh({
  chains,
  accountAddress,
  enabled = true,
  isAfterCrossChainTx = false,
}: {
  chains: Array<{
    chainId: number;
    tokenAddress: Address;
    chainName: string;
  }>;
  accountAddress: Address | undefined;
  enabled?: boolean;
  isAfterCrossChainTx?: boolean;
}) {
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Create enhanced balance hooks for each chain
  const balanceHooks = chains.map(chain => 
    useEnhancedBalanceRefresh({
      tokenAddress: chain.tokenAddress,
      accountAddress,
      enabled,
      chainName: chain.chainName,
      isAfterCrossChainTx,
    })
  );

  // Manual refresh all chains
  const refreshAllChains = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      console.log('🔄 Refreshing all chain balances...');
      await Promise.all(
        balanceHooks.map(hook => hook.handleManualRefresh())
      );
      console.log('✅ All chain balances refreshed!');
    } catch (error) {
      console.error('❌ Failed to refresh all chains:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [balanceHooks]);

  // Calculate total balance across all chains
  const totalBalance = balanceHooks.reduce((sum, hook) => {
    return sum + (hook.balance || 0n);
  }, 0n);

  return {
    // Individual chain data
    chains: balanceHooks.map((hook, index) => ({
      ...chains[index],
      ...hook,
    })),
    
    // Aggregate data
    totalBalance,
    isAnyLoading: balanceHooks.some(hook => hook.isLoading),
    hasAnyError: balanceHooks.some(hook => hook.isError),
    
    // Global refresh
    refreshAllChains,
    isRefreshingAll,
    
    // Enhanced polling status
    isEnhancedPolling: isAfterCrossChainTx,
  };
} 