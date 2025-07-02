import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { toast } from 'sonner'
import { useWrapper } from './use-contracts'
import { useTokenBalance } from './use-token-balances'
import { 
  parseTokenAmount, 
  validateMinimumAmount,
  convertToSovaBTC,
  getConversionPreview as getConversionPreviewUtil,
} from '@/lib/decimal-conversion'
import { validateTokenPrecision } from '@/lib/decimal-conversion'
import { MIN_DEPOSIT_SATOSHIS } from '@/lib/constants'
import { DepositFormData, TransactionStatus } from '@/types/contracts'

interface DepositState {
  status: TransactionStatus
  error: string | null
  txHash: string | null
  isLoading: boolean
  canDeposit: boolean
}

interface DepositValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface UseDepositReturn {
  // State
  state: DepositState
  
  // Validation
  validateDeposit: (formData: DepositFormData, tokenDecimals: number) => DepositValidation
  
  // Actions
  deposit: (formData: DepositFormData, tokenDecimals: number) => Promise<void>
  approveAndDeposit: (formData: DepositFormData, tokenDecimals: number) => Promise<void>
  reset: () => void
  
  // Utilities
  getConversionPreview: (amount: string, tokenSymbol: string, tokenDecimals: number) => string
  estimateGas: () => Promise<bigint | null>
}

/**
 * Hook for managing the complete deposit flow
 */
export function useDeposit(): UseDepositReturn {
  const { address } = useAccount()
  const { depositTokens, isDepositing } = useWrapper()
  
  const [state, setState] = useState<DepositState>({
    status: 'idle',
    error: null,
    txHash: null,
    isLoading: false,
    canDeposit: false,
  })

  const [depositTxHash, setDepositTxHash] = useState<string | undefined>()

  // Wait for deposit transaction
  const { 
    isLoading: txLoading, 
    isSuccess: txSuccess, 
    isError: txError 
  } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}`,
  })

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      error: null,
      txHash: null,
      isLoading: false,
      canDeposit: false,
    })
    setDepositTxHash(undefined)
  }, [])

  // Validate deposit form data
  const validateDeposit = useCallback((
    formData: DepositFormData, 
    tokenDecimals: number
  ): DepositValidation => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate amount input
    if (!formData.amount || formData.amount === '0') {
      errors.push('Please enter an amount')
    } else {
      // Check precision
      if (!validateTokenPrecision(formData.amount, tokenDecimals)) {
        errors.push(`Amount has too many decimal places (max ${tokenDecimals})`)
      }

      try {
        const amount = parseTokenAmount(formData.amount, tokenDecimals)
        
        // Check minimum amount
        if (!validateMinimumAmount(amount, tokenDecimals, MIN_DEPOSIT_SATOSHIS)) {
          errors.push(`Minimum deposit is ${MIN_DEPOSIT_SATOSHIS} satoshis`)
        }

        // Convert to SovaBTC to show what user will receive
        const sovaBTCAmount = convertToSovaBTC(amount, tokenDecimals)
        if (sovaBTCAmount === BigInt(0)) {
          errors.push('Deposit amount too small')
        }

      } catch {
        errors.push('Invalid amount format')
      }
    }

    // Validate token selection
    if (!formData.token || formData.token === '0x0000000000000000000000000000000000000000') {
      errors.push('Please select a token')
    }

    // Validate slippage
    if (formData.slippage < 0 || formData.slippage > 5000) { // 0-50%
      errors.push('Slippage must be between 0% and 50%')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [])

  // Execute deposit (assumes approval is already done)
  const deposit = useCallback(async (
    formData: DepositFormData, 
    tokenDecimals: number
  ) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const validation = validateDeposit(formData, tokenDecimals)
    if (!validation.isValid) {
      throw new Error(validation.errors[0])
    }

    setState(prev => ({ ...prev, status: 'pending', isLoading: true, error: null }))

    try {
      const amount = parseTokenAmount(formData.amount, tokenDecimals)
      
      // Execute deposit transaction
      depositTokens(formData.token, amount)
      
      toast.info('Deposit transaction submitted', {
        description: 'Please wait for confirmation...',
      })

      // Note: In real implementation, you'd get the transaction hash from depositTokens
      // and set it to track the transaction
      
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Deposit failed'
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error, 
        isLoading: false 
      }))
      
      toast.error('Deposit failed', {
        description: error,
      })
      
      throw err
    }
  }, [address, validateDeposit, depositTokens])

  // Execute approval then deposit
  const approveAndDeposit = useCallback(async (
    formData: DepositFormData, 
    tokenDecimals: number
  ) => {
    try {
      setState(prev => ({ ...prev, status: 'pending', isLoading: true }))
      
      toast.info('Processing transaction', {
        description: 'Please wait for approval and deposit...',
      })

      // Step 1: Check if approval is needed (this would be handled by the component)
      // For now, we'll proceed directly to deposit
      
      // Step 2: Deposit
      await deposit(formData, tokenDecimals)
      
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Transaction failed'
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error, 
        isLoading: false 
      }))
      throw err
    }
  }, [deposit])

  // Get conversion preview
  const getConversionPreview = useCallback((
    amount: string, 
    tokenSymbol: string, 
    tokenDecimals: number
  ): string => {
    return getConversionPreviewUtil(amount, tokenSymbol, tokenDecimals)
  }, [])

  // Estimate gas for deposit
  const estimateGas = useCallback(async (): Promise<bigint | null> => {
    try {
      // This would parse the amount and use useEstimateGas hook with the deposit transaction
      // For now, return a placeholder
      return BigInt(150000) // 150k gas estimate
      
    } catch {
      return null
    }
  }, [])

  // Update state based on transaction status
  useEffect(() => {
    if (txLoading) {
      setState(prev => ({ ...prev, status: 'pending', isLoading: true }))
    } else if (txSuccess) {
      setState(prev => ({ 
        ...prev, 
        status: 'success', 
        isLoading: false,
        txHash: depositTxHash || null,
      }))
      
      toast.success('Deposit successful!', {
        description: 'Your tokens have been wrapped into SovaBTC',
      })
    } else if (txError) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: 'Transaction failed',
        isLoading: false 
      }))
      
      toast.error('Deposit failed', {
        description: 'The transaction was rejected or failed',
      })
    }
  }, [txLoading, txSuccess, txError, depositTxHash])

  // Update loading state based on contract state
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      isLoading: prev.isLoading || isDepositing 
    }))
  }, [isDepositing])

  return {
    state,
    validateDeposit,
    deposit,
    approveAndDeposit,
    reset,
    getConversionPreview,
    estimateGas,
  }
}

/**
 * Hook for checking deposit eligibility
 */
export function useDepositEligibility(
  tokenAddress?: Address, 
  amount?: string, 
  tokenDecimals?: number
) {
  const { balance } = useTokenBalance(tokenAddress)
  
  const getEligibility = useCallback(() => {
    if (!amount || !tokenDecimals || !balance) {
      return {
        eligible: false,
        reason: 'Missing required information',
      }
    }

    try {
      const requiredAmount = parseTokenAmount(amount, tokenDecimals)
      
      if (balance < requiredAmount) {
        return {
          eligible: false,
          reason: 'Insufficient balance',
        }
      }

      if (!validateMinimumAmount(requiredAmount, tokenDecimals, MIN_DEPOSIT_SATOSHIS)) {
        return {
          eligible: false,
          reason: 'Below minimum deposit amount',
        }
      }

      return {
        eligible: true,
        reason: null,
      }
    } catch {
      return {
        eligible: false,
        reason: 'Invalid amount',
      }
    }
  }, [amount, tokenDecimals, balance])

  return getEligibility()
}

/**
 * Simple hook for deposit button state
 */
export function useDepositButton(
  tokenAddress?: Address,
  amount?: string,
  tokenDecimals?: number
) {
  const eligibility = useDepositEligibility(tokenAddress, amount, tokenDecimals)
  
  const getButtonState = useCallback(() => {
    if (!eligibility.eligible) {
      return {
        text: eligibility.reason || 'Cannot Deposit',
        disabled: true,
        variant: 'secondary' as const,
      }
    }

    return {
      text: 'Deposit',
      disabled: false,
      variant: 'default' as const,
    }
  }, [eligibility])

  return getButtonState()
} 