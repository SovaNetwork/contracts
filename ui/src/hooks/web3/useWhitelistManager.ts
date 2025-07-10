'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, getAddress } from 'viem';
import { useActiveNetwork } from './useActiveNetwork';
import { getContractAddresses } from '@/contracts/abis';
import { TokenWhitelistABI, ERC20_ABI } from '@/contracts/abis';

export interface WhitelistToken {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isActive: boolean;
  addedAt: Date;
  totalWrapped: bigint;
}

export interface WhitelistManager {
  tokens: WhitelistToken[];
  isLoading: boolean;
  error: Error | null;
  addToken: (address: Address) => Promise<void>;
  removeToken: (address: Address) => Promise<void>;
  refreshTokens: () => Promise<void>;
  isTokenAllowed: (address: Address) => boolean;
  
  // Transaction state
  isTransactionPending: boolean;
  transactionHash: string | null;
  isTransactionSuccess: boolean;
}

// Known tokens to check across networks
const KNOWN_TOKENS_BY_NETWORK = {
  84532: [ // Base Sepolia
    '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2', // mockWBTC
    '0xf6E78618CA4bAA67259970039F49e215f15820FE', // mockLBTC
    '0x0C19b539bc7C323Bec14C0A153B21D1295A42e38', // mockUSDC
  ],
  11155420: [ // Optimism Sepolia
    '0x6f5249F8507445F1F0178eD162097bc4a262404E', // mockWBTC
    '0xBc2945fa12bF06fC292dac00BbbaF1e52eFD5A22', // mockLBTC
    '0xA57484Ac87b23668A19f388eB5812cCc5A8D1EEe', // mockUSDC
  ],
};

export function useWhitelistManager(): WhitelistManager {
  const { activeChainId } = useActiveNetwork();
  const [tokens, setTokens] = useState<WhitelistToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get contract addresses
  const contractAddresses = getContractAddresses(activeChainId);
  const tokenWhitelistAddress = contractAddresses.tokenWhitelist;

  // Contract write operations
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get known tokens for current network
  const knownTokenAddresses = KNOWN_TOKENS_BY_NETWORK[activeChainId as keyof typeof KNOWN_TOKENS_BY_NETWORK] || [];

  // Check if token is allowed (for each known token)
  const tokenChecks = knownTokenAddresses.map(tokenAddress => {
    const { data: isAllowed } = useReadContract({
      address: tokenWhitelistAddress,
      abi: TokenWhitelistABI,
      functionName: 'isTokenAllowed',
      args: [tokenAddress as Address],
    });

    const { data: decimals } = useReadContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    const { data: symbol } = useReadContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'symbol',
    });

    const { data: name } = useReadContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'name',
    });

    return {
      address: tokenAddress as Address,
      isAllowed: isAllowed || false,
      decimals: (decimals as number) || 18,
      symbol: (symbol as string) || 'UNKNOWN',
      name: (name as string) || 'Unknown Token',
    };
  });

  // Load tokens from contract
  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const whitelistTokens: WhitelistToken[] = [];
      
      for (const tokenCheck of tokenChecks) {
        if (tokenCheck.isAllowed) {
          whitelistTokens.push({
            address: tokenCheck.address,
            symbol: tokenCheck.symbol,
            name: tokenCheck.name,
            decimals: tokenCheck.decimals,
            isActive: true,
            addedAt: new Date(), // We can't get the actual add date from current contract
            totalWrapped: 0n, // Would need to track this separately
          });
        }
      }
      
      setTokens(whitelistTokens);
    } catch (err) {
      console.error('Failed to load whitelist tokens:', err);
      setError(err instanceof Error ? err : new Error('Failed to load tokens'));
    } finally {
      setIsLoading(false);
    }
  }, [tokenChecks]);

  // Add token to whitelist
  const addToken = useCallback(async (address: Address) => {
    try {
      await writeContract({
        address: tokenWhitelistAddress,
        abi: TokenWhitelistABI,
        functionName: 'addAllowedToken',
        args: [address],
      });
    } catch (err) {
      console.error('Failed to add token to whitelist:', err);
      throw err;
    }
  }, [tokenWhitelistAddress, writeContract]);

  // Remove token from whitelist
  const removeToken = useCallback(async (address: Address) => {
    try {
      await writeContract({
        address: tokenWhitelistAddress,
        abi: TokenWhitelistABI,
        functionName: 'removeAllowedToken',
        args: [address],
      });
    } catch (err) {
      console.error('Failed to remove token from whitelist:', err);
      throw err;
    }
  }, [tokenWhitelistAddress, writeContract]);

  // Check if token is allowed
  const isTokenAllowed = useCallback((address: Address) => {
    return tokens.some(token => 
      token.address.toLowerCase() === address.toLowerCase() && token.isActive
    );
  }, [tokens]);

  // Refresh tokens (re-fetch from contract)
  const refreshTokens = useCallback(async () => {
    await loadTokens();
  }, [loadTokens]);

  // Load tokens on mount and when network changes
  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Refresh tokens after successful transaction
  useEffect(() => {
    if (isSuccess) {
      // Delay refresh to allow blockchain to update
      setTimeout(() => {
        refreshTokens();
      }, 2000);
    }
  }, [isSuccess, refreshTokens]);

  return {
    tokens,
    isLoading,
    error: error || writeError,
    addToken,
    removeToken,
    refreshTokens,
    isTokenAllowed,
    
    // Transaction state
    isTransactionPending: isPending || isConfirming,
    transactionHash: hash || null,
    isTransactionSuccess: isSuccess,
  };
}

// Additional hook for checking individual tokens
export function useTokenWhitelistStatus(tokenAddress: Address | null) {
  const { activeChainId } = useActiveNetwork();
  const contractAddresses = getContractAddresses(activeChainId);
  
  const { data: isAllowed, isLoading } = useReadContract({
    address: contractAddresses.tokenWhitelist,
    abi: TokenWhitelistABI,
    functionName: 'isTokenAllowed',
    args: tokenAddress ? [tokenAddress] : undefined,
  });

  const { data: decimals } = useReadContract({
    address: contractAddresses.tokenWhitelist,
    abi: TokenWhitelistABI,
    functionName: 'getTokenDecimals',
    args: tokenAddress ? [tokenAddress] : undefined,
  });

  return {
    isAllowed: tokenAddress ? (isAllowed || false) : false,
    decimals: tokenAddress ? ((decimals as number) || 18) : 18,
    isLoading: tokenAddress ? isLoading : false,
  };
} 