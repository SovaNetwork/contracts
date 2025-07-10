'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Coins,
  Plus,
  Minus,
  Settings,
  Info,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

import { useStaking, type StakingPool } from '@/hooks/web3/useStaking';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { getExplorerUrl } from '@/contracts/addresses';
import { cn } from '@/lib/utils';

interface StakingPoolCardProps {
  pool: StakingPool;
  className?: string;
}

export function StakingPoolCard({ pool, className }: StakingPoolCardProps) {
  const { address } = useAccount();
  const { activeChainId } = useActiveNetwork();
  
  // Component state
  const [isExpanded, setIsExpanded] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [lockTokens, setLockTokens] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'claim'>('stake');

  // Staking hooks
  const {
    executeStake,
    executeUnstake,
    executeClaim,
    executeApproval,
    validateStake,
    calculateAPR,
    usePendingRewards,
    useUserInfo,
    usePoolInfo,
    useTokenAllowance,
    useTokenBalance,
    overallStatus,
    isStaking,
    isUnstaking,
    isClaiming,
    isApproving,
    error,
    stakeHash,
    unstakeHash,
    claimHash,
  } = useStaking({ userAddress: address });

  // Get pool-specific data
  const { data: poolInfo } = usePoolInfo(pool.id);
  const { data: userInfo } = useUserInfo(pool.id);
  const { data: pendingRewards } = usePendingRewards(pool.id);
  const { data: tokenBalance } = useTokenBalance(pool.stakingToken);
  const { data: tokenAllowance } = useTokenAllowance(pool.stakingToken);

  // Calculate derived values
  const apr = useMemo(() => calculateAPR(pool), [pool, calculateAPR]);
  const lockMultiplier = useMemo(() => {
    if (!pool.multiplier || pool.multiplier === 10000n) return 1;
    return Number(pool.multiplier) / 10000;
  }, [pool.multiplier]);

  const lockPeriodDays = useMemo(() => {
    if (!pool.lockPeriod) return 0;
    return Number(pool.lockPeriod) / (24 * 3600);
  }, [pool.lockPeriod]);

  const userStakeAmount = useMemo(() => {
    if (!userInfo || !Array.isArray(userInfo)) return 0n;
    return userInfo[0] || 0n; // amount is first element
  }, [userInfo]);

  const userLockEndTime = useMemo(() => {
    if (!userInfo || !Array.isArray(userInfo)) return 0n;
    return userInfo[3] || 0n; // lockEndTime is fourth element
  }, [userInfo]);

  const isUserLocked = useMemo(() => {
    if (!userLockEndTime) return false;
    return Number(userLockEndTime) > Math.floor(Date.now() / 1000);
  }, [userLockEndTime]);

  const timeUntilUnlock = useMemo(() => {
    if (!isUserLocked) return 0;
    return Number(userLockEndTime) - Math.floor(Date.now() / 1000);
  }, [isUserLocked, userLockEndTime]);

  // Validation
  const stakeValidation = useMemo(() => {
    if (!stakeAmount || !tokenBalance) return { isValid: false, error: null };
    const amount = parseTokenAmount(stakeAmount, 18); // Assuming 18 decimals
    return validateStake(pool.id, amount, tokenBalance);
  }, [stakeAmount, tokenBalance, pool.id, validateStake]);

  const needsApproval = useMemo(() => {
    if (!stakeAmount || !tokenAllowance) return false;
    const amount = parseTokenAmount(stakeAmount, 18);
    return tokenAllowance < amount;
  }, [stakeAmount, tokenAllowance]);

  // Handlers
  const handleStake = async () => {
    if (!stakeValidation.isValid) return;
    
    try {
      const amount = parseTokenAmount(stakeAmount, 18);
      await executeStake(pool.id, amount, lockTokens);
      setStakeAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    
    try {
      const amount = parseTokenAmount(unstakeAmount, 18);
      await executeUnstake(pool.id, amount);
      setUnstakeAmount('');
    } catch (error) {
      console.error('Unstaking failed:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await executeClaim(pool.id);
    } catch (error) {
      console.error('Claiming failed:', error);
    }
  };

  const handleApproval = async () => {
    if (!stakeAmount) return;
    
    try {
      const amount = parseTokenAmount(stakeAmount, 18);
      await executeApproval(pool.stakingToken, amount);
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('defi-card p-6 space-y-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-defi-purple" />
            <h3 className="text-lg font-semibold">
              {pool.stakingTokenSymbol} → {pool.rewardTokenSymbol}
            </h3>
          </div>
          {pool.lockPeriod && pool.lockPeriod > 0n && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
              <Lock className="w-3 h-3" />
              <span>{lockPeriodDays}d lock</span>
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-background/50 rounded-lg transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {apr.toFixed(2)}%
          </div>
          <div className="text-xs text-foreground/60">APR</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {formatTokenAmount(pool.totalStaked, 18, 2)}
          </div>
          <div className="text-xs text-foreground/60">TVL</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {lockMultiplier.toFixed(1)}x
          </div>
          <div className="text-xs text-foreground/60">Multiplier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">
            {formatTokenAmount(pendingRewards || 0n, 18, 4)}
          </div>
          <div className="text-xs text-foreground/60">Rewards</div>
        </div>
      </div>

      {/* User Position */}
      {userStakeAmount && userStakeAmount > 0n && (
        <div className="p-4 bg-background/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Position</span>
            {isUserLocked && (
              <div className="flex items-center space-x-1 text-xs text-orange-400">
                <Lock className="w-3 h-3" />
                <span>Locked for {formatDuration(timeUntilUnlock)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Staked:</span>
            <span className="font-medium">{formatTokenAmount(userStakeAmount, 18, 4)} {pool.stakingTokenSymbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Rewards:</span>
            <span className="font-medium text-green-400">{formatTokenAmount(pendingRewards || 0n, 18, 4)} {pool.rewardTokenSymbol}</span>
          </div>
        </div>
      )}

      {/* Expanded Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Tab Navigation */}
            <div className="flex space-x-2 bg-background/30 rounded-lg p-2">
              {['stake', 'unstake', 'claim'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab
                      ? 'bg-defi-purple text-white'
                      : 'text-foreground/60 hover:text-foreground'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Stake Tab */}
                {activeTab === 'stake' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount to Stake</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple/50"
                        />
                        <button
                          onClick={() => setStakeAmount(formatTokenAmount(tokenBalance || 0n, 18, 18))}
                          className="px-3 py-2 bg-defi-purple/20 text-defi-purple rounded-lg hover:bg-defi-purple/30 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      <div className="flex justify-between text-xs text-foreground/60">
                        <span>Balance: {formatTokenAmount(tokenBalance || 0n, 18, 4)} {pool.stakingTokenSymbol}</span>
                        <span>≈ ${(Number(stakeAmount) * 1000).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Lock Options */}
                    {pool.lockPeriod && pool.lockPeriod > 0n && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={lockTokens}
                            onChange={(e) => setLockTokens(e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-border/50 bg-background/50 text-defi-purple focus:ring-2 focus:ring-defi-purple/50"
                          />
                          <span className="text-sm">Lock for {lockPeriodDays} days ({lockMultiplier.toFixed(1)}x rewards)</span>
                        </label>
                      </div>
                    )}

                    {/* Validation Message */}
                    {stakeAmount && !stakeValidation.isValid && stakeValidation.error && (
                      <div className="flex items-center space-x-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{stakeValidation.error}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="space-y-2">
                      {needsApproval ? (
                        <button
                          onClick={handleApproval}
                          disabled={isApproving || !stakeAmount}
                          className="w-full py-3 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
                        >
                          {isApproving ? 'Approving...' : 'Approve Token'}
                        </button>
                      ) : (
                        <button
                          onClick={handleStake}
                          disabled={isStaking || !stakeValidation.isValid || !stakeAmount}
                          className="w-full py-3 bg-gradient-to-r from-defi-purple to-defi-pink text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
                        >
                          {isStaking ? 'Staking...' : 'Stake Tokens'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Unstake Tab */}
                {activeTab === 'unstake' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount to Unstake</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple/50"
                        />
                        <button
                          onClick={() => setUnstakeAmount(formatTokenAmount(userStakeAmount, 18, 18))}
                          className="px-3 py-2 bg-defi-purple/20 text-defi-purple rounded-lg hover:bg-defi-purple/30 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      <div className="flex justify-between text-xs text-foreground/60">
                        <span>Staked: {formatTokenAmount(userStakeAmount, 18, 4)} {pool.stakingTokenSymbol}</span>
                      </div>
                    </div>

                    {/* Lock Warning */}
                    {isUserLocked && (
                      <div className="flex items-center space-x-2 text-orange-400 text-sm p-3 bg-orange-500/10 rounded-lg">
                        <Lock className="w-4 h-4" />
                        <span>Tokens are locked for {formatDuration(timeUntilUnlock)}</span>
                      </div>
                    )}

                    <button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !unstakeAmount || isUserLocked}
                      className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isUnstaking ? 'Unstaking...' : 'Unstake Tokens'}
                    </button>
                  </div>
                )}

                {/* Claim Tab */}
                {activeTab === 'claim' && (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-background/30 rounded-lg">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        {formatTokenAmount(pendingRewards || 0n, 18, 4)}
                      </div>
                      <div className="text-sm text-foreground/60">
                        {pool.rewardTokenSymbol} rewards available
                      </div>
                    </div>

                    <button
                      onClick={handleClaim}
                      disabled={isClaiming || !pendingRewards || pendingRewards === 0n}
                      className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Transaction Status */}
            {(stakeHash || unstakeHash || claimHash) && (
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Transaction submitted</span>
                  <a
                    href={getExplorerUrl(activeChainId, stakeHash || unstakeHash || claimHash || '', 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-500/10 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error.message}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 