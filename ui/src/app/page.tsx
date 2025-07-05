'use client'

import { useState } from 'react'
import {
  useAccount,
  useSimulateContract as usePrepareContractWrite,
  useContractWrite,
  useWaitForTransactionReceipt,
} from 'wagmi'

// Minimal ABI fragments for the SovaBTC contract
const SOVABTC_ADDRESS = '0x2100000000000000000000000000000000000020'
const SOVABTC_ABI = [
  {
    inputs: [
      { internalType: 'uint64', name: 'amount', type: 'uint64' },
      { internalType: 'bytes', name: 'signedTx', type: 'bytes' },
      { internalType: 'uint8', name: 'voutIndex', type: 'uint8' },
    ],
    name: 'depositBTC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint64', name: 'amount', type: 'uint64' },
      { internalType: 'uint64', name: 'btcGasLimit', type: 'uint64' },
      { internalType: 'uint64', name: 'btcBlockHeight', type: 'uint64' },
      { internalType: 'string', name: 'dest', type: 'string' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function HomePage() {
  const { isConnected } = useAccount()

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('')
  const [depositTx, setDepositTx] = useState('')
  const [depositIndex, setDepositIndex] = useState('')

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawGasLimit, setWithdrawGasLimit] = useState('')
  const [withdrawHeight, setWithdrawHeight] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')

  // Prepare hooks
  const { data: depositPrep } = usePrepareContractWrite({
    address: SOVABTC_ADDRESS,
    abi: SOVABTC_ABI,
    functionName: 'depositBTC',
    args:
      depositAmount && depositTx && depositIndex
        ? [
            BigInt(depositAmount),
            depositTx as `0x${string}`,
            Number(depositIndex),
          ]
        : undefined,
    query: {
      enabled: Boolean(depositAmount && depositTx && depositIndex && isConnected),
    },
  })

  const { data: depositHash, writeContract: depositWrite, isPending: isDepositing } =
    useContractWrite()
  const { isLoading: depositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const { data: withdrawPrep } = usePrepareContractWrite({
    address: SOVABTC_ADDRESS,
    abi: SOVABTC_ABI,
    functionName: 'withdraw',
    args:
      withdrawAmount && withdrawGasLimit && withdrawHeight && withdrawAddress
        ? [
            BigInt(withdrawAmount),
            BigInt(withdrawGasLimit),
            BigInt(withdrawHeight),
            withdrawAddress,
          ]
        : undefined,
    query: {
      enabled: Boolean(
        withdrawAmount &&
          withdrawGasLimit &&
          withdrawHeight &&
          withdrawAddress &&
          isConnected,
      ),
    },
  })

  const { data: withdrawHash, writeContract: withdrawWrite, isPending: isWithdrawing } =
    useContractWrite()
  const { isLoading: withdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (depositPrep?.request) {
      depositWrite(depositPrep.request)
    }
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    if (withdrawPrep?.request) {
      withdrawWrite(withdrawPrep.request)
    }
  }

  return (
    <main className="container mx-auto p-4 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Deposit BTC for sovaBTC
          </h2>
          <form className="space-y-4" onSubmit={handleDeposit}>
            <div>
              <label
                htmlFor="deposit-amount"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Amount (satoshis)
              </label>
              <input
                id="deposit-amount"
                type="number"
                required
                placeholder="e.g. 100000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="deposit-tx"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Signed BTC Transaction (hex)
              </label>
              <input
                id="deposit-tx"
                type="text"
                required
                placeholder="Paste the signed transaction hex"
                value={depositTx}
                onChange={(e) => setDepositTx(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="deposit-index"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Output Index
              </label>
              <input
                id="deposit-index"
                type="number"
                required
                placeholder="e.g. 0"
                value={depositIndex}
                onChange={(e) => setDepositIndex(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={isDepositing || depositConfirming || !depositPrep?.request}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {isDepositing || depositConfirming ? 'Processing...' : 'Deposit'}
            </button>
          </form>
        </section>
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Withdraw sovaBTC to BTC
          </h2>
          <form className="space-y-4" onSubmit={handleWithdraw}>
            <div>
              <label
                htmlFor="withdraw-amount"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Amount (satoshis)
              </label>
              <input
                id="withdraw-amount"
                type="number"
                required
                placeholder="e.g. 100000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-gas"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                BTC Gas Limit (satoshis)
              </label>
              <input
                id="withdraw-gas"
                type="number"
                required
                placeholder="e.g. 500"
                value={withdrawGasLimit}
                onChange={(e) => setWithdrawGasLimit(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-height"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                BTC Block Height
              </label>
              <input
                id="withdraw-height"
                type="number"
                required
                placeholder="e.g. 820000"
                value={withdrawHeight}
                onChange={(e) => setWithdrawHeight(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-address"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Destination BTC Address
              </label>
              <input
                id="withdraw-address"
                type="text"
                required
                placeholder="bc1..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || withdrawConfirming || !withdrawPrep?.request}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {isWithdrawing || withdrawConfirming ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
