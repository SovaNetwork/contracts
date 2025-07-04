# Phase 4: Modern Wrap Interface

## Overview
Creating a professional Uniswap-style token wrapping interface with smooth animations and real Web3 integration.

## Step 1: Wrapper Deposit Hook

```typescript
// src/hooks/web3/use-wrapper-deposit.ts
'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVABTC_WRAPPER_ABI } from '@/contracts/abis'
import { parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export function useWrapperDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { toast } = useToast()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast({
        title: "Wrap Successful! 🎉",
        description: "Your tokens have been wrapped to SovaBTC",
        className: "border-defi-green-500/50 bg-defi-green-50/10",
      })
    },
    onError: (error) => {
      toast({
        title: "Wrap Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deposit = useCallback(async (
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number,
    wrapperAddress: `0x${string}`
  ) => {
    try {
      const parsedAmount = parseUnits(amount, tokenDecimals)
      
      writeContract({
        address: wrapperAddress,
        abi: SOVABTC_WRAPPER_ABI,
        functionName: 'deposit',
        args: [tokenAddress, parsedAmount],
      })
    } catch (error) {
      console.error('Deposit error:', error)
      toast({
        title: "Deposit Error",
        description: "Failed to prepare deposit transaction",
        variant: "destructive",
      })
    }
  }, [writeContract, toast])

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
```

## Step 2: Modern Wrap Page

```typescript
// src/app/wrap/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { DepositForm } from '@/components/wrap/deposit-form'
import { WrapStats } from '@/components/wrap/wrap-stats'
import { RecentActivity } from '@/components/wrap/recent-activity'
import { ArrowUpDown, TrendingUp } from 'lucide-react'

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

export default function WrapPage() {
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
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-xl bg-defi-purple-500/20 border border-defi-purple-500/30"
            >
              <ArrowUpDown className="h-8 w-8 text-defi-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text">Wrap Tokens</h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Deposit BTC-pegged tokens to mint SovaBTC. 1:1 satoshi conversion with transparent reserves.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="defi-card p-8">
              <Suspense fallback={<DepositFormSkeleton />}>
                <DepositForm />
              </Suspense>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-6">
            <Suspense fallback={<WrapStatsSkeleton />}>
              <WrapStats />
            </Suspense>
            
            <Suspense fallback={<RecentActivitySkeleton />}>
              <RecentActivity />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function DepositFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-32 w-full bg-slate-700/50 rounded-lg shimmer" />
      <div className="h-12 w-full bg-slate-700/50 rounded-lg shimmer" />
    </div>
  )
}

function WrapStatsSkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-24 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
            <div className="h-4 w-16 bg-slate-700/50 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="defi-card p-6 space-y-4">
      <div className="h-6 w-32 bg-slate-700/50 rounded shimmer" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-700/50 rounded-full shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 bg-slate-700/50 rounded shimmer" />
              <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Step 3: Professional Deposit Form

```typescript
// src/components/wrap/deposit-form.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { useWrapperDeposit } from '@/hooks/web3/use-wrapper-deposit'
import { CONTRACT_ADDRESSES, TEST_TOKENS, type TestToken } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'
import { baseSepolia } from 'viem/chains'

import { TokenSelector } from './token-selector'
import { AmountInput } from './amount-input'
import { ConversionPreview } from './conversion-preview'
import { TransactionStatus } from './transaction-status'

export function DepositForm() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<TestToken>(TEST_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isMaxAmount, setIsMaxAmount] = useState(false)
  
  const wrapperAddress = CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER
  
  // Hook calls
  const tokenBalance = useTokenBalance(selectedToken.address)
  const tokenAllowance = useTokenAllowance(selectedToken.address, wrapperAddress)
  const approval = useTokenApproval()
  const deposit = useWrapperDeposit()
  
  // Validation logic
  const validation = useMemo(() => {
    if (!amount || Number(amount) <= 0) {
      return { isValid: false, error: null }
    }
    
    if (Number(amount) > Number(tokenBalance.formattedBalance)) {
      return { isValid: false, error: 'Insufficient balance' }
    }
    
    return { isValid: true, error: null }
  }, [amount, tokenBalance.formattedBalance])

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!amount || !validation.isValid) return false
    return tokenAllowance.hasInsufficientAllowance(amount, selectedToken.decimals)
  }, [amount, validation.isValid, tokenAllowance, selectedToken.decimals])

  // Calculate expected SovaBTC output (1:1 satoshi conversion)
  const expectedOutput = useMemo(() => {
    if (!amount || !validation.isValid) return '0'
    const inputSatoshis = Number(amount) * (10 ** selectedToken.decimals)
    const sovaBTCSatoshis = inputSatoshis / (10 ** (selectedToken.decimals - 8))
    return (sovaBTCSatoshis / 1e8).toFixed(8)
  }, [amount, validation.isValid, selectedToken.decimals])

  const handleMaxClick = () => {
    setAmount(tokenBalance.formattedBalance)
    setIsMaxAmount(true)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setIsMaxAmount(false)
  }

  const handleApprove = async () => {
    if (!amount || !validation.isValid) return
    
    await approval.approve(
      selectedToken.address,
      wrapperAddress,
      amount,
      selectedToken.decimals,
      true // Use max approval for better UX
    )
  }

  const handleDeposit = async () => {
    if (!amount || !validation.isValid) return
    
    await deposit.deposit(
      selectedToken.address,
      amount,
      selectedToken.decimals,
      wrapperAddress
    )
  }

  // Reset form after successful transaction
  useEffect(() => {
    if (deposit.isSuccess) {
      setAmount('')
      setIsMaxAmount(false)
      tokenBalance.refetch()
      tokenAllowance.refetch()
    }
  }, [deposit.isSuccess, tokenBalance, tokenAllowance])

  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-12 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-defi-purple-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-defi-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
        <p className="text-slate-400">
          Please connect your wallet to start wrapping tokens
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
      {/* Token Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Select Token</Label>
        <TokenSelector 
          selectedToken={selectedToken}
          onSelect={setSelectedToken}
          tokens={TEST_TOKENS}
        />
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Amount</Label>
        <AmountInput
          value={amount}
          onChange={handleAmountChange}
          onMaxClick={handleMaxClick}
          token={selectedToken}
          balance={tokenBalance}
          validation={validation}
          isMaxAmount={isMaxAmount}
        />
      </div>

      {/* Conversion Preview */}
      <ConversionPreview
        inputAmount={amount}
        inputToken={selectedToken}
        outputAmount={expectedOutput}
        isValid={validation.isValid}
      />

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
                disabled={approval.isPending || approval.isConfirming || !validation.isValid}
                className="w-full h-14 text-lg font-semibold defi-button bg-defi-purple-600 hover:bg-defi-purple-500"
                size="lg"
              >
                {approval.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {approval.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {approval.isPending 
                  ? 'Waiting for signature...'
                  : approval.isConfirming 
                  ? 'Confirming approval...'
                  : `Approve ${selectedToken.symbol}`
                }
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleDeposit}
                disabled={deposit.isPending || deposit.isConfirming || !validation.isValid}
                className="w-full h-14 text-lg font-semibold defi-button bg-gradient-to-r from-defi-purple-600 to-defi-pink-600 hover:from-defi-purple-500 hover:to-defi-pink-500"
                size="lg"
              >
                {deposit.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {deposit.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {deposit.isPending 
                  ? 'Waiting for signature...'
                  : deposit.isConfirming 
                  ? 'Confirming wrap...'
                  : 'Wrap to SovaBTC'
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

      {/* Transaction Status */}
      <TransactionStatus 
        approvalHash={approval.hash}
        depositHash={deposit.hash}
        approvalSuccess={approval.isSuccess}
        depositSuccess={deposit.isSuccess}
      />
    </motion.div>
  )
}