import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useState } from 'react';
import RedemptionQueueABI from '../contracts/abis/RedemptionQueue.json';

export function useRedemptionRequest() {
  const [isRequesting, setIsRequesting] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestRedemption = async (
    queueAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    sovaAmount: string,
    sovaDecimals: number = 8
  ) => {
    setIsRequesting(true);
    
    try {
      const parsedAmount = parseUnits(sovaAmount, sovaDecimals);
      
      writeContract({
        address: queueAddress,
        abi: RedemptionQueueABI,
        functionName: 'redeem',
        args: [tokenAddress, parsedAmount],
      });
    } catch (error) {
      setIsRequesting(false);
      throw error;
    }
  };

  // Reset requesting state when transaction is complete
  if (isRequesting && (isSuccess || error)) {
    setIsRequesting(false);
  }

  return {
    requestRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isRequesting,
  };
}