import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { SOVABTC_STAKING_ABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export function useStakingData() {
  const { address } = useAccount();
  const chainId = useChainId();

  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  // Get user's staked balance
  const { data: stakedBalance, isLoading: isStakedLoading, refetch: refetchStaked } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!addresses,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Get user's earned rewards
  const { data: earnedRewards, isLoading: isEarnedLoading, refetch: refetchEarned } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'earned',
    args: [address!],
    query: {
      enabled: !!address && !!addresses,
      refetchInterval: 5000, // More frequent updates for rewards
    },
  });

  // Get total supply (total staked)
  const { data: totalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!addresses,
      refetchInterval: 30000, // Less frequent updates
    },
  });

  // Get reward rate
  const { data: rewardRate, isLoading: isRewardRateLoading } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardRate',
    query: {
      enabled: !!addresses,
      refetchInterval: 30000, // Less frequent updates
    },
  });

  // Get reward per token stored
  const { data: rewardPerTokenStored, isLoading: isRewardPerTokenLoading } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardPerTokenStored',
    query: {
      enabled: !!addresses,
      refetchInterval: 10000,
    },
  });

  // Get last update time
  const { data: lastUpdateTime } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'lastUpdateTime',
    query: {
      enabled: !!addresses,
      refetchInterval: 30000,
    },
  });

  // Get period finish time
  const { data: periodFinish } = useReadContract({
    address: addresses?.STAKING as `0x${string}`,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'periodFinish',
    query: {
      enabled: !!addresses,
      refetchInterval: 30000,
    },
  });

  // Calculate APY
  const calculateAPY = () => {
    if (!rewardRate || !totalSupply || totalSupply === BigInt(0)) {
      return 0;
    }

    // Convert reward rate (per second) to annual
    const secondsInYear = 365 * 24 * 60 * 60;
    const annualRewards = Number(formatUnits(rewardRate, 18)) * secondsInYear; // SOVA has 18 decimals
    const totalStakedValue = Number(formatUnits(totalSupply, 8)); // SovaBTC has 8 decimals
    
    if (totalStakedValue === 0) return 0;
    
    return (annualRewards / totalStakedValue) * 100;
  };

  // Calculate user's share of pool
  const calculatePoolShare = () => {
    if (!stakedBalance || !totalSupply || totalSupply === BigInt(0)) {
      return 0;
    }
    
    return (Number(formatUnits(stakedBalance, 8)) / Number(formatUnits(totalSupply, 8))) * 100;
  };

  // Check if staking period is active
  const isStakingActive = () => {
    if (!periodFinish) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return Number(periodFinish) > currentTime;
  };

  // Calculate time remaining for current reward period
  const getTimeRemaining = () => {
    if (!periodFinish) return 0;
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, Number(periodFinish) - currentTime);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const apy = calculateAPY();
  const poolShare = calculatePoolShare();
  const timeRemaining = getTimeRemaining();

  return {
    // Raw data
    stakedBalance: stakedBalance || BigInt(0),
    earnedRewards: earnedRewards || BigInt(0),
    totalSupply: totalSupply || BigInt(0),
    rewardRate: rewardRate || BigInt(0),
    rewardPerTokenStored: rewardPerTokenStored || BigInt(0),
    lastUpdateTime: Number(lastUpdateTime || 0),
    periodFinish: Number(periodFinish || 0),

    // Formatted data
    formattedStaked: formatUnits(stakedBalance || BigInt(0), 8),
    formattedEarned: formatUnits(earnedRewards || BigInt(0), 18), // SOVA token decimals
    formattedTotalSupply: formatUnits(totalSupply || BigInt(0), 8),
    displayStaked: parseFloat(formatUnits(stakedBalance || BigInt(0), 8)).toFixed(6),
    displayEarned: parseFloat(formatUnits(earnedRewards || BigInt(0), 18)).toFixed(6),
    displayTotalSupply: parseFloat(formatUnits(totalSupply || BigInt(0), 8)).toFixed(2),

    // Calculated values
    apy,
    poolShare,
    timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),
    isStakingActive: isStakingActive(),

    // State
    isLoading: isStakedLoading || isEarnedLoading || isTotalSupplyLoading || isRewardRateLoading || isRewardPerTokenLoading,
    hasStakedBalance: stakedBalance ? stakedBalance > BigInt(0) : false,
    hasEarnedRewards: earnedRewards ? earnedRewards > BigInt(0) : false,

    // Actions
    refetch: () => {
      refetchStaked();
      refetchEarned();
    },
  };
}