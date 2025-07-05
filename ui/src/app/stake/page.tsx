'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Gift, Target, Info, ExternalLink, Calculator, Clock, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import StakingForm from '@/components/staking/staking-form'
import StakingStats from '@/components/staking/staking-stats'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Simple rewards calculator component
function RewardsCalculator() {
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState(7)

  const calculateRewards = () => {
    if (!amount) return 0
    const apy = period === 7 ? 8 : period === 30 ? 10 : 12
    return (Number(amount) * apy / 100) / 365 * period
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-obsidian-300 mb-2">
          Stake Amount (SovaBTC)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="neo-input"
          placeholder="0.00"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-obsidian-300 mb-2">
          Lock Period
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`p-3 rounded-lg border transition-colors ${
                period === days
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-obsidian-600 bg-obsidian-800/50 text-obsidian-400 hover:border-obsidian-500'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-obsidian-800/30 border border-obsidian-600">
        <div className="text-center">
          <p className="text-sm text-obsidian-400 mb-1">Estimated Rewards</p>
          <p className="text-2xl font-bold text-emerald-400">
            {calculateRewards().toFixed(6)} SOVA
          </p>
          <p className="text-xs text-obsidian-500">
            For {period} day lock period
          </p>
        </div>
      </div>
    </div>
  )
}

export default function StakePage() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'stake' | 'calculator'>('stake')

  const benefits = [
    {
      icon: TrendingUp,
      title: "High APY Returns",
      description: "Earn up to 12% APY on your SovaBTC",
      color: "emerald",
      stat: "12% APY"
    },
    {
      icon: Gift,
      title: "Daily Rewards",
      description: "Earn SOVA tokens daily automatically",
      color: "bitcoin",
      stat: "Daily Claims"
    },
    {
      icon: Clock,
      title: "Flexible Periods",
      description: "Choose from 7, 30, or 90-day lock periods",
      color: "neon",
      stat: "Flexible Lock"
    },
    {
      icon: Zap,
      title: "Auto-Compound",
      description: "Automatically reinvest rewards for maximum yield",
      color: "emerald",
      stat: "Auto-Compound"
    }
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-mesh-dark pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center py-20"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="aurora-text">Connect Your Wallet</span>
              </h1>
              <p className="text-xl text-obsidian-300 max-w-2xl mx-auto leading-relaxed">
                Connect your wallet to start staking SovaBTC and earning SOVA rewards with flexible lock periods.
              </p>
            </div>
            <Card className="neo-card max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <Info className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-obsidian-50 mb-2">Wallet Required</h3>
                <p className="text-sm text-obsidian-400 mb-6">
                  Please connect your wallet to access the staking interface
                </p>
                <Button className="neo-button w-full">
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh-dark pt-20">
      {/* Header Section */}
      <motion.section 
        className="relative py-16"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="absolute inset-0 backdrop-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp}>
              <Badge className="status-badge-success mb-6">
                <TrendingUp className="w-4 h-4" />
                Staking Protocol
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="aurora-text">Stake SovaBTC</span>
                <br />
                <span className="bitcoin-gradient-text">Earn SOVA</span>
              </h1>
              <p className="text-xl text-obsidian-300 max-w-3xl mx-auto leading-relaxed">
                Stake your SovaBTC tokens to earn SOVA rewards. Choose flexible lock periods 
                and enjoy industry-leading APY with auto-compound options.
              </p>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16"
            variants={staggerChildren}
          >
            {benefits.map((benefit, index) => (
              <motion.div key={benefit.title} variants={fadeInUp}>
                <Card className="neo-card group h-full">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r ${
                      benefit.color === 'bitcoin' ? 'from-bitcoin-500/20 to-bitcoin-600/20' :
                      benefit.color === 'neon' ? 'from-neon-500/20 to-neon-600/20' :
                      benefit.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                      'from-bitcoin-500/20 to-bitcoin-600/20'
                    } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`w-6 h-6 ${
                        benefit.color === 'bitcoin' ? 'text-bitcoin-400' :
                        benefit.color === 'neon' ? 'text-neon-400' :
                        benefit.color === 'emerald' ? 'text-emerald-400' :
                        'text-bitcoin-400'
                      }`} />
                    </div>
                    <div className={`text-lg font-bold mb-2 ${
                      benefit.color === 'bitcoin' ? 'text-bitcoin-400' :
                      benefit.color === 'neon' ? 'text-neon-400' :
                      benefit.color === 'emerald' ? 'text-emerald-400' :
                      'text-bitcoin-400'
                    }`}>
                      {benefit.stat}
                    </div>
                    <h3 className="text-lg font-semibold text-obsidian-50 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-obsidian-400">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Main Staking Interface */}
      <motion.section 
        className="pb-20"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Staking Form */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <Card className="neo-card">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl font-bold text-obsidian-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      Stake & Earn
                    </CardTitle>
                    <Badge className="status-badge-success">
                      Active
                    </Badge>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex gap-2">
                    <Button
                      variant={activeTab === 'stake' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('stake')}
                      className={activeTab === 'stake' ? 'neo-button' : 'neo-button-secondary'}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Stake
                    </Button>
                    <Button
                      variant={activeTab === 'calculator' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('calculator')}
                      className={activeTab === 'calculator' ? 'neo-button' : 'neo-button-secondary'}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculator
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'stake' ? (
                    <StakingForm />
                  ) : (
                    <RewardsCalculator />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Staking Information */}
            <motion.div variants={fadeInUp}>
              <div className="space-y-6">
                {/* Staking Stats */}
                <StakingStats />
                
                {/* Lock Periods Info */}
                <Card className="neo-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-obsidian-50 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-neon-400" />
                      Lock Periods & Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian-800/30">
                        <div>
                          <p className="text-obsidian-300 font-medium">7 Days</p>
                          <p className="text-obsidian-500">Basic rewards</p>
                        </div>
                        <span className="text-emerald-400 font-bold">8% APY</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian-800/30">
                        <div>
                          <p className="text-obsidian-300 font-medium">30 Days</p>
                          <p className="text-obsidian-500">Boosted rewards</p>
                        </div>
                        <span className="text-emerald-400 font-bold">10% APY</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian-800/30">
                        <div>
                          <p className="text-obsidian-300 font-medium">90 Days</p>
                          <p className="text-obsidian-500">Maximum rewards</p>
                        </div>
                        <span className="text-emerald-400 font-bold">12% APY</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* How It Works */}
                <Card className="neo-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-obsidian-50 flex items-center gap-2">
                      <Info className="w-5 h-5 text-bitcoin-400" />
                      How Staking Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 font-bold text-xs">1</span>
                        </div>
                        <div>
                          <p className="text-obsidian-300 font-medium">Stake SovaBTC</p>
                          <p className="text-obsidian-500">Lock your tokens for chosen period</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-bitcoin-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-bitcoin-400 font-bold text-xs">2</span>
                        </div>
                        <div>
                          <p className="text-obsidian-300 font-medium">Earn Rewards</p>
                          <p className="text-obsidian-500">Receive SOVA tokens daily</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-neon-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-neon-400 font-bold text-xs">3</span>
                        </div>
                        <div>
                          <p className="text-obsidian-300 font-medium">Claim or Compound</p>
                          <p className="text-obsidian-500">Withdraw or auto-compound rewards</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="neo-separator" />
                    
                    <Button 
                      variant="outline" 
                      className="neo-button-secondary w-full"
                      onClick={() => window.open('https://docs.sovabtc.com/staking', '_blank')}
                    >
                      Learn More
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}