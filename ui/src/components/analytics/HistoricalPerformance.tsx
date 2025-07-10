'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowRight,
  DollarSign,
  Coins,
  Zap,
  Target,
  BarChart3,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

import { 
  type HistoricalDataPoint, 
  type PortfolioData 
} from '@/hooks/web3/usePortfolioAnalytics';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface HistoricalPerformanceProps {
  historicalData: HistoricalDataPoint[];
  portfolioData: PortfolioData | null;
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function HistoricalPerformance({
  historicalData,
  portfolioData,
  timeRange,
  isLoading = false,
  className,
}: HistoricalPerformanceProps) {
  // Calculate historical insights
  const historicalInsights = useMemo(() => {
    if (!historicalData.length) return null;

    const sortedData = [...historicalData].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate performance periods
    const periods = sortedData.map((point, index) => {
      const prevPoint = sortedData[index - 1];
      const change = prevPoint ? ((point.totalValue - prevPoint.totalValue) / prevPoint.totalValue) * 100 : 0;
      const isPositive = change >= 0;
      
      return {
        timestamp: point.timestamp,
        date: new Date(point.timestamp).toLocaleDateString(),
        time: new Date(point.timestamp).toLocaleTimeString(),
        totalValue: point.totalValue,
        change,
        isPositive,
        portfolioReturn: point.portfolioReturn,
        sharpeRatio: point.sharpeRatio,
        volatility: point.volatility,
      };
    });

    // Calculate key statistics
    const totalChangeValue = sortedData[sortedData.length - 1].totalValue - sortedData[0].totalValue;
    const totalChangePercent = (totalChangeValue / sortedData[0].totalValue) * 100;
    const isOverallPositive = totalChangePercent >= 0;
    
    const positiveDays = periods.filter(p => p.isPositive).length;
    const negativeDays = periods.filter(p => !p.isPositive).length;
    const winRate = periods.length > 0 ? (positiveDays / periods.length) * 100 : 0;
    
    const bestDay = periods.reduce((best, current) => 
      current.change > best.change ? current : best, periods[0] || { change: 0 }
    );
    
    const worstDay = periods.reduce((worst, current) => 
      current.change < worst.change ? current : worst, periods[0] || { change: 0 }
    );

    // Generate mock transaction history
    const transactions = [
      {
        id: '1',
        type: 'stake',
        amount: '1.5 sovaBTC',
        value: '$97,500',
        timestamp: Date.now() - 3600000 * 24 * 2,
        status: 'completed',
        network: 'Base Sepolia',
        hash: '0x123...',
      },
      {
        id: '2',
        type: 'wrap',
        amount: '0.5 WBTC → 0.5 sovaBTC',
        value: '$32,500',
        timestamp: Date.now() - 3600000 * 24 * 5,
        status: 'completed',
        network: 'Base Sepolia',
        hash: '0x456...',
      },
      {
        id: '3',
        type: 'bridge',
        amount: '2.0 sovaBTC',
        value: '$130,000',
        timestamp: Date.now() - 3600000 * 24 * 7,
        status: 'completed',
        network: 'Base Sepolia → Optimism Sepolia',
        hash: '0x789...',
      },
      {
        id: '4',
        type: 'claim',
        amount: '125 SOVA',
        value: '$12,500',
        timestamp: Date.now() - 3600000 * 24 * 10,
        status: 'completed',
        network: 'Optimism Sepolia',
        hash: '0xabc...',
      },
    ];

    return {
      periods,
      totalChangeValue,
      totalChangePercent,
      isOverallPositive,
      positiveDays,
      negativeDays,
      winRate,
      bestDay,
      worstDay,
      transactions,
    };
  }, [historicalData]);

  // Loading skeleton
  if (isLoading || !historicalInsights) {
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'stake': return Zap;
      case 'wrap': return Coins;
      case 'bridge': return ArrowRight;
      case 'claim': return DollarSign;
      default: return Activity;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stake': return 'text-defi-purple';
      case 'wrap': return 'text-blue-400';
      case 'bridge': return 'text-green-400';
      case 'claim': return 'text-yellow-400';
      default: return 'text-foreground/60';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return AlertCircle;
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-foreground/60';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('space-y-6', className)}
    >
      {/* Historical Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={cn('w-5 h-5', historicalInsights.isOverallPositive ? 'text-green-400' : 'text-red-400')} />
              <span className="text-sm font-medium text-foreground/60">Total Change</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {historicalInsights.isOverallPositive ? '+' : ''}{historicalInsights.totalChangePercent.toFixed(2)}%
          </div>
          <div className="text-sm text-foreground/60">
            {timeRange.toUpperCase()} period
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-defi-purple" />
              <span className="text-sm font-medium text-foreground/60">Win Rate</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {historicalInsights.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            {historicalInsights.positiveDays} up days
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-defi-pink" />
              <span className="text-sm font-medium text-foreground/60">Transactions</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {historicalInsights.transactions.length}
          </div>
          <div className="text-sm text-foreground/60">
            Recent activity
          </div>
        </motion.div>
      </div>

      {/* Performance Timeline */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Performance Timeline</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <BarChart3 className="w-4 h-4" />
            <span>Daily performance</span>
          </div>
        </div>

        <div className="space-y-3">
          {historicalInsights.periods.slice(-10).map((period, index) => (
            <motion.div
              key={period.timestamp}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  period.isPositive ? 'bg-green-400' : 'bg-red-400'
                )} />
                <div>
                  <div className="font-medium">{period.date}</div>
                  <div className="text-sm text-foreground/60">{period.time}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-medium">${period.totalValue.toLocaleString()}</div>
                  <div className={cn(
                    'text-sm',
                    period.isPositive ? 'text-green-400' : 'text-red-400'
                  )}>
                    {period.isPositive ? '+' : ''}{period.change.toFixed(2)}%
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-foreground/60">
                    Sharpe: {period.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-xs text-foreground/60">
                    Vol: {(period.volatility * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Clock className="w-4 h-4" />
            <span>Activity log</span>
          </div>
        </div>

        <div className="space-y-4">
          {historicalInsights.transactions.map((transaction, index) => {
            const TransactionIcon = getTransactionIcon(transaction.type);
            const StatusIcon = getStatusIcon(transaction.status);
            
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    transaction.type === 'stake' && 'bg-defi-purple/20',
                    transaction.type === 'wrap' && 'bg-blue-500/20',
                    transaction.type === 'bridge' && 'bg-green-500/20',
                    transaction.type === 'claim' && 'bg-yellow-500/20'
                  )}>
                    <TransactionIcon className={cn('w-5 h-5', getTransactionColor(transaction.type))} />
                  </div>
                  
                  <div>
                    <div className="font-medium capitalize">{transaction.type}</div>
                    <div className="text-sm text-foreground/60">{transaction.amount}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{transaction.value}</div>
                    <div className="text-sm text-foreground/60">{transaction.network}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={cn('w-4 h-4', getStatusColor(transaction.status))} />
                    <div className="text-sm text-foreground/60">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button className="text-defi-purple hover:text-defi-purple/80 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Best and Worst Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Best Performance</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-foreground/60">Best Day</div>
                <div className="text-2xl font-bold text-green-400">
                  +{historicalInsights.bestDay.change.toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-foreground/60">
                {historicalInsights.bestDay.date} • ${historicalInsights.bestDay.totalValue.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background/20 rounded-lg">
                <div className="text-sm text-foreground/60 mb-1">Positive Days</div>
                <div className="text-xl font-bold">{historicalInsights.positiveDays}</div>
              </div>
              <div className="p-3 bg-background/20 rounded-lg">
                <div className="text-sm text-foreground/60 mb-1">Success Rate</div>
                <div className="text-xl font-bold">{historicalInsights.winRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Worst Performance</h3>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-foreground/60">Worst Day</div>
                <div className="text-2xl font-bold text-red-400">
                  {historicalInsights.worstDay.change.toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-foreground/60">
                {historicalInsights.worstDay.date} • ${historicalInsights.worstDay.totalValue.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background/20 rounded-lg">
                <div className="text-sm text-foreground/60 mb-1">Negative Days</div>
                <div className="text-xl font-bold">{historicalInsights.negativeDays}</div>
              </div>
              <div className="p-3 bg-background/20 rounded-lg">
                <div className="text-sm text-foreground/60 mb-1">Recovery Rate</div>
                <div className="text-xl font-bold">
                  {historicalInsights.negativeDays > 0 ? ((historicalInsights.positiveDays / historicalInsights.negativeDays) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
} 