import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export function useRedemptionRequest() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestRedemption = async (
    targetTokenAddress: `0x${string}`,
    sovaBTCAmount: string
  ) => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // SovaBTC has 8 decimals
      const parsedAmount = parseUnits(sovaBTCAmount, 8);
      
      writeContract({
        address: addresses.REDEMPTION_QUEUE as `0x${string}`,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'redeem',
        args: [targetTokenAddress, parsedAmount],
      });
    } catch (err) {
      console.error('Redemption request error:', err);
      throw err;
    }
  };

  // Get the redemption queue address for the current chain
  const getQueueAddress = () => {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return addresses?.REDEMPTION_QUEUE as `0x${string}`;
  };

  return {
    requestRedemption,
    getQueueAddress,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}