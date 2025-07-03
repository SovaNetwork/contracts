'use client'

import { BridgeForm } from '@/components/bridge/bridge-form'
import { PageHeader } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Bridge, Shield, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BridgePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Cross-Chain Bridge" 
        description="Transfer SovaBTC seamlessly across different blockchains using LayerZero"
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-sova-black-500 border-none font-medium">
            <Bridge className="w-3 h-3 mr-1" />
            LayerZero Powered
          </Badge>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Bridge Interface */}
          <div className="lg:col-span-2">
            <BridgeForm
              onSuccess={(txHash) => {
                console.log('Bridge successful:', txHash)
                // Could add additional success handling here
              }}
            />
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* How Bridging Works */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500">How Bridging Works</CardTitle>
                <CardDescription className="text-sova-black-600">LayerZero cross-chain messaging</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-sova-black-500">Burn on Source</div>
                    <div className="text-sm text-sova-black-400">SovaBTC is burned on the source chain</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-sova-black-500">LayerZero Message</div>
                    <div className="text-sm text-sova-black-400">Cross-chain message is sent via LayerZero</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-sova-black-500">Mint on Destination</div>
                    <div className="text-sm text-sova-black-400">New SovaBTC is minted on the destination chain</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supported Networks */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500">Supported Networks</CardTitle>
                <CardDescription className="text-sova-black-600">Available bridge destinations</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-sova-mint-50 rounded-lg border border-sova-mint-200">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">🔵</span>
                    <div>
                      <div className="font-semibold text-sova-black-500">Base Sepolia</div>
                      <div className="text-sm text-sova-black-400">Testnet</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-sova-mint-50 rounded-lg border border-sova-mint-200">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">⟠</span>
                    <div>
                      <div className="font-semibold text-sova-black-500">Ethereum Sepolia</div>
                      <div className="text-sm text-sova-black-400">Testnet</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 opacity-60">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">🟢</span>
                    <div>
                      <div className="font-semibold text-gray-500">Sova Testnet</div>
                      <div className="text-sm text-gray-400">Coming Soon</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50">
                    Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bridge Statistics */}
            <Card className="border-sova-mint-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sova-mint-100 to-sova-mint-200">
                <CardTitle className="text-lg text-sova-black-500">Bridge Statistics</CardTitle>
                <CardDescription className="text-sova-black-600">Protocol metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-r from-white to-sova-mint-50 rounded-lg">
                    <div className="text-xl font-bold text-sova-black-500">1,247</div>
                    <div className="text-xs text-sova-black-600">Total Bridges</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-white to-sova-mint-50 rounded-lg">
                    <div className="text-xl font-bold text-sova-black-500">847.3</div>
                    <div className="text-xs text-sova-black-600">SovaBTC Bridged</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sova-mint-600">~2.5 min</div>
                  <div className="text-sm text-sova-black-600">Average Bridge Time</div>
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
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
                    LayerZero omnichain protocol
                  </div>
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Audited smart contracts
                  </div>
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Non-custodial transfers
                  </div>
                  <div className="flex items-center gap-2 text-sova-black-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Decentralized validation
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="font-medium text-yellow-800 mb-2">Important Notes:</div>
                  <div className="text-yellow-700">• Bridge transactions are irreversible once confirmed</div>
                  <div className="text-yellow-700">• Always verify the recipient address</div>
                  <div className="text-yellow-700">• LayerZero fees are paid on the source chain</div>
                  <div className="text-yellow-700">• Large amounts may take longer to process</div>
                  <div className="text-yellow-700">• Keep some ETH for gas fees on both chains</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 