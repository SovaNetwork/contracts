'use client'

import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Coins } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function WrapStats() {
  const stats = [
    {
      label: "Total Wrapped",
      value: "0.00000000",
      suffix: "BTC",
      change: "+0.00%",
      icon: Coins,
      color: "text-defi-purple-400"
    },
    {
      label: "Reserve Ratio",
      value: "100%",
      suffix: "",
      change: "Backed",
      icon: TrendingUp,
      color: "text-defi-green-400"
    },
    {
      label: "Wrap Fee",
      value: "0.1%",
      suffix: "",
      change: "Per tx",
      icon: DollarSign,
      color: "text-defi-blue-400"
    }
  ]

  return (
    <Card className="defi-card">
      <CardHeader>
        <CardTitle className="text-lg text-white">Wrap Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-800/50 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm text-slate-400">{stat.label}</div>
                <div className="font-medium text-white">
                  {stat.value} {stat.suffix}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${stat.color}`}>
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
} 