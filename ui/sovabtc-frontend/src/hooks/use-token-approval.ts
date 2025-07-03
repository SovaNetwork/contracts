import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ERC20_ABI } from '@/contracts/abis';

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number,
    isInfinite = false
  ) => {
    try {
      // Use max uint256 for infinite approval, or parse the exact amount
      const parsedAmount = isInfinite 
        ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        : parseUnits(amount, decimals);
      
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, parsedAmount],
      });
    } catch (err) {
      console.error('Token approval error:', err);
      throw err;
    }
  };

  // Convenience function for infinite approval
  const approveInfinite = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`
  ) => {
    return approve(tokenAddress, spenderAddress, '0', 18, true);
  };

  return {
    approve,
    approveInfinite,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}