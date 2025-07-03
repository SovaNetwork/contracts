import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useState } from 'react';
import SovaBTCStakingABI from '../contracts/abis/SovaBTCStaking.json';

export function useStake() {
  const [isStaking, setIsStaking] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (
    stakingAddress: `0x${string}`,
    amount: string,
    decimals: number = 8 // SovaBTC decimals
  ) => {
    setIsStaking(true);
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      writeContract({
        address: stakingAddress,
        abi: SovaBTCStakingABI,
        functionName: 'stake',
        args: [parsedAmount],
      });
    } catch (error) {
      setIsStaking(false);
      throw error;
    }
  };

  // Reset staking state when transaction is complete
  if (isStaking && (isSuccess || error)) {
    setIsStaking(false);
  }

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isStaking,
  };
}