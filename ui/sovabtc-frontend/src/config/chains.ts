import { defineChain } from 'viem'
import { baseSepolia, sepolia } from 'viem/chains'

// Base Sepolia (already defined in viem)
export const base = baseSepolia

// Ethereum Sepolia (already defined in viem)  
export const ethereum = sepolia

// Sova Testnet (custom chain)
export const sova = defineChain({
  id: 12345, // Replace with actual Sova chain ID
  name: 'Sova Testnet',
  nativeCurrency: {
    name: 'Sova',
    symbol: 'SOVA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sova.testnet'], // Replace with actual RPC URL
    },
  },
  blockExplorers: {
    default: {
      name: 'Sova Explorer',
      url: 'https://explorer.sova.testnet', // Replace with actual explorer URL
    },
  },
  testnet: true,
})

export const supportedChains = [base, ethereum, sova] as const
export type SupportedChain = typeof supportedChains[number]

// Chain-specific configuration
export const chainConfig = {
  [base.id]: {
    name: 'Base Sepolia',
    icon: '/icons/base.svg',
    nativeToken: 'ETH',
    hasImmediateBTCWithdraw: false,
  },
  [ethereum.id]: {
    name: 'Ethereum Sepolia', 
    icon: '/icons/ethereum.svg',
    nativeToken: 'ETH',
    hasImmediateBTCWithdraw: false,
  },
  [sova.id]: {
    name: 'Sova Testnet',
    icon: '/icons/sova.svg', 
    nativeToken: 'SOVA',
    hasImmediateBTCWithdraw: true,
  },
} as const 