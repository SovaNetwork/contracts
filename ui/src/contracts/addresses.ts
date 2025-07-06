// SovaBTC Protocol Contract Addresses - Base Sepolia (Chain ID: 84532)

export const CHAIN_ID = 84532 as const;

export const ADDRESSES = {
  // Core Protocol Contracts - Updated with fixes and minter role
  SOVABTC: '0x81d36279dd48cafc01b025e81953b4fac450c056' as const,
  SOVA_TOKEN: '0x8d25f27e41d15e5b26522d4ef2879a2efe2bd954' as const,
  TOKEN_WHITELIST: '0x055ccbcd0389151605057e844b86a5d8f372267e' as const,
  CUSTODY_MANAGER: '0xbb02190385cfa8e41b180e65ab28caf232f2789e' as const,
  WRAPPER: '0xdac0f81bafe105a86435910e67b6d532d6a9df52' as const,
  REDEMPTION_QUEUE: '0x174ccc052b36cab2a656ba89691d8a611d72eb64' as const,
  STAKING: '0x755bf172b35a333a40850350e7f10309a664420f' as const,
  
  // Test Tokens
  MOCK_USDC: '0xd6ea412149b7cbb80f9a81c0a99e5bda0434fbc7' as const,
  MOCK_WBTC: '0x8da7de3d18747ba6b8a788eb07dd40cd660ec860' as const,
  MOCK_LBTC: '0x51d539a147d92a00a040b8a43981a51f29b765f6' as const,
} as const;

// Token Information
export const TOKEN_INFO = {
  SOVABTC: {
    name: 'SovaBTC',
    symbol: 'sovaBTC',
    decimals: 8,
    address: ADDRESSES.SOVABTC,
  },
  SOVA: {
    name: 'SOVA Token',
    symbol: 'SOVA',
    decimals: 18,
    address: ADDRESSES.SOVA_TOKEN,
  },
  MOCK_USDC: {
    name: 'Mock USDC',
    symbol: 'USDC',
    decimals: 6,
    address: ADDRESSES.MOCK_USDC,
  },
  MOCK_WBTC: {
    name: 'Mock Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    address: ADDRESSES.MOCK_WBTC,
  },
  MOCK_LBTC: {
    name: 'Mock Liquid Bitcoin',
    symbol: 'LBTC',
    decimals: 8,
    address: ADDRESSES.MOCK_LBTC,
  },
} as const;

// Supported tokens for wrapping
export const SUPPORTED_TOKENS = [
  TOKEN_INFO.MOCK_WBTC,
  TOKEN_INFO.MOCK_LBTC,
  TOKEN_INFO.MOCK_USDC,
] as const;

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: CHAIN_ID,
  name: 'Base Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.basescan.org',
  rpcUrl: 'https://sepolia.base.org',
} as const;

// Contract function selectors for better TypeScript support
export const CONTRACT_FUNCTIONS = {
  WRAPPER: {
    deposit: 'deposit',
    withdraw: 'withdraw',
    getMinimumDeposit: 'getMinimumDeposit',
    getSupportedTokens: 'getSupportedTokens',
  },
  STAKING: {
    stake: 'stake',
    unstake: 'unstake',
    claimRewards: 'claimRewards',
    getStakingInfo: 'getStakingInfo',
    getPendingRewards: 'getPendingRewards',
  },
  REDEMPTION_QUEUE: {
    requestRedemption: 'requestRedemption',
    fulfillRedemption: 'fulfillRedemption',
    getRedemptionInfo: 'getRedemptionInfo',
    getQueuePosition: 'getQueuePosition',
  },
} as const;

// Type definitions for better TypeScript support
export type ContractAddress = typeof ADDRESSES[keyof typeof ADDRESSES];
export type TokenSymbol = keyof typeof TOKEN_INFO;
export type SupportedToken = typeof SUPPORTED_TOKENS[number];

// Helper functions
export const getTokenByAddress = (address: string) => {
  return Object.values(TOKEN_INFO).find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokenBySymbol = (symbol: string) => {
  return Object.values(TOKEN_INFO).find(token => 
    token.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

export const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatAddress = (address: string): string => {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Explorer URLs
export const getExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx'): string => {
  return `${NETWORK_CONFIG.explorerUrl}/${type}/${hash}`;
}; 