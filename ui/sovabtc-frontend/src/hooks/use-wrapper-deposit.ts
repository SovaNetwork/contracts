import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { SOVABTC_WRAPPER_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export function useWrapperDeposit() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number
  ) => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const parsedAmount = parseUnits(amount, tokenDecimals);
      
      writeContract({
        address: addresses.WRAPPER as `0x${string}`,
        abi: SOVABTC_WRAPPER_ABI,
        functionName: 'deposit',
        args: [tokenAddress, parsedAmount],
      });
    } catch (err) {
      console.error('Wrapper deposit error:', err);
      throw err;
    }
  };

  // Get the wrapper address for the current chain
  const getWrapperAddress = () => {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return addresses?.WRAPPER as `0x${string}`;
  };

  return {
    deposit,
    getWrapperAddress,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}