'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/formatters';
import type { UnifiedToken } from './UnifiedSwapInterface';

interface NetworkAwareAmountInputProps {
  token: UnifiedToken | null;
  amount: string;
  onAmountChange: (amount: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NetworkAwareAmountInput({
  token,
  amount,
  onAmountChange,
  placeholder = "0.00",
  disabled = false,
  className,
}: NetworkAwareAmountInputProps) {
  
  // Format placeholder based on token decimals
  const formattedPlaceholder = useMemo(() => {
    if (!token) return placeholder;
    
    // Create placeholder with correct decimal places
    const decimals = token.decimals;
    if (decimals === 6) return "0.000000";
    if (decimals === 8) return "0.00000000";
    if (decimals === 18) return "0.000000000000000000";
    return placeholder;
  }, [token, placeholder]);

  // Handle max button click
  const handleMaxClick = () => {
    if (!token || !token.balance) return;
    
    const maxAmount = formatTokenAmount(token.balance, token.decimals);
    onAmountChange(maxAmount);
  };

  // Validate input based on token decimals
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input
    if (value === '') {
      onAmountChange('');
      return;
    }

    // Basic number validation
    if (!/^\d*\.?\d*$/.test(value)) return;

    // Decimal places validation
    if (token && value.includes('.')) {
      const [, decimals] = value.split('.');
      if (decimals.length > token.decimals) return;
    }

    onAmountChange(value);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <input
        type="text"
        value={amount}
        onChange={handleInputChange}
        placeholder={formattedPlaceholder}
        disabled={disabled}
        className={cn(
          "bg-transparent text-right font-medium text-lg focus:outline-none w-32",
          disabled && "opacity-50 cursor-not-allowed",
          !token && "opacity-50"
        )}
      />
      
      {token && token.balance && (
        <button
          onClick={handleMaxClick}
          disabled={disabled}
          className={cn(
            "text-xs font-medium px-2 py-1 rounded transition-colors",
            "hover:bg-defi-purple hover:text-white",
            "bg-background/60 text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          MAX
        </button>
      )}
    </div>
  );
} 