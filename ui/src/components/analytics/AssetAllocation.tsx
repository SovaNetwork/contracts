'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Coins,
  DollarSign,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';

import { 
  type PortfolioData, 
  type PerformanceMetrics 
} from '@/hooks/web3/usePortfolioAnalytics';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AssetAllocationProps {
  portfolioData: PortfolioData | null;
  performanceMetrics: PerformanceMetrics | null;
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function AssetAllocation({
  portfolioData,
  performanceMetrics,
  timeRange,
  isLoading = false,
  className,
}: AssetAllocationProps) {
  // Calculate allocation insights
  const allocationInsights = useMemo(() => {
    if (!portfolioData || !performanceMetrics) return null;

    const assets = portfolioData.assets;
    const totalValue = portfolioData.totalValue;
    
    // Calculate ideal allocation (simplified)
    const idealAllocation = {
      'sovaBTC': 60,
      'SOVA': 40,
    };

    // Calculate current vs ideal deviation
    const deviations = Object.entries(idealAllocation).map(([asset, ideal]) => {
      const current = portfolioData.allocationByAsset[asset] || 0;
      const deviation = current - ideal;
      return {
        asset,
        current,
        ideal,
        deviation,
        needsRebalancing: Math.abs(deviation) > 10,
      };
    });

    // Calculate concentration risk
    const maxAllocation = Math.max(...Object.values(portfolioData.allocationByAsset));
    const concentrationRisk = maxAllocation > 70 ? 'High' : maxAllocation > 50 ? 'Medium' : 'Low';

    // Calculate diversification score
    const diversificationScore = 100 - maxAllocation;

    return {
      deviations,
      concentrationRisk,
      diversificationScore,
      needsRebalancing: deviations.some(d => d.needsRebalancing),
    };
  }, [portfolioData, performanceMetrics]);

  // Loading skeleton
  if (isLoading || !portfolioData || !allocationInsights) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Allocation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-defi-purple" />
              <span className="text-sm font-medium text-foreground/60">Diversification</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {allocationInsights.diversificationScore.toFixed(0)}%
          </div>
          <div className="text-sm text-foreground/60">
            Portfolio spread
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-foreground/60">Concentration</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {allocationInsights.concentrationRisk}
          </div>
          <div className="text-sm text-foreground/60">
            Risk level
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-foreground/60">Balance Status</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {allocationInsights.needsRebalancing ? '⚠️' : '✅'}
          </div>
          <div className="text-sm text-foreground/60">
            {allocationInsights.needsRebalancing ? 'Needs attention' : 'Balanced'}
          </div>
        </motion.div>
      </div>

      {/* Current Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Current Allocation</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <PieChart className="w-4 h-4" />
              <span>By asset</span>
            </div>
          </div>

          <div className="space-y-4">
            {portfolioData.assets.map((asset, index) => (
              <div key={asset.address} className="space-y-2">
                <div className="flex items-center justify-between">
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
                
                <div className="w-full bg-background/30 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      index === 0 && 'bg-defi-purple',
                      index === 1 && 'bg-defi-pink',
                      index === 2 && 'bg-defi-blue'
                    )}
                    style={{ width: `${asset.allocation}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Strategy Allocation</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <BarChart3 className="w-4 h-4" />
              <span>By strategy</span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(portfolioData.allocationByStrategy).map(([strategy, percentage], index) => (
              <div key={strategy} className="space-y-2">
                <div className="flex items-center justify-between">
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
                        {strategy === 'Staked' && 'Earning rewards'}
                        {strategy === 'Pending Redemption' && 'In redemption queue'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{percentage.toFixed(1)}%</div>
                    <div className="text-sm text-foreground/60">
                      ${((percentage / 100) * portfolioData.totalValue).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-background/30 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      strategy === 'Liquid' && 'bg-green-400',
                      strategy === 'Staked' && 'bg-defi-purple',
                      strategy === 'Pending Redemption' && 'bg-yellow-400'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Network Distribution */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Network Distribution</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Coins className="w-4 h-4" />
            <span>Cross-chain spread</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioData.networks.map((network, index) => (
            <div key={network.networkId} className="p-4 bg-background/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    network.networkName.includes('Base') && 'bg-blue-500',
                    network.networkName.includes('Optimism') && 'bg-red-500',
                    network.networkName.includes('Ethereum') && 'bg-purple-500'
                  )} />
                  <span className="font-medium">{network.networkName}</span>
                </div>
                <span className="text-sm text-foreground/60">
                  {network.percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="text-2xl font-bold mb-1">
                ${network.totalValue.toLocaleString()}
              </div>
              
              <div className="text-sm text-foreground/60 mb-3">
                {network.assets.length} assets
              </div>
              
              <div className="w-full bg-background/30 rounded-full h-2">
                <div 
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    network.networkName.includes('Base') && 'bg-blue-500',
                    network.networkName.includes('Optimism') && 'bg-red-500',
                    network.networkName.includes('Ethereum') && 'bg-purple-500'
                  )}
                  style={{ width: `${network.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Rebalancing Recommendations */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Rebalancing Analysis</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <RefreshCw className="w-4 h-4" />
            <span>Optimization suggestions</span>
          </div>
        </div>

        <div className="space-y-4">
          {allocationInsights.deviations.map((deviation) => (
            <div key={deviation.asset} className="p-4 bg-background/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full',
                    deviation.asset === 'sovaBTC' && 'bg-defi-purple',
                    deviation.asset === 'SOVA' && 'bg-defi-pink'
                  )} />
                  <span className="font-medium">{deviation.asset}</span>
                  {deviation.needsRebalancing && (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {deviation.current.toFixed(1)}% / {deviation.ideal}%
                  </div>
                  <div className={cn(
                    'text-sm',
                    deviation.deviation > 0 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {deviation.deviation > 0 ? '+' : ''}{deviation.deviation.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <div className="text-sm text-foreground/60">Current</div>
                <div className="flex-1 bg-background/30 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full',
                      deviation.asset === 'sovaBTC' && 'bg-defi-purple',
                      deviation.asset === 'SOVA' && 'bg-defi-pink'
                    )}
                    style={{ width: `${deviation.current}%` }}
                  />
                </div>
                <div className="text-sm text-foreground/60">{deviation.current.toFixed(1)}%</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm text-foreground/60">Target</div>
                <div className="flex-1 bg-background/30 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full opacity-50',
                      deviation.asset === 'sovaBTC' && 'bg-defi-purple',
                      deviation.asset === 'SOVA' && 'bg-defi-pink'
                    )}
                    style={{ width: `${deviation.ideal}%` }}
                  />
                </div>
                <div className="text-sm text-foreground/60">{deviation.ideal}%</div>
              </div>
            </div>
          ))}
        </div>

        {allocationInsights.needsRebalancing && (
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
              <div className="font-medium text-yellow-400">Rebalancing Recommended</div>
            </div>
            <div className="text-sm text-foreground/60 mb-3">
              Your portfolio allocation has deviated from the optimal target. Consider rebalancing to maintain risk levels.
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-defi-purple/20 text-defi-purple rounded-lg hover:bg-defi-purple/30 transition-colors">
                Auto-Rebalance
              </button>
              <button className="px-4 py-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                View Details
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
} 