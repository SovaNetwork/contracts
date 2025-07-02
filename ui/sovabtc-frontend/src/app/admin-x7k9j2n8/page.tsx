'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Settings, Users, Pause, BarChart3, AlertTriangle } from 'lucide-react'
import { WhitelistManager } from '@/components/admin/whitelist-manager'
import { CustodyManager } from '@/components/admin/custody-manager'
import { PauseControls } from '@/components/admin/pause-controls'
import { QueueManager } from '@/components/admin/queue-manager'
import { ProtocolStats } from '@/components/admin/protocol-stats'
import { useIsOwner } from '@/hooks/use-admin'

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { isOwner, isLoading } = useIsOwner()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }
    
    if (!isLoading && !isOwner) {
      router.push('/')
      return
    }
  }, [isConnected, isOwner, isLoading, router])

  if (!isConnected || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Loading Admin Access...</h2>
            <p className="text-muted-foreground">Verifying permissions</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You do not have administrator privileges for this protocol.
            </p>
            <Button onClick={() => router.push('/')}>Return Home</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocol Administration</h1>
          <p className="text-muted-foreground">
            Manage SovaBTC protocol settings and monitor system health
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Shield className="h-4 w-4 mr-1" />
          Admin Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="custody" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Custody
          </TabsTrigger>
          <TabsTrigger value="pause" className="flex items-center gap-2">
            <Pause className="h-4 w-4" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protocol Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Whitelisted Tokens</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">BTC-pegged tokens</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Custodians</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Authorized custodians</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Redemptions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">In redemption queue</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setActiveTab('whitelist')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Token Whitelist
                </Button>
                <Button 
                  onClick={() => setActiveTab('custody')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Configure Custody Addresses
                </Button>
                <Button 
                  onClick={() => setActiveTab('pause')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Emergency Controls
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Token whitelisted</p>
                      <p className="text-muted-foreground">WBTC added to whitelist</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Custodian added</p>
                      <p className="text-muted-foreground">New custodian authorized</p>
                    </div>
                    <span className="text-xs text-muted-foreground">5h ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Queue delay updated</p>
                      <p className="text-muted-foreground">Redemption delay set to 1 hour</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whitelist">
          <WhitelistManager />
        </TabsContent>

        <TabsContent value="custody">
          <CustodyManager />
        </TabsContent>

        <TabsContent value="pause">
          <PauseControls />
        </TabsContent>

        <TabsContent value="queue">
          <QueueManager />
        </TabsContent>

        <TabsContent value="stats">
          <ProtocolStats />
        </TabsContent>
      </Tabs>
    </div>
  )
} 