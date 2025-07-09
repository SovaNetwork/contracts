'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  Timer
} from 'lucide-react';
import { type Address } from 'viem';

import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { useBridgeTransaction } from '@/hooks/web3/useBridgeTransaction';
import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { useEnhancedApprovalDetection } from '@/hooks/web3/useEnhancedApprovalDetection';
import { EnhancedApprovalSelector } from './EnhancedApprovalSelector';
import { EnhancedFeeBreakdown } from './EnhancedFeeBreakdown';

import { getExplorerUrl } from '@/contracts/addresses';
import { cn } from '@/lib/utils';
import type { UnifiedToken, SwapOperation } from './UnifiedSwapInterface';

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  txHash?: string;
  estimatedTime?: number; // seconds
  gasEstimate?: bigint;
  feeEstimate?: bigint;
}



interface UnifiedTransactionFlowProps {
  operation: SwapOperation;
  fromToken: UnifiedToken;
  toToken: UnifiedToken;
  amount: bigint;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  className?: string;
}

export function UnifiedTransactionFlow({
  operation,
  fromToken,
  toToken,
  amount,
  onSuccess,
  onError,
  onReset,
  className
}: UnifiedTransactionFlowProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { getContractAddress } = useActiveNetwork();

  // Hook instances
  const wrapHook = useTokenWrapping({ userAddress: address });
  const bridgeHook = useBridgeTransaction();
  const redemptionHook = useTokenRedemption({ userAddress: address });

  // Transaction state
  const [currentStep, setCurrentStep] = useState<string>('prepare');
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  // Token allowance check
  const { data: tokenAllowance } = wrapHook.useTokenAllowance(
    operation === 'wrap' ? fromToken.address as Address : undefined
  );

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (operation !== 'wrap' || !tokenAllowance || !amount) return false;
    return tokenAllowance < amount;
  }, [operation, tokenAllowance, amount]);

  // Generate transaction steps based on operation
  const generateTransactionSteps = useMemo((): TransactionStep[] => {
    const steps: TransactionStep[] = [];

    switch (operation) {
      case 'wrap':
        if (needsApproval) {
          steps.push({
            id: 'approval',
            title: 'Approve Token',
            description: `Approve ${fromToken.symbol} for wrapping`,
            status: 'pending',
            estimatedTime: 30,
          });
        }
        steps.push({
          id: 'wrap',
          title: 'Wrap Token',
          description: `Convert ${fromToken.symbol} to sovaBTC`,
          status: needsApproval ? 'pending' : 'pending',
          estimatedTime: 45,
        });
        break;

      case 'bridge':
        steps.push({
          id: 'bridge',
          title: 'Bridge sovaBTC',
          description: `Transfer to ${toToken.network.name}`,
          status: 'pending',
          estimatedTime: 60,
        });
        steps.push({
          id: 'confirmation',
          title: 'Cross-Chain Confirmation',
          description: 'Waiting for destination confirmation',
          status: 'pending',
          estimatedTime: 300, // 5 minutes
        });
        break;

      case 'unwrap':
        steps.push({
          id: 'queue',
          title: 'Queue Redemption',
          description: `Request redemption for ${toToken.symbol}`,
          status: 'pending',
          estimatedTime: 60,
        });
        steps.push({
          id: 'waiting',
          title: 'Security Delay',
          description: '10-day redemption period',
          status: 'pending',
          estimatedTime: 864000, // 10 days in seconds
        });
        break;

      default:
        break;
    }

    return steps;
  }, [operation, needsApproval, fromToken, toToken]);

  // Initialize steps
  useEffect(() => {
    setTransactionSteps(generateTransactionSteps);
    setCurrentStep('prepare');
  }, [generateTransactionSteps]);



  // Execute transaction flow
  const executeTransaction = async () => {
    if (!address || !fromToken || !toToken || !amount) return;

    setIsExecuting(true);
    setCurrentStep('executing');

    try {
      let txHash: string | null = null;

      switch (operation) {
        case 'wrap':
          // Handle approval if needed
          if (needsApproval) {
            setCurrentStep('approval');
            updateStepStatus('approval', 'active');
            
            await wrapHook.executeApproval(
              fromToken.address as Address,
              amount
            );
            
            updateStepStatus('approval', 'completed');
            
            // Wait for approval confirmation
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Execute wrap
          setCurrentStep('wrap');
          updateStepStatus('wrap', 'active');
          
          await wrapHook.executeWrapWithApproval(
            fromToken.address as Address,
            amount,
            fromToken.decimals,
            tokenAllowance || 0n
          );
          
          // Use the wrap hash from hook
          txHash = wrapHook.wrapHash || null;
          if (txHash) {
            updateStepStatus('wrap', 'completed', txHash);
            setCompletedTxHash(txHash);
          }
          break;

        case 'bridge':
          setCurrentStep('bridge');
          updateStepStatus('bridge', 'active');
          
          await bridgeHook.executeBridge({
            sourceChainId: fromToken.network.chainId,
            destinationChainId: toToken.network.chainId,
            amount,
            recipient: address,
          });
          
          // Use the bridge hash from hook
          txHash = bridgeHook.bridgeHash || null;
          if (txHash) {
            updateStepStatus('bridge', 'completed', txHash);
            setCurrentStep('confirmation');
            updateStepStatus('confirmation', 'active');
            
            // Monitor for destination confirmation
            // This would typically involve polling the destination chain
            setTimeout(() => {
              updateStepStatus('confirmation', 'completed');
              setCompletedTxHash(txHash);
            }, 5000); // Simulate 5 second confirmation
          }
          break;

        case 'unwrap':
          setCurrentStep('queue');
          updateStepStatus('queue', 'active');
          
          await redemptionHook.executeRedemption(
            toToken.address as Address,
            amount
          );
          
          // Use the redemption hash from hook
          txHash = redemptionHook.redemptionHash || null;
          if (txHash) {
            updateStepStatus('queue', 'completed', txHash);
            setCurrentStep('waiting');
            updateStepStatus('waiting', 'active');
            setCompletedTxHash(txHash);
          }
          break;

        default:
          throw new Error('Invalid operation');
      }

      if (txHash) {
        onSuccess?.(txHash);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      console.error('Transaction failed:', error);
      
      // Update current step to failed
      updateStepStatus(currentStep, 'failed');
      onError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper to update step status
  const updateStepStatus = (stepId: string, status: TransactionStep['status'], txHash?: string) => {
    setTransactionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, txHash }
        : step
    ));
  };

  // Reset transaction state
  const resetTransaction = () => {
    setCurrentStep('prepare');
    setTransactionSteps(generateTransactionSteps);
    setIsExecuting(false);
    setCompletedTxHash(null);
    onReset?.();
  };

  // Format time estimate
  const formatTimeEstimate = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Enhanced Fee Breakdown */}
      <EnhancedFeeBreakdown
        operation={operation}
        fromToken={fromToken}
        toToken={toToken}
        amount={amount}
        needsApproval={needsApproval}
      />

      {/* Enhanced Approval Selector */}
      {operation === 'wrap' && needsApproval && !isExecuting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EnhancedApprovalSelector
            tokenAddress={fromToken.address as Address}
            spenderAddress={getContractAddress('wrapper') as Address}
            requiredAmount={amount}
            userAddress={address as Address}
            onApprovalComplete={() => {
              // Refresh allowance after approval
              setTimeout(() => {
                // This will trigger re-evaluation of needsApproval
              }, 1000);
            }}
            onApprovalStart={() => {
              console.log('Approval started');
            }}
          />
        </motion.div>
      )}

      {/* Transaction Steps */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="defi-card p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80">Transaction Steps</span>
          <div className="flex items-center space-x-2">
            {isExecuting && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            )}
            <span className="text-xs text-foreground/60">
              {transactionSteps.filter(s => s.status === 'completed').length} of {transactionSteps.length} completed
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {transactionSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                step.status === 'active' && 'bg-blue-900/20 border border-blue-600',
                step.status === 'completed' && 'bg-green-900/20 border border-green-600',
                step.status === 'failed' && 'bg-red-900/20 border border-red-600',
                step.status === 'pending' && 'bg-card/30'
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                    <span className="text-xs text-foreground/60">{index + 1}</span>
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  </div>
                )}
                {step.status === 'completed' && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                {step.status === 'failed' && (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.title}</span>
                  {step.estimatedTime && step.status !== 'completed' && (
                    <div className="flex items-center space-x-1">
                      <Timer className="w-3 h-3 text-foreground/40" />
                      <span className="text-xs text-foreground/60">
                        ~{formatTimeEstimate(step.estimatedTime)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-foreground/60 mt-1">{step.description}</p>
              </div>

              {/* Transaction Link */}
              {step.txHash && (
                <a
                  href={getExplorerUrl(chainId, step.txHash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {completedTxHash ? (
          <button
            onClick={resetTransaction}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-defi-purple to-defi-pink text-white rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Start New Transaction
          </button>
        ) : (
          <button
            onClick={executeTransaction}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
              isExecuting
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-defi-purple to-defi-pink text-white hover:scale-105'
            )}
          >
            {isExecuting ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </div>
            ) : (
              <>
                {operation === 'wrap' && needsApproval && 'Approve & Wrap'}
                {operation === 'wrap' && !needsApproval && 'Wrap Tokens'}
                {operation === 'bridge' && 'Bridge sovaBTC'}
                {operation === 'unwrap' && 'Queue Redemption'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 