# Queue Status & Countdown Components

## Overview
Creating real-time countdown timers and queue status tracking with professional animations.

## Step 1: Queue Status Component with Live Countdown

```typescript
// src/components/redeem/queue-status.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { formatUnits } from 'viem'
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
            You don't have any redemption requests in the queue
          </p>
          <p className="text-sm text-slate-500">
            Submit a redemption request to see your queue status here
          </p>
        </CardContent>
      </Card>
    )
  }

  const tokenInfo = TEST_TOKENS.find(t => t.address === redemptionRequest?.token)
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
                {redemptionRequest ? formatTokenAmount(redemptionRequest.sovaAmount, 8) : '0'} sovaBTC
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
```

## Step 2: Redemption Stats Component

```typescript
// src/components/redeem/redemption-stats.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, Users, Clock, Shield } from 'lucide-react'
import { formatUSD } from '@/lib/utils'

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export function RedemptionStats() {
  // Mock data - replace with real contract data
  const stats = {
    totalInQueue: 1200000,
    avgWaitTime: '10 days',
    successRate: '99.8%',
    queueLength: 47,
  }

  return (
    <motion.div variants={statsVariants}>
      <Card className="defi-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-defi-purple-500/20">
              <TrendingDown className="h-5 w-5 text-defi-purple-400" />
            </div>
            <span className="text-lg font-semibold text-white">Queue Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total in Queue</span>
              <span className="text-sm font-semibold text-white">
                {formatUSD(stats.totalInQueue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Queue Length</span>
              <span className="text-sm font-semibold text-defi-blue-400">
                {stats.queueLength} requests
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Processing Time</span>
              <span className="text-sm font-semibold text-defi-purple-400">
                {stats.avgWaitTime}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Success Rate</span>
              <span className="text-sm font-semibold text-defi-green-400">
                {stats.successRate}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs text-defi-green-400">
              <Shield className="h-3 w-3" />
              <span>Protected by time-lock security</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-defi-blue-400">
              <Clock className="h-3 w-3" />
              <span>Automated fulfillment system</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-defi-purple-400">
              <Users className="h-3 w-3" />
              <span>Community-verified process</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

## Step 3: Countdown Hook for Reusability

```typescript
// src/hooks/use-countdown.ts
'use client'

import { useState, useEffect } from 'react'

export interface CountdownData {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isFinished: boolean
  formatted: string
}

export function useCountdown(targetTime: number): CountdownData {
  const [timeLeft, setTimeLeft] = useState<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isFinished: true,
    formatted: '0d 0h 0m 0s'
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const difference = targetTime - now

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isFinished: true,
          formatted: 'Finished!'
        }
      }

      const days = Math.floor(difference / 86400)
      const hours = Math.floor((difference % 86400) / 3600)
      const minutes = Math.floor((difference % 3600) / 60)
      const seconds = Math.floor(difference % 60)

      return {
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: difference,
        isFinished: false,
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
      }
    }

    // Update immediately
    setTimeLeft(calculateTimeLeft())

    // Then update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}
```

## Step 4: Progress Circle Component

```typescript
// src/components/ui/progress-circle.tsx
'use client'

import { motion } from 'framer-motion'

interface ProgressCircleProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function ProgressCircle({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className = "",
  children 
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
```

## Step 5: Enhanced Queue Status with Progress Circle

```typescript
// src/components/redeem/enhanced-queue-status.tsx
'use client'

import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressCircle } from '@/components/ui/progress-circle'
import { Clock, CheckCircle } from 'lucide-react'

import { useRedemptionStatus } from '@/hooks/web3/use-redemption-status'
import { useCountdown } from '@/hooks/use-countdown'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { baseSepolia } from 'viem/chains'

export function EnhancedQueueStatus() {
  const { isConnected } = useAccount()
  const queueAddress = CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE
  
  const { queueData, isLoading } = useRedemptionStatus(queueAddress)
  const countdown = useCountdown(queueData.endTime)
  
  if (!isConnected || !queueData.isActive) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="defi-card text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {queueData.isReady ? (
              <CheckCircle className="h-5 w-5 text-defi-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-defi-blue-400" />
            )}
            Queue Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProgressCircle 
            progress={queueData.progress}
            size={160}
            className="mx-auto"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(queueData.progress)}%
              </div>
              <div className="text-sm text-slate-400">
                Complete
              </div>
            </div>
          </ProgressCircle>
          
          <div className="space-y-2">
            <div className="text-lg font-semibold text-white">
              {queueData.isReady ? 'Ready!' : countdown.formatted}
            </div>
            <div className="text-sm text-slate-400">
              {queueData.isReady ? 'Fulfillment available' : 'Time remaining'}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

## Next Steps

After implementing these queue components:
1. Test real-time countdown functionality
2. Verify fulfillment process works
3. Move to Phase 6: Staking Interface

This provides:
- ✅ Real-time countdown timers with second precision
- ✅ Professional progress indicators
- ✅ Queue status tracking with animations
- ✅ Fulfillment interface when ready
- ✅ Comprehensive loading and empty states
- ✅ Mobile-responsive design