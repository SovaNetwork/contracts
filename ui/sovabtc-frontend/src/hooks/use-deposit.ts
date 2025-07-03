import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, useWriteContract, useChainId } from 'wagmi'
import { Address, parseUnits } from 'viem'
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
import { 
  ERC20_ABI, 
  SOVABTC_WRAPPER_ABI, 
  CONTRACT_ADDRESSES, 
  isSupportedChain,
  CONTRACT_CONFIG
} from '@/config/contracts'
import { useTokenAllowance, useDepositApprovalCheck } from './use-allowances'

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

// Hook for ERC20 token approvals
export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number
  ) => {
    const parsedAmount = parseUnits(amount, decimals);
    
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, parsedAmount],
    });
  };

  const approveMax = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`
  ) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, CONTRACT_CONFIG.MAX_UINT256],
    });
  };

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for wrapper contract deposits
export function useWrapperDeposit() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number
  ) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const parsedAmount = parseUnits(amount, tokenDecimals);
    const wrapperAddress = CONTRACT_ADDRESSES[chainId].WRAPPER;
    
    writeContract({
      address: wrapperAddress,
      abi: SOVABTC_WRAPPER_ABI,
      functionName: 'deposit',
      args: [tokenAddress, parsedAmount],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Combined hook for the full deposit workflow (approval + deposit)
export function useDepositWorkflow() {
  const chainId = useChainId();
  const approval = useTokenApproval();
  const deposit = useWrapperDeposit();

  const executeDeposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    decimals: number,
    useMaxApproval: boolean = false
  ) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const wrapperAddress = CONTRACT_ADDRESSES[chainId].WRAPPER;
    
    // Step 1: Approve if needed
    if (useMaxApproval) {
      await approval.approveMax(tokenAddress, wrapperAddress);
    } else {
      await approval.approve(tokenAddress, wrapperAddress, amount, decimals);
    }

    // Wait for approval to complete
    if (approval.isSuccess) {
      // Step 2: Execute deposit
      await deposit.deposit(tokenAddress, amount, decimals);
    }
  };

  return {
    executeDeposit,
    approval,
    deposit,
    isExecuting: approval.isPending || approval.isConfirming || deposit.isPending || deposit.isConfirming,
    currentStep: approval.isPending || approval.isConfirming ? 'approving' : 
                 deposit.isPending || deposit.isConfirming ? 'depositing' : 
                 'idle',
  };
}

// Hook for deposit validation and preparation
export function useDepositPreparation(
  tokenAddress: `0x${string}` | undefined,
  amount: string,
  decimals: number
) {
  const chainId = useChainId();
  
  if (!isSupportedChain(chainId) || !tokenAddress || !amount || amount === '0') {
    return {
      isValid: false,
      needsApproval: false,
      parsedAmount: BigInt(0),
      approvalCheck: null,
    };
  }

  const parsedAmount = parseUnits(amount, decimals);
  const approvalCheck = useDepositApprovalCheck(tokenAddress, parsedAmount);

  return {
    isValid: true,
    needsApproval: approvalCheck.needsApproval,
    parsedAmount,
    approvalCheck,
  };
}

// Hook for WBTC deposit specifically
export function useWBTCDeposit() {
  const chainId = useChainId();
  const depositWorkflow = useDepositWorkflow();
  
  const depositWBTC = async (amount: string, useMaxApproval: boolean = false) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const wbtcAddress = CONTRACT_ADDRESSES[chainId].WBTC_TEST;
    await depositWorkflow.executeDeposit(wbtcAddress, amount, 8, useMaxApproval);
  };

  return {
    depositWBTC,
    ...depositWorkflow,
  };
}

// Hook for LBTC deposit specifically
export function useLBTCDeposit() {
  const chainId = useChainId();
  const depositWorkflow = useDepositWorkflow();
  
  const depositLBTC = async (amount: string, useMaxApproval: boolean = false) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const lbtcAddress = CONTRACT_ADDRESSES[chainId].LBTC_TEST;
    await depositWorkflow.executeDeposit(lbtcAddress, amount, 8, useMaxApproval);
  };

  return {
    depositLBTC,
    ...depositWorkflow,
  };
}

// Hook for USDC deposit specifically  
export function useUSDCDeposit() {
  const chainId = useChainId();
  const depositWorkflow = useDepositWorkflow();
  
  const depositUSDC = async (amount: string, useMaxApproval: boolean = false) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const usdcAddress = CONTRACT_ADDRESSES[chainId].USDC_TEST;
    await depositWorkflow.executeDeposit(usdcAddress, amount, 6, useMaxApproval);
  };

  return {
    depositUSDC,
    ...depositWorkflow,
  };
}

// Hook for deposit transaction status
export function useDepositStatus(depositHash: `0x${string}` | undefined) {
  const { isLoading: isConfirming, isSuccess, error } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  return {
    isConfirming,
    isSuccess,
    error,
    status: isConfirming ? 'confirming' : isSuccess ? 'success' : error ? 'error' : 'idle',
  };
} 