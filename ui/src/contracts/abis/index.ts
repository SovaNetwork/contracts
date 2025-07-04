// Import your ABIs here (copy from ../../abis/)
import SovaBTCABI from './SovaBTC.abi.json'
import SOVATokenABI from './SOVAToken.abi.json'
import SovaBTCWrapperABI from './SovaBTCWrapper.abi.json'
import TokenWhitelistABI from './TokenWhitelist.abi.json'
import CustodyManagerABI from './CustodyManager.abi.json'
import RedemptionQueueABI from './RedemptionQueue.abi.json'
import SovaBTCStakingABI from './SovaBTCStaking.abi.json'

// Standard ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const

// Export ABIs with proper typing
export const SOVABTC_ABI = SovaBTCABI
export const SOVA_TOKEN_ABI = SOVATokenABI
export const SOVABTC_WRAPPER_ABI = SovaBTCWrapperABI
export const TOKEN_WHITELIST_ABI = TokenWhitelistABI
export const CUSTODY_MANAGER_ABI = CustodyManagerABI
export const REDEMPTION_QUEUE_ABI = RedemptionQueueABI
export const SOVABTC_STAKING_ABI = SovaBTCStakingABI