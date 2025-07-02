'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bitcoin, ArrowRight, CheckCircle, Clock, AlertTriangle, TrendingUp, Zap, Wallet, Shield, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/layout/header'
import { cn } from '@/lib/utils'

// Mock data for supported tokens
const SUPPORTED_TOKENS = [
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.0245', rate: '1:1', icon: '₿' },
  { symbol: 'tBTC', name: 'Threshold Bitcoin', balance: '0.0000', rate: '1:1', icon: '₿' },
  { symbol: 'cbBTC', name: 'Coinbase Bitcoin', balance: '0.0120', rate: '1:1', icon: '₿' },
]

const RECENT_TRANSACTIONS = [
  { id: '1', type: 'Wrap', amount: '0.1 WBTC', status: 'completed', time: '2 min ago' },
  { id: '2', type: 'Wrap', amount: '0.05 tBTC', status: 'pending', time: '5 min ago' },
  { id: '3', type: 'Wrap', amount: '0.25 WBTC', status: 'completed', time: '1 hour ago' },
]

export default function WrapPage() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isWrapping, setIsWrapping] = useState(false)

  const handleWrap = async () => {
    if (!amount || !selectedToken) return
    
    setIsWrapping(true)
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsWrapping(false)
    setAmount('')
  }

  const isAmountValid = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(selectedToken.balance)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Wrap Bitcoin Tokens" 
        description="Convert your BTC-pegged tokens into unified SovaBTC"
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-sova-black-500 border-none font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Wrap Interface */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none bg-gradient-to-br from-sova-mint-500 to-sova-mint-600 text-sova-black-500 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">$12.5M</div>
                      <div className="text-sova-black-600 font-medium">Total Value Locked</div>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sova-mint-200 bg-gradient-to-br from-white to-sova-mint-50 shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-sova-black-500">2,847</div>
                      <div className="text-sova-black-600 font-medium">SovaBTC Minted</div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-xl flex items-center justify-center">
                      <Bitcoin className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Wrap Card */}
            <Card className="border-2 border-sova-mint-200 bg-gradient-to-br from-white to-sova-mint-50/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  Wrap Bitcoin Tokens
                </CardTitle>
                <CardDescription className="text-sova-mint-100">
                  Convert your BTC-pegged tokens into unified SovaBTC with instant liquidity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {!isConnected ? (
                  <Alert className="border-sova-mint-300 bg-sova-mint-50">
                    <Wallet className="h-5 w-5 text-sova-mint-600" />
                    <AlertDescription className="text-sova-black-600">
                      Connect your wallet to start wrapping Bitcoin tokens
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Token Selection */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-sova-black-500">Select Token to Wrap</Label>
                      <Select value={selectedToken.symbol} onValueChange={(value) => 
                        setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === value) || SUPPORTED_TOKENS[0])
                      }>
                        <SelectTrigger className="h-16 border-2 border-sova-mint-200 bg-white hover:border-sova-mint-400 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_TOKENS.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                                  {token.icon}
                                </div>
                                <div>
                                  <div className="font-semibold text-sova-black-500">{token.symbol}</div>
                                  <div className="text-sm text-sova-black-400">{token.name}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-sova-black-500">Balance: {selectedToken.balance} {selectedToken.symbol}</span>
                        <span className="text-sova-mint-600">Rate: {selectedToken.rate}</span>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-sova-black-500">Amount to Wrap</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-16 text-xl border-2 border-sova-mint-200 bg-white pr-24 focus:border-sova-mint-500 transition-colors"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-4 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white font-semibold"
                          onClick={() => setAmount(selectedToken.balance)}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    {/* Conversion Preview */}
                    {amount && (
                      <div className="p-6 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 rounded-xl border-2 border-sova-mint-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full flex items-center justify-center text-white font-bold">
                              ₿
                            </div>
                            <span className="text-lg font-bold text-sova-black-500">{amount} {selectedToken.symbol}</span>
                          </div>
                          <ArrowRight className="w-6 h-6 text-sova-mint-600" />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sova-black-500 rounded-full flex items-center justify-center text-sova-mint-500 font-bold">
                              S
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-sova-mint-600 to-sova-mint-800 bg-clip-text text-transparent">{amount} SovaBTC</span>
                          </div>
                        </div>
                        <div className="mt-3 text-center text-sm text-sova-black-600 font-medium">
                          Exchange rate: 1 {selectedToken.symbol} = 1 SovaBTC
                        </div>
                      </div>
                    )}

                    <Separator className="bg-sova-mint-200" />

                    {/* Wrap Button */}
                    <Button
                      onClick={handleWrap}
                      disabled={!isAmountValid || isWrapping}
                      className="w-full h-16 text-lg font-bold bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white shadow-2xl hover:shadow-sova transition-all duration-300"
                    >
                      {isWrapping ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                          Wrapping...
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 mr-3" />
                          Wrap {selectedToken.symbol}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500">Recent Activity</CardTitle>
                <CardDescription className="text-sova-black-600">Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {RECENT_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-sova-mint-50 to-white rounded-lg border border-sova-mint-200">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      tx.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                    )}>
                      {tx.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sova-black-500">{tx.type}</div>
                      <div className="text-sm text-sova-black-400 truncate">{tx.amount}</div>
                    </div>
                    <div className="text-xs text-sova-black-400 font-medium">{tx.time}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Supported Tokens */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500">Supported Tokens</CardTitle>
                <CardDescription className="text-sova-black-600">BTC-pegged tokens you can wrap</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {SUPPORTED_TOKENS.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-sova-mint-50 rounded-lg border border-sova-mint-200 hover:border-sova-mint-400 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                        {token.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-sova-black-500">{token.symbol}</div>
                        <div className="text-sm text-sova-black-400">{token.name}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-sova-mint-400 text-sova-mint-700 bg-sova-mint-50">
                      {token.rate}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Audited smart contracts
                  </div>
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Non-custodial protocol
                  </div>
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    LayerZero secured
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 