'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { baseSepolia, sepolia } from 'wagmi/chains'
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react'

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const supportedChains = [baseSepolia, sepolia]
  const isUnsupportedChain = chain && !supportedChains.some(supportedChain => supportedChain.id === chain.id)

  if (!isConnected) {
    return (
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => {
            const connector = connectors[0] // Use the first available connector
            if (connector) {
              connect({ connector })
            }
          }}
          className="flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  if (isUnsupportedChain) {
    return (
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Switch to Base Sepolia
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Chain Switcher Button (Desktop) */}
      <Button
        onClick={() => {
          const nextChain = chain?.id === baseSepolia.id ? sepolia : baseSepolia
          switchChain({ chainId: nextChain.id })
        }}
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2"
      >
        {chain?.name || 'Switch Chain'}
      </Button>

      {/* Account Button */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="hidden sm:inline text-sm text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    </div>
  )
}

// Simplified version for mobile or when you need just the connection status
export function WalletStatus() {
  const { isConnected, chain } = useAccount()
  const supportedChains = [baseSepolia, sepolia]
  const supportedChain = chain && supportedChains.some(supportedChain => supportedChain.id === chain.id)

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        Not Connected
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        supportedChain ? 'bg-green-500' : 'bg-yellow-500'
      }`} />
      <span className="text-muted-foreground">
        {supportedChain 
          ? 'Connected'
          : 'Unsupported network'
        }
      </span>
    </div>
  )
}

// Component to show wallet connection requirement
export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected, chain } = useAccount()
  const supportedChains = [baseSepolia, sepolia]
  const supportedChain = chain && supportedChains.some(supportedChain => supportedChain.id === chain.id)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground mb-4">
          Please connect your wallet to use the SovaBTC protocol.
        </p>
        <ConnectWallet />
      </div>
    )
  }

  if (!supportedChain) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unsupported Network</h3>
        <p className="text-muted-foreground mb-4">
          Please switch to a supported network to use the SovaBTC protocol.
        </p>
        <ConnectWallet />
      </div>
    )
  }

  return <>{children}</>
} 