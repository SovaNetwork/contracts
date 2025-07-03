import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useState } from 'react';
import SovaBTCStakingABI from '../contracts/abis/SovaBTCStaking.json';

export function useUnstake() {
  const [isUnstaking, setIsUnstaking] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (
    stakingAddress: `0x${string}`,
    amount: string,
    decimals: number = 8 // SovaBTC decimals
  ) => {
    setIsUnstaking(true);
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      writeContract({
        address: stakingAddress,
        abi: SovaBTCStakingABI,
        functionName: 'withdraw',
        args: [parsedAmount],
      });
    } catch (error) {
      setIsUnstaking(false);
      throw error;
    }
  };

  const unstakeAll = async (stakingAddress: `0x${string}`) => {
    setIsUnstaking(true);
    
    try {
      writeContract({
        address: stakingAddress,
        abi: SovaBTCStakingABI,
        functionName: 'exit', // Withdraws all and claims rewards
      });
    } catch (error) {
      setIsUnstaking(false);
      throw error;
    }
  };

  // Reset unstaking state when transaction is complete
  if (isUnstaking && (isSuccess || error)) {
    setIsUnstaking(false);
  }

  return {
    unstake,
    unstakeAll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isUnstaking,
  };
}