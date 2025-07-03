import { useReadContract, useAccount, useChainId } from 'wagmi';
import { 
  ERC20_ABI, 
  CONTRACT_CONFIG, 
  CONTRACT_ADDRESSES, 
  isSupportedChain
} from '@/config/contracts';
import type { SupportedChainId } from '@/contracts/addresses';

// Hook for reading ERC20 token allowance
export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: allowance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, spenderAddress!],
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress && isSupportedChain(chainId),
      refetchInterval: CONTRACT_CONFIG.ALLOWANCE_REFRESH_INTERVAL,
    },
  });

  const hasAllowance = (allowance || BigInt(0)) > BigInt(0);
  const hasInfiniteAllowance = (allowance || BigInt(0)) >= CONTRACT_CONFIG.MAX_UINT256 / BigInt(2);

  return {
    allowance: allowance || BigInt(0),
    hasAllowance,
    hasInfiniteAllowance,
    isLoading,
    error,
    refetch,
  };
}

// Hook for wrapper contract allowances specifically
export function useWrapperAllowance(tokenAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      allowance: BigInt(0),
      hasAllowance: false,
      hasInfiniteAllowance: false,
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const wrapperAddress = CONTRACT_ADDRESSES[chainId].WRAPPER;
  
  return useTokenAllowance(tokenAddress, wrapperAddress);
}

// Hook for staking contract allowances (SovaBTC -> Staking)
export function useStakingAllowance() {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      allowance: BigInt(0),
      hasAllowance: false,
      hasInfiniteAllowance: false,
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  
  return useTokenAllowance(addresses.SOVABTC, addresses.STAKING);
}

// Hook to check if approval is needed for a specific amount
export function useApprovalCheck(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined,
  requiredAmount: bigint
) {
  const { allowance, isLoading, refetch } = useTokenAllowance(tokenAddress, spenderAddress);
  
  const needsApproval = allowance < requiredAmount;
  const shortfall = needsApproval ? requiredAmount - allowance : BigInt(0);

  return {
    needsApproval,
    shortfall,
    currentAllowance: allowance,
    isLoading,
    refetch,
  };
}

// Hook for multiple allowance checks for test tokens
export function useTestTokenAllowances() {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      wbtcAllowance: { allowance: BigInt(0), hasAllowance: false, isLoading: false, error: null },
      lbtcAllowance: { allowance: BigInt(0), hasAllowance: false, isLoading: false, error: null },
      usdcAllowance: { allowance: BigInt(0), hasAllowance: false, isLoading: false, error: null },
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  
  const wbtcAllowance = useWrapperAllowance(addresses.WBTC_TEST);
  const lbtcAllowance = useWrapperAllowance(addresses.LBTC_TEST);
  const usdcAllowance = useWrapperAllowance(addresses.USDC_TEST);

  return {
    wbtcAllowance: {
      ...wbtcAllowance,
      symbol: 'WBTC',
      name: 'Mock Wrapped Bitcoin',
    },
    lbtcAllowance: {
      ...lbtcAllowance,
      symbol: 'LBTC',
      name: 'Mock Liquid Bitcoin',
    },
    usdcAllowance: {
      ...usdcAllowance,
      symbol: 'USDC',
      name: 'Mock USD Coin',
    },
  };
}

// Hook for deposit approval workflow
export function useDepositApprovalCheck(
  tokenAddress: `0x${string}` | undefined,
  depositAmount: bigint
) {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      needsApproval: false,
      shortfall: BigInt(0),
      currentAllowance: BigInt(0),
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const wrapperAddress = CONTRACT_ADDRESSES[chainId].WRAPPER;
  
  return useApprovalCheck(tokenAddress, wrapperAddress, depositAmount);
}

// Hook for staking approval workflow
export function useStakingApprovalCheck(stakeAmount: bigint) {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId)) {
    return {
      needsApproval: false,
      shortfall: BigInt(0),
      currentAllowance: BigInt(0),
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  
  return useApprovalCheck(addresses.SOVABTC, addresses.STAKING, stakeAmount);
}

// Utility function to check if amount needs approval
export function needsApproval(currentAllowance: bigint, requiredAmount: bigint): boolean {
  return currentAllowance < requiredAmount;
}

// Utility function to calculate recommended approval amount
export function getRecommendedApprovalAmount(requiredAmount: bigint): bigint {
  // Approve 20% more than required to avoid frequent re-approvals
  return (requiredAmount * BigInt(120)) / BigInt(100);
}

// Hook for comprehensive allowance management
export function useAllowanceManager(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const allowanceData = useTokenAllowance(tokenAddress, spenderAddress);
  
  const checkAmount = (amount: bigint) => {
    return {
      needsApproval: needsApproval(allowanceData.allowance, amount),
      recommendedAmount: getRecommendedApprovalAmount(amount),
      shortfall: amount > allowanceData.allowance ? amount - allowanceData.allowance : BigInt(0),
    };
  };

  return {
    ...allowanceData,
    checkAmount,
    needsApproval: (amount: bigint) => needsApproval(allowanceData.allowance, amount),
    getRecommendedAmount: getRecommendedApprovalAmount,
  };
} 