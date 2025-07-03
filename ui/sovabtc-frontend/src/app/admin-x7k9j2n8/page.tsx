'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProtocolStats } from '@/components/admin/protocol-stats'
import { WhitelistManager } from '@/components/admin/whitelist-manager'
import { PauseControls } from '@/components/admin/pause-controls'
import { QueueManager } from '@/components/admin/queue-manager'
import { CustodyManager } from '@/components/admin/custody-manager'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAdmin } from '@/hooks/use-admin'

export default function AdminPage() {
  const { address } = useAccount()
  const router = useRouter()
  const { isAdmin } = useAdmin()

  // Redirect if not owner
  useEffect(() => {
    if (!isAdmin && address) {
      router.push('/')
    }
  }, [isAdmin, address, router])

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    )
  }



  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You do not have admin permissions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Protocol administration and emergency controls
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          Admin Access
        </Badge>
      </div>

      {/* Protocol Overview */}
      <ProtocolStats />

      {/* Emergency Controls */}
      <PauseControls />

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WhitelistManager />
        <QueueManager />
      </div>

      {/* Advanced Controls */}
      <CustodyManager />
    </div>
  )
} 