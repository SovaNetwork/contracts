'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowDown, ArrowUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { type Address } from 'viem';

import { TokenSelector } from './TokenSelector';
import { AmountInput } from './AmountInput';
import { CountdownTimer } from './CountdownTimer';
import { SUPPORTED_TOKENS, ADDRESSES, getExplorerUrl } from '@/contracts/addresses';
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

  // Get the token decimals for the selected token
  const { data: tokenDecimals } = useTokenBalance({
    tokenAddress: selectedToken?.address as Address,
    accountAddress: address,
  });

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

  // Get current error
  const currentError = direction === 'wrap' ? wrapError : redemptionError;

  // Get current transaction hash
  const currentHash = direction === 'wrap' ? wrapHash : redemptionHash;

  // Get current balance for the input token
  const inputBalance = direction === 'wrap' ? tokenBalance : sovaBTCBalance;

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
          <div className="space-y-4">
            {/* Pending Redemption Warning */}
            {direction === 'unwrap' && hasPendingRedemption && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pending Redemption
                </div>
                {redemptionRequest && (
                  <div className="space-y-2 text-sm">
                    <div>Amount: {formatTokenAmount(redemptionRequest.sovaAmount, 8)} sovaBTC</div>
                    <div>Token: {redemptionRequest.token}</div>
                    {timeRemaining !== null && timeRemaining > 0 && (
                      <CountdownTimer timeRemaining={timeRemaining} />
                    )}
                    {isRedemptionReady && (
                      <div className="text-green-400 font-medium">
                        ✅ Ready for fulfillment by custodian
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* From Token Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">From</label>
              {direction === 'wrap' ? (
                <TokenSelector
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                  userAddress={address}
                />
              ) : (
                <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-sm font-bold">
                      sB
                    </div>
                    <div>
                      <div className="font-medium">sovaBTC</div>
                      <div className="text-sm text-foreground/60">
                        Balance: {sovaBTCBalance ? formatTokenAmount(sovaBTCBalance, 8) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input */}
            {((direction === 'wrap' && selectedToken) || direction === 'unwrap') && (
              <AmountInput
                value={amount}
                onChange={setAmount}
                selectedToken={direction === 'wrap' ? selectedToken! : { 
                  symbol: 'sovaBTC', 
                  decimals: 8, 
                  address: ADDRESSES.SOVABTC,
                  name: 'SovaBTC'
                }}
                balance={inputBalance}
                minimumAmount={direction === 'wrap' ? minimumDeposit : undefined}
                disabled={isTransactionPending || (direction === 'unwrap' && hasPendingRedemption)}
              />
            )}

            {/* Interactive Arrow - Click to Toggle Direction */}
            {amount && (
              <div className="flex justify-center py-2">
                <button
                  onClick={handleDirectionToggle}
                  className="p-3 bg-card border border-border/50 rounded-full hover:bg-card/80 hover:border-defi-purple/50 transition-all duration-200 hover:scale-110 group"
                  title={direction === 'wrap' ? 'Switch to Unwrap' : 'Switch to Wrap'}
                >
                  {direction === 'wrap' ? (
                    <ArrowDown className="w-5 h-5 text-foreground/60 group-hover:text-defi-purple transition-colors" />
                  ) : (
                    <ArrowUp className="w-5 h-5 text-foreground/60 group-hover:text-defi-purple transition-colors" />
                  )}
                </button>
              </div>
            )}

            {/* To Token Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">To</label>
              {direction === 'unwrap' ? (
                <TokenSelector
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                  userAddress={address}
                  showReserves={true}
                />
              ) : (
                amount && outputAmount > 0n && (
                  <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-sm font-bold">
                          sB
                        </div>
                        <div>
                          <div className="font-medium">sovaBTC</div>
                          <div className="text-sm text-foreground/60">SovaBTC</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium">
                          {formatTokenAmount(outputAmount, 8, 8)}
                        </div>
                        <div className="text-sm text-foreground/60">Estimated</div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Output Amount for Unwrapping */}
            {direction === 'unwrap' && selectedToken && amount && outputAmount > 0n && (
              <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                      {selectedToken.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{selectedToken.symbol}</div>
                      <div className="text-sm text-foreground/60">
                        Reserve: {availableReserve ? formatTokenAmount(availableReserve, selectedToken.decimals) : '0.00'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {formatTokenAmount(outputAmount, selectedToken.decimals)}
                    </div>
                    <div className="text-sm text-foreground/60">
                      {direction === 'unwrap' ? 'After 10 days' : 'Estimated'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {((direction === 'wrap' && selectedToken) || (direction === 'unwrap' && selectedToken)) && amount && (
              <div className="pt-4">
                <button
                  onClick={handleExecute}
                  disabled={
                    isTransactionPending || 
                    !validation.isValid || 
                    (direction === 'unwrap' && hasPendingRedemption)
                  }
                  className={cn(
                    "w-full py-4 px-6 rounded-lg font-medium transition-all duration-200",
                    isTransactionPending || !validation.isValid || (direction === 'unwrap' && hasPendingRedemption)
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "btn-defi text-white hover:scale-105"
                  )}
                >
                  {/* Wrap Status Messages */}
                  {direction === 'wrap' && currentStatus === 'approving' && `Approving ${selectedToken.symbol}...`}
                  {direction === 'wrap' && currentStatus === 'wrapping' && 'Wrapping to sovaBTC...'}
                  {direction === 'wrap' && currentStatus === 'confirmed' && 'Wrap Successful!'}
                  
                  {/* Unwrap Status Messages */}
                  {direction === 'unwrap' && currentStatus === 'redeeming' && 'Queuing Redemption...'}
                  {direction === 'unwrap' && currentStatus === 'confirmed' && 'Redemption Queued!'}
                  
                  {/* Error States */}
                  {currentStatus === 'error' && 'Transaction Failed - Retry'}
                  
                  {/* Idle States */}
                  {currentStatus === 'idle' && direction === 'wrap' && (
                    needsApproval 
                      ? `Approve & Wrap ${selectedToken.symbol}` 
                      : 'Wrap to sovaBTC'
                  )}
                  {currentStatus === 'idle' && direction === 'unwrap' && (
                    hasPendingRedemption 
                      ? 'Pending Redemption Exists'
                      : `Queue sovaBTC Redemption`
                  )}
                </button>

                {/* Validation Error */}
                {!validation.isValid && validation.error && (
                  <div className="mt-2 text-sm text-red-400 text-center">
                    {validation.error}
                  </div>
                )}

                {/* Unwrap Warning */}
                {direction === 'unwrap' && validation.isValid && !hasPendingRedemption && (
                  <div className="mt-2 text-sm text-yellow-400 text-center">
                    ⚠️ sovaBTC will be burned immediately. Tokens available after 10-day delay.
                  </div>
                )}
              </div>
            )}

            {/* Transaction Success */}
            {currentStatus === 'confirmed' && currentHash && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
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
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
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