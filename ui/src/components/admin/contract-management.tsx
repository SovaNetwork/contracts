'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Settings, 
  DollarSign, 
  Clock,
  Loader2,
  CheckCircle
} from 'lucide-react'

import { useAdminActions } from '@/hooks/web3/use-admin-actions'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { SOVABTC_STAKING_ABI, REDEMPTION_QUEUE_ABI } from '@/contracts/abis'
import { parseUnits, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'

export function ContractManagement() {
  const [newRewardRate, setNewRewardRate] = useState('')
  const [newRedemptionDelay, setNewRedemptionDelay] = useState('')
  
  const stakingAddress = CONTRACT_ADDRESSES[baseSepolia.id].STAKING
  const queueAddress = CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE
  
  const adminActions = useAdminActions()

  // Read current contract states
  const { data: currentRewardRate } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'rewardRate',
  })

  const { data: currentRedemptionDelay } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
  })

  const { data: isPaused } = useReadContract({
    address: stakingAddress,
    abi: SOVABTC_STAKING_ABI,
    functionName: 'paused',
  })

  const handleSetRewardRate = async () => {
    if (!newRewardRate) return
    const rate = parseUnits(newRewardRate, 18) // SOVA has 18 decimals
    await adminActions.setRewardRate(stakingAddress, rate)
    setNewRewardRate('')
  }

  const handleSetRedemptionDelay = async () => {
    if (!newRedemptionDelay) return
    const delay = BigInt(Number(newRedemptionDelay) * 86400) // Convert days to seconds
    await adminActions.updateRedemptionDelay(queueAddress, delay)
    setNewRedemptionDelay('')
  }

  const handlePauseToggle = async () => {
    if (isPaused) {
      await adminActions.unpauseContract(stakingAddress, SOVABTC_STAKING_ABI)
    } else {
      await adminActions.pauseContract(stakingAddress, SOVABTC_STAKING_ABI)
    }
  }

  const contracts = [
    {
      name: 'SovaBTC Token',
      address: CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC,
      status: 'active',
      type: 'Token',
    },
    {
      name: 'SOVA Token',
      address: CONTRACT_ADDRESSES[baseSepolia.id].SOVA_TOKEN,
      status: 'active',
      type: 'Token',
    },
    {
      name: 'Wrapper Contract',
      address: CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER,
      status: 'active',
      type: 'Core',
    },
    {
      name: 'Staking Contract',
      address: CONTRACT_ADDRESSES[baseSepolia.id].STAKING,
      status: isPaused ? 'paused' : 'active',
      type: 'Core',
    },
    {
      name: 'Redemption Queue',
      address: CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE,
      status: 'active',
      type: 'Core',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Contract Status Overview */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Contract Status
        </h3>
        <div className="grid gap-3">
          {contracts.map((contract) => (
            <Card key={contract.address} className="defi-card border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{contract.name}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {contract.type}
                    </Badge>
                    <Badge 
                      variant={contract.status === 'active' ? 'default' : 'destructive'}
                      className={contract.status === 'active' 
                        ? 'bg-defi-green-500/20 text-defi-green-400 border-defi-green-500/30' 
                        : 'bg-defi-red-500/20 text-defi-red-400 border-defi-red-500/30'
                      }
                    >
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        contract.status === 'active' ? 'bg-defi-green-400' : 'bg-defi-red-400'
                      }`} />
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Staking Configuration */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Staking Configuration
        </h3>
        
        <Card className="defi-card border-defi-purple-500/30 bg-defi-purple-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current Reward Rate</p>
                <p className="text-lg font-semibold text-white">
                  {currentRewardRate ? formatUnits(currentRewardRate, 18) : '0'} SOVA/sec
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePauseToggle}
                  disabled={adminActions.isPending}
                  variant={isPaused ? "default" : "destructive"}
                  size="sm"
                >
                  {adminActions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  {isPaused ? 'Unpause' : 'Pause'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reward-rate" className="text-sm text-slate-300">
                New Reward Rate (SOVA/second)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="reward-rate"
                  type="number"
                  placeholder="0.001"
                  value={newRewardRate}
                  onChange={(e) => setNewRewardRate(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSetRewardRate}
                  disabled={!newRewardRate || adminActions.isPending}
                  size="sm"
                >
                  {adminActions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redemption Configuration */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Redemption Configuration
        </h3>
        
        <Card className="defi-card border-defi-blue-500/30 bg-defi-blue-500/5">
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Current Redemption Delay</p>
              <p className="text-lg font-semibold text-white">
                {currentRedemptionDelay ? Number(currentRedemptionDelay) / 86400 : 0} days
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="redemption-delay" className="text-sm text-slate-300">
                New Redemption Delay (days)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="redemption-delay"
                  type="number"
                  placeholder="10"
                  value={newRedemptionDelay}
                  onChange={(e) => setNewRedemptionDelay(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSetRedemptionDelay}
                  disabled={!newRedemptionDelay || adminActions.isPending}
                  size="sm"
                >
                  {adminActions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      {adminActions.hash && (
        <Card className="defi-card border-defi-green-500/30 bg-defi-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {adminActions.isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin text-defi-blue-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-defi-green-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {adminActions.isConfirming ? 'Transaction Confirming...' : 'Transaction Successful'}
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${adminActions.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-defi-blue-400 hover:underline"
                >
                  View on BaseScan →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 