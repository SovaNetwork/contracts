'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Pause,
  Shield,
  StopCircle,
  Loader2,
  CheckCircle
} from 'lucide-react'

import { useAdminActions } from '@/hooks/web3/use-admin-actions'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { SOVABTC_STAKING_ABI } from '@/contracts/abis'
import { baseSepolia } from 'viem/chains'

export function EmergencyControls() {
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const adminActions = useAdminActions()

  const emergencyActions = [
    {
      id: 'pause-staking',
      title: 'Pause Staking Contract',
      description: 'Temporarily halt all staking operations',
      icon: Pause,
      color: 'text-defi-yellow-400',
      bgColor: 'bg-defi-yellow-500/20',
      borderColor: 'border-defi-yellow-500/30',
      severity: 'medium',
    },
    {
      id: 'pause-wrapper',
      title: 'Pause Wrapper Contract',
      description: 'Stop all new token wrapping operations',
      icon: StopCircle,
      color: 'text-defi-red-400',
      bgColor: 'bg-defi-red-500/20',
      borderColor: 'border-defi-red-500/30',
      severity: 'high',
    },
    {
      id: 'emergency-shutdown',
      title: 'Emergency Protocol Shutdown',
      description: 'Halt all protocol operations immediately',
      icon: Shield,
      color: 'text-defi-red-400',
      bgColor: 'bg-defi-red-500/20',
      borderColor: 'border-defi-red-500/30',
      severity: 'critical',
    },
  ]

  const handleEmergencyAction = async (actionId: string) => {
    if (confirmAction !== actionId) {
      setConfirmAction(actionId)
      return
    }

    try {
      switch (actionId) {
        case 'pause-staking':
          await adminActions.pauseContract(
            CONTRACT_ADDRESSES[baseSepolia.id].STAKING,
            SOVABTC_STAKING_ABI
          )
          break
        case 'pause-wrapper':
          // TODO: implement wrapper contract pause functionality
          break
        case 'emergency-shutdown':
          // TODO: implement protocol wide shutdown
          break
      }
    } catch (error) {
      console.error('Emergency action failed:', error)
    } finally {
      setConfirmAction(null)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors = {
      medium: 'bg-defi-yellow-500/20 text-defi-yellow-400 border-defi-yellow-500/30',
      high: 'bg-defi-red-500/20 text-defi-red-400 border-defi-red-500/30',
      critical: 'bg-defi-red-600/20 text-defi-red-300 border-defi-red-600/30',
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <Card className="defi-card border-defi-red-500/50 bg-defi-red-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-defi-red-400" />
            <div>
              <h3 className="font-semibold text-defi-red-300">Emergency Controls</h3>
              <p className="text-sm text-slate-400">
                These actions will immediately affect all users. Use only in critical situations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <div className="space-y-4">
        {emergencyActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`defi-card ${action.borderColor} ${action.bgColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${action.bgColor} ${action.borderColor} border`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{action.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityBadge(action.severity)}`}
                        >
                          {action.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{action.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {confirmAction === action.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction(null)}
                          disabled={adminActions.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEmergencyAction(action.id)}
                          disabled={adminActions.isPending}
                          className="bg-defi-red-600 hover:bg-defi-red-700"
                        >
                          {adminActions.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Confirm
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEmergencyAction(action.id)}
                        disabled={adminActions.isPending}
                        className="bg-defi-red-600 hover:bg-defi-red-700"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transaction Status */}
      {adminActions.hash && (
        <Card className="defi-card border-defi-blue-500/30 bg-defi-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {adminActions.isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin text-defi-blue-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-defi-green-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {adminActions.isConfirming ? 'Emergency Action Confirming...' : 'Emergency Action Completed'}
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

      {/* Protocol Status */}
      <Card className="defi-card border-defi-green-500/30 bg-defi-green-500/5">
        <CardContent className="p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-defi-green-400" />
            Current Protocol Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Staking Contract</span>
              <Badge className="bg-defi-green-500/20 text-defi-green-400 border-defi-green-500/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Wrapper Contract</span>
              <Badge className="bg-defi-green-500/20 text-defi-green-400 border-defi-green-500/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Redemption Queue</span>
              <Badge className="bg-defi-green-500/20 text-defi-green-400 border-defi-green-500/30">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 