import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';
import { useState } from 'react';

export function useTokenApproval() {
  const [isApproving, setIsApproving] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number
  ) => {
    setIsApproving(true);
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, parsedAmount],
      });
    } catch (error) {
      setIsApproving(false);
      throw error;
    }
  };

  const approveMax = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`
  ) => {
    setIsApproving(true);
    
    try {
      // Approve maximum uint256 value for infinite allowance
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      
      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, maxUint256],
      });
    } catch (error) {
      setIsApproving(false);
      throw error;
    }
  };

  // Reset approving state when transaction is complete
  if (isApproving && (isSuccess || error)) {
    setIsApproving(false);
  }

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isApproving,
  };
}