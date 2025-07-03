import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import SovaBTCStakingABI from '../contracts/abis/SovaBTCStaking.json';

export function useClaimRewards() {
  const [isClaiming, setIsClaiming] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async (stakingAddress: `0x${string}`) => {
    setIsClaiming(true);
    
    try {
      writeContract({
        address: stakingAddress,
        abi: SovaBTCStakingABI,
        functionName: 'getReward',
      });
    } catch (error) {
      setIsClaiming(false);
      throw error;
    }
  };

  // Reset claiming state when transaction is complete
  if (isClaiming && (isSuccess || error)) {
    setIsClaiming(false);
  }

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isClaiming,
  };
}