'use client'

import { motion } from 'framer-motion'

const stats = [
  {
    label: 'Total Value Locked',
    value: '$0.00',
    change: '+0.00%',
    changeType: 'positive' as const,
  },
  {
    label: 'SovaBTC Price',
    value: '$0.00',
    change: '+0.00%',
    changeType: 'positive' as const,
  },
  {
    label: 'Active Stakers',
    value: '0',
    change: '+0.00%',
    changeType: 'positive' as const,
  },
]

export function StatsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="defi-card p-6 space-y-4"
        >
          <p className="text-sm text-slate-400">{stat.label}</p>
          <p className="text-3xl font-bold text-white">{stat.value}</p>
          <p className={`text-sm ${
            stat.changeType === 'positive' 
              ? 'text-defi-green-500' 
              : 'text-defi-red-500'
          }`}>
            {stat.change}
          </p>
        </motion.div>
      ))}
    </div>
  )
}