'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  Activity, 
  Shield, 
  Target, 
  BarChart3,
  PieChart,
  Zap,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

import { 
  type PortfolioData, 
  type PerformanceMetrics, 
  type RiskMetrics 
} from '@/hooks/web3/usePortfolioAnalytics';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PortfolioOverviewProps {
  portfolioData: PortfolioData | null;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function PortfolioOverview({
  portfolioData,
  performanceMetrics,
  riskMetrics,
  timeRange,
  isLoading = false,
  className,
}: PortfolioOverviewProps) {
  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!portfolioData || !performanceMetrics || !riskMetrics) return null;

    const totalValue = portfolioData.totalValue;
    const totalReturn = performanceMetrics.totalReturn;
    const isPositive = totalReturn >= 0;
    
    return {
      totalValue,
      totalReturn,
      isPositive,
      annualizedReturn: performanceMetrics.annualizedReturn,
      sharpeRatio: performanceMetrics.sharpeRatio,
      maxDrawdown: performanceMetrics.maxDrawdown,
      volatility: performanceMetrics.volatility,
      riskScore: riskMetrics.riskScore,
      riskLevel: riskMetrics.riskLevel,
      yieldAPR: performanceMetrics.yieldAPR,
      winRate: performanceMetrics.winRate,
    };
  }, [portfolioData, performanceMetrics, riskMetrics]);

  // Loading skeleton
  if (isLoading || !keyMetrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="defi-card p-6">
              <div className="h-4 w-20 bg-slate-700/50 rounded shimmer mb-2" />
              <div className="h-8 w-32 bg-slate-700/50 rounded shimmer mb-2" />
              <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="defi-card p-6">
            <div className="h-6 w-40 bg-slate-700/50 rounded shimmer mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-700/50 rounded shimmer" />
                  <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="defi-card p-6">
            <div className="h-6 w-40 bg-slate-700/50 rounded shimmer mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-700/50 rounded shimmer" />
                  <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
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
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-foreground/60">Total Value</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${keyMetrics.totalValue.toLocaleString()}
              </div>
              <div className={cn(
                'text-sm font-medium',
                keyMetrics.isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {keyMetrics.isPositive ? '+' : ''}{(keyMetrics.totalReturn * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-defi-purple" />
              <span className="text-sm font-medium text-foreground/60">Performance</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {(keyMetrics.annualizedReturn * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-foreground/60">
                Annualized
              </div>
            </div>
          </div>
        </motion.div>

        {/* Risk Score */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-foreground/60">Risk Score</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {keyMetrics.riskScore.toFixed(0)}
              </div>
              <div className={cn(
                'text-sm font-medium',
                keyMetrics.riskLevel === 'Low' && 'text-green-400',
                keyMetrics.riskLevel === 'Medium' && 'text-yellow-400',
                keyMetrics.riskLevel === 'High' && 'text-orange-400',
                keyMetrics.riskLevel === 'Very High' && 'text-red-400'
              )}>
                {keyMetrics.riskLevel}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Yield APR */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-defi-pink" />
              <span className="text-sm font-medium text-foreground/60">Yield APR</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {keyMetrics.yieldAPR.toFixed(1)}%
              </div>
              <div className="text-sm text-foreground/60">
                From staking
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Portfolio Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Asset Allocation</h3>
            <PieChart className="w-5 h-5 text-foreground/60" />
          </div>

          <div className="space-y-4">
            {portfolioData?.assets.map((asset, index) => (
              <div key={asset.address} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    index === 0 && 'bg-defi-purple',
                    index === 1 && 'bg-defi-pink',
                    index === 2 && 'bg-defi-blue'
                  )} />
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-foreground/60">
                      {formatTokenAmount(asset.balance, asset.decimals, 4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{asset.allocation.toFixed(1)}%</div>
                  <div className="text-sm text-foreground/60">
                    ${asset.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Strategy Breakdown */}
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Strategy Breakdown</h3>
            <BarChart3 className="w-5 h-5 text-foreground/60" />
          </div>

          <div className="space-y-4">
            {portfolioData && Object.entries(portfolioData.allocationByStrategy).map(([strategy, percentage], index) => (
              <div key={strategy} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    strategy === 'Liquid' && 'bg-green-400',
                    strategy === 'Staked' && 'bg-defi-purple',
                    strategy === 'Pending Redemption' && 'bg-yellow-400'
                  )} />
                  <div>
                    <div className="font-medium">{strategy}</div>
                    <div className="text-sm text-foreground/60">
                      {strategy === 'Liquid' && 'Available for use'}
                      {strategy === 'Staked' && 'Earning SOVA rewards'}
                      {strategy === 'Pending Redemption' && 'In queue'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{percentage.toFixed(1)}%</div>
                  <div className="text-sm text-foreground/60">
                    ${((percentage / 100) * keyMetrics.totalValue).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Performance Summary</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Clock className="w-4 h-4" />
            <span>{timeRange.toUpperCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {(keyMetrics.sharpeRatio).toFixed(2)}
            </div>
            <div className="text-sm text-foreground/60">Sharpe Ratio</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {(keyMetrics.maxDrawdown * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-foreground/60">Max Drawdown</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {(keyMetrics.volatility * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-foreground/60">Volatility</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {keyMetrics.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-foreground/60">Win Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Insights */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Quick Insights</h3>
          <Info className="w-5 h-5 text-foreground/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-400 mb-1">Strong Performance</div>
              <div className="text-sm text-foreground/60">
                Your portfolio is outperforming with {(keyMetrics.annualizedReturn * 100).toFixed(1)}% annualized returns
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-400 mb-1">Risk Level: {keyMetrics.riskLevel}</div>
              <div className="text-sm text-foreground/60">
                Current risk score is {keyMetrics.riskScore.toFixed(0)}/100. Consider diversification.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 