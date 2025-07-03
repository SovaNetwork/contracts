'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { Address, isAddress } from 'viem'
import { CONTRACT_ADDRESSES, isSupportedChain, ERC20_ABI } from '@/config/contracts'

const WHITELIST_ABI = [
  {
    type: 'function',
    name: 'isTokenWhitelisted',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getWhitelistedTokens',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'addToken',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeToken',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
] as const

interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  isWhitelisted: boolean
}

export function WhitelistManager() {
  const { toast } = useToast()
  const chainId = useChainId()
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [tokenToRemove, setTokenToRemove] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [tokenInfos, setTokenInfos] = useState<TokenInfo[]>([])

  const addresses = isSupportedChain(chainId) 
    ? CONTRACT_ADDRESSES[chainId]
    : CONTRACT_ADDRESSES[84532] // Fallback to Base Sepolia

  const whitelistAddress = addresses.TOKEN_WHITELIST

  // Get whitelisted tokens
  const { data: whitelistedTokens, isLoading: tokensLoading, refetch: refetchTokens } = useReadContract({
    address: whitelistAddress,
    abi: WHITELIST_ABI,
    functionName: 'getWhitelistedTokens',
  })

  const { writeContract: addToken, isPending: isAdding } = useWriteContract()
  const { writeContract: removeToken, isPending: isRemoving } = useWriteContract()

  // Fetch token information for each whitelisted token
  useEffect(() => {
    if (!whitelistedTokens || !whitelistAddress) return

    const fetchTokenInfos = async () => {
      const infos: TokenInfo[] = []
      
      for (const tokenAddress of whitelistedTokens) {
        try {
          // In a real implementation, you would use useReadContract for each token
          // For now, we'll use placeholder data
          infos.push({
            address: tokenAddress,
            name: 'Token Name', // Would fetch from contract
            symbol: 'TKN', // Would fetch from contract
            decimals: 18, // Would fetch from contract
            isWhitelisted: true,
          })
        } catch (error) {
          console.error(`Failed to fetch info for token ${tokenAddress}:`, error)
        }
      }
      
      setTokenInfos(infos)
    }

    fetchTokenInfos()
  }, [whitelistedTokens, whitelistAddress])

  const handleAddToken = async () => {
    if (!isAddress(newTokenAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address.',
        variant: 'destructive',
      })
      return
    }

    try {
      addToken({
        address: whitelistAddress,
        abi: WHITELIST_ABI,
        functionName: 'addToken',
        args: [newTokenAddress as `0x${string}`],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Adding token to whitelist...',
      })

      setIsAddDialogOpen(false)
      setNewTokenAddress('')
      refetchTokens()
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to add token',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveToken = async (tokenAddress: string) => {
    try {
      removeToken({
        address: whitelistAddress,
        abi: WHITELIST_ABI,
        functionName: 'removeToken',
        args: [tokenAddress as `0x${string}`],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Removing token from whitelist...',
      })

      setIsRemoveDialogOpen(false)
      setTokenToRemove(null)
      refetchTokens()
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to remove token',
        variant: 'destructive',
      })
    }
  }

  // Listen for transaction completion
  useEffect(() => {
    if (addTokenHash) {
      refetchTokens()
      toast({
        title: 'Token Added',
        description: 'Token has been successfully added to the whitelist.',
      })
    }
  }, [addTokenHash, refetchTokens, toast])

  useEffect(() => {
    if (removeTokenHash) {
      refetchTokens()
      toast({
        title: 'Token Removed',
        description: 'Token has been successfully removed from the whitelist.',
      })
    }
  }, [removeTokenHash, refetchTokens, toast])

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Whitelist Management</CardTitle>
              <CardDescription>
                Manage which BTC-pegged tokens can be deposited into the protocol
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Token to Whitelist</DialogTitle>
                  <DialogDescription>
                    Enter the contract address of the BTC-pegged token you want to whitelist.
                    Make sure the token follows the ERC20 standard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tokenAddress">Token Address</Label>
                    <Input
                      id="tokenAddress"
                      placeholder="0x..."
                      value={newTokenAddress}
                      onChange={(e) => setNewTokenAddress(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddToken} disabled={isAdding || !newTokenAddress}>
                    {isAdding ? 'Adding...' : 'Add Token'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tokensLoading ? (
            <div className="text-center py-8">Loading tokens...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Decimals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokenInfos.map((token) => (
                  <TableRow key={token.address}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm">{shortenAddress(token.address)}</code>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://sepolia.basescan.org/address/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{token.decimals}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Whitelisted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTokenToRemove(token.address)
                          setIsRemoveDialogOpen(true)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remove Token Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Token from Whitelist</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this token from the whitelist? 
              Users will no longer be able to deposit this token.
            </DialogDescription>
          </DialogHeader>
          {tokenToRemove && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">
                    Token: {shortenAddress(tokenToRemove)}
                  </div>
                  <div className="text-sm text-red-600">
                    This action cannot be undone
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => tokenToRemove && handleRemoveToken(tokenToRemove)}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 