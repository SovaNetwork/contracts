'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { TEST_TOKENS, CONTRACT_ADDRESSES, type TestToken } from '@/contracts/addresses'
import { baseSepolia } from 'viem/chains'

export default function WrapPage() {
  const { isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<TestToken>(TEST_TOKENS[0])
  const [amount, setAmount] = useState('')

  const tokenBalance = useTokenBalance(selectedToken.address)
  const tokenAllowance = useTokenAllowance(
    selectedToken.address,
    CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER
  )
  const approval = useTokenApproval()

  const needsApproval = amount && tokenBalance.decimals
    ? tokenAllowance.hasInsufficientAllowance(amount, tokenBalance.decimals)
    : false

  const handleApprove = async () => {
    if (!amount || !tokenBalance.decimals) return
    
    await approval.approve(
      selectedToken.address,
      CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER,
      amount,
      tokenBalance.decimals
    )
  }

  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(tokenBalance.formattedBalance)

  if (!isConnected) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Wrap Bitcoin Assets</CardTitle>
            <CardDescription>Convert your Bitcoin assets to SovaBTC</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-4">
              <p className="text-slate-400">Connect your wallet to get started</p>
              <ConnectButton />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Wrap Bitcoin Assets</CardTitle>
          <CardDescription>Convert your Bitcoin assets to SovaBTC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Token</label>
            <select
              value={selectedToken.symbol}
              onChange={(e) => {
                const token = TEST_TOKENS.find(t => t.symbol === e.target.value)
                if (token) setSelectedToken(token)
              }}
              className="w-full p-3 rounded-lg bg-background border border-white/10 text-white focus:border-defi-purple-500 focus:outline-none"
            >
              {TEST_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.icon} {token.name} ({token.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-sm text-slate-400">{selectedToken.symbol}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-400 mt-2">
              <span>
                Balance: {tokenBalance.isLoading ? 'Loading...' : tokenBalance.formattedBalance}
              </span>
              <button
                onClick={() => setAmount(tokenBalance.formattedBalance)}
                className="text-defi-purple-400 hover:text-defi-purple-300 transition-colors"
                disabled={tokenBalance.isLoading}
              >
                Max
              </button>
            </div>
          </div>

          {/* Token Info */}
          <div className="p-4 rounded-lg bg-slate-800/30 border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Token:</span>
                <div className="font-medium">{selectedToken.name}</div>
              </div>
              <div>
                <span className="text-slate-400">Decimals:</span>
                <div className="font-medium">{selectedToken.decimals}</div>
              </div>
              <div>
                <span className="text-slate-400">Allowance:</span>
                <div className="font-medium">
                  {tokenAllowance.isLoading ? 'Loading...' : tokenAllowance.hasAllowance ? 'Approved' : 'Not Approved'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <div className="font-medium text-defi-green-500">Ready</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            {needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={approval.isPending || approval.isConfirming || !isValidAmount}
                className="w-full"
              >
                {approval.isPending && 'Waiting for signature...'}
                {approval.isConfirming && 'Confirming approval...'}
                {!approval.isPending && !approval.isConfirming && 
                  `Approve ${selectedToken.symbol}`
                }
              </Button>
            ) : (
              <Button
                disabled={!isValidAmount}
                className="w-full"
              >
                Wrap to SovaBTC (Coming Soon)
              </Button>
            )}
          </div>

          {/* Transaction Status */}
          {approval.hash && (
            <div className="p-4 bg-slate-800/30 rounded-lg border border-white/10">
              <p className="text-sm text-slate-400 mb-2">Transaction Status:</p>
              <a
                href={`https://sepolia.basescan.org/tx/${approval.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-defi-purple-400 hover:text-defi-purple-300 text-sm underline"
              >
                View on Base Sepolia Explorer
              </a>
              <div className="mt-2">
                {approval.isPending && <p className="text-yellow-400 text-sm">⏳ Waiting for signature...</p>}
                {approval.isConfirming && <p className="text-blue-400 text-sm">🔄 Confirming transaction...</p>}
                {approval.isSuccess && <p className="text-green-400 text-sm">✅ Transaction confirmed!</p>}
                {approval.error && <p className="text-red-400 text-sm">❌ Transaction failed</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}