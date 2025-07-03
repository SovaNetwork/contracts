import { useChainId } from 'wagmi';
import { useTokenBalance } from './use-token-balance';
import { CONTRACT_ADDRESSES } from '@/contracts/config';
import { formatUnits } from 'viem';

export function useMultiChainSovaBTCBalances() {
  const currentChainId = useChainId();
  
  // Get SovaBTC balances on all supported chains
  const baseBalance = useTokenBalance(
    CONTRACT_ADDRESSES[84532]?.SOVABTC as `0x${string}` // Base Sepolia
  );
  
  const ethereumBalance = useTokenBalance(
    CONTRACT_ADDRESSES[11155111]?.SOVABTC as `0x${string}` // Ethereum Sepolia
  );

  // Calculate total balance across all chains
  const totalBalance = baseBalance.balance + ethereumBalance.balance;
  const totalFormatted = formatUnits(totalBalance, 8); // SovaBTC has 8 decimals

  return {
    balances: {
      base: baseBalance,
      ethereum: ethereumBalance,
    },
    totalBalance,
    totalFormatted,
    displayTotal: parseFloat(totalFormatted).toFixed(6),
    isLoading: baseBalance.isLoading || ethereumBalance.isLoading,
    hasAnyBalance: totalBalance > BigInt(0),
    
    // Chain-specific data
    currentChainBalance: currentChainId === 84532 ? baseBalance : ethereumBalance,
    
    // Refresh all balances
    refetchAll: () => {
      baseBalance.refetch();
      ethereumBalance.refetch();
    },
  };
}

export function useTestTokenBalances() {
  const chainId = useChainId();
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  const wbtcBalance = useTokenBalance(addresses?.WBTC_TEST as `0x${string}`);
  const lbtcBalance = useTokenBalance(addresses?.LBTC_TEST as `0x${string}`);
  const usdcBalance = useTokenBalance(addresses?.USDC_TEST as `0x${string}`);

  return {
    tokens: {
      WBTC: wbtcBalance,
      LBTC: lbtcBalance,
      USDC: usdcBalance,
    },
    isLoading: wbtcBalance.isLoading || lbtcBalance.isLoading || usdcBalance.isLoading,
    hasAnyBalance: wbtcBalance.hasBalance || lbtcBalance.hasBalance || usdcBalance.hasBalance,
    
    // Refresh all token balances
    refetchAll: () => {
      wbtcBalance.refetch();
      lbtcBalance.refetch();
      usdcBalance.refetch();
    },
  };
}

export function useAllBalances() {
  const sovaBTCBalances = useMultiChainSovaBTCBalances();
  const testTokenBalances = useTestTokenBalances();

  return {
    sovaBTC: sovaBTCBalances,
    testTokens: testTokenBalances,
    
    // Combined state
    isLoading: sovaBTCBalances.isLoading || testTokenBalances.isLoading,
    
    // Refresh everything
    refetchAll: () => {
      sovaBTCBalances.refetchAll();
      testTokenBalances.refetchAll();
    },
  };
}