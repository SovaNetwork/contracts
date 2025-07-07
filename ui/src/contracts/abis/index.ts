// Contract ABIs Export - SovaBTC Protocol

import SovaBTCABI from './SovaBTC.abi.json';
import SovaBTCOFTABI from './SovaBTCOFT.abi.json';
import SovaBTCWrapperABI from './SovaBTCWrapper.abi.json';
import SovaBTCStakingABI from './SovaBTCStaking.abi.json';
import SOVATokenABI from './SOVAToken.abi.json';
import RedemptionQueueABI from './RedemptionQueue.abi.json';
import CustodyManagerABI from './CustodyManager.abi.json';
import TokenWhitelistABI from './TokenWhitelist.abi.json';
import TestTokenABI from './TestToken.abi.json';
import ISovaBTCABI from './ISovaBTC.abi.json';

// Core Protocol ABIs
export {
  SovaBTCABI,
  SovaBTCOFTABI,
  SovaBTCWrapperABI,
  SovaBTCStakingABI,
  SOVATokenABI,
  RedemptionQueueABI,
  CustodyManagerABI,
  TokenWhitelistABI,
  ISovaBTCABI,
};

// Test Token ABIs
export {
  TestTokenABI,
};

// Standard ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'addedValue', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'subtractedValue', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const;

// ABI Collections for different contract types
export const CONTRACT_ABIS = {
  SOVABTC: SovaBTCABI,
  SOVABTC_OFT: SovaBTCOFTABI, // LayerZero OFT ABI
  WRAPPER: SovaBTCWrapperABI,
  STAKING: SovaBTCStakingABI,
  SOVA_TOKEN: SOVATokenABI,
  REDEMPTION_QUEUE: RedemptionQueueABI,
  CUSTODY_MANAGER: CustodyManagerABI,
  TOKEN_WHITELIST: TokenWhitelistABI,
  TEST_TOKEN: TestTokenABI,
  ERC20: ERC20_ABI,
} as const;

// Type definitions for better TypeScript support
export type ContractABI = typeof CONTRACT_ABIS[keyof typeof CONTRACT_ABIS];
export type ABIKey = keyof typeof CONTRACT_ABIS;

// Helper function to get ABI by key
export const getABI = (key: ABIKey) => {
  return CONTRACT_ABIS[key];
};

// Common event signatures for filtering
export const EVENT_SIGNATURES = {
  Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  Approval: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  Deposit: '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
  Withdrawal: '0x884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a9424364',
  Stake: '0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90',
  Unstake: '0x85082129d87b2fe11527cb1b3b7a520aeb5aa6913f88a3d8757fe40d1db02fdd',
  RedemptionRequested: '0x8cd3d30d8c5be7e0a4b2d3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a',
  RedemptionFulfilled: '0x9cd3d30d8c5be7e0a4b2d3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a',
} as const; 