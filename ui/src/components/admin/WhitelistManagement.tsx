'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Edit, 
  Check, 
  X, 
  ExternalLink,
  AlertTriangle,
  Coins,
  Calendar,
  Database,
  Search,
  Filter,
  Download,
  CheckCircle
} from 'lucide-react';
import { type Address, isAddress } from 'viem';
import { useWhitelistManager, type WhitelistToken } from '@/hooks/web3/useWhitelistManager';
import { getExplorerUrl } from '@/contracts/addresses';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { formatTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AddTokenFormProps {
  onSubmit: (token: {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AddTokenForm({ onSubmit, onCancel, isLoading }: AddTokenFormProps) {
  const [formData, setFormData] = useState({
    address: '',
    symbol: '',
    name: '',
    decimals: 8,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address) {
      newErrors.address = 'Address is required';
    } else if (!isAddress(formData.address)) {
      newErrors.address = 'Invalid address format';
    }
    
    if (!formData.symbol) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }
    
    if (formData.decimals < 1 || formData.decimals > 18) {
      newErrors.decimals = 'Decimals must be between 1 and 18';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        address: formData.address as Address,
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        decimals: formData.decimals,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="defi-card p-6 border-2 border-defi-purple/20"
    >
      <h3 className="text-lg font-bold gradient-text mb-4">Add New Token</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Token Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="0x..."
            className={cn(
              "w-full px-3 py-2 bg-card border border-border/50 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-defi-purple",
              errors.address && "border-red-500"
            )}
          />
          {errors.address && (
            <p className="text-red-400 text-sm mt-1">{errors.address}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="WBTC"
              className={cn(
                "w-full px-3 py-2 bg-card border border-border/50 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-defi-purple",
                errors.symbol && "border-red-500"
              )}
            />
            {errors.symbol && (
              <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Decimals
            </label>
            <input
              type="number"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) })}
              min="1"
              max="18"
              className={cn(
                "w-full px-3 py-2 bg-card border border-border/50 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-defi-purple",
                errors.decimals && "border-red-500"
              )}
            />
            {errors.decimals && (
              <p className="text-red-400 text-sm mt-1">{errors.decimals}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Token Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Wrapped Bitcoin"
            className={cn(
              "w-full px-3 py-2 bg-card border border-border/50 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-defi-purple",
              errors.name && "border-red-500"
            )}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
              "btn-defi text-white disabled:opacity-50"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>{isLoading ? 'Adding...' : 'Add Token'}</span>
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}

interface TokenCardProps {
  token: WhitelistToken;
  onRemove: (address: Address) => void;
  isRemoving: boolean;
}

function TokenCard({ token, onRemove, isRemoving }: TokenCardProps) {
  const { activeChainId } = useActiveNetwork();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleRemove = () => {
    onRemove(token.address);
    setShowConfirmRemove(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "defi-card p-4 hover:border-defi-purple/30 transition-all duration-300",
        !token.isActive && "opacity-60 border-red-500/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-defi-purple/20 rounded-full flex items-center justify-center">
            <Coins className="w-5 h-5 text-defi-purple" />
          </div>
          
          <div>
            <h4 className="font-bold text-lg">{token.symbol}</h4>
            <p className="text-sm text-foreground/60">{token.name}</p>
            <p className="text-xs text-foreground/40 font-mono">
              {token.address.slice(0, 6)}...{token.address.slice(-4)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <a
            href={getExplorerUrl(activeChainId, token.address, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          
          {!showConfirmRemove ? (
            <button
              onClick={() => setShowConfirmRemove(true)}
              className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowConfirmRemove(false)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-foreground/60">Decimals:</span>
          <span className="ml-2 font-medium">{token.decimals}</span>
        </div>
        <div>
          <span className="text-foreground/60">Status:</span>
          <span className={cn(
            "ml-2 font-medium",
            token.isActive ? "text-green-400" : "text-red-400"
          )}>
            {token.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <span className="text-foreground/60">Added:</span>
          <span className="ml-2 font-medium">
            {token.addedAt.toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-foreground/60">Wrapped:</span>
          <span className="ml-2 font-medium">
            {formatTokenAmount(token.totalWrapped, token.decimals, 4)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function WhitelistManagement() {
  const { activeChainId } = useActiveNetwork();
  const { 
    tokens: whitelistTokens, 
    addToken: addTokenToWhitelist, 
    removeToken: removeTokenFromWhitelist,
    isLoading,
    error,
    isTransactionPending,
    transactionHash,
    isTransactionSuccess
  } = useWhitelistManager();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [removingTokens, setRemovingTokens] = useState<Set<string>>(new Set());

  const filteredTokens = whitelistTokens.filter((token: WhitelistToken) => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && token.isActive) ||
                         (filterStatus === 'inactive' && !token.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const handleAddToken = useCallback(async (tokenData: {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
  }) => {
    try {
      await addTokenToWhitelist(tokenData.address);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  }, [addTokenToWhitelist]);

  const handleRemoveToken = useCallback(async (address: Address) => {
    setRemovingTokens(prev => new Set(prev).add(address));
    try {
      await removeTokenFromWhitelist(address);
    } catch (error) {
      console.error('Failed to remove token:', error);
    } finally {
      setRemovingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  }, [removeTokenFromWhitelist]);

  const exportWhitelistData = () => {
    const data = {
      tokens: whitelistTokens,
      exportTimestamp: new Date().toISOString(),
      totalTokens: whitelistTokens.length,
      activeTokens: whitelistTokens.filter((t: WhitelistToken) => t.isActive).length,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelist-tokens-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Whitelist Management</h2>
          <p className="text-foreground/60 mt-1">
            Manage tokens approved for wrapping into sovaBTC
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportWhitelistData}
            className="flex items-center space-x-2 px-4 py-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            disabled={isTransactionPending}
            className="flex items-center space-x-2 px-4 py-2 btn-defi text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isTransactionPending ? 'Processing...' : 'Add Token'}</span>
          </button>
        </div>
      </div>

      {/* Add Token Form */}
      {showAddForm && (
        <AddTokenForm
          onSubmit={handleAddToken}
          onCancel={() => setShowAddForm(false)}
          isLoading={isTransactionPending}
        />
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tokens..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-defi-purple"
        >
          <option value="all">All Tokens</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{whitelistTokens.length}</div>
              <div className="text-sm text-foreground/60">Total Tokens</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Check className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold">
                {whitelistTokens.filter(t => t.isActive).length}
              </div>
              <div className="text-sm text-foreground/60">Active</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold">
                {whitelistTokens.filter(t => !t.isActive).length}
              </div>
              <div className="text-sm text-foreground/60">Inactive</div>
            </div>
          </div>
        </div>
        
        <div className="defi-card p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold">
                {whitelistTokens.filter(t => 
                  new Date(t.addedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                ).length}
              </div>
              <div className="text-sm text-foreground/60">Added (30d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-4">
        {filteredTokens.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No tokens found</h3>
            <p className="text-foreground/60">
              {searchTerm ? 'Try adjusting your search or filter' : 'Add your first token to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.address}
                token={token}
                onRemove={handleRemoveToken}
                isRemoving={removingTokens.has(token.address)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transaction Success */}
      {isTransactionSuccess && transactionHash && (
        <div className="defi-card p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Transaction successful!</span>
            </div>
            <a
              href={getExplorerUrl(activeChainId, transactionHash, 'tx')}
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