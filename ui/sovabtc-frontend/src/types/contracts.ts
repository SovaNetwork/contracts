import { Address } from 'viem'

// Transaction status types
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error'

// Transaction types
export type TransactionType = 'deposit' | 'withdraw' | 'bridge' | 'stake' | 'unstake' | 'redeem' | 'approve'

// Token information
export interface TokenInfo {
  address: Address
  symbol: string
  name: string
  decimals: number
  icon?: string
  isWhitelisted?: boolean
}

// Balance information
export interface Balance {
  raw: bigint
  formatted: string
  decimals: number
  symbol: string
}

// Transaction data
export interface Transaction {
  hash: string
  type: TransactionType
  status: TransactionStatus
  timestamp: number
  chainId: number
  from: Address
  to?: Address
  amount?: string
  token?: string
  gasUsed?: string
  gasPrice?: string
  error?: string
}

// Bridge transaction data
export interface BridgeTransaction extends Transaction {
  sourceChainId: number
  destinationChainId: number
  lzTxHash?: string
  messageStatus?: 'pending' | 'delivered' | 'failed'
  estimatedDeliveryTime?: number
}

// Deposit form data
export interface DepositFormData {
  token: Address
  amount: string
  slippage: number
}

// Bridge form data
export interface BridgeFormData {
  sourceChainId: number
  destinationChainId: number
  amount: string
  recipient?: Address
}

// Staking information
export interface StakingInfo {
  stakedAmount: bigint
  earnedRewards: bigint
  apr: number
  totalStaked: bigint
  rewardRate: bigint
  lockPeriod?: number
  unlockTime?: number
}

// Redemption request
export interface RedemptionRequest {
  id: string
  requester: Address
  token: Address
  amount: bigint
  requestTime: number
  readyTime: number
  fulfilled: boolean
  chainId: number
}

// Queue status
export interface QueueStatus {
  position: number
  totalInQueue: number
  estimatedWaitTime: number
  isReady: boolean
}

// Protocol statistics
export interface ProtocolStats {
  totalValueLocked: string
  totalSupply: string
  bridgeVolume24h: string
  stakingApr: number
  activeUsers: number
}

// User portfolio
export interface UserPortfolio {
  totalBalance: Balance
  balancesByChain: Record<number, Balance>
  stakingPositions: StakingInfo[]
  pendingTransactions: Transaction[]
  redemptionRequests: RedemptionRequest[]
}

// Network configuration
export interface NetworkConfig {
  chainId: number
  name: string
  icon: string
  nativeToken: string
  hasImmediateBTCWithdraw: boolean
  blockExplorer: string
  rpcUrl: string
}

// Contract addresses for a specific chain
export interface ChainContracts {
  sovaBTC: Address
  wrapper: Address
  staking: Address
  layerZeroEndpoint: Address
}

// Gas estimation result
export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  gasCost: bigint
  gasCostUSD?: number
}

// Error types
export interface ContractError {
  code: string
  message: string
  details?: unknown
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

// Webhook/event data structures
export interface DepositEvent {
  user: Address
  token: Address
  amount: bigint
  sovaBTCAmount: bigint
  timestamp: number
  transactionHash: string
}

export interface WithdrawEvent {
  user: Address
  token: Address
  amount: bigint
  timestamp: number
  transactionHash: string
}

export interface BridgeEvent {
  user: Address
  amount: bigint
  sourceChain: number
  destinationChain: number
  timestamp: number
  transactionHash: string
}

export interface StakeEvent {
  user: Address
  amount: bigint
  timestamp: number
  transactionHash: string
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined
}

// Hook return types
export interface UseContractReturn<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseTransactionReturn {
  write: () => void
  data: string | undefined
  isLoading: boolean
  isSuccess: boolean
  error: Error | null
  reset: () => void
}

// Utility types
export type ChainId = number
export type TokenSymbol = string
export type AmountString = string

// Configuration types
export interface AppConfig {
  features: {
    staking: boolean
    bridging: boolean
    redemption: boolean
    admin: boolean
  }
  networks: NetworkConfig[]
  defaultChain: ChainId
  refreshIntervals: {
    balances: number
    transactions: number
    prices: number
  }
} 