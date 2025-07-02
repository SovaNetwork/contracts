import { Address } from 'viem'
import { base, ethereum, sova } from './chains'

// Contract addresses per chain
export const contractAddresses = {
  [base.id]: {
    sovaBTC: process.env.NEXT_PUBLIC_SOVABTC_BASE_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    wrapper: process.env.NEXT_PUBLIC_WRAPPER_BASE_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    staking: process.env.NEXT_PUBLIC_STAKING_BASE_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    layerZeroEndpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f', // Base Sepolia LZ endpoint
  },
  [ethereum.id]: {
    sovaBTC: process.env.NEXT_PUBLIC_SOVABTC_ETH_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    wrapper: process.env.NEXT_PUBLIC_WRAPPER_ETH_ADDRESS as Address || '0x0000000000000000000000000000000000000000', 
    staking: process.env.NEXT_PUBLIC_STAKING_ETH_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    layerZeroEndpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f', // Ethereum Sepolia LZ endpoint
  },
  [sova.id]: {
    sovaBTC: process.env.NEXT_PUBLIC_SOVABTC_SOVA_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    wrapper: process.env.NEXT_PUBLIC_WRAPPER_SOVA_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    staking: process.env.NEXT_PUBLIC_STAKING_SOVA_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
    layerZeroEndpoint: '0x0000000000000000000000000000000000000000', // Replace with Sova LZ endpoint if available
  },
} as const

// Common BTC-pegged tokens
export const btcTokens = {
  [base.id]: {
    WBTC: '0x0000000000000000000000000000000000000000', // Replace with actual WBTC address on Base Sepolia
    // Add other BTC tokens as needed
  },
  [ethereum.id]: {
    WBTC: '0x0000000000000000000000000000000000000000', // Replace with actual WBTC address on Ethereum Sepolia
    // Add other BTC tokens as needed
  },
  [sova.id]: {
    // Add Sova-specific BTC tokens
  },
} as const

// Simplified contract ABIs (will be replaced with actual ABIs)
export const contractABIs = {
  sovaBTC: [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'transfer',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ],
  wrapper: [
    {
      name: 'deposit',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [],
    },
    {
      name: 'getWhitelistedTokens',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address[]' }],
    },
    {
      name: 'isTokenWhitelisted',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'token', type: 'address' }],
      outputs: [{ name: '', type: 'bool' }],
    },
  ],
  staking: [
    {
      name: 'stake',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'amount', type: 'uint256' }],
      outputs: [],
    },
    {
      name: 'unstake',
      type: 'function', 
      stateMutability: 'nonpayable',
      inputs: [{ name: 'amount', type: 'uint256' }],
      outputs: [],
    },
    {
      name: 'getRewards',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'user', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ],
  erc20: [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'decimals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
    },
    {
      name: 'symbol',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'name', 
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ],
} as const

export type ContractName = keyof typeof contractABIs 