'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  AlertCircle,
  Filter,
  CheckCircle,
  Timer,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { formatTokenAmount } from '@/lib/formatters';
import { getTokenByAddress, getExplorerUrl } from '@/contracts/addresses';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { cn } from '@/lib/utils';

interface BatchRedemptionManagerProps {
  className?: string;
  onNewRedemption?: () => void;
}

type FilterType = 'all' | 'pending' | 'ready' | 'completed';

export function BatchRedemptionManager({ className, onNewRedemption }: BatchRedemptionManagerProps) {
  const { address } = useAccount();
  const { activeChainId } = useActiveNetwork();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedRedemptions, setSelectedRedemptions] = useState<Set<string>>(new Set());
  
  const {
    allRedemptions,
    pendingRedemptions,
    executeRedemption,
    isRedeeming,
    error,
    redemptionHash,
  } = useTokenRedemption({
    userAddress: address,
  });

  // Calculate completion status for each redemption
  const redemptionsWithStatus = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const tenDaysInSeconds = 10 * 24 * 3600;
    
    return allRedemptions.map(redemption => {
      const requestTime = Number(redemption.requestTime);
      const completionTime = requestTime + tenDaysInSeconds;
      const timeRemaining = Math.max(0, completionTime - now);
      
      return {
        ...redemption,
        completionTime,
        timeRemaining,
        isReady: timeRemaining === 0 && !redemption.fulfilled,
        daysRemaining: Math.ceil(timeRemaining / 86400),
        hoursRemaining: Math.ceil((timeRemaining % 86400) / 3600),
        status: redemption.fulfilled ? 'completed' : (timeRemaining === 0 ? 'ready' : 'pending'),
      };
    });
  }, [allRedemptions]);

  // Filter redemptions based on selected filter
  const filteredRedemptions = useMemo(() => {
    switch (filter) {
      case 'pending':
        return redemptionsWithStatus.filter(r => r.status === 'pending');
      case 'ready':
        return redemptionsWithStatus.filter(r => r.status === 'ready');
      case 'completed':
        return redemptionsWithStatus.filter(r => r.status === 'completed');
      default:
        return redemptionsWithStatus;
    }
  }, [redemptionsWithStatus, filter]);

  const getTokenInfo = (tokenAddress: Address) => {
    return getTokenByAddress(tokenAddress) || {
      symbol: 'Unknown',
      decimals: 18,
      name: 'Unknown Token'
    };
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining <= 0) return 'Ready now';
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
      const selectableIds = filteredRedemptions
        .filter(r => !r.fulfilled)
        .map(r => r.id.toString());
      setSelectedRedemptions(new Set(selectableIds));
    } else {
      setSelectedRedemptions(new Set());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-orange-400 bg-orange-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-foreground/60 bg-background/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Timer className="w-4 h-4" />;
      case 'completed':
        return <Check className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filterCounts = useMemo(() => {
    return {
      all: redemptionsWithStatus.length,
      pending: redemptionsWithStatus.filter(r => r.status === 'pending').length,
      ready: redemptionsWithStatus.filter(r => r.status === 'ready').length,
      completed: redemptionsWithStatus.filter(r => r.status === 'completed').length,
    };
  }, [redemptionsWithStatus]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">
          Batch Redemption Manager
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewRedemption}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-defi-purple to-defi-pink text-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Redemption</span>
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-background/30 rounded-lg p-2">
        {[
          { key: 'all', label: 'All', count: filterCounts.all },
          { key: 'pending', label: 'Pending', count: filterCounts.pending },
          { key: 'ready', label: 'Ready', count: filterCounts.ready },
          { key: 'completed', label: 'Completed', count: filterCounts.completed },
        ].map(({ key, label, count }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(key as FilterType)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
              filter === key 
                ? 'bg-defi-purple text-white' 
                : 'text-foreground/60 hover:bg-background/50'
            )}
          >
            <span>{label}</span>
            <span className="text-xs bg-background/30 px-2 py-1 rounded-full">
              {count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Batch Actions */}
      <AnimatePresence>
        {selectedRedemptions.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="defi-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedRedemptions.size} redemption{selectedRedemptions.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedRedemptions(new Set())}
                  className="text-xs text-foreground/60 hover:text-foreground"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-sm">Cancel Selected</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redemption List */}
      <div className="defi-card p-6">
        {filteredRedemptions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground/60 mb-2">
              No redemptions found
            </p>
            <p className="text-sm text-foreground/40">
              {filter === 'all' 
                ? "You haven't created any redemptions yet"
                : `No ${filter} redemptions at this time`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedRedemptions.size === filteredRedemptions.filter(r => !r.fulfilled).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-border/50 bg-background/50 text-defi-purple focus:ring-2 focus:ring-defi-purple/50"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
              <div className="text-sm text-foreground/60">
                {filteredRedemptions.length} redemption{filteredRedemptions.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Redemption Items */}
            {filteredRedemptions.map((redemption, index) => {
              const tokenInfo = getTokenInfo(redemption.token as Address);
              const explorerUrl = getExplorerUrl(activeChainId, redemption.id.toString(), 'tx');
              
              return (
                <motion.div
                  key={redemption.id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-lg border transition-all duration-200',
                    selectedRedemptions.has(redemption.id.toString())
                      ? 'border-defi-purple bg-defi-purple/10'
                      : 'border-border/50 bg-background/30 hover:border-border/80'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {!redemption.fulfilled && (
                        <input
                          type="checkbox"
                          checked={selectedRedemptions.has(redemption.id.toString())}
                          onChange={(e) => handleSelectRedemption(redemption.id.toString(), e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-border/50 bg-background/50 text-defi-purple focus:ring-2 focus:ring-defi-purple/50"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium">
                            #{redemption.id.toString()}
                          </span>
                          <div className={cn(
                            'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(redemption.status)
                          )}>
                            {getStatusIcon(redemption.status)}
                            <span className="capitalize">{redemption.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-defi-purple" />
                            <span>{formatTokenAmount(redemption.sovaAmount, 8, 4)} sovaBTC</span>
                          </div>
                          <div className="text-foreground/60">→</div>
                          <div>
                            {formatTokenAmount(redemption.underlyingAmount, tokenInfo.decimals, 4)} {tokenInfo.symbol}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={cn(
                          'text-sm font-medium',
                          redemption.status === 'ready' ? 'text-green-400' : 'text-foreground'
                        )}>
                          {redemption.status === 'completed' 
                            ? 'Completed' 
                            : formatTimeRemaining(redemption.timeRemaining)}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {redemption.status === 'completed' ? 'Fulfilled' : 'Time remaining'}
                        </div>
                      </div>
                      
                      {explorerUrl && (
                        <motion.a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-foreground/60" />
                        </motion.a>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {redemption.status !== 'completed' && (
                    <div className="mt-3">
                      <div className="w-full bg-background/50 rounded-full h-2">
                        <div 
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            redemption.status === 'ready' 
                              ? 'bg-green-400' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          )}
                          style={{ 
                            width: redemption.status === 'ready' 
                              ? '100%' 
                              : `${Math.max(10, ((864000 - redemption.timeRemaining) / 864000) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 