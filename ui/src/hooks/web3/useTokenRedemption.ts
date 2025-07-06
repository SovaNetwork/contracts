import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { RedemptionQueueABI } from '@/contracts/abis';
import { ADDRESSES } from '@/contracts/addresses';
import { type Address, formatUnits } from 'viem';
import { useState, useMemo, useEffect } from 'react';

interface UseTokenRedemptionProps {
  userAddress: Address | undefined;
}

// Type for redemption request (matches contract struct)
type RedemptionRequest = {
  user: Address;
  token: Address;
  sovaAmount: bigint;
  underlyingAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
} | null;

export function useTokenRedemption({ userAddress }: UseTokenRedemptionProps) {
  const [lastRedemptionHash, setLastRedemptionHash] = useState<Address | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'redeeming'>('idle');

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

  // Get user's current redemption request
  const {
    data: redemptionRequestRaw,
    refetch: refetchRedemptionRequest,
  } = useReadContract({
    address: ADDRESSES.REDEMPTION_QUEUE,
    abi: RedemptionQueueABI,
    functionName: 'getRedemptionRequest',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress),
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Cast and validate redemption request data
  const redemptionRequest: RedemptionRequest = useMemo(() => {
    if (!redemptionRequestRaw || !Array.isArray(redemptionRequestRaw)) return null;
    
    const [user, token, sovaAmount, underlyingAmount, requestTime, fulfilled] = redemptionRequestRaw;
    
    // If requestTime is 0, no redemption exists
    if (!requestTime || requestTime === 0n) return null;
    
    return {
      user: user as Address,
      token: token as Address,
      sovaAmount: sovaAmount as bigint,
      underlyingAmount: underlyingAmount as bigint,
      requestTime: requestTime as bigint,
      fulfilled: fulfilled as boolean,
    };
  }, [redemptionRequestRaw]);

  // Check if redemption is ready to be fulfilled
  const {
    data: isRedemptionReady,
  } = useReadContract({
    address: ADDRESSES.REDEMPTION_QUEUE,
    abi: RedemptionQueueABI,
    functionName: 'isRedemptionReady',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionRequest && redemptionRequest.requestTime > 0),
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Get when redemption will be ready
  const {
    data: redemptionReadyTime,
  } = useReadContract({
    address: ADDRESSES.REDEMPTION_QUEUE,
    abi: RedemptionQueueABI,
    functionName: 'getRedemptionReadyTime',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionRequest && redemptionRequest.requestTime > 0),
    },
  });

  // Get available reserve for a token
  const useAvailableReserve = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: ADDRESSES.REDEMPTION_QUEUE,
      abi: RedemptionQueueABI,
      functionName: 'getAvailableReserve',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        refetchInterval: 30000,
      },
    });
  };

  // Execute redemption
  const executeRedemption = async (tokenAddress: Address, sovaAmount: bigint) => {
    try {
      setCurrentStep('redeeming');
      
      console.log('🔄 EXECUTING REDEMPTION:', {
        contractAddress: ADDRESSES.REDEMPTION_QUEUE,
        function: 'redeem',
        tokenAddress,
        sovaAmount: sovaAmount.toString(),
        note: 'Burns sovaBTC immediately, queues redemption'
      });
      
      await redeemToken({
        address: ADDRESSES.REDEMPTION_QUEUE,
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

  // Reset step when redemption confirms
  useEffect(() => {
    if (isRedemptionConfirmed) {
      setCurrentStep('idle');
      // Refetch redemption request after confirmation
      refetchRedemptionRequest();
    }
  }, [isRedemptionConfirmed, refetchRedemptionRequest]);

  // Validate redemption parameters
  const validateRedemption = useMemo(() => {
    return (tokenAddress: Address, sovaAmount: bigint, availableReserve: bigint, tokenDecimals: number) => {
      if (!userAddress) {
        return { isValid: false, error: 'Wallet not connected' };
      }
      
      if (sovaAmount <= 0n) {
        return { isValid: false, error: 'Amount must be greater than 0' };
      }

      // Check if user already has pending redemption
      if (redemptionRequest && redemptionRequest.requestTime > 0 && !redemptionRequest.fulfilled) {
        return { 
          isValid: false, 
          error: 'You already have a pending redemption. Please wait for it to complete.' 
        };
      }
      
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
  }, [userAddress, redemptionRequest]);

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

  // Calculate time remaining for redemption
  const getTimeRemaining = () => {
    if (!redemptionReadyTime || !redemptionRequest || !redemptionRequest.requestTime) return null;
    
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
    refetchRedemptionRequest,
    
    // Current redemption state
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
    
    // Helper flags
    hasPendingRedemption: Boolean(redemptionRequest && redemptionRequest.requestTime > 0 && !redemptionRequest.fulfilled),
  };
} 