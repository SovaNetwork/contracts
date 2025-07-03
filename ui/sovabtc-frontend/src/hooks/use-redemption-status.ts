import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/contracts/config';
import { useState, useEffect } from 'react';

export function useRedemptionStatus() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  // Get user's pending redemption
  const { data: redemptionData, isLoading: isRedemptionLoading, refetch: refetchRedemption } = useReadContract({
    address: addresses?.REDEMPTION_QUEUE as `0x${string}`,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'pendingRedemptions',
    args: [address!],
    query: {
      enabled: !!address && !!addresses,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Get redemption delay from contract
  const { data: redemptionDelay, isLoading: isDelayLoading } = useReadContract({
    address: addresses?.REDEMPTION_QUEUE as `0x${string}`,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
    query: {
      enabled: !!addresses,
      staleTime: 300000, // Cache for 5 minutes - this rarely changes
    },
  });

  // Check if redemption can be fulfilled
  const { data: canFulfill, isLoading: isFulfillLoading, refetch: refetchCanFulfill } = useReadContract({
    address: addresses?.REDEMPTION_QUEUE as `0x${string}`,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'canFulfillRedemption',
    args: [address!],
    query: {
      enabled: !!address && !!addresses && !!redemptionData,
      refetchInterval: 10000,
    },
  });

  // Calculate time remaining until fulfillment
  useEffect(() => {
    if (!redemptionData || !redemptionDelay) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      const requestTime = Number(redemptionData[2]); // requestTime is the third element
      const delaySeconds = Number(redemptionDelay);
      const fulfillmentTime = requestTime + delaySeconds;
      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, fulfillmentTime - currentTime);
      
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    
    // Update every second for countdown
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [redemptionData, redemptionDelay]);

  // Parse redemption data
  const parsedRedemption = redemptionData ? {
    tokenAddress: redemptionData[0] as `0x${string}`,
    amount: redemptionData[1] as bigint,
    requestTime: Number(redemptionData[2]),
    formattedAmount: formatUnits(redemptionData[1] as bigint, 8), // SovaBTC has 8 decimals
  } : null;

  // Get token metadata for display
  const getTokenMetadata = (tokenAddress: string) => {
    const testTokenAddresses = addresses ? {
      [addresses.WBTC_TEST]: TOKEN_METADATA.WBTC,
      [addresses.LBTC_TEST]: TOKEN_METADATA.LBTC,  
      [addresses.USDC_TEST]: TOKEN_METADATA.USDC,
    } : {};

    return testTokenAddresses[tokenAddress as keyof typeof testTokenAddresses] || {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
    };
  };

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ready for fulfillment';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return {
    // Raw data
    redemptionData: parsedRedemption,
    redemptionDelay: Number(redemptionDelay || 0),
    canFulfill: !!canFulfill,
    
    // Calculated data
    timeRemaining,
    isReady: timeRemaining <= 0 && !!parsedRedemption,
    hasActiveRedemption: !!parsedRedemption && parsedRedemption.amount > BigInt(0),
    
    // Formatted data
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),
    tokenMetadata: parsedRedemption ? getTokenMetadata(parsedRedemption.tokenAddress) : null,
    
    // State
    isLoading: isRedemptionLoading || isDelayLoading || isFulfillLoading,
    
    // Actions
    refetch: () => {
      refetchRedemption();
      refetchCanFulfill();
    },
  };
}