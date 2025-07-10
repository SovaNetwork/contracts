'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { formatEther, formatUnits } from 'viem';
import { useAdminOperations, type ProtocolHealthMetrics } from '@/hooks/web3/useAdminOperations';
import { cn } from '@/lib/utils';

interface HealthMetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  status?: 'healthy' | 'warning' | 'critical';
  subtitle?: string;
}

function HealthMetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon, 
  status = 'healthy',
  subtitle 
}: HealthMetricCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

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
          <div className={cn("p-2 rounded-lg bg-black/20", getStatusColor(status))}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground/60">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-foreground/40 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {change !== undefined && (
          <div className={cn("flex items-center space-x-1", getChangeColor(changeType))}>
            {getChangeIcon(changeType)}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface SystemStatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function SystemStatusIndicator({ 
  status, 
  lastUpdated, 
  onRefresh, 
  isRefreshing 
}: SystemStatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          text: 'System Healthy',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case 'warning':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          text: 'System Warning',
          icon: <AlertTriangle className="w-5 h-5" />,
        };
      case 'critical':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          text: 'System Critical',
          icon: <AlertTriangle className="w-5 h-5" />,
        };
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          text: 'Unknown Status',
          icon: <Activity className="w-5 h-5" />,
        };
    }
  };

  const config = getStatusConfig(status);
  const timeAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "defi-card p-6 border-2",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg", config.color)}>
            {config.icon}
          </div>
          <div>
            <h2 className={cn("text-lg font-bold", config.color)}>
              {config.text}
            </h2>
            <p className="text-sm text-foreground/60">
              Last updated: {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`}
            </p>
          </div>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
            "bg-card border border-border/50 hover:bg-card/80",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>
    </motion.div>
  );
}

export function ProtocolHealthDashboard() {
  const { protocolHealth, updateProtocolHealth } = useAdminOperations();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await updateProtocolHealth();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!protocolHealth) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-defi-purple mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Loading Protocol Health...</h3>
          <p className="text-foreground/60">Fetching real-time metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <SystemStatusIndicator
        status={protocolHealth.systemStatus}
        lastUpdated={protocolHealth.lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthMetricCard
          title="Total sovaBTC Supply"
          value={`${formatUnits(protocolHealth.totalSovaBTCSupply, 8)} sovaBTC`}
          change={2.3}
          changeType="increase"
          icon={<Coins className="w-5 h-5" />}
          status="healthy"
        />
        
        <HealthMetricCard
          title="Total Value Locked"
          value={`$${formatEther(protocolHealth.totalValueLocked)}`}
          change={5.7}
          changeType="increase"
          icon={<Database className="w-5 h-5" />}
          status="healthy"
        />
        
        <HealthMetricCard
          title="Active Redemptions"
          value={protocolHealth.activeRedemptions.toString()}
          change={-12.5}
          changeType="decrease"
          icon={<Clock className="w-5 h-5" />}
          status="warning"
          subtitle="In queue"
        />
        
        <HealthMetricCard
          title="Total Staked"
          value={`${formatEther(protocolHealth.totalStaked)} sovaBTC`}
          change={8.2}
          changeType="increase"
          icon={<Shield className="w-5 h-5" />}
          status="healthy"
        />
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthMetricCard
          title="Bridge Volume (24h)"
          value={`${formatEther(protocolHealth.bridgeVolume24h)} sovaBTC`}
          change={15.3}
          changeType="increase"
          icon={<TrendingUp className="w-5 h-5" />}
          status="healthy"
        />
        
        <HealthMetricCard
          title="Wrap Volume (24h)"
          value={`${formatEther(protocolHealth.wrapVolume24h)} sovaBTC`}
          change={-3.2}
          changeType="decrease"
          icon={<TrendingDown className="w-5 h-5" />}
          status="healthy"
        />
        
        <HealthMetricCard
          title="Unique Users (24h)"
          value={protocolHealth.uniqueUsers24h.toString()}
          change={22.1}
          changeType="increase"
          icon={<Users className="w-5 h-5" />}
          status="healthy"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthMetricCard
          title="Avg Processing Time"
          value={`${protocolHealth.avgProcessingTime.toFixed(1)} min`}
          change={-8.5}
          changeType="decrease"
          icon={<Zap className="w-5 h-5" />}
          status="healthy"
          subtitle="Redemption fulfillment"
        />
        
        <HealthMetricCard
          title="System Uptime"
          value="99.97%"
          change={0.02}
          changeType="increase"
          icon={<CheckCircle className="w-5 h-5" />}
          status="healthy"
          subtitle="Last 30 days"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="defi-card p-6">
        <h3 className="text-lg font-bold mb-4">Protocol Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium mb-3">Network Distribution</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Base Sepolia</span>
                <span className="font-medium">67.3%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-defi-purple h-2 rounded-full" style={{ width: '67.3%' }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Optimism Sepolia</span>
                <span className="font-medium">32.7%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-defi-pink h-2 rounded-full" style={{ width: '32.7%' }} />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Token Composition</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">WBTC</span>
                <span className="font-medium">58.2%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '58.2%' }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">USDC</span>
                <span className="font-medium">31.4%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '31.4%' }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">LBTC</span>
                <span className="font-medium">10.4%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10.4%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 