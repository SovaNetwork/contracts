export const PROTOCOL_CONSTANTS = {
  // Decimal precision for SovaBTC (8 decimals like Bitcoin)
  SOVABTC_DECIMALS: 8,
  
  // Minimum deposit amounts (in satoshis)
  MIN_DEPOSIT_SATOSHIS: 1000, // 0.00001 BTC
  
  // Redemption queue default delay (in seconds)
  DEFAULT_REDEMPTION_DELAY: 10 * 24 * 60 * 60, // 10 days
  
  // Gas limits for different operations
  GAS_LIMITS: {
    APPROVE: 50000,
    DEPOSIT: 150000,
    WITHDRAW: 200000,
    BRIDGE: 300000,
    STAKE: 100000,
    UNSTAKE: 100000,
  },
  
  // Slippage tolerance (in basis points, 100 = 1%)
  DEFAULT_SLIPPAGE: 100, // 1%
  
  // Refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    BALANCES: 10000, // 10 seconds
    TRANSACTIONS: 5000, // 5 seconds
    PRICES: 30000, // 30 seconds
  },
  
  // Transaction timeout (in milliseconds)
  TRANSACTION_TIMEOUT: 300000, // 5 minutes
  
  // Local storage keys
  STORAGE_KEYS: {
    TRANSACTION_HISTORY: 'sovabtc_transaction_history',
    BRIDGE_HISTORY: 'sovabtc_bridge_history',
    USER_SETTINGS: 'sovabtc_user_settings',
  },
  
  // Network-specific constants
  NETWORK_NAMES: {
    84532: 'Base Sepolia',
    11155111: 'Ethereum Sepolia',
    12345: 'Sova Testnet', // Replace with actual chain ID
  } as const,
  
  // LayerZero chain IDs (different from EVM chain IDs)
  LZ_CHAIN_IDS: {
    84532: 10160, // Base Sepolia
    11155111: 10161, // Ethereum Sepolia
    12345: 0, // Replace with actual Sova LZ chain ID
  } as const,
  
  // Token symbols and names
  TOKEN_INFO: {
    SOVABTC: {
      symbol: 'sovaBTC',
      name: 'SovaBTC',
      decimals: 8,
      icon: '/icons/sovabtc.svg',
    },
    SOVA: {
      symbol: 'SOVA',
      name: 'Sova Token',
      decimals: 18,
      icon: '/icons/sova.svg',
    },
  } as const,
  
  // External links
  EXTERNAL_LINKS: {
    DOCS: 'https://docs.sovabtc.com',
    GITHUB: 'https://github.com/sovabtc',
    TWITTER: 'https://twitter.com/sovabtc',
    DISCORD: 'https://discord.gg/sovabtc',
  } as const,
} as const

// Export commonly used constants
export const {
  SOVABTC_DECIMALS,
  MIN_DEPOSIT_SATOSHIS,
  DEFAULT_REDEMPTION_DELAY,
  GAS_LIMITS,
  DEFAULT_SLIPPAGE,
  REFRESH_INTERVALS,
  TRANSACTION_TIMEOUT,
  STORAGE_KEYS,
  NETWORK_NAMES,
  LZ_CHAIN_IDS,
  TOKEN_INFO,
  EXTERNAL_LINKS,
} = PROTOCOL_CONSTANTS

// Helper function to get network name
export const getNetworkName = (chainId: number): string => {
  return NETWORK_NAMES[chainId as keyof typeof NETWORK_NAMES] || `Chain ${chainId}`
}

// Helper function to get LayerZero chain ID
export const getLZChainId = (chainId: number): number => {
  return LZ_CHAIN_IDS[chainId as keyof typeof LZ_CHAIN_IDS] || 0
} 