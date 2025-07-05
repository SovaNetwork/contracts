'use client'

import { motion } from 'framer-motion'
import { Wallet, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TestToken } from '@/contracts/addresses'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  onMaxClick: () => void
  token: TestToken
  balance: {
    formattedBalance: string
    isLoading: boolean
    symbol: string
  }
  validation: {
    isValid: boolean
    error: string | null
  }
  isMaxAmount: boolean
}

export function AmountInput({
  value,
  onChange,
  onMaxClick,
  token,
  balance,
  validation,
  isMaxAmount
}: AmountInputProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="number"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-16 text-2xl font-medium pr-20 bg-slate-800/50 border-slate-700 focus:border-defi-purple-500 text-white placeholder:text-slate-500 ${
            validation.error ? 'border-defi-red-500 focus:border-defi-red-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">{token.symbol}</span>
          {!balance.isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMaxClick}
              className={`h-8 px-2 text-xs hover:bg-defi-purple-500/20 hover:text-defi-purple-300 ${
                isMaxAmount ? 'bg-defi-purple-500/20 text-defi-purple-300' : 'text-slate-400'
              }`}
            >
              MAX
            </Button>
          )}
        </div>
      </div>

      {/* Balance Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Wallet className="h-4 w-4" />
          <span>Balance:</span>
          {balance.isLoading ? (
            <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
          ) : (
            <span className="font-medium">
              {Number(balance.formattedBalance).toLocaleString()} {balance.symbol}
            </span>
          )}
        </div>

        {/* USD Value (placeholder) */}
        {value && validation.isValid && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-slate-500"
          >
            ~${(Number(value) * 45000).toLocaleString()} USD
          </motion.div>
        )}
      </div>

      {/* Validation Error */}
      {validation.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validation.error}</span>
        </motion.div>
      )}
    </div>
  )
} 