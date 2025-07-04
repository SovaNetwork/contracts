import { baseSepolia } from 'viem/chains';
import { formatUnits } from 'viem';
import { useTokenBalance } from './use-token-balance';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';

export function useMultiChainSovaBTCBalances() {
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

// This hook is currently disabled due to React hooks rules
// TODO: Implement proper multi-token balance fetching with fixed number of hooks
export function useTokenBalances() {
  // Placeholder implementation - would need to be restructured to avoid
  // calling hooks in loops which violates React hooks rules
  return {
    balances: [],
    isLoading: false,
    hasError: false,
    errors: [],
    refetch: () => {},
  };
}