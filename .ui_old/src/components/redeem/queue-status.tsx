'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  CheckCircle, 
  Loader2, 
  Timer, 
  Calendar,
  TrendingUp,
  AlertCircle 
} from 'lucide-react'

import { useRedemptionStatus } from '@/hooks/web3/use-redemption-status'
import { useFulfillment } from '@/hooks/web3/use-fulfillment'
import { CONTRACT_ADDRESSES, TEST_TOKENS } from '@/contracts/addresses'
import { formatTokenAmount } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

export function QueueStatus() {
  const { address, isConnected } = useAccount()
  const queueAddress = CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE
  
  const { 
    redemptionRequest, 
    queueData,
    isLoading 
  } = useRedemptionStatus(queueAddress)
  
  const fulfillment = useFulfillment()
  const [countdown, setCountdown] = useState('')
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing countdown
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update countdown every second
  useEffect(() => {
    if (!mounted || queueData.timeRemaining <= 0) return

    const timer = setInterval(() => {
      const timeLeft = queueData.timeRemaining
      
      if (timeLeft <= 0) {
        setCountdown('Ready!')
        return
      }
      
      const days = Math.floor(timeLeft / 86400)
      const hours = Math.floor((timeLeft % 86400) / 3600)
      const minutes = Math.floor((timeLeft % 3600) / 60)
      const seconds = Math.floor(timeLeft % 60)
      
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [mounted, queueData.timeRemaining])

  const handleFulfill = async () => {
    if (!address) return
    
    await fulfillment.fulfillRedemption(address, queueAddress)
  }

  if (!isConnected) {
    return (
      <Card className="defi-card">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-defi-blue-500/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-defi-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Queue Status</h3>
          <p className="text-slate-400">
            Connect your wallet to view queue status
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="defi-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-defi-blue-400" />
            Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-defi-blue-400" />
            <p className="text-slate-400">Loading queue status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!queueData.isActive) {
    return (
      <Card className="defi-card border-dashed border-white/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
            <Timer className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Active Queue</h3>
          <p className="text-slate-400">
            You don&apos;t have any redemption requests in the queue
          </p>
          <p className="text-sm text-slate-500">
            Submit a redemption request to see your queue status here
          </p>
        </CardContent>
      </Card>
    )
  }

  const tokenInfo = TEST_TOKENS.find(t => t.address === (redemptionRequest as { token?: string })?.token)
  const isReady = queueData.isReady
  const progress = queueData.progress

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`defi-card border-2 ${
        isReady 
          ? 'border-defi-green-500/50 bg-defi-green-500/5' 
          : 'border-defi-blue-500/50 bg-defi-blue-500/5'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={isReady ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: isReady ? Infinity : 0 }}
            >
              {isReady ? (
                <CheckCircle className="h-5 w-5 text-defi-green-400" />
              ) : (
                <Clock className="h-5 w-5 text-defi-blue-400" />
              )}
            </motion.div>
            <span className="gradient-text">
              {isReady ? 'Ready for Fulfillment' : 'In Queue'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Redemption Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Amount:</span>
              <span className="text-lg font-semibold text-white">
                {redemptionRequest ? formatTokenAmount((redemptionRequest as { sovaAmount?: bigint }).sovaAmount || BigInt(0), 8) : '0'} sovaBTC
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Redeem to:</span>
              <div className="flex items-center gap-2">
                {tokenInfo && (
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${tokenInfo.color} flex items-center justify-center text-white text-xs`}>
                    {tokenInfo.icon}
                  </div>
                )}
                <span className="text-sm font-medium text-white">
                  {tokenInfo?.symbol || 'Unknown Token'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Progress:</span>
              <span className="text-sm font-medium text-white">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-3 ${
                isReady ? 'bg-defi-green-900' : 'bg-defi-blue-900'
              }`}
            />
          </div>

          {/* Countdown Display */}
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4"
              >
                <div className="p-4 rounded-lg bg-defi-green-500/10 border border-defi-green-500/20">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl font-bold text-defi-green-400 mb-2"
                  >
                    🎉 Ready to Fulfill!
                  </motion.div>
                  <p className="text-sm text-slate-300">
                    Your 10-day queue period is complete
                  </p>
                </div>
                
                <Button
                  onClick={handleFulfill}
                  disabled={fulfillment.isPending || fulfillment.isConfirming}
                  className="w-full h-12 bg-gradient-to-r from-defi-green-600 to-defi-blue-600 hover:from-defi-green-500 hover:to-defi-blue-500 defi-button"
                >
                  {fulfillment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {fulfillment.isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {fulfillment.isPending 
                    ? 'Waiting for signature...'
                    : fulfillment.isConfirming 
                    ? 'Confirming fulfillment...'
                    : 'Fulfill Redemption'
                  }
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4"
              >
                <div className="p-6 rounded-lg bg-defi-blue-500/10 border border-defi-blue-500/20">
                  <div className="text-3xl font-bold text-defi-blue-400 mb-2">
                    {countdown}
                  </div>
                  <p className="text-sm text-slate-300">
                    Remaining until fulfillment
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <Calendar className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                    <p className="text-xs text-slate-400">Queued</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(queueData.requestTime * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <TrendingUp className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                    <p className="text-xs text-slate-400">Ready on</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(queueData.endTime * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Queue Info */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="h-3 w-3" />
              <span>10-day security delay protects against malicious activity</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="h-3 w-3" />
              <span>Transparent on-chain queue system</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 