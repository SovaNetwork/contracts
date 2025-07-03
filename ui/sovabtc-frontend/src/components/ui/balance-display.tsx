'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TokenIcon } from './token-icon'
import { cn } from '@/lib/utils'
import { Wallet, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'

interface BalanceDisplayProps {
  balance?: bigint
  symbol: string
  decimals?: number
  isLoading?: boolean
  className?: string
  showSymbol?: boolean
}

export function BalanceDisplay({
  balance,
  symbol,
  decimals = 18,
  isLoading = false,
  className,
  showSymbol = true
}: BalanceDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!balance) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        0.0000 {showSymbol && symbol}
      </span>
    )
  }

  const formatted = formatUnits(balance, decimals)
  const truncated = parseFloat(formatted).toFixed(4)

  return (
    <span className={className}>
      {truncated} {showSymbol && symbol}
    </span>
  )
}

// Compact balance display for inline use
export function CompactBalance({
  balance,
  symbol,
  isLoading = false,
  className
}: {
  balance?: string
  symbol: string
  isLoading?: boolean
  className?: string
}) {
  if (isLoading) {
    return <Loader2 className="w-3 h-3 animate-spin inline" />
  }

  if (!balance || balance === '0' || balance === '0.0' || balance === '0.0000') {
    return <span className={cn('text-muted-foreground', className)}>0 {symbol}</span>
  }

  // Format for compact display
  const num = parseFloat(balance)
  let formatted: string

  if (num >= 1000000) {
    formatted = (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    formatted = (num / 1000).toFixed(2) + 'K'
  } else if (num >= 1) {
    formatted = num.toFixed(4)
  } else {
    formatted = num.toFixed(6)
  }

  return (
    <span className={className}>
      {formatted} {symbol}
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