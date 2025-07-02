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
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Settings, Users, Shield, ExternalLink } from 'lucide-react'
import { Address, isAddress } from 'viem'
import { contractAddresses } from '@/config/contracts'

const CUSTODY_MANAGER_ABI = [
  {
    name: 'addCustodian',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'custodian', type: 'address' }],
    outputs: [],
  },
  {
    name: 'removeCustodian',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'custodian', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setCustodyAddress',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'custodyAddress', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'setCustodyEnforcement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'enforced', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'getCustodianCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCustodianAtIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'isAuthorizedCustodian',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'custodian', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getCustodyConfig',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'custodyAddress', type: 'address' },
      { name: 'enforced', type: 'bool' },
    ],
  },
] as const

export function CustodyManager() {
  const { toast } = useToast()
  const chainId = useChainId()
  const [newCustodianAddress, setNewCustodianAddress] = useState('')
  const [custodianToRemove, setCustodianToRemove] = useState<Address | null>(null)
  const [isAddCustodianDialogOpen, setIsAddCustodianDialogOpen] = useState(false)
  const [isRemoveCustodianDialogOpen, setIsRemoveCustodianDialogOpen] = useState(false)
  const [isCustodyDialogOpen, setIsCustodyDialogOpen] = useState(false)
  const [newCustodyToken, setNewCustodyToken] = useState('')
  const [newCustodyAddress, setNewCustodyAddress] = useState('')
  const [custodians, setCustodians] = useState<Address[]>([])

  // Placeholder addresses - in real implementation would come from wrapper contract
  const custodyManagerAddress = '0x0000000000000000000000000000000000000000' // Replace with actual address

  // Read custodian count
  const { data: custodianCount, refetch: refetchCustodianCount } = useReadContract({
    address: custodyManagerAddress as Address,
    abi: CUSTODY_MANAGER_ABI,
    functionName: 'getCustodianCount',
  })

  // Write contract hooks
  const { writeContract: addCustodian, data: addCustodianHash } = useWriteContract()
  const { writeContract: removeCustodian, data: removeCustodianHash } = useWriteContract()
  const { writeContract: setCustodyAddress, data: setCustodyHash } = useWriteContract()

  // Transaction status
  const { isLoading: isAddingCustodian } = useWaitForTransactionReceipt({
    hash: addCustodianHash,
  })
  const { isLoading: isRemovingCustodian } = useWaitForTransactionReceipt({
    hash: removeCustodianHash,
  })

  // Fetch all custodians
  useEffect(() => {
    if (!custodianCount || !custodyManagerAddress) return

    const fetchCustodians = async () => {
      const custodianList: Address[] = []
      const count = Number(custodianCount)
      
      for (let i = 0; i < count; i++) {
        // In real implementation, would use useReadContract for each index
        // For now, placeholder data
        custodianList.push(`0x${i.toString().padStart(40, '0')}` as Address)
      }
      
      setCustodians(custodianList)
    }

    fetchCustodians()
  }, [custodianCount, custodyManagerAddress])

  const handleAddCustodian = async () => {
    if (!isAddress(newCustodianAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address.',
        variant: 'destructive',
      })
      return
    }

    try {
      addCustodian({
        address: custodyManagerAddress as Address,
        abi: CUSTODY_MANAGER_ABI,
        functionName: 'addCustodian',
        args: [newCustodianAddress as Address],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Adding custodian...',
      })

      setIsAddCustodianDialogOpen(false)
      setNewCustodianAddress('')
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to add custodian',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveCustodian = async () => {
    if (!custodianToRemove) return

    try {
      removeCustodian({
        address: custodyManagerAddress as Address,
        abi: CUSTODY_MANAGER_ABI,
        functionName: 'removeCustodian',
        args: [custodianToRemove],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Removing custodian...',
      })

      setIsRemoveCustodianDialogOpen(false)
      setCustodianToRemove(null)
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to remove custodian',
        variant: 'destructive',
      })
    }
  }

  const handleSetCustodyAddress = async () => {
    if (!isAddress(newCustodyToken) || !isAddress(newCustodyAddress)) {
      toast({
        title: 'Invalid Addresses',
        description: 'Please enter valid Ethereum addresses.',
        variant: 'destructive',
      })
      return
    }

    try {
      setCustodyAddress({
        address: custodyManagerAddress as Address,
        abi: CUSTODY_MANAGER_ABI,
        functionName: 'setCustodyAddress',
        args: [newCustodyToken as Address, newCustodyAddress as Address],
      })

      toast({
        title: 'Transaction Submitted',
        description: 'Setting custody address...',
      })

      setIsCustodyDialogOpen(false)
      setNewCustodyToken('')
      setNewCustodyAddress('')
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to set custody address',
        variant: 'destructive',
      })
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Custody Management
          </CardTitle>
          <CardDescription>
            Manage custodians and custody addresses for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Custody Management</h3>
            <p className="text-muted-foreground">
              Custodian and custody address management functionality will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custodian Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Custodian Management
              </CardTitle>
              <CardDescription>
                Manage authorized custodians who can fulfill redemption requests
              </CardDescription>
            </div>
            <Dialog open={isAddCustodianDialogOpen} onOpenChange={setIsAddCustodianDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custodian
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Custodian</DialogTitle>
                  <DialogDescription>
                    Enter the address of the custodian who will be authorized to fulfill redemption requests.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custodianAddress">Custodian Address</Label>
                    <Input
                      id="custodianAddress"
                      placeholder="0x..."
                      value={newCustodianAddress}
                      onChange={(e) => setNewCustodianAddress(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCustodianDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustodian} disabled={isAddingCustodian}>
                    {isAddingCustodian ? 'Adding...' : 'Add Custodian'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {custodians.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Custodians</h3>
              <p className="text-muted-foreground mb-4">
                Add your first custodian to enable redemption fulfillment.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custodians.map((custodian, index) => (
                  <TableRow key={custodian}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm">{shortenAddress(custodian)}</code>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://sepolia.basescan.org/address/${custodian}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Authorized
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustodianToRemove(custodian)
                          setIsRemoveCustodianDialogOpen(true)
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

      {/* Custody Address Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custody Address Configuration
              </CardTitle>
              <CardDescription>
                Configure custody addresses for token storage and validation
              </CardDescription>
            </div>
            <Dialog open={isCustodyDialogOpen} onOpenChange={setIsCustodyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Set Custody Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Custody Address</DialogTitle>
                  <DialogDescription>
                    Configure the custody address for a specific token. This address will be used for validation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custodyToken">Token Address</Label>
                    <Input
                      id="custodyToken"
                      placeholder="0x..."
                      value={newCustodyToken}
                      onChange={(e) => setNewCustodyToken(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custodyAddress">Custody Address</Label>
                    <Input
                      id="custodyAddress"
                      placeholder="0x..."
                      value={newCustodyAddress}
                      onChange={(e) => setNewCustodyAddress(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCustodyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetCustodyAddress}>
                    Set Custody Address
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Custody Configuration</h3>
            <p className="text-muted-foreground">
              Configure custody addresses for enhanced security and validation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remove Custodian Dialog */}
      <Dialog open={isRemoveCustodianDialogOpen} onOpenChange={setIsRemoveCustodianDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Custodian</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this custodian? They will no longer be able to fulfill redemption requests.
            </DialogDescription>
          </DialogHeader>
          {custodianToRemove && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">
                    Custodian: {shortenAddress(custodianToRemove)}
                  </div>
                  <div className="text-sm text-red-600">
                    This action cannot be undone
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveCustodianDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveCustodian}
              disabled={isRemovingCustodian}
            >
              {isRemovingCustodian ? 'Removing...' : 'Remove Custodian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 