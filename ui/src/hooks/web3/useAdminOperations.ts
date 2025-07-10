'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, parseEther, formatEther } from 'viem';
import { useActiveNetwork } from './useActiveNetwork';
import { getContractAddress } from '@/contracts/addresses';
import { TokenWhitelistABI } from '@/contracts/abis';
import { useWhitelistManager } from './useWhitelistManager';

export interface ProtocolHealthMetrics {
  totalSovaBTCSupply: bigint;
  totalValueLocked: bigint;
  activeRedemptions: number;
  totalStaked: bigint;
  bridgeVolume24h: bigint;
  wrapVolume24h: bigint;
  uniqueUsers24h: number;
  avgProcessingTime: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface WhitelistToken {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isActive: boolean;
  addedAt: Date;
  totalWrapped: bigint;
}

export interface EmergencyControlState {
  isPaused: boolean;
  pausedFunctions: string[];
  lastPauseTime?: Date;
  pauseReason?: string;
}

export function useAdminOperations() {
  const { address } = useAccount();
  const { activeChainId } = useActiveNetwork();
  const [protocolHealth, setProtocolHealth] = useState<ProtocolHealthMetrics | null>(null);
  const [whitelistTokens, setWhitelistTokens] = useState<WhitelistToken[]>([]);
  const [emergencyState, setEmergencyState] = useState<EmergencyControlState>({
    isPaused: false,
    pausedFunctions: [],
  });

  // Contract addresses
  const tokenWhitelistAddress = getContractAddress(activeChainId, 'tokenWhitelist');
  const sovaBTCAddress = getContractAddress(activeChainId, 'sovaBTC');
  const stakingAddress = getContractAddress(activeChainId, 'staking');
  const custodyManagerAddress = getContractAddress(activeChainId, 'custodyManager');

  // Write contract hook
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: sovaBTCAddress,
    abi: [
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'totalSupply',
  });

  // Read whitelist tokens
  const { data: whitelistCount } = useReadContract({
    address: tokenWhitelistAddress,
    abi: TokenWhitelistABI,
    functionName: 'getWhitelistCount',
  });

  // Protocol Health Monitoring
  const updateProtocolHealth = useCallback(async () => {
    try {
      // In a real implementation, these would be actual contract calls
      const health: ProtocolHealthMetrics = {
        totalSovaBTCSupply: totalSupply || 0n,
        totalValueLocked: parseEther('1250.5'), // Mock data
        activeRedemptions: 8,
        totalStaked: parseEther('450.2'),
        bridgeVolume24h: parseEther('125.8'),
        wrapVolume24h: parseEther('89.3'),
        uniqueUsers24h: 156,
        avgProcessingTime: 2.3, // minutes
        systemStatus: 'healthy',
        lastUpdated: new Date(),
      };

      setProtocolHealth(health);
    } catch (error) {
      console.error('Failed to update protocol health:', error);
    }
  }, [totalSupply]);

  // Whitelist Management
  const addTokenToWhitelist = useCallback(async (
    tokenAddress: Address,
    symbol: string,
    name: string,
    decimals: number
  ) => {
    if (!tokenWhitelistAddress) return;

    try {
      await writeContract({
        address: tokenWhitelistAddress,
        abi: TokenWhitelistABI,
        functionName: 'addToken',
        args: [tokenAddress, symbol, name, decimals],
      });
    } catch (error) {
      console.error('Failed to add token to whitelist:', error);
      throw error;
    }
  }, [tokenWhitelistAddress, writeContract]);

  const removeTokenFromWhitelist = useCallback(async (tokenAddress: Address) => {
    if (!tokenWhitelistAddress) return;

    try {
      await writeContract({
        address: tokenWhitelistAddress,
        abi: TokenWhitelistABI,
        functionName: 'removeToken',
        args: [tokenAddress],
      });
    } catch (error) {
      console.error('Failed to remove token from whitelist:', error);
      throw error;
    }
  }, [tokenWhitelistAddress, writeContract]);

  // Emergency Controls
  const pauseProtocol = useCallback(async (reason: string) => {
    if (!custodyManagerAddress) return;

    try {
      await writeContract({
        address: custodyManagerAddress,
        abi: [
          {
            inputs: [],
            name: 'pause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'pause',
      });

      setEmergencyState({
        isPaused: true,
        pausedFunctions: ['wrap', 'bridge', 'redeem'],
        lastPauseTime: new Date(),
        pauseReason: reason,
      });
    } catch (error) {
      console.error('Failed to pause protocol:', error);
      throw error;
    }
  }, [custodyManagerAddress, writeContract]);

  const unpauseProtocol = useCallback(async () => {
    if (!custodyManagerAddress) return;

    try {
      await writeContract({
        address: custodyManagerAddress,
        abi: [
          {
            inputs: [],
            name: 'unpause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'unpause',
      });

      setEmergencyState({
        isPaused: false,
        pausedFunctions: [],
      });
    } catch (error) {
      console.error('Failed to unpause protocol:', error);
      throw error;
    }
  }, [custodyManagerAddress, writeContract]);

  // Data Export
  const exportProtocolData = useCallback(async (format: 'json' | 'csv') => {
    try {
      const data = {
        protocolHealth,
        whitelistTokens,
        emergencyState,
        exportTimestamp: new Date().toISOString(),
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sova-protocol-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export would be implemented here
        console.log('CSV export not implemented yet');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, [protocolHealth, whitelistTokens, emergencyState]);

  // Update protocol health periodically
  useEffect(() => {
    updateProtocolHealth();
    const interval = setInterval(updateProtocolHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateProtocolHealth]);

  // Load whitelist tokens
  useEffect(() => {
    if (whitelistCount) {
      // In a real implementation, this would load actual whitelist data
      const mockTokens: WhitelistToken[] = [
        {
          address: '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2',
          symbol: 'WBTC',
          name: 'Wrapped Bitcoin',
          decimals: 8,
          isActive: true,
          addedAt: new Date('2024-01-01'),
          totalWrapped: parseEther('245.8'),
        },
        {
          address: '0xf6E78618CA4bAA67259970039F49e215f15820FE',
          symbol: 'LBTC',
          name: 'Liquid Bitcoin',
          decimals: 8,
          isActive: true,
          addedAt: new Date('2024-01-15'),
          totalWrapped: parseEther('89.3'),
        },
        {
          address: '0x0C19b539bc7C323Bec14C0A153B21D1295A42e38',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          isActive: true,
          addedAt: new Date('2024-02-01'),
          totalWrapped: parseEther('1250.5'),
        },
      ];
      setWhitelistTokens(mockTokens);
    }
  }, [whitelistCount]);

  return {
    // Protocol Health
    protocolHealth,
    updateProtocolHealth,
    
    // Whitelist Management
    whitelistTokens,
    addTokenToWhitelist,
    removeTokenFromWhitelist,
    
    // Emergency Controls
    emergencyState,
    pauseProtocol,
    unpauseProtocol,
    
    // Data Export
    exportProtocolData,
    
    // Transaction State
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export type AdminOperations = ReturnType<typeof useAdminOperations>; 