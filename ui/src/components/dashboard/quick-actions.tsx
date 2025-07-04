'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpDown, Plus, Minus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const actions = [
  {
    title: 'Wrap Bitcoin',
    description: 'Convert BTC to SovaBTC',
    icon: Plus,
    href: '/wrap',
    color: 'from-defi-purple-500 to-defi-purple-600',
  },
  {
    title: 'Redeem Bitcoin',
    description: 'Convert SovaBTC back to BTC',
    icon: Minus,
    href: '/redeem',
    color: 'from-defi-pink-500 to-defi-pink-600',
  },
  {
    title: 'Stake SovaBTC',
    description: 'Earn SOVA rewards',
    icon: TrendingUp,
    href: '/stake',
    color: 'from-defi-blue-500 to-defi-blue-600',
  },
  {
    title: 'View Portfolio',
    description: 'Track your positions',
    icon: ArrowUpDown,
    href: '/portfolio',
    color: 'from-defi-green-500 to-defi-green-600',
  },
]

export function QuickActions() {
  return (
    <motion.div 
      className="defi-card p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h3 className="text-xl font-bold text-white">Quick Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="group cursor-pointer"
            >
              <Button 
                variant="outline" 
                className="w-full p-4 h-auto justify-start space-x-4 border-white/10 hover:border-white/20"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white group-hover:text-defi-purple-300 transition-colors">
                    {action.title}
                  </p>
                  <p className="text-sm text-slate-400">
                    {action.description}
                  </p>
                </div>
              </Button>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}