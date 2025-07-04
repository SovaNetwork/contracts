'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function StakePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Stake SOVA</h1>
          <p className="text-xl text-slate-400">
            Stake your SOVA tokens and earn rewards
          </p>
        </div>

        <Card className="defi-card p-8">
          <CardHeader>
            <CardTitle className="text-white">Staking Interface</CardTitle>
            <CardDescription>Stake SOVA tokens to earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12 text-slate-400">
              Staking interface coming soon...
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}