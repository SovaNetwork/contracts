import { Address } from 'viem'
import { base, ethereum, sova } from './chains'

// Contract addresses per chain - Base Sepolia Deployed Addresses
export const contractAddresses = {
  [base.id]: {
    sovaBTC: '0xeed47bE0221E383643073ecdBF2e804433e4b077' as Address,
    sovaToken: '0xDD4FFAB3ef55de9028BcADa261c32549b8d2Fc57' as Address,
    wrapper: '0x9fAD9a07691fAB4D757fdE4F2c61F836A8Dcd87f' as Address,
    tokenWhitelist: '0x73172C783Ac766CB951292C06a51f848A536cBc4' as Address,
    custodyManager: '0xa117C55511751097B2c9d1633118F73E10FaB2A9' as Address,
    redemptionQueue: '0x07d01e0C535fD4777CcF5Ee8D66A90995cD74Cbb' as Address,
    staking: '0x5e6f97391Aa64Bfb6018795dcdC277A2C9B15b66' as Address,
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

// Test tokens on Base Sepolia
export const testTokens = {
  [base.id]: {
    WBTC: '0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b' as Address, // 8 decimals
    LBTC: '0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C' as Address, // 8 decimals
    USDC: '0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE' as Address, // 6 decimals
  },
  [ethereum.id]: {
    // Add Ethereum Sepolia test tokens if needed
  },
  [sova.id]: {
    // Add Sova-specific test tokens if needed
  },
} as const

// Token metadata for proper display
export const tokenMetadata = {
  [base.id]: {
    '0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b': {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      icon: '/tokens/wbtc.svg',
    },
    '0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C': {
      symbol: 'LBTC', 
      name: 'Liquid Bitcoin',
      decimals: 8,
      icon: '/tokens/lbtc.svg',
    },
    '0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE': {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '/tokens/usdc.svg',
    },
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