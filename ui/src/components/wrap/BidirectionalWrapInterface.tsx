'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowDown, ExternalLink, AlertTriangle, RotateCcw, AlertCircle } from 'lucide-react';
import { type Address } from 'viem';
import { motion } from 'framer-motion';

import { TokenSelector } from './TokenSelector';
import { AmountInput } from './AmountInput';
import { CountdownTimer } from './CountdownTimer';
import { SUPPORTED_TOKENS, ADDRESSES, getExplorerUrl, getTokenByAddress } from '@/contracts/addresses';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type WrapDirection = 'wrap' | 'unwrap';

export function BidirectionalWrapInterface() {
  const { address, isConnected } = useAccount();
  
  // Component state
  const [direction, setDirection] = useState<WrapDirection>('wrap');
  const [selectedToken, setSelectedToken] = useState<typeof SUPPORTED_TOKENS[number] | null>(null);
  const [amount, setAmount] = useState('');
  const [lastSuccessDirection, setLastSuccessDirection] = useState<WrapDirection | null>(null);

  // Get user's token balances
  const { balance: tokenBalance } = useTokenBalance({
    tokenAddress: selectedToken?.address as Address,
    accountAddress: address,
  });

  const { balance: sovaBTCBalance } = useTokenBalance({
    tokenAddress: ADDRESSES.SOVABTC,
    accountAddress: address,
  });

  // Get wrapping hook
  const {
    executeWrapWithApproval,
    validateWrap,
    estimateOutput,
    minimumDeposit,
    overallStatus: wrapStatus,
    isApproving,
    isWrapping,
    isWrapConfirmed,
    useTokenAllowance,
    convertToSatoshis,
    error: wrapError,
    wrapHash,
  } = useTokenWrapping({
    userAddress: address,
  });

  // Get redemption hook
  const {
    executeRedemption,
    validateRedemption,
    calculateUnderlyingAmount,
    useAvailableReserve,
    overallStatus: redemptionStatus,
    isRedeeming,
    isRedemptionConfirmed,
    error: redemptionError,
    redemptionHash,
    redemptionRequest,
    isRedemptionReady,
    timeRemaining,
    hasPendingRedemption,
    pendingRedemptions,
  } = useTokenRedemption({
    userAddress: address,
  });

  // Get current allowance for wrapping
  const { data: currentAllowance } = useTokenAllowance(selectedToken?.address as Address);

  // Get available reserve for unwrapping
  const { data: availableReserve } = useAvailableReserve(selectedToken?.address as Address);

  // Parse amount to bigint for calculations
  const amountWei = useMemo(() => {
    if (!amount) return 0n;
    try {
      if (direction === 'wrap' && selectedToken) {
        return parseTokenAmount(amount, selectedToken.decimals);
      } else if (direction === 'unwrap') {
        return parseTokenAmount(amount, 8); // sovaBTC has 8 decimals
      }
      return 0n;
    } catch (error) {
      console.error('Amount parsing error:', error);
      return 0n;
    }
  }, [amount, direction, selectedToken]);

  // Validation logic
  const validation = useMemo(() => {
    if (!selectedToken || !amountWei) {
      return { isValid: false, error: 'Please enter an amount' };
    }

    if (direction === 'wrap') {
      return validateWrap(selectedToken.address as Address, amountWei, selectedToken.decimals);
    } else {
      return validateRedemption(
        selectedToken.address as Address,
        amountWei,
        availableReserve || 0n,
        selectedToken.decimals
      );
    }
  }, [direction, selectedToken, amountWei, validateWrap, validateRedemption, availableReserve]);

  // Calculate output amount
  const outputAmount = useMemo(() => {
    if (!selectedToken || !amountWei || amountWei === 0n) return 0n;

    if (direction === 'wrap') {
      return estimateOutput(amountWei, selectedToken.decimals);
    } else {
      return calculateUnderlyingAmount(amountWei, selectedToken.decimals);
    }
  }, [direction, selectedToken, amountWei, estimateOutput, calculateUnderlyingAmount]);

  // Check if approval is needed for wrapping
  const needsApproval = useMemo(() => {
    if (direction !== 'wrap' || !selectedToken || !amountWei || amountWei === 0n || !currentAllowance) {
      return false;
    }
    return currentAllowance < amountWei;
  }, [direction, selectedToken, amountWei, currentAllowance]);

  // Handle direction toggle
  const handleDirectionToggle = () => {
    setDirection(prev => prev === 'wrap' ? 'unwrap' : 'wrap');
    setAmount(''); // Reset amount when switching directions
    setSelectedToken(null); // Reset token selection
  };

  // Handle transaction execution
  const handleExecute = async () => {
    if (!selectedToken || !amountWei || !validation.isValid) return;

    try {
      if (direction === 'wrap') {
        await executeWrapWithApproval(
          selectedToken.address as Address,
          amountWei,
          selectedToken.decimals,
          currentAllowance || 0n
        );
      } else {
        await executeRedemption(selectedToken.address as Address, amountWei);
      }

      // Reset form on success
      if ((direction === 'wrap' && wrapStatus === 'confirmed') || 
          (direction === 'unwrap' && redemptionStatus === 'confirmed')) {
        setAmount('');
      }
    } catch (error) {
      console.error(`${direction} failed:`, error);
    }
  };

  // Get current transaction status
  const currentStatus = direction === 'wrap' ? wrapStatus : redemptionStatus;
  const isTransactionPending = 
    (direction === 'wrap' && (isApproving || isWrapping)) ||
    (direction === 'unwrap' && isRedeeming);

  // Track successful transactions for the current direction
  useEffect(() => {
    if (currentStatus === 'confirmed') {
      setLastSuccessDirection(direction);
    }
  }, [currentStatus, direction]);

  // Clear success state when direction changes
  useEffect(() => {
    setLastSuccessDirection(null);
  }, [direction]);

  // Get current error
  const currentError = direction === 'wrap' ? wrapError : redemptionError;

  // Get current transaction hash
  const currentHash = direction === 'wrap' ? wrapHash : redemptionHash;

  // Get balances for display
  const topBalance = direction === 'wrap' ? tokenBalance : sovaBTCBalance;
  const bottomBalance = direction === 'wrap' ? sovaBTCBalance : tokenBalance;

  return (
    <div className="max-w-md mx-auto">
      <div className="defi-card p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {direction === 'wrap' ? 'Wrap Bitcoin' : 'Unwrap sovaBTC'}
          </h2>
          <p className="text-foreground/60">
            {direction === 'wrap' 
              ? 'Convert Bitcoin-backed tokens into sovaBTC'
              : 'Redeem sovaBTC for underlying tokens (10-day delay)'
            }
          </p>
        </div>

        {!isConnected ? (
          /* Wallet Connection */
          <div className="text-center py-8">
            <p className="text-foreground/60 mb-4">Connect your wallet to get started</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-0">
            {/* Pending Redemption Warning - UPDATED for Multiple Redemptions */}
            {direction === 'unwrap' && (pendingRedemptions?.length ?? 0) > 0 && (
              <motion.div 
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">
                    {(pendingRedemptions?.length ?? 0) === 1 ? 'Pending Redemption' : `${pendingRedemptions?.length ?? 0} Pending Redemptions`}
                  </span>
                </div>
                {(pendingRedemptions ?? []).slice(0, 3).map((redemption, index) => (
                  <div key={redemption.id.toString()} className="text-sm text-slate-400 mb-1">
                    <div>#{redemption.id.toString()}: {formatTokenAmount(redemption.sovaAmount, 8)} sovaBTC → {getTokenByAddress(redemption.token)?.symbol || 'Token'}</div>
                  </div>
                ))}
                {(pendingRedemptions?.length ?? 0) > 3 && (
                  <div className="text-sm text-slate-500">
                    +{(pendingRedemptions?.length ?? 0) - 3} more redemptions...
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  ✅ You can create additional redemptions while these are pending
                </div>
              </motion.div>
            )}

            {/* Top Section (Wrap/Unwrap) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">
                  {direction === 'wrap' ? 'Wrap' : 'Unwrap'}
                </label>
                <div className="text-sm text-foreground/60">
                  Balance: {topBalance ? 
                    (direction === 'wrap' && selectedToken) 
                      ? formatTokenAmount(topBalance, selectedToken.decimals) 
                      : formatTokenAmount(topBalance, 8)
                    : '0.00'
                  }
                </div>
              </div>
              
              <div className="relative bg-card/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder:text-foreground/30"
                      disabled={isTransactionPending}
                    />
                    <div className="text-sm text-foreground/60 mt-1">$0</div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {direction === 'wrap' ? (
                      <TokenSelector
                        selectedToken={selectedToken}
                        onTokenSelect={setSelectedToken}
                        userAddress={address}
                        compact={true}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 bg-card border border-border/50 rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-xs font-bold">
                          sB
                        </div>
                        <span className="font-medium">sovaBTC</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow with Toggle */}
            <div className="flex justify-center py-2">
              <button
                onClick={handleDirectionToggle}
                className="p-2 bg-card border border-border/50 rounded-xl hover:bg-card/80 hover:border-defi-purple/50 transition-all duration-200 hover:scale-110 group"
                title={direction === 'wrap' ? 'Switch to Unwrap' : 'Switch to Wrap'}
              >
                <ArrowDown className="w-4 h-4 text-foreground/60 group-hover:text-defi-purple transition-colors" />
              </button>
            </div>

            {/* Bottom Section (Receive) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Receive</label>
                <div className="text-sm text-foreground/60">
                  Balance: {bottomBalance ? 
                    (direction === 'unwrap' && selectedToken) 
                      ? formatTokenAmount(bottomBalance, selectedToken.decimals) 
                      : formatTokenAmount(bottomBalance, 8)
                    : '0.00'
                  }
                </div>
              </div>
              
              <div className="relative bg-card/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="text-3xl font-semibold text-foreground/90">
                      {outputAmount > 0n ? 
                        (direction === 'wrap' 
                          ? formatTokenAmount(outputAmount, 8, 6)
                          : selectedToken 
                            ? formatTokenAmount(outputAmount, selectedToken.decimals, 6)
                            : '0'
                        ) : '0'
                      }
                    </div>
                    <div className="text-sm text-foreground/60 mt-1">$0</div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {direction === 'unwrap' ? (
                      <TokenSelector
                        selectedToken={selectedToken}
                        onTokenSelect={setSelectedToken}
                        userAddress={address}
                        showReserves={true}
                        compact={true}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 bg-card border border-border/50 rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-xs font-bold">
                          sB
                        </div>
                        <span className="font-medium">sovaBTC</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional info for unwrap */}
                {direction === 'unwrap' && selectedToken && (
                  <div className="mt-2 text-xs text-foreground/60">
                    Reserve: {availableReserve ? formatTokenAmount(availableReserve, selectedToken.decimals) : '0.00'} {selectedToken.symbol}
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button
                onClick={handleExecute}
                disabled={
                  !selectedToken ||
                  !amount ||
                  isTransactionPending || 
                  !validation.isValid
                }
                className={cn(
                  "w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 text-lg",
                  (!selectedToken || !amount || isTransactionPending || !validation.isValid)
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "btn-defi text-white hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {/* Loading States */}
                {direction === 'wrap' && currentStatus === 'approving' && `Approving ${selectedToken?.symbol}...`}
                {direction === 'wrap' && currentStatus === 'wrapping' && 'Wrapping...'}
                {direction === 'unwrap' && currentStatus === 'redeeming' && 'Queuing Redemption...'}
                
                {/* Success States */}
                {currentStatus === 'confirmed' && `${direction === 'wrap' ? 'Wrap' : 'Redemption'} Successful!`}
                
                {/* Error States */}
                {currentStatus === 'error' && 'Transaction Failed - Retry'}
                
                {/* Idle States */}
                {currentStatus === 'idle' && !selectedToken && 'Select a token'}
                {currentStatus === 'idle' && selectedToken && !amount && 'Enter amount'}
                {currentStatus === 'idle' && selectedToken && amount && direction === 'wrap' && (
                  needsApproval 
                    ? `Approve & Wrap ${selectedToken.symbol}` 
                    : `Wrap ${selectedToken.symbol}`
                )}
                {currentStatus === 'idle' && selectedToken && amount && direction === 'unwrap' && `Unwrap sovaBTC`}
              </button>

              {/* Validation Error */}
              {!validation.isValid && validation.error && selectedToken && amount && (
                <div className="mt-3 text-sm text-red-400 text-center">
                  {validation.error}
                </div>
              )}

              {/* Unwrap Warning */}
              {direction === 'unwrap' && validation.isValid && selectedToken && amount && (
                <div className="mt-3 text-sm text-yellow-400 text-center">
                  ⚠️ sovaBTC will be burned immediately. Tokens available after 10-day delay.
                </div>
              )}
            </div>

            {/* Transaction Success - Only show for current direction */}
            {currentStatus === 'confirmed' && currentHash && lastSuccessDirection === direction && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-green-400 text-sm font-medium mb-2">
                  ✅ {direction === 'wrap' ? 'Wrap' : 'Redemption'} Successful!
                </div>
                <a
                  href={getExplorerUrl(currentHash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-defi-purple hover:text-defi-pink transition-colors"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Error Display */}
            {currentError && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-red-400 text-sm">
                  {currentError?.message || 'Transaction failed'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 