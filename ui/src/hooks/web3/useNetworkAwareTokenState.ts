'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { getCrossChainSupportedChains, getChainConfig } from '@/contracts/addresses';
import type { UnifiedToken } from '@/components/swap/UnifiedSwapInterface';

interface NetworkAwareTokenState {
  // Aggregated token list across all networks
  allTokens: UnifiedToken[];
  
  // Utility functions
  getTokensByNetwork: (chainId: number) => UnifiedToken[];
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export function useNetworkAwareTokenState(): NetworkAwareTokenState {
  const { address } = useAccount();
  const currentChainId = useChainId();
  
  // State for managing refresh triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get all supported chains
  const supportedChains = getCrossChainSupportedChains();
  
  // Generate comprehensive token list across all networks
  const allTokens = useMemo(() => {
    const tokenList: UnifiedToken[] = [];

    supportedChains.forEach(chain => {
      const chainConfig = getChainConfig(chain.chainId);
      if (!chainConfig) return;

      // Add wrappable tokens for each network
      Object.values(chainConfig.supportedTokens).forEach(token => {
        tokenList.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          network: {
            chainId: chain.chainId,
            name: chain.name,
            layerZeroEndpointId: chainConfig.layerZero?.eid || 0,
          },
          isSovaBTC: false,
          canWrap: true,
          canBridge: false,
          canStake: false,
          canRedeem: false,
        });
      });

      // Add sovaBTC for each network
      if (chainConfig.contracts.sovaBTC) {
        tokenList.push({
          address: chainConfig.contracts.sovaBTC,
          symbol: 'sovaBTC',
          name: 'Sovereign Bitcoin',
          decimals: 8,
          network: {
            chainId: chain.chainId,
            name: chain.name,
            layerZeroEndpointId: chainConfig.layerZero?.eid || 0,
          },
          isSovaBTC: true,
          canWrap: false,
          canBridge: true,
          canStake: true,
          canRedeem: true,
        });
      }
    });

    return tokenList;
  }, [supportedChains]);

  const getTokensByNetwork = (chainId: number): UnifiedToken[] => {
    return allTokens.filter(token => token.network.chainId === chainId);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Auto-refresh when user switches networks
  useEffect(() => {
    if (address && currentChainId) {
      triggerRefresh();
    }
  }, [address, currentChainId]);

  return {
    allTokens,
    getTokensByNetwork,
    refreshTrigger,
    triggerRefresh,
  };
} 