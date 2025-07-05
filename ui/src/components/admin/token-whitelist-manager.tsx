'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Coins
} from 'lucide-react'

import { useAdminActions } from '@/hooks/web3/use-admin-actions'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { TOKEN_WHITELIST_ABI } from '@/contracts/abis'
import { baseSepolia } from 'viem/chains'
import { isAddress } from 'viem'

export function TokenWhitelistManager() {
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [removeTokenAddress, setRemoveTokenAddress] = useState('')
  
  const whitelistAddress = CONTRACT_ADDRESSES[baseSepolia.id].TOKEN_WHITELIST
  const adminActions = useAdminActions()

  // Mock whitelisted tokens for demonstration
  const whitelistedTokens = [
    { address: CONTRACT_ADDRESSES[baseSepolia.id].WBTC_TEST, symbol: 'WBTC', name: 'Wrapped Bitcoin' },
    { address: CONTRACT_ADDRESSES[baseSepolia.id].LBTC_TEST, symbol: 'LBTC', name: 'Liquid Bitcoin' },
    { address: CONTRACT_ADDRESSES[baseSepolia.id].USDC_TEST, symbol: 'USDC', name: 'USD Coin' },
  ]

  const handleAddToken = async () => {
    if (!newTokenAddress || !isAddress(newTokenAddress)) return
    await adminActions.addToWhitelist(whitelistAddress, newTokenAddress as `0x${string}`)
    setNewTokenAddress('')
  }

  const handleRemoveToken = async (tokenAddress: string) => {
    await adminActions.removeFromWhitelist(whitelistAddress, tokenAddress as `0x${string}`)
  }

  const isValidAddress = newTokenAddress && isAddress(newTokenAddress)

  return (
    <div className="space-y-6">
      {/* Add Token */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Token to Whitelist
        </h3>
        
        <Card className="defi-card border-defi-green-500/30 bg-defi-green-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token-address" className="text-sm text-slate-300">
                Token Contract Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="token-address"
                  type="text"
                  placeholder="0x..."
                  value={newTokenAddress}
                  onChange={(e) => setNewTokenAddress(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                <Button 
                  onClick={handleAddToken}
                  disabled={!isValidAddress || adminActions.isPending}
                  size="sm"
                  className="bg-defi-green-600 hover:bg-defi-green-700"
                >
                  {adminActions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
              {newTokenAddress && !isValidAddress && (
                <p className="text-sm text-defi-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Invalid address format
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Whitelist */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Current Whitelist ({whitelistedTokens.length} tokens)
        </h3>
        
        <div className="grid gap-3">
          {whitelistedTokens.map((token, index) => (
            <motion.div
              key={token.address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="defi-card border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-defi-blue-500/20 border border-defi-blue-500/30 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-defi-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{token.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{token.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {token.address.slice(0, 10)}...{token.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveToken(token.address)}
                      disabled={adminActions.isPending}
                      variant="destructive"
                      size="sm"
                      className="bg-defi-red-600 hover:bg-defi-red-700"
                    >
                      {adminActions.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
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
                  {adminActions.isConfirming ? 'Whitelist Update Confirming...' : 'Whitelist Updated Successfully'}
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