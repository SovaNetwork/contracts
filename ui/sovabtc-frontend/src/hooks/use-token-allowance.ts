import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/contracts/abis';

export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined,
  tokenDecimals?: number
) {
  const { address: userAddress } = useAccount();

  // Get token allowance
  const { data: allowance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, spenderAddress!],
    query: {
      enabled: !!userAddress && !!tokenAddress && !!spenderAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000, // Consider stale after 5 seconds
    },
  });

  // Format allowance for display
  const formattedAllowance = allowance && tokenDecimals 
    ? formatUnits(allowance, tokenDecimals)
    : '0';

  // Check if allowance is sufficient for a given amount
  const hasAllowance = (requiredAmount: bigint) => {
    return allowance ? allowance >= requiredAmount : false;
  };

  // Check if allowance is infinite (max uint256)
  const isInfiniteAllowance = allowance === BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

  return {
    // Raw data
    allowance: allowance || BigInt(0),
    
    // Formatted data
    formattedAllowance,
    displayAllowance: parseFloat(formattedAllowance).toFixed(tokenDecimals && tokenDecimals <= 6 ? tokenDecimals : 6),
    
    // State
    isLoading,
    error,
    hasAnyAllowance: allowance ? allowance > BigInt(0) : false,
    isInfiniteAllowance,
    
    // Actions
    refetch,
    
    // Utility functions
    hasAllowance,
    needsApproval: (requiredAmount: bigint) => !hasAllowance(requiredAmount),
  };
}