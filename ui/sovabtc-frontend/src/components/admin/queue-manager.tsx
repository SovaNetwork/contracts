'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Settings, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { CONTRACT_ADDRESSES, isSupportedChain } from '@/config/contracts'

const QUEUE_ABI = [
  {
    name: 'setRedemptionDelay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'delay', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'redemptionDelay',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export function QueueManager() {
  const { toast } = useToast()
  const chainId = useChainId()
  const [newDelay, setNewDelay] = useState('')
  const [isDelayDialogOpen, setIsDelayDialogOpen] = useState(false)

  // Placeholder for redemption queue address
  const queueAddress = '0x0000000000000000000000000000000000000000' // Replace with actual address

  // Read current delay
  const { data: currentDelay, refetch: refetchDelay } = useReadContract({
    address: queueAddress as `0x${string}`,
    abi: QUEUE_ABI,
    functionName: 'redemptionDelay',
  })

  // Read pause status
  const { data: isPaused } = useReadContract({
    address: queueAddress as `0x${string}`,
    abi: QUEUE_ABI,
    functionName: 'paused',
  })

  // Write contract hooks
  const { writeContract: setDelay, data: setDelayHash } = useWriteContract()

  // Transaction status
  const { isLoading: isSettingDelay } = useWaitForTransactionReceipt({
    hash: setDelayHash,
  })

  const handleSetDelay = async () => {
    const delayInSeconds = parseInt(newDelay)
    if (isNaN(delayInSeconds) || delayInSeconds < 0) {
      toast({
        title: 'Invalid Delay',
        description: 'Please enter a valid delay in seconds.',
        variant: 'destructive',
      })
      return
    }

    try {
      setDelay({
        address: queueAddress as `0x${string}`,
        abi: QUEUE_ABI,
        functionName: 'setRedemptionDelay',
        args: [BigInt(delayInSeconds)],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Setting redemption delay...',
      })

      setIsDelayDialogOpen(false)
      setNewDelay('')
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to set delay',
        variant: 'destructive',
      })
    }
  }

  const formatDuration = (seconds: bigint | undefined) => {
    if (!seconds) return 'Not set'
    const num = Number(seconds)
    if (num < 60) return `${num} seconds`
    if (num < 3600) return `${Math.floor(num / 60)} minutes`
    if (num < 86400) return `${Math.floor(num / 3600)} hours`
    return `${Math.floor(num / 86400)} days`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Redemption Queue Management
          </CardTitle>
          <CardDescription>
            Configure redemption queue settings and monitor queue status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold">Redemption Delay</h3>
              </div>
              <div className="text-2xl font-bold">{formatDuration(currentDelay)}</div>
              <p className="text-sm text-muted-foreground">
                Time users must wait before fulfilling redemptions
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold">Queue Status</h3>
              </div>
              <Badge 
                variant={isPaused ? "destructive" : "secondary"}
                className={isPaused ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
              >
                {isPaused ? 'Paused' : 'Active'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Current operational status
              </p>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Queue Configuration</h3>
              <Dialog open={isDelayDialogOpen} onOpenChange={setIsDelayDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Delay
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Redemption Delay</DialogTitle>
                    <DialogDescription>
                      Configure how long users must wait before they can fulfill their redemption requests.
                      This helps ensure system stability and prevents rapid draining of reserves.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delaySeconds">Delay (in seconds)</Label>
                      <Input
                        id="delaySeconds"
                        type="number"
                        placeholder="3600"
                        value={newDelay}
                        onChange={(e) => setNewDelay(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Common values: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDelayDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetDelay} disabled={isSettingDelay}>
                      {isSettingDelay ? 'Setting...' : 'Set Delay'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Redemption Delay Purpose</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    The redemption delay provides a safety mechanism to prevent rapid draining of protocol reserves.
                    It allows time for custodians to prepare the underlying assets and ensures system stability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Queue Statistics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-orange-600">7</div>
                <p className="text-sm text-muted-foreground">Pending Redemptions</p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">12</div>
                <p className="text-sm text-muted-foreground">Ready to Fulfill</p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <p className="text-sm text-muted-foreground">Total Fulfilled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 