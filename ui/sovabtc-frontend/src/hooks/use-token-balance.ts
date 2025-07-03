import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/contracts/abis';
import { TOKEN_METADATA } from '@/contracts/config';

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  // Get token balance
  const { data: balance, isLoading: isBalanceLoading, error: balanceError, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: {
      enabled: !!userAddress && !!tokenAddress,
      refetchInterval: 5000, // Refresh every 5 seconds
      staleTime: 2000, // Consider stale after 2 seconds
    },
  });

  // Get token decimals
  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Decimals never change
    },
  });

  // Get token symbol
  const { data: symbol, isLoading: isSymbolLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Symbol never changes
    },
  });

  // Get token name
  const { data: name, isLoading: isNameLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Name never changes
    },
  });

  // Format balance for display
  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  // Get token metadata if available
  const tokenMetadata = tokenAddress ? Object.values(TOKEN_METADATA).find(
    meta => meta.symbol.toLowerCase() === symbol?.toLowerCase()
  ) : undefined;

  const isLoading = isBalanceLoading || isDecimalsLoading || isSymbolLoading || isNameLoading;

  return {
    // Raw data
    balance: balance || BigInt(0),
    decimals: decimals || 18,
    symbol: symbol || 'TOKEN',
    name: name || 'Unknown Token',
    
    // Formatted data
    formattedBalance,
    displayBalance: parseFloat(formattedBalance).toFixed(decimals && decimals <= 6 ? decimals : 6),
    
    // Metadata
    tokenMetadata,
    icon: tokenMetadata?.icon || '/tokens/default.svg',
    
    // State
    isLoading,
    error: balanceError,
    isZero: balance === BigInt(0),
    
    // Actions
    refetch: refetchBalance,
    
    // Utility
    hasBalance: balance ? balance > BigInt(0) : false,
  };
}