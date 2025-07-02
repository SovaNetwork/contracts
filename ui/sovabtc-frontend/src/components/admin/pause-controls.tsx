'use client'

import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pause, Play, AlertTriangle, Shield } from 'lucide-react'
import { contractAddresses } from '@/config/contracts'

const PAUSABLE_ABI = [
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const

export function PauseControls() {
  const { toast } = useToast()
  const chainId = useChainId()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'pause' | 'unpause'>('pause')

  const wrapperAddress = contractAddresses[chainId as keyof typeof contractAddresses]?.wrapper

  // Read pause status
  const { data: isPaused, refetch: refetchPauseStatus } = useReadContract({
    address: wrapperAddress,
    abi: PAUSABLE_ABI,
    functionName: 'paused',
  })

  // Write contract hooks
  const { writeContract: pauseContract, data: pauseHash } = useWriteContract()
  const { writeContract: unpauseContract, data: unpauseHash } = useWriteContract()

  // Transaction status
  const { isLoading: isPausing } = useWaitForTransactionReceipt({
    hash: pauseHash,
  })
  const { isLoading: isUnpausing } = useWaitForTransactionReceipt({
    hash: unpauseHash,
  })

  const handlePause = async () => {
    try {
      pauseContract({
        address: wrapperAddress,
        abi: PAUSABLE_ABI,
        functionName: 'pause',
      })

      toast({
        title: 'Emergency Pause Initiated',
        description: 'Pausing protocol operations...',
      })
    } catch (error) {
      toast({
        title: 'Pause Failed',
        description: error instanceof Error ? error.message : 'Failed to pause protocol',
        variant: 'destructive',
      })
    }
  }

  const handleUnpause = async () => {
    try {
      unpauseContract({
        address: wrapperAddress,
        abi: PAUSABLE_ABI,
        functionName: 'unpause',
      })

      toast({
        title: 'Unpausing Protocol',
        description: 'Resuming protocol operations...',
      })
    } catch (error) {
      toast({
        title: 'Unpause Failed',
        description: error instanceof Error ? error.message : 'Failed to unpause protocol',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Controls
          </CardTitle>
          <CardDescription>
            Emergency pause/unpause controls for protocol security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h3 className="font-semibold mb-1">Protocol Status</h3>
              <p className="text-sm text-muted-foreground">
                Current operational state of the protocol
              </p>
            </div>
            <Badge 
              variant={isPaused ? "destructive" : "secondary"}
              className={isPaused ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
            >
              {isPaused ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Paused
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Active
                </>
              )}
            </Badge>
          </div>

          {/* Emergency Pause Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Emergency Pause</h3>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Emergency pause will immediately halt all protocol operations including deposits, 
                withdrawals, and cross-chain transfers. Use only in case of security issues.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {!isPaused ? (
                <Button
                  variant="destructive"
                  onClick={handlePause}
                  disabled={isPausing}
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  {isPausing ? 'Pausing...' : 'Emergency Pause'}
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleUnpause}
                  disabled={isUnpausing}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isUnpausing ? 'Resuming...' : 'Resume Operations'}
                </Button>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">What happens when paused?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All deposit operations are halted</li>
              <li>• Redemption requests cannot be queued</li>
              <li>• Cross-chain transfers are blocked</li>
              <li>• Existing redemption queue remains accessible</li>
              <li>• Emergency functions remain available</li>
            </ul>
          </div>

          {isPaused && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The protocol is currently paused. Normal operations are suspended. 
                Only emergency functions are available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 