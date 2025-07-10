'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  ShieldOff, 
  Power, 
  PowerOff, 
  Clock, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Zap,
  AlertCircle,
  History,
  Settings
} from 'lucide-react';
import { useAdminOperations } from '@/hooks/web3/useAdminOperations';
import { getExplorerUrl } from '@/contracts/addresses';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { cn } from '@/lib/utils';

interface EmergencyActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'paused' | 'disabled';
  onToggle: () => void;
  isLoading: boolean;
  lastAction?: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

function EmergencyAction({ 
  title, 
  description, 
  icon, 
  status, 
  onToggle, 
  isLoading, 
  lastAction,
  riskLevel 
}: EmergencyActionProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'border-green-500/30 bg-green-500/5';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'high': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-red-400';
      case 'disabled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'paused': return <XCircle className="w-5 h-5" />;
      case 'disabled': return <Lock className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "defi-card p-6 border-2 hover:border-defi-purple/30 transition-all duration-300",
        getRiskColor(riskLevel)
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-black/20 rounded-lg">
            {icon}
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className="text-sm text-foreground/60 mb-2">{description}</p>
            
            <div className="flex items-center space-x-3 text-sm">
              <div className={cn("flex items-center space-x-1", getStatusColor(status))}>
                {getStatusIcon(status)}
                <span className="font-medium capitalize">{status}</span>
              </div>
              
              {lastAction && (
                <div className="flex items-center space-x-1 text-foreground/40">
                  <Clock className="w-4 h-4" />
                  <span>Last: {lastAction.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          disabled={isLoading || status === 'disabled'}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
            status === 'active' 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-green-600 hover:bg-green-700 text-white",
            (isLoading || status === 'disabled') && "opacity-50 cursor-not-allowed"
          )}
        >
          {status === 'active' ? (
            <>
              <PowerOff className="w-4 h-4" />
              <span>{isLoading ? 'Pausing...' : 'Pause'}</span>
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              <span>{isLoading ? 'Resuming...' : 'Resume'}</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

interface PauseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  isLoading: boolean;
}

function PauseConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  isLoading 
}: PauseConfirmationModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/50 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        
        <p className="text-foreground/60 mb-6">{description}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for Emergency Action
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the emergency situation..."
              className="w-full px-3 py-2 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple resize-none"
              rows={3}
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className={cn(
                "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition-all",
                "hover:bg-red-700 disabled:opacity-50"
              )}
            >
              {isLoading ? 'Confirming...' : 'Confirm Emergency Action'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function EmergencyControls() {
  const { 
    emergencyState, 
    pauseProtocol, 
    unpauseProtocol, 
    isLoading,
    error,
    hash
  } = useAdminOperations();
  
  const { activeChainId } = useActiveNetwork();
  const [showPauseModal, setShowPauseModal] = useState(false);

  const handlePause = async (reason: string) => {
    try {
      await pauseProtocol(reason);
      setShowPauseModal(false);
    } catch (error) {
      console.error('Failed to pause protocol:', error);
    }
  };

  const handleUnpause = async () => {
    try {
      await unpauseProtocol();
    } catch (error) {
      console.error('Failed to unpause protocol:', error);
    }
  };

  const protocolFunctions = [
    {
      id: 'wrapping',
      title: 'Token Wrapping',
      description: 'Allows users to wrap tokens into sovaBTC',
      icon: <Zap className="w-6 h-6 text-orange-400" />,
      status: emergencyState.isPaused ? 'paused' : 'active' as const,
      riskLevel: 'medium' as const,
      lastAction: emergencyState.lastPauseTime,
    },
    {
      id: 'bridging',
      title: 'Cross-Chain Bridging',
      description: 'LayerZero V2 cross-chain sovaBTC transfers',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      status: emergencyState.isPaused ? 'paused' : 'active' as const,
      riskLevel: 'high' as const,
      lastAction: emergencyState.lastPauseTime,
    },
    {
      id: 'redemption',
      title: 'Redemption Queue',
      description: 'Processing of redemption requests',
      icon: <History className="w-6 h-6 text-purple-400" />,
      status: emergencyState.isPaused ? 'paused' : 'active' as const,
      riskLevel: 'low' as const,
      lastAction: emergencyState.lastPauseTime,
    },
    {
      id: 'staking',
      title: 'Staking Operations',
      description: 'sovaBTC staking and reward distribution',
      icon: <Unlock className="w-6 h-6 text-green-400" />,
      status: emergencyState.isPaused ? 'paused' : 'active' as const,
      riskLevel: 'low' as const,
      lastAction: emergencyState.lastPauseTime,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Emergency Controls</h2>
          <p className="text-foreground/60 mt-1">
            Critical protocol functions and emergency pause controls
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg border-2",
            emergencyState.isPaused 
              ? "bg-red-500/10 border-red-500/20 text-red-400" 
              : "bg-green-500/10 border-green-500/20 text-green-400"
          )}>
            {emergencyState.isPaused ? (
              <>
                <ShieldOff className="w-5 h-5" />
                <span className="font-medium">Protocol Paused</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span className="font-medium">Protocol Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="defi-card p-6">
        <h3 className="text-lg font-bold mb-4">System Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground/60">Overall Status:</span>
              <span className={cn(
                "font-medium",
                emergencyState.isPaused ? "text-red-400" : "text-green-400"
              )}>
                {emergencyState.isPaused ? 'PAUSED' : 'OPERATIONAL'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-foreground/60">Paused Functions:</span>
              <span className="font-medium">
                {emergencyState.pausedFunctions.length}
              </span>
            </div>
            
            {emergencyState.lastPauseTime && (
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Last Pause:</span>
                <span className="font-medium">
                  {emergencyState.lastPauseTime.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {emergencyState.pauseReason && (
              <div>
                <span className="text-foreground/60 block mb-1">Pause Reason:</span>
                <p className="text-sm bg-card/50 p-2 rounded border border-border/30">
                  {emergencyState.pauseReason}
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-foreground/40" />
              <span className="text-sm text-foreground/60">
                Emergency controls require super admin privileges
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Functions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Protocol Functions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocolFunctions.map((func) => (
            <EmergencyAction
              key={func.id}
              title={func.title}
              description={func.description}
              icon={func.icon}
              status={func.status}
              onToggle={() => {
                if (func.status === 'active') {
                  setShowPauseModal(true);
                } else {
                  handleUnpause();
                }
              }}
              isLoading={isLoading}
              lastAction={func.lastAction}
              riskLevel={func.riskLevel}
            />
          ))}
        </div>
      </div>

      {/* Emergency Actions History */}
      <div className="defi-card p-6">
        <h3 className="text-lg font-bold mb-4">Recent Emergency Actions</h3>
        
        <div className="space-y-3">
          {emergencyState.lastPauseTime ? (
            <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Protocol Paused</p>
                  <p className="text-sm text-foreground/60">
                    {emergencyState.lastPauseTime.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {hash && (
                <a
                  href={getExplorerUrl(activeChainId, hash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-defi-purple hover:text-defi-pink transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/60">
              <Shield className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p>No emergency actions recorded</p>
              <p className="text-sm mt-1">Protocol has been running normally</p>
            </div>
          )}
        </div>
      </div>

      {/* Master Emergency Controls */}
      <div className="defi-card p-6 border-2 border-red-500/20 bg-red-500/5">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-bold text-red-400">Master Emergency Controls</h3>
        </div>
        
        <p className="text-foreground/60 mb-6">
          These controls affect the entire protocol and should only be used in critical situations.
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setShowPauseModal(true)}
            disabled={isLoading || emergencyState.isPaused}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all",
              "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            )}
          >
            <PowerOff className="w-5 h-5" />
            <span>{isLoading ? 'Pausing...' : 'Emergency Pause All'}</span>
          </button>
          
          <button
            onClick={handleUnpause}
            disabled={isLoading || !emergencyState.isPaused}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all",
              "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            )}
          >
            <Power className="w-5 h-5" />
            <span>{isLoading ? 'Resuming...' : 'Resume All Functions'}</span>
          </button>
        </div>
      </div>

      {/* Pause Confirmation Modal */}
      <PauseConfirmationModal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onConfirm={handlePause}
        title="Emergency Protocol Pause"
        description="This action will immediately pause all protocol functions. Users will not be able to wrap, bridge, or redeem tokens until the protocol is resumed."
        isLoading={isLoading}
      />

      {/* Error Display */}
      {error && (
        <div className="defi-card p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">
              {error?.message || 'An error occurred'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 