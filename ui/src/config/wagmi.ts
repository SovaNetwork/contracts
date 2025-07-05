'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const chains = [baseSepolia]

export const wagmiConfig = getDefaultConfig({
  appName: 'SovaBTC dApp',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains,
  ssr: true,
})
