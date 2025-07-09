'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Info, 
  Loader2,
  AlertCircle,
  Zap,
  Lock
} from 'lucide-react';
import { formatEther, formatUnits } from 'viem';
import { type Address } from 'viem';

import { useEnhancedApprovalDetection, type ApprovalStrategy, type ApprovalOption } from '@/hooks/web3/useEnhancedApprovalDetection';
import { cn } from '@/lib/utils';

interface EnhancedApprovalSelectorProps {
  tokenAddress: Address;
  spenderAddress: Address;
  requiredAmount: bigint;
  userAddress: Address;
  onApprovalComplete?: () => void;
  onApprovalStart?: () => void;
  className?: string;
}

export function EnhancedApprovalSelector({
  tokenAddress,
  spenderAddress,
  requiredAmount,
  userAddress,
  onApprovalComplete,
  onApprovalStart,
  className
}: EnhancedApprovalSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<ApprovalStrategy>('optimized');

  const {
    approvalStatus,
    approvalOptions,
    executeApprovalWithStrategy,
    isApproving,
    isConfirming,
    isConfirmed,
    error,
    costComparison,
    getApprovalProgress,
    tokenSymbol,
    currentAllowance,
  } = useEnhancedApprovalDetection({
    tokenAddress,
    spenderAddress,
    requiredAmount,
    userAddress,
  });

  // Handle approval execution
  const handleApproval = async (strategy: ApprovalStrategy) => {
    try {
      onApprovalStart?.();
      await executeApprovalWithStrategy(strategy);
      onApprovalComplete?.();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  // Get security risk color
  const getSecurityRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get security risk icon
  const getSecurityRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <Shield className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // If no approval is required, show success state
  if (!approvalStatus.isRequired) {
    return (
      <div className={cn('defi-card p-4', className)}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-green-300">Approval Not Required</h3>
            <p className="text-sm text-green-200">
              You have sufficient {tokenSymbol} approval for this transaction
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state after approval
  if (isConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('defi-card p-4', className)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-green-300">Approval Confirmed</h3>
            <p className="text-sm text-green-200">
              {tokenSymbol} approval has been successfully updated
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn('defi-card p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            approvalStatus.securityRisk === 'low' && 'bg-green-500/20',
            approvalStatus.securityRisk === 'medium' && 'bg-yellow-500/20',
            approvalStatus.securityRisk === 'high' && 'bg-red-500/20'
          )}>
            {getSecurityRiskIcon(approvalStatus.securityRisk)}
          </div>
          <div>
            <h3 className="font-medium">Token Approval Required</h3>
            <p className="text-sm text-muted-foreground">
              {approvalStatus.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Approval Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Allowance</span>
          <span>
            {formatUnits(currentAllowance, tokenSymbol === 'USDC' ? 6 : 8)} {tokenSymbol}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-defi-purple to-defi-pink h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(getApprovalProgress(), 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Required Amount</span>
          <span>
            {formatUnits(requiredAmount, tokenSymbol === 'USDC' ? 6 : 8)} {tokenSymbol}
          </span>
        </div>
      </div>

      {/* Simple Mode - Quick Approval */}
      {!showAdvanced && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Recommended: Optimized Approval</p>
                <p>
                  Approve 150% of the required amount to cover this transaction and potential future ones, 
                  saving gas costs while maintaining security.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleApproval('optimized')}
            disabled={isApproving || isConfirming}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-medium transition-all',
              isApproving || isConfirming
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-defi-purple to-defi-pink text-white hover:scale-105'
            )}
          >
            {isApproving || isConfirming ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {isApproving && 'Approving...'}
                  {isConfirming && 'Confirming...'}
                </span>
              </div>
            ) : (
              <>Approve {tokenSymbol}</>
            )}
          </button>
        </div>
      )}

      {/* Advanced Mode - Strategy Selection */}
      {showAdvanced && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {approvalOptions.map((option) => (
              <motion.div
                key={option.strategy}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-all',
                  selectedStrategy === option.strategy
                    ? 'border-defi-purple bg-defi-purple/10'
                    : 'border-border hover:border-defi-purple/50'
                )}
                onClick={() => setSelectedStrategy(option.strategy)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedStrategy === option.strategy
                        ? 'border-defi-purple bg-defi-purple'
                        : 'border-border'
                    )}>
                      {selectedStrategy === option.strategy && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{option.label}</span>
                        {option.recommended && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      <span className="text-sm font-medium">
                        {formatEther(option.gasEstimate * BigInt(30000000000))} ETH
                      </span>
                    </div>
                    <div className={cn(
                      'flex items-center space-x-1 text-xs',
                      getSecurityRiskColor(option.securityRisk)
                    )}>
                      {getSecurityRiskIcon(option.securityRisk)}
                      <span className="capitalize">{option.securityRisk} Risk</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Gas Cost Comparison */}
          {costComparison && (
            <div className="p-3 bg-background/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Gas Cost Comparison</h4>
              <div className="space-y-1">
                {costComparison.map((cost, index) => (
                  <div key={cost.strategy} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cost.label}</span>
                    <div className="flex items-center space-x-2">
                      <span>{formatEther(cost.gasCost)} ETH</span>
                      {index === 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Cheapest
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Warning for High Risk */}
          {selectedStrategy === 'infinite' && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p className="font-medium mb-1">Security Warning</p>
                  <p>
                    Unlimited approval allows the contract to spend any amount of your {tokenSymbol} 
                    tokens. Only use this if you trust the contract completely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={() => handleApproval(selectedStrategy)}
            disabled={isApproving || isConfirming}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-medium transition-all',
              isApproving || isConfirming
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-defi-purple to-defi-pink text-white hover:scale-105'
            )}
          >
            {isApproving || isConfirming ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {isApproving && 'Approving...'}
                  {isConfirming && 'Confirming...'}
                </span>
              </div>
            ) : (
              <>
                {selectedStrategy === 'exact' && 'Approve Exact Amount'}
                {selectedStrategy === 'optimized' && 'Approve Optimized Amount'}
                {selectedStrategy === 'infinite' && 'Approve Unlimited'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="text-sm text-red-200">
              <p className="font-medium mb-1">Approval Failed</p>
              <p>{error.message || 'An error occurred during approval'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 