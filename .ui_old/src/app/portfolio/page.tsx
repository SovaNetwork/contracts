'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PortfolioPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Portfolio</h1>
          <p className="text-xl text-slate-400">
            View your positions, earnings, and transaction history
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="defi-card p-6">
            <CardHeader>
              <CardTitle className="text-white">Total Balance</CardTitle>
              <CardDescription>Your total portfolio value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$0.00</div>
              <div className="text-sm text-slate-400 mt-1">~0.00000000 BTC</div>
            </CardContent>
          </Card>

          <Card className="defi-card p-6">
            <CardHeader>
              <CardTitle className="text-white">sovaBTC Holdings</CardTitle>
              <CardDescription>Your wrapped Bitcoin balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0.00000000</div>
              <div className="text-sm text-slate-400 mt-1">~$0.00 USD</div>
            </CardContent>
          </Card>

          <Card className="defi-card p-6">
            <CardHeader>
              <CardTitle className="text-white">SOVA Rewards</CardTitle>
              <CardDescription>Your earned rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0.00000000</div>
              <div className="text-sm text-slate-400 mt-1">~$0.00 USD</div>
            </CardContent>
          </Card>
        </div>

        <Card className="defi-card p-8">
          <CardHeader>
            <CardTitle className="text-white">Transaction History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-400">
              No transactions yet. Connect your wallet to get started!
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}