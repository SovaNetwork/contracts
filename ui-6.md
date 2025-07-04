# UI-6: Modern Redemption Queue Interface

## Overview
Creating a professional redemption interface with real-time countdown timers and queue management.

## Step 1: Redemption Hooks

### Redemption Request Hook

```typescript
// src/hooks/web3/use-redemption-request.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useRedemptionRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Redemption Queued! ⏰",
        description: "Your redemption request has been submitted to the 10-day queue",
        className: "border-defi-blue-500/50 bg-defi-blue-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const requestRedemption = useCallback(async (
    tokenAddress: `0x${string}`,
    sovaAmount: string,
    queueAddress: `0x${string}`
  ) => {
    try {
      const parsedAmount = parseUnits(sovaAmount, 8) // SovaBTC has 8 decimals
      
      writeContract({
        address: queueAddress,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'redeem',
        args: [tokenAddress, parsedAmount],
      })
    } catch (error) {
      console.error('Redemption error:', error)
      toast({
        title: "Redemption Error",
        description: "Failed to prepare redemption transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    requestRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

### Redemption Status Hook

```typescript
// src/hooks/web3/use-redemption-status.ts
'use client'

import { useReadContract, useAccount } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { useMemo } from 'react'

export function useRedemptionStatus(queueAddress: `0x${string}`) {
  const { address } = useAccount()

  const { data: redemptionRequest, isLoading, refetch } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'pendingRedemptions',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds for countdown
    },
  })

  const { data: redemptionDelay } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
    query: {
      staleTime: Infinity, // Delay doesn't change
    },
  })

  const queueData = useMemo(() => {
    if (!redemptionRequest || !redemptionDelay) {
      return {
        isActive: false,
        isReady: false,
        timeRemaining: 0,
        progress: 0,
        requestTime: 0,
        endTime: 0,
      }
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const requestTime = Number(redemptionRequest.requestTime)
    const delay = Number(redemptionDelay)
    const endTime = requestTime + delay
    const timeRemaining = Math.max(0, endTime - currentTime)
    const isReady = timeRemaining === 0 && redemptionRequest.sovaAmount > 0n
    const isActive = redemptionRequest.sovaAmount > 0n
    const progress = delay > 0 ? Math.min(100, ((delay - timeRemaining) / delay) * 100) : 0

    return {
      isActive,
      isReady,
      timeRemaining,
      progress,
      requestTime,
      endTime,
    }
  }, [redemptionRequest, redemptionDelay])

  return {
    redemptionRequest,
    redemptionDelay: Number(redemptionDelay || 0),
    queueData,
    isLoading,
    refetch,
  }
}
```

### Fulfillment Hook

```typescript
// src/hooks/web3/use-fulfillment.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useFulfillment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Redemption Fulfilled! 🎉",
        description: "Your tokens have been successfully redeemed",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Fulfillment Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const fulfillRedemption = useCallback(async (
    userAddress: `0x${string}`,
    queueAddress: `0x${string}`
  ) => {
    try {
      writeContract({
        address: queueAddress,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'fulfillRedemption',
        args: [userAddress],
      })
    } catch (error) {
      console.error('Fulfillment error:', error)
      toast({
        title: "Fulfillment Error",
        description: "Failed to prepare fulfillment transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    fulfillRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

## Step 2: Redemption Page

```typescript
// src/app/redeem/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { RedemptionForm } from '@/components/redeem/redemption-form'
import { QueueStatus } from '@/components/redeem/queue-status'
import { RedemptionStats } from '@/components/redeem/redemption-stats'
import { Timer, Clock } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export default function RedeemPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-xl bg-defi-blue-500/20 border border-defi-blue-500/30"
            >
              <Timer className="h-8 w-8 text-defi-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Redemption Queue</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Queue your SovaBTC for redemption with a secure 10-day processing period.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-defi-blue-400">
            <Clock className="h-4 w-4" />
            <span>10-day security delay • Transparent processing</span>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="defi-card p-8">
              <Suspense fallback={<RedemptionFormSkeleton />}>
                <RedemptionForm />
              </Suspense>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-6">
            <Suspense fallback={<QueueStatusSkeleton />}>
              <QueueStatus />
            </Suspense>
            
            <Suspense fallback={<RedemptionStatsSkeleton />}>
              <RedemptionStats />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function RedemptionFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 bg-slate-700/50 rounded shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-24 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function QueueStatusSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-32 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function RedemptionStatsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-28 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
            <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Step 3: Redemption Form Component

```typescript
// src/components/redeem/redemption-form.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, Clock, ArrowDown } from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { useRedemptionRequest } from '@/hooks/web3/use-redemption-request'
import { useRedemptionStatus } from '@/hooks/web3/use-redemption-status'
import { CONTRACT_ADDRESSES, TEST_TOKENS, type TestToken } from '@/contracts/addresses'
import { formatTokenAmount } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

import { TokenSelector } from '../wrap/token-selector'

export function RedemptionForm() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<TestToken>(TEST_TOKENS[0])
  const [amount, setAmount] = useState('')
  
  const sovaBTCAddress = CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC
  const queueAddress = CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE
  
  // Hook calls
  const sovaBTCBalance = useTokenBalance(sovaBTCAddress)
  const tokenAllowance = useTokenAllowance(sovaBTCAddress, queueAddress)
  const approval = useTokenApproval()
  const redemptionRequest = useRedemptionRequest()
  const redemptionStatus = useRedemptionStatus(queueAddress)
  
  // Check if user already has an active redemption
  const hasActiveRedemption = redemptionStatus.queueData.isActive

  // Validation logic
  const validation = useMemo(() => {
    if (!amount || Number(amount) <= 0) {
      return { isValid: false, error: null }
    }
    
    if (Number(amount) > Number(sovaBTCBalance.formattedBalance)) {
      return { isValid: false, error: 'Insufficient SovaBTC balance' }
    }

    if (hasActiveRedemption) {
      return { isValid: false, error: 'You already have an active redemption request' }
    }
    
    return { isValid: true, error: null }
  }, [amount, sovaBTCBalance.formattedBalance, hasActiveRedemption])

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!amount || !validation.isValid) return false
    return tokenAllowance.hasInsufficientAllowance(amount, 8) // SovaBTC decimals
  }, [amount, validation.isValid, tokenAllowance])

  const handleMaxClick = () => {
    setAmount(sovaBTCBalance.formattedBalance)
  }

  const handleApprove = async () => {
    if (!amount || !validation.isValid) return
    
    await approval.approve(
      sovaBTCAddress,
      queueAddress,
      amount,
      8, // SovaBTC decimals
      true // Use max approval
    )
  }

  const handleRedeem = async () => {
    if (!amount || !validation.isValid) return
    
    await redemptionRequest.requestRedemption(
      selectedToken.address,
      amount,
      queueAddress
    )
  }

  // Reset form after successful transaction
  useEffect(() => {
    if (redemptionRequest.isSuccess) {
      setAmount('')
      sovaBTCBalance.refetch()
      redemptionStatus.refetch()
    }
  }, [redemptionRequest.isSuccess, sovaBTCBalance, redemptionStatus])

  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-12 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-defi-blue-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-defi-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
        <p className="text-slate-400">
          Please connect your wallet to queue redemptions
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Active Redemption Warning */}
      <AnimatePresence>
        {hasActiveRedemption && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-4 rounded-lg bg-defi-blue-500/10 border border-defi-blue-500/20"
          >
            <Clock className="h-5 w-5 text-defi-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-defi-blue-300">Active Redemption in Progress</p>
              <p className="text-xs text-slate-400">
                You have an active redemption request. Please wait for it to complete before submitting a new one.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Redeem To</Label>
        <TokenSelector 
          selectedToken={selectedToken}
          onSelect={setSelectedToken}
          tokens={TEST_TOKENS}
        />
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">SovaBTC Amount</Label>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={hasActiveRedemption}
            className={`h-16 text-2xl font-semibold bg-transparent border-2 pr-32 ${
              validation.error 
                ? 'border-defi-red-500/50 focus:border-defi-red-500' 
                : 'border-white/20 focus:border-defi-blue-500/50'
            }`}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                disabled={sovaBTCBalance.isLoading || hasActiveRedemption}
                className="h-8 px-3 text-xs font-semibold hover:bg-white/10"
              >
                MAX
              </Button>
            </motion.div>
            <div className="text-right">
              <span className="text-sm font-medium text-slate-300">sovaBTC</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Balance:</span>
            {sovaBTCBalance.isLoading ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="shimmer w-16 h-3 rounded"></span>
              </div>
            ) : (
              <span className="font-medium">
                {formatTokenAmount(sovaBTCBalance.balance, 8)} sovaBTC
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Queue Preview */}
      <Card className="defi-card border-defi-blue-500/30 bg-gradient-to-r from-defi-blue-500/5 to-defi-purple-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm text-slate-400">You queue</div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-xs">
                    ₿
                  </span>
                  {amount || '0'} sovaBTC
                </div>
              </div>
              
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="p-2 rounded-full bg-white/10"
              >
                <ArrowDown className="h-5 w-5 text-slate-400" />
              </motion.div>
              
              <div className="text-right">
                <div className="text-sm text-slate-400">You'll receive</div>
                <div className="text-2xl font-bold gradient-text flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center text-xs`}>
                    {selectedToken.icon}
                  </div>
                  {amount || '0'} {selectedToken.symbol}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>10-day queue period • 1:1 conversion rate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {needsApproval ? (
            <motion.div
              key="approve"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                onClick={handleApprove}
                disabled={approval.isPending || approval.isConfirming || !validation.isValid || hasActiveRedemption}
                className="w-full h-14 text-lg font-semibold defi-button bg-defi-blue-600 hover:bg-defi-blue-500"
                size="lg"
              >
                {approval.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {approval.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {approval.isPending 
                  ? 'Waiting for signature...'
                  : approval.isConfirming 
                  ? 'Confirming approval...'
                  : 'Approve SovaBTC'
                }
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="redeem"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleRedeem}
                disabled={redemptionRequest.isPending || redemptionRequest.isConfirming || !validation.isValid || hasActiveRedemption}
                className="w-full h-14 text-lg font-semibold defi-button bg-gradient-to-r from-defi-blue-600 to-defi-purple-600 hover:from-defi-blue-500 hover:to-defi-purple-500"
                size="lg"
              >
                {redemptionRequest.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {redemptionRequest.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {redemptionRequest.isPending 
                  ? 'Waiting for signature...'
                  : redemptionRequest.isConfirming 
                  ? 'Queuing redemption...'
                  : 'Queue Redemption'
                }
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Error */}
        <AnimatePresence>
          {validation.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{validation.error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
```

## Step 4: Queue Status Component

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

## Step 5: Redemption Stats Component

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

## Step 6: Token Selector Component (Reused from Wrap)

```typescript
// src/components/wrap/token-selector.tsx
'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type TestToken } from '@/contracts/addresses'

interface TokenSelectorProps {
  selectedToken: TestToken
  onSelect: (token: TestToken) => void
  tokens: readonly TestToken[]
}

export function TokenSelector({ selectedToken, onSelect, tokens }: TokenSelectorProps) {
  return (
    <Select 
      value={selectedToken.address} 
      onValueChange={(address) => {
        const token = tokens.find(t => t.address === address)
        if (token) onSelect(token)
      }}
    >
      <SelectTrigger className="h-16 defi-card border-white/20 hover:border-white/30">
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center text-white font-bold text-lg`}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {selectedToken.icon}
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-white font-semibold">{selectedToken.symbol}</span>
            <span className="text-sm text-slate-400">{selectedToken.name}</span>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="defi-card border-white/20">
        {tokens.map((token) => (
          <SelectItem key={token.address} value={token.address} className="focus:bg-white/10">
            <div className="flex items-center gap-3 py-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white font-bold`}>
                {token.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-xs text-slate-400">{token.name}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

## Step 7: useToast Hook Implementation

```typescript
// src/hooks/use-toast.ts
'use client'

import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  className?: string
}

export function useToast() {
  const toast = ({ title, description, variant = "default", className }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        className: `${className} border-defi-red-500/50 bg-defi-red-500/10`,
      })
    } else {
      sonnerToast.success(title, {
        description,
        className: `${className} border-defi-green-500/50 bg-defi-green-500/10`,
      })
    }
  }

  return { toast }
}
```

## Next Steps

After implementing the redemption queue interface:
1. Test redemption request submission
2. Verify countdown timers work accurately
3. Test fulfillment process when ready
4. Move to Phase 7: Token Wrapping Interface

This provides:
- ✅ Complete redemption request form with validation
- ✅ Real-time countdown timers with second precision
- ✅ Queue status tracking with progress indicators
- ✅ Fulfillment interface when ready
- ✅ Professional animations and responsive design
- ✅ Integration with your deployed RedemptionQueue contract