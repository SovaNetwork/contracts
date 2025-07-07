'use client';

import { Info, Zap } from 'lucide-react';
import { formatEther } from 'viem';
import { getChainConfig } from '@/contracts/addresses';
import type { MessagingFee } from '@/hooks/web3/useBridgeTransaction';

interface BridgeFeeEstimatorProps {
  sourceChainId: number;
  destinationChainId: number;
  amount: bigint;
  isLoading?: boolean;
  fee?: MessagingFee | null;
  className?: string;
}

export function BridgeFeeEstimator({
  sourceChainId,
  destinationChainId,
  amount,
  isLoading = false,
  fee,
  className = ''
}: BridgeFeeEstimatorProps) {
  const sourceChain = getChainConfig(sourceChainId);
  const destinationChain = getChainConfig(destinationChainId);

  if (!sourceChain || !destinationChain) {
    return null;
  }

  return (
    <div className={`defi-card border border-slate-600 p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-4 h-4 text-defi-purple" />
        <span className="font-medium text-slate-200">Bridge Fees</span>
        <div className="group relative">
          <Info className="w-4 h-4 text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
            <div className="bg-slate-800 text-white text-xs rounded-lg p-2 whitespace-nowrap border border-slate-600">
              LayerZero cross-chain messaging fees
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-700/50 rounded shimmer" />
            <div className="h-4 bg-slate-700/50 rounded shimmer w-3/4" />
            <div className="h-4 bg-slate-700/50 rounded shimmer w-1/2" />
          </div>
        ) : fee ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">LayerZero Fee:</span>
              <span className="text-slate-200 font-mono">
                {formatEther(fee.nativeFee)} {sourceChain.nativeCurrency.symbol}
              </span>
            </div>
            
            {fee.lzTokenFee > 0n && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">LZ Token Fee:</span>
                <span className="text-slate-200 font-mono">
                  {formatEther(fee.lzTokenFee)} LZ
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-600">
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-300">Total Fee:</span>
                <span className="text-defi-purple font-mono">
                  {formatEther(fee.nativeFee)} {sourceChain.nativeCurrency.symbol}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-2">
              Estimated delivery time: ~2-10 minutes
            </div>
          </>
        ) : amount > 0n ? (
          <div className="text-slate-400 text-center py-2">
            Enter amount to calculate fees
          </div>
        ) : null}
      </div>
    </div>
  );
} 