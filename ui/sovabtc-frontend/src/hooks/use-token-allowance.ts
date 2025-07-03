import { useReadContract, useAccount } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';

export function useTokenAllowance(
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  const { address } = useAccount();

  const { data: allowance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, spenderAddress],
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000, // Cache for 5 seconds
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Decimals never change
    },
  });

  const formattedAllowance = allowance && decimals 
    ? formatUnits(allowance, decimals)
    : '0';

  // Check if the allowance is sufficient for a given amount
  const isAllowanceSufficient = (amountNeeded: bigint) => {
    if (!allowance) return false;
    return allowance >= amountNeeded;
  };

  return {
    allowance: allowance || BigInt(0),
    formattedAllowance,
    hasAllowance: (allowance || BigInt(0)) > BigInt(0),
    isAllowanceSufficient,
    isLoading,
    error,
    refetch,
  };
}