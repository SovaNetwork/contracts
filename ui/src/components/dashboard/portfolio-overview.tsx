'use client'

import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Bitcoin, TrendingUp, Wallet, Sparkles, DollarSign } from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const statsVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
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
        <Card className="defi-card border-2 border-dashed border-white/20 hover:border-defi-purple-500/30 transition-all duration-300">
          <CardContent className="flex items-center justify-center p-16">
            <div className="text-center space-y-6">
              <motion.div 
                className="w-20 h-20 mx-auto rounded-full bg-defi-gradient-subtle flex items-center justify-center relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Wallet className="h-10 w-10 text-defi-purple-400" />
                <div className="absolute -inset-2 bg-defi-purple-500/20 rounded-full blur-md animate-pulse" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold gradient-text">Connect Wallet</h3>
                <p className="text-defi-gray-400 max-w-sm leading-relaxed">
                  Connect your wallet to view your SovaBTC portfolio and earnings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={cardVariants}>
      <Card className="defi-card group">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4">
            <motion.div 
              className="p-3 rounded-xl bg-defi-gradient-subtle relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Bitcoin className="h-6 w-6 text-defi-purple-400" />
              <div className="absolute -inset-1 bg-defi-purple-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            <div className="flex-1">
              <span className="gradient-text text-xl font-bold">Portfolio Overview</span>
              <p className="text-sm text-defi-gray-400 mt-1">Your DeFi positions</p>
            </div>
            <Sparkles className="h-5 w-5 text-defi-pink-400 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Enhanced Total Value */}
          <div className="text-center space-y-4 relative">
            <div className="space-y-2">
              <p className="text-sm text-defi-gray-400 font-medium">Total Portfolio Value</p>
              <motion.div
                className="relative"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-5xl font-bold gradient-text">
                  {formatUSD(totalValue)}
                </p>
                <div className="absolute -inset-4 bg-defi-gradient-glow rounded-xl opacity-20 blur-xl" />
              </motion.div>
            </div>
            
            <motion.div 
              className="flex items-center justify-center gap-2 text-sm defi-badge-success px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">+2.4% (24h)</span>
            </motion.div>
          </div>

          {/* Enhanced Asset Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enhanced SovaBTC Balance */}
            <motion.div 
              className="space-y-4 defi-stats-card p-5 rounded-xl"
              variants={statsVariants}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base relative">
                    ₿
                    <div className="absolute -inset-1 bg-orange-500/30 rounded-full blur-sm animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">SovaBTC</p>
                    <p className="text-xs text-defi-gray-400">Bitcoin-backed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {sovaBTCBalance.isLoading ? (
                      <span className="defi-skeleton w-20 h-4 rounded inline-block"></span>
                    ) : (
                      `${formatTokenAmount(sovaBTCBalance.balance, 8)} sovaBTC`
                    )}
                  </p>
                  <p className="text-xs text-defi-gray-400 font-medium">
                    {formatUSD(sovaBTCValue)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-defi-gray-400">
                  <span>Portfolio weight</span>
                  <span className="font-medium">{totalValue > 0 ? ((sovaBTCValue / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress 
                  value={totalValue > 0 ? (sovaBTCValue / totalValue) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </motion.div>

            {/* Enhanced SOVA Balance */}
            <motion.div 
              className="space-y-4 defi-stats-card p-5 rounded-xl"
              variants={statsVariants}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-defi-purple-400 to-defi-pink-400 flex items-center justify-center text-white font-bold text-base relative">
                    S
                    <div className="absolute -inset-1 bg-defi-purple-500/30 rounded-full blur-sm animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">SOVA</p>
                    <p className="text-xs text-defi-gray-400">Reward token</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {sovaTokenBalance.isLoading ? (
                      <span className="defi-skeleton w-20 h-4 rounded inline-block"></span>
                    ) : (
                      `${formatTokenAmount(sovaTokenBalance.balance, 18)} SOVA`
                    )}
                  </p>
                  <p className="text-xs text-defi-gray-400 font-medium">
                    {formatUSD(sovaValue)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-defi-gray-400">
                  <span>Portfolio weight</span>
                  <span className="font-medium">{totalValue > 0 ? ((sovaValue / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress 
                  value={totalValue > 0 ? (sovaValue / totalValue) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </motion.div>
          </div>

          {/* Enhanced Quick Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-4 pt-6 border-t defi-separator"
            variants={statsVariants}
          >
            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-defi-purple-400 rounded-full animate-pulse" />
                <p className="text-xs text-defi-gray-400 font-medium">Staked</p>
              </div>
              <p className="text-lg font-bold text-white group-hover:text-defi-purple-300 transition-colors">85%</p>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-3 w-3 text-defi-green-400" />
                <p className="text-xs text-defi-gray-400 font-medium">APY</p>
              </div>
              <p className="text-lg font-bold text-defi-green-400 group-hover:scale-110 transition-transform">12.4%</p>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-3 w-3 text-defi-purple-400" />
                <p className="text-xs text-defi-gray-400 font-medium">Rewards</p>
              </div>
              <p className="text-lg font-bold text-defi-purple-400 group-hover:scale-110 transition-transform">Active</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 