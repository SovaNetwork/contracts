'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  Users, 
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  DollarSign,
  Zap,
  Globe
} from 'lucide-react';
import { formatEther, formatUnits } from 'viem';
import { useAdminOperations } from '@/hooks/web3/useAdminOperations';
import { cn } from '@/lib/utils';

interface AnalyticsMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface TimeSeriesData {
  timestamp: number;
  value: number;
  label: string;
}

interface NetworkMetrics {
  chainId: number;
  name: string;
  tvl: number;
  volume24h: number;
  users24h: number;
  transactions24h: number;
  percentage: number;
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-green-400';
      case 'decrease': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase': return <ArrowUpRight className="w-4 h-4" />;
      case 'decrease': return <ArrowDownRight className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="defi-card p-6 hover:border-defi-purple/50 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn("p-3 rounded-lg", `bg-${metric.color}-500/20`)}>
            <div className={cn(`text-${metric.color}-400`)}>
              {metric.icon}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground/60">{metric.title}</h3>
            <p className="text-2xl font-bold mt-1">{metric.value}</p>
          </div>
        </div>
        
        <div className={cn("flex items-center space-x-1", getChangeColor(metric.changeType))}>
          {getChangeIcon(metric.changeType)}
          <span className="text-sm font-medium">
            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SimpleChart({ data, title, color }: { 
  data: TimeSeriesData[]; 
  title: string; 
  color: string; 
}) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="defi-card p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-between space-x-1">
        {data.map((point, index) => {
          const height = range === 0 ? 50 : ((point.value - minValue) / range) * 100;
          return (
            <div
              key={index}
              className="relative flex-1 flex flex-col items-center justify-end group"
            >
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-300 hover:opacity-80",
                  `bg-${color}-500`
                )}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.label}: {point.value.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-foreground/60 mt-2">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function NetworkDistribution({ networks }: { networks: NetworkMetrics[] }) {
  const totalTVL = networks.reduce((sum, network) => sum + network.tvl, 0);
  
  return (
    <div className="defi-card p-6">
      <h3 className="text-lg font-bold mb-4">Network Distribution</h3>
      
      <div className="space-y-4">
        {networks.map((network, index) => (
          <div key={network.chainId} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  index === 0 ? "bg-defi-purple" : 
                  index === 1 ? "bg-defi-pink" : 
                  index === 2 ? "bg-blue-500" : "bg-green-500"
                )} />
                <span className="font-medium">{network.name}</span>
              </div>
              <span className="text-sm text-foreground/60">
                ${network.tvl.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === 0 ? "bg-defi-purple" : 
                  index === 1 ? "bg-defi-pink" : 
                  index === 2 ? "bg-blue-500" : "bg-green-500"
                )}
                style={{ width: `${(network.tvl / totalTVL) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopMetrics() {
  const { protocolHealth } = useAdminOperations();
  
  const metrics: AnalyticsMetric[] = [
    {
      title: 'Total Value Locked',
      value: '$2.45M',
      change: 12.3,
      changeType: 'increase',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'green',
    },
    {
      title: 'Total Volume (24h)',
      value: '$89.4K',
      change: -3.2,
      changeType: 'decrease',
      icon: <Activity className="w-6 h-6" />,
      color: 'blue',
    },
    {
      title: 'Active Users (24h)',
      value: '1,234',
      change: 8.7,
      changeType: 'increase',
      icon: <Users className="w-6 h-6" />,
      color: 'purple',
    },
    {
      title: 'Transaction Count',
      value: '5,678',
      change: 15.2,
      changeType: 'increase',
      icon: <Zap className="w-6 h-6" />,
      color: 'orange',
    },
    {
      title: 'Cross-Chain Transfers',
      value: '892',
      change: 22.1,
      changeType: 'increase',
      icon: <Globe className="w-6 h-6" />,
      color: 'cyan',
    },
    {
      title: 'sovaBTC Supply',
      value: formatUnits(protocolHealth?.totalSovaBTCSupply || 0n, 8),
      change: 4.5,
      changeType: 'increase',
      icon: <Coins className="w-6 h-6" />,
      color: 'yellow',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}

export function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data for charts
  const volumeData: TimeSeriesData[] = [
    { timestamp: 1, value: 45.2, label: 'Mon' },
    { timestamp: 2, value: 52.1, label: 'Tue' },
    { timestamp: 3, value: 48.9, label: 'Wed' },
    { timestamp: 4, value: 61.3, label: 'Thu' },
    { timestamp: 5, value: 58.7, label: 'Fri' },
    { timestamp: 6, value: 67.2, label: 'Sat' },
    { timestamp: 7, value: 73.5, label: 'Sun' },
  ];

  const usersData: TimeSeriesData[] = [
    { timestamp: 1, value: 120, label: 'Mon' },
    { timestamp: 2, value: 135, label: 'Tue' },
    { timestamp: 3, value: 142, label: 'Wed' },
    { timestamp: 4, value: 158, label: 'Thu' },
    { timestamp: 5, value: 163, label: 'Fri' },
    { timestamp: 6, value: 171, label: 'Sat' },
    { timestamp: 7, value: 189, label: 'Sun' },
  ];

  const networkMetrics: NetworkMetrics[] = [
    {
      chainId: 84532,
      name: 'Base Sepolia',
      tvl: 1650000,
      volume24h: 52400,
      users24h: 789,
      transactions24h: 3421,
      percentage: 67.3,
    },
    {
      chainId: 11155420,
      name: 'Optimism Sepolia',
      tvl: 800000,
      volume24h: 37000,
      users24h: 445,
      transactions24h: 2257,
      percentage: 32.7,
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const exportData = () => {
    const analyticsData = {
      timeRange,
      volumeData,
      usersData,
      networkMetrics,
      exportTimestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sova-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Advanced Analytics</h2>
          <p className="text-foreground/60 mt-1">
            Comprehensive protocol metrics and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-colors",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <TopMetrics />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart 
          data={volumeData} 
          title="Trading Volume (sovaBTC)" 
          color="blue" 
        />
        <SimpleChart 
          data={usersData} 
          title="Daily Active Users" 
          color="purple" 
        />
      </div>

      {/* Network Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetworkDistribution networks={networkMetrics} />
        
        <div className="defi-card p-6">
          <h3 className="text-lg font-bold mb-4">Protocol Health Score</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Liquidity Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="font-medium">85%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Security Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                </div>
                <span className="font-medium">92%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Performance Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="font-medium">78%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Decentralization</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }} />
                </div>
                <span className="font-medium">89%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Overall Score: 86%</span>
            </div>
            <p className="text-sm text-foreground/60 mt-1">
              Protocol is performing well across all metrics
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="defi-card p-6">
        <h3 className="text-lg font-bold mb-4">Detailed Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground/60">Token Wrapping</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>WBTC → sovaBTC</span>
                <span className="font-medium">58.2%</span>
              </div>
              <div className="flex justify-between">
                <span>USDC → sovaBTC</span>
                <span className="font-medium">31.4%</span>
              </div>
              <div className="flex justify-between">
                <span>LBTC → sovaBTC</span>
                <span className="font-medium">10.4%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground/60">Bridge Activity</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base → Optimism</span>
                <span className="font-medium">234</span>
              </div>
              <div className="flex justify-between">
                <span>Optimism → Base</span>
                <span className="font-medium">189</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Time</span>
                <span className="font-medium">2.3 min</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground/60">Staking Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Staked</span>
                <span className="font-medium">450.2 sovaBTC</span>
              </div>
              <div className="flex justify-between">
                <span>Stakers</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. APR</span>
                <span className="font-medium">15.4%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground/60">Redemptions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>In Queue</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Wait Time</span>
                <span className="font-medium">10 days</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate</span>
                <span className="font-medium">99.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 