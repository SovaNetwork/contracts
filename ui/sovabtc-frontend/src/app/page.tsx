'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useTokenBalance } from '../hooks/use-token-balance';
import { CONTRACT_ADDRESSES, TOKEN_CONFIGS } from '../contracts/addresses';
import { DepositForm } from '../components/wrap/deposit-form';
import { RedemptionForm } from '../components/redeem/redemption-form';
import { StakeForm } from '../components/staking/stake-form';
import { RewardsDisplay } from '../components/staking/rewards-display';
import { designSystem, componentStyles } from '../lib/design-system';
import { TrendingUp, Zap, Repeat, Gift, ExternalLink, Star } from 'lucide-react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get token balances for Base Sepolia
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC);
  const wbtcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].WBTC_TEST);
  const lbtcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].LBTC_TEST);
  const usdcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].USDC_TEST);

  return (
    <div className={`min-h-screen ${designSystem.gradients.background}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-pink-600/20 to-purple-600/20"></div>
        <div className="relative container mx-auto px-4 pt-8 pb-16">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`${designSystem.typography.h1} bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent`}>
                  SovaBTC
                </h1>
                <p className="text-lg text-slate-600 font-medium">Bitcoin meets composability</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">Base Sepolia</span>
              </div>
              <ConnectButton />
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className={`${designSystem.typography.display} mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent`}>
              The Future of Bitcoin DeFi
            </h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Wrap, stake, and earn with Bitcoin. Experience seamless Bitcoin liquidity across DeFi with sovaBTC.
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className={`${componentStyles.card.elevated} p-6 text-center`}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Instant Wrapping</h3>
                <p className="text-slate-600 text-sm">Deposit WBTC, LBTC, or USDC to get sovaBTC instantly</p>
              </div>
              
              <div className={`${componentStyles.card.elevated} p-6 text-center`}>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Earn Rewards</h3>
                <p className="text-slate-600 text-sm">Stake sovaBTC and earn SOVA token rewards with competitive APY</p>
              </div>
              
              <div className={`${componentStyles.card.elevated} p-6 text-center`}>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Repeat className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Flexible Redemption</h3>
                <p className="text-slate-600 text-sm">Redeem your sovaBTC back to original assets anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wallet Status */}
          <div className={`${componentStyles.card.elevated} p-6`}>
            <h2 className={`${designSystem.typography.h3} mb-4 text-slate-900`}>Wallet Status</h2>
            {isConnected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Connected Address:</p>
                  <p className="font-mono text-sm bg-slate-100 p-3 rounded-lg border">{address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Network:</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${chainId === baseSepolia.id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-semibold text-slate-900">
                      {chainId === baseSepolia.id ? 'Base Sepolia' : 'Unsupported Network'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-slate-600">Connect your wallet to get started</p>
              </div>
            )}
          </div>

          {/* Token Balances */}
          <div className={`${componentStyles.card.elevated} p-6`}>
            <h2 className={`${designSystem.typography.h3} mb-4 text-slate-900`}>Token Balances</h2>
            {isConnected && chainId === baseSepolia.id ? (
              <div className="space-y-3">
                <TokenBalanceCard
                  symbol="sovaBTC"
                  name="Sova Bitcoin"
                  balance={sovaBTCBalance}
                  primary={true}
                />
                <TokenBalanceCard
                  symbol="WBTC"
                  name="Wrapped Bitcoin"
                  balance={wbtcBalance}
                />
                <TokenBalanceCard
                  symbol="LBTC"
                  name="Liquid Bitcoin"
                  balance={lbtcBalance}
                />
                <TokenBalanceCard
                  symbol="USDC"
                  name="USD Coin"
                  balance={usdcBalance}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-slate-600">
                  {!isConnected 
                    ? 'Connect wallet to view balances'
                    : 'Switch to Base Sepolia to view balances'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Trading Actions */}
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center">
            <h2 className={`${designSystem.typography.h2} mb-4 text-slate-900`}>
              DeFi Actions
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Wrap your Bitcoin assets, earn rewards through staking, and manage redemptions all in one place.
            </p>
          </div>

          {/* Top Row: Wrap and Redeem */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <DepositForm />
            <div>
              <RedemptionForm />
            </div>
          </div>

          {/* Bottom Row: Staking */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <StakeForm />
            <RewardsDisplay 
              stakingAddress={CONTRACT_ADDRESSES[baseSepolia.id].STAKING}
              onRewardsClaimed={() => {
                console.log('Rewards claimed - refreshing balances');
                // Refresh token balances here if needed
              }}
            />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-16">
          <div className={`${componentStyles.card.base} p-8`}>
            <div className="text-center mb-8">
              <h2 className={`${designSystem.typography.h2} mb-4 text-slate-900`}>
                Ecosystem Features
              </h2>
              <p className="text-lg text-slate-600">
                Experience the complete Bitcoin DeFi ecosystem with advanced features and seamless user experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${componentStyles.card.interactive} p-6 text-center group`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">Wrap Tokens</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Deposit WBTC, LBTC, or USDC to get sovaBTC instantly with minimal fees and maximum security.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-600">Active</span>
                </div>
              </div>
              
              <div className={`${componentStyles.card.interactive} p-6 text-center group`}>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Repeat className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">Redeem Tokens</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Queue redemptions and get your original tokens back through our efficient redemption system.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-600">Active</span>
                </div>
              </div>
              
              <div className={`${componentStyles.card.interactive} p-6 text-center group relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-green-500/25">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Stake & Earn</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Stake sovaBTC and earn SOVA token rewards with competitive APY and flexible terms.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-green-700">LIVE • Earning Rewards</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Base Sepolia Testnet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real Contract Integration</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Powered by</span>
                  <span className="font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    SovaBTC Protocol
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TokenBalanceCardProps {
  symbol: string;
  name: string;
  balance: ReturnType<typeof useTokenBalance>;
  primary?: boolean;
}

function TokenBalanceCard({ symbol, name, balance, primary = false }: TokenBalanceCardProps) {
  return (
    <div className={`flex justify-between items-center p-4 rounded-lg border transition-all duration-200 ${
      primary 
        ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200/60' 
        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
          primary 
            ? 'bg-gradient-to-r from-orange-500 to-pink-500' 
            : 'bg-gradient-to-r from-slate-400 to-slate-500'
        }`}>
          {symbol.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className={`font-semibold ${primary ? 'text-slate-900' : 'text-slate-800'}`}>{symbol}</p>
          <p className="text-sm text-slate-600">{name}</p>
        </div>
      </div>
      <div className="text-right">
        {balance.isLoading ? (
          <div className="w-20 h-5 bg-slate-200 rounded animate-pulse"></div>
        ) : (
          <p className={`font-mono text-sm ${primary ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
            {balance.displayBalance}
          </p>
        )}
        {balance.error && (
          <p className="text-xs text-red-500 mt-1">Error loading</p>
        )}
      </div>
    </div>
  );
}
