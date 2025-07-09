'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, Network, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedToken, SwapOperation } from './UnifiedSwapInterface';

interface SwapRouteDisplayProps {
  operation: SwapOperation;
  fromToken: UnifiedToken;
  toToken: UnifiedToken;
  amount: string;
  className?: string;
}

export function SwapRouteDisplay({
  operation,
  fromToken,
  toToken,
  amount,
  className,
}: SwapRouteDisplayProps) {
  // Calculate route information based on operation type
  const routeInfo = useMemo(() => {
    switch (operation) {
      case 'wrap':
        return {
          title: 'Token Wrapping',
          description: `Convert ${fromToken.symbol} to sovaBTC`,
          estimatedTime: '1-2 minutes',
          feeType: 'Wrapper Fee',
          estimatedFee: '~0.1%',
          networkFee: 'Gas on Base',
          steps: [
            { label: 'Approve Token', status: 'pending' as const },
            { label: 'Execute Wrap', status: 'pending' as const },
            { label: 'Receive sovaBTC', status: 'pending' as const },
          ],
          color: 'from-green-500 to-emerald-600',
          icon: ArrowRight,
        };

      case 'bridge':
        return {
          title: 'Cross-Chain Bridge',
          description: `Transfer sovaBTC to ${toToken.network.name}`,
          estimatedTime: '3-8 minutes',
          feeType: 'LayerZero Fee',
          estimatedFee: '~0.001 ETH',
          networkFee: `Gas on ${fromToken.network.name}`,
          steps: [
            { label: 'Burn on Source', status: 'pending' as const },
            { label: 'LayerZero Message', status: 'pending' as const },
            { label: 'Mint on Destination', status: 'pending' as const },
          ],
          color: 'from-blue-500 to-purple-600',
          icon: Network,
        };

      case 'unwrap':
        return {
          title: 'Token Unwrapping',
          description: `Redeem sovaBTC for ${toToken.symbol}`,
          estimatedTime: '10 days + processing',
          feeType: 'Redemption Fee',
          estimatedFee: '~0.05%',
          networkFee: 'Gas on Base',
          steps: [
            { label: 'Queue Redemption', status: 'pending' as const },
            { label: '10-day Wait Period', status: 'pending' as const },
            { label: `Receive ${toToken.symbol}`, status: 'pending' as const },
          ],
          color: 'from-orange-500 to-red-600',
          icon: Clock,
        };

      default:
        return null;
    }
  }, [operation, fromToken, toToken]);

  if (!routeInfo) return null;

  const RouteIcon = routeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-4 bg-background/50 rounded-lg border border-border/50', className)}
    >
      {/* Route Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center',
            routeInfo.color
          )}>
            <RouteIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold">{routeInfo.title}</h4>
            <p className="text-sm text-muted-foreground">{routeInfo.description}</p>
          </div>
        </div>
        
        {/* Time Estimate */}
        <div className="text-right">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{routeInfo.estimatedTime}</span>
          </div>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="flex items-center justify-between mb-4 p-3 bg-card/30 rounded-lg">
        {/* From Token */}
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            fromToken.isSovaBTC 
              ? "bg-gradient-to-r from-defi-purple to-defi-pink text-white"
              : "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
          )}>
            {fromToken.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-medium text-sm">{fromToken.symbol}</div>
            <div className="text-xs text-muted-foreground">{fromToken.network.name}</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1 min-w-8"></div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1 min-w-8"></div>
          </div>
        </div>

        {/* To Token */}
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            toToken.isSovaBTC 
              ? "bg-gradient-to-r from-defi-purple to-defi-pink text-white"
              : "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
          )}>
            {toToken.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-medium text-sm">{toToken.symbol}</div>
            <div className="text-xs text-muted-foreground">{toToken.network.name}</div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm font-medium mb-2">
          <span>Process Steps</span>
          <span className="text-muted-foreground">1 of {routeInfo.steps.length}</span>
        </div>
        <div className="space-y-2">
          {routeInfo.steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 
                  ? "bg-defi-purple text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              <span className={cn(
                "text-sm",
                index === 0 ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Information */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-card/30 rounded-lg">
        <div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
            <DollarSign className="w-3 h-3" />
            <span>{routeInfo.feeType}</span>
          </div>
          <div className="font-medium text-sm">{routeInfo.estimatedFee}</div>
        </div>
        <div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
            <Zap className="w-3 h-3" />
            <span>Network Fee</span>
          </div>
          <div className="font-medium text-sm">{routeInfo.networkFee}</div>
        </div>
      </div>

      {/* Special Warnings */}
      {operation === 'unwrap' && (
        <div className="mt-4 p-3 bg-orange-900/20 border border-orange-600 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-200">
              <span className="font-medium">Important:</span> Unwrapping has a mandatory 10-day 
              security delay before you can claim your tokens. This cannot be canceled once initiated.
            </div>
          </div>
        </div>
      )}

      {operation === 'bridge' && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
          <div className="flex items-start space-x-2">
            <Network className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <span className="font-medium">LayerZero Bridge:</span> Your tokens will be burned on {fromToken.network.name} 
               and minted on {toToken.network.name}. Total supply remains constant across all chains.
            </div>
          </div>
        </div>
      )}

      {/* Expected Output (if amount is provided) */}
      {amount && Number(amount) > 0 && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-200">Expected Output:</span>
            <span className="font-medium text-green-100">
              {operation === 'wrap' ? amount : amount} {toToken.symbol}
            </span>
          </div>
          {operation === 'wrap' && fromToken.decimals !== toToken.decimals && (
            <div className="text-xs text-green-300 mt-1">
              * Automatic decimal conversion: {fromToken.decimals} → {toToken.decimals} decimals
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 