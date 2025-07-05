'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bitcoin, ArrowRight, Shield, Zap, TrendingUp, Info, ExternalLink } from 'lucide-react'
import { useAccount } from 'wagmi'
import { DepositForm } from '@/components/wrap/deposit-form'

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

export default function WrapPage() {
  const { isConnected } = useAccount()

  const benefits = [
    {
      icon: Shield,
      title: "Secure Wrapping",
      description: "Multi-signature custody with transparent reserves",
      color: "emerald"
    },
    {
      icon: Zap,
      title: "Instant Conversion",
      description: "Convert to SovaBTC in seconds",
      color: "bitcoin"
    },
    {
      icon: TrendingUp,
      title: "Start Earning",
      description: "Immediately eligible for staking rewards",
      color: "neon"
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-bitcoin-500/20 to-bitcoin-600/20 flex items-center justify-center">
                <Bitcoin className="w-10 h-10 text-bitcoin-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bitcoin-gradient-text">Connect Your Wallet</span>
              </h1>
              <p className="text-xl text-obsidian-300 max-w-2xl mx-auto leading-relaxed">
                Connect your wallet to start wrapping Bitcoin tokens into SovaBTC and unlock DeFi opportunities.
              </p>
            </div>
            <Card className="neo-card max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <Info className="w-12 h-12 text-bitcoin-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-obsidian-50 mb-2">Wallet Required</h3>
                <p className="text-sm text-obsidian-400 mb-6">
                  Please connect your wallet to access the wrapping interface
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
                <Bitcoin className="w-4 h-4" />
                Bitcoin Wrapping Protocol
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bitcoin-gradient-text">Wrap Bitcoin</span>
                <br />
                <span className="aurora-text">Into DeFi</span>
              </h1>
              <p className="text-xl text-obsidian-300 max-w-3xl mx-auto leading-relaxed">
                Convert your Bitcoin tokens into SovaBTC and unlock the full potential of DeFi. 
                Earn rewards, provide liquidity, and maintain exposure to Bitcoin's price.
              </p>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid gap-6 md:grid-cols-3 mb-16"
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

      {/* Main Wrapping Interface */}
      <motion.section 
        className="pb-20"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Wrapping Form */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <Card className="neo-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-obsidian-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-bitcoin-500/20 to-bitcoin-600/20 flex items-center justify-center">
                        <Bitcoin className="w-4 h-4 text-bitcoin-400" />
                      </div>
                      Wrap Bitcoin Tokens
                    </CardTitle>
                    <Badge className="status-badge-info">
                      Ready to Wrap
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <DepositForm />
                </CardContent>
              </Card>
            </motion.div>

            {/* Protocol Information */}
            <motion.div variants={fadeInUp}>
              <div className="space-y-6">
                {/* Protocol Stats Card */}
                <Card className="neo-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-obsidian-50 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-bitcoin-400" />
                      Protocol Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-obsidian-400 text-sm">Total Wrapped</span>
                        <span className="text-obsidian-50 font-medium">12.45 BTC</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-obsidian-400 text-sm">Exchange Rate</span>
                        <span className="text-obsidian-50 font-medium">1:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-obsidian-400 text-sm">Network Fee</span>
                        <span className="text-emerald-400 font-medium">~$2.50</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Additional Info Card */}
                <Card className="neo-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-obsidian-50 flex items-center gap-2">
                      <Info className="w-5 h-5 text-neon-400" />
                      Important Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-obsidian-300 font-medium">1:1 Conversion</p>
                          <p className="text-obsidian-500">Each token wraps to equal SovaBTC</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-bitcoin-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-obsidian-300 font-medium">Instant Wrapping</p>
                          <p className="text-obsidian-500">Receive SovaBTC immediately</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-obsidian-300 font-medium">Start Earning</p>
                          <p className="text-obsidian-500">Stake to earn SOVA rewards</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="neo-separator" />
                    
                    <Button 
                      variant="outline" 
                      className="neo-button-secondary w-full"
                      onClick={() => window.open('https://docs.sovabtc.com/wrapping', '_blank')}
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