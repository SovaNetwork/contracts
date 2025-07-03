'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, Pause, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { CONTRACT_ADDRESSES, isSupportedChain } from '@/config/contracts'

const PAUSE_ABI = [
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'pause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unpause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const

type ActionType = 'pause' | 'unpause'

export function PauseControls() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<ActionType | null>(null)

  const addresses = isSupportedChain(chainId) 
    ? CONTRACT_ADDRESSES[chainId]
    : CONTRACT_ADDRESSES[84532] // Fallback to Base Sepolia

  const wrapperAddress = addresses.WRAPPER

  const { data: isPaused, isLoading: pauseStatusLoading, refetch: refetchPauseStatus } = useReadContract({
    address: wrapperAddress,
    abi: PAUSE_ABI,
    functionName: 'paused',
  })

  const { writeContract: pauseContract, isPending: isPauseLoading } = useWriteContract()
  const { writeContract: unpauseContract, isPending: isUnpauseLoading } = useWriteContract()

  const handlePause = () => {
    pauseContract({
      address: wrapperAddress,
      abi: PAUSE_ABI,
      functionName: 'pause',
    })
  }

  const handleUnpause = () => {
    unpauseContract({
      address: wrapperAddress,
      abi: PAUSE_ABI,
      functionName: 'unpause',
    })
  }

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Controls</CardTitle>
          <CardDescription>Pause/unpause protocol functions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Connect wallet to access emergency controls</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Controls</CardTitle>
        <CardDescription>Pause/unpause protocol functions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Protocol Status</p>
            <p className="text-sm text-muted-foreground">Current operational state</p>
          </div>
          <Badge variant={isPaused ? 'destructive' : 'default'}>
            {pauseStatusLoading ? 'Loading...' : isPaused ? 'Paused' : 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="destructive"
            onClick={handlePause}
            disabled={isPaused || isPauseLoading}
            className="w-full"
          >
            <Pause className="mr-2 h-4 w-4" />
            {isPauseLoading ? 'Pausing...' : 'Pause Protocol'}
          </Button>
          
          <Button
            variant="default"
            onClick={handleUnpause}
            disabled={!isPaused || isUnpauseLoading}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {isUnpauseLoading ? 'Resuming...' : 'Resume Protocol'}
          </Button>
        </div>

        {isPaused && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Protocol is currently paused. Users cannot perform deposits or withdrawals.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 