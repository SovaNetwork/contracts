'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, TrendingUp, Zap, Network, Lock, Users, Layers, Clock } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
}

export default function FeatureShowcase() {
  const features = [
    {
      icon: Shield,
      title: "Institutional Security",
      description: "Multi-signature custody with transparent reserves and battle-tested smart contracts audited by leading security firms.",
      color: "emerald",
      badge: "Audited",
      highlight: "99.9% Uptime",
      stats: ["Multi-sig Protection", "Reserve Transparency", "Insurance Coverage"]
    },
    {
      icon: TrendingUp,
      title: "Maximum Yield",
      description: "Optimized staking mechanisms deliver industry-leading APY with compound rewards and flexible withdrawal options.",
      color: "bitcoin",
      badge: "High APY",
      highlight: "Up to 12% APY",
      stats: ["Compound Interest", "Flexible Terms", "Auto-Reinvest"]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built on Base for instant transactions with minimal fees. No more waiting for Bitcoin confirmations.",
      color: "neon",
      badge: "Base Network",
      highlight: "< 2s Settlement",
      stats: ["Instant Transfers", "Low Gas Fees", "L2 Scaling"]
    },
    {
      icon: Network,
      title: "Cross-Chain Ready",
      description: "Seamless interoperability across multiple blockchain networks with unified liquidity and bridge protocols.",
      color: "bitcoin",
      badge: "Multi-Chain",
      highlight: "5+ Networks",
      stats: ["Bridge Protocol", "Unified Liquidity", "Cross-Chain Swaps"]
    },
    {
      icon: Lock,
      title: "Non-Custodial",
      description: "Your keys, your Bitcoin. Maintain full control over your assets with decentralized smart contract architecture.",
      color: "emerald",
      badge: "Self-Custody",
      highlight: "Your Keys",
      stats: ["Non-Custodial", "Smart Contracts", "Decentralized"]
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Governed by the community with transparent voting mechanisms and regular protocol improvements.",
      color: "neon",
      badge: "DAO Governance",
      highlight: "Community Owned",
      stats: ["Voting Rights", "Proposals", "Transparent"]
    },
    {
      icon: Layers,
      title: "Modular Design",
      description: "Flexible architecture allows for easy integration with DeFi protocols and third-party applications.",
      color: "bitcoin",
      badge: "Composable",
      highlight: "DeFi Ready",
      stats: ["Modular", "Integrations", "Composable"]
    },
    {
      icon: Clock,
      title: "24/7 Operations",
      description: "Round-the-clock monitoring and automated systems ensure continuous operation and instant support.",
      color: "emerald",
      badge: "Always On",
      highlight: "24/7 Support",
      stats: ["Monitoring", "Automation", "Support"]
    }
  ]

  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      {features.map((feature) => (
        <motion.div key={feature.title} variants={fadeInUp}>
          <Card className="neo-card group h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  feature.color === 'bitcoin' ? 'from-bitcoin-500/20 to-bitcoin-600/20' :
                  feature.color === 'neon' ? 'from-neon-500/20 to-neon-600/20' :
                  feature.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                  'from-bitcoin-500/20 to-bitcoin-600/20'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${
                    feature.color === 'bitcoin' ? 'text-bitcoin-400' :
                    feature.color === 'neon' ? 'text-neon-400' :
                    feature.color === 'emerald' ? 'text-emerald-400' :
                    'text-bitcoin-400'
                  }`} />
                </div>
                <Badge className={`status-badge-${feature.color === 'bitcoin' ? 'warning' : feature.color === 'neon' ? 'info' : 'success'}`}>
                  {feature.badge}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-obsidian-50 mb-2">
                {feature.title}
              </CardTitle>
              <div className={`text-lg font-bold ${
                feature.color === 'bitcoin' ? 'text-bitcoin-400' :
                feature.color === 'neon' ? 'text-neon-400' :
                feature.color === 'emerald' ? 'text-emerald-400' :
                'text-bitcoin-400'
              }`}>
                {feature.highlight}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-obsidian-400 mb-4 leading-relaxed">
                {feature.description}
              </p>
              <div className="space-y-2">
                {feature.stats.map((stat, statIndex) => (
                  <div key={statIndex} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      feature.color === 'bitcoin' ? 'bg-bitcoin-500' :
                      feature.color === 'neon' ? 'bg-neon-500' :
                      feature.color === 'emerald' ? 'bg-emerald-500' :
                      'bg-bitcoin-500'
                    }`} />
                    <span className="text-xs text-obsidian-500">{stat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}