import { useState, useMemo, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address } from 'viem';

import { SovaBTCStakingABI, SOVATokenABI, ERC20_ABI } from '@/contracts/abis';
import { useActiveNetwork } from './useActiveNetwork';

export interface StakingPool {
  id: number;
  stakingToken: Address;
  rewardToken: Address;
  rewardPerSecond: bigint;
  lastRewardTime: bigint;
  accRewardPerShare: bigint;
  totalStaked: bigint;
  lockPeriod: bigint;
  multiplier: bigint;
  stakingTokenSymbol?: string;
  rewardTokenSymbol?: string;
  apr?: number;
  tvl?: bigint;
}

export interface UserStakeInfo {
  amount: bigint;
  rewardDebt: bigint;
  lastStakeTime: bigint;
  lockEndTime: bigint;
  pendingRewards: bigint;
  actualStakedAmount: bigint;
  canUnstake: boolean;
  timeUntilUnlock: number;
}

export interface StakingAnalytics {
  totalValueLocked: bigint;
  totalRewardsDistributed: bigint;
  averageAPR: number;
  poolCount: number;
  activeStakers: number;
  myTotalStaked: bigint;
  myTotalRewards: bigint;
  myActivePositions: number;
}

interface UseStakingProps {
  userAddress?: Address;
}

export function useStaking({ userAddress }: UseStakingProps) {
  const { address: connectedAddress } = useAccount();
  const { getContractAddress } = useActiveNetwork();
  const effectiveAddress = userAddress || connectedAddress;

  const stakingContractAddress = getContractAddress('staking');
  const sovaTokenAddress = getContractAddress('sovaToken');

  // Transaction state
  const [lastStakeHash, setLastStakeHash] = useState<Address | undefined>();
  const [lastUnstakeHash, setLastUnstakeHash] = useState<Address | undefined>();
  const [lastClaimHash, setLastClaimHash] = useState<Address | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'staking' | 'unstaking' | 'claiming'>('idle');

  // Contract writes
  const {
    writeContract: stakeTokens,
    data: stakeHash,
    error: stakeError,
    isPending: isStaking,
  } = useWriteContract();

  const {
    writeContract: unstakeTokens,
    data: unstakeHash,
    error: unstakeError,
    isPending: isUnstaking,
  } = useWriteContract();

  const {
    writeContract: claimRewards,
    data: claimHash,
    error: claimError,
    isPending: isClaiming,
  } = useWriteContract();

  const {
    writeContract: approveToken,
    data: approvalHash,
    error: approvalError,
    isPending: isApproving,
  } = useWriteContract();

  // Transaction confirmations
  const {
    isLoading: isConfirmingStake,
    isSuccess: isStakeConfirmed,
    error: stakeConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastStakeHash,
  });

  const {
    isLoading: isConfirmingUnstake,
    isSuccess: isUnstakeConfirmed,
    error: unstakeConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastUnstakeHash,
  });

  const {
    isLoading: isConfirmingClaim,
    isSuccess: isClaimConfirmed,
    error: claimConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastClaimHash,
  });

  // Get pool count
  const {
    data: poolLength,
    refetch: refetchPoolLength,
  } = useReadContract({
    address: stakingContractAddress,
    abi: SovaBTCStakingABI,
    functionName: 'poolLength',
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 30000,
    },
  });

  // Get all pools data
  const poolQueries = useMemo(() => {
    if (!poolLength || !stakingContractAddress) return [];
    const poolCount = Number(poolLength);
    return Array.from({ length: poolCount }, (_, i) => i);
  }, [poolLength, stakingContractAddress]);

  // Get pool information for each pool
  const poolsData = useReadContract({
    address: stakingContractAddress,
    abi: SovaBTCStakingABI,
    functionName: 'pools',
    query: {
      enabled: Boolean(stakingContractAddress && poolLength),
      refetchInterval: 15000,
    },
  });

  // Get user stake info for all pools
  const userStakeQueries = useMemo(() => {
    if (!effectiveAddress || !poolLength || !stakingContractAddress) return [];
    return poolQueries.map(poolId => ({
      address: stakingContractAddress,
      abi: SovaBTCStakingABI,
      functionName: 'userInfo',
      args: [poolId, effectiveAddress],
    }));
  }, [effectiveAddress, poolQueries, stakingContractAddress]);

  // Parse pools data
  const stakingPools: StakingPool[] = useMemo(() => {
    if (!poolLength || !stakingContractAddress) return [];
    
    // For now, return basic pool structure - would need individual queries for each pool
    const poolCount = Number(poolLength);
    return Array.from({ length: poolCount }, (_, i) => ({
      id: i,
      stakingToken: '0x0000000000000000000000000000000000000000' as Address,
      rewardToken: sovaTokenAddress as Address,
      rewardPerSecond: 0n,
      lastRewardTime: 0n,
      accRewardPerShare: 0n,
      totalStaked: 0n,
      lockPeriod: 0n,
      multiplier: 10000n, // 1x default
      stakingTokenSymbol: 'sovaBTC',
      rewardTokenSymbol: 'SOVA',
      apr: 0,
      tvl: 0n,
    }));
  }, [poolLength, stakingContractAddress, sovaTokenAddress]);

  // Get pending rewards for a specific pool
  const usePendingRewards = (poolId: number) => {
    return useReadContract({
      address: stakingContractAddress,
      abi: SovaBTCStakingABI,
      functionName: 'pendingRewards',
      args: [poolId, effectiveAddress] as const,
      query: {
        enabled: Boolean(stakingContractAddress && effectiveAddress),
        refetchInterval: 5000,
      },
    });
  };

  // Get user info for a specific pool
  const useUserInfo = (poolId: number) => {
    return useReadContract({
      address: stakingContractAddress,
      abi: SovaBTCStakingABI,
      functionName: 'userInfo',
      args: [poolId, effectiveAddress] as const,
      query: {
        enabled: Boolean(stakingContractAddress && effectiveAddress),
        refetchInterval: 10000,
      },
    });
  };

  // Get pool info for a specific pool
  const usePoolInfo = (poolId: number) => {
    return useReadContract({
      address: stakingContractAddress,
      abi: SovaBTCStakingABI,
      functionName: 'pools',
      args: [poolId] as const,
      query: {
        enabled: Boolean(stakingContractAddress),
        refetchInterval: 15000,
      },
    });
  };

  // Get token allowance
  const useTokenAllowance = (tokenAddress: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [effectiveAddress, stakingContractAddress] as const,
      query: {
        enabled: Boolean(tokenAddress && effectiveAddress && stakingContractAddress),
        refetchInterval: 10000,
      },
    });
  };

  // Get token balance
  const useTokenBalance = (tokenAddress: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [effectiveAddress] as const,
      query: {
        enabled: Boolean(tokenAddress && effectiveAddress),
        refetchInterval: 5000,
      },
    });
  };

  // Calculate APR for a pool
  const calculateAPR = (pool: StakingPool): number => {
    if (!pool.totalStaked || pool.totalStaked === 0n) return 0;
    
    // Annual rewards = rewardPerSecond * seconds in year
    const secondsInYear = 365 * 24 * 3600;
    const annualRewards = Number(pool.rewardPerSecond) * secondsInYear;
    const totalStakedValue = Number(pool.totalStaked);
    
    if (totalStakedValue === 0) return 0;
    
    // Basic APR calculation (would need token prices for accurate calculation)
    return (annualRewards / totalStakedValue) * 100;
  };

  // Stake tokens in a pool
  const executeStake = async (poolId: number, amount: bigint, lockTokens: boolean = false) => {
    try {
      if (!stakingContractAddress) {
        throw new Error('Staking contract address not found');
      }

      setCurrentStep('staking');
      
      await stakeTokens({
        address: stakingContractAddress,
        abi: SovaBTCStakingABI,
        functionName: 'stake',
        args: [poolId, amount, lockTokens],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('Staking failed:', error);
      throw error;
    }
  };

  // Unstake tokens from a pool
  const executeUnstake = async (poolId: number, amount: bigint) => {
    try {
      if (!stakingContractAddress) {
        throw new Error('Staking contract address not found');
      }

      setCurrentStep('unstaking');
      
      await unstakeTokens({
        address: stakingContractAddress,
        abi: SovaBTCStakingABI,
        functionName: 'unstake',
        args: [poolId, amount],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('Unstaking failed:', error);
      throw error;
    }
  };

  // Claim rewards from a pool
  const executeClaim = async (poolId: number) => {
    try {
      if (!stakingContractAddress) {
        throw new Error('Staking contract address not found');
      }

      setCurrentStep('claiming');
      
      await claimRewards({
        address: stakingContractAddress,
        abi: SovaBTCStakingABI,
        functionName: 'claimRewards',
        args: [poolId],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('Claiming failed:', error);
      throw error;
    }
  };

  // Approve token for staking
  const executeApproval = async (tokenAddress: Address, amount: bigint) => {
    try {
      if (!stakingContractAddress) {
        throw new Error('Staking contract address not found');
      }

      await approveToken({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [stakingContractAddress, amount],
      });
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  };

  // Validate staking parameters
  const validateStake = (poolId: number, amount: bigint, tokenBalance: bigint): { isValid: boolean; error: string | null } => {
    if (!effectiveAddress) {
      return { isValid: false, error: 'Wallet not connected' };
    }

    if (amount <= 0n) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if (amount > tokenBalance) {
      return { isValid: false, error: 'Insufficient token balance' };
    }

    if (poolId < 0 || poolId >= stakingPools.length) {
      return { isValid: false, error: 'Invalid pool selected' };
    }

    return { isValid: true, error: null };
  };

  // Calculate staking analytics
  const stakingAnalytics: StakingAnalytics = useMemo(() => {
    const totalValueLocked = stakingPools.reduce((sum, pool) => sum + pool.totalStaked, 0n);
    const averageAPR = stakingPools.length > 0 
      ? stakingPools.reduce((sum, pool) => sum + calculateAPR(pool), 0) / stakingPools.length
      : 0;

    return {
      totalValueLocked,
      totalRewardsDistributed: 0n, // Would need additional contract call
      averageAPR,
      poolCount: stakingPools.length,
      activeStakers: 0, // Would need additional tracking
      myTotalStaked: 0n, // Calculate from user positions
      myTotalRewards: 0n, // Calculate from pending rewards
      myActivePositions: 0, // Count user's active stakes
    };
  }, [stakingPools]);

  // Track transaction hashes
  useEffect(() => {
    if (stakeHash && stakeHash !== lastStakeHash) {
      setLastStakeHash(stakeHash);
    }
  }, [stakeHash, lastStakeHash]);

  useEffect(() => {
    if (unstakeHash && unstakeHash !== lastUnstakeHash) {
      setLastUnstakeHash(unstakeHash);
    }
  }, [unstakeHash, lastUnstakeHash]);

  useEffect(() => {
    if (claimHash && claimHash !== lastClaimHash) {
      setLastClaimHash(claimHash);
    }
  }, [claimHash, lastClaimHash]);

  // Reset step on transaction confirmation
  useEffect(() => {
    if (isStakeConfirmed || isUnstakeConfirmed || isClaimConfirmed) {
      setCurrentStep('idle');
      // Refetch relevant data
      refetchPoolLength();
    }
  }, [isStakeConfirmed, isUnstakeConfirmed, isClaimConfirmed, refetchPoolLength]);

  // Get overall status
  const getOverallStatus = () => {
    if (currentStep === 'staking' || isStaking || isConfirmingStake) return 'staking';
    if (currentStep === 'unstaking' || isUnstaking || isConfirmingUnstake) return 'unstaking';
    if (currentStep === 'claiming' || isClaiming || isConfirmingClaim) return 'claiming';
    if (isApproving) return 'approving';
    if (isStakeConfirmed || isUnstakeConfirmed || isClaimConfirmed) return 'confirmed';
    if (stakeError || unstakeError || claimError || approvalError) return 'error';
    return 'idle';
  };

  return {
    // Pool data
    stakingPools,
    poolLength: poolLength ? Number(poolLength) : 0,
    
    // Actions
    executeStake,
    executeUnstake,
    executeClaim,
    executeApproval,
    validateStake,
    calculateAPR,
    
    // Hooks for specific pools
    usePendingRewards,
    useUserInfo,
    usePoolInfo,
    useTokenAllowance,
    useTokenBalance,
    
    // Analytics
    stakingAnalytics,
    
    // Transaction status
    overallStatus: getOverallStatus(),
    isStaking: currentStep === 'staking' || isStaking || isConfirmingStake,
    isUnstaking: currentStep === 'unstaking' || isUnstaking || isConfirmingUnstake,
    isClaiming: currentStep === 'claiming' || isClaiming || isConfirmingClaim,
    isApproving,
    isTransactionConfirmed: isStakeConfirmed || isUnstakeConfirmed || isClaimConfirmed,
    
    // Errors
    error: stakeError || unstakeError || claimError || approvalError || 
           stakeConfirmError || unstakeConfirmError || claimConfirmError,
    
    // Transaction hashes
    stakeHash: lastStakeHash,
    unstakeHash: lastUnstakeHash,
    claimHash: lastClaimHash,
    
    // Contract addresses
    stakingContractAddress,
    sovaTokenAddress,
  };
} 