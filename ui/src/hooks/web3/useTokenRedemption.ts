import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { RedemptionQueueABI } from '@/contracts/abis';
import { useActiveNetwork } from './useActiveNetwork';
import { type Address, formatUnits } from 'viem';
import { useState, useMemo, useEffect } from 'react';

interface UseTokenRedemptionProps {
  userAddress: Address | undefined;
}

// Type for redemption request (matches NEW contract struct with ID)
type RedemptionRequest = {
  id: bigint;
  user: Address;
  token: Address;
  sovaAmount: bigint;
  underlyingAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
};

export function useTokenRedemption({ userAddress }: UseTokenRedemptionProps) {
  const [lastRedemptionHash, setLastRedemptionHash] = useState<Address | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'redeeming'>('idle');

  // Get network-aware contract addresses
  const { getContractAddress } = useActiveNetwork();
  const redemptionQueueAddress = getContractAddress('redemptionQueue');

  // Write contract for redemption
  const {
    writeContract: redeemToken,
    data: redemptionHash,
    error: redemptionError,
    isPending: isRedeeming,
  } = useWriteContract();

  // Wait for redemption confirmation
  const {
    isLoading: isConfirmingRedemption,
    isSuccess: isRedemptionConfirmed,
    error: redemptionConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastRedemptionHash,
  });

  // Get user's redemption IDs
  const {
    data: userRedemptionIds,
    refetch: refetchRedemptionIds,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getUserRedemptions',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionQueueAddress),
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get all user's redemption details
  const {
    data: allRedemptionsRaw,
    refetch: refetchAllRedemptions,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getUserRedemptionDetails',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionQueueAddress),
      refetchInterval: 10000,
    },
  });

  // Get pending redemptions only
  const {
    data: pendingRedemptionsRaw,
    refetch: refetchPendingRedemptions,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getPendingRedemptions',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionQueueAddress),
      refetchInterval: 10000,
    },
  });

  // Parse all redemptions
  const allRedemptions: RedemptionRequest[] = useMemo(() => {
    if (!allRedemptionsRaw || !Array.isArray(allRedemptionsRaw)) return [];
    
    return allRedemptionsRaw.map((redemption: any) => ({
      id: redemption.id,
      user: redemption.user,
      token: redemption.token,
      sovaAmount: redemption.sovaAmount,
      underlyingAmount: redemption.underlyingAmount,
      requestTime: redemption.requestTime,
      fulfilled: redemption.fulfilled,
    }));
  }, [allRedemptionsRaw]);

  // Parse pending redemptions
  const pendingRedemptions: RedemptionRequest[] = useMemo(() => {
    if (!pendingRedemptionsRaw || !Array.isArray(pendingRedemptionsRaw)) return [];
    
    return pendingRedemptionsRaw.map((redemption: any) => ({
      id: redemption.id,
      user: redemption.user,
      token: redemption.token,
      sovaAmount: redemption.sovaAmount,
      underlyingAmount: redemption.underlyingAmount,
      requestTime: redemption.requestTime,
      fulfilled: redemption.fulfilled,
    }));
  }, [pendingRedemptionsRaw]);

  // Get the most recent redemption for backward compatibility
  const redemptionRequest: RedemptionRequest | null = useMemo(() => {
    if (pendingRedemptions.length === 0) return null;
    // Return the most recent pending redemption
    return pendingRedemptions.reduce((latest, current) => 
      current.requestTime > latest.requestTime ? current : latest
    );
  }, [pendingRedemptions]);

  // Check if any redemption is ready (for the most recent one for backward compatibility)
  const {
    data: isRedemptionReady,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'isRedemptionReady',
    args: redemptionRequest ? [redemptionRequest.id] : undefined,
    query: {
      enabled: Boolean(redemptionRequest),
      refetchInterval: 30000,
    },
  });

  // Get when redemption will be ready (for most recent)
  const {
    data: redemptionReadyTime,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getRedemptionReadyTime',
    args: redemptionRequest ? [redemptionRequest.id] : undefined,
    query: {
      enabled: Boolean(redemptionRequest),
    },
  });

  // Get available reserve for a token
  const useAvailableReserve = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: redemptionQueueAddress,
      abi: RedemptionQueueABI,
      functionName: 'getAvailableReserve',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress && redemptionQueueAddress),
        refetchInterval: 30000,
      },
    });
  };

  // Execute redemption (returns redemption ID now)
  const executeRedemption = async (tokenAddress: Address, sovaAmount: bigint) => {
    try {
      if (!redemptionQueueAddress) {
        throw new Error('Redemption queue contract address not found for current network');
      }

      setCurrentStep('redeeming');
      
      console.log('🔄 EXECUTING REDEMPTION (Multi-Redemption API):', {
        contractAddress: redemptionQueueAddress,
        function: 'redeem',
        tokenAddress,
        sovaAmount: sovaAmount.toString(),
        note: 'Burns sovaBTC immediately, queues redemption with unique ID'
      });
      
      await redeemToken({
        address: redemptionQueueAddress,
        abi: RedemptionQueueABI,
        functionName: 'redeem',
        args: [tokenAddress, sovaAmount],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('❌ REDEMPTION FAILED:', error);
      throw error;
    }
  };

  // Track redemption hash changes
  useEffect(() => {
    if (redemptionHash && redemptionHash !== lastRedemptionHash) {
      setLastRedemptionHash(redemptionHash);
    }
  }, [redemptionHash, lastRedemptionHash]);

  // Reset step and refetch when redemption confirms
  useEffect(() => {
    if (isRedemptionConfirmed) {
      setCurrentStep('idle');
      // Refetch all redemption data
      refetchRedemptionIds();
      refetchAllRedemptions();
      refetchPendingRedemptions();
    }
  }, [isRedemptionConfirmed, refetchRedemptionIds, refetchAllRedemptions, refetchPendingRedemptions]);

  // Validate redemption parameters (UPDATED: No longer blocks multiple redemptions)
  const validateRedemption = useMemo(() => {
    return (tokenAddress: Address, sovaAmount: bigint, availableReserve: bigint, tokenDecimals: number) => {
      if (!userAddress) {
        return { isValid: false, error: 'Wallet not connected' };
      }
      
      if (sovaAmount <= 0n) {
        return { isValid: false, error: 'Amount must be greater than 0' };
      }

      // REMOVED: No longer block multiple redemptions!
      // Users can now have unlimited pending redemptions
      
      // Calculate expected underlying amount
      let expectedUnderlyingAmount: bigint;
      if (tokenDecimals === 8) {
        expectedUnderlyingAmount = sovaAmount;
      } else if (tokenDecimals < 8) {
        expectedUnderlyingAmount = sovaAmount / (10n ** BigInt(8 - tokenDecimals));
      } else {
        expectedUnderlyingAmount = sovaAmount * (10n ** BigInt(tokenDecimals - 8));
      }
      
      if (expectedUnderlyingAmount > availableReserve) {
        return { 
          isValid: false, 
          error: `Insufficient reserve. Available: ${formatUnits(availableReserve, tokenDecimals)} tokens` 
        };
      }
      
      return { isValid: true, error: null };
    };
  }, [userAddress]); // Removed redemptionRequest dependency

  // Calculate expected underlying amount for preview
  const calculateUnderlyingAmount = (sovaAmount: bigint, tokenDecimals: number): bigint => {
    if (tokenDecimals === 8) {
      return sovaAmount; // 1:1 conversion
    } else if (tokenDecimals < 8) {
      return sovaAmount / (10n ** BigInt(8 - tokenDecimals));
    } else {
      return sovaAmount * (10n ** BigInt(tokenDecimals - 8));
    }
  };

  // Get overall status
  const getOverallStatus = () => {
    if (currentStep === 'redeeming' || isRedeeming || isConfirmingRedemption) return 'redeeming';
    if (isRedemptionConfirmed) return 'confirmed';
    if (redemptionError || redemptionConfirmError) return 'error';
    return 'idle';
  };

  // Calculate time remaining for redemption (for most recent)
  const getTimeRemaining = () => {
    if (!redemptionReadyTime || !redemptionRequest) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const readyTime = Number(redemptionReadyTime);
    
    if (now >= readyTime) return 0;
    return readyTime - now;
  };

  return {
    // Actions
    executeRedemption,
    validateRedemption,
    calculateUnderlyingAmount,
    useAvailableReserve,
    refetchRedemptionRequest: refetchAllRedemptions, // Refetch all redemptions
    
    // Multi-redemption data (NEW)
    allRedemptions,
    pendingRedemptions,
    userRedemptionIds: userRedemptionIds as bigint[] || [],
    redemptionCount: allRedemptions.length,
    pendingCount: pendingRedemptions.length,
    
    // Current redemption state (backward compatibility - most recent)
    redemptionRequest,
    isRedemptionReady,
    redemptionReadyTime,
    timeRemaining: getTimeRemaining(),
    
    // Transaction status
    overallStatus: getOverallStatus(),
    isRedeeming: currentStep === 'redeeming' || isRedeeming || isConfirmingRedemption,
    isRedemptionConfirmed,
    
    // Errors
    error: redemptionError || redemptionConfirmError,
    
    // Transaction hash
    redemptionHash: lastRedemptionHash,
    
    // Helper flags (UPDATED)
    hasPendingRedemption: pendingRedemptions.length > 0, // True if ANY pending redemptions
    hasMultipleRedemptions: allRedemptions.length > 1, // True if multiple redemptions exist
  };
} 