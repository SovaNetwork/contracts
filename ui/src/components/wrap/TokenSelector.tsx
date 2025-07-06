'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_TOKENS } from '@/contracts/addresses';
import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/formatters';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { useTokenRedemption } from '@/hooks/web3/useTokenRedemption';
import { type Address } from 'viem';

interface TokenSelectorProps {
  selectedToken: typeof SUPPORTED_TOKENS[number] | null;
  onTokenSelect: (token: typeof SUPPORTED_TOKENS[number]) => void;
  userAddress: Address | undefined;
  className?: string;
  showReserves?: boolean; // Show available reserves instead of user balance
  compact?: boolean; // Compact mode for smaller display
}

export function TokenSelector({
  selectedToken,
  onTokenSelect,
  userAddress,
  className,
  showReserves = false,
  compact = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {/* Selected Token Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between bg-card/50 border border-border/50 rounded-lg hover:bg-card/70 transition-all duration-200",
          compact ? "px-3 py-2" : "w-full p-4"
        )}
      >
        {selectedToken ? (
          <div className={cn("flex items-center", compact ? "space-x-2" : "space-x-3")}>
            <div className={cn(
              "rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center font-bold",
              compact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
            )}>
              {selectedToken.symbol.slice(0, 2)}
            </div>
            {compact ? (
              <span className="font-medium">{selectedToken.symbol}</span>
            ) : (
              <div className="text-left">
                <div className="font-medium">{selectedToken.symbol}</div>
                <div className="text-sm text-foreground/60">{selectedToken.name}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-foreground/60">
            {compact ? "Select token" : "Select a token to wrap"}
          </div>
        )}
        
        <ChevronDown 
          className={cn(
            "text-foreground/60 transition-transform duration-200",
            compact ? "w-4 h-4" : "w-5 h-5",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden">
          {SUPPORTED_TOKENS.map((token) => (
            <TokenOption
              key={token.address}
              token={token}
              isSelected={selectedToken?.address === token.address}
              onSelect={() => {
                onTokenSelect(token);
                setIsOpen(false);
              }}
              userAddress={userAddress}
              showReserves={showReserves}
            />
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface TokenOptionProps {
  token: typeof SUPPORTED_TOKENS[number];
  isSelected: boolean;
  onSelect: () => void;
  userAddress: Address | undefined;
  showReserves?: boolean;
}

function TokenOption({ token, isSelected, onSelect, userAddress, showReserves = false }: TokenOptionProps) {
  const { balance, isLoading } = useTokenBalance({
    tokenAddress: token.address as Address,
    accountAddress: userAddress,
  });

  const { useAvailableReserve } = useTokenRedemption({
    userAddress: userAddress,
  });

  const { data: availableReserve, isLoading: isLoadingReserve } = useAvailableReserve(token.address as Address);

  const displayValue = showReserves ? availableReserve : balance;
  const displayLoading = showReserves ? isLoadingReserve : isLoading;
  const displayLabel = showReserves ? 'Reserve' : 'Balance';

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 hover:bg-card/70 transition-colors duration-200 border-b border-border/30 last:border-b-0"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-sm font-bold">
          {token.symbol.slice(0, 2)}
        </div>
        <div className="text-left">
          <div className="font-medium">{token.symbol}</div>
          <div className="text-sm text-foreground/60">{token.name}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {userAddress && (
          <div className="text-right">
            <div className="text-sm">
              {displayLoading ? (
                <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
              ) : (
                formatTokenAmount((displayValue as bigint) || 0n, token.decimals, 4)
              )}
            </div>
            <div className="text-xs text-foreground/60">{displayLabel}</div>
          </div>
        )}
        
        {isSelected && (
          <Check className="w-5 h-5 text-defi-purple" />
        )}
      </div>
    </button>
  );
} 