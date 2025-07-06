'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { TestToken } from '@/contracts/addresses'

interface ConversionPreviewProps {
  inputAmount: string
  inputToken: TestToken
  outputAmount: string
  isValid: boolean
}

export function ConversionPreview({
  inputAmount,
  inputToken,
  outputAmount,
  isValid
}: ConversionPreviewProps) {
  if (!inputAmount || !isValid) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <Card className="defi-card p-6 space-y-4">
        {/* Input Token */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${inputToken.color} flex items-center justify-center text-white font-bold`}>
              {inputToken.icon}
            </div>
            <div>
              <div className="font-medium text-white">{inputToken.symbol}</div>
              <div className="text-sm text-slate-400">{inputToken.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {Number(inputAmount).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">
              ~${(Number(inputAmount) * 45000).toLocaleString()} USD
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="p-2 rounded-full bg-defi-purple-500/20 border border-defi-purple-500/30"
          >
            <ArrowDown className="h-5 w-5 text-defi-purple-400" />
          </motion.div>
        </div>

        {/* Output Token */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
              ₿
            </div>
            <div>
              <div className="font-medium text-white">sovaBTC</div>
              <div className="text-sm text-slate-400">Sovereign Bitcoin</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-defi-purple-400">
              {Number(outputAmount).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">
              ~${(Number(outputAmount) * 45000).toLocaleString()} USD
            </div>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-3 p-4 rounded-lg bg-defi-blue-500/10 border border-defi-blue-500/20"
      >
        <Info className="h-5 w-5 text-defi-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-300 space-y-1">
          <p className="font-medium">1:1 Satoshi Conversion</p>
          <p className="text-slate-400 leading-relaxed">
            Your {inputToken.symbol} will be converted to sovaBTC at a 1:1 satoshi ratio. 
            The wrapped tokens are backed by transparent reserves and can be redeemed at any time.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
} 