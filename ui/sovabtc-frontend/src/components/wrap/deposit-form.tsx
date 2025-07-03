'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, formatUnits } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TokenSelector } from './token-selector'
import { AmountInput } from './amount-input'
import { TransactionSummary } from './transaction-summary'
import { ArrowRight, CheckCircle, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { useWrapper, useERC20, useContractAddresses } from '@/hooks/use-contracts'
import { useTokenBalance } from '@/hooks/use-token-balances'
import { calculateSovaBTCAmount, meetsMinimumDeposit } from '@/lib/decimal-conversion'
import { TokenInfo } from '@/types/contracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock supported tokens - in production, this would come from contract
const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: '0x29f2D40B0605204364af54EC677bD022dA425d03' as Address,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    isWhitelisted: true,
    icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
  },
  {
    address: '0x0000000000000000000000000000000000000001' as Address,
    symbol: 'tBTC',
    name: 'Threshold Bitcoin',
    decimals: 18,
    isWhitelisted: true,
  },
]

interface DepositFormProps {
  className?: string
  onSuccess?: (txHash: string, amount: string, token: TokenInfo) => void
}

export function DepositForm({ className, onSuccess }: DepositFormProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const addresses = useContractAddresses()

  // Form state
  const [selectedToken, setSelectedToken] = useState<TokenInfo | undefined>(SUPPORTED_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState<Address | undefined>()

  // Contract hooks
  const { isDepositing, depositTokens } = useWrapper()
  const { balance: tokenBalance, decimals: tokenDecimals } = useERC20(selectedToken?.address)
  
  // Allowance check
  const { useAllowance, approveSpender, isApproving } = useERC20(selectedToken?.address)
  const { data: allowance, refetch: refetchAllowance } = useAllowance(addresses.wrapper)

  // Transaction monitoring
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Reset form when transaction confirms
  useEffect(() => {
    if (receipt && receipt.status === 'success' && selectedToken) {
      setAmount('')
      setTxHash(undefined)
      onSuccess?.(receipt.transactionHash, amount, selectedToken)
      toast.success('Tokens wrapped successfully!')
    }
  }, [receipt, amount, selectedToken, onSuccess])

  // Validation
  const validationResult = useMemo(() => {
    if (!selectedToken || !amount || !tokenBalance || !tokenDecimals) {
      return { isValid: false, error: null }
    }

    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      
      if (amountWei <= 0n) {
        return { isValid: false, error: 'Amount must be greater than 0' }
      }

      if (amountWei > tokenBalance) {
        return { isValid: false, error: 'Insufficient balance' }
      }

      if (!meetsMinimumDeposit(amount, tokenDecimals)) {
        return { isValid: false, error: 'Amount below minimum deposit' }
      }

      return { isValid: true, error: null }
    } catch {
      return { isValid: false, error: 'Invalid amount' }
    }
  }, [selectedToken, amount, tokenBalance, tokenDecimals])

  // Approval check
  const needsApproval = useMemo(() => {
    if (!amount || !allowance || !tokenDecimals) return false
    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      return amountWei > allowance
    } catch {
      return false
    }
  }, [amount, allowance, tokenDecimals])

  // Convert to SovaBTC amount for preview
  const sovaBTCAmount = selectedToken && amount && tokenDecimals
    ? calculateSovaBTCAmount(amount, tokenDecimals)
    : '0.00000000'

  // Handle approval
  const handleApprove = async () => {
    if (!selectedToken || !amount || !tokenDecimals) return

    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      await approveSpender(addresses.wrapper, amountWei)
      toast.success('Approval submitted')
      
      // Refetch allowance after a delay
      setTimeout(() => {
        refetchAllowance()
      }, 2000)
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Approval failed')
    }
  }

  // Handle deposit
  const handleDeposit = async () => {
    if (!selectedToken || !amount || !tokenDecimals || !validationResult.isValid) return

    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      const hash = await depositTokens(selectedToken.address, amountWei)
      setTxHash(hash)
      toast.success('Deposit submitted')
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error('Deposit failed')
    }
  }

  const isProcessing = isApproving || isDepositing || isConfirming

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to wrap tokens
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-2 border-sova-mint-200 shadow-xl', className)}>
      <CardHeader className="bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Wrap Bitcoin Tokens
        </CardTitle>
        <CardDescription className="text-sova-mint-100">
          Convert BTC-pegged tokens into unified SovaBTC
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Token Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Token</label>
          <TokenSelector
            tokens={SUPPORTED_TOKENS}
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
            disabled={isProcessing}
            showBalances={true}
          />
        </div>

        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          token={selectedToken}
          label="Amount to Wrap"
          disabled={isProcessing}
          error={validationResult.error || undefined}
          showMaxButton={true}
          showBalance={true}
        />

        {/* Conversion Preview */}
        {amount && selectedToken && (
          <div className="p-4 bg-gradient-to-r from-sova-mint-50 to-sova-mint-100 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ₿
                </div>
                <span className="font-medium">{amount} {selectedToken.symbol}</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-sova-mint-600" />
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-sova-black-500 rounded-full flex items-center justify-center text-sova-mint-500 text-xs font-bold">
                  S
                </div>
                <span className="font-medium text-sova-mint-700">{sovaBTCAmount} SovaBTC</span>
              </div>
            </div>
            
            <div className="text-xs text-sova-black-600 text-center mt-2">
              Rate: 1 {selectedToken.symbol} = 1 SovaBTC (normalized to 8 decimals)
            </div>
          </div>
        )}

        <Separator />

        {/* Transaction Summary */}
        {selectedToken && amount && validationResult.isValid && (
          <TransactionSummary
            inputToken={selectedToken}
            inputAmount={amount}
            outputAmount={sovaBTCAmount}
            fee="~$0.50" // Estimated gas fee
          />
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {needsApproval && (
            <Button
              onClick={handleApprove}
              disabled={!validationResult.isValid || isApproving}
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve {selectedToken?.symbol}
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleDeposit}
            disabled={!validationResult.isValid || needsApproval || isDepositing}
            className="w-full h-12 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white"
          >
            {isDepositing || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isConfirming ? 'Confirming...' : 'Wrapping...'}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Wrap {selectedToken?.symbol || 'Tokens'}
              </>
            )}
          </Button>
        </div>

        {/* Status Messages */}
        {txHash && !receipt && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Transaction submitted. Waiting for confirmation...
            </AlertDescription>
          </Alert>
        )}

        {validationResult.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {validationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Minimum Deposit Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Minimum deposit: 0.001 BTC equivalent</div>
          <div>• Gas fees will be charged separately</div>
          <div>• SovaBTC uses 8 decimal precision</div>
        </div>
      </CardContent>
    </Card>
  )
}