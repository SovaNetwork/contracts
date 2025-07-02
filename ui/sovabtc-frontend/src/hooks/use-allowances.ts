import { useCallback, useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { useERC20, useContractAddresses } from './use-contracts'
import { formatTokenAmount } from '@/lib/decimal-conversion'

interface AllowanceState {
  allowance: bigint
  formatted: string
  isApproved: boolean
  isApproving: boolean
  isLoading: boolean
  error: Error | null
}

interface UseAllowanceReturn extends AllowanceState {
  approve: (amount: bigint) => Promise<void>
  approveMax: () => Promise<void>
  revoke: () => Promise<void>
  checkApproval: (amount: bigint) => boolean
  refetch: () => void
}

/**
 * Hook for managing token allowances with the wrapper contract
 */
export function useAllowance(tokenAddress?: Address, decimals?: number): UseAllowanceReturn {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()
  const [approvalTxHash, setApprovalTxHash] = useState<string | undefined>()
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get ERC20 token hook
  const { approveSpender, isApproving: contractApproving, useAllowance: getAllowance } = useERC20(tokenAddress)
  
  // Get allowance for wrapper contract
  const {
    data: allowanceRaw,
    isLoading: allowanceLoading,
    refetch: refetchAllowance,
  } = getAllowance(contractAddresses.wrapper)

  // Wait for approval transaction
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}`,
  })

  const allowance = allowanceRaw || BigInt(0)
  const formatted = decimals ? formatTokenAmount(allowance, decimals, 6) : '0'

  // Check if approved for specific amount
  const checkApproval = useCallback((amount: bigint): boolean => {
    return allowance >= amount
  }, [allowance])

  // Check if any approval exists
  const isApproved = allowance > BigInt(0)

  // Approve specific amount
  const approve = useCallback(async (amount: bigint) => {
    if (!tokenAddress || !address) {
      throw new Error('Token address or user address not available')
    }

    setIsApproving(true)
    setError(null)

    try {
      approveSpender(contractAddresses.wrapper, amount)
      // Note: In a real implementation, you'd get the transaction hash from the result
      // and set it to watch for confirmation
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Approval failed')
      setError(error)
      throw error
    } finally {
      setIsApproving(false)
    }
  }, [tokenAddress, address, approveSpender, contractAddresses.wrapper])

  // Approve maximum amount
  const approveMax = useCallback(async () => {
    const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    await approve(maxAmount)
  }, [approve])

  // Revoke approval (set to 0)
  const revoke = useCallback(async () => {
    await approve(BigInt(0))
  }, [approve])

  // Refetch allowance
  const refetch = useCallback(() => {
    refetchAllowance()
  }, [refetchAllowance])

  // Reset approval state when transaction succeeds
  useEffect(() => {
    if (txSuccess) {
      setIsApproving(false)
      setApprovalTxHash(undefined)
      refetchAllowance()
    }
  }, [txSuccess, refetchAllowance])

  return {
    allowance,
    formatted,
    isApproved,
    isApproving: isApproving || contractApproving || txLoading,
    isLoading: allowanceLoading,
    error,
    approve,
    approveMax,
    revoke,
    checkApproval,
    refetch,
  }
}

/**
 * Hook for managing multiple token allowances
 */
export function useMultipleAllowances(tokenAddresses: Address[]) {
  // This would ideally create multiple allowance hooks
  // For now, we'll create a simplified version
  
  const getAllowances = useCallback(() => {
    return tokenAddresses.reduce((acc, address) => {
      // This is a placeholder - in real implementation you'd use the hook for each token
      acc[address] = {
        allowance: BigInt(0),
        formatted: '0',
        isApproved: false,
        isApproving: false,
        isLoading: false,
        error: null,
        approve: async () => {},
        approveMax: async () => {},
        revoke: async () => {},
        checkApproval: () => false,
        refetch: () => {},
      }
      return acc
    }, {} as Record<Address, UseAllowanceReturn>)
  }, [tokenAddresses])

  return {
    allowances: getAllowances(),
    refetchAll: () => {
      // Refetch all allowances
    },
  }
}

/**
 * Hook for automatic approval management
 */
export function useAutoApproval(
  tokenAddress?: Address,
  decimals?: number,
  requiredAmount?: bigint
) {
  const allowanceHook = useAllowance(tokenAddress, decimals)
  const [needsApproval, setNeedsApproval] = useState(false)

  useEffect(() => {
    if (requiredAmount && allowanceHook.allowance < requiredAmount) {
      setNeedsApproval(true)
    } else {
      setNeedsApproval(false)
    }
  }, [requiredAmount, allowanceHook.allowance])

  const approveRequired = useCallback(async () => {
    if (requiredAmount && needsApproval) {
      // Approve 20% more than required to avoid frequent re-approvals
      const approvalAmount = (requiredAmount * BigInt(120)) / BigInt(100)
      await allowanceHook.approve(approvalAmount)
    }
  }, [requiredAmount, needsApproval, allowanceHook])

  return {
    ...allowanceHook,
    needsApproval,
    approveRequired,
  }
}

/**
 * Utility hook for checking if approval is needed before deposit
 */
export function useDepositApproval(tokenAddress?: Address, amount?: bigint, decimals?: number) {
  const { checkApproval, approve, isApproving, isApproved } = useAllowance(tokenAddress, decimals)
  
  const needsApproval = amount ? !checkApproval(amount) : false
  
  const approveForDeposit = useCallback(async () => {
    if (amount && needsApproval) {
      await approve(amount)
    }
  }, [amount, needsApproval, approve])

  return {
    needsApproval,
    approveForDeposit,
    isApproving,
    isApproved,
    checkApproval,
  }
}

/**
 * Hook for approval status display
 */
export function useApprovalStatus(tokenAddress?: Address, amount?: bigint, decimals?: number) {
  const { allowance, isApproving, checkApproval } = useAllowance(tokenAddress, decimals)
  
  const getApprovalStatus = useCallback(() => {
    if (isApproving) return 'approving'
    if (!amount) return 'none'
    if (checkApproval(amount)) return 'approved'
    return 'needed'
  }, [isApproving, amount, checkApproval])

  const getApprovalMessage = useCallback(() => {
    const status = getApprovalStatus()
    
    switch (status) {
      case 'approving':
        return 'Approving token spend...'
      case 'approved':
        return 'Token spend approved'
      case 'needed':
        return 'Token spend approval required'
      default:
        return ''
    }
  }, [getApprovalStatus])

  return {
    status: getApprovalStatus(),
    message: getApprovalMessage(),
    allowance,
    isApproving,
  }
} 