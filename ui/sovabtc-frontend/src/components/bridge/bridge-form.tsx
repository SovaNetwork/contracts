'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatUnits, parseUnits, Address } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChainSelector } from './chain-selector'
import { BridgeSummary } from './bridge-summary'
import { BridgeHistory } from './bridge-history'
import { ArrowRight, Zap, AlertTriangle, Loader2, Bridge, Info } from 'lucide-react'
import { useBridge, useBridgeFee } from '@/hooks/use-bridge'
import { useSovaBTC } from '@/hooks/use-contracts'
import { BridgeParams, formatBridgeAmount } from '@/lib/layerzero-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BridgeFormProps {
  className?: string
  onSuccess?: (txHash: string) => void
}

export function BridgeForm({ className, onSuccess }: BridgeFormProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Form state
  const [sourceChainId, setSourceChainId] = useState(84532) // Base Sepolia default
  const [destinationChainId, setDestinationChainId] = useState(11155111) // Ethereum Sepolia default
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState<Address>()

  // Bridge hooks
  const {
    sovaBTCBalance,
    isBridging,
    isConfirming,
    executeBridge,
    isSupported,
    bridgeHistory,
    pendingBridges
  } = useBridge()

  // Set recipient to connected address by default
  useEffect(() => {
    if (address) {
      setRecipient(address)
    }
  }, [address])

  // Update source chain when user switches networks
  useEffect(() => {
    if (chainId && isSupported(chainId, destinationChainId)) {
      setSourceChainId(chainId)
    }
  }, [chainId, destinationChainId, isSupported])

  // Bridge parameters
  const bridgeParams: BridgeParams | undefined = useMemo(() => {
    if (!amount || !recipient) return undefined
    
    try {
      const amountWei = parseUnits(amount, 8) // SovaBTC has 8 decimals
      return {
        srcChainId: sourceChainId,
        dstChainId: destinationChainId,
        amount: amountWei,
        recipient
      }
    } catch {
      return undefined
    }
  }, [sourceChainId, destinationChainId, amount, recipient])

  // Fee estimation
  const { fee, isLoading: isFeeLoading, error: feeError } = useBridgeFee(
    bridgeParams?.dstChainId,
    bridgeParams?.amount,
    bridgeParams?.recipient
  )

  // Form validation
  const validation = useMemo(() => {
    if (!isConnected) {
      return { isValid: false, error: 'Please connect your wallet' }
    }

    if (chainId !== sourceChainId) {
      return { isValid: false, error: 'Please switch to the source chain' }
    }

    if (!amount || amount === '0') {
      return { isValid: false, error: 'Please enter an amount' }
    }

    if (!sovaBTCBalance) {
      return { isValid: false, error: 'Loading balance...' }
    }

    try {
      const amountWei = parseUnits(amount, 8)
      if (amountWei > sovaBTCBalance) {
        return { isValid: false, error: 'Insufficient SovaBTC balance' }
      }

      if (amountWei <= BigInt(0)) {
        return { isValid: false, error: 'Amount must be greater than 0' }
      }
    } catch {
      return { isValid: false, error: 'Invalid amount format' }
    }

    if (!recipient) {
      return { isValid: false, error: 'Please enter recipient address' }
    }

    if (!isSupported(sourceChainId, destinationChainId)) {
      return { isValid: false, error: 'Bridge route not supported' }
    }

    if (sourceChainId === destinationChainId) {
      return { isValid: false, error: 'Source and destination chains must be different' }
    }

    return { isValid: true, error: null }
  }, [
    isConnected,
    chainId,
    sourceChainId,
    destinationChainId,
    amount,
    sovaBTCBalance,
    recipient,
    isSupported
  ])

  // Handle bridge execution
  const handleBridge = async () => {
    if (!validation.isValid || !bridgeParams || !fee) {
      toast.error(validation.error || 'Invalid bridge parameters')
      return
    }

    try {
      await executeBridge(bridgeParams, fee)
      setAmount('')
      onSuccess?.(bridgeParams.srcChainId.toString()) // Placeholder for actual tx hash
    } catch (error) {
      console.error('Bridge failed:', error)
    }
  }

  // Handle max amount
  const handleMaxAmount = () => {
    if (sovaBTCBalance) {
      const maxAmount = formatUnits(sovaBTCBalance, 8)
      setAmount(maxAmount)
    }
  }

  const formattedBalance = sovaBTCBalance ? formatUnits(sovaBTCBalance, 8) : '0.00000000'
  const isProcessing = isBridging || isConfirming

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Bridge Form */}
      <Card className="border-2 border-sova-mint-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Bridge className="w-5 h-5" />
            Cross-Chain Bridge
          </CardTitle>
          <CardDescription className="text-sova-mint-100">
            Transfer SovaBTC seamlessly across different blockchains using LayerZero
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Balance Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sova-mint-50 to-sova-mint-100 rounded-lg">
            <div>
              <div className="text-sm text-sova-black-600">Your SovaBTC Balance</div>
              <div className="text-2xl font-bold text-sova-black-500">
                {formattedBalance} SovaBTC
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-sova-black-600">On {chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia'}</div>
              {pendingBridges.length > 0 && (
                <Badge variant="outline" className="mt-1">
                  {pendingBridges.length} Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Chain Selection */}
          <div>
            <Label className="text-lg font-semibold text-sova-black-500 mb-4 block">
              Select Bridge Route
            </Label>
            <ChainSelector
              sourceChainId={sourceChainId}
              destinationChainId={destinationChainId}
              onSourceChange={setSourceChainId}
              onDestinationChange={setDestinationChainId}
              disabled={isProcessing}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-sova-black-500">
              Amount to Bridge
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
                className="h-16 text-xl border-2 border-sova-mint-200 bg-white pr-32 focus:border-sova-mint-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxAmount}
                  disabled={isProcessing || !sovaBTCBalance}
                  className="h-8 px-3 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white text-xs font-semibold"
                >
                  MAX
                </Button>
                <span className="text-sm text-sova-black-600 font-medium">SovaBTC</span>
              </div>
            </div>
            <div className="text-sm text-sova-black-600">
              Available: {formattedBalance} SovaBTC
            </div>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-sova-black-500">
              Recipient Address
            </Label>
            <Input
              type="text"
              placeholder="0x..."
              value={recipient || ''}
              onChange={(e) => setRecipient(e.target.value as Address)}
              disabled={isProcessing}
              className="h-12 border-2 border-sova-mint-200 bg-white focus:border-sova-mint-500 font-mono"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => setRecipient(address)}
                disabled={!address || isProcessing}
                className="h-auto p-0 text-xs text-sova-mint-600"
              >
                Use my address
              </Button>
            </div>
          </div>

          <Separator className="bg-sova-mint-200" />

          {/* Bridge Summary */}
          {bridgeParams && fee && validation.isValid && (
            <BridgeSummary
              params={bridgeParams}
              fee={fee}
              amount={amount}
            />
          )}

          {/* Fee Information */}
          {fee && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Bridge Fee</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">LayerZero Fee:</span>
                  <span className="font-medium text-blue-900">
                    {formatUnits(fee.nativeFee, 18)} ETH
                  </span>
                </div>
                {fee.totalUSD && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">USD Estimate:</span>
                    <span className="font-medium text-blue-900">${fee.totalUSD}</span>
                  </div>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  Estimated completion: 2-5 minutes
                </div>
              </div>
            </div>
          )}

          {/* Bridge Button */}
          <Button
            onClick={handleBridge}
            disabled={!validation.isValid || isProcessing || isFeeLoading}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white shadow-2xl transition-all duration-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {isConfirming ? 'Confirming...' : 'Bridging...'}
              </>
            ) : isFeeLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Estimating Fee...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-3" />
                Bridge SovaBTC
              </>
            )}
          </Button>

          {/* Validation Errors */}
          {validation.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {validation.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Fee Error */}
          {feeError && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                {feeError}
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Bridge transactions are irreversible once confirmed</div>
            <div>• Always verify the recipient address before bridging</div>
            <div>• LayerZero fees are paid on the source chain</div>
            <div>• Large amounts may take longer to process</div>
          </div>
        </CardContent>
      </Card>

      {/* Bridge History */}
      <BridgeHistory
        transactions={bridgeHistory}
        onRetry={(txId) => {
          // Retry logic would be implemented here
          toast.info('Retry functionality coming soon')
        }}
      />
    </div>
  )
}

// Compact bridge form for mobile
export function CompactBridgeForm({ className, onSuccess }: BridgeFormProps) {
  const { address, isConnected } = useAccount()
  const [sourceChainId, setSourceChainId] = useState(84532)
  const [destinationChainId, setDestinationChainId] = useState(11155111)
  const [amount, setAmount] = useState('')

  const { sovaBTCBalance, isBridging, executeBridge, isSupported } = useBridge()

  const formattedBalance = sovaBTCBalance ? formatUnits(sovaBTCBalance, 8) : '0.00000000'

  return (
    <Card className={cn('border-sova-mint-200', className)}>
      <CardContent className="p-4 space-y-4">
        <div className="text-center">
          <div className="text-lg font-bold">Bridge SovaBTC</div>
          <div className="text-sm text-muted-foreground">
            Balance: {formattedBalance}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={sourceChainId}
              onChange={(e) => setSourceChainId(parseInt(e.target.value))}
              className="flex-1 p-2 border rounded"
            >
              <option value={84532}>Base Sepolia</option>
              <option value={11155111}>Ethereum Sepolia</option>
            </select>
            <ArrowRight className="w-4 h-4" />
            <select
              value={destinationChainId}
              onChange={(e) => setDestinationChainId(parseInt(e.target.value))}
              className="flex-1 p-2 border rounded"
            >
              <option value={84532}>Base Sepolia</option>
              <option value={11155111}>Ethereum Sepolia</option>
            </select>
          </div>

          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isBridging}
          />

          <Button
            onClick={() => {
              // Simplified bridge execution
              toast.info('Bridge functionality coming soon')
            }}
            disabled={!isConnected || isBridging || !amount}
            className="w-full"
          >
            {isBridging ? 'Bridging...' : 'Bridge'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}