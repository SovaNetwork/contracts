'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftRight, ArrowRight, Zap } from 'lucide-react'

const supportedChains = [
  { id: 'base', name: 'Base Sepolia', color: 'bg-blue-500' },
  { id: 'ethereum', name: 'Ethereum Sepolia', color: 'bg-gray-500' },
  { id: 'sova', name: 'Sova Testnet', color: 'bg-green-500' },
]

export default function BridgePage() {
  const [fromChain, setFromChain] = useState('base')
  const [toChain, setToChain] = useState('ethereum')
  const [amount, setAmount] = useState('')

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Cross-Chain Bridge</h1>
        <p className="text-xl text-muted-foreground">
          Transfer SovaBTC seamlessly across different blockchains using LayerZero
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bridge Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Bridge SovaBTC
            </CardTitle>
            <CardDescription>
              Transfer your SovaBTC tokens between supported chains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From Chain */}
            <div>
              <label className="text-sm font-medium mb-2 block">From Chain</label>
              <div className="grid grid-cols-1 gap-2">
                {supportedChains.map((chain) => (
                  <button
                    key={`from-${chain.id}`}
                    onClick={() => setFromChain(chain.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      fromChain === chain.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${chain.color}`} />
                      <span className="font-medium">{chain.name}</span>
                      {fromChain === chain.id && (
                        <Badge variant="secondary" className="ml-auto">Current</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bridge Direction Indicator */}
            <div className="flex justify-center">
              <div className="p-2 border rounded-full">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* To Chain */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Chain</label>
              <div className="grid grid-cols-1 gap-2">
                {supportedChains.filter(chain => chain.id !== fromChain).map((chain) => (
                  <button
                    key={`to-${chain.id}`}
                    onClick={() => setToChain(chain.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      toChain === chain.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${chain.color}`} />
                      <span className="font-medium">{chain.name}</span>
                      {toChain === chain.id && (
                        <Badge variant="secondary" className="ml-auto">Destination</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="outline">SovaBTC</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available: 0.0000 SovaBTC
              </p>
            </div>

            {/* Bridge Button */}
            <Button className="w-full" size="lg" disabled>
              <Zap className="h-4 w-4 mr-2" />
              Connect Wallet to Bridge
            </Button>

            {/* Fee Info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Bridge Fee</div>
              <div className="text-sm text-muted-foreground">
                LayerZero fee: ~$0.50 • Estimated time: 2-5 minutes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bridge Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How Bridging Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <div className="font-medium">Burn on Source</div>
                  <div className="text-sm text-muted-foreground">SovaBTC is burned on the source chain</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <div className="font-medium">LayerZero Message</div>
                  <div className="text-sm text-muted-foreground">Cross-chain message is sent via LayerZero</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <div className="font-medium">Mint on Destination</div>
                  <div className="text-sm text-muted-foreground">New SovaBTC is minted on the destination chain</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bridge History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No bridge transactions yet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 