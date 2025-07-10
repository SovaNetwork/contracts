'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  ArrowRight, 
  Copy, 
  ExternalLink,
  CheckCircle,
  Crown,
  Settings
} from 'lucide-react';
import { type Address, isAddress } from 'viem';
import { useWhitelistOwnership, useMultiNetworkOwnership } from '@/hooks/web3/useWhitelistOwnership';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { getExplorerUrl } from '@/contracts/addresses';
import { cn } from '@/lib/utils';

interface OwnershipCardProps {
  networkName: string;
  chainId: number;
  owner: Address | null;
  contractAddress: Address;
  isCurrentNetwork: boolean;
  onTransferOwnership?: (newOwner: Address) => void;
  isTransferring?: boolean;
}

function OwnershipCard({ 
  networkName, 
  chainId, 
  owner, 
  contractAddress, 
  isCurrentNetwork,
  onTransferOwnership,
  isTransferring 
}: OwnershipCardProps) {
  const { activeChainId } = useActiveNetwork();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [error, setError] = useState('');

  const handleTransfer = () => {
    setError('');
    
    if (!isAddress(newOwnerAddress)) {
      setError('Invalid address format');
      return;
    }

    if (onTransferOwnership) {
      onTransferOwnership(newOwnerAddress as Address);
      setShowTransferForm(false);
      setNewOwnerAddress('');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "defi-card p-6 border-2 transition-all duration-300",
        isCurrentNetwork ? "border-defi-purple/50 bg-defi-purple/5" : "border-border/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            isCurrentNetwork ? "bg-defi-purple/20" : "bg-card/50"
          )}>
            <Crown className={cn(
              "w-5 h-5",
              isCurrentNetwork ? "text-defi-purple" : "text-foreground/60"
            )} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{networkName}</h3>
            <p className="text-sm text-foreground/60">Chain ID: {chainId}</p>
          </div>
        </div>
        
        {isCurrentNetwork && (
          <div className="px-2 py-1 bg-defi-purple/20 text-defi-purple rounded text-xs font-medium">
            Active
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/60">Contract Address</label>
          <div className="flex items-center space-x-2 mt-1">
            <code className="text-sm bg-card/50 px-2 py-1 rounded font-mono">
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </code>
            <button
              onClick={() => copyAddress(contractAddress)}
              className="p-1 hover:bg-card/80 rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={getExplorerUrl(chainId, contractAddress, 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-card/80 rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground/60">Current Owner</label>
          {owner ? (
            <div className="flex items-center space-x-2 mt-1">
              <code className="text-sm bg-card/50 px-2 py-1 rounded font-mono">
                {owner.slice(0, 6)}...{owner.slice(-4)}
              </code>
              <button
                onClick={() => copyAddress(owner)}
                className="p-1 hover:bg-card/80 rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={getExplorerUrl(chainId, owner, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-card/80 rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-foreground/40 mt-1">Loading...</p>
          )}
        </div>

        {isCurrentNetwork && onTransferOwnership && (
          <div className="pt-4 border-t border-border/30">
            {!showTransferForm ? (
              <button
                onClick={() => setShowTransferForm(true)}
                disabled={isTransferring}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Transfer Ownership</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Owner Address
                  </label>
                  <input
                    type="text"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="0x..."
                    className={cn(
                      "w-full px-3 py-2 bg-card border border-border/50 rounded-lg font-mono text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-defi-purple",
                      error && "border-red-500"
                    )}
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !newOwnerAddress}
                    className={cn(
                      "flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium transition-all",
                      "hover:bg-green-700 disabled:opacity-50"
                    )}
                  >
                    {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowTransferForm(false);
                      setNewOwnerAddress('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function WhitelistOwnership() {
  const { activeChainId } = useActiveNetwork();
  const { 
    currentOwner, 
    isCurrentUserOwner, 
    isLoading, 
    error,
    transferOwnership,
    isTransferring,
    transferHash,
    transferSuccess 
  } = useWhitelistOwnership();
  
  const multiNetworkData = useMultiNetworkOwnership();

  const handleTransferOwnership = async (newOwner: Address) => {
    try {
      await transferOwnership(newOwner);
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Whitelist Ownership</h2>
          <p className="text-foreground/60 mt-1">
            Manage TokenWhitelist contract ownership across networks
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg border-2",
            isCurrentUserOwner 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {isCurrentUserOwner ? (
              <>
                <UserCheck className="w-5 h-5" />
                <span className="font-medium">You are Owner</span>
              </>
            ) : (
              <>
                <UserX className="w-5 h-5" />
                <span className="font-medium">Not Owner</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ownership Status Alert */}
      {!isCurrentUserOwner && (
        <div className="defi-card p-6 bg-red-500/10 border-red-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2">Insufficient Permissions</h3>
              <p className="text-foreground/80 mb-3">
                Your wallet address is not the owner of the TokenWhitelist contract. 
                You need ownership to add or remove tokens from the whitelist.
              </p>
              <div className="text-sm text-foreground/60">
                <p><strong>Your Address:</strong> {currentOwner || 'Not connected'}</p>
                <p><strong>Contract Owner:</strong> {currentOwner || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Network Ownership */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Network Ownership Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {multiNetworkData.map((networkData) => (
            <OwnershipCard
              key={networkData.chainId}
              networkName={networkData.networkName}
              chainId={networkData.chainId}
              owner={networkData.owner}
              contractAddress={networkData.contractAddress}
              isCurrentNetwork={networkData.chainId === activeChainId}
              onTransferOwnership={networkData.chainId === activeChainId ? handleTransferOwnership : undefined}
              isTransferring={isTransferring}
            />
          ))}
        </div>
      </div>

      {/* Admin Wallet Setup Instructions */}
      <div className="defi-card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Setup Instructions</span>
        </h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-foreground/80 mb-2">To grant admin access:</h4>
            <ol className="list-decimal list-inside space-y-2 text-foreground/60">
              <li>The current contract owner must transfer ownership to your admin wallet</li>
              <li>Use the "Transfer Ownership" button above (if you're the current owner)</li>
              <li>Set the new owner to: <code className="bg-card/50 px-1 rounded">0x6182051f545E673b54119800126d8802E3Da034b</code></li>
              <li>Confirm the transaction and wait for blockchain confirmation</li>
              <li>Refresh the page to see updated ownership status</li>
            </ol>
          </div>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 font-medium mb-1">⚠️ Important</p>
            <p className="text-foreground/60">
              Ownership transfer is irreversible. Make sure you have access to the new owner wallet 
              before transferring ownership.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Success */}
      {transferSuccess && transferHash && (
        <div className="defi-card p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Ownership transferred successfully!</span>
            </div>
            <a
              href={getExplorerUrl(activeChainId, transferHash, 'tx')}
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