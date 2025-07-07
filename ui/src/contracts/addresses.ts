// SovaBTC Protocol Multi-Chain Configuration - UPDATED FOR OFT DEPLOYMENT
// LayerZero OFT-enabled contracts deployed across multiple testnets

import { type Address } from 'viem';

// Chain Configuration Type with LayerZero support
export type ChainConfig = {
  chainId: number;
  name: string;
  shortName: string;
  icon: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorers: {
    name: string;
    url: string;
  }[];
  contracts: {
    sovaBTC: Address; // Now OFT-enabled for cross-chain transfers
    sovaToken: Address;
    tokenWhitelist: Address;
    custodyManager: Address;
    wrapper: Address;
    redemptionQueue: Address;
    staking: Address;
  };
  layerZero?: {
    endpoint: Address;
    eid: number; // LayerZero Endpoint ID
  };
  supportedTokens: {
    [symbol: string]: {
      name: string;
      symbol: string;
      address: Address;
      decimals: number;
      icon: string;
      isNative?: boolean;
    };
  };
};

// Multi-Chain Configuration - UPDATED WITH OFT ADDRESSES
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Ethereum Sepolia (DEPLOYED ✅)
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'ETH_SEPOLIA',
    icon: '/icons/ethereum.svg',
    isTestnet: true,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      'https://ethereum-sepolia.publicnode.com',
      'https://rpc.sepolia.org',
    ],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://sepolia.etherscan.io',
      },
    ],
    contracts: {
      sovaBTC: '0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1', // OFT Contract (UPDATED)
      sovaToken: '0x945a306339dd7fe6edd73705adf00337b167a482',
      tokenWhitelist: '0xf03b500351fa5a7cbe64ba0387c97d68331ea3c9',
      custodyManager: '0xe3c0fe7911a0813a6a880c640a71f59619638d77',
      wrapper: '0x37cc44e3b6c9386284e3a9f5b047c6933a80be0d',
      redemptionQueue: '0x2415a13271aa21dbac959b8143e072934dbc41c6',
      staking: '0x07bd8b4fd40c6ad514fe5e1770016759258cda6f',
    },
    layerZero: {
      endpoint: '0x1a44076050125825900e736c501f859c50fE728c',
      eid: 40161, // Ethereum Sepolia EID
    },
    supportedTokens: {
      WBTC: {
        name: 'Test Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0xb855b4aecabc18f65671efa337b17f86a6e24a61',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      LBTC: {
        name: 'Test Liquid Bitcoin',
        symbol: 'LBTC',
        address: '0xa433c557b13f69771184f00366e14b3d492578cf',
        decimals: 8,
        icon: '/icons/lbtc.svg',
      },
      USDC: {
        name: 'Test USD Coin',
        symbol: 'USDC',
        address: '0x0f7900ae7506196bff662ce793742980ed7d58ee',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Base Sepolia (DEPLOYED ✅)
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    shortName: 'BASE_SEPOLIA',
    icon: '/icons/base.svg',
    isTestnet: true,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia.infura.io/v3/YOUR_INFURA_KEY',
    ],
    blockExplorers: [
      {
        name: 'BaseScan',
        url: 'https://sepolia.basescan.org',
      },
    ],
    contracts: {
      sovaBTC: '0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be', // OFT Contract (UPDATED)
      sovaToken: '0xF370D61586B03A72c90C26e24a219332183A05b7', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
      tokenWhitelist: '0x94F983EB3Fd547b68E1760E2fe2193811f8f7c4e', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
      custodyManager: '0x78Ea93068bF847fF1703Dde09a772FC339CA4433', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
      wrapper: '0xA73550548804cFf5dD23F1C67e360C3a22433f53', // FIXED: New wrapper that points to OFT contract
      redemptionQueue: '0xBb95e1e4DbaaB783264947c19fA4e7398621af23', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
      staking: '0x119878F441C4300033e07f1B3cE66462519a005c', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
    },
    layerZero: {
      endpoint: '0x1a44076050125825900e736c501f859c50fE728c',
      eid: 40245, // Base Sepolia EID
    },
    supportedTokens: {
      WBTC: {
        name: 'Mock Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      LBTC: {
        name: 'Mock Liquid Bitcoin',
        symbol: 'LBTC',
        address: '0x7087Eb81f647448F1bd76e936A9F9A39775bC4Dc', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
        decimals: 8,
        icon: '/icons/lbtc.svg',
      },
      USDC: {
        name: 'Mock USDC',
        symbol: 'USDC',
        address: '0x52BA51f41713270e8071218058C3E37E1c2D4f20', // LATEST: From OFT_DEPLOYMENT_COMPLETE.md
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Optimism Sepolia (DEPLOYED ✅)
  11155420: {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    shortName: 'OP_SEPOLIA',
    icon: '/icons/optimism.svg',
    isTestnet: true,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://sepolia.optimism.io',
      'https://optimism-sepolia.infura.io/v3/YOUR_INFURA_KEY',
      'https://optimism-sepolia.publicnode.com',
    ],
    blockExplorers: [
      {
        name: 'Optimistic Etherscan',
        url: 'https://sepolia-optimism.etherscan.io',
      },
    ],
    contracts: {
      sovaBTC: '0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b', // OFT Contract (UPDATED)
      sovaToken: '0xb21dD6c1E73288C03f8f2Ec0A896F2cCC5590cBa',
      tokenWhitelist: '0x319501B1da942abA28854Dd573cd088CBd0bDF4C',
      custodyManager: '0xCdBFaB2F5760d320C7c4024A5e676248ba956c7D',
      wrapper: '0xd6ea412149B7cbb80f9A81c0a99e5BDa0434fBC7', // FIXED: New wrapper that points to OFT contract
      redemptionQueue: '0x205B8115068801576901A544e96E4C051834FBe4',
      staking: '0xeA52f7F6a12199bc112a2E00CEB1ddDB26aB3fe2',
    },
    layerZero: {
      endpoint: '0x1a44076050125825900e736c501f859c50fE728c',
      eid: 40232, // Optimism Sepolia EID
    },
    supportedTokens: {
      WBTC: {
        name: 'Test Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x412Bd95e843b7982702F12b8De0a5d414B482653',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      LBTC: {
        name: 'Test Liquid Bitcoin',
        symbol: 'LBTC',
        address: '0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1',
        decimals: 8,
        icon: '/icons/lbtc.svg',
      },
      USDC: {
        name: 'Test USD Coin', 
        symbol: 'USDC',
        address: '0x576BDBf8fE1a11c097c3FBba20162522Cd84cDA6',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Ethereum Mainnet (Future Production)
  1: {
    chainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    icon: '/icons/ethereum.svg',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',
      'https://cloudflare-eth.com',
    ],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io',
      },
    ],
    contracts: {
      sovaBTC: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      sovaToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      tokenWhitelist: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      custodyManager: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      wrapper: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      redemptionQueue: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      staking: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    },
    supportedTokens: {
      WBTC: {
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      LBTC: {
        name: 'Lombard Staked Bitcoin',
        symbol: 'LBTC',
        address: '0x8236a87084f8B84306f72007F36F2618A5634494',
        decimals: 8,
        icon: '/icons/lbtc.svg',
      },
      USDC: {
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0xA0b86a33E6417C0A966FFBF0C08D5eF17E9C7E69',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Base Mainnet (Future Production)
  8453: {
    chainId: 8453,
    name: 'Base',
    shortName: 'BASE',
    icon: '/icons/base.svg',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    ],
    blockExplorers: [
      {
        name: 'BaseScan',
        url: 'https://basescan.org',
      },
    ],
    contracts: {
      sovaBTC: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      sovaToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      tokenWhitelist: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      custodyManager: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      wrapper: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      redemptionQueue: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      staking: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    },
    supportedTokens: {
      WBTC: {
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x1fA3F25Be52aee73F6cbdb4b2F0316C25E9DE5ba',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      USDC: {
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Arbitrum One (Future Production)
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'ARB',
    icon: '/icons/arbitrum.svg',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    ],
    blockExplorers: [
      {
        name: 'Arbiscan',
        url: 'https://arbiscan.io',
      },
    ],
    contracts: {
      sovaBTC: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      sovaToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      tokenWhitelist: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      custodyManager: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      wrapper: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      redemptionQueue: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      staking: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    },
    supportedTokens: {
      WBTC: {
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      USDC: {
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },

  // Optimism Mainnet (Future Production)
  10: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'OP',
    icon: '/icons/optimism.svg',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    ],
    blockExplorers: [
      {
        name: 'Optimistic Etherscan',
        url: 'https://optimistic.etherscan.io',
      },
    ],
    contracts: {
      sovaBTC: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      sovaToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      tokenWhitelist: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      custodyManager: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      wrapper: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      redemptionQueue: '0x0000000000000000000000000000000000000000', // TODO: Deploy
      staking: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    },
    supportedTokens: {
      WBTC: {
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
      USDC: {
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
    },
  },
} as const;

// Default Configuration - Updated to use Ethereum Sepolia
export const DEFAULT_CHAIN_ID = 11155111; // Ethereum Sepolia as default
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);

// Cross-chain helper functions
export const getLayerZeroEid = (chainId: number): number | undefined => {
  return CHAIN_CONFIGS[chainId]?.layerZero?.eid;
};

export const getChainByLayerZeroEid = (eid: number): ChainConfig | undefined => {
  return Object.values(CHAIN_CONFIGS).find(chain => chain.layerZero?.eid === eid);
};

export const getCrossChainSupportedChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.layerZero);
};

// Backward Compatibility - Legacy exports for existing code
export const CHAIN_ID = DEFAULT_CHAIN_ID;
export const ADDRESSES = CHAIN_CONFIGS[DEFAULT_CHAIN_ID].contracts;
export const TOKEN_INFO = {
  SOVABTC: {
    name: 'SovaBTC',
    symbol: 'sovaBTC',
    decimals: 8,
    address: ADDRESSES.sovaBTC,
  },
  SOVA: {
    name: 'SOVA Token',
    symbol: 'SOVA',
    decimals: 18,
    address: ADDRESSES.sovaToken,
  },
  ...CHAIN_CONFIGS[DEFAULT_CHAIN_ID].supportedTokens,
} as const;

export const SUPPORTED_TOKENS = Object.values(CHAIN_CONFIGS[DEFAULT_CHAIN_ID].supportedTokens);
export const NETWORK_CONFIG = {
  chainId: CHAIN_CONFIGS[DEFAULT_CHAIN_ID].chainId,
  name: CHAIN_CONFIGS[DEFAULT_CHAIN_ID].name,
  currency: CHAIN_CONFIGS[DEFAULT_CHAIN_ID].nativeCurrency.symbol,
  explorerUrl: CHAIN_CONFIGS[DEFAULT_CHAIN_ID].blockExplorers[0].url,
  rpcUrl: CHAIN_CONFIGS[DEFAULT_CHAIN_ID].rpcUrls[0],
} as const;

// Multi-Chain Helper Functions
export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return CHAIN_CONFIGS[chainId];
};

export const getSupportedChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS);
};

export const getMainnetChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet);
};

export const getTestnetChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.isTestnet);
};

export const isChainSupported = (chainId: number): boolean => {
  return chainId in CHAIN_CONFIGS;
};

export const getContractAddress = (chainId: number, contract: keyof ChainConfig['contracts']): Address | undefined => {
  const config = getChainConfig(chainId);
  return config?.contracts[contract];
};

export const getSupportedTokens = (chainId: number) => {
  const config = getChainConfig(chainId);
  return config ? Object.values(config.supportedTokens) : [];
};

export const getTokenBySymbol = (chainId: number, symbol: string) => {
  const config = getChainConfig(chainId);
  return config?.supportedTokens[symbol];
};

export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string => {
  const config = getChainConfig(chainId);
  const baseUrl = config?.blockExplorers[0]?.url || 'https://etherscan.io';
  return `${baseUrl}/${type}/${hash}`;
};

// Legacy Helper Functions (maintained for backward compatibility)
export const getTokenByAddress = (address: string) => {
  return Object.values(TOKEN_INFO).find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
};

export const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatAddress = (address: string): string => {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Type exports
export type ContractAddress = Address;
export type TokenSymbol = string;
export type SupportedChainId = keyof typeof CHAIN_CONFIGS; 