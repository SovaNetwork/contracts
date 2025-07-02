import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { supportedChains } from './chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

export const config = getDefaultConfig({
  appName: 'SovaBTC Protocol',
  projectId,
  chains: supportedChains,
  ssr: true,
})

// Re-export for convenience
export { supportedChains } 