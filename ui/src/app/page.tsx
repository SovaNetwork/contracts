'use client'

import { useState, useEffect } from 'react'
import {
  useAccount,
  useSimulateContract as usePrepareContractWrite,
  useContractWrite,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { formatUnits } from 'viem'

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
  const { address, isConnected } = useAccount()

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('')
  const [depositTx, setDepositTx] = useState('')
  const [depositIndex, setDepositIndex] = useState('')

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawGasLimit, setWithdrawGasLimit] = useState('')
  const [withdrawHeight, setWithdrawHeight] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')

  // Status messages
  const [depositStatus, setDepositStatus] = useState<
    | { type: 'success' | 'error'; message: React.ReactNode }
    | null
  >(null)
  const [withdrawStatus, setWithdrawStatus] = useState<
    | { type: 'success' | 'error'; message: React.ReactNode }
    | null
  >(null)

  // User balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: SOVABTC_ADDRESS,
    abi: SOVABTC_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: Boolean(address), watch: true },
  })
  const balanceFormatted = balanceData
    ? formatUnits(balanceData, 8)
    : '0.00000000'

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

  const {
    data: depositHash,
    writeContract: depositWrite,
    isPending: isDepositing,
    error: depositWriteError,
  } = useContractWrite()
  const {
    isLoading: depositConfirming,
    isSuccess: depositSuccess,
    error: depositTxError,
  } = useWaitForTransactionReceipt({
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

  const {
    data: withdrawHash,
    writeContract: withdrawWrite,
    isPending: isWithdrawing,
    error: withdrawWriteError,
  } = useContractWrite()
  const {
    isLoading: withdrawConfirming,
    isSuccess: withdrawSuccess,
    error: withdrawTxError,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    setDepositStatus(null)
    if (depositPrep?.request) {
      depositWrite(depositPrep.request)
    }
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawStatus(null)
    if (withdrawPrep?.request) {
      withdrawWrite(withdrawPrep.request)
    }
  }

  useEffect(() => {
    if (depositSuccess && depositHash) {
      setDepositStatus({
        type: 'success',
        message: (
          <span>
            Deposit submitted! Tx:{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${depositHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {depositHash.slice(0, 8)}...
            </a>
          </span>
        ),
      })
      refetchBalance()
    }
  }, [depositSuccess, depositHash, refetchBalance])

  useEffect(() => {
    if (depositWriteError || depositTxError) {
      setDepositStatus({
        type: 'error',
        message: depositWriteError?.message || depositTxError?.message || 'Transaction failed',
      })
    }
  }, [depositWriteError, depositTxError])

  useEffect(() => {
    if (withdrawSuccess && withdrawHash) {
      setWithdrawStatus({
        type: 'success',
        message: (
          <span>
            Withdraw submitted! Tx:{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${withdrawHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {withdrawHash.slice(0, 8)}...
            </a>
          </span>
        ),
      })
      refetchBalance()
    }
  }, [withdrawSuccess, withdrawHash, refetchBalance])

  useEffect(() => {
    if (withdrawWriteError || withdrawTxError) {
      setWithdrawStatus({
        type: 'error',
        message: withdrawWriteError?.message || withdrawTxError?.message || 'Transaction failed',
      })
    }
  }, [withdrawWriteError, withdrawTxError])

  return (
    <main className="container mx-auto p-4 mt-8">
      <div className="mb-6 text-gray-200 text-sm">
        Your sovaBTC Balance: <span className="font-semibold">{balanceFormatted}</span>
      </div>
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
            {depositStatus && (
              <div
                className={`mt-2 p-2 rounded text-sm ${
                  depositStatus.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {depositStatus.message}
              </div>
            )}
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
            {withdrawStatus && (
              <div
                className={`mt-2 p-2 rounded text-sm ${
                  withdrawStatus.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {withdrawStatus.message}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
