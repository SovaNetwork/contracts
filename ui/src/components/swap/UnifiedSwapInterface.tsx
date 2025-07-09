'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowUpDown, Settings, Zap, Info, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Address } from 'viem';

import { UnifiedTokenSelector } from './UnifiedTokenSelector';
import { SwapRouteDisplay } from './SwapRouteDisplay';
import { NetworkAwareAmountInput } from './NetworkAwareAmountInput';
import { UnifiedTransactionFlow } from './UnifiedTransactionFlow';
import { useNetworkAwareTokenState } from '@/hooks/web3/useNetworkAwareTokenState';
import { useBridgeTransaction } from '@/hooks/web3/useBridgeTransaction';
import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { getChainConfig, getExplorerUrl } from '@/contracts/addresses';
import { cn } from '@/lib/utils';

// Types for unified token interface
export type UnifiedToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: {
    chainId: number;
    name: string;
    layerZeroEndpointId: number;
  };
  logo?: string;
  balance?: bigint;
  usdValue?: number;
  isNative?: boolean;
  isSovaBTC?: boolean;
  canWrap?: boolean;
  canBridge?: boolean;
  canStake?: boolean;
  canRedeem?: boolean;
};

export type SwapOperation = 'wrap' | 'bridge' | 'unwrap' | null;

export function UnifiedSwapInterface() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Fix hydration mismatch by ensuring client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Network-aware token state (simplified)
  const {
    allTokens,
    triggerRefresh,
  } = useNetworkAwareTokenState();

  // Individual sovaBTC balance tracking for portfolio display
  const { balance: baseSovaBTCBalance } = useTokenBalance({
    tokenAddress: allTokens.find(t => t.isSovaBTC && t.network.chainId === 84532)?.address as Address,
    accountAddress: address,
    enabled: Boolean(address),
  });

  const { balance: optimismSovaBTCBalance } = useTokenBalance({
    tokenAddress: allTokens.find(t => t.isSovaBTC && t.network.chainId === 11155420)?.address as Address,
    accountAddress: address,
    enabled: Boolean(address),
  });

  // Create sovaBTC balances array for portfolio display
  const sovaBTCBalances = useMemo(() => {
    const balances = [];
    
    if (baseSovaBTCBalance && baseSovaBTCBalance > 0n) {
      balances.push({
        network: 'Base Sepolia',
        chainId: 84532,
        balance: baseSovaBTCBalance,
      });
    }
    
    if (optimismSovaBTCBalance && optimismSovaBTCBalance > 0n) {
      balances.push({
        network: 'Optimism Sepolia', 
        chainId: 11155420,
        balance: optimismSovaBTCBalance,
      });
    }
    
    return balances;
  }, [baseSovaBTCBalance, optimismSovaBTCBalance]);

  // Token selection state
  const [fromToken, setFromToken] = useState<UnifiedToken | null>(null);
  const [toToken, setToToken] = useState<UnifiedToken | null>(null);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5'); // Default 0.5%
  const [showSettings, setShowSettings] = useState(false);
  
  // Transaction flow state
  const [showTransactionFlow, setShowTransactionFlow] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  // Transaction execution hooks
  const bridgeHook = useBridgeTransaction();
  const wrapHook = useTokenWrapping({ userAddress: address });
  const redemptionHook = useTokenRedemption({ userAddress: address });

  // Get token balances for selected tokens
  const { balance: fromTokenBalance } = useTokenBalance({
    tokenAddress: fromToken?.address as Address,
    accountAddress: address,
    enabled: Boolean(fromToken && address),
  });

  const { balance: toTokenBalance } = useTokenBalance({
    tokenAddress: toToken?.address as Address,
    accountAddress: address,
    enabled: Boolean(toToken && address),
  });

  // Get token allowances for wrapping
  const { data: fromTokenAllowance } = wrapHook.useTokenAllowance(fromToken?.address as Address);

  // Intelligent operation detection
  const detectedOperation: SwapOperation = useMemo(() => {
    if (!fromToken || !toToken) return null;

    // If wrapping to sovaBTC on same network
    if (!fromToken.isSovaBTC && toToken.isSovaBTC && 
        fromToken.network.chainId === toToken.network.chainId) {
      return 'wrap';
    }

    // If unwrapping from sovaBTC on same network
    if (fromToken.isSovaBTC && !toToken.isSovaBTC && 
        fromToken.network.chainId === toToken.network.chainId) {
      return 'unwrap';
    }

    // If bridging sovaBTC across networks
    if (fromToken.isSovaBTC && toToken.isSovaBTC && 
        fromToken.network.chainId !== toToken.network.chainId) {
      return 'bridge';
    }

    return null;
  }, [fromToken, toToken]);

  // Amount in wei
  const amountWei = useMemo(() => {
    if (!amount || Number(amount) <= 0 || !fromToken) return 0n;
    try {
      return parseTokenAmount(amount, fromToken.decimals);
    } catch {
      return 0n;
    }
  }, [amount, fromToken]);

  // Set intelligent default token pairs based on current network
  useEffect(() => {
    if (allTokens.length > 0 && !fromToken && !toToken) {
      // Set defaults based on current network
      if (chainId === 84532) { // Base Sepolia
        const wbtc = allTokens.find(t => t.symbol === 'WBTC' && t.network.chainId === 84532);
        const sovaBTC = allTokens.find(t => t.isSovaBTC && t.network.chainId === 84532);
        if (wbtc && sovaBTC) {
          setFromToken(wbtc);
          setToToken(sovaBTC);
        }
      } else if (chainId === 11155420) { // Optimism Sepolia
        const sovaBTCOp = allTokens.find(t => t.isSovaBTC && t.network.chainId === 11155420);
        const sovaBTCBase = allTokens.find(t => t.isSovaBTC && t.network.chainId === 84532);
        if (sovaBTCOp && sovaBTCBase) {
          setFromToken(sovaBTCOp);
          setToToken(sovaBTCBase);
        }
      }
      // Add more network defaults as needed
    }
  }, [allTokens, chainId, fromToken, toToken]);

  // Auto-suggest toToken based on fromToken selection
  useEffect(() => {
    if (fromToken && !toToken) {
      // If user selects a non-sovaBTC token, suggest sovaBTC on same network
      if (!fromToken.isSovaBTC && fromToken.canWrap) {
        const sovaBTCOnSameNetwork = allTokens.find(token => 
          token.isSovaBTC && token.network.chainId === fromToken.network.chainId
        );
        if (sovaBTCOnSameNetwork) {
          setToToken(sovaBTCOnSameNetwork);
        }
      }
      
      // If user selects sovaBTC, suggest most popular bridge destination
      if (fromToken.isSovaBTC) {
        const otherNetworkSovaBTC = allTokens.find(token => 
          token.isSovaBTC && token.network.chainId !== fromToken.network.chainId &&
          token.network.chainId === 11155420 // Prefer Optimism Sepolia
        );
        if (otherNetworkSovaBTC) {
          setToToken(otherNetworkSovaBTC);
        }
      }
    }
  }, [fromToken, toToken, allTokens]);

  // Token reversal
  const handleReverse = () => {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
      setAmount(''); // Reset amount on reverse
    }
  };

  // Network switching for source token
  const handleNetworkSwitch = async () => {
    if (fromToken && chainId !== fromToken.network.chainId) {
      try {
        await switchChain({ chainId: fromToken.network.chainId });
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  // Validation logic
  const validation = useMemo(() => {
    if (!fromToken || !toToken) {
      return { isValid: false, error: null };
    }

    if (!amount || Number(amount) <= 0) {
      return { isValid: false, error: null };
    }

    if (!detectedOperation) {
      return { isValid: false, error: 'Invalid token pair - no operation detected' };
    }

    if (chainId !== fromToken.network.chainId) {
      return { isValid: false, error: `Switch to ${fromToken.network.name} to proceed` };
    }

    if (fromTokenBalance && amountWei > fromTokenBalance) {
      return { isValid: false, error: 'Insufficient balance' };
    }

    // Specific validations per operation
    switch (detectedOperation) {
      case 'wrap':
        const wrapValidation = wrapHook.validateWrap(
          fromToken.address as Address, 
          amountWei, 
          fromToken.decimals
        );
        if (!wrapValidation.isValid) {
          return { isValid: false, error: wrapValidation.error };
        }
        break;

      case 'bridge':
        if (fromToken.network.chainId === toToken.network.chainId) {
          return { isValid: false, error: 'Source and destination networks must be different' };
        }
        break;

      case 'unwrap':
        // Add redemption-specific validation here if needed
        break;
    }

    return { isValid: true, error: null };
  }, [fromToken, toToken, amount, detectedOperation, chainId, fromTokenBalance, amountWei, wrapHook]);



  // Check if approval is needed for wrapping
  const needsApproval = useMemo(() => {
    if (detectedOperation !== 'wrap' || !fromTokenAllowance || !amountWei) return false;
    return fromTokenAllowance < amountWei;
  }, [detectedOperation, fromTokenAllowance, amountWei]);

  // Show transaction flow modal
  const handleExecuteTransaction = async () => {
    if (!fromToken || !toToken || !address || !validation.isValid) return;
    setShowTransactionFlow(true);
  };

  // Handle transaction success
  const handleTransactionSuccess = (txHash: string) => {
    setTransactionSuccess(true);
    setCompletedTxHash(txHash);
    
    // Refresh balances after transaction
    setTimeout(() => {
      triggerRefresh();
    }, 2000);
  };

  // Handle transaction error
  const handleTransactionError = (error: string) => {
    console.error('Transaction failed:', error);
  };

  // Handle transaction flow reset
  const handleTransactionReset = () => {
    setShowTransactionFlow(false);
    setTransactionSuccess(false);
    setCompletedTxHash(null);
    setAmount('');
  };



  // Prevent hydration mismatch by showing loading state until mounted
  if (!isMounted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="defi-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-4">Loading...</h3>
          <p className="text-muted-foreground">
            Initializing swap interface
          </p>
        </div>
      </div>
    );
  }

  // Connect wallet prompt
  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="defi-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to start swapping Bitcoin-backed tokens and bridging across networks
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Main Grid Layout: Token Selection (Left) | Transaction Flow (Right) */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: Token Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Token Selection Card with Header */}
          <div className="defi-card p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold gradient-text">Universal Swap</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Wrap, bridge, and swap in one interface
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-background/60 hover:bg-background transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
                  <ArrowUpDown className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-background/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slippage Tolerance</span>
                  <div className="flex items-center space-x-2">
                    {['0.1', '0.5', '1.0'].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={cn(
                          "px-3 py-1 text-xs rounded-md transition-colors",
                          slippage === value 
                            ? "bg-defi-purple text-white" 
                            : "bg-background/60 hover:bg-background"
                        )}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      type="text"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="w-16 px-2 py-1 text-xs bg-background rounded-md text-center"
                      placeholder="0.5"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {/* From Token Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">From</span>
                {fromToken && fromTokenBalance && (
                  <span className="text-muted-foreground">
                    Balance: {formatTokenAmount(fromTokenBalance, fromToken.decimals, 4)}
                  </span>
                )}
              </div>
              <UnifiedTokenSelector
                selectedToken={fromToken}
                onTokenSelect={setFromToken}
                mode="from"
                excludeToken={toToken}
                userAddress={address}
              />
            </div>

            {/* Reverse Button */}
            <div className="flex justify-center">
              <button
                onClick={handleReverse}
                disabled={!fromToken || !toToken}
                className="p-3 rounded-full bg-background border-2 border-border hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ArrowUpDown className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              </button>
            </div>

            {/* To Token Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">To</span>
                {toToken && toTokenBalance && (
                  <span className="text-muted-foreground">
                    Balance: {formatTokenAmount(toTokenBalance, toToken.decimals, 4)}
                  </span>
                )}
              </div>
              <UnifiedTokenSelector
                selectedToken={toToken}
                onTokenSelect={setToToken}
                mode="to"
                excludeToken={fromToken}
                userAddress={address}
                sourceToken={fromToken} // For intelligent suggestions
              />
            </div>

            {/* Amount Input */}
            {fromToken && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Amount</span>
                  <span className="text-muted-foreground">
                    {fromToken.symbol}
                  </span>
                </div>
                <div className="p-4 bg-background/30 rounded-lg">
                  <NetworkAwareAmountInput
                    token={fromToken}
                    amount={amount}
                    onAmountChange={setAmount}
                    placeholder="0.00"
                    disabled={!fromToken}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT SIDE: Transaction Flow & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Transaction Actions Card */}
          <div className="defi-card p-6 space-y-6">
            {/* Network Mismatch Warning */}
            {fromToken && chainId !== fromToken.network.chainId && (
              <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">
                    Switch to {fromToken.network.name} to proceed
                  </span>
                </div>
                <button
                  onClick={handleNetworkSwitch}
                  className="text-xs font-medium px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
                >
                  Switch Network
                </button>
              </div>
            )}

            {/* Operation Detection & Route Display - Collapsible */}
            <AnimatePresence mode="wait">
              {detectedOperation && fromToken && toToken && !showTransactionFlow && (
                <motion.div
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <SwapRouteDisplay
                    operation={detectedOperation}
                    fromToken={fromToken}
                    toToken={toToken}
                    amount={amount}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transaction Error */}
            {validation.error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{validation.error}</span>
              </div>
            )}

            {/* Action Button */}
            {!showTransactionFlow && (
              <button
                onClick={handleExecuteTransaction}
                disabled={!validation.isValid}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 text-lg',
                  validation.isValid
                    ? 'btn-defi text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                )}
              >
                {!fromToken || !toToken ? 'Select tokens' :
                 !amount ? 'Enter amount' :
                 !validation.isValid ? 'Invalid input' :
                 detectedOperation === 'wrap' && needsApproval ? `Approve & Wrap ${fromToken.symbol}` :
                 detectedOperation === 'wrap' ? `Wrap ${fromToken.symbol}` :
                 detectedOperation === 'bridge' ? `Bridge to ${toToken.network.name}` :
                 detectedOperation === 'unwrap' ? `Unwrap to ${toToken.symbol}` :
                 'Execute Transaction'}
              </button>
            )}

            {/* Transaction Success Message */}
            {transactionSuccess && completedTxHash && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-900/20 border border-green-600 rounded-lg text-center"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-green-300">Transaction Successful!</span>
                </div>
                <p className="text-sm text-green-200 mb-3">
                  {detectedOperation === 'bridge' && 'Cross-chain transfer completed successfully'}
                  {detectedOperation === 'unwrap' && 'Redemption has been queued for 10 days'}
                  {detectedOperation === 'wrap' && 'Tokens have been wrapped successfully'}
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <a
                    href={getExplorerUrl(chainId, completedTxHash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    <span>View Transaction</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleTransactionReset}
                    className="text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    New Transaction
                  </button>
                </div>
              </motion.div>
            )}

            {/* Operation Info - Collapsible */}
            <AnimatePresence mode="wait">
              {detectedOperation && fromToken && toToken && !showTransactionFlow && (
                <motion.div
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-200">
                        {detectedOperation === 'wrap' && (
                          <>
                            <span className="font-medium">Token Wrapping:</span> Convert {fromToken.symbol} to sovaBTC 
                            on {fromToken.network.name} with automatic decimal conversion.
                          </>
                        )}
                        {detectedOperation === 'bridge' && (
                          <>
                            <span className="font-medium">Cross-Chain Bridge:</span> Transfer sovaBTC from {fromToken.network.name} 
                            to {toToken.network.name} using LayerZero V2 infrastructure.
                          </>
                        )}
                        {detectedOperation === 'unwrap' && (
                          <>
                            <span className="font-medium">Token Unwrapping:</span> Redeem sovaBTC for {toToken.symbol} 
                            through the 10-day redemption queue system.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transaction Flow */}
            {showTransactionFlow && detectedOperation && fromToken && toToken && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold gradient-text">Transaction Details</h3>
                  <button
                    onClick={() => setShowTransactionFlow(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                
                <UnifiedTransactionFlow
                  operation={detectedOperation}
                  fromToken={fromToken}
                  toToken={toToken}
                  amount={amountWei}
                  onSuccess={handleTransactionSuccess}
                  onError={handleTransactionError}
                  onReset={handleTransactionReset}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* BOTTOM SECTION: Portfolio Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="defi-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 gradient-text">Portfolio Overview</h3>
        <div className="space-y-3">
          {/* SovaBTC balances across networks */}
          {sovaBTCBalances.length > 0 ? (
            sovaBTCBalances.map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
                    <span className="text-xs font-bold text-white">S</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">sovaBTC</div>
                    <div className="text-xs text-muted-foreground">on {balance.network}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatTokenAmount(balance.balance, 8, 4)}
                  </div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No sovaBTC balance found. Start by wrapping some tokens!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 