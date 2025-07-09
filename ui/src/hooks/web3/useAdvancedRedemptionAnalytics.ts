import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

import { useTokenRedemption } from './useTokenRedemption';
import { getTokenByAddress } from '@/contracts/addresses';

export interface RedemptionAnalytics {
  // Queue Position Analytics
  queuePositions: Array<{
    id: bigint;
    position: number;
    user: Address;
    token: Address;
    sovaAmount: bigint;
    underlyingAmount: bigint;
    requestTime: bigint;
    estimatedCompletionTime: number;
    timeRemaining: number;
    isReady: boolean;
    progress: number;
  }>;
  
  // Completion Estimates
  completionEstimates: Array<{
    id: bigint;
    completionTime: number;
    timeRemaining: number;
    daysRemaining: number;
    hoursRemaining: number;
    isReady: boolean;
    token: Address;
    sovaAmount: bigint;
    underlyingAmount: bigint;
  }>;
  
  // Aggregated Statistics
  totalStats: {
    totalRedemptions: number;
    pendingRedemptions: number;
    readyRedemptions: number;
    completedRedemptions: number;
    totalSovaAmount: bigint;
    totalUnderlyingValue: bigint;
    averageWaitTime: number;
    longestWaitTime: number;
    shortestWaitTime: number;
  };
  
  // Token Distribution
  tokenDistribution: Array<{
    token: Address;
    symbol: string;
    name: string;
    totalAmount: bigint;
    pendingAmount: bigint;
    readyAmount: bigint;
    completedAmount: bigint;
    redemptionCount: number;
    averageAmount: bigint;
    decimals: number;
  }>;
  
  // Timeline Analytics
  timelineAnalytics: Array<{
    date: string;
    readyCount: number;
    pendingCount: number;
    completedCount: number;
    totalValue: bigint;
  }>;
  
  // User-Specific Analytics
  userAnalytics: {
    totalRedemptions: number;
    pendingRedemptions: number;
    readyRedemptions: number;
    completedRedemptions: number;
    totalValue: bigint;
    averageRedemptionSize: bigint;
    estimatedTotalCompletion: number;
    nextRedemptionReady: number | null;
  };
  
  // Queue Health Metrics
  queueHealth: {
    averageProcessingTime: number;
    queueVelocity: number; // redemptions per day
    backlogSize: number;
    estimatedClearTime: number;
    isHealthy: boolean;
    bottlenecks: string[];
  };
}

interface UseAdvancedRedemptionAnalyticsProps {
  userAddress?: Address;
  refreshInterval?: number;
}

export function useAdvancedRedemptionAnalytics({ 
  userAddress, 
  refreshInterval = 10000 
}: UseAdvancedRedemptionAnalyticsProps = {}): RedemptionAnalytics {
  const { address: connectedAddress } = useAccount();
  const effectiveAddress = userAddress || connectedAddress;
  
  const {
    allRedemptions,
    pendingRedemptions,
    redemptionCount,
    pendingCount,
  } = useTokenRedemption({
    userAddress: effectiveAddress,
  });

  const analytics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const REDEMPTION_DELAY = 10 * 24 * 3600; // 10 days in seconds
    
    // Calculate queue positions
    const queuePositions = pendingRedemptions.map(redemption => {
      const position = pendingRedemptions.filter(r => 
        Number(r.requestTime) < Number(redemption.requestTime)
      ).length + 1;
      
      const requestTime = Number(redemption.requestTime);
      const estimatedCompletionTime = requestTime + REDEMPTION_DELAY;
      const timeRemaining = Math.max(0, estimatedCompletionTime - now);
      const progress = Math.min(100, ((now - requestTime) / REDEMPTION_DELAY) * 100);
      
      return {
        id: redemption.id,
        position,
        user: redemption.user,
        token: redemption.token,
        sovaAmount: redemption.sovaAmount,
        underlyingAmount: redemption.underlyingAmount,
        requestTime: redemption.requestTime,
        estimatedCompletionTime,
        timeRemaining,
        isReady: timeRemaining === 0,
        progress,
      };
    });

    // Calculate completion estimates
    const completionEstimates = allRedemptions.map(redemption => {
      const requestTime = Number(redemption.requestTime);
      const completionTime = requestTime + REDEMPTION_DELAY;
      const timeRemaining = Math.max(0, completionTime - now);
      
      return {
        id: redemption.id,
        completionTime,
        timeRemaining,
        daysRemaining: Math.ceil(timeRemaining / 86400),
        hoursRemaining: Math.ceil((timeRemaining % 86400) / 3600),
        isReady: timeRemaining === 0 && !redemption.fulfilled,
        token: redemption.token,
        sovaAmount: redemption.sovaAmount,
        underlyingAmount: redemption.underlyingAmount,
      };
    });

    // Calculate aggregated statistics
    const readyRedemptions = completionEstimates.filter(e => e.isReady).length;
    const completedRedemptions = allRedemptions.filter(r => r.fulfilled).length;
    
    const totalSovaAmount = allRedemptions.reduce((sum, r) => sum + r.sovaAmount, 0n);
    const totalUnderlyingValue = allRedemptions.reduce((sum, r) => sum + r.underlyingAmount, 0n);
    
    const waitTimes = allRedemptions
      .filter(r => r.fulfilled)
      .map(r => now - Number(r.requestTime));
    
    const averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
      : 0;
    const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const shortestWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;

    const totalStats = {
      totalRedemptions: redemptionCount,
      pendingRedemptions: pendingCount,
      readyRedemptions,
      completedRedemptions,
      totalSovaAmount,
      totalUnderlyingValue,
      averageWaitTime,
      longestWaitTime,
      shortestWaitTime,
    };

    // Calculate token distribution
    const tokenMap = new Map<string, {
      token: Address;
      symbol: string;
      name: string;
      totalAmount: bigint;
      pendingAmount: bigint;
      readyAmount: bigint;
      completedAmount: bigint;
      redemptionCount: number;
      decimals: number;
    }>();

    allRedemptions.forEach(redemption => {
      const tokenAddr = redemption.token as Address;
      const tokenInfo = getTokenByAddress(tokenAddr);
      const key = tokenAddr.toLowerCase();
      
      if (!tokenMap.has(key)) {
        tokenMap.set(key, {
          token: tokenAddr,
          symbol: tokenInfo?.symbol || 'Unknown',
          name: tokenInfo?.name || 'Unknown Token',
          totalAmount: 0n,
          pendingAmount: 0n,
          readyAmount: 0n,
          completedAmount: 0n,
          redemptionCount: 0,
          decimals: tokenInfo?.decimals || 18,
        });
      }
      
      const tokenData = tokenMap.get(key)!;
      tokenData.totalAmount += redemption.underlyingAmount;
      tokenData.redemptionCount++;
      
      if (redemption.fulfilled) {
        tokenData.completedAmount += redemption.underlyingAmount;
      } else {
        const estimate = completionEstimates.find(e => e.id === redemption.id);
        if (estimate?.isReady) {
          tokenData.readyAmount += redemption.underlyingAmount;
        } else {
          tokenData.pendingAmount += redemption.underlyingAmount;
        }
      }
    });

    const tokenDistribution = Array.from(tokenMap.values()).map(tokenData => ({
      ...tokenData,
      averageAmount: tokenData.redemptionCount > 0 
        ? tokenData.totalAmount / BigInt(tokenData.redemptionCount)
        : 0n,
    }));

    // Calculate timeline analytics (simplified - in production would use historical data)
    const timelineAnalytics = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // This is simplified - in production would calculate actual historical data
      const dayRedemptions = allRedemptions.filter(r => {
        const redemptionDate = new Date(Number(r.requestTime) * 1000);
        return redemptionDate.toDateString() === date.toDateString();
      });
      
      timelineAnalytics.push({
        date: date.toISOString().split('T')[0],
        readyCount: dayRedemptions.filter(r => {
          const estimate = completionEstimates.find(e => e.id === r.id);
          return estimate?.isReady;
        }).length,
        pendingCount: dayRedemptions.filter(r => !r.fulfilled).length,
        completedCount: dayRedemptions.filter(r => r.fulfilled).length,
        totalValue: dayRedemptions.reduce((sum, r) => sum + r.sovaAmount, 0n),
      });
    }

    // Calculate user-specific analytics
    const userRedemptions = allRedemptions.filter(r => 
      r.user.toLowerCase() === effectiveAddress?.toLowerCase()
    );
    
    const userPendingRedemptions = userRedemptions.filter(r => !r.fulfilled);
    const userReadyRedemptions = userPendingRedemptions.filter(r => {
      const estimate = completionEstimates.find(e => e.id === r.id);
      return estimate?.isReady;
    });
    
    const userTotalValue = userRedemptions.reduce((sum, r) => sum + r.sovaAmount, 0n);
    const userAverageRedemptionSize = userRedemptions.length > 0 
      ? userTotalValue / BigInt(userRedemptions.length)
      : 0n;
    
    const userEstimates = userPendingRedemptions.map(r => {
      const estimate = completionEstimates.find(e => e.id === r.id);
      return estimate?.completionTime || 0;
    });
    
    const userEstimatedTotalCompletion = userEstimates.length > 0 
      ? Math.max(...userEstimates)
      : 0;
    
    const userNextRedemptionReady = userEstimates.length > 0 
      ? Math.min(...userEstimates.filter(t => t > now))
      : null;

    const userAnalytics = {
      totalRedemptions: userRedemptions.length,
      pendingRedemptions: userPendingRedemptions.length,
      readyRedemptions: userReadyRedemptions.length,
      completedRedemptions: userRedemptions.filter(r => r.fulfilled).length,
      totalValue: userTotalValue,
      averageRedemptionSize: userAverageRedemptionSize,
      estimatedTotalCompletion: userEstimatedTotalCompletion,
      nextRedemptionReady: userNextRedemptionReady,
    };

    // Calculate queue health metrics
    const backlogSize = pendingRedemptions.length;
    const queueVelocity = completedRedemptions / Math.max(1, (now - Math.min(...allRedemptions.map(r => Number(r.requestTime)))) / 86400);
    const estimatedClearTime = backlogSize > 0 ? (backlogSize / Math.max(0.1, queueVelocity)) * 86400 : 0;
    const averageProcessingTime = averageWaitTime;
    
    const bottlenecks = [];
    if (backlogSize > 100) bottlenecks.push('High queue volume');
    if (queueVelocity < 1) bottlenecks.push('Low processing velocity');
    if (readyRedemptions > 10) bottlenecks.push('Ready redemptions awaiting fulfillment');
    
    const queueHealth = {
      averageProcessingTime,
      queueVelocity,
      backlogSize,
      estimatedClearTime,
      isHealthy: bottlenecks.length === 0,
      bottlenecks,
    };

    return {
      queuePositions,
      completionEstimates,
      totalStats,
      tokenDistribution,
      timelineAnalytics,
      userAnalytics,
      queueHealth,
    };
  }, [allRedemptions, pendingRedemptions, redemptionCount, pendingCount, effectiveAddress]);

  return analytics;
} 