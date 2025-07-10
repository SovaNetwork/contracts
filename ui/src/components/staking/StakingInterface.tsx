'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Coins, 
  TrendingUp, 
  Filter,
  Search,
  Grid,
  List,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useStaking } from '@/hooks/web3/useStaking';
import { StakingPoolCard } from './StakingPoolCard';
import { StakingAnalytics } from './StakingAnalytics';
import { cn } from '@/lib/utils';

type TabType = 'pools' | 'analytics' | 'positions';
type ViewType = 'grid' | 'list';
type FilterType = 'all' | 'active' | 'locked' | 'high-apy';

interface StakingInterfaceProps {
  className?: string;
}

export function StakingInterface({ className }: StakingInterfaceProps) {
  const { address, isConnected } = useAccount();
  
  // Component state
  const [activeTab, setActiveTab] = useState<TabType>('pools');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'apr' | 'tvl' | 'rewards'>('apr');
  const [showOnlyUserPools, setShowOnlyUserPools] = useState(false);

  // Staking hook
  const {
    stakingPools,
    poolLength,
    stakingAnalytics,
    overallStatus,
    isStaking,
    isUnstaking,
    isClaiming,
    error,
  } = useStaking({ userAddress: address });

  // Filter and sort pools
  const filteredPools = stakingPools.filter(pool => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!pool.stakingTokenSymbol?.toLowerCase().includes(search) && 
          !pool.rewardTokenSymbol?.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Type filter
    switch (filterType) {
      case 'active':
        return pool.totalStaked > 0n;
      case 'locked':
        return pool.lockPeriod && pool.lockPeriod > 0n;
      case 'high-apy':
        return (pool.apr || 0) > 50;
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case 'apr':
        return (b.apr || 0) - (a.apr || 0);
      case 'tvl':
        return Number(b.totalStaked) - Number(a.totalStaked);
      case 'rewards':
        return Number(b.rewardPerSecond) - Number(a.rewardPerSecond);
      default:
        return 0;
    }
  });

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Staking Hub</h1>
          <p className="text-foreground/60 mt-1">
            Stake sovaBTC and earn SOVA rewards with flexible lock periods
          </p>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-background/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-foreground/60">
              {poolLength} pools active
            </span>
          </div>
          
          {overallStatus !== 'idle' && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {overallStatus === 'staking' && 'Staking...'}
                {overallStatus === 'unstaking' && 'Unstaking...'}
                {overallStatus === 'claiming' && 'Claiming...'}
                {overallStatus === 'approving' && 'Approving...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Check */}
      {!isConnected && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="defi-card p-8 text-center"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-defi-purple/20 rounded-lg mx-auto mb-4">
            <Coins className="w-8 h-8 text-defi-purple" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-foreground/60 mb-6">
            Connect your wallet to start staking and earning SOVA rewards
          </p>
          <ConnectButton />
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 bg-background/30 rounded-lg p-2">
          {[
            { id: 'pools', label: 'Staking Pools', icon: Coins },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'positions', label: 'My Positions', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-defi-purple text-white'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* View Controls */}
        {activeTab === 'pools' && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-background/30 rounded-lg p-1">
              <button
                onClick={() => setViewType('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewType === 'grid' ? 'bg-defi-purple text-white' : 'text-foreground/60'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewType === 'list' ? 'bg-defi-purple text-white' : 'text-foreground/60'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search (for pools tab) */}
      {activeTab === 'pools' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/60" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple/50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple/50"
            >
              <option value="all">All Pools</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="high-apy">High APY</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'apr' | 'tvl' | 'rewards')}
              className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple/50"
            >
              <option value="apr">Sort by APR</option>
              <option value="tvl">Sort by TVL</option>
              <option value="rewards">Sort by Rewards</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="defi-card p-4 bg-red-500/10 border border-red-500/20"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            {error.message || 'An error occurred while processing your request'}
          </p>
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={tabVariants}
          transition={{ duration: 0.3 }}
        >
          {/* Pools Tab */}
          {activeTab === 'pools' && (
            <div className="space-y-6">
              {filteredPools.length === 0 ? (
                <div className="defi-card p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-foreground/10 rounded-lg mx-auto mb-4">
                    <Search className="w-8 h-8 text-foreground/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Pools Found</h3>
                  <p className="text-foreground/60">
                    {searchQuery ? 'Try adjusting your search terms' : 'No staking pools match your filters'}
                  </p>
                </div>
              ) : (
                <div className={cn(
                  viewType === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                )}>
                  {filteredPools.map((pool, index) => (
                    <motion.div
                      key={pool.id}
                      variants={itemVariants}
                      transition={{ delay: index * 0.1 }}
                    >
                      <StakingPoolCard
                        pool={pool}
                        className={viewType === 'list' ? 'w-full' : ''}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <StakingAnalytics />
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="defi-card p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-defi-purple/20 rounded-lg mx-auto mb-4">
                    <Activity className="w-8 h-8 text-defi-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                  <p className="text-foreground/60 mb-6">
                    Connect your wallet to view your staking positions
                  </p>
                  <ConnectButton />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User positions would be displayed here */}
                  <div className="defi-card p-8 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-lg mx-auto mb-4">
                      <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Your Staking Positions</h3>
                    <p className="text-foreground/60 mb-6">
                      Your active staking positions will appear here
                    </p>
                    <button
                      onClick={() => setActiveTab('pools')}
                      className="px-4 py-2 bg-defi-purple text-white rounded-lg hover:bg-defi-purple/90 transition-colors"
                    >
                      Start Staking
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Info */}
      <div className="defi-card p-4">
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Real-time staking data</span>
            </div>
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>SOVA rewards updated every block</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Powered by SovaBTC Protocol</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 