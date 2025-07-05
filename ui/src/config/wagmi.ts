'use client'

import { configureChains, createConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

// Custom Base Sepolia chain configuration
export const baseSepoliaChain = {
  id: 84531,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://base-sepolia.blockpi.network/v1/rpc/public'],
    },
    public: {
      http: ['https://base-sepolia.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://base-sepolia.basescan.org' },
  },
} as const

// Configure chains with JSON RPC provider
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [baseSepoliaChain],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: baseSepoliaChain.rpcUrls.default.http[0],
      }),
    }),
  ],
)

// Set up wallet connectors using RainbowKit helper
const { connectors } = getDefaultWallets({
  appName: 'SovaBTC dApp',
  chains,
})

// Create wagmi configuration
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }
