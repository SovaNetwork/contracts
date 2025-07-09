'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGasPrice, useEstimateGas, useBlockNumber } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Info, 
  Zap, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Sparkles,
  Target,
  Shield
} from 'lucide-react';
import { formatEther, formatUnits, parseUnits } from 'viem';
import { type Address } from 'viem';

import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { UnifiedToken, SwapOperation } from './UnifiedSwapInterface';

export interface DetailedFeeBreakdown {
  // Basic fees
  gasEstimate: bigint;
  gasPrice: bigint;
  networkFee: bigint;
  protocolFee?: bigint;
  layerZeroFee?: bigint;
  totalFee: bigint;
  
  // Enhanced data
  gasPriceGwei: number;
  networkFeeUSD?: number;
  protocolFeeUSD?: number;
  layerZeroFeeUSD?: number;
  totalFeeUSD?: number;
  
  // Gas analysis
  gasPriceLevel: 'low' | 'normal' | 'high' | 'extreme';
  gasPriceTrend: 'rising' | 'falling' | 'stable';
  suggestedWaitTime?: number;
  potentialSavings?: number;
  
  // Operation-specific
  approvalCost?: bigint;
  approvalCostUSD?: number;
  routeEfficiency: number; // 0-100 score
  alternatives?: Array<{
    name: string;
    description: string;
    savingsPercent: number;
    savingsUSD?: number;
  }>;
}

export interface FeeOptimization {
  recommendation: 'execute' | 'wait' | 'alternative';
  reason: string;
  estimatedSavings?: number;
  estimatedWaitTime?: number;
  alternativeRoutes?: Array<{
    name: string;
    description: string;
    savings: number;
  }>;
}

interface EnhancedFeeBreakdownProps {
  operation: SwapOperation;
  fromToken: UnifiedToken;
  toToken: UnifiedToken;
  amount: bigint;
  needsApproval?: boolean;
  className?: string;
}

export function EnhancedFeeBreakdown({
  operation,
  fromToken,
  toToken,
  amount,
  needsApproval = false,
  className
}: EnhancedFeeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [gasPriceHistory, setGasPriceHistory] = useState<number[]>([]);

  const { data: currentGasPrice } = useGasPrice();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Fetch ETH price for USD conversions
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        // In production, you'd use a real price API
        // For now, using a mock price
        setEthPrice(3200); // Mock ETH price at $3200
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    fetchEthPrice();
  }, []);

  // Track gas price history for trend analysis
  useEffect(() => {
    if (currentGasPrice) {
      const gasPriceGwei = Number(formatUnits(currentGasPrice, 'gwei'));
      setGasPriceHistory(prev => {
        const newHistory = [...prev, gasPriceGwei].slice(-20); // Keep last 20 readings
        return newHistory;
      });
    }
  }, [currentGasPrice, blockNumber]);

  // Calculate comprehensive fee breakdown
  const feeBreakdown = useMemo((): DetailedFeeBreakdown | null => {
    if (!currentGasPrice || !amount || amount <= 0n) return null;

    try {
      const gasPriceGwei = Number(formatUnits(currentGasPrice, 'gwei'));
      
      // Base gas estimates with more accuracy
      let gasEstimate = 21000n; // Base transaction
      let protocolFee = 0n;
      let layerZeroFee = 0n;
      let approvalCost = 0n;

      switch (operation) {
        case 'wrap':
          gasEstimate = 120000n; // Wrap transaction
          protocolFee = amount * 30n / 10000n; // 0.3% protocol fee
          if (needsApproval) {
            approvalCost = 46000n; // ERC20 approval
          }
          break;

        case 'bridge':
          gasEstimate = 180000n; // LayerZero send
          layerZeroFee = parseUnits('0.001', 18); // 0.001 ETH minimum
          break;

        case 'unwrap':
          gasEstimate = 150000n; // Redemption queue
          break;

        default:
          gasEstimate = 100000n;
      }

      // Calculate fees
      const networkFee = (gasEstimate + approvalCost) * currentGasPrice;
      const totalFee = networkFee + protocolFee + layerZeroFee;

      // USD conversions
      const networkFeeUSD = ethPrice ? Number(formatEther(networkFee)) * ethPrice : undefined;
      const protocolFeeUSD = ethPrice && protocolFee > 0n ? 
        Number(formatTokenAmount(protocolFee, fromToken.decimals, 6)) * ethPrice : undefined;
      const layerZeroFeeUSD = ethPrice && layerZeroFee > 0n ? 
        Number(formatEther(layerZeroFee)) * ethPrice : undefined;
      const totalFeeUSD = ethPrice ? Number(formatEther(totalFee)) * ethPrice : undefined;
      const approvalCostUSD = ethPrice && approvalCost > 0n ? 
        Number(formatEther(approvalCost * currentGasPrice)) * ethPrice : undefined;

      // Gas price analysis
      let gasPriceLevel: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
      if (gasPriceGwei < 20) gasPriceLevel = 'low';
      else if (gasPriceGwei < 50) gasPriceLevel = 'normal';
      else if (gasPriceGwei < 100) gasPriceLevel = 'high';
      else gasPriceLevel = 'extreme';

      // Gas price trend analysis
      let gasPriceTrend: 'rising' | 'falling' | 'stable' = 'stable';
      if (gasPriceHistory.length >= 5) {
        const recent = gasPriceHistory.slice(-5);
        const avg1 = recent.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const avg2 = recent.slice(-2).reduce((a, b) => a + b, 0) / 2;
        if (avg2 > avg1 * 1.1) gasPriceTrend = 'rising';
        else if (avg2 < avg1 * 0.9) gasPriceTrend = 'falling';
      }

      // Route efficiency calculation
      let routeEfficiency = 85; // Base efficiency
      if (gasPriceLevel === 'low') routeEfficiency += 10;
      else if (gasPriceLevel === 'high') routeEfficiency -= 15;
      else if (gasPriceLevel === 'extreme') routeEfficiency -= 30;

      if (operation === 'wrap' && !needsApproval) routeEfficiency += 5;
      if (operation === 'bridge') routeEfficiency -= 5; // Cross-chain complexity

      // Suggested optimizations
      let suggestedWaitTime: number | undefined;
      let potentialSavings: number | undefined;

      if (gasPriceLevel === 'high' || gasPriceLevel === 'extreme') {
        suggestedWaitTime = gasPriceLevel === 'high' ? 30 : 60; // minutes
        const savingsMultiplier = gasPriceLevel === 'high' ? 0.3 : 0.5;
        potentialSavings = networkFeeUSD ? networkFeeUSD * savingsMultiplier : undefined;
      }

      // Alternative routes
      const alternatives: Array<{
        name: string;
        description: string;
        savingsPercent: number;
        savingsUSD?: number;
      }> = [];

      if (operation === 'wrap' && gasPriceLevel !== 'low') {
        alternatives.push({
          name: 'Batch Multiple Wraps',
          description: 'Wait and wrap multiple tokens together to amortize gas costs',
          savingsPercent: 25,
          savingsUSD: networkFeeUSD ? networkFeeUSD * 0.25 : undefined,
        });
      }

      if (operation === 'bridge' && gasPriceLevel === 'high') {
        alternatives.push({
          name: 'Wait for Lower Gas',
          description: 'Bridge during off-peak hours (typically weekends)',
          savingsPercent: 40,
          savingsUSD: networkFeeUSD ? networkFeeUSD * 0.4 : undefined,
        });
      }

      return {
        gasEstimate,
        gasPrice: currentGasPrice,
        networkFee,
        protocolFee: protocolFee > 0n ? protocolFee : undefined,
        layerZeroFee: layerZeroFee > 0n ? layerZeroFee : undefined,
        totalFee,
        gasPriceGwei,
        networkFeeUSD,
        protocolFeeUSD,
        layerZeroFeeUSD,
        totalFeeUSD,
        gasPriceLevel,
        gasPriceTrend,
        suggestedWaitTime,
        potentialSavings,
        approvalCost: approvalCost > 0n ? approvalCost : undefined,
        approvalCostUSD,
        routeEfficiency: Math.min(100, Math.max(0, routeEfficiency)),
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      };

    } catch (error) {
      console.error('Failed to calculate enhanced fee breakdown:', error);
      return null;
    }
  }, [currentGasPrice, amount, operation, fromToken, needsApproval, ethPrice, gasPriceHistory]);

  // Generate optimization recommendation
  const optimization = useMemo((): FeeOptimization | null => {
    if (!feeBreakdown) return null;

    const { gasPriceLevel, gasPriceTrend, suggestedWaitTime, potentialSavings, alternatives } = feeBreakdown;

    if (gasPriceLevel === 'extreme') {
      return {
        recommendation: 'wait',
        reason: 'Gas prices are extremely high. Consider waiting for better conditions.',
        estimatedSavings: potentialSavings,
        estimatedWaitTime: suggestedWaitTime,
      };
    }

    if (gasPriceLevel === 'high' && gasPriceTrend === 'rising') {
      return {
        recommendation: 'alternative',
        reason: 'Gas prices are high and rising. Consider alternative strategies.',
        alternativeRoutes: alternatives?.map(alt => ({
          name: alt.name,
          description: alt.description,
          savings: alt.savingsUSD || 0,
        })),
      };
    }

    if (gasPriceLevel === 'low' || (gasPriceLevel === 'normal' && gasPriceTrend === 'falling')) {
      return {
        recommendation: 'execute',
        reason: 'Good time to execute - gas prices are favorable.',
      };
    }

    return {
      recommendation: 'execute',
      reason: 'Current conditions are acceptable for execution.',
    };
  }, [feeBreakdown]);

  if (!feeBreakdown) {
    return (
      <div className={cn('defi-card p-4', className)}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Calculating fees...</span>
        </div>
      </div>
    );
  }

  const getGasPriceLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'normal': return 'text-blue-400';
      case 'high': return 'text-yellow-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getGasPriceLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return <TrendingDown className="w-4 h-4" />;
      case 'normal': return <Activity className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'extreme': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getOptimizationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'execute': return 'border-green-600 bg-green-900/20';
      case 'wait': return 'border-yellow-600 bg-yellow-900/20';
      case 'alternative': return 'border-blue-600 bg-blue-900/20';
      default: return 'border-border bg-card/30';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Fee Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="defi-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="font-medium">Transaction Cost</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">
              {formatEther(feeBreakdown.totalFee)} ETH
            </div>
            {feeBreakdown.totalFeeUSD && (
              <div className="text-sm text-muted-foreground">
                ≈ ${feeBreakdown.totalFeeUSD.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Gas Price Status */}
        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            {getGasPriceLevelIcon(feeBreakdown.gasPriceLevel)}
            <span className="text-sm">Gas Price</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn('text-sm font-medium', getGasPriceLevelColor(feeBreakdown.gasPriceLevel))}>
              {feeBreakdown.gasPriceGwei.toFixed(1)} Gwei
            </span>
            <span className={cn('text-xs px-2 py-1 rounded', getGasPriceLevelColor(feeBreakdown.gasPriceLevel))}>
              {feeBreakdown.gasPriceLevel.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Route Efficiency */}
        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Route Efficiency</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${feeBreakdown.routeEfficiency}%` }}
              />
            </div>
            <span className="text-sm font-medium">{feeBreakdown.routeEfficiency}%</span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>{isExpanded ? 'Hide' : 'Show'} detailed breakdown</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Detailed Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="defi-card p-4 space-y-4"
          >
            <h4 className="font-medium text-foreground/80 mb-3">Detailed Cost Breakdown</h4>
            
            <div className="space-y-3 text-sm">
              {/* Network Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-foreground/70">Network Fee</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="text-right">
                  <div>{formatEther(feeBreakdown.networkFee)} ETH</div>
                  {feeBreakdown.networkFeeUSD && (
                    <div className="text-xs text-muted-foreground">
                      ${feeBreakdown.networkFeeUSD.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Cost */}
              {feeBreakdown.approvalCost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-foreground/70">Approval Cost</span>
                  </div>
                  <div className="text-right">
                    <div>{formatEther(feeBreakdown.approvalCost * feeBreakdown.gasPrice)} ETH</div>
                    {feeBreakdown.approvalCostUSD && (
                      <div className="text-xs text-muted-foreground">
                        ${feeBreakdown.approvalCostUSD.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Protocol Fee */}
              {feeBreakdown.protocolFee && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-foreground/70">Protocol Fee (0.3%)</span>
                  </div>
                  <div className="text-right">
                    <div>{formatTokenAmount(feeBreakdown.protocolFee, fromToken.decimals, 6)} {fromToken.symbol}</div>
                    {feeBreakdown.protocolFeeUSD && (
                      <div className="text-xs text-muted-foreground">
                        ${feeBreakdown.protocolFeeUSD.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LayerZero Fee */}
              {feeBreakdown.layerZeroFee && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-foreground/70">LayerZero Fee</span>
                  </div>
                  <div className="text-right">
                    <div>{formatEther(feeBreakdown.layerZeroFee)} ETH</div>
                    {feeBreakdown.layerZeroFeeUSD && (
                      <div className="text-xs text-muted-foreground">
                        ${feeBreakdown.layerZeroFeeUSD.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-border/50 pt-3">
                <div className="flex items-center justify-between font-medium">
                  <span>Total Cost</span>
                  <div className="text-right">
                    <div className="text-orange-400">{formatEther(feeBreakdown.totalFee)} ETH</div>
                    {feeBreakdown.totalFeeUSD && (
                      <div className="text-sm text-muted-foreground">
                        ${feeBreakdown.totalFeeUSD.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimization Recommendation */}
      {optimization && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('p-4 rounded-lg border', getOptimizationColor(optimization.recommendation))}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {optimization.recommendation === 'execute' && <Zap className="w-4 h-4 text-green-400" />}
              {optimization.recommendation === 'wait' && <Clock className="w-4 h-4 text-yellow-400" />}
              {optimization.recommendation === 'alternative' && <TrendingUp className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">
                {optimization.recommendation === 'execute' && 'Ready to Execute'}
                {optimization.recommendation === 'wait' && 'Consider Waiting'}
                {optimization.recommendation === 'alternative' && 'Alternative Recommended'}
              </h4>
              <p className="text-sm text-foreground/70 mb-2">{optimization.reason}</p>
              
              {optimization.estimatedSavings && (
                <div className="text-sm">
                  <span className="text-green-400">Potential savings: ${optimization.estimatedSavings.toFixed(2)}</span>
                  {optimization.estimatedWaitTime && (
                    <span className="text-muted-foreground"> • Wait time: ~{optimization.estimatedWaitTime}min</span>
                  )}
                </div>
              )}

              {optimization.alternativeRoutes && optimization.alternativeRoutes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {optimization.alternativeRoutes.map((route, index) => (
                    <div key={index} className="p-2 bg-background/30 rounded text-sm">
                      <div className="font-medium">{route.name}</div>
                      <div className="text-foreground/60">{route.description}</div>
                      {route.savings > 0 && (
                        <div className="text-green-400">Save ~${route.savings.toFixed(2)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Alternative Routes */}
      {feeBreakdown.alternatives && feeBreakdown.alternatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="defi-card p-4"
        >
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Cost Optimization Options</span>
          </h4>
          <div className="space-y-3">
            {feeBreakdown.alternatives.map((alternative, index) => (
              <div key={index} className="p-3 bg-background/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{alternative.name}</span>
                  <span className="text-green-400 text-sm font-medium">
                    -{alternative.savingsPercent}%
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mb-2">{alternative.description}</p>
                {alternative.savingsUSD && (
                  <div className="text-xs text-green-400">
                    Potential savings: ${alternative.savingsUSD.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
} 