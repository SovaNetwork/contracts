// SovaBTC Protocol Contract Integration
// Generated: January 7, 2025
// Frontend-ready ABIs and addresses

import { type Address } from 'viem';

// Import ABIs from the contracts folder
import sovaBTCOFT from '../SovaBTCOFT.abi.json';
import sovaBTCWrapper from '../SovaBTCWrapper.abi.json';
import tokenWhitelist from '../TokenWhitelist.abi.json';
import custodyManager from '../CustodyManager.abi.json';
import redemptionQueue from '../RedemptionQueue.abi.json';
import sovaToken from '../SOVAToken.abi.json';
import sovaBTCStaking from '../SovaBTCStaking.abi.json';
import mockERC20BTC from '../MockERC20BTC.abi.json';

// Contract ABIs
export const ABIS = {
  SovaBTCOFT: sovaBTCOFT,
  SovaBTCWrapper: sovaBTCWrapper,
  TokenWhitelist: tokenWhitelist,
  CustodyManager: custodyManager,
  RedemptionQueue: redemptionQueue,
  SOVAToken: sovaToken,
  SovaBTCStaking: sovaBTCStaking,
  MockERC20BTC: mockERC20BTC,
} as const;

// Contract Addresses by Network
export const ADDRESSES = {
  // Base Sepolia (Chain ID: 84532)
  84532: {
    chainId: 84532,
    networkName: 'Base Sepolia',
    sovaBTCOFT: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d' as Address,
    sovaBTCWrapper: '0x7a08aF83566724F59D81413f3bD572E58711dE7b' as Address,
    tokenWhitelist: '0x3793FaA1bD71258336c877427b105B2E74e8C030' as Address,
    custodyManager: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6' as Address,
    redemptionQueue: '0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab' as Address,
    sovaToken: '0x69041baA897687Cb16bCD57368110FfA2C8B3E63' as Address,
    sovaBTCStaking: '0x5646F20B47a6E969c735c0592D002fe3067235fc' as Address,
    mockWBTC: '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2' as Address,
    mockLBTC: '0xf6E78618CA4bAA67259970039F49e215f15820FE' as Address,
    mockUSDC: '0x0C19b539bc7C323Bec14C0A153B21D1295A42e38' as Address,
  },
  
  // Optimism Sepolia (Chain ID: 11155420)
  11155420: {
    chainId: 11155420,
    networkName: 'Optimism Sepolia',
    sovaBTCOFT: '0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30' as Address,
    sovaBTCWrapper: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d' as Address,
    tokenWhitelist: '0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d' as Address,
    custodyManager: '0x56b1F2664E5AceaBe31F64021bFF7744b7d391c7' as Address,
    redemptionQueue: '0x3793FaA1bD71258336c877427b105B2E74e8C030' as Address,
    sovaToken: '0xfd3CD6323c7c10d7d533D6ce86249A0c21a3A7fD' as Address,
    sovaBTCStaking: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6' as Address,
    mockWBTC: '0x6f5249F8507445F1F0178eD162097bc4a262404E' as Address,
    mockLBTC: '0xBc2945fa12bF06fC292dac00BbbaF1e52eFD5A22' as Address,
    mockUSDC: '0xA57484Ac87b23668A19f388eB5812cCc5A8D1EEe' as Address,
  },
} as const;

// Helper function to get addresses by chain ID
export function getContractAddresses(chainId: number) {
  const addresses = ADDRESSES[chainId as keyof typeof ADDRESSES];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}

// Supported chain IDs
export const SUPPORTED_CHAIN_IDS = [84532, 11155420] as const;

// Check if chain is supported
export function isSupportedChain(chainId: number): chainId is typeof SUPPORTED_CHAIN_IDS[number] {
  return SUPPORTED_CHAIN_IDS.includes(chainId as any);
}

// Export types for TypeScript
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];
export type ContractName = keyof typeof ABIS;
export type ContractAddresses = typeof ADDRESSES[SupportedChainId];

// Export individual ABIs for convenience
export {
  sovaBTCOFT,
  sovaBTCWrapper,
  tokenWhitelist,
  custodyManager,
  redemptionQueue,
  sovaToken,
  sovaBTCStaking,
  mockERC20BTC,
};

// Export ABIs with names expected by frontend hooks
export const SovaBTCOFTABI = sovaBTCOFT;
export const SovaBTCWrapperABI = sovaBTCWrapper;
export const RedemptionQueueABI = redemptionQueue;
export const TokenWhitelistABI = tokenWhitelist;
export const CustodyManagerABI = custodyManager;
export const SOVATokenABI = sovaToken;
export const SovaBTCStakingABI = sovaBTCStaking;
export const ERC20_ABI = mockERC20BTC; // Standard ERC20 ABI from mock token

// Legacy exports for backward compatibility
export const SOVABTC_OFT_ABI = sovaBTCOFT;
export const SOVABTC_WRAPPER_ABI = sovaBTCWrapper;
export const REDEMPTION_QUEUE_ABI = redemptionQueue;
export const TOKEN_WHITELIST_ABI = tokenWhitelist;
export const CUSTODY_MANAGER_ABI = custodyManager;
export const SOVA_TOKEN_ABI = sovaToken;
export const SOVABTC_STAKING_ABI = sovaBTCStaking; 