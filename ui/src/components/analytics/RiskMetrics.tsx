'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  Target,
  Zap,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  DollarSign
} from 'lucide-react';

import { 
  type RiskMetrics as RiskMetricsType, 
  type PortfolioData, 
  type HistoricalDataPoint 
} from '@/hooks/web3/usePortfolioAnalytics';
import { cn } from '@/lib/utils';

interface RiskMetricsProps {
  riskData: RiskMetricsType | null;
  portfolioData: PortfolioData | null;
  historicalData: HistoricalDataPoint[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  isLoading?: boolean;
  className?: string;
}

export function RiskMetrics({
  riskData,
  portfolioData,
  historicalData,
  timeRange,
  isLoading = false,
  className,
}: RiskMetricsProps) {
  // Calculate additional risk insights
  const riskInsights = useMemo(() => {
    if (!riskData || !portfolioData) return null;

    const getRiskLevelColor = (level: string) => {
      switch (level) {
        case 'Low': return 'text-green-400';
        case 'Medium': return 'text-yellow-400';
        case 'High': return 'text-orange-400';
        case 'Very High': return 'text-red-400';
        default: return 'text-foreground/60';
      }
    };

    const getRiskIcon = (level: string) => {
      switch (level) {
        case 'Low': return CheckCircle;
        case 'Medium': return AlertCircle;
        case 'High': return AlertTriangle;
        case 'Very High': return XCircle;
        default: return Shield;
      }
    };

    const riskFactors = [
      {
        name: 'Volatility Risk',
        value: riskData.volatility * 100,
        level: riskData.volatility < 0.15 ? 'Low' : riskData.volatility < 0.3 ? 'Medium' : 'High',
        description: 'Price movement volatility',
      },
      {
        name: 'Concentration Risk',
        value: riskData.concentrationRisk,
        level: riskData.concentrationRisk < 40 ? 'Low' : riskData.concentrationRisk < 70 ? 'Medium' : 'High',
        description: 'Asset concentration level',
      },
      {
        name: 'Bridge Risk',
        value: riskData.bridgeRisk,
        level: riskData.bridgeRisk < 20 ? 'Low' : riskData.bridgeRisk < 40 ? 'Medium' : 'High',
        description: 'Cross-chain bridge exposure',
      },
      {
        name: 'Smart Contract Risk',
        value: riskData.smartContractRisk,
        level: riskData.smartContractRisk < 20 ? 'Low' : riskData.smartContractRisk < 40 ? 'Medium' : 'High',
        description: 'Protocol security risk',
      },
      {
        name: 'Liquidity Risk',
        value: riskData.liquidityRisk,
        level: riskData.liquidityRisk < 20 ? 'Low' : riskData.liquidityRisk < 40 ? 'Medium' : 'High',
        description: 'Asset liquidity constraints',
      },
    ];

    return {
      getRiskLevelColor,
      getRiskIcon,
      riskFactors,
    };
  }, [riskData, portfolioData]);

  // Loading skeleton
  if (isLoading || !riskData || !riskInsights) {
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="defi-card p-6">
              <div className="h-6 w-40 bg-slate-700/50 rounded shimmer mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-16 bg-slate-700/50 rounded shimmer" />
                ))}
              </div>
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

  const RiskIcon = riskInsights.getRiskIcon(riskData.riskLevel);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('space-y-6', className)}
    >
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <RiskIcon className={cn('w-5 h-5', riskInsights.getRiskLevelColor(riskData.riskLevel))} />
              <span className="text-sm font-medium text-foreground/60">Overall Risk</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{riskData.riskScore.toFixed(0)}</div>
          <div className={cn('text-sm font-medium', riskInsights.getRiskLevelColor(riskData.riskLevel))}>
            {riskData.riskLevel} Risk
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-foreground/60">Volatility</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {(riskData.volatility * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            {timeRange.toUpperCase()} period
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-foreground/60">Max Drawdown</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {(riskData.maxDrawdown * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/60">
            Maximum decline
          </div>
        </motion.div>
      </div>

      {/* Risk Factors Analysis */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Risk Factor Analysis</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <BarChart3 className="w-4 h-4" />
            <span>Detailed breakdown</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {riskInsights.riskFactors.map((factor, index) => {
            const FactorIcon = riskInsights.getRiskIcon(factor.level);
            return (
              <motion.div
                key={factor.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-background/20 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FactorIcon className={cn('w-4 h-4', riskInsights.getRiskLevelColor(factor.level))} />
                    <span className="font-medium">{factor.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{factor.value.toFixed(1)}%</div>
                    <div className={cn('text-sm', riskInsights.getRiskLevelColor(factor.level))}>
                      {factor.level}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-background/30 rounded-full h-2 mb-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      factor.level === 'Low' && 'bg-green-400',
                      factor.level === 'Medium' && 'bg-yellow-400',
                      factor.level === 'High' && 'bg-red-400'
                    )}
                    style={{ width: `${Math.min(factor.value, 100)}%` }}
                  />
                </div>
                
                <div className="text-sm text-foreground/60">
                  {factor.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Value at Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Value at Risk (VaR)</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <DollarSign className="w-4 h-4" />
              <span>95% confidence</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
              <div>
                <div className="font-medium text-red-400">Daily VaR</div>
                <div className="text-sm text-foreground/60">
                  95% confidence level
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {(riskData.valueAtRisk * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-foreground/60">
                  Potential loss
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg">
              <div>
                <div className="font-medium text-orange-400">Expected Shortfall</div>
                <div className="text-sm text-foreground/60">
                  Conditional VaR
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">
                  {(riskData.conditionalVaR * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-foreground/60">
                  Tail risk
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
              <div>
                <div className="font-medium text-purple-400">Downside Deviation</div>
                <div className="text-sm text-foreground/60">
                  Negative volatility
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {(riskData.downsideDeviation * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-foreground/60">
                  Downside risk
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="defi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Correlation Analysis</h3>
            <div className="flex items-center space-x-2 text-sm text-foreground/60">
              <PieChart className="w-4 h-4" />
              <span>Market correlation</span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(riskData.correlationMatrix).map(([asset, correlation]) => (
              <div key={asset} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    asset === 'BTC' && 'bg-orange-400',
                    asset === 'ETH' && 'bg-blue-400',
                    asset === 'DeFi' && 'bg-purple-400'
                  )} />
                  <div>
                    <div className="font-medium">{asset}</div>
                    <div className="text-sm text-foreground/60">
                      {correlation > 0.7 ? 'High' : correlation > 0.4 ? 'Medium' : 'Low'} correlation
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{(correlation * 100).toFixed(0)}%</div>
                  <div className="w-20 bg-background/30 rounded-full h-2 mt-1">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        correlation > 0.7 ? 'bg-red-400' : correlation > 0.4 ? 'bg-yellow-400' : 'bg-green-400'
                      )}
                      style={{ width: `${correlation * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk Mitigation Recommendations */}
      <motion.div variants={itemVariants} className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Risk Mitigation</h3>
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <Target className="w-4 h-4" />
            <span>Recommendations</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskData.riskLevel === 'High' || riskData.riskLevel === 'Very High' ? (
            <>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div className="font-medium text-red-400">High Risk Alert</div>
                </div>
                <div className="text-sm text-foreground/60 mb-3">
                  Your portfolio has elevated risk levels. Consider reducing position sizes or diversifying.
                </div>
                <div className="text-xs text-foreground/60">
                  Risk Score: {riskData.riskScore.toFixed(0)}/100 • Action: Reduce exposure
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <div className="font-medium text-yellow-400">Diversification</div>
                </div>
                <div className="text-sm text-foreground/60 mb-3">
                  Spread assets across more networks and strategies to reduce concentration risk.
                </div>
                                 <div className="text-xs text-foreground/60">
                   Current concentration: {riskData.concentrationRisk.toFixed(0)}% • Target: &lt;40%
                 </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="font-medium text-green-400">Well Managed</div>
                </div>
                <div className="text-sm text-foreground/60 mb-3">
                  Your portfolio risk is well-controlled. Continue monitoring for any changes.
                </div>
                <div className="text-xs text-foreground/60">
                  Risk Score: {riskData.riskScore.toFixed(0)}/100 • Status: Optimal
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div className="font-medium text-blue-400">Optimization</div>
                </div>
                <div className="text-sm text-foreground/60 mb-3">
                  Consider yield optimization strategies while maintaining current risk levels.
                </div>
                                 <div className="text-xs text-foreground/60">
                   Current volatility: {(riskData.volatility * 100).toFixed(1)}% • Target: &lt;20%
                 </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 