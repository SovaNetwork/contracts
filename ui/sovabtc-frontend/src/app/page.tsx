'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useTokenBalance } from '../hooks/use-token-balance';
import { CONTRACT_ADDRESSES, TOKEN_CONFIGS } from '../contracts/addresses';
import { DepositForm } from '../components/wrap/deposit-form';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get token balances for Base Sepolia
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC);
  const wbtcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].WBTC_TEST);
  const lbtcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].LBTC_TEST);
  const usdcBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].USDC_TEST);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">SovaBTC</h1>
            <p className="text-lg text-gray-600">Bitcoin meets composability</p>
          </div>
          <ConnectButton />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Wallet Status</h2>
            {isConnected ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Connected Address:</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{address}</p>
                <p className="text-sm text-gray-600">Network:</p>
                <p className="font-semibold">{chainId === baseSepolia.id ? 'Base Sepolia' : 'Unsupported Network'}</p>
              </div>
            ) : (
              <p className="text-gray-600">Connect your wallet to get started</p>
            )}
          </div>

          {/* Token Balances */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Token Balances</h2>
            {isConnected && chainId === baseSepolia.id ? (
              <div className="space-y-4">
                <TokenBalanceCard
                  symbol="sovaBTC"
                  name="Sova Bitcoin"
                  balance={sovaBTCBalance}
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
              <p className="text-gray-600">
                {!isConnected 
                  ? 'Connect wallet to view balances'
                  : 'Switch to Base Sepolia to view balances'
                }
              </p>
            )}
          </div>
        </div>

        {/* Deposit Form */}
        <div className="mt-8">
          <DepositForm />
        </div>

        {/* Features Preview */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Wrap Tokens</h3>
              <p className="text-sm text-gray-600">Deposit WBTC, LBTC, or USDC to get sovaBTC</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Redeem Tokens</h3>
              <p className="text-sm text-gray-600">Queue redemptions and get your tokens back</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Stake & Earn</h3>
              <p className="text-sm text-gray-600">Stake sovaBTC and earn SOVA rewards</p>
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
}

function TokenBalanceCard({ symbol, name, balance }: TokenBalanceCardProps) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-semibold">{symbol}</p>
        <p className="text-sm text-gray-600">{name}</p>
      </div>
      <div className="text-right">
        {balance.isLoading ? (
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="font-mono text-sm">{balance.displayBalance}</p>
        )}
        {balance.error && (
          <p className="text-xs text-red-500">Error loading</p>
        )}
      </div>
    </div>
  );
}
