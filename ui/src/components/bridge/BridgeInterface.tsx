'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ExternalLink, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import { NetworkBridge } from './NetworkBridge';
import { BridgeFeeEstimator } from './BridgeFeeEstimator';
import { CrossChainTransactionTracker } from './CrossChainTransactionTracker';
import { useBridgeTransaction } from '@/hooks/web3/useBridgeTransaction';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { getCrossChainSupportedChains, getChainConfig } from '@/contracts/addresses';
import { cn } from '@/lib/utils';
import { DestinationBalance } from './DestinationBalance';

interface BridgeInterfaceProps {
  className?: string;
}

export function BridgeInterface({ className }: BridgeInterfaceProps) {
  const { address } = useAccount();
  const walletChainId = useChainId(); // Direct wallet chain ID
  const { switchChain } = useSwitchChain(); // Direct switch function
  
  // Only show deployed networks with LayerZero support
  const supportedChains = getCrossChainSupportedChains();

  // Bridge state - manage independently of global network state
  const [amount, setAmount] = useState('');
  const initialSourceChain = supportedChains.find(chain => chain.chainId === walletChainId)?.chainId || supportedChains[0]?.chainId || 84532;
  const [sourceChainId, setSourceChainId] = useState<number>(initialSourceChain);
  const [destinationChainId, setDestinationChainId] = useState<number>();
  const [isReversed, setIsReversed] = useState(false);

  // Get sovaBTC address for the SOURCE chain (independent of global state)
  const sourceChainConfig = getChainConfig(sourceChainId);
  const sovaBTCAddress = sourceChainConfig?.contracts.sovaBTC;

  // Get sovaBTC balance on source chain
  const { balance: sourceBalance, refetch: refetchBalance } = useTokenBalance({
    tokenAddress: sovaBTCAddress || '0x0000000000000000000000000000000000000000',
    accountAddress: address,
    enabled: Boolean(sovaBTCAddress && address),
  });

  // Bridge transaction management
  const { 
    quoteFee, 
    executeBridge, 
    isQuoting, 
    isBridging, 
    isConfirmed, 
    bridgeHash, 
    bridgeError, 
    currentQuote,
  } = useBridgeTransaction();

  // Amount in wei
  const amountWei = useMemo(() => {
    if (!amount || Number(amount) <= 0) return 0n;
    try {
      return parseTokenAmount(amount, 8); // sovaBTC has 8 decimals
    } catch {
      return 0n;
    }
  }, [amount]);

  // Validation
  const validation = useMemo(() => {
    if (!amount || Number(amount) <= 0) {
      return { isValid: false, error: null };
    }
    if (!destinationChainId) {
      return { isValid: false, error: 'Please select destination network' };
    }
    if (sourceChainId === destinationChainId) {
      return { isValid: false, error: 'Source and destination cannot be the same' };
    }
    if (walletChainId !== sourceChainId) {
      return { isValid: false, error: `Please switch to ${getChainConfig(sourceChainId)?.name} to proceed` };
    }
    if (sourceBalance && amountWei > sourceBalance) {
      return { isValid: false, error: 'Insufficient sovaBTC balance' };
    }
    return { isValid: true, error: null };
  }, [amount, destinationChainId, sourceChainId, walletChainId, sourceBalance, amountWei]);

  // Reset on successful bridge
  useEffect(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        setAmount('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed]);

  // Handle network switching when user changes source
  const handleSourceChange = (newSourceChainId: number) => {
    setSourceChainId(newSourceChainId);
    
    // Auto-switch wallet to new source network
    if (newSourceChainId !== walletChainId) {
      console.log(`Switching wallet from ${walletChainId} to ${newSourceChainId}`);
      switchChain({ chainId: newSourceChainId });
    }
  };

  // Refetch balance when wallet switches to source chain
  useEffect(() => {
    if (sovaBTCAddress && address && walletChainId === sourceChainId) {
      console.log(`Wallet on correct network (${sourceChainId}), refetching balance...`);
      refetchBalance();
    }
  }, [walletChainId, sourceChainId, sovaBTCAddress, address, refetchBalance]);

  const handleReverse = () => {
    if (destinationChainId) {
      const newSource = destinationChainId;
      const newDestination = sourceChainId;
      setSourceChainId(newSource);
      setDestinationChainId(newDestination);
      setIsReversed(!isReversed);
    }
  };

  // Handle bridge execution
  const handleBridge = async () => {
    if (!address || !destinationChainId || !validation.isValid) return;

    try {
      await executeBridge({
        sourceChainId,
        destinationChainId,
        amount: amountWei,
        recipient: address,
      });
    } catch (error) {
      console.error('Bridge failed:', error);
    }
  };

  // Auto-quote fees when parameters change
  useEffect(() => {
    if (amount && destinationChainId && amountWei > 0n && sourceChainId !== destinationChainId) {
      quoteFee({
        sourceChainId,
        destinationChainId,
        amount: amountWei,
        recipient: address || '0x0000000000000000000000000000000000000000',
      }).catch(console.error);
    }
  }, [amount, sourceChainId, destinationChainId, amountWei, address, quoteFee]);

  const handleMaxAmount = () => {
    if (sourceBalance) {
      setAmount(formatTokenAmount(sourceBalance, 8));
    }
  };

  if (!address) {
    return (
      <div className={cn('max-w-lg mx-auto p-6', className)}>
        <div className="defi-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to start bridging sovaBTC across chains
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-lg mx-auto space-y-6', className)}>
      {/* Bridge Interface Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="defi-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold gradient-text">Bridge sovaBTC</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Transfer sovaBTC across different networks
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Network Bridge Selector */}
        <div className="space-y-4 mb-6">
          <div className="text-sm font-medium">From</div>
          <NetworkBridge
            sourceChainId={sourceChainId}
            destinationChainId={destinationChainId}
            onSourceChange={handleSourceChange}
            onDestinationChange={setDestinationChainId}
            onReverse={handleReverse}
            supportedChains={supportedChains.map(chain => chain.chainId)}
            isReversed={isReversed}
          />
          
          {/* Network Mismatch Warning */}
          {walletChainId !== sourceChainId && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Please switch your wallet to {getChainConfig(sourceChainId)?.name} to see your balance and proceed with the bridge.
              </span>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Amount</div>
            <div className="text-xs text-muted-foreground">
              Balance: {formatTokenAmount(sourceBalance || 0n, 8)} sovaBTC
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-lg font-medium focus:outline-none focus:border-primary transition-colors"
              disabled={isBridging}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <button
                onClick={handleMaxAmount}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                disabled={isBridging}
              >
                MAX
              </button>
              <div className="text-sm font-medium text-muted-foreground">sovaBTC</div>
            </div>
          </div>
        </div>

        {/* Fee Estimator */}
        {destinationChainId && amount && (
          <BridgeFeeEstimator
            sourceChainId={sourceChainId}
            destinationChainId={destinationChainId}
            amount={amountWei}
            isLoading={isQuoting}
            fee={currentQuote}
          />
        )}

        {/* Error Display */}
        {validation.error && (
          <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-600 rounded-lg mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">{validation.error}</span>
          </div>
        )}

        {/* Bridge Error */}
        {bridgeError && (
          <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-600 rounded-lg mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">{bridgeError}</span>
          </div>
        )}

        {/* Debug Section - Balance Checker */}
        {destinationChainId && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="text-sm font-medium text-slate-300 mb-3">🔍 Debug: Chain Balances</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {getChainConfig(sourceChainId)?.name}:
                </span>
                <span className="text-slate-200">
                  {formatTokenAmount(sourceBalance || 0n, 8)} sovaBTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {getChainConfig(destinationChainId)?.name}:
                </span>
                <span className="text-slate-200">
                  <DestinationBalance destinationChainId={destinationChainId} address={address} />
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-600">
                <div className="text-xs text-slate-400">
                  Contract addresses:
                </div>
                <div className="text-xs text-slate-500 break-all">
                  Source: {sovaBTCAddress}
                </div>
                <div className="text-xs text-slate-500 break-all">
                  Dest: {getChainConfig(destinationChainId)?.contracts.sovaBTC}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={!validation.isValid || isBridging || isQuoting}
          className={cn(
            'w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300',
            'bg-gradient-to-r from-defi-purple to-defi-pink',
            'hover:shadow-lg hover:shadow-purple-500/25',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'disabled:hover:shadow-none'
          )}
        >
          {isBridging ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Bridging...</span>
            </div>
          ) : isQuoting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Getting Quote...</span>
            </div>
          ) : (
            <span>Bridge sovaBTC</span>
          )}
        </button>

        {/* How Bridging Works Info */}
        {!bridgeHash && destinationChainId && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div className="text-sm text-blue-200">
                <span className="font-medium">How it works:</span> LayerZero will automatically burn your sovaBTC on {getChainConfig(sourceChainId)?.name} and mint the same amount on {getChainConfig(destinationChainId)?.name}. No manual claiming required.
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isConfirmed && bridgeHash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="font-medium text-green-300">Bridge Transaction Submitted!</span>
            </div>
            <p className="text-sm text-green-200 mb-3">
              Your sovaBTC will automatically appear on {getChainConfig(destinationChainId!)?.name} in 5-10 minutes. 
              No manual redemption required - LayerZero handles the cross-chain transfer automatically.
            </p>
            <a
              href={`${getChainConfig(sourceChainId)?.blockExplorers[0]?.url}/tx/${bridgeHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <span>View transaction</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        )}
      </motion.div>

      {/* Transaction Tracker */}
      {bridgeHash && destinationChainId && (
        <CrossChainTransactionTracker
          sourceChainId={sourceChainId}
          destinationChainId={destinationChainId}
          sourceTxHash={bridgeHash}
          status={isConfirmed ? 'completed' : isBridging ? 'processing' : 'pending'}
          amount={amountWei}
          tokenSymbol="sovaBTC"
        />
      )}


    </div>
  );
} 