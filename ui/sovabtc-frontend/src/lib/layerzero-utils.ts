import { Address, parseUnits, formatUnits } from 'viem'

// LayerZero chain IDs for supported networks
export const LAYERZERO_CHAIN_IDS = {
  84532: 40245, // Base Sepolia -> LayerZero testnet ID
  11155111: 40161, // Ethereum Sepolia -> LayerZero testnet ID
  // Add Sova testnet when available
} as const

// LayerZero endpoint addresses per chain
export const LAYERZERO_ENDPOINTS = {
  84532: '0x6EDCE65403992e310A62460808c4b910D972f10f', // Base Sepolia
  11155111: '0x6EDCE65403992e310A62460808c4b910D972f10f', // Ethereum Sepolia
} as const

export interface LayerZeroFee {
  nativeFee: bigint
  zroFee: bigint
  totalUSD?: number
}

export interface BridgeParams {
  srcChainId: number
  dstChainId: number
  amount: bigint
  recipient: Address
  adapterParams?: string
}

export interface BridgeStatus {
  srcTxHash?: Address
  dstTxHash?: Address
  status: 'pending' | 'confirmed' | 'failed' | 'retrying'
  timestamp: number
  estimatedTime?: number
  retryCount?: number
}

/**
 * Get LayerZero chain ID from EVM chain ID
 */
export function getLayerZeroChainId(evmChainId: number): number | undefined {
  return LAYERZERO_CHAIN_IDS[evmChainId as keyof typeof LAYERZERO_CHAIN_IDS]
}

/**
 * Get LayerZero endpoint address for chain
 */
export function getLayerZeroEndpoint(chainId: number): Address | undefined {
  return LAYERZERO_ENDPOINTS[chainId as keyof typeof LAYERZERO_ENDPOINTS] as Address
}

/**
 * Encode adapter parameters for LayerZero
 */
export function encodeAdapterParams(
  version: number = 1,
  gasLimit: bigint = BigInt(200000),
  nativeForDst: bigint = BigInt(0),
  addressOnDst?: Address
): string {
  // Version 1: just gas limit
  if (version === 1) {
    return `0x0001${gasLimit.toString(16).padStart(8, '0')}`
  }
  
  // Version 2: gas limit + native amount + address
  if (version === 2 && addressOnDst) {
    return `0x0002${gasLimit.toString(16).padStart(8, '0')}${nativeForDst.toString(16).padStart(16, '0')}${addressOnDst.slice(2)}`
  }
  
  return '0x'
}

/**
 * Calculate estimated bridge time based on chains
 */
export function getEstimatedBridgeTime(srcChainId: number, dstChainId: number): number {
  // Base estimates in seconds
  const baseTime = 120 // 2 minutes base
  const chainModifier = Math.abs(srcChainId - dstChainId) > 10000 ? 60 : 0 // +1 min for cross-ecosystem
  
  return baseTime + chainModifier
}

/**
 * Generate bridge transaction data for OFT
 */
export function generateBridgeCalldata(params: BridgeParams): {
  dstChainId: number
  recipient: string
  amount: bigint
  adapterParams: string
} {
  const lzChainId = getLayerZeroChainId(params.dstChainId)
  
  if (!lzChainId) {
    throw new Error(`Unsupported destination chain: ${params.dstChainId}`)
  }

  return {
    dstChainId: lzChainId,
    recipient: params.recipient,
    amount: params.amount,
    adapterParams: params.adapterParams || encodeAdapterParams()
  }
}

/**
 * Parse LayerZero fee response
 */
export function parseLayerZeroFee(feeData: readonly [bigint, bigint]): LayerZeroFee {
  return {
    nativeFee: feeData[0],
    zroFee: feeData[1]
  }
}

/**
 * Format bridge amount for display
 */
export function formatBridgeAmount(amount: bigint, decimals: number = 8): string {
  const formatted = formatUnits(amount, decimals)
  const num = parseFloat(formatted)
  
  if (num >= 1) {
    return num.toFixed(6)
  } else {
    return num.toFixed(8)
  }
}

/**
 * Validate bridge parameters
 */
export function validateBridgeParams(params: BridgeParams): {
  isValid: boolean
  error?: string
} {
  // Check chain IDs
  if (params.srcChainId === params.dstChainId) {
    return { isValid: false, error: 'Source and destination chains cannot be the same' }
  }

  if (!getLayerZeroChainId(params.dstChainId)) {
    return { isValid: false, error: 'Destination chain not supported' }
  }

  // Check amount
  if (params.amount <= BigInt(0)) {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }

  // Check recipient
  if (!params.recipient || params.recipient === '0x0000000000000000000000000000000000000000') {
    return { isValid: false, error: 'Invalid recipient address' }
  }

  return { isValid: true }
}

/**
 * Get bridge status text
 */
export function getBridgeStatusText(status: BridgeStatus['status']): string {
  switch (status) {
    case 'pending':
      return 'Processing...'
    case 'confirmed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'retrying':
      return 'Retrying...'
    default:
      return 'Unknown'
  }
}

/**
 * Get bridge status color
 */
export function getBridgeStatusColor(status: BridgeStatus['status']): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'confirmed':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'retrying':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Generate unique bridge transaction ID
 */
export function generateBridgeId(
  srcChainId: number,
  dstChainId: number,
  timestamp: number,
  nonce?: bigint
): string {
  const base = `bridge_${srcChainId}_${dstChainId}_${timestamp}`
  return nonce ? `${base}_${nonce.toString()}` : base
}

/**
 * Check if chains are supported for bridging
 */
export function isBridgeSupported(srcChainId: number, dstChainId: number): boolean {
  return !!(
    getLayerZeroChainId(srcChainId) && 
    getLayerZeroChainId(dstChainId) &&
    srcChainId !== dstChainId
  )
}

/**
 * Get supported bridge routes
 */
export function getSupportedBridgeRoutes(): Array<{
  from: number
  to: number
  fromName: string
  toName: string
}> {
  const chains = [
    { id: 84532, name: 'Base Sepolia' },
    { id: 11155111, name: 'Ethereum Sepolia' }
  ]

  const routes = []
  for (const from of chains) {
    for (const to of chains) {
      if (from.id !== to.id) {
        routes.push({
          from: from.id,
          to: to.id,
          fromName: from.name,
          toName: to.name
        })
      }
    }
  }
  
  return routes
}

/**
 * Estimate gas for bridge transaction
 */
export function estimateBridgeGas(
  srcChainId: number,
  dstChainId: number,
  amount: bigint
): bigint {
  // Base gas estimate
  let gasEstimate = BigInt(200000) // 200k base
  
  // Add gas based on amount (larger amounts might need more gas)
  const amountEth = formatUnits(amount, 18)
  if (parseFloat(amountEth) > 1) {
    gasEstimate += BigInt(50000) // +50k for large amounts
  }
  
  // Cross-ecosystem bridge costs more
  if (Math.abs(srcChainId - dstChainId) > 10000) {
    gasEstimate += BigInt(100000) // +100k for cross-ecosystem
  }
  
  return gasEstimate
}