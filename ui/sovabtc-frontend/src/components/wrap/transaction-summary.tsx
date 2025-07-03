'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TokenIcon } from '@/components/ui/token-icon'
import { ArrowRight, Info, Clock, Zap } from 'lucide-react'
import { TokenInfo } from '@/types/contracts'
import { cn } from '@/lib/utils'

interface TransactionSummaryProps {
  inputToken: TokenInfo
  inputAmount: string
  outputAmount: string
  fee?: string
  estimatedTime?: string
  className?: string
}

export function TransactionSummary({
  inputToken,
  inputAmount,
  outputAmount,
  fee = '~$0.50',
  estimatedTime = '~30 seconds',
  className
}: TransactionSummaryProps) {
  return (
    <Card className={cn('border-sova-mint-200 bg-gradient-to-br from-white to-sova-mint-50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-sova-mint-600" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Token Exchange */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon 
              symbol={inputToken.symbol} 
              src={inputToken.icon}
              size="sm" 
            />
            <div>
              <div className="font-medium text-sm">{inputAmount}</div>
              <div className="text-xs text-muted-foreground">{inputToken.name}</div>
            </div>
          </div>
          
          <ArrowRight className="w-4 h-4 text-sova-mint-600" />
          
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <div>
              <div className="font-medium text-sm">{outputAmount}</div>
              <div className="text-xs text-muted-foreground">SovaBTC</div>
            </div>
          </div>
        </div>

        <Separator className="bg-sova-mint-200" />

        {/* Transaction Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-medium">1:1</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium">{fee}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Time
            </span>
            <span className="font-medium">{estimatedTime}</span>
          </div>
        </div>

        <Separator className="bg-sova-mint-200" />

        {/* Important Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-sova-mint-400 text-sova-mint-700">
              <Zap className="w-3 h-3 mr-1" />
              Instant
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tokens will be wrapped immediately
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            • Your {inputToken.symbol} will be held in the wrapper contract
          </div>
          <div className="text-xs text-muted-foreground">
            • SovaBTC can be bridged to other chains or redeemed later
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for mobile
export function CompactTransactionSummary({
  inputToken,
  inputAmount,
  outputAmount,
  className
}: Omit<TransactionSummaryProps, 'fee' | 'estimatedTime'>) {
  return (
    <div className={cn(
      'p-3 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 rounded-lg border border-sova-mint-300',
      className
    )}>
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <TokenIcon symbol={inputToken.symbol} size="sm" />
          <span className="font-medium text-sm">{inputAmount}</span>
        </div>
        
        <ArrowRight className="w-4 h-4 text-sova-mint-600" />
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-sova-black-500 rounded-full flex items-center justify-center text-sova-mint-500 text-xs font-bold">
            S
          </div>
          <span className="font-medium text-sm">{outputAmount}</span>
        </div>
      </div>
      
      <div className="text-xs text-center text-sova-black-600 mt-2">
        1:1 Exchange Rate
      </div>
    </div>
  )
}