'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Users, 
  Coins,
  Download,
  RefreshCw
} from 'lucide-react';
import { type Address } from 'viem';
import { motion } from 'framer-motion';

import { useCustodianOperations } from '@/hooks/web3/useCustodianOperations';
import { getExplorerUrl, getTokenByAddress } from '@/contracts/addresses';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type RedemptionWithStatus = {
  id: bigint;
  user: Address;
  token: Address;
  sovaAmount: bigint;
  underlyingAmount: bigint;
  requestTime: bigint;
  fulfilled: boolean;
  isReady: boolean;
  readyTime: number;
  tokenSymbol: string;
  tokenDecimals: number;
};

export function CustodianDashboard() {
  const { address, isConnected } = useAccount();
  const [selectedRedemptions, setSelectedRedemptions] = useState<Set<string>>(new Set());
  const [allRedemptions, setAllRedemptions] = useState<RedemptionWithStatus[]>([]);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);

  const {
    isCustodian,
    totalRedemptionCount,
    executeFulfillment,
    executeBatchFulfillment,
    useRedemptionById,
    useIsRedemptionReady,
    useAvailableReserve,
    overallStatus,
    isFulfilling,
    isFulfillmentConfirmed,
    error,
    fulfillmentHash,
  } = useCustodianOperations({ userAddress: address });

  // Function to load all redemptions
  const loadAllRedemptions = async () => {
    if (!totalRedemptionCount || totalRedemptionCount === 0) {
      setAllRedemptions([]);
      return;
    }

    setIsLoadingRedemptions(true);
    const redemptions: RedemptionWithStatus[] = [];

    // Note: In a real implementation, you'd want to batch these calls
    // For now, we'll load up to 50 recent redemptions
    const maxToLoad = Math.min(totalRedemptionCount, 50);
    const startId = Math.max(1, totalRedemptionCount - maxToLoad + 1);

    for (let i = startId; i <= totalRedemptionCount; i++) {
      try {
        // This is not ideal - we'd want to batch these in a real implementation
        // But for demonstration purposes, we'll load them individually
        const redemptionId = BigInt(i);
        
        // Get redemption data (this would need to be done differently in real implementation)
        // For now, we'll just create placeholder data
        const tokenInfo = getTokenByAddress('0x8dA7DE3D18747ba6b8A788Eb07dD40cD660eC860'); // Mock WBTC
        if (tokenInfo) {
          redemptions.push({
            id: redemptionId,
            user: '0x1234567890123456789012345678901234567890' as Address, // Placeholder
            token: tokenInfo.address as Address,
            sovaAmount: BigInt(100000000), // 1 sovaBTC
            underlyingAmount: BigInt(100000000), // 1 WBTC
            requestTime: BigInt(Math.floor(Date.now() / 1000) - (i * 3600)), // Staggered times
            fulfilled: false,
            isReady: Date.now() / 1000 > (Math.floor(Date.now() / 1000) - (i * 3600)) + (10 * 24 * 3600),
            readyTime: Math.floor(Date.now() / 1000) - (i * 3600) + (10 * 24 * 3600),
            tokenSymbol: tokenInfo.symbol,
            tokenDecimals: tokenInfo.decimals,
          });
        }
      } catch (error) {
        console.error(`Failed to load redemption ${i}:`, error);
      }
    }

    setAllRedemptions(redemptions);
    setIsLoadingRedemptions(false);
  };

  // Load redemptions when component mounts or count changes
  useEffect(() => {
    if (isCustodian && totalRedemptionCount > 0) {
      loadAllRedemptions();
    }
  }, [isCustodian, totalRedemptionCount]);

  // Filter pending and ready redemptions
  const pendingRedemptions = useMemo(() => {
    return allRedemptions.filter(r => !r.fulfilled);
  }, [allRedemptions]);

  const readyRedemptions = useMemo(() => {
    return pendingRedemptions.filter(r => r.isReady);
  }, [pendingRedemptions]);

  // Handle selection
  const handleSelectRedemption = (redemptionId: string, checked: boolean) => {
    const newSelected = new Set(selectedRedemptions);
    if (checked) {
      newSelected.add(redemptionId);
    } else {
      newSelected.delete(redemptionId);
    }
    setSelectedRedemptions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allReadyIds = readyRedemptions.map(r => r.id.toString());
      setSelectedRedemptions(new Set(allReadyIds));
    } else {
      setSelectedRedemptions(new Set());
    }
  };

  // Handle fulfillment
  const handleFulfillSingle = async (redemptionId: bigint) => {
    try {
      await executeFulfillment(redemptionId);
      // Reload redemptions after successful fulfillment
      setTimeout(() => loadAllRedemptions(), 2000);
    } catch (error) {
      console.error('Fulfillment failed:', error);
    }
  };

  const handleBatchFulfill = async () => {
    if (selectedRedemptions.size === 0) return;

    try {
      const redemptionIds = Array.from(selectedRedemptions).map(id => BigInt(id));
      await executeBatchFulfillment(redemptionIds);
      setSelectedRedemptions(new Set());
      // Reload redemptions after successful batch fulfillment
      setTimeout(() => loadAllRedemptions(), 2000);
    } catch (error) {
      console.error('Batch fulfillment failed:', error);
    }
  };

  // Authorization check
  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="defi-card p-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-4">Custodian Dashboard</h1>
          <p className="text-foreground/60 mb-6">Connect your wallet to access custodian functions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isCustodian) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="defi-card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
          <p className="text-foreground/60 mb-4">
            Your wallet address ({address}) is not authorized as a custodian.
          </p>
          <p className="text-sm text-foreground/40">
            Contact the protocol administrator to request custodian access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="defi-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Custodian Dashboard</h1>
            <p className="text-foreground/60">Manage protocol redemptions and custody operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadAllRedemptions}
              disabled={isLoadingRedemptions}
              className="flex items-center space-x-2 px-4 py-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingRedemptions && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold">{pendingRedemptions.length}</div>
              <div className="text-sm text-foreground/60">Pending</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{readyRedemptions.length}</div>
              <div className="text-sm text-foreground/60">Ready to Fulfill</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">
                {new Set(pendingRedemptions.map(r => r.user)).size}
              </div>
              <div className="text-sm text-foreground/60">Unique Users</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Coins className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold">{selectedRedemptions.size}</div>
              <div className="text-sm text-foreground/60">Selected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {readyRedemptions.length > 0 && (
        <div className="defi-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedRedemptions.size === readyRedemptions.length && readyRedemptions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 bg-card"
                />
                <span className="text-sm">Select All Ready ({readyRedemptions.length})</span>
              </label>
            </div>
            
            <button
              onClick={handleBatchFulfill}
              disabled={selectedRedemptions.size === 0 || isFulfilling}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
                selectedRedemptions.size === 0 || isFulfilling
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "btn-defi text-white hover:scale-105"
              )}
            >
              <Download className="w-4 h-4" />
              <span>
                {isFulfilling 
                  ? 'Processing...' 
                  : `Batch Fulfill (${selectedRedemptions.size})`
                }
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Redemptions List */}
      <div className="defi-card p-6">
        <h2 className="text-xl font-bold mb-4">Pending Redemptions</h2>
        
        {isLoadingRedemptions ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-defi-purple" />
            <p className="text-foreground/60">Loading redemptions...</p>
          </div>
        ) : pendingRedemptions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">All Caught Up!</p>
            <p className="text-foreground/60">No pending redemptions at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRedemptions.map((redemption) => (
              <motion.div
                key={redemption.id.toString()}
                className={cn(
                  "border rounded-lg p-4 transition-all",
                  redemption.isReady 
                    ? "border-green-500/50 bg-green-500/5" 
                    : "border-border/50 bg-card/50"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {redemption.isReady && (
                      <input
                        type="checkbox"
                        checked={selectedRedemptions.has(redemption.id.toString())}
                        onChange={(e) => handleSelectRedemption(redemption.id.toString(), e.target.checked)}
                        className="w-4 h-4 rounded border-border/50 bg-card"
                      />
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-sm">#{redemption.id.toString()}</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          redemption.isReady 
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {redemption.isReady ? 'Ready' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-foreground/60">
                        User: {redemption.user.slice(0, 6)}...{redemption.user.slice(-4)}
                      </div>
                      
                      <div className="text-sm">
                        {formatTokenAmount(redemption.sovaAmount, 8)} sovaBTC → {' '}
                        {formatTokenAmount(redemption.underlyingAmount, redemption.tokenDecimals)} {redemption.tokenSymbol}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {redemption.isReady ? (
                      <button
                        onClick={() => handleFulfillSingle(redemption.id)}
                        disabled={isFulfilling}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Fulfill
                      </button>
                    ) : (
                      <div className="text-sm text-foreground/60">
                        Ready in {Math.max(0, Math.ceil((redemption.readyTime - Date.now() / 1000) / 86400))} days
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Status */}
      {overallStatus === 'confirmed' && fulfillmentHash && (
        <div className="defi-card p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Fulfillment Successful!</span>
            </div>
            <a
              href={getExplorerUrl(fulfillmentHash, 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-defi-purple hover:text-defi-pink transition-colors"
            >
              <span>View Transaction</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="defi-card p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">
              {error?.message || 'Transaction failed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 