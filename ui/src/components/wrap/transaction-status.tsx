'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TransactionStatusProps {
  approvalHash?: `0x${string}`
  depositHash?: `0x${string}`
  approvalSuccess?: boolean
  depositSuccess?: boolean
}

export function TransactionStatus({
  approvalHash,
  depositHash,
  approvalSuccess,
  depositSuccess
}: TransactionStatusProps) {
  const hasTransactions = approvalHash || depositHash

  if (!hasTransactions) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="defi-card p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-defi-purple-400 animate-pulse" />
            Transaction Status
          </h3>

          <div className="space-y-3">
            {/* Approval Transaction */}
            {approvalHash && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {approvalSuccess ? (
                    <CheckCircle className="h-5 w-5 text-defi-green-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-defi-purple-400 animate-spin" />
                  )}
                  <div>
                    <div className="font-medium text-white">Token Approval</div>
                    <div className="text-sm text-slate-400">
                      {approvalSuccess ? 'Approved successfully' : 'Confirming approval...'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.basescan.org/tx/${approvalHash}`, '_blank')}
                  className="text-defi-purple-400 hover:text-defi-purple-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Deposit Transaction */}
            {depositHash && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {depositSuccess ? (
                    <CheckCircle className="h-5 w-5 text-defi-green-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-defi-purple-400 animate-spin" />
                  )}
                  <div>
                    <div className="font-medium text-white">Wrap Transaction</div>
                    <div className="text-sm text-slate-400">
                      {depositSuccess ? 'Wrapped successfully!' : 'Confirming wrap...'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.basescan.org/tx/${depositHash}`, '_blank')}
                  className="text-defi-purple-400 hover:text-defi-purple-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Success Message */}
          {depositSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-defi-green-500/10 border border-defi-green-500/20"
            >
              <CheckCircle className="h-6 w-6 text-defi-green-500" />
              <div>
                <div className="font-medium text-defi-green-400">Wrap Completed!</div>
                <div className="text-sm text-slate-400">
                  Your tokens have been successfully wrapped to sovaBTC
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 