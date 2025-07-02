'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useChainId, useSwitchChain } from 'wagmi'
import { supportedChains } from '@/config/chains'
import { chainConfig } from '@/config/chains'
import { ChevronDown, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworkSwitcher() {
  const currentChainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()

  const currentChain = supportedChains.find(chain => chain.id === currentChainId)
  const currentConfig = chainConfig[currentChainId as keyof typeof chainConfig]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {currentConfig ? (
            <>
              <img 
                src={currentConfig.icon} 
                alt={currentConfig.name}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  // Fallback to text if icon fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="hidden sm:inline">{currentConfig.name}</span>
              <span className="sm:hidden">{currentChain?.name.slice(0, 3)}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Unknown Network</span>
            </>
          )}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {supportedChains.map((chain) => {
          const config = chainConfig[chain.id as keyof typeof chainConfig]
          const isCurrentChain = chain.id === currentChainId
          const isLoading = isPending && chain.id !== currentChainId
          
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => {
                if (!isCurrentChain) {
                  switchChain({ chainId: chain.id })
                }
              }}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isCurrentChain && "bg-accent"
              )}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2 flex-1">
                <img 
                  src={config.icon} 
                  alt={config.name}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => {
                    // Fallback to text if icon fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chain.testnet ? 'Testnet' : 'Mainnet'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Special features badge */}
                {config.hasImmediateBTCWithdraw && (
                  <Badge variant="secondary" className="text-xs">
                    BTC
                  </Badge>
                )}
                
                {/* Status indicator */}
                {isCurrentChain ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
              </div>
            </DropdownMenuItem>
          )
        })}
        
        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-destructive">
              Failed to switch network: {error.message}
            </div>
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Select a network to switch to
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile or smaller spaces
export function NetworkSwitcherCompact() {
  const currentChainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const currentConfig = chainConfig[currentChainId as keyof typeof chainConfig]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          {currentConfig ? (
            <>
              <img 
                src={currentConfig.icon} 
                alt={currentConfig.name}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <ChevronDown className="w-3 h-3" />
            </>
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        {supportedChains.map((chain) => {
          const config = chainConfig[chain.id as keyof typeof chainConfig]
          const isCurrentChain = chain.id === currentChainId
          
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => {
                if (!isCurrentChain) {
                  switchChain({ chainId: chain.id })
                }
              }}
              className="flex items-center gap-2"
              disabled={isPending}
            >
              <img 
                src={config.icon} 
                alt={config.name}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-sm">{config.name}</span>
              {isCurrentChain && <Check className="w-3 h-3 text-green-500 ml-auto" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Network info display component
export function NetworkInfo() {
  const currentChainId = useChainId()
  const currentConfig = chainConfig[currentChainId as keyof typeof chainConfig]
  const currentChain = supportedChains.find(chain => chain.id === currentChainId)

  if (!currentConfig || !currentChain) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span>Unsupported Network</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <img 
        src={currentConfig.icon} 
        alt={currentConfig.name}
        className="w-4 h-4 rounded-full"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <span>{currentConfig.name}</span>
      {currentChain.testnet && (
        <Badge variant="outline" className="text-xs">Testnet</Badge>
      )}
      {currentConfig.hasImmediateBTCWithdraw && (
        <Badge variant="secondary" className="text-xs">BTC</Badge>
      )}
    </div>
  )
} 