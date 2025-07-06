'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { useAccount } from 'wagmi'
import { 
  Bitcoin, 
  Shield, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Globe, 
  Lock,
  Users,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { useRedemptionStatus } from '@/hooks/web3/use-redemption-status'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { baseSepolia } from 'viem/chains'
import { formatTokenAmount, formatUSD } from '@/lib/utils'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }
}

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Hero Section Component
function HeroSection() {
  const { isConnected } = useAccount()
  
  return (
    <motion.section 
      variants={itemVariants}
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-30" />
      <div className="absolute inset-0 backdrop-pattern opacity-20" />
      
      {/* Floating Elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-bitcoin-500/20 to-neon-500/20 blur-xl"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute bottom-32 right-1/4 w-32 h-32 rounded-full bg-gradient-to-r from-emerald-500/20 to-bitcoin-500/20 blur-xl"
      />
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Badge className="status-badge-success mb-6 text-lg px-6 py-2">
            <Bitcoin className="w-5 h-5 mr-2" />
            Bitcoin DeFi Protocol
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="aurora-text">Sova</span>
            <span className="bitcoin-gradient-text">BTC</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-obsidian-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The next generation Bitcoin DeFi protocol. Wrap, stake, and earn with institutional-grade security on Base.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href={isConnected ? "/wrap" : "#"}>
            <Button className="neo-button group px-8 py-4 text-lg">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Link href="/portfolio">
            <Button variant="outline" className="neo-button-secondary px-8 py-4 text-lg">
              <BarChart3 className="mr-2 w-5 h-5" />
              View Portfolio
            </Button>
          </Link>
        </motion.div>
        
        {/* Protocol Stats */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <Suspense fallback={<StatsSkeleton />}>
            <HeroStats />
          </Suspense>
        </motion.div>
      </div>
    </motion.section>
  )
}

// Hero Stats Component
function HeroStats() {
  const stakingData = useStakingData(CONTRACT_ADDRESSES[baseSepolia.id].STAKING)
  
  const stats = [
    {
      label: "Total Value Locked",
      value: "$2.4M",
      icon: Lock,
      color: "emerald"
    },
    {
      label: "Staking APY",
      value: `${stakingData.apy.toFixed(2)}%`,
      icon: TrendingUp,
      color: "bitcoin"
    },
    {
      label: "Active Users",
      value: "1,247",
      icon: Users,
      color: "neon"
    }
  ]
  
  return (
    <>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="neo-card p-6 text-center"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-600/20 flex items-center justify-center mx-auto mb-4`}>
            <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
          </div>
          <div className="text-2xl font-bold text-obsidian-50 mb-2">{stat.value}</div>
          <div className="text-sm text-obsidian-400">{stat.label}</div>
        </motion.div>
      ))}
    </>
  )
}

// Quick Actions Component
function QuickActions() {
  const { isConnected } = useAccount()
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC)
  const stakingData = useStakingData(CONTRACT_ADDRESSES[baseSepolia.id].STAKING)
  const redemptionStatus = useRedemptionStatus(CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE)

  const actions = [
    {
      title: "Wrap Bitcoin",
      description: "Convert your Bitcoin to SovaBTC",
      icon: Zap,
      href: "/wrap",
      badge: "Start Here",
      badgeColor: "status-badge-success",
      available: isConnected,
      stats: "Multiple tokens supported",
      gradient: "from-bitcoin-500 to-bitcoin-600"
    },
    {
      title: "Stake SovaBTC",
      description: "Earn SOVA rewards by staking",
      icon: TrendingUp,
      href: "/stake",
      badge: `${stakingData.apy.toFixed(2)}% APY`,
      badgeColor: "status-badge-success",
      available: sovaBTCBalance.balance > BigInt(0),
      stats: formatTokenAmount(sovaBTCBalance.balance, 8) + " SovaBTC available",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Redeem Bitcoin",
      description: "Convert SovaBTC back to Bitcoin",
      icon: ArrowRight,
      href: "/redeem",
      badge: redemptionStatus.queueData.isActive ? "Active" : "Ready",
      badgeColor: redemptionStatus.queueData.isActive ? "status-badge-warning" : "status-badge-info",
      available: sovaBTCBalance.balance > BigInt(0),
      stats: redemptionStatus.queueData.isActive ? "Queue active" : "No queue",
      gradient: "from-neon-500 to-neon-600"
    },
    {
      title: "Portfolio",
      description: "View your positions and rewards",
      icon: BarChart3,
      href: "/portfolio",
      badge: "Track",
      badgeColor: "status-badge-info",
      available: isConnected,
      stats: "Real-time tracking",
      gradient: "from-sova-500 to-sova-600"
    }
  ]

  return (
    <motion.section 
      variants={itemVariants}
      className="py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="status-badge-info mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Actions
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 aurora-text">
            Everything You Need
          </h2>
          <p className="text-xl text-obsidian-300 max-w-3xl mx-auto">
            Access all protocol features with a single click. From wrapping to staking, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link href={action.available ? action.href : "#"}>
                <Card className="neo-card h-full cursor-pointer transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.gradient}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge className={action.badgeColor}>
                        {action.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-obsidian-50 group-hover:text-white transition-colors">
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-obsidian-300 mb-4 line-clamp-2">
                      {action.description}
                    </p>
                    <div className="text-sm text-obsidian-400">
                      {action.stats}
                    </div>
                    {!action.available && (
                      <div className="mt-3 text-xs text-obsidian-500">
                        {!isConnected ? "Connect wallet to use" : "Insufficient balance"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

// Feature Showcase Component
function FeatureShowcase() {
  const features = [
    {
      icon: Shield,
      title: "Institutional Security",
      description: "Multi-signature custody with transparent reserves and battle-tested smart contracts audited by leading security firms.",
      highlight: "99.9% Uptime",
      stats: ["Multi-sig Protection", "Reserve Transparency", "Insurance Coverage"]
    },
    {
      icon: TrendingUp,
      title: "Maximum Yield",
      description: "Optimized staking mechanisms deliver industry-leading APY with compound rewards and flexible withdrawal options.",
      highlight: "Up to 12% APY",
      stats: ["Compound Interest", "Flexible Terms", "Auto-Reinvest"]
    },
    {
      icon: Globe,
      title: "Cross-Chain Ready",
      description: "Seamless interoperability across multiple blockchain networks with unified liquidity and bridge protocols.",
      highlight: "5+ Networks",
      stats: ["Bridge Protocol", "Unified Liquidity", "Cross-Chain Swaps"]
    }
  ]

  return (
    <motion.section 
      variants={itemVariants}
      className="py-20 bg-gradient-to-b from-transparent to-obsidian-900/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="status-badge-success mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Why Choose SovaBTC
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bitcoin-gradient-text">
            Built for the Future
          </h2>
          <p className="text-xl text-obsidian-300 max-w-3xl mx-auto">
            Experience the next generation of Bitcoin DeFi with enterprise-grade security and maximum yield optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="neo-card h-full p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-bitcoin-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-bitcoin-400" />
                </div>
                
                <h3 className="text-2xl font-bold text-obsidian-50 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-obsidian-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mb-6">
                  <Badge className="status-badge-success text-base px-4 py-2">
                    {feature.highlight}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {feature.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex items-center justify-center text-sm text-obsidian-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                      {stat}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

// Loading Skeletons
function StatsSkeleton() {
  return (
    <>
      {[...Array(3)].map((_, index) => (
        <div key={index} className="neo-card p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-obsidian-800/50 mx-auto mb-4 shimmer" />
          <div className="h-6 w-16 bg-obsidian-800/50 rounded mx-auto mb-2 shimmer" />
          <div className="h-4 w-24 bg-obsidian-800/50 rounded mx-auto shimmer" />
        </div>
      ))}
    </>
  )
}

// Main Homepage Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-obsidian-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Hero Section */}
        <HeroSection />
        
        {/* Quick Actions */}
        <Suspense fallback={<div className="py-20" />}>
          <QuickActions />
        </Suspense>
        
        {/* Feature Showcase */}
        <FeatureShowcase />
        
        {/* Bottom CTA */}
        <motion.section 
          variants={itemVariants}
          className="py-20 text-center"
        >
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 aurora-text">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-obsidian-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users already earning with SovaBTC. Get started in minutes.
            </p>
            <Link href="/wrap">
              <Button className="neo-button group px-8 py-4 text-lg">
                Launch App
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
