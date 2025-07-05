'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { useWrapperDeposit } from '@/hooks/web3/use-wrapper-deposit'
import { CONTRACT_ADDRESSES, TEST_TOKENS, type TestToken } from '@/contracts/addresses'
import { baseSepolia } from 'viem/chains'

import { TokenSelector } from './token-selector'
import { AmountInput } from './amount-input'
import { ConversionPreview } from './conversion-preview'
import { TransactionStatus } from './transaction-status'

export function DepositForm() {
  const [isMounted, setIsMounted] = useState(false)
  const { isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<TestToken>(TEST_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isMaxAmount, setIsMaxAmount] = useState(false)
  
  const wrapperAddress = CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
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

  // SSR guard
  if (!isMounted) {
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