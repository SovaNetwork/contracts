'use client';

import { useState } from 'react';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { getSupportedChains, getMainnetChains, getTestnetChains } from '@/contracts/addresses';

export function NetworkSwitcher() {
  const {
    activeChainId,
    activeChainConfig,
    walletChainId,
    walletChainConfig,
    isNetworkSupported,
    isNetworkMismatch,
    setActiveChain,
    switchToChain,
  } = useActiveNetwork();

  const [isOpen, setIsOpen] = useState(false);

  const supportedChains = getSupportedChains();
  const mainnetChains = getMainnetChains();
  const testnetChains = getTestnetChains();

  const handleNetworkSelect = async (chainId: number) => {
    setIsOpen(false);
    
    // If wallet is on a different network, offer to switch wallet
    if (walletChainId && walletChainId !== chainId) {
      await switchToChain(chainId);
    } else {
      // Just update app state
      setActiveChain(chainId);
    }
  };

  const getStatusColor = () => {
    if (!isNetworkSupported) return 'text-red-400 border-red-500/50';
    if (isNetworkMismatch) return 'text-yellow-400 border-yellow-500/50';
    return 'text-green-400 border-green-500/50';
  };

  const getStatusText = () => {
    if (!isNetworkSupported) return 'Unsupported';
    if (isNetworkMismatch) return 'Mismatch';
    return 'Connected';
  };

  return (
    <div className="relative">
      {/* Network Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-3 py-2 min-w-[140px]
          bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50
          hover:border-slate-600 transition-colors
          ${!isNetworkSupported ? 'border-red-500/50 hover:border-red-500/70' : ''}
          ${isNetworkMismatch ? 'border-yellow-500/50 hover:border-yellow-500/70' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
          <span className="font-medium text-slate-200">
            {activeChainConfig?.shortName || 'Unknown'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <svg 
            className="w-4 h-4 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl">
            {/* Status Section */}
            <div className="px-3 py-2 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">Network Status</span>
                <span className={`text-xs px-2 py-1 rounded-full bg-slate-700/50 ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              {/* Network Info */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>App Network:</span>
                  <span className="font-medium text-slate-200">
                    {activeChainConfig?.name || 'Unknown'}
                  </span>
                </div>
                
                {walletChainConfig && (
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Wallet Network:</span>
                    <span 
                      className={`font-medium ${
                        isNetworkMismatch ? 'text-yellow-400' : 'text-slate-200'
                      }`}
                    >
                      {walletChainConfig.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mainnet Networks */}
            {mainnetChains.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-slate-400">
                  Mainnet
                </div>
                {mainnetChains.map((chain) => (
                  <button
                    key={chain.chainId}
                    onClick={() => handleNetworkSelect(chain.chainId)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors
                      ${activeChainId === chain.chainId ? 'bg-purple-600/20' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {chain.shortName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-200">{chain.name}</div>
                        <div className="text-xs text-slate-400">
                          {chain.nativeCurrency.symbol}
                        </div>
                      </div>
                    </div>
                    
                    {activeChainId === chain.chainId && (
                      <div className="w-4 h-4 text-purple-400">✓</div>
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Testnet Networks */}
            {testnetChains.length > 0 && (
              <>
                <div className="border-t border-slate-700/50 mt-1" />
                <div className="px-3 py-2 text-xs font-medium text-slate-400">
                  Testnet
                </div>
                {testnetChains.map((chain) => (
                  <button
                    key={chain.chainId}
                    onClick={() => handleNetworkSelect(chain.chainId)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors
                      ${activeChainId === chain.chainId ? 'bg-purple-600/20' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {chain.shortName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{chain.name}</span>
                          <span className="text-xs px-1 py-0.5 rounded border border-yellow-500/50 text-yellow-400">
                            TEST
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {chain.nativeCurrency.symbol}
                        </div>
                      </div>
                    </div>
                    
                    {activeChainId === chain.chainId && (
                      <div className="w-4 h-4 text-purple-400">✓</div>
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Warning Messages */}
            {isNetworkMismatch && (
              <div className="mx-2 mb-2 mt-2 px-3 py-2 text-xs text-yellow-400 bg-yellow-500/10 rounded border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3">⚠</span>
                  <span className="font-medium">Network Mismatch</span>
                </div>
                <p>Your wallet is on {walletChainConfig?.name} but the app is set to {activeChainConfig?.name}.</p>
              </div>
            )}

            {!isNetworkSupported && (
              <div className="mx-2 mb-2 mt-2 px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3">⚠</span>
                  <span className="font-medium">Unsupported Network</span>
                </div>
                <p>Please switch to a supported network to use the application.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 