'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign } from 'lucide-react'

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stats = [
  {
    title: 'Total Value Locked',
    value: '$2.4M',
    change: '+15.2%',
    changeType: 'positive' as const,
    icon: DollarSign,
    gradient: 'from-defi-green-400 to-defi-blue-400',
  },
  {
    title: 'Active Users',
    value: '1,337',
    change: '+8.1%',
    changeType: 'positive' as const,
    icon: Users,
    gradient: 'from-defi-purple-400 to-defi-pink-400',
  },
  {
    title: 'APY',
    value: '12.4%',
    change: '+0.3%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    gradient: 'from-defi-pink-400 to-defi-blue-400',
  },
]

export function StatsGrid() {
  return (
    <motion.div 
      variants={statsVariants}
      className="grid gap-6 md:grid-cols-3"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.title}
          variants={statsVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="defi-card border-white/20 hover:border-white/30 group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white group-hover:gradient-text transition-all duration-200">
                      {stat.value}
                    </p>
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-defi-green-400' 
                        : 'text-defi-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
} 