import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export function useRedemptionFulfillment() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillRedemption = async (userAddress?: `0x${string}`) => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // Use provided address or current user's address
      const targetAddress = userAddress || (address as `0x${string}`);
      
      if (!targetAddress) {
        throw new Error('No user address available for fulfillment');
      }
      
      writeContract({
        address: addresses.REDEMPTION_QUEUE as `0x${string}`,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'fulfillRedemption',
        args: [targetAddress],
      });
    } catch (err) {
      console.error('Redemption fulfillment error:', err);
      throw err;
    }
  };

  // Convenience function to fulfill current user's redemption
  const fulfillMyRedemption = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    return fulfillRedemption(address);
  };

  // Get the redemption queue address for the current chain
  const getQueueAddress = () => {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return addresses?.REDEMPTION_QUEUE as `0x${string}`;
  };

  return {
    fulfillRedemption,
    fulfillMyRedemption,
    getQueueAddress,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}