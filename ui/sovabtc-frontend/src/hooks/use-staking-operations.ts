import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { SOVABTC_STAKING_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

// Hook for staking operations
export function useStaking() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (amount: string) => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // SovaBTC has 8 decimals
      const parsedAmount = parseUnits(amount, 8);
      
      writeContract({
        address: addresses.STAKING as `0x${string}`,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'stake',
        args: [parsedAmount],
      });
    } catch (err) {
      console.error('Staking error:', err);
      throw err;
    }
  };

  const getStakingAddress = () => {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return addresses?.STAKING as `0x${string}`;
  };

  return {
    stake,
    getStakingAddress,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}

// Hook for unstaking operations
export function useUnstaking() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (amount: string) => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // SovaBTC has 8 decimals
      const parsedAmount = parseUnits(amount, 8);
      
      writeContract({
        address: addresses.STAKING as `0x${string}`,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'unstake',
        args: [parsedAmount],
      });
    } catch (err) {
      console.error('Unstaking error:', err);
      throw err;
    }
  };

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}

// Hook for claiming rewards
export function useRewardClaiming() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async () => {
    try {
      const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      
      if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }
      
      writeContract({
        address: addresses.STAKING as `0x${string}`,
        abi: SOVABTC_STAKING_ABI,
        functionName: 'getReward',
      });
    } catch (err) {
      console.error('Reward claiming error:', err);
      throw err;
    }
  };

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}