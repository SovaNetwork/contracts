'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpDown, Coins, Timer, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const actionVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

const actions = [
  {
    title: 'Wrap Tokens',
    description: 'Convert BTC assets to SovaBTC',
    icon: ArrowUpDown,
    href: '/wrap',
    gradient: 'from-defi-purple-500 to-defi-pink-500',
    bgGradient: 'from-defi-purple-500/10 to-defi-pink-500/10',
    borderGradient: 'from-defi-purple-500/30 to-defi-pink-500/30',
  },
  {
    title: 'Stake & Earn',
    description: 'Earn SOVA rewards on deposits',
    icon: Coins,
    href: '/stake',
    gradient: 'from-defi-blue-500 to-defi-purple-500',
    bgGradient: 'from-defi-blue-500/10 to-defi-purple-500/10',
    borderGradient: 'from-defi-blue-500/30 to-defi-purple-500/30',
  },
  {
    title: 'Redeem Queue',
    description: 'Queue tokens for redemption',
    icon: Timer,
    href: '/redeem',
    gradient: 'from-defi-pink-500 to-defi-blue-500',
    bgGradient: 'from-defi-pink-500/10 to-defi-blue-500/10',
    borderGradient: 'from-defi-pink-500/30 to-defi-blue-500/30',
  },
]

export function QuickActions() {
  return (
    <motion.div variants={actionVariants}>
      <Card className="defi-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-defi-blue-500/20">
              <Zap className="h-5 w-5 text-defi-blue-400" />
            </div>
            <span className="gradient-text">Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.map((action) => (
            <motion.div
              key={action.title}
              variants={actionVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={action.href}>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${action.bgGradient} border border-transparent bg-clip-padding hover:bg-gradient-to-r hover:${action.borderGradient} transition-all duration-300 group cursor-pointer`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:gradient-text transition-all duration-200">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        {action.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
} 