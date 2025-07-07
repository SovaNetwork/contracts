import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { RedemptionQueueABI } from '@/contracts/abis';
import { useActiveNetwork } from './useActiveNetwork';
import { type Address } from 'viem';
import { useState, useMemo } from 'react';

interface UseCustodianOperationsProps {
  userAddress: Address | undefined;
}

// Type for redemption request
interface RedemptionRequest {
  id: bigint;
  user: string;
  token: string;
  sovaAmount: bigint;
  underlyingAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
}

export function useCustodianOperations({ userAddress }: UseCustodianOperationsProps) {
  const [lastFulfillmentHash, setLastFulfillmentHash] = useState<Address | undefined>();

  // Get network-aware contract addresses
  const { getContractAddress } = useActiveNetwork();
  const redemptionQueueAddress = getContractAddress('redemptionQueue');

  // Write contract for single fulfillment
  const {
    writeContract: fulfillRedemption,
    data: fulfillmentHash,
    error: fulfillmentError,
    isPending: isFulfilling,
  } = useWriteContract();

  // Write contract for batch fulfillment
  const {
    writeContract: batchFulfillRedemptions,
    data: batchFulfillmentHash,
    error: batchFulfillmentError,
    isPending: isBatchFulfilling,
  } = useWriteContract();

  // Wait for fulfillment confirmation
  const {
    isLoading: isConfirmingFulfillment,
    isSuccess: isFulfillmentConfirmed,
    error: fulfillmentConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastFulfillmentHash,
  });

  // Check if user is authorized as custodian
  const {
    data: isCustodian,
    refetch: refetchCustodianStatus,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'custodians',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && redemptionQueueAddress),
    },
  });

  // Get total redemption count to iterate through all redemptions
  const {
    data: totalRedemptionCount,
  } = useReadContract({
    address: redemptionQueueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getRedemptionCount',
    query: {
      enabled: Boolean(redemptionQueueAddress),
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Function to get a specific redemption by ID
  const useRedemptionById = (redemptionId: bigint | undefined) => {
    return useReadContract({
      address: redemptionQueueAddress,
      abi: RedemptionQueueABI,
      functionName: 'getRedemptionRequest',
      args: redemptionId ? [redemptionId] : undefined,
      query: {
        enabled: Boolean(redemptionId && redemptionQueueAddress),
      },
    });
  };

  // Function to check if redemption is ready
  const useIsRedemptionReady = (redemptionId: bigint | undefined) => {
    return useReadContract({
      address: redemptionQueueAddress,
      abi: RedemptionQueueABI,
      functionName: 'isRedemptionReady',
      args: redemptionId ? [redemptionId] : undefined,
      query: {
        enabled: Boolean(redemptionId && redemptionQueueAddress),
        refetchInterval: 30000,
      },
    });
  };

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

  // Execute single redemption fulfillment
  const executeFulfillment = async (redemptionId: bigint) => {
    try {
      if (!redemptionQueueAddress) {
        throw new Error('Redemption queue contract address not found for current network');
      }

      console.log('🚀 FULFILLING REDEMPTION:', {
        redemptionId: redemptionId.toString(),
        custodian: userAddress,
        contract: redemptionQueueAddress,
      });

      await fulfillRedemption({
        address: redemptionQueueAddress,
        abi: RedemptionQueueABI,
        functionName: 'fulfillRedemption',
        args: [redemptionId],
      });

      if (fulfillmentHash) {
        setLastFulfillmentHash(fulfillmentHash);
      }
    } catch (error) {
      console.error('❌ REDEMPTION FULFILLMENT FAILED:', error);
      throw error;
    }
  };

  // Execute batch redemption fulfillment
  const executeBatchFulfillment = async (redemptionIds: bigint[]) => {
    try {
      if (!redemptionQueueAddress) {
        throw new Error('Redemption queue contract address not found for current network');
      }

      console.log('🚀 BATCH FULFILLING REDEMPTIONS:', {
        redemptionIds: redemptionIds.map(id => id.toString()),
        count: redemptionIds.length,
        custodian: userAddress,
      });

      await batchFulfillRedemptions({
        address: redemptionQueueAddress,
        abi: RedemptionQueueABI,
        functionName: 'batchFulfillRedemptions',
        args: [redemptionIds],
      });

      if (batchFulfillmentHash) {
        setLastFulfillmentHash(batchFulfillmentHash);
      }
    } catch (error) {
      console.error('❌ BATCH REDEMPTION FULFILLMENT FAILED:', error);
      throw error;
    }
  };

  // Get overall status
  const getOverallStatus = () => {
    if (isFulfilling || isBatchFulfilling || isConfirmingFulfillment) return 'fulfilling';
    if (isFulfillmentConfirmed) return 'confirmed';
    if (fulfillmentError || batchFulfillmentError || fulfillmentConfirmError) return 'error';
    return 'idle';
  };

  // Get current error
  const currentError = fulfillmentError || batchFulfillmentError || fulfillmentConfirmError;

  // Get current hash
  const currentHash = lastFulfillmentHash;

  return {
    // Actions
    executeFulfillment,
    executeBatchFulfillment,
    refetchCustodianStatus,
    
    // Helper hooks
    useRedemptionById,
    useIsRedemptionReady,
    useAvailableReserve,
    
    // Authorization
    isCustodian: Boolean(isCustodian),
    
    // Data
    totalRedemptionCount: totalRedemptionCount ? Number(totalRedemptionCount) : 0,
    
    // Transaction status
    overallStatus: getOverallStatus(),
    isFulfilling: isFulfilling || isBatchFulfilling,
    isConfirmingFulfillment,
    isFulfillmentConfirmed,
    
    // Errors
    error: currentError,
    
    // Transaction hash
    fulfillmentHash: currentHash,
  };
} 