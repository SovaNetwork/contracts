'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatUnits } from 'viem'
import { ArrowRight, ExternalLink, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { 
  BridgeStatus, 
  getBridgeStatusText, 
  getBridgeStatusColor,
  formatBridgeAmount 
} from '@/lib/layerzero-utils'
import { cn } from '@/lib/utils'

interface BridgeTransaction {
  id: string
  srcChainId: number
  dstChainId: number
  amount: bigint
  recipient: string
  fee: { nativeFee: bigint; zroFee: bigint; totalUSD?: number }
  status: BridgeStatus['status']
  timestamp: number
  srcTxHash?: string
  dstTxHash?: string
  estimatedTime?: number
  retryCount?: number
}

interface BridgeHistoryProps {
  transactions: BridgeTransaction[]
  onRetry?: (txId: string) => void
  className?: string
}

const CHAIN_INFO = {
  84532: { name: 'Base Sepolia', shortName: 'Base', icon: '🔵', explorer: 'https://sepolia.basescan.org' },
  11155111: { name: 'Ethereum Sepolia', shortName: 'Ethereum', icon: '⟠', explorer: 'https://sepolia.etherscan.io' }
}

export function BridgeHistory({ transactions, onRetry, className }: BridgeHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'pending') return tx.status === 'pending' || tx.status === 'retrying'
    if (filter === 'completed') return tx.status === 'confirmed'
    if (filter === 'failed') return tx.status === 'failed'
    return true
  })

  if (transactions.length === 0) {
    return (
      <Card className={cn('border-sova-mint-200', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Bridge History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ArrowRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No bridge transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your bridge history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-sova-mint-200', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bridge History</CardTitle>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'completed', 'failed'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="h-7 px-2 text-xs"
              >
                {filterOption === 'all' ? 'All' : 
                 filterOption === 'pending' ? 'Pending' :
                 filterOption === 'completed' ? 'Completed' : 'Failed'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredTransactions.map((tx) => (
          <BridgeTransactionCard
            key={tx.id}
            transaction={tx}
            onRetry={onRetry}
          />
        ))}
        
        {filteredTransactions.length === 0 && filter !== 'all' && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No {filter} transactions</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BridgeTransactionCard({ 
  transaction, 
  onRetry 
}: { 
  transaction: BridgeTransaction
  onRetry?: (txId: string) => void 
}) {
  const sourceChain = CHAIN_INFO[transaction.srcChainId as keyof typeof CHAIN_INFO]
  const destChain = CHAIN_INFO[transaction.dstChainId as keyof typeof CHAIN_INFO]
  
  const amount = formatBridgeAmount(transaction.amount, 8)
  const fee = formatUnits(transaction.fee.nativeFee, 18)
  const statusText = getBridgeStatusText(transaction.status)
  const statusColor = getBridgeStatusColor(transaction.status)
  
  const timeAgo = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'retrying':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <div className="p-4 border border-sova-mint-200 rounded-lg bg-gradient-to-r from-white to-sova-mint-50 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge className={cn('text-xs', statusColor)}>
            {statusText}
          </Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Source chain explorer link */}
          {transaction.srcTxHash && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${sourceChain?.explorer}/tx/${transaction.srcTxHash}`, '_blank')}
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          
          {/* Retry button for failed transactions */}
          {transaction.status === 'failed' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(transaction.id)}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Bridge Route */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{sourceChain?.icon}</span>
            <span className="text-sm font-medium">{sourceChain?.shortName}</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm">{destChain?.icon}</span>
            <span className="text-sm font-medium">{destChain?.shortName}</span>
          </div>
        </div>

        {/* Amount and Fee */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{amount} SovaBTC</span>
          </div>
          <div className="text-muted-foreground">
            Fee: {parseFloat(fee).toFixed(6)} ETH
            {transaction.fee.totalUSD && ` (~$${transaction.fee.totalUSD})`}
          </div>
        </div>

        {/* Recipient */}
        <div className="text-xs text-muted-foreground">
          To: {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
        </div>

        {/* Progress indicator for pending transactions */}
        {(transaction.status === 'pending' || transaction.status === 'retrying') && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-muted-foreground">
                Processing... 
                {transaction.estimatedTime && ` (${Math.floor(transaction.estimatedTime / 60)} min remaining)`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-yellow-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Retry count for failed transactions */}
        {transaction.status === 'failed' && transaction.retryCount && transaction.retryCount > 0 && (
          <div className="text-xs text-red-600">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Failed after {transaction.retryCount} retry{transaction.retryCount > 1 ? 'ies' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact version for mobile
export function CompactBridgeHistory({ transactions, onRetry, className }: BridgeHistoryProps) {
  const recentTransactions = transactions.slice(0, 3) // Show only 3 most recent

  if (transactions.length === 0) {
    return (
      <Card className={cn('border-sova-mint-200', className)}>
        <CardContent className="p-4 text-center">
          <ArrowRight className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No bridge history</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-sova-mint-200', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Bridges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentTransactions.map((tx) => {
          const sourceChain = CHAIN_INFO[tx.srcChainId as keyof typeof CHAIN_INFO]
          const destChain = CHAIN_INFO[tx.dstChainId as keyof typeof CHAIN_INFO]
          const amount = formatBridgeAmount(tx.amount, 8)
          
          return (
            <div key={tx.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs">{sourceChain?.icon}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="text-xs">{destChain?.icon}</span>
                <span className="font-medium">{amount}</span>
              </div>
              <Badge className={cn('text-xs', getBridgeStatusColor(tx.status))}>
                {getBridgeStatusText(tx.status)}
              </Badge>
            </div>
          )
        })}
        
        {transactions.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="link" size="sm" className="text-xs">
              View All ({transactions.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}