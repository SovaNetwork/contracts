'use client'

import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Bitcoin, TrendingUp, Shield, Zap, Users, Target, ArrowUpRight, ExternalLink } from 'lucide-react'
import StatsOverview from '@/components/home/stats-overview'
import QuickActions from '@/components/home/quick-actions'
import FeatureShowcase from '@/components/home/feature-showcase'
import RecentActivity from '@/components/home/recent-activity'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

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

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-mesh-dark">
      {/* Hero Section */}
      <motion.section 
        className="relative overflow-hidden pt-16 pb-32"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 backdrop-pattern opacity-30" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-bitcoin-500/10 rounded-full blur-3xl floating" />
        <div className="absolute top-40 right-10 w-24 h-24 bg-neon-500/10 rounded-full blur-2xl floating-delayed" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl floating" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div variants={fadeInUp} className="mb-8">
              <Badge className="status-badge-info mb-6">
                <Zap className="w-4 h-4" />
                Powered by Bitcoin. Secured by Base.
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bitcoin-gradient-text">Bitcoin</span>
                <br />
                <span className="aurora-text">DeFi Revolution</span>
              </h1>
              <p className="text-xl md:text-2xl text-obsidian-300 max-w-3xl mx-auto leading-relaxed">
                Experience the future of Bitcoin finance with SovaBTC. Wrap, stake, and earn with
                institutional-grade security and maximum yield opportunities.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="neo-button text-lg px-8 py-4 h-auto">
                <Link href="/wrap">
                  Start Earning
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="neo-button-secondary text-lg px-8 py-4 h-auto">
                <Link href="/portfolio">
                  View Portfolio
                  <Target className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-8 text-sm text-obsidian-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Audited & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-bitcoin-500" />
                <span>Maximum Yield</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-500" />
                <span>Community Driven</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Overview */}
      <motion.section 
        className="relative py-16 -mt-16"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsOverview />
        </div>
      </motion.section>

      {/* Quick Actions */}
      {isConnected && (
        <motion.section 
          className="py-16"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="aurora-text">Quick Actions</span>
              </h2>
              <p className="text-obsidian-300 text-lg max-w-2xl mx-auto">
                Fast-track your Bitcoin DeFi journey with one-click actions
              </p>
            </motion.div>
            <QuickActions />
          </div>
        </motion.section>
      )}

      {/* Feature Showcase */}
      <motion.section 
        className="py-16 relative"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="absolute inset-0 backdrop-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bitcoin-gradient-text">Why Choose SovaBTC?</span>
            </h2>
            <p className="text-obsidian-300 text-lg max-w-2xl mx-auto">
              Built for the next generation of Bitcoin DeFi with cutting-edge technology
            </p>
          </motion.div>
          <FeatureShowcase />
        </div>
      </motion.section>

      {/* Recent Activity */}
      {isConnected && (
        <motion.section 
          className="py-16"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="aurora-text">Recent Activity</span>
              </h2>
              <p className="text-obsidian-300 text-lg max-w-2xl mx-auto">
                Track your latest transactions and portfolio performance
              </p>
            </motion.div>
            <RecentActivity />
          </div>
        </motion.section>
      )}

      {/* Call to Action */}
      <motion.section 
        className="py-20 relative"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-bitcoin-500/10 via-neon-500/10 to-emerald-500/10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="aurora-text">Ready to Start Your Bitcoin DeFi Journey?</span>
            </h2>
            <p className="text-obsidian-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already earning with SovaBTC. 
              Start with as little as 0.001 BTC and watch your portfolio grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="neo-button text-lg px-8 py-4 h-auto">
                <Link href="/wrap">
                  Get Started Now
                  <Bitcoin className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="neo-button-secondary text-lg px-8 py-4 h-auto">
                <Link href="https://docs.sovabtc.com" target="_blank" rel="noopener noreferrer">
                  Read Documentation
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
