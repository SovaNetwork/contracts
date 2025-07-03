import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!tokenAddress,
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

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Symbol never changes
    },
  });

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Name never changes
    },
  });

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  // Format balance for display with appropriate precision
  const displayBalance = formattedBalance
    ? parseFloat(formattedBalance).toFixed(decimals === 6 ? 2 : 8)
    : '0';

  return {
    balance: balance || BigInt(0),
    formattedBalance,
    displayBalance,
    decimals: decimals || 18,
    symbol: symbol || 'TOKEN',
    name: name || 'Unknown Token',
    isLoading,
    error,
    refetch,
  };
}