import { baseSepolia } from 'viem/chains';

export const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: {
    // Core contracts
    SOVABTC: '0xeed47bE0221E383643073ecdBF2e804433e4b077' as `0x${string}`,
    SOVA_TOKEN: '0xDD4FFAB3ef55de9028BcADa261c32549b8d2Fc57' as `0x${string}`,
    WRAPPER: '0x9fAD9a07691fAB4D757fdE4F2c61F836A8Dcd87f' as `0x${string}`,
    TOKEN_WHITELIST: '0x73172C783Ac766CB951292C06a51f848A536cBc4' as `0x${string}`,
    CUSTODY_MANAGER: '0xa117C55511751097B2c9d1633118F73E10FaB2A9' as `0x${string}`,
    REDEMPTION_QUEUE: '0x07d01e0C535fD4777CcF5Ee8D66A90995cD74Cbb' as `0x${string}`,
    STAKING: '0x5e6f97391Aa64Bfb6018795dcdC277A2C9B15b66' as `0x${string}`,
    
    // Test tokens
    WBTC_TEST: '0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b' as `0x${string}`,
    LBTC_TEST: '0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C' as `0x${string}`,
    USDC_TEST: '0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE' as `0x${string}`,
  },
} as const;

// Helper to get addresses for current chain
export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses configured for chain ${chainId}`);
  }
  return addresses;
}

// Token configurations
export const TOKEN_CONFIGS = {
  [baseSepolia.id]: {
    WBTC: {
      address: '0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b' as `0x${string}`,
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logo: '/tokens/wbtc.svg',
    },
    LBTC: {
      address: '0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C' as `0x${string}`,
      symbol: 'LBTC',
      name: 'Liquid Bitcoin',
      decimals: 8,
      logo: '/tokens/lbtc.svg',
    },
    USDC: {
      address: '0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE' as `0x${string}`,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logo: '/tokens/usdc.svg',
    },
    SOVABTC: {
      address: '0xeed47bE0221E383643073ecdBF2e804433e4b077' as `0x${string}`,
      symbol: 'sovaBTC',
      name: 'Sova Wrapped Bitcoin',
      decimals: 8,
      logo: '/tokens/sovabtc.svg',
    },
  },
} as const;

export function getTokenConfig(chainId: number, tokenSymbol: string) {
  const tokens = TOKEN_CONFIGS[chainId as keyof typeof TOKEN_CONFIGS];
  if (!tokens || !tokens[tokenSymbol as keyof typeof tokens]) {
    throw new Error(`No token config for ${tokenSymbol} on chain ${chainId}`);
  }
  return tokens[tokenSymbol as keyof typeof tokens];
}