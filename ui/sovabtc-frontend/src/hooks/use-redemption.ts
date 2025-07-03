import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  SOVABTC_ABI,
  REDEMPTION_QUEUE_ABI, 
  CONTRACT_ADDRESSES, 
  isSupportedChain,
  CONTRACT_CONFIG
} from '@/config/contracts';

// Type for redemption request data
interface RedemptionRequest {
  user: `0x${string}`;
  token: `0x${string}`;
  sovaAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
}

// Hook for redemption queue status
export function useRedemptionStatus() {
  const { address } = useAccount();
  const chainId = useChainId();

  if (!isSupportedChain(chainId) || !address) {
    return {
      redemptionRequest: null,
      redemptionDelay: 0,
      isReady: false,
      timeRemaining: 0,
      isLoading: false,
      error: new Error('Unsupported chain or no wallet connected'),
      refetch: () => {},
    };
  }

  const queueAddress = CONTRACT_ADDRESSES[chainId].REDEMPTION_QUEUE;

  // Get pending redemption request for user
  const { data: redemptionRequest, isLoading, error, refetch } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'pendingRedemptions',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Get global redemption delay
  const { data: redemptionDelay } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
    query: {
      staleTime: CONTRACT_CONFIG.STATIC_DATA_STALE_TIME,
    },
  });

  // Type guard for redemption request
  const isValidRedemptionRequest = (request: any): request is RedemptionRequest => {
    return request && 
           typeof request === 'object' &&
           'requestTime' in request &&
           'sovaAmount' in request &&
           request.sovaAmount > BigInt(0);
  };

  // Calculate if redemption is ready
  const currentTime = Math.floor(Date.now() / 1000);
  const validRequest = isValidRedemptionRequest(redemptionRequest) ? redemptionRequest : null;
  const isReady = validRequest && redemptionDelay
    ? currentTime >= (Number(validRequest.requestTime) + Number(redemptionDelay))
    : false;

  // Calculate time remaining
  const timeRemaining = validRequest && redemptionDelay
    ? Math.max(0, (Number(validRequest.requestTime) + Number(redemptionDelay)) - currentTime)
    : 0;

  return {
    redemptionRequest: validRequest,
    redemptionDelay: Number(redemptionDelay || 0),
    isReady,
    timeRemaining,
    isLoading,
    error,
    refetch,
  };
}

// Hook for requesting redemption
export function useRedemptionRequest() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestRedemption = async (
    tokenAddress: `0x${string}`,
    sovaAmount: string
  ) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const parsedAmount = parseUnits(sovaAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
    const queueAddress = CONTRACT_ADDRESSES[chainId].REDEMPTION_QUEUE;
    
    writeContract({
      address: queueAddress,
      abi: REDEMPTION_QUEUE_ABI,
      functionName: 'redeem',
      args: [tokenAddress, parsedAmount],
    });
  };

  return {
    requestRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for fulfilling redemption (once ready)
export function useFulfillRedemption() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillRedemption = async (userAddress?: `0x${string}`) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const queueAddress = CONTRACT_ADDRESSES[chainId].REDEMPTION_QUEUE;
    
    writeContract({
      address: queueAddress,
      abi: REDEMPTION_QUEUE_ABI,
      functionName: 'fulfillRedemption',
      args: userAddress ? [userAddress] : [],
    });
  };

  return {
    fulfillRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for WBTC redemption specifically
export function useWBTCRedemption() {
  const chainId = useChainId();
  const redemptionRequest = useRedemptionRequest();
  
  const redeemToWBTC = async (sovaAmount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const wbtcAddress = CONTRACT_ADDRESSES[chainId].WBTC_TEST;
    await redemptionRequest.requestRedemption(wbtcAddress, sovaAmount);
  };

  return {
    redeemToWBTC,
    ...redemptionRequest,
  };
}

// Hook for LBTC redemption specifically
export function useLBTCRedemption() {
  const chainId = useChainId();
  const redemptionRequest = useRedemptionRequest();
  
  const redeemToLBTC = async (sovaAmount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const lbtcAddress = CONTRACT_ADDRESSES[chainId].LBTC_TEST;
    await redemptionRequest.requestRedemption(lbtcAddress, sovaAmount);
  };

  return {
    redeemToLBTC,
    ...redemptionRequest,
  };
}

// Hook for USDC redemption specifically
export function useUSDCRedemption() {
  const chainId = useChainId();
  const redemptionRequest = useRedemptionRequest();
  
  const redeemToUSDC = async (sovaAmount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const usdcAddress = CONTRACT_ADDRESSES[chainId].USDC_TEST;
    await redemptionRequest.requestRedemption(usdcAddress, sovaAmount);
  };

  return {
    redeemToUSDC,
    ...redemptionRequest,
  };
}

// Hook for redemption preparation and validation
export function useRedemptionPreparation(
  targetTokenAddress: `0x${string}` | undefined,
  sovaAmount: string
) {
  const chainId = useChainId();
  const { address } = useAccount();

  if (!isSupportedChain(chainId) || !address || !targetTokenAddress || !sovaAmount || sovaAmount === '0') {
    return {
      isValid: false,
      parsedAmount: BigInt(0),
      hasExistingRequest: false,
      canRequestRedemption: false,
    };
  }

  const parsedAmount = parseUnits(sovaAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
  const redemptionStatus = useRedemptionStatus();

  const hasExistingRequest = !!redemptionStatus.redemptionRequest;
  const canRequestRedemption = !hasExistingRequest;

  return {
    isValid: true,
    parsedAmount,
    hasExistingRequest,
    canRequestRedemption,
    redemptionStatus,
  };
}

// Hook for redemption countdown display
export function useRedemptionCountdown() {
  const redemptionStatus = useRedemptionStatus();

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDelay = (delayInSeconds: number): string => {
    const hours = Math.floor(delayInSeconds / 3600);
    const minutes = Math.floor((delayInSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${delayInSeconds} second${delayInSeconds !== 1 ? 's' : ''}`;
    }
  };

  return {
    ...redemptionStatus,
    formattedTimeRemaining: formatTimeRemaining(redemptionStatus.timeRemaining),
    formattedDelay: formatDelay(redemptionStatus.redemptionDelay),
  };
}

// Hook for complete redemption workflow
export function useRedemptionWorkflow() {
  const redemptionRequest = useRedemptionRequest();
  const fulfillment = useFulfillRedemption();
  const status = useRedemptionStatus();

  const executeRedemption = async (
    tokenAddress: `0x${string}`,
    sovaAmount: string
  ) => {
    // Step 1: Request redemption (this queues it)
    await redemptionRequest.requestRedemption(tokenAddress, sovaAmount);
  };

  const executeFulfillment = async () => {
    // Step 2: Fulfill redemption (once ready)
    await fulfillment.fulfillRedemption();
  };

  return {
    executeRedemption,
    executeFulfillment,
    redemptionRequest,
    fulfillment,
    status,
    isProcessing: redemptionRequest.isPending || redemptionRequest.isConfirming || 
                   fulfillment.isPending || fulfillment.isConfirming,
    currentStep: redemptionRequest.isPending || redemptionRequest.isConfirming ? 'requesting' :
                 fulfillment.isPending || fulfillment.isConfirming ? 'fulfilling' :
                 status.redemptionRequest && !status.isReady ? 'waiting' :
                 status.redemptionRequest && status.isReady ? 'ready' :
                 'idle',
  };
}

// Utility function to check if SovaBTC needs approval for redemption
export function useSovaBTCRedemptionApproval(sovaAmount: string) {
  const chainId = useChainId();
  const { address } = useAccount();

  if (!isSupportedChain(chainId) || !address || !sovaAmount || sovaAmount === '0') {
    return {
      needsApproval: false,
      allowance: BigInt(0),
      requiredAmount: BigInt(0),
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  const requiredAmount = parseUnits(sovaAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS);

  const { data: allowance } = useReadContract({
    address: addresses.SOVABTC,
    abi: SOVABTC_ABI,
    functionName: 'allowance',
    args: [address, addresses.REDEMPTION_QUEUE],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  const currentAllowance = (allowance as bigint) || BigInt(0);
  const needsApproval = currentAllowance < requiredAmount;

  return {
    needsApproval,
    allowance: currentAllowance,
    requiredAmount,
  };
} 