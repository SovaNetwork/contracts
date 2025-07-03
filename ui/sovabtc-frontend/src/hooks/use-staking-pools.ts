import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import SovaBTCStakingABI from '../contracts/abis/SovaBTCStaking.json';

export function useStakingPools(stakingAddress: `0x${string}`) {
  const { address } = useAccount();

  // User staking data
  const { data: stakedAmount, isLoading: isLoadingStaked, refetch: refetchStaked } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!stakingAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000,
    },
  });

  const { data: earnedRewards, isLoading: isLoadingRewards, refetch: refetchRewards } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'earned',
    args: [address!],
    query: {
      enabled: !!address && !!stakingAddress,
      refetchInterval: 5000, // Refresh rewards more frequently
      staleTime: 2000,
    },
  });

  // Pool statistics
  const { data: rewardRate } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'rewardRate',
    query: {
      enabled: !!stakingAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  const { data: totalSupply } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!stakingAddress,
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000,
    },
  });

  const { data: rewardPerToken } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'rewardPerToken',
    query: {
      enabled: !!stakingAddress,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  const { data: periodFinish } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'periodFinish',
    query: {
      enabled: !!stakingAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  const { data: rewardsDuration } = useReadContract({
    address: stakingAddress,
    abi: SovaBTCStakingABI,
    functionName: 'rewardsDuration',
    query: {
      enabled: !!stakingAddress,
      staleTime: Infinity, // Duration rarely changes
    },
  });

  // Calculate APY
  const calculateAPY = (): number => {
    if (!rewardRate || !totalSupply || totalSupply === BigInt(0)) {
      return 0;
    }

    // Annual rewards = rewardRate * seconds in year
    const annualRewards = Number(rewardRate) * 365 * 24 * 3600;
    // APY = (annual rewards / total staked) * 100
    const apy = (annualRewards / Number(totalSupply)) * 100;
    
    return apy;
  };

  // Check if rewards period is active
  const isRewardsActive = periodFinish 
    ? Number(periodFinish) > Date.now() / 1000
    : false;

  // Calculate time remaining for rewards period
  const timeRemainingInRewards = periodFinish 
    ? Math.max(0, Number(periodFinish) - Date.now() / 1000)
    : 0;

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format amounts for display
  const formattedStakedAmount = stakedAmount 
    ? formatUnits(stakedAmount as bigint, 8) // SovaBTC has 8 decimals
    : '0';

  const formattedEarnedRewards = earnedRewards 
    ? formatUnits(earnedRewards as bigint, 18) // SOVA token likely has 18 decimals
    : '0';

  const formattedTotalSupply = totalSupply 
    ? formatUnits(totalSupply as bigint, 8)
    : '0';

  const displayStakedAmount = parseFloat(formattedStakedAmount).toFixed(8);
  const displayEarnedRewards = parseFloat(formattedEarnedRewards).toFixed(6);
  const displayTotalSupply = parseFloat(formattedTotalSupply).toFixed(2);

  return {
    // User data
    stakedAmount: stakedAmount || BigInt(0),
    formattedStakedAmount,
    displayStakedAmount,
    earnedRewards: earnedRewards || BigInt(0),
    formattedEarnedRewards,
    displayEarnedRewards,
    
    // Pool data
    totalSupply: totalSupply || BigInt(0),
    formattedTotalSupply,
    displayTotalSupply,
    rewardRate: rewardRate || BigInt(0),
    rewardPerToken: rewardPerToken || BigInt(0),
    
    // Calculated metrics
    apy: calculateAPY(),
    isRewardsActive,
    timeRemainingInRewards,
    timeRemainingFormatted: formatTimeRemaining(timeRemainingInRewards),
    
    // Loading states
    isLoading: isLoadingStaked || isLoadingRewards,
    isLoadingStaked,
    isLoadingRewards,
    
    // Refetch functions
    refetch: () => {
      refetchStaked();
      refetchRewards();
    },
    refetchStaked,
    refetchRewards,
  };
}