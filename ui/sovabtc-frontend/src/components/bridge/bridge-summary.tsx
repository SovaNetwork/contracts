'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, Clock, Zap, Info } from 'lucide-react'
import { formatUnits } from 'viem'
import { BridgeParams, LayerZeroFee, getEstimatedBridgeTime } from '@/lib/layerzero-utils'
import { cn } from '@/lib/utils'

interface BridgeSummaryProps {
  params: BridgeParams
  fee: LayerZeroFee
  amount: string
  className?: string
}

const CHAIN_INFO = {
  84532: { name: 'Base Sepolia', shortName: 'Base', icon: '🔵' },
  11155111: { name: 'Ethereum Sepolia', shortName: 'Ethereum', icon: '⟠' }
}

export function BridgeSummary({ params, fee, amount, className }: BridgeSummaryProps) {
  const sourceChain = CHAIN_INFO[params.srcChainId as keyof typeof CHAIN_INFO]
  const destChain = CHAIN_INFO[params.dstChainId as keyof typeof CHAIN_INFO]
  
  const estimatedTime = getEstimatedBridgeTime(params.srcChainId, params.dstChainId)
  const formattedFee = formatUnits(fee.nativeFee, 18)

  return (
    <Card className={cn('border-sova-mint-200 bg-gradient-to-br from-white to-sova-mint-50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-sova-mint-600" />
          Bridge Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bridge Route */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sourceChain?.icon}</span>
              <div>
                <div className="font-medium text-sm">{amount} SovaBTC</div>
                <div className="text-xs text-muted-foreground">{sourceChain?.name}</div>
              </div>
            </div>
          </div>
          
          <ArrowRight className="w-4 h-4 text-sova-mint-600" />
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{destChain?.icon}</span>
              <div>
                <div className="font-medium text-sm">{amount} SovaBTC</div>
                <div className="text-xs text-muted-foreground">{destChain?.name}</div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-sova-mint-200" />

        {/* Transaction Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bridge Amount</span>
            <span className="font-medium">{amount} SovaBTC</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">LayerZero Fee</span>
            <span className="font-medium">{parseFloat(formattedFee).toFixed(6)} ETH</span>
          </div>
          
          {fee.totalUSD && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee (USD)</span>
              <span className="font-medium">${fee.totalUSD}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Time
            </span>
            <span className="font-medium">
              {Math.floor(estimatedTime / 60)} minutes
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-medium font-mono text-xs">
              {params.recipient.slice(0, 6)}...{params.recipient.slice(-4)}
            </span>
          </div>
        </div>

        <Separator className="bg-sova-mint-200" />

        {/* Bridge Process Steps */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-sova-black-500">Bridge Process</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span className="text-xs text-muted-foreground">
                Burn SovaBTC on {sourceChain?.shortName}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <span className="text-xs text-muted-foreground">
                Send LayerZero message
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-xs text-muted-foreground">
                Mint SovaBTC on {destChain?.shortName}
              </span>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-sova-mint-400 text-sova-mint-700">
              <Zap className="w-3 h-3 mr-1" />
              Irreversible
            </Badge>
            <span className="text-xs text-muted-foreground">
              This transaction cannot be undone once confirmed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for mobile
export function CompactBridgeSummary({ params, fee, amount, className }: BridgeSummaryProps) {
  const sourceChain = CHAIN_INFO[params.srcChainId as keyof typeof CHAIN_INFO]
  const destChain = CHAIN_INFO[params.dstChainId as keyof typeof CHAIN_INFO]
  const formattedFee = formatUnits(fee.nativeFee, 18)

  return (
    <div className={cn(
      'p-3 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 rounded-lg border border-sova-mint-300',
      className
    )}>
      <div className="space-y-2">
        {/* Route */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">{sourceChain?.icon}</span>
            <span className="font-medium text-sm">{amount}</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-sova-mint-600" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm">{destChain?.icon}</span>
            <span className="font-medium text-sm">{amount}</span>
          </div>
        </div>
        
        {/* Fee */}
        <div className="text-xs text-center text-sova-black-600">
          Fee: {parseFloat(formattedFee).toFixed(6)} ETH
          {fee.totalUSD && ` (~$${fee.totalUSD})`}
        </div>
      </div>
    </div>
  )
}