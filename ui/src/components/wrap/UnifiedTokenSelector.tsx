'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { formatTokenAmount } from '@/lib/formatters';
import { getChainConfig } from '@/contracts/addresses';
import { cn } from '@/lib/utils';
import { type Address } from 'viem';

export type UnifiedToken = {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  chainId?: number; // If set, represents sovaBTC on that chain
  address?: Address; // Local token address
  isCrossChain?: boolean;
  isNative?: boolean;
};

type UnifiedTokenSelectorProps = {
  selectedToken: UnifiedToken | null;
  onTokenSelect: (token: UnifiedToken | null) => void;
  availableTokens: UnifiedToken[];
  userAddress: Address | undefined;
  label?: string;
  placeholder?: string;
  showReserves?: boolean;
  className?: string;
};

function TokenOption({ 
  token, 
  balance, 
  isLoading,
  onClick,
  isSelected = false 
}: { 
  token: UnifiedToken; 
  balance?: bigint;
  isLoading?: boolean;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const chainInfo = token.chainId ? getChainConfig(token.chainId) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 hover:bg-background/50 transition-colors duration-200",
        isSelected && "bg-primary/10 border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-center space-x-3">
        {/* Token Icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {token.symbol.charAt(0)}
          </span>
        </div>

        {/* Token Info */}
        <div className="text-left">
          <div className="font-medium flex items-center space-x-2">
            <span>{token.symbol}</span>
            {token.isCrossChain && chainInfo && (
              <span className="text-xs px-2 py-1 bg-defi-purple/20 text-defi-purple rounded">
                {chainInfo.shortName}
              </span>
            )}
          </div>
          <div className="text-xs text-foreground/60">{token.name}</div>
        </div>
      </div>

      {/* Balance */}
      <div className="text-right">
        {isLoading ? (
          <div className="text-xs text-foreground/60">Loading...</div>
        ) : balance !== undefined ? (
          <div className="text-sm font-medium">
            {formatTokenAmount(balance, token.decimals, 4)}
          </div>
        ) : (
          <div className="text-xs text-foreground/60">-</div>
        )}
      </div>
    </button>
  );
}

export function UnifiedTokenSelector({
  selectedToken,
  onTokenSelect,
  availableTokens,
  userAddress,
  label = "Select token",
  placeholder = "Choose token",
  showReserves = false,
  className = ""
}: UnifiedTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get balance for selected token
  const { balance: selectedBalance, isLoading: selectedLoading } = useTokenBalance({
    tokenAddress: selectedToken?.address as Address,
    accountAddress: userAddress,
    enabled: Boolean(selectedToken?.address && userAddress && !selectedToken?.isCrossChain),
  });

  const handleTokenSelect = (token: UnifiedToken | null) => {
    onTokenSelect(token);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Selected Token Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
          "bg-background/50 border-border/50 hover:border-border",
          isOpen && "border-primary ring-1 ring-primary/20",
          selectedToken ? "min-w-[140px]" : "min-w-[120px]"
        )}
      >
        {selectedToken ? (
          <div className="flex items-center space-x-2">
            {/* Token Icon */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {selectedToken.symbol.charAt(0)}
              </span>
            </div>

            {/* Token Info */}
            <div className="text-left">
              <div className="font-medium text-sm flex items-center space-x-1">
                <span>{selectedToken.symbol}</span>
                {selectedToken.isCrossChain && selectedToken.chainId && (
                  <span className="text-xs px-1 py-0.5 bg-defi-purple/20 text-defi-purple rounded">
                    {getChainConfig(selectedToken.chainId)?.shortName}
                  </span>
                )}
              </div>
              {showReserves && selectedBalance !== undefined && (
                <div className="text-xs text-foreground/60">
                  {formatTokenAmount(selectedBalance, selectedToken.decimals, 2)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-foreground/60">
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-foreground/30" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}

        <ChevronDown className={cn(
          "w-4 h-4 text-foreground/60 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto"
        >
          {/* Clear Selection Option */}
          <button
            onClick={() => handleTokenSelect(null)}
            className="w-full p-3 text-left hover:bg-background/50 transition-colors border-b border-border/50"
          >
            <div className="text-sm text-foreground/60">Clear selection</div>
          </button>

          {/* Local Tokens Section */}
          {availableTokens.filter(token => !token.isCrossChain).length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-foreground/70 bg-background/50 border-b border-border/50">
                Current Network
              </div>
              {availableTokens
                .filter(token => !token.isCrossChain)
                .map((token, index) => (
                  <TokenOption
                    key={`local-${index}`}
                    token={token}
                    onClick={() => handleTokenSelect(token)}
                    isSelected={selectedToken === token}
                  />
                ))}
            </>
          )}

          {/* Cross-Chain Tokens Section */}
          {availableTokens.filter(token => token.isCrossChain).length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-foreground/70 bg-background/50 border-b border-border/50">
                Other Networks
              </div>
              {availableTokens
                .filter(token => token.isCrossChain)
                .map((token, index) => (
                  <TokenOption
                    key={`cross-chain-${index}`}
                    token={token}
                    onClick={() => handleTokenSelect(token)}
                    isSelected={selectedToken === token}
                  />
                ))}
            </>
          )}

          {availableTokens.length === 0 && (
            <div className="p-4 text-center text-foreground/60">
              No tokens available
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
} 