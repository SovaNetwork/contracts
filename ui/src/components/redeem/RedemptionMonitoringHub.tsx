'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  List, 
  Plus, 
  Settings,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { RedemptionQueueAnalytics } from './RedemptionQueueAnalytics';
import { BatchRedemptionManager } from './BatchRedemptionManager';
import { BidirectionalWrapInterface } from '../wrap/BidirectionalWrapInterface';
import { cn } from '@/lib/utils';

type TabType = 'analytics' | 'manage' | 'create';

interface RedemptionMonitoringHubProps {
  className?: string;
}

export function RedemptionMonitoringHub({ className }: RedemptionMonitoringHubProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const {
    pendingRedemptions,
    allRedemptions,
    redemptionCount,
    pendingCount,
    hasMultipleRedemptions,
  } = useTokenRedemption({
    userAddress: address,
  });

  const quickStats = {
    total: redemptionCount,
    pending: pendingCount,
    ready: pendingRedemptions.filter(r => {
      const now = Math.floor(Date.now() / 1000);
      const readyTime = Number(r.requestTime) + (10 * 24 * 3600);
      return now >= readyTime;
    }).length,
    completed: allRedemptions.filter(r => r.fulfilled).length,
  };

  const tabs = [
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Queue statistics and insights',
      badge: quickStats.total > 0 ? quickStats.total : null,
    },
    {
      id: 'manage' as TabType,
      label: 'Manage',
      icon: List,
      description: 'Batch redemption management',
      badge: quickStats.pending > 0 ? quickStats.pending : null,
    },
    {
      id: 'create' as TabType,
      label: 'Create',
      icon: Plus,
      description: 'New redemption request',
      badge: null,
    },
  ];

  const handleCreateRedemption = () => {
    setActiveTab('create');
    setShowCreateModal(true);
  };

  if (!isConnected) {
    return (
      <div className={cn('max-w-6xl mx-auto', className)}>
        <div className="defi-card p-8 text-center">
          <div className="mb-6">
            <Activity className="w-16 h-16 text-defi-purple mx-auto mb-4" />
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Redemption Monitoring Hub
            </h1>
            <p className="text-foreground/60">
              Advanced redemption queue analytics and management
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="defi-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center">
              <Activity className="w-8 h-8 mr-3" />
              Redemption Monitoring Hub
            </h1>
            <p className="text-foreground/60 mt-2">
              Advanced queue analytics, position tracking, and batch management
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateRedemption}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-defi-purple to-defi-pink text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Redemption</span>
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold">{quickStats.total}</div>
              <div className="text-xs text-foreground/60">Total Redemptions</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-bold">{quickStats.pending}</div>
              <div className="text-xs text-foreground/60">Pending</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-lg font-bold">{quickStats.ready}</div>
              <div className="text-xs text-foreground/60">Ready</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-bold">{quickStats.completed}</div>
              <div className="text-xs text-foreground/60">Completed</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-background/30 rounded-lg p-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 flex-1',
                activeTab === tab.id 
                  ? 'bg-defi-purple text-white shadow-lg' 
                  : 'text-foreground/60 hover:bg-background/50 hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <div className="flex-1 text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs opacity-80">{tab.description}</div>
              </div>
              {tab.badge && (
                <span className="bg-background/30 px-2 py-1 rounded-full text-xs font-medium">
                  {tab.badge}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'analytics' && (
            <RedemptionQueueAnalytics />
          )}
          
          {activeTab === 'manage' && (
            <BatchRedemptionManager 
              onNewRedemption={handleCreateRedemption}
            />
          )}
          
          {activeTab === 'create' && (
            <div className="defi-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">
                  Create New Redemption
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('manage')}
                  className="text-sm text-foreground/60 hover:text-foreground"
                >
                  View All Redemptions →
                </motion.button>
              </div>
              
              <div className="bg-background/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">
                    Multiple Redemptions Supported
                  </span>
                </div>
                <p className="text-sm text-foreground/60">
                  You can create unlimited redemptions. Each will receive a unique ID and 
                  enter the 10-day queue independently.
                </p>
              </div>
              
              {/* Embed the existing wrap interface for redemption */}
              <BidirectionalWrapInterface />
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
              <span>Real-time monitoring active</span>
            </div>
            <div>
              Queue updates every 10 seconds
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>10-day security delay</span>
          </div>
        </div>
      </div>
    </div>
  );
} 