'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { 
  CHAIN_CONFIGS, 
  DEFAULT_CHAIN_ID, 
  getChainConfig, 
  isChainSupported,
  type ChainConfig,
  type SupportedChainId
} from '@/contracts/addresses';

// Network State Type
export type NetworkState = {
  // Current app state
  activeChainId: number;
  activeChainConfig: ChainConfig | undefined;
  
  // User's wallet state
  walletChainId: number | undefined;
  walletChainConfig: ChainConfig | undefined;
  
  // Network compatibility
  isNetworkSupported: boolean;
  isNetworkMismatch: boolean;
  
  // Helper functions
  switchToChain: (chainId: number) => Promise<void>;
  setActiveChain: (chainId: number) => void;
  getContractAddress: (contract: keyof ChainConfig['contracts']) => `0x${string}` | undefined;
  getSupportedTokens: () => ChainConfig['supportedTokens'][string][];
};

export function useActiveNetwork(): NetworkState {
  // Wallet connection state
  const walletChainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // App's active network state (independent of wallet)
  const [activeChainId, setActiveChainIdState] = useState<number>(DEFAULT_CHAIN_ID);

  // Get chain configurations
  const activeChainConfig = useMemo(() => getChainConfig(activeChainId), [activeChainId]);
  const walletChainConfig = useMemo(() => 
    walletChainId ? getChainConfig(walletChainId) : undefined, 
    [walletChainId]
  );

  // Network compatibility checks
  const isNetworkSupported = useMemo(() => 
    walletChainId ? isChainSupported(walletChainId) : true, 
    [walletChainId]
  );
  
  const isNetworkMismatch = useMemo(() => 
    isConnected && walletChainId !== activeChainId, 
    [isConnected, walletChainId, activeChainId]
  );

  // Update active chain (app-level network change)
  const setActiveChain = (chainId: number) => {
    if (!isChainSupported(chainId)) {
      console.log(`Network ${chainId} is not supported`);
      return;
    }
    
    setActiveChainIdState(chainId);
    
    const config = getChainConfig(chainId);
    console.log(`Switched to ${config?.name || 'Unknown Network'}`);
  };

  // Switch wallet to specific chain
  const switchToChain = async (chainId: number): Promise<void> => {
    if (!isChainSupported(chainId)) {
      console.log(`Network ${chainId} is not supported`);
      return;
    }

    if (!switchChain) {
      console.log('Network switching is not available');
      return;
    }

    try {
      switchChain({ chainId });
      // Don't show toast here - wagmi will handle the state updates
    } catch (error) {
      console.error('Failed to switch network:', error);
      console.log('Failed to switch network. Please try again.');
    }
  };

  // Get contract address for active chain - PRIORITIZE WALLET NETWORK
  const getContractAddress = (contract: keyof ChainConfig['contracts']): `0x${string}` | undefined => {
    // ALWAYS use wallet network if available, regardless of connection status
    // The wallet chain ID is the source of truth for where transactions will execute
    const chainToUse = walletChainId || activeChainId;
    const configToUse = getChainConfig(chainToUse);
    
    // Debug logging for network address resolution
    console.log('🔍 getContractAddress DEBUG (FIXED):', {
      contract,
      isConnected,
      walletChainId,
      activeChainId,
      chainToUse,
      address: configToUse?.contracts[contract],
      networkName: configToUse?.name,
      prioritizeWallet: walletChainId ? 'Using wallet network' : 'Using app network',
      expectedBaseSepoliaWrapper: '0x7a08aF83566724F59D81413f3bD572E58711dE7b',
      expectedOPSepoliaWrapper: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d',
      actualAddress: configToUse?.contracts[contract]
    });
    
    return configToUse?.contracts[contract];
  };

  // Get supported tokens for active chain - PRIORITIZE WALLET NETWORK
  const getSupportedTokensForChain = (): ChainConfig['supportedTokens'][string][] => {
    // ALWAYS use wallet network if available - this ensures tokens match the wallet's network
    const chainToUse = walletChainId || activeChainId;
    const configToUse = getChainConfig(chainToUse);
    
    console.log('🔍 getSupportedTokens DEBUG (FIXED):', {
      isConnected,
      walletChainId,
      activeChainId,
      chainToUse,
      networkName: configToUse?.name,
      tokenCount: configToUse ? Object.keys(configToUse.supportedTokens).length : 0,
      prioritizeWallet: walletChainId ? 'Using wallet network' : 'Using app network'
    });
    
    if (!configToUse) return [];
    return Object.values(configToUse.supportedTokens);
  };

  // Handle automatic network switching suggestions
  useEffect(() => {
    if (isNetworkMismatch && isConnected && !isSwitching) {
      const walletChainName = walletChainConfig?.name || 'Unknown';
      const activeChainName = activeChainConfig?.name || 'Unknown';
      
      // Only show mismatch warning for supported networks
      if (isNetworkSupported) {
        console.log(`Network mismatch: Wallet on ${walletChainName}, App on ${activeChainName}`);
        // We'll show this in the UI rather than as a toast to avoid spam
      } else {
        console.log(`Unsupported network: ${walletChainName}. Please switch to a supported network.`);
      }
    }
  }, [isNetworkMismatch, isConnected, isSwitching, isNetworkSupported, walletChainConfig?.name, activeChainConfig?.name]);

  // Auto-sync app network with wallet on first connection
  useEffect(() => {
    console.log('🔍 Auto-sync Effect DEBUG:', {
      isConnected,
      walletChainId,
      activeChainId,
      isChainSupported: walletChainId ? isChainSupported(walletChainId) : 'N/A',
      willAutoSync: isConnected && walletChainId && isChainSupported(walletChainId) && activeChainId === DEFAULT_CHAIN_ID
    });

    if (isConnected && walletChainId && isChainSupported(walletChainId)) {
      // ALWAYS auto-sync with wallet network - the wallet is the source of truth
      console.log(`🔄 Auto-syncing app network from ${activeChainId} to wallet network ${walletChainId}`);
      setActiveChainIdState(walletChainId);
    }
  }, [isConnected, walletChainId, activeChainId]);

  return {
    // State
    activeChainId,
    activeChainConfig,
    walletChainId,
    walletChainConfig,
    
    // Computed state
    isNetworkSupported,
    isNetworkMismatch,
    
    // Actions
    switchToChain,
    setActiveChain,
    getContractAddress,
    getSupportedTokens: getSupportedTokensForChain,
  };
}

// Hook for getting network-aware contract addresses
export function useContractAddress(contract: keyof ChainConfig['contracts']) {
  const { getContractAddress } = useActiveNetwork();
  return getContractAddress(contract);
}

// Hook for getting network-aware token list
export function useNetworkTokens() {
  const { getSupportedTokens, activeChainId } = useActiveNetwork();
  return {
    tokens: getSupportedTokens(),
    chainId: activeChainId,
  };
}

// Hook for network validation
export function useNetworkValidation() {
  const { isNetworkSupported, isNetworkMismatch, activeChainConfig, walletChainConfig } = useActiveNetwork();
  
  return {
    isNetworkSupported,
    isNetworkMismatch,
    canProceed: isNetworkSupported && !isNetworkMismatch,
    errorMessage: !isNetworkSupported 
      ? `Please switch to a supported network` 
      : isNetworkMismatch 
      ? `Please switch from ${walletChainConfig?.name} to ${activeChainConfig?.name}`
      : null,
  };
} 