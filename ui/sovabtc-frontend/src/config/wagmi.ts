import { createConfig, http } from 'wagmi'
import { baseSepolia, sepolia } from 'wagmi/chains'
import { metaMask, coinbaseWallet, injected } from 'wagmi/connectors'

// Only import WalletConnect on client side
const getWalletConnectConnector = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const { walletConnect } = require('wagmi/connectors')
    return walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'test-project-id',
    })
  } catch (error) {
    console.warn('WalletConnect initialization failed:', error)
    return null
  }
}

const connectors = [
  injected(),
  metaMask(),
  coinbaseWallet({ appName: 'SovaBTC Protocol' }),
]

// Add WalletConnect only if available
const walletConnectConnector = getWalletConnectConnector()
if (walletConnectConnector) {
  connectors.push(walletConnectConnector)
}

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [sepolia.id]: http('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
  },
  ssr: true,
})

// Supported chains for convenience
export const supportedChains = [baseSepolia, sepolia] as const 