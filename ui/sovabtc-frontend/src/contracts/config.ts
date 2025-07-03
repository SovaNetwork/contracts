import { CONTRACT_ADDRESSES } from './addresses';
import { 
  ERC20_ABI, 
  SOVABTC_ABI, 
  SOVABTC_WRAPPER_ABI, 
  REDEMPTION_QUEUE_ABI, 
  SOVABTC_STAKING_ABI 
} from './abis';

export function getContractConfig(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return {
    sovaBTC: {
      address: addresses.SOVABTC as `0x${string}`,
      abi: SOVABTC_ABI,
    },
    sovaToken: {
      address: addresses.SOVA_TOKEN as `0x${string}`,
      abi: ERC20_ABI,
    },
    wrapper: {
      address: addresses.WRAPPER as `0x${string}`,
      abi: SOVABTC_WRAPPER_ABI,
    },
    redemptionQueue: {
      address: addresses.REDEMPTION_QUEUE as `0x${string}`,
      abi: REDEMPTION_QUEUE_ABI,
    },
    staking: {
      address: addresses.STAKING as `0x${string}`,
      abi: SOVABTC_STAKING_ABI,
    },
    // Test tokens
    testTokens: {
      WBTC: {
        address: addresses.WBTC_TEST as `0x${string}`,
        abi: ERC20_ABI,
      },
      LBTC: {
        address: addresses.LBTC_TEST as `0x${string}`,
        abi: ERC20_ABI,
      },
      USDC: {
        address: addresses.USDC_TEST as `0x${string}`,
        abi: ERC20_ABI,
      },
    },
  };
}

// Export contract addresses for easy access
export { CONTRACT_ADDRESSES } from './addresses';

// Export ABIs for direct use
export * from './abis';

// Token metadata for UI display
export const TOKEN_METADATA = {
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    icon: '/tokens/wbtc.svg',
  },
  LBTC: {
    symbol: 'LBTC',
    name: 'Liquid Bitcoin',
    decimals: 8,
    icon: '/tokens/lbtc.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '/tokens/usdc.svg',
  },
  SOVABTC: {
    symbol: 'sovaBTC',
    name: 'Sova Bitcoin',
    decimals: 8,
    icon: '/tokens/sovabtc.svg',
  },
  SOVA: {
    symbol: 'SOVA',
    name: 'Sova Token',
    decimals: 18,
    icon: '/tokens/sova.svg',
  },
} as const;

export type TokenSymbol = keyof typeof TOKEN_METADATA;