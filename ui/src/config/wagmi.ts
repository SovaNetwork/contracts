'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

// Get WalletConnect Project ID with fallback
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

export const wagmiConfig = getDefaultConfig({
  appName: 'SovaBTC - Modern DeFi Protocol',
  projectId,
  chains: [baseSepolia],
  ssr: false, // Disable SSR to avoid indexedDB issues
})
