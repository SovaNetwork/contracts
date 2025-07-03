import { getContract } from 'viem';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';

// Import actual ABIs
import {
  SOVABTC_ABI,
  SOVA_TOKEN_ABI,
  SOVABTC_WRAPPER_ABI,
  TOKEN_WHITELIST_ABI,
  CUSTODY_MANAGER_ABI,
  REDEMPTION_QUEUE_ABI,
  SOVABTC_STAKING_ABI,
} from '@/contracts/abis';

// Import addresses and utilities
import { CONTRACT_ADDRESSES, type SupportedChainId, isSupportedChain, getContractAddress } from '@/contracts/addresses';

// Export contract ABIs for direct use with wagmi hooks
export {
  SOVABTC_ABI,
  SOVA_TOKEN_ABI,
  SOVABTC_WRAPPER_ABI,
  TOKEN_WHITELIST_ABI,
  CUSTODY_MANAGER_ABI,
  REDEMPTION_QUEUE_ABI,
  SOVABTC_STAKING_ABI,
};

// Export address utilities
export { CONTRACT_ADDRESSES, getContractAddress, isSupportedChain };

// Standard ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Contract configuration constants
export const CONTRACT_CONFIG = {
  // SovaBTC token decimals
  SOVABTC_DECIMALS: 8,
  
  // SOVA token decimals
  SOVA_TOKEN_DECIMALS: 18,
  
  // Common refresh intervals (in milliseconds)
  BALANCE_REFRESH_INTERVAL: 10000, // 10 seconds
  ALLOWANCE_REFRESH_INTERVAL: 30000, // 30 seconds
  STATIC_DATA_STALE_TIME: 300000, // 5 minutes
  
  // Transaction settings
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_UINT256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
} as const;

// Helper function to get token info for a given chain
export function getTokenInfo(chainId: SupportedChainId) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  
  return {
    sovabtc: {
      address: addresses.SOVABTC,
      symbol: 'SovaBTC',
      name: 'Sova Bitcoin',
      decimals: CONTRACT_CONFIG.SOVABTC_DECIMALS,
    },
    sovaToken: {
      address: addresses.SOVA_TOKEN,
      symbol: 'SOVA',
      name: 'Sova Token',
      decimals: CONTRACT_CONFIG.SOVA_TOKEN_DECIMALS,
    },
    testTokens: [
      {
        address: addresses.WBTC_TEST,
        symbol: 'WBTC',
        name: 'Mock Wrapped Bitcoin',
        decimals: 8,
      },
      {
        address: addresses.LBTC_TEST,
        symbol: 'LBTC',
        name: 'Mock Liquid Bitcoin',
        decimals: 8,
      },
      {
        address: addresses.USDC_TEST,
        symbol: 'USDC',
        name: 'Mock USD Coin',
        decimals: 6,
      },
    ],
  };
}

// Helper to get contract address for current chain
export function useContractAddress(contractKey: keyof (typeof CONTRACT_ADDRESSES)[SupportedChainId]) {
  return (chainId: SupportedChainId) => {
    if (!isSupportedChain(chainId)) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    return CONTRACT_ADDRESSES[chainId][contractKey];
  };
}

// Contract metadata for easier integration
export const CONTRACTS_METADATA = {
  SOVABTC: {
    abi: SOVABTC_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].SOVABTC,
  },
  SOVA_TOKEN: {
    abi: SOVA_TOKEN_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].SOVA_TOKEN,
  },
  WRAPPER: {
    abi: SOVABTC_WRAPPER_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].WRAPPER,
  },
  TOKEN_WHITELIST: {
    abi: TOKEN_WHITELIST_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].TOKEN_WHITELIST,
  },
  CUSTODY_MANAGER: {
    abi: CUSTODY_MANAGER_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].CUSTODY_MANAGER,
  },
  REDEMPTION_QUEUE: {
    abi: REDEMPTION_QUEUE_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].REDEMPTION_QUEUE,
  },
  STAKING: {
    abi: SOVABTC_STAKING_ABI,
    getAddress: (chainId: SupportedChainId) => CONTRACT_ADDRESSES[chainId].STAKING,
  },
} as const; 