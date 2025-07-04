import { useReadContract } from 'wagmi';
import SovaBTCWrapperABI from '../contracts/abis/SovaBTCWrapper.json';

export function useTokenWhitelist(
  wrapperAddress: `0x${string}`,
  tokenAddress: `0x${string}`
) {
  const { data: isAllowed, isLoading, error, refetch } = useReadContract({
    address: wrapperAddress,
    abi: SovaBTCWrapperABI,
    functionName: 'isTokenAllowed',
    args: [tokenAddress],
    query: {
      enabled: !!wrapperAddress && !!tokenAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  const { data: allowedTokens } = useReadContract({
    address: wrapperAddress,
    abi: SovaBTCWrapperABI,
    functionName: 'getAllowedTokens',
    query: {
      enabled: !!wrapperAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  return {
    isAllowed: isAllowed || false,
    allowedTokens: allowedTokens || [],
    isLoading,
    error,
    refetch,
  };
} 