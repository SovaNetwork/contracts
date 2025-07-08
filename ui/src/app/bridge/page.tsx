'use client';

import { motion } from 'framer-motion';
import { ArrowLeftRight, Zap, Shield, Clock } from 'lucide-react';
import { BridgeInterface } from '@/components/bridge/BridgeInterface';
import { Header } from '@/components/layout/Header';

export default function BridgePage() {
  const features = [
    {
      icon: ArrowLeftRight,
      title: 'Omnichain Transfer',
      description: 'True cross-chain transfers powered by LayerZero V2 protocol'
    },
    {
      icon: Zap,
      title: 'Burn & Mint',
      description: 'No liquidity pools needed - tokens are burned on source and minted on destination'
    },
    {
      icon: Shield,
      title: 'Secure Messaging',
      description: 'Verified cross-chain messages with LayerZero security guarantees'
    },
    {
      icon: Clock,
      title: 'Fast Settlement',
      description: 'Cross-chain transfers typically complete in 5-10 minutes'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sova-black-900 via-sova-black-800 to-sova-black-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold gradient-text mb-6">
              Cross-Chain Bridge
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Bridge sovaBTC seamlessly across multiple blockchains with LayerZero&apos;s 
              omnichain infrastructure. True cross-chain transfers without liquidity constraints.
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-24">
            {/* Bridge Interface */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-20"
            >
              <BridgeInterface />
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-6">
                  LayerZero OFT Features
                </h2>
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="defi-card p-6 hover:scale-105 transition-transform duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gradient-to-r from-defi-purple to-defi-pink rounded-lg">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                          <p className="text-foreground/70">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Network Support */}
              <div className="defi-card p-6">
                <h3 className="text-xl font-semibold mb-4 gradient-text">
                  Supported Networks
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <span className="font-medium">Ethereum Sepolia</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <span className="font-medium">Base Sepolia</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <span className="font-medium">Optimism Sepolia</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 mt-4">
                  All networks support bidirectional transfers with unified token supply.
                </p>
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-3xl font-bold gradient-text text-center mb-12">
              How LayerZero Bridge Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Select Networks</h3>
                <p className="text-foreground/70">
                  Choose source and destination networks from supported chains
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Burn & Send</h3>
                <p className="text-foreground/70">
                  Tokens are burned on source chain and message sent via LayerZero
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Mint & Receive</h3>
                <p className="text-foreground/70">
                  Equivalent tokens are minted on destination chain to your address
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-16 defi-card p-8"
          >
            <h2 className="text-2xl font-bold gradient-text mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">What is LayerZero OFT?</h3>
                <p className="text-foreground/70 text-sm">
                  Omnichain Fungible Token (OFT) is a token standard that enables seamless 
                  cross-chain transfers without traditional bridges or liquidity pools.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">How long do transfers take?</h3>
                <p className="text-foreground/70 text-sm">
                  Cross-chain transfers typically complete in 5-10 minutes, depending on 
                  network congestion and confirmation requirements.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Are there any fees?</h3>
                <p className="text-foreground/70 text-sm">
                  Yes, LayerZero charges messaging fees for cross-chain communication. 
                  Fees are displayed before confirming transactions.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Is it secure?</h3>
                <p className="text-foreground/70 text-sm">
                  LayerZero V2 provides industry-leading security with configurable DVNs 
                  (Decentralized Verifier Networks) and immutable message verification.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 