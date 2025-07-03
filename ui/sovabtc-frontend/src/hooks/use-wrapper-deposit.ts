import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useState } from 'react';
import SovaBTCWrapperABI from '../contracts/abis/SovaBTCWrapper.json';

export function useWrapperDeposit() {
  const [isDepositing, setIsDepositing] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (
    wrapperAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number
  ) => {
    setIsDepositing(true);
    
    try {
      const parsedAmount = parseUnits(amount, tokenDecimals);
      
      writeContract({
        address: wrapperAddress,
        abi: SovaBTCWrapperABI,
        functionName: 'deposit',
        args: [tokenAddress, parsedAmount],
      });
    } catch (error) {
      setIsDepositing(false);
      throw error;
    }
  };

  // Reset depositing state when transaction is complete
  if (isDepositing && (isSuccess || error)) {
    setIsDepositing(false);
  }

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isDepositing,
  };
}