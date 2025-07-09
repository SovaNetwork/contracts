'use client';

import { motion } from 'framer-motion';
import { ArrowUpDown, Zap, Shield, Globe, Coins, TrendingUp, Users, Lock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { UnifiedSwapInterface } from '@/components/swap/UnifiedSwapInterface';

export default function SwapPage() {
  const features = [
    {
      icon: Globe,
      title: 'Cross-Network Discovery',
      description: 'Browse and access sovaBTC across all LayerZero V2 supported networks'
    },
    {
      icon: ArrowUpDown,
      title: 'Unified Operations',
      description: 'Seamlessly wrap Bitcoin tokens or bridge sovaBTC without switching interfaces'
    },
    {
      icon: Zap,
      title: 'Intelligent Routing',
      description: 'Automatically detect optimal wrapping or bridging routes based on fees and network conditions'
    },
    {
      icon: Coins,
      title: 'Multi-Token Support',
      description: 'Convert WBTC, LBTC, USDC into sovaBTC with automatic decimal conversion'
    },
    {
      icon: TrendingUp,
      title: 'Portfolio Integration',
      description: 'View all Bitcoin-backed holdings and sovaBTC positions across networks'
    },
    {
      icon: Lock,
      title: 'Security First',
      description: 'Built on proven LayerZero V2 infrastructure with comprehensive security guarantees'
    }
  ];

  const supportedNetworks = [
    { name: 'Base Sepolia', eid: '40245', status: 'active', primary: true },
    { name: 'Optimism Sepolia', eid: '40232', status: 'active', primary: false },
    { name: 'Ethereum Sepolia', eid: '40161', status: 'available', primary: false }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-sova-black-900 via-sova-black-800 to-sova-black-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            
          </motion.div>



          {/* Main Swap Interface - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-20 mb-16"
          >
            <UnifiedSwapInterface />
          </motion.div>

          {/* Features & Network Status - Below Main Interface */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-24">
            {/* Network Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="defi-card p-6">
                <h3 className="text-xl font-semibold mb-4 gradient-text flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Network Status
                </h3>
                <div className="space-y-3">
                  {supportedNetworks.map((network) => (
                    <div key={network.eid} className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                      <div>
                        <span className="font-medium">{network.name}</span>
                        <div className="text-xs text-foreground/60">EID: {network.eid}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {network.primary && (
                          <span className="text-xs bg-defi-purple/20 text-defi-purple px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          network.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-foreground/60 mt-4">
                  All networks support bidirectional sovaBTC transfers via LayerZero V2.
                </p>
              </div>
            </motion.div>

            {/* Key Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold mb-6 gradient-text">
                Why Use Unified Swap?
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="defi-card p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-r from-defi-purple to-defi-pink rounded-lg flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">{feature.title}</h4>
                        <p className="text-foreground/70 text-xs leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative z-10 mb-16"
          >
            <h2 className="text-3xl font-bold gradient-text text-center mb-12">
              How Unified Swap Works
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Select Token</h3>
                <p className="text-foreground/70 text-sm">
                  Browse tokens across all networks or pick from your portfolio
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Detection</h3>
                <p className="text-foreground/70 text-sm">
                  Interface automatically detects if wrapping or bridging is needed
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Optimal Route</h3>
                <p className="text-foreground/70 text-sm">
                  Get best rates and lowest fees with intelligent route optimization
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2">Execute & Track</h3>
                <p className="text-foreground/70 text-sm">
                  Complete transactions with real-time status tracking
                </p>
              </div>
            </div>
          </motion.div>

          {/* Supported Operations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="defi-card p-8">
              <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                <Coins className="w-6 h-6 mr-3" />
                Token Wrapping
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>WBTC → sovaBTC</span>
                  <span className="text-green-400 text-sm">8 decimals</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>LBTC → sovaBTC</span>
                  <span className="text-green-400 text-sm">8 decimals</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>USDC → sovaBTC</span>
                  <span className="text-blue-400 text-sm">6 → 8 decimals</span>
                </div>
              </div>
              <p className="text-sm text-foreground/60 mt-4">
                Automatic decimal conversion ensures seamless Bitcoin-standard precision.
              </p>
            </div>

            <div className="defi-card p-8">
              <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                <ArrowUpDown className="w-6 h-6 mr-3" />
                Cross-Chain Bridge
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>Base ↔ Optimism</span>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>Base ↔ Ethereum</span>
                  <span className="text-yellow-400 text-sm">Available</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg">
                  <span>Optimism ↔ Ethereum</span>
                  <span className="text-yellow-400 text-sm">Available</span>
                </div>
              </div>
              <p className="text-sm text-foreground/60 mt-4">
                LayerZero V2 OFT enables true omnichain transfers without liquidity pools.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 