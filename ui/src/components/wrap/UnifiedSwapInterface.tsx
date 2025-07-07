'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowDown, ExternalLink, AlertTriangle, Repeat2, Zap } from 'lucide-react';
import { type Address } from 'viem';
import { motion } from 'framer-motion';

import { UnifiedTokenSelector } from './UnifiedTokenSelector';
import { AmountInput } from './AmountInput';
import { useNetworkTokens, useActiveNetwork, useContractAddress } from '@/hooks/web3/useActiveNetwork';
import { useBridgeTransaction } from '@/hooks/web3/useBridgeTransaction';
import { getExplorerUrl, getChainConfig, getCrossChainSupportedChains, getSupportedChains } from '@/contracts/addresses';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Unified token type that can represent local tokens or cross-chain sovaBTC
export type UnifiedToken = {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  chainId?: number; // If set, represents sovaBTC on that chain
  address?: Address; // Local token address
  isCrossChain?: boolean;
  isNative?: boolean;
};

type SwapType = 'wrap' | 'unwrap' | 'bridge';

export function UnifiedSwapInterface() {
  const { address, isConnected } = useAccount();
  
  // Get network-aware data
  const { tokens } = useNetworkTokens();
  const { activeChainId, switchToChain } = useActiveNetwork();
  const sovaBTCAddress = useContractAddress('sovaBTC');
  const supportedChains = getSupportedChains();
  
  // Component state
  const [fromToken, setFromToken] = useState<UnifiedToken | null>(null);
  const [toToken, setToToken] = useState<UnifiedToken | null>(null);
  const [amount, setAmount] = useState('');
  
  // Determine swap type based on selected tokens
  const swapType: SwapType = useMemo(() => {
    if (!fromToken || !toToken) return 'wrap';
    
    if (fromToken.isCrossChain || toToken.isCrossChain) {
      return 'bridge';
    } else if (fromToken.symbol === 'sovaBTC') {
      return 'unwrap';
    } else {
      return 'wrap';
    }
  }, [fromToken, toToken]);

  // Get balances
  const { balance: fromBalance } = useTokenBalance({
    tokenAddress: fromToken?.address || (fromToken?.symbol === 'sovaBTC' && sovaBTCAddress ? sovaBTCAddress : '0x0000000000000000000000000000000000000000'),
    accountAddress: address,
    enabled: Boolean(fromToken && address),
  });

  const { balance: toBalance } = useTokenBalance({
    tokenAddress: toToken?.address || (toToken?.symbol === 'sovaBTC' && sovaBTCAddress ? sovaBTCAddress : '0x0000000000000000000000000000000000000000'),
    accountAddress: address,
    enabled: Boolean(toToken && address),
  });

  // Hook implementations
  const {
    executeWrapWithApproval,
    validateWrap,
    estimateOutput,
    overallStatus: wrapStatus,
    isApproving,
    isWrapping,
    error: wrapError,
    wrapHash,
    useTokenAllowance,
  } = useTokenWrapping({ userAddress: address });

  const {
    executeRedemption,
    validateRedemption,
    calculateUnderlyingAmount,
    useAvailableReserve,
    overallStatus: redemptionStatus,
    isRedeeming,
    error: redemptionError,
    redemptionHash,
  } = useTokenRedemption({ userAddress: address });

  const {
    executeBridge,
    quoteFee,
    isBridging,
    bridgeHash,
    isConfirmed: isBridgeConfirmed,
    error: bridgeError,
  } = useBridgeTransaction();

  // Get allowance and reserves for display
  const { data: currentAllowance } = useTokenAllowance(fromToken?.address as Address);
  const { data: availableReserve } = useAvailableReserve(toToken?.address as Address);

  // Parse amount to wei
  const amountWei = useMemo(() => {
    if (!amount || !fromToken) return 0n;
    try {
      return parseTokenAmount(amount, fromToken.decimals) || 0n;
    } catch {
      return 0n;
    }
  }, [amount, fromToken]);

  // Validation logic
  const validation = useMemo(() => {
    if (!fromToken || !toToken || !amountWei) {
      return { isValid: false, error: 'Enter an amount' };
    }

    if (fromBalance && amountWei > fromBalance) {
      return { isValid: false, error: 'Insufficient balance' };
    }

    switch (swapType) {
      case 'wrap':
        if (!fromToken.address) return { isValid: false, error: 'Invalid token' };
        return validateWrap(fromToken.address, amountWei, fromToken.decimals);
      
      case 'unwrap':
        if (!toToken.address) return { isValid: false, error: 'Invalid token' };
        return validateRedemption(
          toToken.address,
          amountWei,
          availableReserve || 0n,
          toToken.decimals
        );
      
      case 'bridge':
        if (!toToken.chainId) return { isValid: false, error: 'Invalid destination chain' };
        if (fromToken.chainId === toToken.chainId) {
          return { isValid: false, error: 'Same chain selected' };
        }
        return { isValid: true, error: null };
      
      default:
        return { isValid: false, error: 'Invalid swap type' };
    }
  }, [swapType, fromToken, toToken, amountWei, fromBalance, validateWrap, validateRedemption, availableReserve]);

  // Calculate output amount
  const outputAmount = useMemo(() => {
    if (!fromToken || !toToken || !amountWei || amountWei === 0n) return 0n;

    switch (swapType) {
      case 'wrap':
        return estimateOutput(amountWei, fromToken.decimals);
      case 'unwrap':
        return calculateUnderlyingAmount(amountWei, toToken.decimals);
      case 'bridge':
        return amountWei; // 1:1 for bridge
      default:
        return 0n;
    }
  }, [swapType, fromToken, toToken, amountWei, estimateOutput, calculateUnderlyingAmount]);

  // Check if approval needed
  const needsApproval = useMemo(() => {
    if (swapType !== 'wrap' || !fromToken?.address || !amountWei || !currentAllowance) {
      return false;
    }
    return currentAllowance < amountWei;
  }, [swapType, fromToken, amountWei, currentAllowance]);

  // Handle token swapping (reverse from/to)
  const handleSwapTokens = () => {
    if (swapType === 'bridge') {
      // For bridges, just swap the chain IDs
      const newFromToken = toToken ? { ...toToken } : null;
      const newToToken = fromToken ? { ...fromToken } : null;
      setFromToken(newFromToken);
      setToToken(newToToken);
    } else {
      // For wrap/unwrap, swap the tokens
      const newFromToken = toToken;
      const newToToken = fromToken;
      setFromToken(newFromToken);
      setToToken(newToToken);
    }
    setAmount(''); // Reset amount
  };

  // Handle transaction execution
  const handleExecute = async () => {
    if (!validation.isValid || !fromToken || !toToken || !amountWei) return;

    try {
      switch (swapType) {
        case 'wrap':
          if (!fromToken.address) return;
          await executeWrapWithApproval(
            fromToken.address,
            amountWei,
            fromToken.decimals,
            currentAllowance || 0n
          );
          break;
        
        case 'unwrap':
          if (!toToken.address) return;
          await executeRedemption(toToken.address, amountWei);
          break;
        
        case 'bridge':
          if (!toToken.chainId || !address) return;
          await executeBridge({
            destinationChainId: toToken.chainId,
            amount: amountWei,
            recipient: address,
          });
          break;
      }
    } catch (error) {
      console.error(`${swapType} failed:`, error);
    }
  };

  // Get current status and loading state
  const isTransactionPending = useMemo(() => {
    switch (swapType) {
      case 'wrap': return isApproving || isWrapping;
      case 'unwrap': return isRedeeming;
      case 'bridge': return isBridging;
      default: return false;
    }
  }, [swapType, isApproving, isWrapping, isRedeeming, isBridging]);

  const currentStatus = useMemo(() => {
    switch (swapType) {
      case 'wrap': return wrapStatus;
      case 'unwrap': return redemptionStatus;
      case 'bridge': return isBridgeConfirmed ? 'confirmed' : (isBridging ? 'pending' : 'idle');
      default: return 'idle';
    }
  }, [swapType, wrapStatus, redemptionStatus, isBridgeConfirmed, isBridging]);

  const currentError = useMemo(() => {
    switch (swapType) {
      case 'wrap': return wrapError;
      case 'unwrap': return redemptionError;
      case 'bridge': return bridgeError;
      default: return null;
    }
  }, [swapType, wrapError, redemptionError, bridgeError]);

  const currentHash = useMemo(() => {
    switch (swapType) {
      case 'wrap': return wrapHash;
      case 'unwrap': return redemptionHash;
      case 'bridge': return bridgeHash;
      default: return null;
    }
  }, [swapType, wrapHash, redemptionHash, bridgeHash]);

  // Generate available tokens for unified selector
  const generateUnifiedTokens = (isFromSelector: boolean): UnifiedToken[] => {
    const crossChainTokens = getCrossChainSupportedChains()
      .filter(chain => chain.chainId !== activeChainId)
      .map(chain => ({
        symbol: 'sovaBTC',
        name: `sovaBTC on ${chain.name}`,
        decimals: 8,
        icon: '/icons/sovabtc.svg',
        chainId: chain.chainId,
        isCrossChain: true,
      }));

    const localTokens: UnifiedToken[] = [
      // Local sovaBTC
      {
        symbol: 'sovaBTC',
        name: 'SovaBTC',
        decimals: 8,
        icon: '/icons/sovabtc.svg',
        address: sovaBTCAddress,
      },
      // Local supported tokens
      ...tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        icon: token.icon,
        address: token.address,
      })),
    ];

    return [...localTokens, ...crossChainTokens];
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="defi-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect to start swapping across networks
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="defi-card p-6 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-2">
            Universal Swap
          </h2>
          <p className="text-foreground/60">
            Swap tokens and bridge across networks
          </p>
        </div>

        {/* Swap Type Indicator */}
        <div className="flex items-center justify-center">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border",
            swapType === 'wrap' && "bg-green-500/10 border-green-500/20 text-green-400",
            swapType === 'unwrap' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
            swapType === 'bridge' && "bg-purple-500/10 border-purple-500/20 text-purple-400"
          )}>
            {swapType === 'wrap' && '🔄 Wrapping'}
            {swapType === 'unwrap' && '🔓 Unwrapping'}
            {swapType === 'bridge' && '🌉 Bridging'}
          </div>
        </div>

        {/* From Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/80">From</label>
            <div className="text-sm text-foreground/60">
              Balance: {fromBalance ? formatTokenAmount(fromBalance, fromToken?.decimals || 18) : '0.00'}
            </div>
          </div>
          
          <div className="relative bg-card/50 border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder:text-foreground/30"
                  disabled={isTransactionPending}
                />
                <div className="text-sm text-foreground/60 mt-1">≈ $0.00</div>
              </div>
              
              <UnifiedTokenSelector
                selectedToken={fromToken}
                onTokenSelect={setFromToken}
                availableTokens={generateUnifiedTokens(true)}
                userAddress={address}
                label="Select token"
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-card border border-border/50 rounded-xl hover:bg-card/80 hover:border-defi-purple/50 transition-all duration-200 hover:scale-110 group"
            disabled={isTransactionPending}
          >
            {swapType === 'bridge' ? (
              <Repeat2 className="w-4 h-4 text-foreground/60 group-hover:text-defi-purple transition-colors" />
            ) : (
              <ArrowDown className="w-4 h-4 text-foreground/60 group-hover:text-defi-purple transition-colors" />
            )}
          </button>
        </div>

        {/* To Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/80">To</label>
            <div className="text-sm text-foreground/60">
              Balance: {toBalance ? formatTokenAmount(toBalance, toToken?.decimals || 18) : '0.00'}
            </div>
          </div>
          
          <div className="relative bg-card/50 border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="text-3xl font-semibold text-foreground/90">
                  {outputAmount > 0n && toToken
                    ? formatTokenAmount(outputAmount, toToken.decimals, 6)
                    : '0.00'
                  }
                </div>
                <div className="text-sm text-foreground/60 mt-1">≈ $0.00</div>
              </div>
              
              <UnifiedTokenSelector
                selectedToken={toToken}
                onTokenSelect={setToToken}
                availableTokens={generateUnifiedTokens(false)}
                userAddress={address}
                label="Select token"
                showReserves={swapType === 'unwrap'}
              />
            </div>
            
            {/* Additional info */}
            {swapType === 'unwrap' && toToken?.address && availableReserve && (
              <div className="mt-2 text-xs text-foreground/60">
                Available: {formatTokenAmount(availableReserve, toToken.decimals)} {toToken.symbol}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Button */}
        <button
          onClick={handleExecute}
          disabled={!validation.isValid || isTransactionPending}
          className={cn(
            "w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 text-lg",
            (!validation.isValid || isTransactionPending)
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "btn-defi text-white hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {/* Loading States */}
          {currentStatus === 'approving' && `Approving ${fromToken?.symbol}...`}
          {currentStatus === 'wrapping' && 'Wrapping...'}
          {currentStatus === 'redeeming' && 'Redeeming...'}
          {isBridging && 'Bridging...'}
          
          {/* Success States */}
          {currentStatus === 'confirmed' && 'Transaction Successful!'}
          
          {/* Error States */}
          {currentStatus === 'error' && 'Transaction Failed - Retry'}
          
          {/* Idle States */}
          {currentStatus === 'idle' && !fromToken && 'Select tokens'}
          {currentStatus === 'idle' && fromToken && !toToken && 'Select destination'}
          {currentStatus === 'idle' && fromToken && toToken && !amount && 'Enter amount'}
          {currentStatus === 'idle' && fromToken && toToken && amount && (
            needsApproval 
              ? `Approve & ${swapType === 'wrap' ? 'Wrap' : swapType === 'unwrap' ? 'Unwrap' : 'Bridge'}`
              : swapType === 'wrap' ? `Wrap ${fromToken.symbol}`
              : swapType === 'unwrap' ? 'Unwrap sovaBTC'
              : 'Bridge sovaBTC'
          )}
        </button>

        {/* Validation Error */}
        {!validation.isValid && validation.error && fromToken && toToken && amount && (
          <div className="text-sm text-red-400 text-center">
            {validation.error}
          </div>
        )}

        {/* Special Warnings */}
        {swapType === 'unwrap' && validation.isValid && amount && (
          <div className="text-sm text-yellow-400 text-center">
            ⚠️ Tokens will be available after 10-day delay
          </div>
        )}

        {swapType === 'bridge' && validation.isValid && amount && (
          <div className="text-sm text-blue-400 text-center">
            🌉 Cross-chain transfer may take 5-10 minutes
          </div>
        )}

        {/* Transaction Success */}
        {currentStatus === 'confirmed' && currentHash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="text-green-400 text-sm font-medium mb-2">
              ✅ {swapType.charAt(0).toUpperCase() + swapType.slice(1)} Successful!
            </div>
            <a
              href={getExplorerUrl(activeChainId, currentHash, 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-defi-purple hover:text-defi-pink transition-colors"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}

        {/* Error Display */}
        {currentError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-red-400 text-sm">
              {typeof currentError === 'string' ? currentError : currentError.message || 'Transaction failed'}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 