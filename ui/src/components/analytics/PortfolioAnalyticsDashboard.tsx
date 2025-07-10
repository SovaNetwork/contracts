'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign,
  Shield,
  Target,
  AlertTriangle,
  Coins,
  Network,
  Calendar,
  RefreshCw,
  Settings,
  Filter,
  Download,
  Share2,
  Info
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { usePortfolioAnalytics } from '@/hooks/web3/usePortfolioAnalytics';
import { PortfolioOverview } from './PortfolioOverview';
import { CrossNetworkVisualization } from './CrossNetworkVisualization';
import { HistoricalPerformance } from './HistoricalPerformance';
import { RiskMetrics } from './RiskMetrics';
import { AssetAllocation } from './AssetAllocation';
import { PerformanceMetrics } from './PerformanceMetrics';
import { cn } from '@/lib/utils';

type AnalyticsTabType = 'overview' | 'performance' | 'risk' | 'allocation' | 'network' | 'history';

interface PortfolioAnalyticsDashboardProps {
  className?: string;
}

export function PortfolioAnalyticsDashboard({ className }: PortfolioAnalyticsDashboardProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    portfolioData,
    historicalData,
    riskMetrics,
    performanceMetrics,
    isLoading,
    refetch,
  } = usePortfolioAnalytics({
    userAddress: address,
    timeRange,
    enabled: isConnected,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const tabs = [
    {
      id: 'overview' as AnalyticsTabType,
      label: 'Overview',
      icon: BarChart3,
      description: 'Portfolio summary and key metrics',
      enabled: true,
    },
    {
      id: 'performance' as AnalyticsTabType,
      label: 'Performance',
      icon: TrendingUp,
      description: 'Historical performance and yield analysis',
      enabled: true,
    },
    {
      id: 'risk' as AnalyticsTabType,
      label: 'Risk Analysis',
      icon: Shield,
      description: 'Risk assessment and volatility metrics',
      enabled: true,
    },
    {
      id: 'allocation' as AnalyticsTabType,
      label: 'Asset Allocation',
      icon: PieChart,
      description: 'Asset distribution and rebalancing insights',
      enabled: true,
    },
    {
      id: 'network' as AnalyticsTabType,
      label: 'Cross-Network',
      icon: Network,
      description: 'Multi-chain asset distribution',
      enabled: true,
    },
    {
      id: 'history' as AnalyticsTabType,
      label: 'Transaction History',
      icon: Calendar,
      description: 'Detailed transaction and activity log',
      enabled: true,
    },
  ];

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  if (!isConnected) {
    return (
      <div className={cn('space-y-8', className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="defi-card p-12">
            <div className="flex items-center justify-center w-20 h-20 bg-defi-purple/20 rounded-full mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-defi-purple" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Portfolio Analytics
            </h2>
            <p className="text-foreground/60 mb-8 max-w-md mx-auto">
              Connect your wallet to access comprehensive portfolio analytics with cross-network 
              visualization, historical performance tracking, and risk metrics.
            </p>
            <ConnectButton />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Portfolio Analytics
          </h1>
          <p className="text-foreground/60">
            Comprehensive insights into your DeFi portfolio performance
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 bg-background/30 rounded-lg p-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as any)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  timeRange === option.value
                    ? 'bg-defi-purple text-white'
                    : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              <span className="text-sm">Refresh</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-4 py-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Advanced</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'defi-card p-4 text-left transition-all duration-300',
              activeTab === tab.id
                ? 'bg-defi-purple/20 border-defi-purple/30'
                : 'hover:bg-background/50'
            )}
          >
            <div className="flex items-center space-x-3 mb-2">
              <tab.icon className={cn(
                'w-5 h-5',
                activeTab === tab.id ? 'text-defi-purple' : 'text-foreground/60'
              )} />
              <span className={cn(
                'font-medium',
                activeTab === tab.id ? 'text-defi-purple' : 'text-foreground'
              )}>
                {tab.label}
              </span>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              {tab.description}
            </p>
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <PortfolioOverview 
              portfolioData={portfolioData}
              performanceMetrics={performanceMetrics}
              riskMetrics={riskMetrics}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceMetrics
              performanceData={performanceMetrics}
              historicalData={historicalData}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'risk' && (
            <RiskMetrics
              riskData={riskMetrics}
              portfolioData={portfolioData}
              historicalData={historicalData}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'allocation' && (
            <AssetAllocation
              portfolioData={portfolioData}
              performanceMetrics={performanceMetrics}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'network' && (
            <CrossNetworkVisualization
              portfolioData={portfolioData}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'history' && (
            <HistoricalPerformance
              historicalData={historicalData}
              portfolioData={portfolioData}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="defi-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-sm text-foreground/60">
              Optimize your portfolio with AI-powered recommendations
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-defi-purple/20 text-defi-purple rounded-lg hover:bg-defi-purple/30 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span className="text-sm">Rebalance</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 