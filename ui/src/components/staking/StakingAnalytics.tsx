'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Users, 
  Target,
  Activity,
  Coins,
  Calendar,
  Award,
  PieChart,
  Plus
} from 'lucide-react';
import { useAccount } from 'wagmi';

import { useStaking } from '@/hooks/web3/useStaking';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface StakingAnalyticsProps {
  className?: string;
}

export function StakingAnalytics({ className }: StakingAnalyticsProps) {
  const { address } = useAccount();
  
  const {
    stakingPools,
    stakingAnalytics,
    usePendingRewards,
    useUserInfo,
    usePoolInfo,
  } = useStaking({ userAddress: address });

  // Calculate user-specific metrics
  const userMetrics = useMemo(() => {
    if (!address) return null;
    
    let totalStaked = 0n;
    let totalRewards = 0n;
    let activePositions = 0;
    let lockedPositions = 0;
    let totalYield = 0;
    
    // This would need to be calculated from actual user data
    // For now, using placeholder values
    
    return {
      totalStaked,
      totalRewards,
      activePositions,
      lockedPositions,
      totalYield,
      averageAPR: 0,
      portfolioValue: 0,
    };
  }, [address]);

  // Calculate protocol metrics
  const protocolMetrics = useMemo(() => {
    const totalTVL = stakingPools.reduce((sum, pool) => sum + pool.totalStaked, 0n);
    const averageAPR = stakingPools.length > 0 
      ? stakingPools.reduce((sum, pool) => sum + (pool.apr || 0), 0) / stakingPools.length
      : 0;
    
    const highestAPR = stakingPools.reduce((max, pool) => 
      Math.max(max, pool.apr || 0), 0
    );
    
    return {
      totalTVL,
      averageAPR,
      highestAPR,
      totalPools: stakingPools.length,
      activeStakers: 0, // Would need contract call
      totalRewardsDistributed: 0n, // Would need contract call
    };
  }, [stakingPools]);

  // Yield projections
  const yieldProjections = useMemo(() => {
    if (!userMetrics) return [];
    
    const projections = [
      { period: '1 Day', multiplier: 1, suffix: 'day' },
      { period: '1 Week', multiplier: 7, suffix: 'week' },
      { period: '1 Month', multiplier: 30, suffix: 'month' },
      { period: '3 Months', multiplier: 90, suffix: 'quarter' },
      { period: '1 Year', multiplier: 365, suffix: 'year' },
    ];
    
    return projections.map(proj => ({
      ...proj,
      yield: userMetrics.totalYield * proj.multiplier,
      compoundYield: userMetrics.totalYield * proj.multiplier * 1.1, // Simple compound estimate
    }));
  }, [userMetrics]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Staking Analytics</h2>
          <p className="text-foreground/60 mt-1">
            Track your yields and protocol performance
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Live Analytics</span>
        </motion.div>
      </div>

      {/* Protocol Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="defi-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {formatTokenAmount(protocolMetrics.totalTVL, 18, 2)}
          </div>
          <div className="text-sm text-foreground/60">Total Value Locked</div>
        </div>

        <div className="defi-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {protocolMetrics.averageAPR.toFixed(2)}%
          </div>
          <div className="text-sm text-foreground/60">Average APR</div>
        </div>

        <div className="defi-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-3">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {protocolMetrics.highestAPR.toFixed(2)}%
          </div>
          <div className="text-sm text-foreground/60">Highest APR</div>
        </div>

        <div className="defi-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mx-auto mb-3">
            <Users className="w-6 h-6 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {protocolMetrics.totalPools}
          </div>
          <div className="text-sm text-foreground/60">Active Pools</div>
        </div>
      </motion.div>

      {/* User Portfolio (if connected) */}
      {address && userMetrics && (
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Your Portfolio</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <Calendar className="w-4 h-4" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-defi-purple" />
                <span className="font-medium">Staked Assets</span>
              </div>
              <div className="text-2xl font-bold">
                {formatTokenAmount(userMetrics.totalStaked, 18, 4)} sovaBTC
              </div>
              <div className="text-sm text-foreground/60">
                ≈ ${(Number(formatTokenAmount(userMetrics.totalStaked, 18, 6)) * 1000).toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-400" />
                <span className="font-medium">Pending Rewards</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatTokenAmount(userMetrics.totalRewards, 18, 4)} SOVA
              </div>
              <div className="text-sm text-foreground/60">
                ≈ ${(Number(formatTokenAmount(userMetrics.totalRewards, 18, 6)) * 100).toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Active Positions</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {userMetrics.activePositions}
              </div>
              <div className="text-sm text-foreground/60">
                {userMetrics.lockedPositions} locked
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Yield Projections */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Yield Projections</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <PieChart className="w-4 h-4" />
            <span>Estimated returns</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {yieldProjections.map((projection, index) => (
            <div key={projection.period} className="p-4 bg-background/30 rounded-lg">
              <div className="text-sm font-medium text-foreground/60 mb-2">
                {projection.period}
              </div>
              <div className="text-xl font-bold text-green-400">
                {projection.yield.toFixed(4)} SOVA
              </div>
              <div className="text-xs text-foreground/60">
                ≈ ${(projection.yield * 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <Target className="w-4 h-4" />
            <span>
              Projections based on current APR and do not account for compound interest or market changes
            </span>
          </div>
        </div>
      </motion.div>

      {/* Pool Performance Rankings */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Pool Performance</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <BarChart3 className="w-4 h-4" />
            <span>Ranked by APR</span>
          </div>
        </div>

        <div className="space-y-3">
          {stakingPools
            .sort((a, b) => (b.apr || 0) - (a.apr || 0))
            .map((pool, index) => (
              <div
                key={pool.id}
                className="flex items-center justify-between p-3 bg-background/30 rounded-lg hover:bg-background/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-defi-purple/20 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {pool.stakingTokenSymbol} → {pool.rewardTokenSymbol}
                    </div>
                    <div className="text-sm text-foreground/60">
                      TVL: {formatTokenAmount(pool.totalStaked, 18, 2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {(pool.apr || 0).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground/60">
                    APR
                  </div>
                </div>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Stake More</span>
            </div>
            <div className="text-sm text-foreground/60">
              Increase your staking positions
            </div>
          </button>

          <button className="p-4 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-2 text-orange-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="font-medium">Claim All</span>
            </div>
            <div className="text-sm text-foreground/60">
              Claim all pending rewards
            </div>
          </button>

          <button className="p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Optimize</span>
            </div>
            <div className="text-sm text-foreground/60">
              Find better yield opportunities
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 