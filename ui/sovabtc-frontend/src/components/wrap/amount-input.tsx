'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CompactBalance } from '@/components/ui/balance-display'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { formatTokenAmount, parseTokenAmount, validateTokenPrecision } from '@/lib/decimal-conversion'
import { useTokenBalance } from '@/hooks/use-token-balances'
import { TokenInfo } from '@/types/contracts'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  token?: TokenInfo
  placeholder?: string
  disabled?: boolean
  className?: string
  showMaxButton?: boolean
  showBalance?: boolean
  error?: string
  label?: string
}

export function AmountInput({
  value,
  onChange,
  token,
  placeholder = '0.0',
  disabled = false,
  className,
  showMaxButton = true,
  showBalance = true,
  error,
  label,
}: AmountInputProps) {
  const [focused, setFocused] = useState(false)
  const { balance, formatted, isLoading } = useTokenBalance(token?.address)

  // Validate input as user types
  const [inputError, setInputError] = useState<string | null>(null)

  const validateInput = useCallback((inputValue: string) => {
    if (!inputValue || !token) {
      setInputError(null)
      return
    }

    // Check format
    if (!/^\d*\.?\d*$/.test(inputValue)) {
      setInputError('Invalid number format')
      return
    }

    // Check precision
    if (!validateTokenPrecision(inputValue, token.decimals)) {
      setInputError(`Maximum ${token.decimals} decimal places`)
      return
    }

    // Check if exceeds balance
    if (balance) {
      try {
        const inputAmount = parseTokenAmount(inputValue, token.decimals)
        if (inputAmount > balance) {
          setInputError('Insufficient balance')
          return
        }
      } catch {
        setInputError('Invalid amount')
        return
      }
    }

    setInputError(null)
  }, [token, balance])

  useEffect(() => {
    validateInput(value)
  }, [value, validateInput])

  const handleMaxClick = () => {
    if (!balance || !token) return
    
    const maxAmount = formatTokenAmount(balance, token.decimals, token.decimals)
    onChange(maxAmount)
  }

  const handlePresetClick = (percentage: number) => {
    if (!balance || !token) return
    
    const presetAmount = (balance * BigInt(percentage)) / BigInt(100)
    const formatted = formatTokenAmount(presetAmount, token.decimals, token.decimals)
    onChange(formatted)
  }

  const displayError = error || inputError

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        <div className={cn(
          'relative rounded-lg border transition-colors',
          focused && 'ring-2 ring-ring ring-offset-2',
          displayError && 'border-destructive',
          'bg-background'
        )}>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className={cn(
              'border-0 text-lg h-12 pr-20',
              'focus-visible:ring-0 focus-visible:ring-offset-0'
            )}
          />
          
          {/* Token symbol */}
          {token && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {token.symbol}
            </div>
          )}
        </div>

        {/* Balance and controls */}
        {token && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showBalance && (
                <div className="text-sm text-muted-foreground">
                  Balance: <CompactBalance 
                    balance={formatted} 
                    symbol={token.symbol}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Preset buttons */}
              {balance && balance > BigInt(0) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(25)}
                    disabled={disabled}
                    className="h-6 px-2 text-xs"
                  >
                    25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(50)}
                    disabled={disabled}
                    className="h-6 px-2 text-xs"
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(75)}
                    disabled={disabled}
                    className="h-6 px-2 text-xs"
                  >
                    75%
                  </Button>
                  {showMaxButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMaxClick}
                      disabled={disabled}
                      className="h-6 px-2 text-xs"
                    >
                      MAX
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {displayError && (
          <div className="text-sm text-destructive">
            {displayError}
          </div>
        )}
      </div>
    </div>
  )
}

// Simplified numeric input for smaller values
export function NumericInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '0',
  disabled = false,
  className,
  label,
  suffix,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  suffix?: string
}) {
  const handleIncrement = () => {
    const newValue = Math.min((max ?? Infinity), value + step)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-8 w-8 p-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            disabled={disabled}
            className="text-center"
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="h-8 w-8 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// Amount input with USD conversion
export function AmountInputWithUSD({
  value,
  onChange,
  token,
  usdPrice,
  ...props
}: AmountInputProps & {
  usdPrice?: number
}) {
  const usdValue = value && usdPrice && !isNaN(parseFloat(value)) 
    ? parseFloat(value) * usdPrice 
    : undefined

  return (
    <div className="space-y-1">
      <AmountInput
        value={value}
        onChange={onChange}
        token={token}
        {...props}
      />
      
      {usdValue !== undefined && (
        <div className="text-sm text-muted-foreground text-right">
          ≈ ${usdValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}
    </div>
  )
} 