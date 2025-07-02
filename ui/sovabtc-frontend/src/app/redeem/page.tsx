'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Coins, Clock } from 'lucide-react'

export default function RedeemPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Redeem SovaBTC</h1>
        <p className="text-xl text-muted-foreground">
          Queue redemption requests to withdraw your underlying BTC tokens
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Queue Redemption
            </CardTitle>
            <CardDescription>
              Select a BTC token to redeem your SovaBTC for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Redemption interface coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your wallet and queue redemption requests
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Redemption Queue</CardTitle>
            <CardDescription>
              Track your pending and ready redemption requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending redemptions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 