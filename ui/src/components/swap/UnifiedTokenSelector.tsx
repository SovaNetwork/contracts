'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Globe, Zap, ArrowUpDown, X } from 'lucide-react';
import { type Address } from 'viem';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/formatters';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { getCrossChainSupportedChains, getChainConfig } from '@/contracts/addresses';
import { useNetworkTokens } from '@/hooks/web3/useActiveNetwork';
import type { UnifiedToken } from './UnifiedSwapInterface';

interface UnifiedTokenSelectorProps {
  selectedToken: UnifiedToken | null;
  onTokenSelect: (token: UnifiedToken) => void;
  mode: 'from' | 'to';
  excludeToken?: UnifiedToken | null;
  userAddress?: Address;
  sourceToken?: UnifiedToken | null; // For intelligent suggestions in 'to' mode
  className?: string;
}

export function UnifiedTokenSelector({
  selectedToken,
  onTokenSelect,
  mode,
  excludeToken,
  userAddress,
  sourceToken,
  className,
}: UnifiedTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'your-tokens' | 'wrap' | 'bridge'>('all');
  
  const chainId = useChainId();
  const { tokens: currentNetworkTokens } = useNetworkTokens();

  // Get all supported chains for cross-network discovery
  const supportedChains = getCrossChainSupportedChains();

  // Generate unified token list across all networks
  const allTokens = useMemo(() => {
    const tokenList: UnifiedToken[] = [];

    supportedChains.forEach(chain => {
      const chainConfig = getChainConfig(chain.chainId);
      if (!chainConfig) return;

      // Add native wrappable tokens (WBTC, LBTC, USDC) from supportedTokens
      const wrappableTokens = Object.values(chainConfig.supportedTokens).map(token => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        canWrap: true,
      }));

      wrappableTokens.forEach(token => {
        tokenList.push({
          ...token,
          network: {
            chainId: chain.chainId,
            name: chain.name,
            layerZeroEndpointId: chainConfig.layerZero?.eid || 0,
          },
          isSovaBTC: false,
          canBridge: false,
          canStake: false,
          canRedeem: false,
        });
      });

      // Add sovaBTC for each network
      if (chainConfig.contracts.sovaBTC) {
        tokenList.push({
          address: chainConfig.contracts.sovaBTC,
          symbol: 'sovaBTC',
          name: 'Sovereign Bitcoin',
          decimals: 8,
          network: {
            chainId: chain.chainId,
            name: chain.name,
            layerZeroEndpointId: chainConfig.layerZero?.eid || 0,
          },
          isSovaBTC: true,
          canWrap: false,
          canBridge: true,
          canStake: true,
          canRedeem: true,
        });
      }
    });

    return tokenList;
  }, [supportedChains]);

  // Filter tokens based on search and mode
  const filteredTokens = useMemo(() => {
    let tokens = allTokens;

    // Exclude selected token from other selector
    if (excludeToken) {
      tokens = tokens.filter(token => 
        !(token.address === excludeToken.address && 
          token.network.chainId === excludeToken.network.chainId)
      );
    }

    // Apply search filter
    if (searchQuery) {
      tokens = tokens.filter(token => 
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.network.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filters
    switch (activeTab) {
      case 'wrap':
        tokens = tokens.filter(token => token.canWrap || token.isSovaBTC);
        break;
      case 'bridge':
        tokens = tokens.filter(token => token.isSovaBTC);
        break;
      case 'your-tokens':
        // Filter tokens with balance > 0 (this would be enhanced with actual balance data)
        break;
    }

    // Intelligent suggestions for 'to' mode
    if (mode === 'to' && sourceToken && !searchQuery && activeTab === 'all') {
      const suggestions: UnifiedToken[] = [];
      
      // If source is wrappable token, suggest sovaBTC on same network
      if (sourceToken.canWrap && !sourceToken.isSovaBTC) {
        const sovaBTCOnSameNetwork = tokens.find(token => 
          token.isSovaBTC && token.network.chainId === sourceToken.network.chainId
        );
        if (sovaBTCOnSameNetwork) {
          suggestions.push(sovaBTCOnSameNetwork);
        }
      }

      // If source is sovaBTC, suggest other networks and unwrap options
      if (sourceToken.isSovaBTC) {
        // Suggest sovaBTC on other networks (for bridging)
        const otherNetworkSovaBTC = tokens.filter(token => 
          token.isSovaBTC && token.network.chainId !== sourceToken.network.chainId
        );
        suggestions.push(...otherNetworkSovaBTC);

        // Suggest unwrap options on same network
        const unwrapOptions = tokens.filter(token => 
          token.canWrap && token.network.chainId === sourceToken.network.chainId
        );
        suggestions.push(...unwrapOptions);
      }

      // Return suggestions first, then other tokens
      const remainingTokens = tokens.filter(token => 
        !suggestions.some(s => s.address === token.address && s.network.chainId === token.network.chainId)
      );
      return [...suggestions, ...remainingTokens];
    }

    return tokens;
  }, [allTokens, excludeToken, searchQuery, activeTab, mode, sourceToken]);

  // Group tokens by network for better organization
  const tokensByNetwork = useMemo(() => {
    const groups: Record<string, UnifiedToken[]> = {};
    
    filteredTokens.forEach(token => {
      const networkKey = `${token.network.chainId}-${token.network.name}`;
      if (!groups[networkKey]) {
        groups[networkKey] = [];
      }
      groups[networkKey].push(token);
    });

    return groups;
  }, [filteredTokens]);

  const handleTokenSelect = (token: UnifiedToken) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Token Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-card border border-border/50 rounded-lg hover:border-border transition-colors"
      >
        {selectedToken ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-sm font-bold">
                {selectedToken.symbol.charAt(0)}
              </div>
              {/* Network badge */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-defi-purple to-defi-pink rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">
                  {selectedToken.network.name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="text-left">
              <div className="font-medium flex items-center space-x-2">
                <span>{selectedToken.symbol}</span>
                {selectedToken.isSovaBTC && (
                  <span className="text-xs bg-defi-purple/20 text-defi-purple px-1 py-0.5 rounded">
                    OFT
                  </span>
                )}
              </div>
              <div className="text-sm text-foreground/60">
                on {selectedToken.network.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-foreground/60">Select a token</div>
        )}
        <ChevronDown className="w-5 h-5" />
      </button>

      {/* Unified Token Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop and Modal - Rendered at document root */}
            {typeof document !== 'undefined' && createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24"
                style={{ position: 'fixed', zIndex: 999999 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-card border border-border/50 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden"
                >
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold gradient-text">
                    Select Token
                  </h3>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-background/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens or networks..."
                    className="w-full pl-10 pr-4 py-2 bg-background rounded-lg border border-border/50 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', icon: Globe },
                    { key: 'wrap', label: 'Wrap', icon: ArrowUpDown },
                    { key: 'bridge', label: 'Bridge', icon: Zap },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={cn(
                        "flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        activeTab === tab.key 
                          ? "bg-defi-purple text-white" 
                          : "bg-background/60 hover:bg-background"
                      )}
                    >
                      <tab.icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Token List */}
              <div className="overflow-y-auto max-h-96">
                {Object.keys(tokensByNetwork).length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No tokens found matching your criteria
                  </div>
                ) : (
                  Object.entries(tokensByNetwork).map(([networkKey, tokens]) => {
                    const network = tokens[0].network;
                    return (
                      <div key={networkKey} className="border-b border-border/30 last:border-b-0">
                        {/* Network Header */}
                        <div className="sticky top-0 bg-card/95 backdrop-blur px-6 py-3 border-b border-border/20 z-10">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-defi-purple" />
                            <span className="font-medium text-sm">{network.name}</span>
                            <span className="text-xs text-muted-foreground">
                              EID: {network.layerZeroEndpointId}
                            </span>
                          </div>
                        </div>

                        {/* Tokens for this network */}
                        {tokens.map((token) => (
                          <TokenOption
                            key={`${token.address}-${token.network.chainId}`}
                            token={token}
                            isSelected={selectedToken?.address === token.address && 
                                       selectedToken?.network.chainId === token.network.chainId}
                            onSelect={() => handleTokenSelect(token)}
                            userAddress={userAddress}
                          />
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
                </motion.div>
              </motion.div>,
              document.body
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TokenOptionProps {
  token: UnifiedToken;
  isSelected: boolean;
  onSelect: () => void;
  userAddress?: Address;
}

function TokenOption({ token, isSelected, onSelect, userAddress }: TokenOptionProps) {
  const { balance, isLoading } = useTokenBalance({
    tokenAddress: token.address as Address,
    accountAddress: userAddress,
    enabled: Boolean(userAddress && token.address),
  });

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between p-4 hover:bg-background/50 transition-colors",
        isSelected && "bg-defi-purple/10 border-r-2 border-defi-purple"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
            token.isSovaBTC 
              ? "bg-gradient-to-r from-defi-purple to-defi-pink text-white"
              : "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
          )}>
            {token.symbol.slice(0, 2)}
          </div>
          {/* Network indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background border border-border rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">
              {token.network.name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="text-left">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{token.symbol}</span>
            {token.isSovaBTC && (
              <span className="text-xs bg-defi-purple/20 text-defi-purple px-1 py-0.5 rounded">
                OFT
              </span>
            )}
            {token.canWrap && (
              <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded">
                Wrap
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{token.name}</div>
        </div>
      </div>

      <div className="text-right">
        {userAddress && (
          <div>
            <div className="text-sm">
              {isLoading ? (
                <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
              ) : (
                formatTokenAmount(balance || 0n, token.decimals, 4)
              )}
            </div>
            <div className="text-xs text-muted-foreground">Balance</div>
          </div>
        )}
      </div>
    </button>
  );
} 