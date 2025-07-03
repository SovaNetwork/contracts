'use client'

import { useState } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, ArrowUpDown, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupportedBridgeRoutes, isBridgeSupported } from '@/lib/layerzero-utils'

interface ChainInfo {
  id: number
  name: string
  shortName: string
  color: string
  icon: string
  explorerUrl: string
  isTestnet: boolean
}

const SUPPORTED_CHAINS: ChainInfo[] = [
  {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'Base',
    color: 'bg-blue-500',
    icon: '🔵',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true
  },
  {
    id: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'Ethereum',
    color: 'bg-gray-600',
    icon: '⟠',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true
  }
]

interface ChainSelectorProps {
  sourceChainId: number
  destinationChainId: number
  onSourceChange: (chainId: number) => void
  onDestinationChange: (chainId: number) => void
  disabled?: boolean
  className?: string
}

export function ChainSelector({
  sourceChainId,
  destinationChainId,
  onSourceChange,
  onDestinationChange,
  disabled = false,
  className
}: ChainSelectorProps) {
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isSwapping, setIsSwapping] = useState(false)

  const sourceChain = SUPPORTED_CHAINS.find(c => c.id === sourceChainId)
  const destinationChain = SUPPORTED_CHAINS.find(c => c.id === destinationChainId)

  // Check if bridge route is supported
  const isSupported = isBridgeSupported(sourceChainId, destinationChainId)
  const isWrongNetwork = currentChainId !== sourceChainId

  // Handle chain swap
  const handleSwapChains = () => {
    if (disabled) return
    
    setIsSwapping(true)
    setTimeout(() => {
      onSourceChange(destinationChainId)
      onDestinationChange(sourceChainId)
      setIsSwapping(false)
    }, 150)
  }

  // Handle network switch
  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: sourceChainId })
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chain Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Source Chain */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">From</label>
          <ChainCard
            chain={sourceChain}
            isSelected={true}
            isCurrent={currentChainId === sourceChainId}
            onSelect={(chainId) => onSourceChange(chainId)}
            disabled={disabled}
            showSelector={true}
            availableChains={SUPPORTED_CHAINS}
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapChains}
            disabled={disabled || !isSupported}
            className={cn(
              'p-2 h-10 w-10 rounded-full transition-transform',
              isSwapping && 'rotate-180'
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Destination Chain */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To</label>
          <ChainCard
            chain={destinationChain}
            isSelected={true}
            isCurrent={false}
            onSelect={(chainId) => onDestinationChange(chainId)}
            disabled={disabled}
            showSelector={true}
            availableChains={SUPPORTED_CHAINS.filter(c => c.id !== sourceChainId)}
          />
        </div>
      </div>

      {/* Bridge Route Indicator */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sourceChain?.icon}</span>
          <span className="text-sm font-medium">{sourceChain?.shortName}</span>
        </div>
        
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{destinationChain?.icon}</span>
          <span className="text-sm font-medium">{destinationChain?.shortName}</span>
        </div>

        {isSupported ? (
          <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
            Supported
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-2 text-red-600 border-red-300">
            Not Supported
          </Badge>
        )}
      </div>

      {/* Network Warning */}
      {isWrongNetwork && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800">Wrong Network</div>
                <div className="text-sm text-yellow-700">
                  Please switch to {sourceChain?.name} to bridge from this chain
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchNetwork}
                className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
              >
                Switch Network
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Not Supported Warning */}
      {!isSupported && sourceChainId !== destinationChainId && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">Route Not Supported</div>
                <div className="text-sm text-red-700">
                  This bridge route is not currently available. Please select different chains.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Individual chain card component
function ChainCard({
  chain,
  isSelected,
  isCurrent,
  onSelect,
  disabled,
  showSelector = false,
  availableChains = SUPPORTED_CHAINS
}: {
  chain?: ChainInfo
  isSelected: boolean
  isCurrent: boolean
  onSelect: (chainId: number) => void
  disabled: boolean
  showSelector?: boolean
  availableChains?: ChainInfo[]
}) {
  if (!showSelector) {
    return (
      <Card className={cn(
        'border-2 transition-colors',
        isSelected && 'border-primary',
        isCurrent && 'bg-green-50 border-green-200'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{chain?.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{chain?.name}</div>
              <div className="flex items-center gap-2">
                {chain?.isTestnet && (
                  <Badge variant="secondary" className="text-xs">
                    Testnet
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    Current
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(chain?.explorerUrl, '_blank')}
              className="p-1 h-auto"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Select
      value={chain?.id.toString() || ''}
      onValueChange={(value) => onSelect(parseInt(value))}
      disabled={disabled}
    >
      <SelectTrigger className="h-auto p-0 border-2">
        <SelectValue>
          {chain && (
            <div className="flex items-center gap-3 p-4">
              <span className="text-2xl">{chain.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{chain.name}</div>
                <div className="flex items-center gap-2">
                  {chain.isTestnet && (
                    <Badge variant="secondary" className="text-xs">
                      Testnet
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableChains.map((chainOption) => (
          <SelectItem key={chainOption.id} value={chainOption.id.toString()}>
            <div className="flex items-center gap-3 py-2">
              <span className="text-xl">{chainOption.icon}</span>
              <div>
                <div className="font-medium">{chainOption.name}</div>
                <div className="text-xs text-muted-foreground">
                  {chainOption.isTestnet ? 'Testnet' : 'Mainnet'}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Compact chain selector for mobile
export function CompactChainSelector({
  sourceChainId,
  destinationChainId,
  onSourceChange,
  onDestinationChange,
  disabled = false
}: ChainSelectorProps) {
  const sourceChain = SUPPORTED_CHAINS.find(c => c.id === sourceChainId)
  const destinationChain = SUPPORTED_CHAINS.find(c => c.id === destinationChainId)

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
      <Select
        value={sourceChainId.toString()}
        onValueChange={(value) => onSourceChange(parseInt(value))}
        disabled={disabled}
      >
        <SelectTrigger className="w-auto border-0 p-1 h-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm">{sourceChain?.icon}</span>
            <span className="text-xs font-medium">{sourceChain?.shortName}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CHAINS.map((chain) => (
            <SelectItem key={chain.id} value={chain.id.toString()}>
              <div className="flex items-center gap-2">
                <span>{chain.icon}</span>
                <span>{chain.shortName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ArrowRight className="w-3 h-3 text-muted-foreground" />

      <Select
        value={destinationChainId.toString()}
        onValueChange={(value) => onDestinationChange(parseInt(value))}
        disabled={disabled}
      >
        <SelectTrigger className="w-auto border-0 p-1 h-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm">{destinationChain?.icon}</span>
            <span className="text-xs font-medium">{destinationChain?.shortName}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CHAINS.filter(c => c.id !== sourceChainId).map((chain) => (
            <SelectItem key={chain.id} value={chain.id.toString()}>
              <div className="flex items-center gap-2">
                <span>{chain.icon}</span>
                <span>{chain.shortName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}