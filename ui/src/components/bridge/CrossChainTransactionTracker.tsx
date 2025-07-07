'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getExplorerUrl, getChainConfig } from '@/contracts/addresses';

type TransactionStep = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  chainId?: number;
  timestamp?: number;
};

type CrossChainTransactionTrackerProps = {
  sourceChainId: number;
  destinationChainId: number;
  sourceTxHash?: string;
  destinationTxHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount?: bigint;
  tokenSymbol?: string;
  className?: string;
};

export function CrossChainTransactionTracker({
  sourceChainId,
  destinationChainId,
  sourceTxHash,
  destinationTxHash,
  status,
  amount,
  tokenSymbol,
  className = ""
}: CrossChainTransactionTrackerProps) {
  const [steps, setSteps] = useState<TransactionStep[]>([]);

  const sourceChain = getChainConfig(sourceChainId);
  const destinationChain = getChainConfig(destinationChainId);

  useEffect(() => {
    const newSteps: TransactionStep[] = [
      {
        id: 'source',
        label: `Submit on ${sourceChain?.name}`,
        status: sourceTxHash ? 'completed' : 'pending',
        txHash: sourceTxHash,
        chainId: sourceChainId,
      },
      {
        id: 'layerzero',
        label: 'LayerZero Messaging',
        status: sourceTxHash && !destinationTxHash ? 'processing' : 
                destinationTxHash ? 'completed' : 'pending',
      },
      {
        id: 'destination', 
        label: `Receive on ${destinationChain?.name}`,
        status: destinationTxHash ? 'completed' : 'pending',
        txHash: destinationTxHash,
        chainId: destinationChainId,
      },
    ];

    // Handle error states
    if (status === 'failed') {
      newSteps.forEach(step => {
        if (step.status === 'pending' || step.status === 'processing') {
          step.status = 'failed';
        }
      });
    }

    setSteps(newSteps);
  }, [sourceChainId, destinationChainId, sourceTxHash, destinationTxHash, status, sourceChain, destinationChain]);

  const getStatusIcon = (stepStatus: TransactionStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-500" />;
    }
  };

  const getStepColor = (stepStatus: TransactionStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`rounded-lg border border-border/50 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Cross-Chain Transfer</h3>
        {amount && tokenSymbol && (
          <div className="text-sm text-foreground/70">
            {amount.toString()} {tokenSymbol}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(step.status)}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <div className={`font-medium ${getStepColor(step.status)}`}>
                {step.label}
              </div>
              
              {step.txHash && step.chainId && (
                <a
                  href={getExplorerUrl(step.chainId, step.txHash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-defi-purple hover:text-defi-pink transition-colors mt-1"
                >
                  <span>View Transaction</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Connection Arrow */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/70">Status:</span>
          <span className={`font-medium ${getStepColor(status)}`}>
            {status === 'pending' && 'Waiting for confirmation'}
            {status === 'processing' && 'Processing cross-chain transfer'}
            {status === 'completed' && 'Transfer completed successfully'}
            {status === 'failed' && 'Transfer failed'}
          </span>
        </div>
        
        {status === 'processing' && (
          <div className="mt-2 text-xs text-foreground/50">
            Cross-chain transfers typically take 5-10 minutes
          </div>
        )}
      </div>
    </div>
  );
} 