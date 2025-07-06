'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  const { isConnected } = useAccount()
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

  const [txStatus, setTxStatus] = useState<
    | { type: 'success' | 'error'; message: React.ReactNode }
    | null
  >(null)
  
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

    setTxStatus(null)

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
      if (redemptionRequest.hash) {
        setTxStatus({
          type: 'success',
          message: (
            <span>
              Redemption submitted! Tx:{' '}
              <a
                href={`https://sepolia.basescan.org/tx/${redemptionRequest.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {redemptionRequest.hash.slice(0, 8)}...
              </a>
            </span>
          ),
        })
      }
    }
  }, [redemptionRequest.isSuccess, redemptionRequest.hash, sovaBTCBalance, redemptionStatus])

  useEffect(() => {
    if (redemptionRequest.error) {
      setTxStatus({
        type: 'error',
        message: redemptionRequest.error.message || 'Transaction failed',
      })
    }
  }, [redemptionRequest.error])

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
                <div className="text-sm text-slate-400">You&apos;ll receive</div>
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

        {/* Transaction Status */}
        {txStatus && (
          <div
            className={`mt-2 p-2 rounded text-sm ${txStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {txStatus.message}
          </div>
        )}
      </div>
    </motion.div>
  )
}
