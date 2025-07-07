'use client';

import { useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { ERC20_ABI } from '@/contracts/abis';
import { getChainConfig } from '@/contracts/addresses';
import { formatTokenAmount } from '@/lib/formatters';

interface DestinationBalanceProps {
  destinationChainId: number;
  address: Address | undefined;
}

export function DestinationBalance({ destinationChainId, address }: DestinationBalanceProps) {
  const destinationConfig = getChainConfig(destinationChainId);
  const sovaBTCAddress = destinationConfig?.contracts.sovaBTC;

  const { data: balance, isLoading, error } = useReadContract({
    address: sovaBTCAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: destinationChainId,
    query: {
      enabled: Boolean(sovaBTCAddress && address),
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  if (isLoading) {
    return <span className="text-slate-400">Loading...</span>;
  }

  if (error) {
    return <span className="text-red-400">Error loading</span>;
  }

  return (
    <span className="text-slate-200">
      {formatTokenAmount(balance || 0n, 8)} sovaBTC
    </span>
  );
} 