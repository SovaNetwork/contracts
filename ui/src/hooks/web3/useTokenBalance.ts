import { useReadContract } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis';
import { type Address } from 'viem';
import { POLLING_INTERVALS } from '@/lib/constants';

interface UseTokenBalanceProps {
  tokenAddress: Address;
  accountAddress: Address | undefined;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useTokenBalance({
  tokenAddress,
  accountAddress,
  enabled = true,
  refetchInterval = POLLING_INTERVALS.NORMAL,
}: UseTokenBalanceProps) {
  const {
    data: balance,
    error,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: enabled && !!accountAddress,
      refetchInterval,
      staleTime: 30 * 1000, // 30 seconds
    },
  });

  return {
    balance: balance as bigint | undefined,
    error,
    isLoading,
    isError,
    refetch,
  };
}

// Hook for getting multiple token balances
export function useMultipleTokenBalances({
  tokens,
  accountAddress,
  enabled = true,
}: {
  tokens: Address[];
  accountAddress: Address | undefined;
  enabled?: boolean;
}) {
  // Create individual balance queries
  const balance0 = useTokenBalance({
    tokenAddress: tokens[0],
    accountAddress,
    enabled: enabled && tokens.length > 0,
  });
  
  const balance1 = useTokenBalance({
    tokenAddress: tokens[1],
    accountAddress,
    enabled: enabled && tokens.length > 1,
  });
  
  const balance2 = useTokenBalance({
    tokenAddress: tokens[2],
    accountAddress,
    enabled: enabled && tokens.length > 2,
  });

  const balances = [balance0, balance1, balance2].slice(0, tokens.length);
  const isLoading = balances.some((balance) => balance.isLoading);
  const isError = balances.some((balance) => balance.isError);
  const errors = balances.map((balance) => balance.error).filter(Boolean);

  return {
    balances: balances.map((balance) => balance.balance),
    isLoading,
    isError,
    errors,
    refetch: () => {
      balances.forEach((balance) => balance.refetch());
    },
  };
} 