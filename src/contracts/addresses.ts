import { baseSepolia } from 'viem/chains'

export const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: {
    SOVABTC: process.env.NEXT_PUBLIC_SOVABTC_ADDRESS! as `0x${string}`,
    SOVA_TOKEN: process.env.NEXT_PUBLIC_SOVA_TOKEN_ADDRESS! as `0x${string}`,
    WRAPPER: process.env.NEXT_PUBLIC_WRAPPER_ADDRESS! as `0x${string}`,
    TOKEN_WHITELIST: process.env.NEXT_PUBLIC_TOKEN_WHITELIST_ADDRESS! as `0x${string}`,
    CUSTODY_MANAGER: process.env.NEXT_PUBLIC_CUSTODY_MANAGER_ADDRESS! as `0x${string}`,
    REDEMPTION_QUEUE: process.env.NEXT_PUBLIC_REDEMPTION_QUEUE_ADDRESS! as `0x${string}`,
    STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS! as `0x${string}`,
    
    // Test Tokens
    WBTC_TEST: process.env.NEXT_PUBLIC_WBTC_TEST_ADDRESS! as `0x${string}`,
    LBTC_TEST: process.env.NEXT_PUBLIC_LBTC_TEST_ADDRESS! as `0x${string}`,
    USDC_TEST: process.env.NEXT_PUBLIC_USDC_TEST_ADDRESS! as `0x${string}`,
  },
} as const

export const SUPPORTED_CHAINS = [baseSepolia.id] as const
export type SupportedChainId = typeof SUPPORTED_CHAINS[number]

export function getContractAddress(
  chainId: SupportedChainId,
  contract: keyof typeof CONTRACT_ADDRESSES[SupportedChainId]
): `0x${string}` {
  return CONTRACT_ADDRESSES[chainId][contract]
}

export const TEST_TOKENS = [
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: CONTRACT_ADDRESSES[baseSepolia.id].WBTC_TEST,
    icon: '₿',
    color: 'from-orange-400 to-orange-600',
  },
  {
    symbol: 'LBTC',
    name: 'Liquid Bitcoin', 
    decimals: 8,
    address: CONTRACT_ADDRESSES[baseSepolia.id].LBTC_TEST,
    icon: '⚡',
    color: 'from-blue-400 to-blue-600',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: CONTRACT_ADDRESSES[baseSepolia.id].USDC_TEST,
    icon: '$',
    color: 'from-green-400 to-green-600',
  },
] as const

export type TestToken = typeof TEST_TOKENS[number]