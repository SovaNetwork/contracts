'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { SUPPORTED_TOKENS } from '@/contracts/addresses';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedToken: typeof SUPPORTED_TOKENS[number] | null;
  balance: bigint | undefined;
  minimumAmount?: bigint;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AmountInput({
  value,
  onChange,
  selectedToken,
  balance,
  minimumAmount,
  className,
  placeholder = "0.0",
  disabled = false,
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Validation logic
  const validation = useMemo(() => {
    if (!value || Number(value) <= 0) {
      return { isValid: false, error: null };
    }
    
    if (!selectedToken) {
      return { isValid: false, error: 'Please select a token' };
    }

    try {
      const amountWei = parseTokenAmount(value, selectedToken.decimals);
      
      if (balance && amountWei > balance) {
        return { isValid: false, error: 'Insufficient balance' };
      }
      
      if (minimumAmount && amountWei < minimumAmount) {
        return { 
          isValid: false, 
          error: `Minimum amount is ${formatTokenAmount(minimumAmount, selectedToken.decimals, 8)}` 
        };
      }
      
      return { isValid: true, error: null };
    } catch {
      return { isValid: false, error: 'Invalid amount format' };
    }
  }, [value, selectedToken, balance, minimumAmount]);

  // Handle max button click
  const handleMaxClick = () => {
    if (balance && selectedToken) {
      const maxAmount = formatTokenAmount(balance, selectedToken.decimals, selectedToken.decimals);
      onChange(maxAmount);
    }
  };

  // Format input value on blur
  const handleBlur = () => {
    setIsFocused(false);
    if (value && selectedToken && Number(value) > 0) {
      try {
        const amountWei = parseTokenAmount(value, selectedToken.decimals);
        const formatted = formatTokenAmount(amountWei, selectedToken.decimals, 8);
        onChange(formatted);
      } catch {
        // Keep original value if parsing fails
      }
    }
  };

  // Handle input change with decimal validation
  const handleInputChange = (inputValue: string) => {
    // Allow empty string
    if (inputValue === '') {
      onChange('');
      return;
    }

    // Allow only numbers and single decimal point
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(inputValue)) {
      return;
    }

    // Prevent multiple decimal points
    const decimalCount = (inputValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return;
    }

    // Limit decimal places based on token
    if (selectedToken && inputValue.includes('.')) {
      const [, decimal] = inputValue.split('.');
      const maxDecimals = selectedToken.decimals;
      if (decimal.length > maxDecimals) {
        return;
      }
    }

    onChange(inputValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Input Container */}
      <div 
        className={cn(
          "relative flex items-center bg-card/50 border rounded-lg transition-all duration-200",
          isFocused ? "border-defi-purple/50 bg-card/70" : "border-border/50",
          validation.error && value ? "border-red-500/50" : "",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Amount Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent px-4 py-4 text-lg font-medium outline-none",
            "placeholder:text-foreground/40",
            disabled && "cursor-not-allowed"
          )}
        />

        {/* Token Symbol */}
        {selectedToken && (
          <div className="px-4 py-2 text-foreground/60 font-medium">
            {selectedToken.symbol}
          </div>
        )}

        {/* Max Button */}
        {balance && balance > 0n && !disabled && (
          <button
            onClick={handleMaxClick}
            className="mr-3 px-3 py-1 text-sm font-medium text-defi-purple hover:text-defi-pink transition-colors duration-200 rounded"
          >
            MAX
          </button>
        )}
      </div>

      {/* Balance Display */}
      {selectedToken && balance !== undefined && (
        <div className="flex justify-between items-center text-sm text-foreground/60 px-1">
          <span>
            Balance: {formatTokenAmount(balance, selectedToken.decimals, 4)} {selectedToken.symbol}
          </span>
          
          {minimumAmount && (
            <span>
              Min: {formatTokenAmount(minimumAmount, selectedToken.decimals, 8)}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {validation.error && value && (
        <div className="text-sm text-red-400 px-1">
          {validation.error}
        </div>
      )}
    </div>
  );
} 