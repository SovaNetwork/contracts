'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccount, useChainId } from 'wagmi'
import { useContractStatus } from '@/hooks/use-contracts'
import { getNetworkName } from '@/lib/constants'
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react'

export function ConnectWallet() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { isConfigured, supportedChain } = useContractStatus()

  return (
    <div className="flex items-center gap-3">
      {/* Network Status Badge */}
    
      {/* RainbowKit Connect Button */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading'
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated')

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button 
                      onClick={openConnectModal} 
                      className="flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </Button>
                  )
                }

                if (chain.unsupported) {
                  return (
                    <Button 
                      onClick={openChainModal} 
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Wrong Network
                    </Button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    {/* Chain Switcher Button (Desktop) */}
                    <Button
                      onClick={openChainModal}
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex items-center gap-2"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    {/* Account Button */}
                    <Button
                      onClick={openAccountModal}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="hidden sm:inline">
                        {account.displayName}
                      </span>
                      <span className="sm:hidden">
                        {account.displayBalance ? ` (${account.displayBalance})` : ''}
                      </span>
                    </Button>
                  </div>
                )
              })()}
            </div>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
}

// Simplified version for mobile or when you need just the connection status
export function WalletStatus() {
  const { isConnected } = useAccount()
  const { isConfigured, supportedChain } = useContractStatus()

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
        supportedChain && isConfigured ? 'bg-green-500' : 'bg-yellow-500'
      }`} />
      <span className="text-muted-foreground">
        {supportedChain 
          ? (isConfigured ? 'Connected' : 'Network not configured')
          : 'Unsupported network'
        }
      </span>
    </div>
  )
}

// Component to show wallet connection requirement
export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const { supportedChain } = useContractStatus()

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