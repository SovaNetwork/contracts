import { Address } from 'viem'
import { TokenInfo } from '@/types/contracts'

// Common BTC-pegged tokens with metadata
export const KNOWN_BTC_TOKENS: Record<string, Omit<TokenInfo, 'address' | 'isWhitelisted'>> = {
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    icon: '/icons/wbtc.svg',
  },
  'tBTC': {
    symbol: 'tBTC',
    name: 'tBTC',
    decimals: 18,
    icon: '/icons/tbtc.svg',
  },
  'BTCB': {
    symbol: 'BTCB',
    name: 'Bitcoin BEP20',
    decimals: 18,
    icon: '/icons/btcb.svg',
  },
  'renBTC': {
    symbol: 'renBTC',
    name: 'renBTC',
    decimals: 8,
    icon: '/icons/renbtc.svg',
  },
  'sBTC': {
    symbol: 'sBTC',
    name: 'Synthetix BTC',
    decimals: 18,
    icon: '/icons/sbtc.svg',
  },
  'hBTC': {
    symbol: 'hBTC',
    name: 'Huobi BTC',
    decimals: 18,
    icon: '/icons/hbtc.svg',
  },
}

/**
 * Get token info from known tokens or create basic info
 */
export function getTokenInfo(
  address: Address,
  symbol?: string,
  name?: string,
  decimals?: number,
  isWhitelisted: boolean = false
): TokenInfo {
  // Try to find in known tokens first
  const knownToken = symbol ? KNOWN_BTC_TOKENS[symbol] : undefined
  
  return {
    address,
    symbol: symbol || 'UNKNOWN',
    name: name || knownToken?.name || 'Unknown Token',
    decimals: decimals || knownToken?.decimals || 18,
    icon: knownToken?.icon || '/icons/default-token.svg',
    isWhitelisted,
  }
}

/**
 * Check if a token is a known BTC token
 */
export function isKnownBTCToken(symbol: string): boolean {
  return symbol in KNOWN_BTC_TOKENS
}

/**
 * Get token icon URL with fallback
 */
export function getTokenIcon(symbol: string, customIcon?: string): string {
  if (customIcon) return customIcon
  
  const knownToken = KNOWN_BTC_TOKENS[symbol]
  return knownToken?.icon || '/icons/default-token.svg'
}

/**
 * Format token symbol for display
 */
export function formatTokenSymbol(symbol: string): string {
  return symbol.toUpperCase()
}

/**
 * Validate token address format
 */
export function isValidTokenAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Get display name for token (symbol or name if symbol is long)
 */
export function getTokenDisplayName(token: TokenInfo): string {
  if (token.symbol.length <= 6) {
    return token.symbol
  }
  return token.name.length <= 12 ? token.name : token.symbol
}

/**
 * Sort tokens by priority (whitelisted first, then by symbol)
 */
export function sortTokens(tokens: TokenInfo[]): TokenInfo[] {
  return tokens.sort((a, b) => {
    // Whitelisted tokens first
    if (a.isWhitelisted && !b.isWhitelisted) return -1
    if (!a.isWhitelisted && b.isWhitelisted) return 1
    
    // Then by symbol alphabetically
    return a.symbol.localeCompare(b.symbol)
  })
}

/**
 * Filter tokens by search query
 */
export function filterTokens(tokens: TokenInfo[], query: string): TokenInfo[] {
  if (!query.trim()) return tokens
  
  const lowerQuery = query.toLowerCase()
  
  return tokens.filter(token => 
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.name.toLowerCase().includes(lowerQuery) ||
    token.address.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get token by address from a list
 */
export function findTokenByAddress(tokens: TokenInfo[], address: Address): TokenInfo | undefined {
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase())
}

/**
 * Check if two token addresses are the same
 */
export function isSameToken(address1: Address, address2: Address): boolean {
  return address1.toLowerCase() === address2.toLowerCase()
}

/**
 * Get default token selection (first whitelisted token or first token)
 */
export function getDefaultToken(tokens: TokenInfo[]): TokenInfo | undefined {
  const whitelisted = tokens.find(token => token.isWhitelisted)
  return whitelisted || tokens[0]
}

/**
 * Validate token decimals (should be between 0 and 18)
 */
export function isValidTokenDecimals(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0 && decimals <= 18
}

/**
 * Create a mock token for testing/development
 */
export function createMockToken(
  symbol: string,
  decimals: number = 18,
  isWhitelisted: boolean = false
): TokenInfo {
  return {
    address: `0x${'0'.repeat(40)}` as Address, // Mock address
    symbol,
    name: `Mock ${symbol}`,
    decimals,
    icon: '/icons/default-token.svg',
    isWhitelisted,
  }
}

/**
 * Get token list for current environment
 */
export function getEnvironmentTokens(): TokenInfo[] {
  // In production, this would come from the contract
  // For development, return mock tokens
  if (process.env.NODE_ENV === 'development') {
    return [
      createMockToken('WBTC', 8, true),
      createMockToken('tBTC', 18, true),
      createMockToken('renBTC', 8, false),
    ]
  }
  
  return []
}

/**
 * Format token balance with proper decimals and symbol
 */
export function formatTokenBalance(
  balance: bigint,
  token: TokenInfo,
  maxDecimals: number = 6
): string {
  const formatted = Number(balance) / Math.pow(10, token.decimals)
  
  if (formatted === 0) return `0 ${token.symbol}`
  if (formatted < 0.000001) return `< 0.000001 ${token.symbol}`
  
  return `${formatted.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })} ${token.symbol}`
}

/**
 * Calculate USD value of token amount (placeholder for price integration)
 */
export function calculateTokenValue(
  amount: bigint,
  token: TokenInfo,
  priceUSD?: number
): number | undefined {
  if (!priceUSD) return undefined
  
  const tokenAmount = Number(amount) / Math.pow(10, token.decimals)
  return tokenAmount * priceUSD
}

/**
 * Check if token amount is dust (too small to be meaningful)
 */
export function isDustAmount(amount: bigint, decimals: number): boolean {
  const minThreshold = BigInt(10) ** BigInt(Math.max(0, decimals - 6)) // ~1 millionth of a token
  return amount < minThreshold && amount > BigInt(0)
} 