import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  SOVABTC_ABI,
  SOVA_TOKEN_ABI,
  SOVABTC_STAKING_ABI, 
  CONTRACT_ADDRESSES, 
  isSupportedChain,
  CONTRACT_CONFIG
} from '@/config/contracts';

// Hook for reading staking pool data
export function useStakingPoolData() {
  const { address } = useAccount();
  const chainId = useChainId();

  if (!isSupportedChain(chainId)) {
    return {
      stakedAmount: BigInt(0),
      earnedRewards: BigInt(0),
      rewardRate: BigInt(0),
      totalSupply: BigInt(0),
      apy: 0,
      isLoading: false,
      error: new Error('Unsupported chain'),
      refetch: () => {},
    };
  }

  const stakingAddress = CONTRACT_ADDRESSES[chainId].STAKING;

  // User's staked amount
  const { data: stakedAmount, isLoading: stakedLoading, refetch: refetchStaked } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: CONTRACT_CONFIG.BALANCE_REFRESH_INTERVAL,
    },
  });

  // User's earned rewards
  const { data: earnedRewards, isLoading: rewardsLoading, refetch: refetchRewards } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'earned',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refresh rewards more frequently
    },
  });

  // Global reward rate
  const { data: rewardRate } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardRate',
    query: {
      staleTime: 60000, // Reward rate changes less frequently
    },
  });

  // Total staked supply
  const { data: totalSupply } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'totalSupply',
    query: {
      refetchInterval: 30000,
    },
  });

  // Calculate APY based on reward rate and total supply
  const calculateAPY = () => {
    if (!rewardRate || !totalSupply || totalSupply === BigInt(0)) return 0;
    
    const secondsPerYear = 365 * 24 * 3600;
    const yearlyRewards = Number(rewardRate) * secondsPerYear;
    const totalStakedValue = Number(totalSupply);
    
    return (yearlyRewards / totalStakedValue) * 100;
  };

  const refetch = () => {
    refetchStaked();
    refetchRewards();
  };

  return {
    stakedAmount: (stakedAmount as bigint) || BigInt(0),
    earnedRewards: (earnedRewards as bigint) || BigInt(0),
    rewardRate: (rewardRate as bigint) || BigInt(0),
    totalSupply: (totalSupply as bigint) || BigInt(0),
    apy: calculateAPY(),
    isLoading: stakedLoading || rewardsLoading,
    error: null,
    refetch,
  };
}

// Hook for staking SovaBTC
export function useStake() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (amount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const parsedAmount = parseUnits(amount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
    const stakingAddress = CONTRACT_ADDRESSES[chainId].STAKING;
    
    writeContract({
      address: stakingAddress,
      abi: SOVABTC_STAKING_ABI,
      functionName: 'stake',
      args: [parsedAmount],
    });
  };

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for unstaking SovaBTC
export function useUnstake() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (amount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const parsedAmount = parseUnits(amount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
    const stakingAddress = CONTRACT_ADDRESSES[chainId].STAKING;
    
    writeContract({
      address: stakingAddress,
      abi: SOVABTC_STAKING_ABI,
      functionName: 'unstake',
      args: [parsedAmount],
    });
  };

  const unstakeAll = async () => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const stakingAddress = CONTRACT_ADDRESSES[chainId].STAKING;
    
    writeContract({
      address: stakingAddress,
      abi: SOVABTC_STAKING_ABI,
      functionName: 'exit',
      args: [],
    });
  };

  return {
    unstake,
    unstakeAll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for claiming rewards
export function useClaimRewards() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async () => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const stakingAddress = CONTRACT_ADDRESSES[chainId].STAKING;
    
    writeContract({
      address: stakingAddress,
      abi: SOVABTC_STAKING_ABI,
      functionName: 'getReward',
      args: [],
    });
  };

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for checking SovaBTC approval for staking
export function useStakingApproval(stakeAmount: string) {
  const chainId = useChainId();
  const { address } = useAccount();

  if (!isSupportedChain(chainId) || !address || !stakeAmount || stakeAmount === '0') {
    return {
      needsApproval: false,
      allowance: BigInt(0),
      requiredAmount: BigInt(0),
    };
  }

  const addresses = CONTRACT_ADDRESSES[chainId];
  const requiredAmount = parseUnits(stakeAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS);

  const { data: allowance, refetch } = useReadContract({
    address: addresses.SOVABTC,
    abi: SOVABTC_ABI,
    functionName: 'allowance',
    args: [address, addresses.STAKING],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  const currentAllowance = (allowance as bigint) || BigInt(0);
  const needsApproval = currentAllowance < requiredAmount;

  return {
    needsApproval,
    allowance: currentAllowance,
    requiredAmount,
    refetch,
  };
}

// Hook for approving SovaBTC for staking
export function useApproveStaking() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (amount: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const parsedAmount = parseUnits(amount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
    const addresses = CONTRACT_ADDRESSES[chainId];
    
    writeContract({
      address: addresses.SOVABTC,
      abi: SOVABTC_ABI,
      functionName: 'approve',
      args: [addresses.STAKING, parsedAmount],
    });
  };

  const approveMax = async () => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const addresses = CONTRACT_ADDRESSES[chainId];
    
    writeContract({
      address: addresses.SOVABTC,
      abi: SOVABTC_ABI,
      functionName: 'approve',
      args: [addresses.STAKING, CONTRACT_CONFIG.MAX_UINT256],
    });
  };

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Combined hook for complete staking workflow
export function useStakingWorkflow() {
  const approval = useApproveStaking();
  const stake = useStake();
  const unstake = useUnstake();
  const claimRewards = useClaimRewards();
  const poolData = useStakingPoolData();

  const executeStake = async (amount: string, needsApproval: boolean) => {
    if (needsApproval) {
      // Step 1: Approve
      await approval.approve(amount);
      
      // Wait for approval success before staking
      if (approval.isSuccess) {
        // Step 2: Stake
        await stake.stake(amount);
      }
    } else {
      // Direct stake if already approved
      await stake.stake(amount);
    }
  };

  const executeUnstake = async (amount: string) => {
    await unstake.unstake(amount);
  };

  const executeUnstakeAll = async () => {
    await unstake.unstakeAll();
  };

  const executeClaim = async () => {
    await claimRewards.claimRewards();
  };

  return {
    executeStake,
    executeUnstake,
    executeUnstakeAll,
    executeClaim,
    approval,
    stake,
    unstake,
    claimRewards,
    poolData,
    isProcessing: approval.isPending || approval.isConfirming || 
                   stake.isPending || stake.isConfirming ||
                   unstake.isPending || unstake.isConfirming ||
                   claimRewards.isPending || claimRewards.isConfirming,
    currentStep: approval.isPending || approval.isConfirming ? 'approving' :
                 stake.isPending || stake.isConfirming ? 'staking' :
                 unstake.isPending || unstake.isConfirming ? 'unstaking' :
                 claimRewards.isPending || claimRewards.isConfirming ? 'claiming' :
                 'idle',
  };
}

// Hook for formatted staking display data
export function useStakingDisplayData() {
  const poolData = useStakingPoolData();

  const formatAmount = (amount: bigint, decimals: number) => {
    return formatUnits(amount, decimals);
  };

  const formatAPY = (apy: number) => {
    return `${apy.toFixed(2)}%`;
  };

  const formatRewards = (rewards: bigint) => {
    return formatUnits(rewards, CONTRACT_CONFIG.SOVA_TOKEN_DECIMALS);
  };

  return {
    ...poolData,
    formattedStakedAmount: formatAmount(poolData.stakedAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS),
    formattedEarnedRewards: formatRewards(poolData.earnedRewards),
    formattedTotalSupply: formatAmount(poolData.totalSupply, CONTRACT_CONFIG.SOVABTC_DECIMALS),
    formattedAPY: formatAPY(poolData.apy),
  };
}

// Hook for staking calculations and validations
export function useStakingCalculations(inputAmount: string) {
  const chainId = useChainId();
  const poolData = useStakingPoolData();
  const approvalCheck = useStakingApproval(inputAmount);

  if (!isSupportedChain(chainId) || !inputAmount || inputAmount === '0') {
    return {
      isValid: false,
      parsedAmount: BigInt(0),
      projectedRewards: BigInt(0),
      needsApproval: false,
    };
  }

  const parsedAmount = parseUnits(inputAmount, CONTRACT_CONFIG.SOVABTC_DECIMALS);
  
  // Calculate projected daily rewards
  const calculateProjectedRewards = () => {
    if (!poolData.rewardRate || poolData.totalSupply === BigInt(0)) return BigInt(0);
    
    const dailyRewardRate = poolData.rewardRate * BigInt(86400); // 24 hours
    const userShare = parsedAmount / (poolData.totalSupply + parsedAmount);
    return dailyRewardRate * BigInt(Math.floor(Number(userShare) * 1000)) / BigInt(1000);
  };

  return {
    isValid: true,
    parsedAmount,
    projectedRewards: calculateProjectedRewards(),
    needsApproval: approvalCheck.needsApproval,
    approvalCheck,
  };
} 