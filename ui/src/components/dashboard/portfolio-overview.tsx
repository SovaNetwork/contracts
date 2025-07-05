'use client'

import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Bitcoin, TrendingUp, Wallet } from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function PortfolioOverview() {
  const { isConnected } = useAccount()
  
  const sovaBTCBalance = useTokenBalance(
    CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC
  )
  
  const sovaTokenBalance = useTokenBalance(
    CONTRACT_ADDRESSES[baseSepolia.id].SOVA_TOKEN
  )

  // Mock BTC price for USD calculations
  const btcPrice = 45000
  const sovaPrice = 0.1

  const sovaBTCValue = Number(sovaBTCBalance.formattedBalance) * btcPrice
  const sovaValue = Number(sovaTokenBalance.formattedBalance) * sovaPrice
  const totalValue = sovaBTCValue + sovaValue

  if (!isConnected) {
    return (
      <motion.div variants={cardVariants}>
        <Card className="defi-card border-2 border-dashed border-white/20">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-defi-purple-500/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-defi-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Connect Wallet</h3>
              <p className="text-slate-400 max-w-sm">
                Connect your wallet to view your SovaBTC portfolio and earnings
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={cardVariants}>
      <Card className="defi-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-defi-purple-500/20">
              <Bitcoin className="h-5 w-5 text-defi-purple-400" />
            </div>
            <span className="gradient-text">Portfolio Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Value */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400">Total Portfolio Value</p>
            <motion.p 
              className="text-4xl font-bold gradient-text"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatUSD(totalValue)}
            </motion.p>
            <div className="flex items-center justify-center gap-1 text-sm text-defi-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+2.4% (24h)</span>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* SovaBTC Balance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    ₿
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">SovaBTC</p>
                    <p className="text-xs text-slate-400">Bitcoin-backed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {sovaBTCBalance.isLoading ? (
                      <span className="shimmer w-16 h-4 rounded inline-block"></span>
                    ) : (
                      `${formatTokenAmount(sovaBTCBalance.balance, 8)} sovaBTC`
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatUSD(sovaBTCValue)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Portfolio weight</span>
                  <span>{totalValue > 0 ? ((sovaBTCValue / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress 
                  value={totalValue > 0 ? (sovaBTCValue / totalValue) * 100 : 0} 
                  className="h-2 bg-slate-800"
                />
              </div>
            </div>

            {/* SOVA Balance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple-400 to-defi-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    S
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">SOVA</p>
                    <p className="text-xs text-slate-400">Reward token</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {sovaTokenBalance.isLoading ? (
                      <span className="shimmer w-16 h-4 rounded inline-block"></span>
                    ) : (
                      `${formatTokenAmount(sovaTokenBalance.balance, 18)} SOVA`
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatUSD(sovaValue)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Portfolio weight</span>
                  <span>{totalValue > 0 ? ((sovaValue / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress 
                  value={totalValue > 0 ? (sovaValue / totalValue) * 100 : 0} 
                  className="h-2 bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-slate-400">Staked</p>
              <p className="text-sm font-semibold text-white">85%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">APY</p>
              <p className="text-sm font-semibold text-defi-green-400">12.4%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Rewards</p>
              <p className="text-sm font-semibold text-defi-purple-400">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 