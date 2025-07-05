'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Shield, Zap, Coins, Sparkles, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PortfolioOverview = dynamic(() => import('@/components/dashboard/portfolio-overview').then(mod => ({ default: mod.PortfolioOverview })), {
  ssr: false,
  loading: () => <PortfolioSkeleton />
})

const QuickActions = dynamic(() => import('@/components/dashboard/quick-actions').then(mod => ({ default: mod.QuickActions })), {
  ssr: false,
  loading: () => <QuickActionsSkeleton />
})

const StatsGrid = dynamic(() => import('@/components/dashboard/stats-grid').then(mod => ({ default: mod.StatsGrid })), {
  ssr: false,
  loading: () => <StatsGridSkeleton />
})

const RecentActivity = dynamic(() => import('@/components/dashboard/recent-activity').then(mod => ({ default: mod.RecentActivity })), {
  ssr: false,
  loading: () => <ActivitySkeleton />
})

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
  visible: { y: 0, opacity: 1 }
}

const heroVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const features = [
  {
    icon: Shield,
    title: "Secure Wrapping",
    description: "Multi-signature custody with transparent reserves and institutional-grade security",
    color: "from-defi-purple-500 to-defi-blue-500"
  },
  {
    icon: TrendingUp,
    title: "Yield Generation",
    description: "Earn SOVA rewards through optimized staking mechanisms and yield farming",
    color: "from-defi-green-500 to-defi-blue-500"
  },
  {
    icon: Zap,
    title: "Fast Redemption",
    description: "Efficient queue system with predictable timing and instant fulfillment",
    color: "from-defi-pink-500 to-defi-purple-500"
  },
  {
    icon: Coins,
    title: "Multi-Chain",
    description: "Cross-chain Bitcoin representation with seamless interoperability",
    color: "from-defi-blue-500 to-defi-purple-500"
  }
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-16"
      >
        {/* Enhanced Hero Section */}
        <motion.div variants={heroVariants} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center space-y-8 relative">
          <div className="relative">
            <motion.h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold gradient-text leading-tight relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              Next-Gen Bitcoin DeFi
            </motion.h1>
            <div className="absolute -inset-8 bg-defi-gradient-glow rounded-3xl opacity-20 blur-3xl -z-10" />
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-defi-pink-400 animate-pulse" />
            <Sparkles className="absolute -bottom-4 -left-4 h-6 w-6 text-defi-blue-400 animate-pulse" style={{ animationDelay: '1s' } as React.CSSProperties} />
          </div>
          
          <motion.p 
            className="text-xl md:text-2xl text-defi-gray-400 max-w-3xl mx-auto leading-relaxed font-medium"
            variants={itemVariants}
          >
            Wrap, stake, and earn with Bitcoin-backed tokens. Professional DeFi experience 
            with institutional-grade security and transparency.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            variants={itemVariants}
          >
            <Link href="/wrap">
              <Button size="lg" className="defi-button h-14 px-8 text-lg font-semibold group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline" size="lg" className="defi-button-secondary h-14 px-8 text-lg font-semibold">
                View Portfolio
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div variants={itemVariants}>
          <StatsGrid />
        </motion.div>

        {/* Enhanced Main Dashboard */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PortfolioOverview />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        </div>

        {/* Enhanced Recent Activity */}
        <motion.div variants={itemVariants}>
          <RecentActivity />
        </motion.div>

        {/* Enhanced Features Grid */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Why Choose SovaBTC?</h2>
            <p className="text-lg text-defi-gray-400 max-w-2xl mx-auto">
              Experience the future of Bitcoin DeFi with cutting-edge technology and unmatched security
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="defi-stats-card p-8 text-center space-y-6 group relative overflow-hidden"
              >
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300 relative`}>
                    <feature.icon className="h-8 w-8 text-white" />
                    <div className="absolute -inset-2 bg-gradient-to-r from-defi-purple-500/30 to-defi-pink-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-defi-purple-300 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-defi-gray-400 leading-relaxed group-hover:text-defi-gray-300 transition-colors">{feature.description}</p>
                </div>
                
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-defi-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                
                {/* Feature number indicator */}
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-defi-gradient-subtle flex items-center justify-center">
                  <span className="text-xs font-bold text-defi-purple-300">{index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action Section */}
        <motion.div 
          variants={itemVariants}
          className="text-center space-y-8 py-16 relative"
        >
          <div className="relative">
            <h3 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-defi-gray-400 max-w-2xl mx-auto">
              Join thousands of users who trust SovaBTC for their Bitcoin DeFi needs
            </p>
            <div className="absolute -inset-4 bg-defi-gradient-glow rounded-2xl opacity-10 blur-2xl -z-10" />
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/wrap">
              <Button size="lg" className="defi-button h-16 px-12 text-xl font-bold">
                Start Wrapping Bitcoin
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function QuickActionsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-defi-gray-700/50 rounded-lg defi-skeleton" />
        <div className="h-6 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="defi-stats-card p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 bg-defi-gray-700/50 rounded-lg defi-skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-defi-gray-700/50 rounded defi-skeleton" />
                <div className="h-3 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-defi-gray-700/50 rounded-lg defi-skeleton" />
        <div className="h-6 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 bg-defi-gray-700/50 rounded-lg defi-skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-defi-gray-700/50 rounded defi-skeleton" />
              <div className="h-3 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="defi-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
        <div className="h-4 w-20 bg-defi-gray-700/50 rounded defi-skeleton" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-8 w-40 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-3 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-8 w-40 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-3 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
        </div>
      </div>
    </div>
  )
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="defi-stats-card p-6 space-y-4">
          <div className="h-4 w-20 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-8 w-32 bg-defi-gray-700/50 rounded defi-skeleton" />
          <div className="h-3 w-24 bg-defi-gray-700/50 rounded defi-skeleton" />
        </div>
      ))}
    </div>
  )
}
