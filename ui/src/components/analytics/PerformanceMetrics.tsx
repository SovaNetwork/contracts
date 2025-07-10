'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity,
  Award,
  Zap,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

import { 
  type PerformanceMetrics as PerformanceMetricsType, 
  type HistoricalDataPoint 
} from '@/hooks/web3/usePortfolioAnalytics';
import { cn } from '@/lib/utils';

interface PerformanceMetricsProps {
  performanceData: PerformanceMetricsType | null;
  historicalData: HistoricalDataPoint[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function PerformanceMetrics({
  performanceData,
  historicalData,
  timeRange,
  isLoading = false,
  className,
}: PerformanceMetricsProps) {
  // Calculate performance insights
  const performanceInsights = useMemo(() => {
    if (!performanceData) return null;

    const isPositive = performanceData.totalReturn >= 0;
    const performanceLevel = performanceData.totalReturn > 0.1 ? 'Excellent' : 
                           performanceData.totalReturn > 0.05 ? 'Good' : 
                           performanceData.totalReturn > 0 ? 'Fair' : 'Poor';

    const riskAdjustedReturn = performanceData.sharpeRatio;
    const riskLevel = riskAdjustedReturn > 1.5 ? 'Excellent' : 
                     riskAdjustedReturn > 1 ? 'Good' : 
                     riskAdjustedReturn > 0.5 ? 'Fair' : 'Poor';

    return {
      isPositive,
      performanceLevel,
      riskLevel,
      timeMultiplier: timeRange === '7d' ? 52 : timeRange === '30d' ? 12 : timeRange === '90d' ? 4 : 1,
    };
  }, [performanceData, timeRange]);

  // Loading skeleton
  if (isLoading || !performanceData || !performanceInsights) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="defi-card p-6">
              <div className="h-4 w-20 bg-slate-700/50 rounded shimmer mb-2" />
              <div className="h-8 w-32 bg-slate-700/50 rounded shimmer mb-2" />
              <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('space-y-6', className)}
    >
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={cn('w-5 h-5', performanceInsights.isPositive ? 'text-green-400' : 'text-red-400')} />
              <span className="text-sm font-medium text-foreground/60">Total Return</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {performanceInsights.isPositive ? '+' : ''}{(performanceData.totalReturn * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-foreground/60">
            {timeRange.toUpperCase()} period
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-defi-purple" />
              <span className="text-sm font-medium text-foreground/60">Annualized</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {(performanceData.annualizedReturn * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            APR equivalent
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-foreground/60">Sharpe Ratio</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {performanceData.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-sm text-foreground/60">
            Risk-adjusted
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-defi-pink" />
              <span className="text-sm font-medium text-foreground/60">Win Rate</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {performanceData.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            Positive periods
          </div>
        </motion.div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Return Analysis</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <Activity className="w-4 h-4" />
              <span>Performance breakdown</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background/20 rounded-lg">
              <div>
                <div className="font-medium">Best Day</div>
                <div className="text-sm text-foreground/60">
                  Highest single-day return
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  +{(performanceData.bestDay * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background/20 rounded-lg">
              <div>
                <div className="font-medium">Worst Day</div>
                <div className="text-sm text-foreground/60">
                  Lowest single-day return
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {(performanceData.worstDay * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background/20 rounded-lg">
              <div>
                <div className="font-medium">Max Drawdown</div>
                <div className="text-sm text-foreground/60">
                  Largest peak-to-trough decline
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">
                  -{(performanceData.maxDrawdown * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background/20 rounded-lg">
              <div>
                <div className="font-medium">Volatility</div>
                <div className="text-sm text-foreground/60">
                  Standard deviation of returns
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {(performanceData.volatility * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Yield Analysis</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <Zap className="w-4 h-4" />
              <span>Reward tracking</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
              <div>
                <div className="font-medium text-green-400">Staking APR</div>
                <div className="text-sm text-foreground/60">
                  Current staking yield
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {performanceData.yieldAPR.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
              <div>
                <div className="font-medium text-purple-400">Total Yield</div>
                <div className="text-sm text-foreground/60">
                  Cumulative rewards earned
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {performanceData.totalYield.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
              <div>
                <div className="font-medium text-blue-400">Calmar Ratio</div>
                <div className="text-sm text-foreground/60">
                  Return vs max drawdown
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {performanceData.calmarRatio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Comparison */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Benchmark Comparison</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <BarChart3 className="w-4 h-4" />
            <span>Market performance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full" />
                <span className="font-medium">BTC</span>
              </div>
              <div className="text-sm text-foreground/60">Bitcoin</div>
            </div>
            <div className="text-2xl font-bold mb-1">+12.5%</div>
            <div className="text-sm text-foreground/60">
              {timeRange.toUpperCase()} return
            </div>
          </div>

          <div className="p-4 bg-background/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span className="font-medium">ETH</span>
              </div>
              <div className="text-sm text-foreground/60">Ethereum</div>
            </div>
            <div className="text-2xl font-bold mb-1">+8.3%</div>
            <div className="text-sm text-foreground/60">
              {timeRange.toUpperCase()} return
            </div>
          </div>

          <div className="p-4 bg-background/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full" />
                <span className="font-medium">DeFi</span>
              </div>
              <div className="text-sm text-foreground/60">DeFi Index</div>
            </div>
            <div className="text-2xl font-bold mb-1">+15.7%</div>
            <div className="text-sm text-foreground/60">
              {timeRange.toUpperCase()} return
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Assessment */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Performance Assessment</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Info className="w-4 h-4" />
            <span>Analysis summary</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(
            'p-4 rounded-lg',
            performanceInsights.performanceLevel === 'Excellent' && 'bg-green-500/10',
            performanceInsights.performanceLevel === 'Good' && 'bg-blue-500/10',
            performanceInsights.performanceLevel === 'Fair' && 'bg-yellow-500/10',
            performanceInsights.performanceLevel === 'Poor' && 'bg-red-500/10'
          )}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className={cn(
                'w-5 h-5',
                performanceInsights.performanceLevel === 'Excellent' && 'text-green-400',
                performanceInsights.performanceLevel === 'Good' && 'text-blue-400',
                performanceInsights.performanceLevel === 'Fair' && 'text-yellow-400',
                performanceInsights.performanceLevel === 'Poor' && 'text-red-400'
              )} />
              <div className={cn(
                'font-medium',
                performanceInsights.performanceLevel === 'Excellent' && 'text-green-400',
                performanceInsights.performanceLevel === 'Good' && 'text-blue-400',
                performanceInsights.performanceLevel === 'Fair' && 'text-yellow-400',
                performanceInsights.performanceLevel === 'Poor' && 'text-red-400'
              )}>
                {performanceInsights.performanceLevel} Performance
              </div>
            </div>
            <div className="text-sm text-foreground/60 mb-3">
              Your portfolio has delivered {performanceInsights.performanceLevel.toLowerCase()} returns 
              over the {timeRange} period with {(performanceData.totalReturn * 100).toFixed(2)}% total return.
            </div>
            <div className="text-xs text-foreground/60">
              Total Return: {(performanceData.totalReturn * 100).toFixed(2)}% • 
              Annualized: {(performanceData.annualizedReturn * 100).toFixed(1)}%
            </div>
          </div>

          <div className={cn(
            'p-4 rounded-lg',
            performanceInsights.riskLevel === 'Excellent' && 'bg-green-500/10',
            performanceInsights.riskLevel === 'Good' && 'bg-blue-500/10',
            performanceInsights.riskLevel === 'Fair' && 'bg-yellow-500/10',
            performanceInsights.riskLevel === 'Poor' && 'bg-red-500/10'
          )}>
            <div className="flex items-center space-x-2 mb-2">
              <Target className={cn(
                'w-5 h-5',
                performanceInsights.riskLevel === 'Excellent' && 'text-green-400',
                performanceInsights.riskLevel === 'Good' && 'text-blue-400',
                performanceInsights.riskLevel === 'Fair' && 'text-yellow-400',
                performanceInsights.riskLevel === 'Poor' && 'text-red-400'
              )} />
              <div className={cn(
                'font-medium',
                performanceInsights.riskLevel === 'Excellent' && 'text-green-400',
                performanceInsights.riskLevel === 'Good' && 'text-blue-400',
                performanceInsights.riskLevel === 'Fair' && 'text-yellow-400',
                performanceInsights.riskLevel === 'Poor' && 'text-red-400'
              )}>
                {performanceInsights.riskLevel} Risk Management
              </div>
            </div>
            <div className="text-sm text-foreground/60 mb-3">
              Risk-adjusted returns are {performanceInsights.riskLevel.toLowerCase()} with a Sharpe ratio of {performanceData.sharpeRatio.toFixed(2)}.
            </div>
            <div className="text-xs text-foreground/60">
              Sharpe Ratio: {performanceData.sharpeRatio.toFixed(2)} • 
              Win Rate: {performanceData.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 