'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Coins, 
  Activity, 
  TrendingUp, 
  MapPin, 
  Zap,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

import { type PortfolioData } from '@/hooks/web3/usePortfolioAnalytics';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CrossNetworkVisualizationProps {
  portfolioData: PortfolioData | null;
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function CrossNetworkVisualization({
  portfolioData,
  timeRange,
  isLoading = false,
  className,
}: CrossNetworkVisualizationProps) {
  // Calculate network metrics
  const networkMetrics = useMemo(() => {
    if (!portfolioData) return null;

    const networks = portfolioData.networks.map(network => ({
      ...network,
      avgAssetValue: network.assets.length > 0 
        ? network.totalValue / network.assets.length 
        : 0,
      riskScore: Math.random() * 30 + 20, // Mock risk score
      bridgeVolume: Math.random() * 10000 + 5000, // Mock bridge volume
      gasEfficiency: Math.random() * 40 + 60, // Mock gas efficiency
    }));

    const totalValue = portfolioData.totalValue;
    const totalAssets = portfolioData.totalAssets;
    const topNetwork = networks.reduce((top, current) => 
      current.totalValue > top.totalValue ? current : top
    );

    return {
      networks,
      totalValue,
      totalAssets,
      topNetwork,
      networkCount: networks.length,
      diversity: networks.length > 1 ? (1 - (topNetwork.percentage / 100)) : 0,
    };
  }, [portfolioData]);

  // Loading skeleton
  if (isLoading || !networkMetrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="defi-card p-6">
              <div className="h-4 w-24 bg-slate-700/50 rounded shimmer mb-4" />
              <div className="h-8 w-32 bg-slate-700/50 rounded shimmer mb-2" />
              <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
            </div>
          ))}
        </div>
        
        <div className="defi-card p-6">
          <div className="h-6 w-40 bg-slate-700/50 rounded shimmer mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-700/50 rounded shimmer" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-700/50 rounded shimmer" />
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

  const getNetworkColor = (networkName: string) => {
    if (networkName.includes('Base')) return 'bg-blue-500';
    if (networkName.includes('Optimism')) return 'bg-red-500';
    if (networkName.includes('Ethereum')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getNetworkIcon = (networkName: string) => {
    if (networkName.includes('Base')) return '🔷';
    if (networkName.includes('Optimism')) return '🔴';
    if (networkName.includes('Ethereum')) return '💎';
    return '🌐';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('space-y-6', className)}
    >
      {/* Network Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-defi-blue" />
              <span className="text-sm font-medium text-foreground/60">Total Networks</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{networkMetrics.networkCount}</div>
          <div className="text-sm text-foreground/60">
            Across {networkMetrics.totalAssets} assets
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-defi-purple" />
              <span className="text-sm font-medium text-foreground/60">Diversity Index</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {(networkMetrics.diversity * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            Portfolio spread
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-foreground/60">Top Network</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {getNetworkIcon(networkMetrics.topNetwork.networkName)}
          </div>
          <div className="text-sm text-foreground/60">
            {networkMetrics.topNetwork.networkName}
          </div>
        </motion.div>
      </div>

      {/* Network Distribution */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Network Distribution</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <MapPin className="w-4 h-4" />
            <span>Real-time</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Cards */}
          <div className="space-y-4">
            {networkMetrics.networks.map((network, index) => (
              <motion.div
                key={network.networkId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="defi-card p-4 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      getNetworkColor(network.networkName)
                    )} />
                    <div>
                      <div className="font-medium">{network.networkName}</div>
                      <div className="text-sm text-foreground/60">
                        {network.assets.length} assets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${network.totalValue.toLocaleString()}</div>
                    <div className="text-sm text-foreground/60">
                      {network.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-background/30 rounded-full h-2 mb-3">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      getNetworkColor(network.networkName)
                    )}
                    style={{ width: `${network.percentage}%` }}
                  />
                </div>

                {/* Network Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm font-medium text-green-400">
                      {network.gasEfficiency.toFixed(0)}%
                    </div>
                    <div className="text-xs text-foreground/60">Gas Efficiency</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-yellow-400">
                      {network.riskScore.toFixed(0)}
                    </div>
                    <div className="text-xs text-foreground/60">Risk Score</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-defi-purple">
                      ${network.bridgeVolume.toLocaleString()}
                    </div>
                    <div className="text-xs text-foreground/60">Bridge Volume</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Network Comparison Chart */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground/80">Network Comparison</h4>
            
            {/* Value Comparison */}
            <div className="space-y-3">
              <div className="text-sm text-foreground/60">Total Value Distribution</div>
              <div className="space-y-2">
                {networkMetrics.networks.map((network, index) => (
                  <div key={network.networkId} className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-foreground/60">
                      {network.networkName.split(' ')[0]}
                    </div>
                    <div className="flex-1 bg-background/30 rounded-full h-2">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all duration-500',
                          getNetworkColor(network.networkName)
                        )}
                        style={{ width: `${network.percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-right">
                      {network.percentage.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk vs Return */}
            <div className="space-y-3">
              <div className="text-sm text-foreground/60">Risk vs Value</div>
              <div className="grid grid-cols-2 gap-2">
                {networkMetrics.networks.map((network) => (
                  <div key={network.networkId} className="p-3 bg-background/20 rounded-lg">
                    <div className="text-sm font-medium mb-1">
                      {network.networkName.split(' ')[0]}
                    </div>
                    <div className="text-xs text-foreground/60">
                      ${network.totalValue.toLocaleString()} • Risk: {network.riskScore.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Network Assets Detail */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Assets by Network</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Coins className="w-4 h-4" />
            <span>Detailed breakdown</span>
          </div>
        </div>

        <div className="space-y-6">
          {networkMetrics.networks.map((network) => (
            <div key={network.networkId} className="border border-border/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-4 h-4 rounded-full',
                    getNetworkColor(network.networkName)
                  )} />
                  <h4 className="font-medium">{network.networkName}</h4>
                </div>
                <div className="text-sm text-foreground/60">
                  {network.assets.length} assets • ${network.totalValue.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {network.assets.map((asset) => (
                  <div key={asset.address} className="p-3 bg-background/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-foreground/60">
                        {asset.allocation.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-sm text-foreground/60 mb-1">
                      {formatTokenAmount(asset.balance, asset.decimals, 4)}
                    </div>
                    <div className="text-sm font-medium">
                      ${asset.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bridge Opportunities */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Bridge Opportunities</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Zap className="w-4 h-4" />
            <span>LayerZero V2</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="font-medium text-green-400">Optimal Distribution</div>
            </div>
            <div className="text-sm text-foreground/60 mb-3">
              Your assets are well-distributed across networks, reducing single-point risk.
            </div>
            <div className="text-xs text-foreground/60">
              Bridge fees: ~0.001 ETH • Completion: 2-5 minutes
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <div className="font-medium text-blue-400">Recent Activity</div>
            </div>
            <div className="text-sm text-foreground/60 mb-3">
              No recent bridge transactions detected. Consider rebalancing for better yields.
            </div>
            <div className="text-xs text-foreground/60">
              Last bridge: N/A • Suggested: Rebalance to highest yield network
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 