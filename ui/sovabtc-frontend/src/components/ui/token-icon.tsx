'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Bitcoin } from 'lucide-react'

interface TokenIconProps {
  symbol: string
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallback?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-12 h-12',
}

export function TokenIcon({
  symbol,
  src,
  alt,
  size = 'md',
  className,
  fallback,
}: TokenIconProps) {
  const [hasError, setHasError] = useState(false)

  const displayName = alt || symbol
  const imageUrl = src || `/icons/${symbol.toLowerCase()}.svg`

  // Default fallback is first two letters of symbol
  const defaultFallback = (
    <div className={cn(
      'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium text-xs',
      sizeClasses[size],
      className
    )}>
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  )

  if (hasError) {
    return fallback || defaultFallback
  }

  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        className={cn(sizeClasses[size], 'rounded-full', className)}
        onError={(e) => {
          // Fallback to default icon on error
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  // Default fallback icons based on symbol
  const getDefaultIcon = () => {
    if (symbol.toLowerCase().includes('btc')) {
      return <Bitcoin className={cn(sizeClasses[size], 'text-orange-500')} />
    }
    
    // Generic token icon
    return (
      <div className={cn(
        sizeClasses[size],
        'rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 flex items-center justify-center text-white font-bold',
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg',
        className
      )}>
        {symbol.charAt(0)}
      </div>
    )
  }

  return getDefaultIcon()
}

// Specialized SovaBTC icon
export function SovaBTCIcon({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return (
    <div className={cn(
      'flex items-center justify-center rounded-full bg-gradient-sova text-sova-black-500 font-bold',
      sizeClasses[size],
      className
    )}>
      <span className="text-xs">₿</span>
    </div>
  )
}

// Token icon with loading state
export function TokenIconWithLoading({
  isLoading,
  ...props
}: TokenIconProps & { isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className={cn(
        'animate-pulse bg-muted rounded-full',
        sizeClasses[props.size || 'md'],
        props.className
      )} />
    )
  }

  return <TokenIcon {...props} />
}

// Stacked token icons for pairs
export function StackedTokenIcons({
  tokens,
  size = 'md',
  className,
}: {
  tokens: Array<{ symbol: string; src?: string }>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  if (tokens.length === 0) return null
  if (tokens.length === 1) {
    return <TokenIcon {...tokens[0]} size={size} className={className} />
  }

  return (
    <div className={cn('flex', className)}>
      {tokens.slice(0, 2).map((token, index) => (
        <TokenIcon
          key={token.symbol}
          {...token}
          size={size}
          className={cn(
            'border-2 border-background',
            index > 0 && '-ml-2'
          )}
        />
      ))}
      {tokens.length > 2 && (
        <div className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium text-xs border-2 border-background -ml-2',
          sizeClasses[size]
        )}>
          +{tokens.length - 2}
        </div>
      )}
    </div>
  )
} 