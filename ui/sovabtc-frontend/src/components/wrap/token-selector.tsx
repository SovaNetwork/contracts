'use client'

import { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TokenIcon } from '@/components/ui/token-icon'
import { cn } from '@/lib/utils'
import { Search, Check, ChevronDown } from 'lucide-react'
import { TokenInfo } from '@/types/contracts'
import { sortTokens, filterTokens } from '@/lib/token-utils'
import { useTokenBalance } from '@/hooks/use-token-balances'

interface TokenSelectorProps {
  tokens: TokenInfo[]
  selectedToken?: TokenInfo
  onTokenSelect: (token: TokenInfo) => void
  disabled?: boolean
  placeholder?: string
  showBalances?: boolean
  className?: string
}

export function TokenSelector({
  tokens,
  selectedToken,
  onTokenSelect,
  disabled = false,
  placeholder = 'Select token',
  showBalances = true,
  className,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sort and filter tokens
  const sortedTokens = useMemo(() => sortTokens(tokens), [tokens])
  const filteredTokens = useMemo(() => 
    filterTokens(sortedTokens, searchQuery), 
    [sortedTokens, searchQuery]
  )

  const handleSelect = (token: TokenInfo) => {
    onTokenSelect(token)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-auto min-h-12 px-3 py-2"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {selectedToken ? (
          <div className="flex items-center gap-3 flex-1">
            <TokenIcon
              symbol={selectedToken.symbol}
              src={selectedToken.icon}
              size="md"
            />
            <div className="flex flex-col items-start">
              <span className="font-medium">{selectedToken.symbol}</span>
              <span className="text-xs text-muted-foreground truncate">
                {selectedToken.name}
              </span>
            </div>
            {selectedToken.isWhitelisted && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Select Token</h3>
          <p className="text-sm text-muted-foreground">
            Choose a BTC-pegged token to wrap into SovaBTC
          </p>
        </div>
        
        <Command>
          <CommandInput
            placeholder="Search tokens..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-0"
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tokens found</p>
              </div>
            </CommandEmpty>
            
            {/* Whitelisted tokens */}
            {filteredTokens.some(t => t.isWhitelisted) && (
              <CommandGroup heading="Verified Tokens">
                {filteredTokens
                  .filter(token => token.isWhitelisted)
                  .map((token) => (
                    <TokenItem
                      key={token.address}
                      token={token}
                      isSelected={selectedToken?.address === token.address}
                      onSelect={() => handleSelect(token)}
                      showBalance={showBalances}
                    />
                  ))
                }
              </CommandGroup>
            )}

            {/* Other tokens */}
            {filteredTokens.some(t => !t.isWhitelisted) && (
              <CommandGroup heading="Other Tokens">
                {filteredTokens
                  .filter(token => !token.isWhitelisted)
                  .map((token) => (
                    <TokenItem
                      key={token.address}
                      token={token}
                      isSelected={selectedToken?.address === token.address}
                      onSelect={() => handleSelect(token)}
                      showBalance={showBalances}
                    />
                  ))
                }
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}

// Individual token item in the selector
function TokenItem({
  token,
  isSelected,
  onSelect,
  showBalance,
}: {
  token: TokenInfo
  isSelected: boolean
  onSelect: () => void
  showBalance: boolean
}) {
  const { formattedBalance, isLoading } = useTokenBalance(token.address)

  return (
    <CommandItem
      onSelect={onSelect}
      className="flex items-center gap-3 p-3 cursor-pointer"
    >
      <TokenIcon
        symbol={token.symbol}
        src={token.icon}
        size="md"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{token.symbol}</span>
          {token.isWhitelisted && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {token.name}
        </div>
        {showBalance && (
          <div className="text-xs text-muted-foreground">
            Balance: {isLoading ? '...' : formattedBalance}
          </div>
        )}
      </div>

      {/* Contract address for reference */}
      <div className="text-xs text-muted-foreground font-mono">
        {token.address.slice(0, 6)}...{token.address.slice(-4)}
      </div>

      {isSelected && (
        <Check className="h-4 w-4 text-primary" />
      )}
    </CommandItem>
  )
}

// Simplified token selector for compact spaces
export function CompactTokenSelector({
  tokens,
  selectedToken,
  onTokenSelect,
  disabled = false,
  className,
}: {
  tokens: TokenInfo[]
  selectedToken?: TokenInfo
  onTokenSelect: (token: TokenInfo) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Select
      value={selectedToken?.address || ''}
      onValueChange={(value) => {
        const token = tokens.find(t => t.address === value)
        if (token) onTokenSelect(token)
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue>
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <TokenIcon
                symbol={selectedToken.symbol}
                src={selectedToken.icon}
                size="sm"
              />
              <span>{selectedToken.symbol}</span>
            </div>
          ) : (
            'Select token'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sortTokens(tokens).map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              <TokenIcon
                symbol={token.symbol}
                src={token.icon}
                size="sm"
              />
              <span>{token.symbol}</span>
              {token.isWhitelisted && (
                <Badge variant="secondary" className="text-xs ml-1">
                  ✓
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Token list with balances for portfolio view
export function TokenList({
  tokens,
  onTokenSelect,
  className,
}: {
  tokens: TokenInfo[]
  onTokenSelect?: (token: TokenInfo) => void
  className?: string
}) {
  const sortedTokens = useMemo(() => sortTokens(tokens), [tokens])

  return (
    <div className={cn('space-y-2', className)}>
      {sortedTokens.map((token) => (
        <TokenListItem
          key={token.address}
          token={token}
          onClick={() => onTokenSelect?.(token)}
        />
      ))}
    </div>
  )
}

function TokenListItem({
  token,
  onClick,
}: {
  token: TokenInfo
  onClick?: () => void
}) {
  const { formattedBalance, isLoading } = useTokenBalance(token.address)

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card',
        onClick && 'cursor-pointer hover:bg-accent/50 transition-colors'
      )}
      onClick={onClick}
    >
      <TokenIcon
        symbol={token.symbol}
        src={token.icon}
        size="md"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{token.symbol}</span>
          {token.isWhitelisted && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {token.name}
        </div>
      </div>

      <div className="text-right">
        <div className="font-medium">
          {isLoading ? '...' : formattedBalance}
        </div>
        <div className="text-xs text-muted-foreground">
          {token.decimals} decimals
        </div>
      </div>
    </div>
  )
} 