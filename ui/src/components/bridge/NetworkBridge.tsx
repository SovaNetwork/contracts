'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getChainConfig, type SupportedChainId } from '@/contracts/addresses';
import { cn } from '@/lib/utils';

type NetworkBridgeProps = {
  sourceChainId: number;
  destinationChainId: number | undefined;
  onSourceChange: (chainId: number) => void;
  onDestinationChange: (chainId: number) => void;
  onReverse: () => void;
  supportedChains: SupportedChainId[];
  isReversed?: boolean;
  className?: string;
};

type NetworkSelectorProps = {
  selectedChainId: number | undefined;
  availableChains: SupportedChainId[];
  onSelect: (chainId: number) => void;
  label: string;
  placeholder?: string;
};

function NetworkSelector({ selectedChainId, availableChains, onSelect, label, placeholder }: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedChain = selectedChainId ? getChainConfig(selectedChainId) : null;
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: isOpen ? 9999 : 'auto' }}>
      <div className="text-sm font-medium text-foreground/80 mb-2">{label}</div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
          "bg-background/50 border-border/50 hover:border-border",
          isOpen && "border-primary ring-1 ring-primary/20"
        )}
      >
        {selectedChain ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {selectedChain.shortName.charAt(0)}
              </span>
            </div>
            <div className="text-left">
              <div className="font-medium">{selectedChain.name}</div>
              <div className="text-xs text-foreground/60">{selectedChain.shortName}</div>
            </div>
          </div>
        ) : (
          <div className="text-foreground/60">{placeholder || 'Select network'}</div>
        )}
        
        <ChevronDown className={cn(
          "w-4 h-4 text-foreground/60 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-[9999] overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {availableChains.map((chainId) => {
            const chain = getChainConfig(chainId);
            if (!chain) return null;

            const isSelected = chainId === selectedChainId;
            const isDisabled = chainId === selectedChainId;

            return (
              <button
                key={chainId}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(chainId);
                    setIsOpen(false);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center space-x-3 p-4 transition-colors duration-200",
                  "hover:bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected && "bg-primary/10 border-l-2 border-l-primary"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {chain.shortName.charAt(0)}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-xs text-foreground/60">{chain.shortName}</div>
                </div>
                {chain.isTestnet && (
                  <div className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                    Testnet
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

export function NetworkBridge({
  sourceChainId,
  destinationChainId,
  onSourceChange,
  onDestinationChange,
  onReverse,
  supportedChains,
  isReversed = false,
  className = ""
}: NetworkBridgeProps) {
  // Filter available chains (source can't be destination)
  const availableSourceChains = supportedChains;
  const availableDestinationChains = supportedChains.filter(id => id !== sourceChainId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Source Network */}
      <NetworkSelector
        selectedChainId={sourceChainId}
        availableChains={availableSourceChains}
        onSelect={onSourceChange}
        label="From Network"
      />

      {/* Bridge Direction Toggle */}
      <div className="flex justify-center">
        <motion.button
          onClick={onReverse}
          disabled={!destinationChainId}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-10 h-10 rounded-full border-2 border-border bg-background",
            "flex items-center justify-center transition-all duration-200",
            "hover:border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed",
            isReversed && "rotate-180"
          )}
        >
          <ArrowDownUp className="w-4 h-4 text-foreground/70" />
        </motion.button>
      </div>

      {/* Destination Network */}
      <NetworkSelector
        selectedChainId={destinationChainId}
        availableChains={availableDestinationChains}
        onSelect={onDestinationChange}
        label="To Network"
        placeholder="Select destination"
      />

      {/* Bridge Information */}
      {sourceChainId && destinationChainId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-background/50 border border-border/50 rounded-lg"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/70">Bridge Route:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                {getChainConfig(sourceChainId)?.shortName}
              </span>
              <span className="text-foreground/50">→</span>
              <span className="font-medium">
                {getChainConfig(destinationChainId)?.shortName}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground/50">
            Powered by LayerZero V2 • Estimated time: 5-10 minutes
          </div>
        </motion.div>
      )}
    </div>
  );
} 