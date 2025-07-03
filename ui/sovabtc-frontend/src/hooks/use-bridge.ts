import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits } from 'viem'
import { useSovaBTC, useContractAddresses } from './use-contracts'
import { 
  BridgeParams, 
  BridgeStatus, 
  LayerZeroFee,
  generateBridgeCalldata,
  validateBridgeParams,
  getEstimatedBridgeTime,
  generateBridgeId,
  isBridgeSupported
} from '@/lib/layerzero-utils'
import { toast } from 'sonner'

// Bridge transaction history stored in localStorage
const BRIDGE_HISTORY_KEY = 'sovabtc_bridge_history'

interface BridgeTransaction extends BridgeStatus {
  id: string
  srcChainId: number
  dstChainId: number
  amount: bigint
  recipient: Address
  fee: LayerZeroFee
}

export function useBridge() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const addresses = useContractAddresses()
  const { balance: sovaBTCBalance, refetchBalance } = useSovaBTC()

  // Transaction state
  const [currentTx, setCurrentTx] = useState<{
    hash?: Address
    params?: BridgeParams
    fee?: LayerZeroFee
  }>()

  // Bridge execution
  const { writeContract: executeBridge, isPending: isBridging } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: currentTx?.hash,
  })

  // Bridge history
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTransaction[]>([])

  // Load bridge history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRIDGE_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setBridgeHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load bridge history:', error)
    }
  }, [])

  // Save bridge history to localStorage
  const saveBridgeHistory = useCallback((history: BridgeTransaction[]) => {
    try {
      localStorage.setItem(BRIDGE_HISTORY_KEY, JSON.stringify(history))
      setBridgeHistory(history)
    } catch (error) {
      console.error('Failed to save bridge history:', error)
    }
  }, [])

  // Update bridge transaction status
  const updateBridgeStatus = useCallback((
    id: string, 
    updates: Partial<BridgeStatus>
  ) => {
    setBridgeHistory(prev => {
      const updated = prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      )
      saveBridgeHistory(updated)
      return updated
    })
  }, [saveBridgeHistory])

  // Monitor transaction confirmation
  useEffect(() => {
    if (receipt && currentTx?.params) {
      const txId = generateBridgeId(
        currentTx.params.srcChainId,
        currentTx.params.dstChainId,
        Date.now()
      )

      if (receipt.status === 'success') {
        // Update to confirmed status
        updateBridgeStatus(txId, {
          srcTxHash: receipt.transactionHash,
          status: 'confirmed'
        })
        
        toast.success('Bridge transaction confirmed!')
        refetchBalance()
        setCurrentTx(undefined)
      } else {
        // Transaction failed
        updateBridgeStatus(txId, {
          status: 'failed'
        })
        
        toast.error('Bridge transaction failed')
        setCurrentTx(undefined)
      }
    }
  }, [receipt, currentTx, updateBridgeStatus, refetchBalance])

  // Execute bridge transaction
  const executeBridgeTransaction = useCallback(async (
    params: BridgeParams,
    fee: LayerZeroFee
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    // Validate parameters
    const validation = validateBridgeParams(params)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    // Check if user has sufficient balance
    if (!sovaBTCBalance || params.amount > sovaBTCBalance) {
      toast.error('Insufficient SovaBTC balance')
      return
    }

    try {
      // Generate LayerZero calldata
      const bridgeData = generateBridgeCalldata(params)
      
      // Create bridge transaction record
      const txId = generateBridgeId(
        params.srcChainId,
        params.dstChainId,
        Date.now()
      )

      const bridgeTx: BridgeTransaction = {
        id: txId,
        srcChainId: params.srcChainId,
        dstChainId: params.dstChainId,
        amount: params.amount,
        recipient: params.recipient,
        fee,
        status: 'pending',
        timestamp: Date.now(),
        estimatedTime: getEstimatedBridgeTime(params.srcChainId, params.dstChainId)
      }

      // Add to history
      const newHistory = [bridgeTx, ...bridgeHistory]
      saveBridgeHistory(newHistory)

      // Execute contract call
      const hash = await executeBridge({
        address: addresses.sovaBTC,
        abi: [
          {
            name: 'sendFrom',
            type: 'function',
            stateMutability: 'payable',
            inputs: [
              { name: '_from', type: 'address' },
              { name: '_dstChainId', type: 'uint16' },
              { name: '_toAddress', type: 'bytes' },
              { name: '_amount', type: 'uint256' },
              { name: '_refundAddress', type: 'address' },
              { name: '_zroPaymentAddress', type: 'address' },
              { name: '_adapterParams', type: 'bytes' }
            ],
            outputs: []
          }
        ],
        functionName: 'sendFrom',
        args: [
          address,
          bridgeData.dstChainId,
          bridgeData.recipient,
          bridgeData.amount,
          address, // refund address
          '0x0000000000000000000000000000000000000000', // zro payment address
          bridgeData.adapterParams
        ],
        value: fee.nativeFee
      })

      setCurrentTx({
        hash,
        params,
        fee
      })

      toast.success('Bridge transaction submitted')
      
    } catch (error) {
      console.error('Bridge execution failed:', error)
      toast.error('Failed to execute bridge transaction')
    }
  }, [
    isConnected,
    address,
    sovaBTCBalance,
    bridgeHistory,
    addresses.sovaBTC,
    executeBridge,
    saveBridgeHistory
  ])

  // Get user's bridge history
  const userBridgeHistory = useMemo(() => {
    if (!address) return []
    return bridgeHistory.filter(tx => 
      tx.recipient.toLowerCase() === address.toLowerCase()
    )
  }, [bridgeHistory, address])

  // Check if bridge is supported between chains
  const isSupported = useCallback((srcChainId: number, dstChainId: number) => {
    return isBridgeSupported(srcChainId, dstChainId)
  }, [])

  // Get pending bridge transactions
  const pendingBridges = useMemo(() => {
    return userBridgeHistory.filter(tx => 
      tx.status === 'pending' || tx.status === 'retrying'
    )
  }, [userBridgeHistory])

  // Retry failed bridge
  const retryBridge = useCallback(async (bridgeId: string) => {
    const bridge = bridgeHistory.find(tx => tx.id === bridgeId)
    if (!bridge || bridge.status !== 'failed') {
      toast.error('Cannot retry this bridge transaction')
      return
    }

    // Update status to retrying
    updateBridgeStatus(bridgeId, {
      status: 'retrying',
      retryCount: (bridge.retryCount || 0) + 1
    })

    // Re-execute with same parameters
    const params: BridgeParams = {
      srcChainId: bridge.srcChainId,
      dstChainId: bridge.dstChainId,
      amount: bridge.amount,
      recipient: bridge.recipient
    }

    await executeBridgeTransaction(params, bridge.fee)
  }, [bridgeHistory, updateBridgeStatus, executeBridgeTransaction])

  return {
    // State
    currentTx,
    isBridging,
    isConfirming,
    bridgeHistory: userBridgeHistory,
    pendingBridges,
    
    // Actions
    executeBridge: executeBridgeTransaction,
    retryBridge,
    
    // Utilities
    isSupported,
    
    // Data
    sovaBTCBalance,
    chainId,
  }
}

// Hook for bridge fee estimation
export function useBridgeFee(
  dstChainId?: number,
  amount?: bigint,
  recipient?: Address
) {
  const chainId = useChainId()
  const addresses = useContractAddresses()
  const [fee, setFee] = useState<LayerZeroFee>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const estimateFee = useCallback(async () => {
    if (!dstChainId || !amount || !recipient || chainId === dstChainId) {
      setFee(undefined)
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      // In a real implementation, this would call the LayerZero endpoint
      // For now, we'll estimate based on typical values
      const baseFee = parseUnits('0.001', 18) // 0.001 ETH base fee
      const amountFee = amount / BigInt(1000) // 0.1% of amount
      
      const estimatedFee: LayerZeroFee = {
        nativeFee: baseFee + amountFee,
        zroFee: BigInt(0),
        totalUSD: 2.5 // Estimated $2.50
      }

      setFee(estimatedFee)
    } catch (err) {
      console.error('Fee estimation failed:', err)
      setError('Failed to estimate bridge fee')
    } finally {
      setIsLoading(false)
    }
  }, [chainId, dstChainId, amount, recipient])

  useEffect(() => {
    estimateFee()
  }, [estimateFee])

  return {
    fee,
    isLoading,
    error,
    refetch: estimateFee
  }
}