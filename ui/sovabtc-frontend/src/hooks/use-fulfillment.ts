import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import RedemptionQueueABI from '../contracts/abis/RedemptionQueue.json';

export function useFulfillment() {
  const [isFulfilling, setIsFulfilling] = useState(false);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillRedemption = async (
    queueAddress: `0x${string}`,
    userAddress: `0x${string}`
  ) => {
    setIsFulfilling(true);
    
    try {
      writeContract({
        address: queueAddress,
        abi: RedemptionQueueABI,
        functionName: 'fulfillRedemption',
        args: [userAddress],
      });
    } catch (error) {
      setIsFulfilling(false);
      throw error;
    }
  };

  const fulfillOwnRedemption = async (
    queueAddress: `0x${string}`,
    userAddress: `0x${string}`
  ) => {
    // Same as fulfillRedemption but more explicit naming for self-fulfillment
    return fulfillRedemption(queueAddress, userAddress);
  };

  // Reset fulfilling state when transaction is complete
  if (isFulfilling && (isSuccess || error)) {
    setIsFulfilling(false);
  }

  return {
    fulfillRedemption,
    fulfillOwnRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isFulfilling,
  };
}