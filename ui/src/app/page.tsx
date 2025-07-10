'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatTokenAmount } from '@/lib/formatters';
import { getChainConfig } from '@/contracts/addresses';
import { APP_NAME } from '@/lib/constants';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Get current network configuration
  const currentChain = getChainConfig(chainId);
  
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get SovaBTC balance (network-aware)
  const { data: sovaBTCBalance } = useBalance({
    address: address,
    token: currentChain?.contracts.sovaBTC,
  });

  // Get SOVA balance (network-aware)
  const { data: sovaBalance } = useBalance({
    address: address,
    token: currentChain?.contracts.sovaToken,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sova-black-900 via-sova-black-800 to-sova-black-900">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">
              Decentralized Bitcoin
            </span>
            <br />
            Infrastructure on Base
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Wrap your Bitcoin, earn rewards through staking, and participate in the future of decentralized finance.
          </p>
          
          {!isConnected ? (
            <div className="flex flex-col items-center space-y-4">
              <ConnectButton />
              <div className="text-foreground/60">or</div>
              <a 
                href="/wrap" 
                className="btn-sova px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Start Wrapping →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-foreground/60">
                Welcome back! Your wallet is connected to {currentChain?.name || 'Unknown Network'}.
              </p>
              
              {/* Network Warning for Unsupported Chains */}
              {!currentChain && (
                <div className="max-w-md mx-auto p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Unsupported network. Please switch to Base Sepolia, Optimism Sepolia, or Ethereum Sepolia.
                  </p>
                </div>
              )}
              
              {/* Wallet Info */}
              {currentChain && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="defi-card p-4 text-center">
                    <div className="text-sm text-foreground/60 mb-1">ETH Balance</div>
                    <div className="text-lg font-semibold">
                      {ethBalance ? formatTokenAmount(ethBalance.value, 18, 4) : '0.00'} ETH
                    </div>
                  </div>
                  
                  <div className="defi-card p-4 text-center">
                    <div className="text-sm text-foreground/60 mb-1">SovaBTC Balance</div>
                    <div className="text-lg font-semibold">
                      {sovaBTCBalance ? formatTokenAmount(sovaBTCBalance.value, 8, 8) : '0.00'} sovaBTC
                    </div>
                  </div>
                  
                  <div className="defi-card p-4 text-center">
                    <div className="text-sm text-foreground/60 mb-1">SOVA Balance</div>
                    <div className="text-lg font-semibold">
                      {sovaBalance ? formatTokenAmount(sovaBalance.value, 18, 4) : '0.0000'} SOVA
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-6">
                <a 
                  href="/wrap" 
                  className="btn-sova px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Wrap Tokens →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="defi-card p-6 text-center card-hover">
            <div className="h-12 w-12 rounded-full bg-sova-gradient mx-auto mb-4 shadow-sova-glow"></div>
            <h3 className="text-xl font-semibold mb-2">Wrap Bitcoin</h3>
            <p className="text-foreground/80">
              Convert your Bitcoin-backed tokens into sovaBTC and join the Base ecosystem.
            </p>
          </div>
          
          <div className="defi-card p-6 text-center card-hover">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sova-mint-400 to-sova-mint-600 mx-auto mb-4 shadow-sova-glow"></div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p className="text-foreground/80">
              Stake your sovaBTC and SOVA tokens to earn attractive yields and protocol rewards.
            </p>
          </div>
          
          <div className="defi-card p-6 text-center card-hover">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sova-mint-600 to-sova-mint-800 mx-auto mb-4 shadow-sova-glow"></div>
            <h3 className="text-xl font-semibold mb-2">Secure Redemption</h3>
            <p className="text-foreground/80">
              Redeem your sovaBTC back to Bitcoin with our secure 10-day redemption queue.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="defi-card p-8 text-center">
          <h3 className="text-2xl font-bold mb-6 gradient-text">Protocol Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-sova-mint-400">$0.00</div>
              <div className="text-sm text-foreground/60">Total Value Locked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sova-mint-400">0.00</div>
              <div className="text-sm text-foreground/60">sovaBTC Supply</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sova-mint-400">0.00%</div>
              <div className="text-sm text-foreground/60">Average APY</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sova-mint-400">0</div>
              <div className="text-sm text-foreground/60">Active Stakers</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-6 w-6 rounded-full bg-sova-gradient shadow-sova-glow"></div>
              <span className="font-semibold">{APP_NAME}</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-foreground/60 hover:text-sova-mint-400 transition-colors">
                Docs
              </a>
              <a href="#" className="text-foreground/60 hover:text-sova-mint-400 transition-colors">
                Twitter
              </a>
              <a href="#" className="text-foreground/60 hover:text-sova-mint-400 transition-colors">
                Discord
              </a>
              <a href="#" className="text-foreground/60 hover:text-sova-mint-400 transition-colors">
                GitHub
              </a>
            </div>
          </div>
          
          <div className="text-center mt-8 text-foreground/60 text-sm">
            <p>© 2024 SovaBTC Protocol. Multi-chain Bitcoin infrastructure.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
