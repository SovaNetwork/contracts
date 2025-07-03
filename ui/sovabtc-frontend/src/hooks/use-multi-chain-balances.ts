import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { formatUnits } from 'viem';
import { useTokenBalance } from './use-token-balance';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';

export function useMultiChainSovaBTCBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Get SovaBTC balance on Base Sepolia
  const baseBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC);
  
  // For now, only support Base Sepolia
  // TODO: Add other chains when contracts are deployed
  const totalBalance = BigInt(baseBalance.balance);

  return {
    balances: {
      [baseSepolia.id]: baseBalance,
    },
    totalBalance,
    totalFormatted: formatUnits(totalBalance, 8), // SovaBTC has 8 decimals
    isLoading: baseBalance.isLoading,
    error: baseBalance.error,
    refetch: () => {
      baseBalance.refetch();
    },
  };
}

export function useTokenBalances(tokenAddresses: `0x${string}`[]) {
  const { address } = useAccount();
  
  const balances = tokenAddresses.map(tokenAddress => {
    const balance = useTokenBalance(tokenAddress);
    return {
      address: tokenAddress,
      ...balance,
    };
  });

  const isLoading = balances.some(balance => balance.isLoading);
  const hasError = balances.some(balance => balance.error);
  const errors = balances.filter(balance => balance.error).map(balance => balance.error);

  return {
    balances,
    isLoading,
    hasError,
    errors,
    refetch: () => {
      balances.forEach(balance => balance.refetch());
    },
  };
}