// Contract ABIs for SovaBTC Protocol
// Generated: January 7, 2025

import sovaBTCOFT from './SovaBTCOFT.abi.json';
import sovaBTCWrapper from './SovaBTCWrapper.abi.json';
import tokenWhitelist from './TokenWhitelist.abi.json';
import custodyManager from './CustodyManager.abi.json';
import redemptionQueue from './RedemptionQueue.abi.json';
import sovaToken from './SOVAToken.abi.json';
import sovaBTCStaking from './SovaBTCStaking.abi.json';
import mockERC20BTC from './MockERC20BTC.abi.json';

export const ABIS = {
  // Core Protocol Contracts
  SovaBTCOFT: sovaBTCOFT,
  SovaBTCWrapper: sovaBTCWrapper,
  TokenWhitelist: tokenWhitelist,
  CustodyManager: custodyManager,
  RedemptionQueue: redemptionQueue,
  SOVAToken: sovaToken,
  SovaBTCStaking: sovaBTCStaking,
  
  // Test Token Contracts
  MockERC20BTC: mockERC20BTC,
  MockWBTC: mockERC20BTC,
  MockLBTC: mockERC20BTC,
  MockUSDC: mockERC20BTC,
} as const;

// Contract Addresses by Network
export const ADDRESSES = {
  // Base Sepolia (Chain ID: 84532)
  BASE_SEPOLIA: {
    chainId: 84532,
    sovaBTCOFT: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d',
    sovaBTCWrapper: '0x7a08aF83566724F59D81413f3bD572E58711dE7b',
    tokenWhitelist: '0x3793FaA1bD71258336c877427b105B2E74e8C030',
    custodyManager: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6',
    redemptionQueue: '0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab',
    sovaToken: '0x69041baA897687Cb16bCD57368110FfA2C8B3E63',
    sovaBTCStaking: '0x5646F20B47a6E969c735c0592D002fe3067235fc',
    mockWBTC: '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2',
    mockLBTC: '0xf6E78618CA4bAA67259970039F49e215f15820FE',
    mockUSDC: '0x0C19b539bc7C323Bec14C0A153B21D1295A42e38',
  },
  
  // Optimism Sepolia (Chain ID: 11155420)
  OPTIMISM_SEPOLIA: {
    chainId: 11155420,
    sovaBTCOFT: '0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30',
    sovaBTCWrapper: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d',
    tokenWhitelist: '0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d',
    custodyManager: '0x56b1F2664E5AceaBe31F64021bFF7744b7d391c7',
    redemptionQueue: '0x3793FaA1bD71258336c877427b105B2E74e8C030',
    sovaToken: '0xfd3CD6323c7c10d7d533D6ce86249A0c21a3A7fD',
    sovaBTCStaking: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6',
    mockWBTC: '0x6f5249F8507445F1F0178eD162097bc4a262404E',
    mockLBTC: '0xBc2945fa12bF06fC292dac00BbbaF1e52eFD5A22',
    mockUSDC: '0xA57484Ac87b23668A19f388eB5812cCc5A8D1EEe',
  },
} as const;

// Helper function to get addresses by chain ID
export function getAddressesByChainId(chainId: number) {
  switch (chainId) {
    case 84532:
      return ADDRESSES.BASE_SEPOLIA;
    case 11155420:
      return ADDRESSES.OPTIMISM_SEPOLIA;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

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

// Types for TypeScript
export type ChainId = 84532 | 11155420;
export type NetworkName = 'BASE_SEPOLIA' | 'OPTIMISM_SEPOLIA';
export type ContractName = keyof typeof ABIS;
export type ContractAddress = `0x${string}`; 