'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatUnits, parseUnits, Address } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bitcoin, ArrowRight, CheckCircle, Clock, AlertTriangle, TrendingUp, Zap, Wallet, Shield, DollarSign, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { useWrapper, useSovaBTC, useERC20, useContractAddresses } from '@/hooks/use-contracts'
import { toast } from 'sonner'

// Mock supported tokens for now - will be replaced by contract data
const SUPPORTED_TOKENS = [
  { 
    address: '0x29f2D40B0605204364af54EC677bD022dA425d03' as Address, // Mock WBTC Base Sepolia
    symbol: 'WBTC', 
    name: 'Wrapped Bitcoin', 
    decimals: 8,
    icon: '₿' 
  },
  { 
    address: '0x0000000000000000000000000000000000000001' as Address, // Mock tBTC
    symbol: 'tBTC', 
    name: 'Threshold Bitcoin', 
    decimals: 18,
    icon: '₿' 
  },
]

const RECENT_TRANSACTIONS = [
  { id: '1', type: 'Wrap', amount: '0.1 WBTC', status: 'completed', time: '2 min ago' },
  { id: '2', type: 'Wrap', amount: '0.05 tBTC', status: 'pending', time: '5 min ago' },
  { id: '3', type: 'Wrap', amount: '0.25 WBTC', status: 'completed', time: '1 hour ago' },
]

export default function WrapPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const addresses = useContractAddresses()
  
  // Contract hooks
  const { balance: sovaBTCBalance, balanceLoading: sovaBTCLoading } = useSovaBTC()
  const { whitelistedTokens, tokensLoading, isDepositing, depositTokens } = useWrapper()
  
  // Component state
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  
  // Token-specific hooks
  const { 
    balance: tokenBalance, 
    decimals: tokenDecimals,
    balanceLoading: tokenBalanceLoading,
    approveSpender,
    isApproving: tokenApproving,
    useAllowance
  } = useERC20(selectedToken.address)
  
  // Check allowance for wrapper contract
  const { data: allowance, refetch: refetchAllowance } = useAllowance(addresses.wrapper)
  
  // Format balances for display
  const formattedTokenBalance = tokenBalance && tokenDecimals 
    ? formatUnits(tokenBalance, tokenDecimals)
    : '0.0000'
  
  const formattedSovaBTCBalance = sovaBTCBalance 
    ? formatUnits(sovaBTCBalance, 8) // SovaBTC has 8 decimals
    : '0.00000000'

  // Check if amount needs approval
  const needsApproval = () => {
    if (!amount || !allowance || !tokenDecimals) return false
    const amountWei = parseUnits(amount, tokenDecimals)
    return amountWei > allowance
  }

  // Validate amount
  const isAmountValid = () => {
    if (!amount || !tokenBalance || !tokenDecimals) return false
    const amountWei = parseUnits(amount, tokenDecimals)
    return amountWei > 0n && amountWei <= tokenBalance
  }

  // Handle token approval
  const handleApprove = async () => {
    if (!amount || !tokenDecimals) return
    
    try {
      setIsApproving(true)
      const amountWei = parseUnits(amount, tokenDecimals)
      await approveSpender(addresses.wrapper, amountWei)
      toast.success('Approval transaction submitted')
      await refetchAllowance()
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Approval failed')
    } finally {
      setIsApproving(false)
    }
  }

  // Handle token deposit
  const handleWrap = async () => {
    if (!amount || !tokenDecimals || !isAmountValid()) return
    
    try {
      const amountWei = parseUnits(amount, tokenDecimals)
      await depositTokens(selectedToken.address, amountWei)
      toast.success('Wrap transaction submitted')
      setAmount('')
    } catch (error) {
      console.error('Wrap failed:', error)
      toast.error('Wrap transaction failed')
    }
  }

  // Get conversion amount to SovaBTC (8 decimals)
  const getConversionAmount = () => {
    if (!amount || !tokenDecimals) return '0.00000000'
    
    // Convert to 8 decimal SovaBTC
    if (tokenDecimals === 8) {
      return amount
    } else if (tokenDecimals === 18) {
      // For 18 decimal tokens, divide by 10^10 to get 8 decimals
      return (parseFloat(amount) / Math.pow(10, 10)).toFixed(8)
    } else if (tokenDecimals === 6) {
      // For 6 decimal tokens, multiply by 100 to get 8 decimals  
      return (parseFloat(amount) * 100).toFixed(8)
    }
    return amount
  }

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
                      <div className="text-3xl font-bold text-sova-black-500">
                        {sovaBTCLoading ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          formattedSovaBTCBalance
                        )}
                      </div>
                      <div className="text-sova-black-600 font-medium">Your SovaBTC Balance</div>
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
                        <span className="text-sova-black-500">
                          Balance: {tokenBalanceLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                          ) : (
                            `${formattedTokenBalance} ${selectedToken.symbol}`
                          )}
                        </span>
                        <span className="text-sova-mint-600">Rate: 1:1</span>
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
                          onClick={() => setAmount(formattedTokenBalance)}
                          disabled={tokenBalanceLoading}
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
                            <span className="text-lg font-bold bg-gradient-to-r from-sova-mint-600 to-sova-mint-800 bg-clip-text text-transparent">
                              {getConversionAmount()} SovaBTC
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 text-center text-sm text-sova-black-600 font-medium">
                          Exchange rate: 1 {selectedToken.symbol} = 1 SovaBTC (adjusted for decimals)
                        </div>
                      </div>
                    )}

                    <Separator className="bg-sova-mint-200" />

                    {/* Approval and Wrap Buttons */}
                    <div className="space-y-4">
                      {needsApproval() && (
                        <Button
                          onClick={handleApprove}
                          disabled={!isAmountValid() || isApproving || tokenApproving}
                          className="w-full h-16 text-lg font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-2xl transition-all duration-300"
                        >
                          {isApproving || tokenApproving ? (
                            <>
                              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-6 h-6 mr-3" />
                              Approve {selectedToken.symbol}
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleWrap}
                        disabled={!isAmountValid() || needsApproval() || isDepositing}
                        className="w-full h-16 text-lg font-bold bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 hover:from-sova-mint-600 hover:to-sova-mint-700 text-white shadow-2xl hover:shadow-sova transition-all duration-300"
                      >
                        {isDepositing ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            Wrapping...
                          </>
                        ) : (
                          <>
                            <Zap className="w-6 h-6 mr-3" />
                            Wrap {selectedToken.symbol}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Validation Messages */}
                    {amount && !isAmountValid() && (
                      <Alert className="border-red-300 bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Insufficient balance or invalid amount
                        </AlertDescription>
                      </Alert>
                    )}
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
                      1:1
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