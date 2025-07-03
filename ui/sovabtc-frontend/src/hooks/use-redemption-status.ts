import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import RedemptionQueueABI from '../contracts/abis/RedemptionQueue.json';

export interface RedemptionRequest {
  token: `0x${string}`;
  sovaAmount: bigint;
  tokenAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
}

export function useRedemptionStatus(queueAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data: redemptionRequest, isLoading, error, refetch } = useReadContract({
    address: queueAddress,
    abi: RedemptionQueueABI,
    functionName: 'pendingRedemptions',
    args: [address!],
    query: {
      enabled: !!address && !!queueAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000, // Cache for 5 seconds
    },
  });

  const { data: redemptionDelay } = useReadContract({
    address: queueAddress,
    abi: RedemptionQueueABI,
    functionName: 'redemptionDelay',
    query: {
      enabled: !!queueAddress,
      staleTime: 60000, // Cache for 1 minute (delay rarely changes)
    },
  });

  const { data: isReady } = useReadContract({
    address: queueAddress,
    abi: RedemptionQueueABI,
    functionName: 'isRedemptionReady',
    args: [address!],
    query: {
      enabled: !!address && !!queueAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  const { data: timeRemaining } = useReadContract({
    address: queueAddress,
    abi: RedemptionQueueABI,
    functionName: 'getTimeRemaining',
    args: [address!],
    query: {
      enabled: !!address && !!queueAddress && !isReady,
      refetchInterval: 1000, // Refresh every second for countdown
    },
  });

  // Calculate human-readable time remaining
  const formatTimeRemaining = (seconds: bigint | undefined): string => {
    if (!seconds || seconds === BigInt(0)) return '0s';
    
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Type guard for redemption request
  const typedRequest = redemptionRequest as RedemptionRequest | undefined;

  // Check if user has a pending redemption
  const hasPendingRedemption = typedRequest && 
    typedRequest.sovaAmount > BigInt(0) && 
    !typedRequest.fulfilled;

  // Format amounts for display
  const formattedSovaAmount = typedRequest
    ? formatUnits(typedRequest.sovaAmount, 8) // SovaBTC has 8 decimals
    : '0';

  const formattedTokenAmount = typedRequest
    ? formatUnits(typedRequest.tokenAmount, 8) // Assuming 8 decimals for most tokens
    : '0';

  return {
    redemptionRequest: typedRequest,
    redemptionDelay: Number(redemptionDelay || 0),
    isReady: !!isReady,
    timeRemaining: timeRemaining || BigInt(0),
    timeRemainingFormatted: formatTimeRemaining(timeRemaining as bigint | undefined),
    hasPendingRedemption,
    formattedSovaAmount,
    formattedTokenAmount,
    isLoading,
    error,
    refetch,
  };
}