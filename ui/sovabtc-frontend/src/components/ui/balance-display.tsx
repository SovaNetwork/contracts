'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TokenIcon } from './token-icon'
import { cn } from '@/lib/utils'
import { Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface BalanceDisplayProps {
  balance?: string
  symbol?: string
  tokenIcon?: string
  usdValue?: number
  isLoading?: boolean
  className?: string
  showUSD?: boolean
  showRefresh?: boolean
  onRefresh?: () => void
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: {
    container: 'p-2',
    text: 'text-sm',
    subtext: 'text-xs',
    icon: 'sm' as const,
  },
  md: {
    container: 'p-3',
    text: 'text-base',
    subtext: 'text-sm',
    icon: 'md' as const,
  },
  lg: {
    container: 'p-4',
    text: 'text-lg',
    subtext: 'text-base',
    icon: 'lg' as const,
  },
}

export function BalanceDisplay({
  balance,
  symbol,
  tokenIcon,
  usdValue,
  isLoading = false,
  className,
  showUSD = true,
  showRefresh = false,
  onRefresh,
  onClick,
  size = 'md',
}: BalanceDisplayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const config = sizeConfig[size]

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg border bg-card',
        config.container,
        className
      )}>
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          {showUSD && <Skeleton className="h-3 w-16" />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card transition-colors',
        config.container,
        onClick && 'cursor-pointer hover:bg-accent/50',
        className
      )}
      onClick={onClick}
    >
      {/* Token Icon */}
      <div className="flex-shrink-0">
        {symbol ? (
          <TokenIcon
            symbol={symbol}
            src={tokenIcon}
            size={config.icon}
          />
        ) : (
          <div className={cn(
            'rounded-full bg-muted flex items-center justify-center',
            config.icon === 'sm' && 'w-4 h-4',
            config.icon === 'md' && 'w-6 h-6',
            config.icon === 'lg' && 'w-8 h-8'
          )}>
            <Wallet className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Balance Info */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', config.text)}>
          {balance || '0'} {symbol && <span className="text-muted-foreground">{symbol}</span>}
        </div>
        {showUSD && usdValue !== undefined && (
          <div className={cn('text-muted-foreground', config.subtext)}>
            ${usdValue.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
            disabled={isRefreshing}
            className="p-1 h-auto"
          >
            <RefreshCw className={cn(
              'w-3 h-3',
              isRefreshing && 'animate-spin'
            )} />
          </Button>
        )}
      </div>
    </div>
  )
}

// Compact balance display for inline use
export function CompactBalance({
  balance,
  symbol,
  isLoading,
  className,
}: {
  balance?: string
  symbol?: string
  isLoading?: boolean
  className?: string
}) {
  if (isLoading) {
    return <Skeleton className={cn('h-5 w-20', className)} />
  }

  return (
    <span className={cn('font-medium', className)}>
      {balance || '0'} {symbol}
    </span>
  )
}

// Balance with privacy toggle
export function PrivateBalance({
  balance,
  symbol,
  isLoading,
  className,
}: {
  balance?: string
  symbol?: string
  isLoading?: boolean
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(true)

  if (isLoading) {
    return <Skeleton className={cn('h-6 w-32', className)} />
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="font-medium">
        {isVisible ? `${balance || '0'} ${symbol}` : '••••••••'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="p-1 h-auto"
      >
        {isVisible ? (
          <EyeOff className="w-3 h-3" />
        ) : (
          <Eye className="w-3 h-3" />
        )}
      </Button>
    </div>
  )
}

// Multi-balance display (portfolio view)
export function MultiBalanceDisplay({
  balances,
  isLoading,
  className,
}: {
  balances: Array<{
    symbol: string
    balance: string
    icon?: string
    usdValue?: number
  }>
  isLoading?: boolean
  className?: string
}) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="w-6 h-6 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {balances.map((balance) => (
        <BalanceDisplay
          key={balance.symbol}
          balance={balance.balance}
          symbol={balance.symbol}
          tokenIcon={balance.icon}
          usdValue={balance.usdValue}
          size="sm"
        />
      ))}
    </div>
  )
}

// Balance change indicator
export function BalanceChange({
  currentBalance,
  previousBalance,
  symbol,
  className,
}: {
  currentBalance: string
  previousBalance?: string
  symbol: string
  className?: string
}) {
  if (!previousBalance || previousBalance === currentBalance) {
    return null
  }

  const current = parseFloat(currentBalance)
  const previous = parseFloat(previousBalance)
  const change = current - previous
  const isPositive = change > 0

  return (
    <Badge
      variant={isPositive ? 'default' : 'destructive'}
      className={cn('text-xs', className)}
    >
      {isPositive ? '+' : ''}{change.toFixed(6)} {symbol}
    </Badge>
  )
}

// Balance summary card
export function BalanceSummary({
  title,
  balances,
  totalUSDValue,
  isLoading,
  className,
  onRefresh,
}: {
  title: string
  balances: Array<{
    symbol: string
    balance: string
    icon?: string
    usdValue?: number
  }>
  totalUSDValue?: number
  isLoading?: boolean
  className?: string
  onRefresh?: () => void
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>

      {totalUSDValue !== undefined && (
        <div className="text-2xl font-bold">
          ${totalUSDValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}

      <MultiBalanceDisplay
        balances={balances}
        isLoading={isLoading}
      />
    </div>
  )
} 