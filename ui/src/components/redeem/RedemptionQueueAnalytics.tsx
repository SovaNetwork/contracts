'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { formatTokenAmount } from '@/lib/formatters';
import { getTokenByAddress } from '@/contracts/addresses';
import { cn } from '@/lib/utils';

interface RedemptionQueueAnalyticsProps {
  className?: string;
}

export function RedemptionQueueAnalytics({ className }: RedemptionQueueAnalyticsProps) {
  const { address } = useAccount();
  
  const {
    allRedemptions,
    pendingRedemptions,
    redemptionCount,
    pendingCount,
  } = useTokenRedemption({
    userAddress: address,
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const tenDaysInSeconds = 10 * 24 * 3600;
    
    // Calculate queue position for user's redemptions
    const queuePositions = pendingRedemptions.map(redemption => {
      const position = pendingRedemptions.filter(r => 
        Number(r.requestTime) < Number(redemption.requestTime)
      ).length + 1;
      return { ...redemption, position };
    });

    // Calculate completion estimates
    const completionEstimates = pendingRedemptions.map(redemption => {
      const requestTime = Number(redemption.requestTime);
      const completionTime = requestTime + tenDaysInSeconds;
      const timeRemaining = Math.max(0, completionTime - now);
      
      return {
        ...redemption,
        completionTime,
        timeRemaining,
        isReady: timeRemaining === 0,
        daysRemaining: Math.ceil(timeRemaining / 86400),
        hoursRemaining: Math.ceil((timeRemaining % 86400) / 3600),
      };
    });

    // Calculate total values
    const totalSovaAmount = pendingRedemptions.reduce((sum, r) => sum + Number(r.sovaAmount), 0);
    const totalUnderlyingAmount = pendingRedemptions.reduce((sum, r) => sum + Number(r.underlyingAmount), 0);
    
    // Calculate average wait time
    const avgWaitTime = pendingRedemptions.length > 0 
      ? pendingRedemptions.reduce((sum, r) => sum + Number(r.requestTime), 0) / pendingRedemptions.length
      : 0;

    // Ready redemptions
    const readyCount = completionEstimates.filter(r => r.isReady).length;
    
    return {
      queuePositions,
      completionEstimates,
      totalSovaAmount,
      totalUnderlyingAmount,
      avgWaitTime,
      readyCount,
      pendingCount,
      totalCount: redemptionCount,
    };
  }, [pendingRedemptions, redemptionCount]);

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining <= 0) return 'Ready now';
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTokenInfo = (tokenAddress: Address) => {
    return getTokenByAddress(tokenAddress) || {
      symbol: 'Unknown',
      decimals: 18,
      name: 'Unknown Token'
    };
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="defi-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-blue-400">
              {analytics.pendingCount}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground/80">Active Redemptions</h3>
          <p className="text-xs text-foreground/60 mt-1">
            {analytics.readyCount} ready for fulfillment
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="defi-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-purple-400">
              {formatTokenAmount(BigInt(analytics.totalSovaAmount), 8, 2)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground/80">Total sovaBTC</h3>
          <p className="text-xs text-foreground/60 mt-1">
            In redemption queue
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="defi-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-green-400">
              {analytics.readyCount}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground/80">Ready Now</h3>
          <p className="text-xs text-foreground/60 mt-1">
            Can be fulfilled immediately
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="defi-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Timer className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-orange-400">
              {analytics.pendingCount - analytics.readyCount}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground/80">Pending</h3>
          <p className="text-xs text-foreground/60 mt-1">
            Still in wait period
          </p>
        </motion.div>
      </div>

      {/* Queue Position Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="defi-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold gradient-text flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Queue Position Tracker
          </h2>
          <div className="text-sm text-foreground/60">
            {analytics.queuePositions.length} active positions
          </div>
        </div>

        {analytics.queuePositions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
            <p className="text-foreground/60">No active redemptions</p>
            <p className="text-sm text-foreground/40 mt-2">
              Your redemptions will appear here once created
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.queuePositions.map((redemption, index) => {
              const tokenInfo = getTokenInfo(redemption.token as Address);
              const estimate = analytics.completionEstimates.find(e => e.id === redemption.id);
              
              return (
                <motion.div
                  key={redemption.id.toString()}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-lg border',
                    estimate?.isReady 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-background/30 border-border/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        estimate?.isReady 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      )}>
                        #{redemption.position}
                      </div>
                      <div>
                        <div className="font-medium">
                          Redemption #{redemption.id.toString()}
                        </div>
                        <div className="text-sm text-foreground/60">
                          {formatTokenAmount(redemption.sovaAmount, 8, 4)} sovaBTC → {tokenInfo.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'text-sm font-medium',
                        estimate?.isReady ? 'text-green-400' : 'text-orange-400'
                      )}>
                        {estimate?.isReady ? 'Ready' : formatTimeRemaining(estimate?.timeRemaining || 0)}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {estimate?.isReady ? 'Can fulfill now' : 'Time remaining'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        estimate?.isReady 
                          ? 'bg-green-400' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      )}
                      style={{ 
                        width: estimate?.isReady 
                          ? '100%' 
                          : `${Math.max(10, ((864000 - (estimate?.timeRemaining || 0)) / 864000) * 100)}%`
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Completion Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="defi-card p-6"
      >
        <h2 className="text-xl font-semibold gradient-text mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Completion Timeline
        </h2>

        {analytics.completionEstimates.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
            <p className="text-foreground/60">No upcoming completions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.completionEstimates
              .sort((a, b) => a.timeRemaining - b.timeRemaining)
              .map((estimate, index) => {
                const tokenInfo = getTokenInfo(estimate.token as Address);
                
                return (
                  <motion.div
                    key={estimate.id.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-background/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        estimate.isReady ? 'bg-green-400' : 'bg-orange-400'
                      )} />
                      <div>
                        <div className="text-sm font-medium">
                          #{estimate.id.toString()} • {formatTokenAmount(estimate.sovaAmount, 8, 2)} sovaBTC
                        </div>
                        <div className="text-xs text-foreground/60">
                          {tokenInfo.symbol} redemption
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'text-sm font-medium',
                        estimate.isReady ? 'text-green-400' : 'text-foreground'
                      )}>
                        {estimate.isReady ? 'Ready now' : formatTimeRemaining(estimate.timeRemaining)}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {estimate.isReady ? 'Can fulfill' : 'Est. completion'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </motion.div>
    </div>
  );
} 