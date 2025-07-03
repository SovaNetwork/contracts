// Contract addresses for SovaBTC on Base Sepolia
import { baseSepolia } from 'viem/chains';

export const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: {
    SOVABTC: '0xeed47bE0221E383643073ecdBF2e804433e4b077' as `0x${string}`,
    SOVA_TOKEN: '0xDD4FFAB3ef55de9028BcADa261c32549b8d2Fc57' as `0x${string}`,
    WRAPPER: '0x9fAD9a07691fAB4D757fdE4F2c61F836A8Dcd87f' as `0x${string}`,
    TOKEN_WHITELIST: '0x73172C783Ac766CB951292C06a51f848A536cBc4' as `0x${string}`,
    CUSTODY_MANAGER: '0xa117C55511751097B2c9d1633118F73E10FaB2A9' as `0x${string}`,
    REDEMPTION_QUEUE: '0x07d01e0C535fD4777CcF5Ee8D66A90995cD74Cbb' as `0x${string}`,
    STAKING: '0x5e6f97391Aa64Bfb6018795dcdC277A2C9B15b66' as `0x${string}`,
    
    // Test Tokens
    WBTC_TEST: '0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b' as `0x${string}`,
    LBTC_TEST: '0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C' as `0x${string}`,
    USDC_TEST: '0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE' as `0x${string}`,
  },
} as const;

export const SUPPORTED_CHAINS = [baseSepolia.id] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number];

export function getContractAddress(
  chainId: SupportedChainId,
  contract: keyof typeof CONTRACT_ADDRESSES[SupportedChainId]
): `0x${string}` {
  const address = CONTRACT_ADDRESSES[chainId]?.[contract];
  if (!address) {
    throw new Error(`Contract ${contract} not found on chain ${chainId}`);
  }
  return address;
}

// Helper to check if chain is supported
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAINS.includes(chainId as SupportedChainId);
}

// Get all test tokens for the UI
export function getTestTokens(chainId: SupportedChainId) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  
  return [
    {
      symbol: 'WBTC',
      name: 'Mock Wrapped Bitcoin',
      decimals: 8,
      address: addresses.WBTC_TEST,
      contractKey: 'WBTC_TEST' as const,
    },
    {
      symbol: 'LBTC',
      name: 'Mock Liquid Bitcoin',
      decimals: 8,
      address: addresses.LBTC_TEST,
      contractKey: 'LBTC_TEST' as const,
    },
    {
      symbol: 'USDC',
      name: 'Mock USD Coin',
      decimals: 6,
      address: addresses.USDC_TEST,
      contractKey: 'USDC_TEST' as const,
    },
  ];
}

// Block explorer URLs
export const BLOCK_EXPLORER_URLS = {
  [baseSepolia.id]: 'https://sepolia.basescan.org',
} as const;

export function getBlockExplorerUrl(chainId: SupportedChainId): string {
  return BLOCK_EXPLORER_URLS[chainId];
}

export function getTransactionUrl(chainId: SupportedChainId, hash: string): string {
  return `${getBlockExplorerUrl(chainId)}/tx/${hash}`;
}

export function getAddressUrl(chainId: SupportedChainId, address: string): string {
  return `${getBlockExplorerUrl(chainId)}/address/${address}`;
}