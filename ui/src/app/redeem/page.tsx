'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RedeemPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Redeem Bitcoin</h1>
          <p className="text-xl text-slate-400">
            Convert your sovaBTC back to Bitcoin
          </p>
        </div>

        <Card className="defi-card p-8">
          <CardHeader>
            <CardTitle className="text-white">Redemption Interface</CardTitle>
            <CardDescription>Convert sovaBTC back to BTC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12 text-slate-400">
              Redemption interface coming soon...
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}