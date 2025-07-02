'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Users, Coins, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'

export function ProtocolStats() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mock data - in real implementation would come from contracts/subgraph
  const protocolData = {
    tvl: 1250000, // Total Value Locked in USD
    totalSupply: 125.45, // Total SovaBTC supply
    activeUsers: 1247,
    totalTransactions: 8921,
    averageTransactionValue: 0.25,
    topTokens: [
      { symbol: 'WBTC', balance: 45.2, percentage: 36 },
      { symbol: 'BTCB', balance: 32.1, percentage: 26 },
      { symbol: 'renBTC', balance: 28.9, percentage: 23 },
      { symbol: 'sBTC', balance: 19.25, percentage: 15 },
    ],
    chainDistribution: [
      { chain: 'Base', balance: 67.8, percentage: 54 },
      { chain: 'Ethereum', balance: 35.4, percentage: 28 },
      { chain: 'Sova', balance: 22.25, percentage: 18 },
    ],
    recentActivity: [
      { type: 'deposit', amount: 2.5, timestamp: '2 minutes ago' },
      { type: 'redemption', amount: 1.2, timestamp: '5 minutes ago' },
      { type: 'bridge', amount: 0.8, timestamp: '12 minutes ago' },
      { type: 'stake', amount: 3.1, timestamp: '18 minutes ago' },
    ]
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatBTC = (amount: number) => {
    return `${amount.toFixed(4)} BTC`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Protocol Statistics</h2>
          <p className="text-muted-foreground">Real-time metrics and analytics</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(protocolData.tvl)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBTC(protocolData.totalSupply)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protocolData.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              +24 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protocolData.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              +156 today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tokens">Token Distribution</TabsTrigger>
          <TabsTrigger value="chains">Chain Distribution</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Composition</CardTitle>
              <CardDescription>
                Distribution of underlying BTC-pegged tokens backing SovaBTC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocolData.topTokens.map((token) => (
                <div key={token.symbol} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{token.symbol}</Badge>
                      <span className="text-sm font-medium">{formatBTC(token.balance)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{token.percentage}%</span>
                  </div>
                  <Progress value={token.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Chain Distribution</CardTitle>
              <CardDescription>
                SovaBTC supply distribution across different chains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocolData.chainDistribution.map((chain) => (
                <div key={chain.chain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{chain.chain}</Badge>
                      <span className="text-sm font-medium">{formatBTC(chain.balance)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{chain.percentage}%</span>
                  </div>
                  <Progress value={chain.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest protocol transactions and user activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protocolData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'deposit' ? 'bg-green-500' :
                        activity.type === 'redemption' ? 'bg-red-500' :
                        activity.type === 'bridge' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium capitalize">{activity.type}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatBTC(activity.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 