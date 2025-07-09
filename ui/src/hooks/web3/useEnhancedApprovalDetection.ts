'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useGasPrice, useEstimateGas, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, formatUnits, parseUnits, erc20Abi, maxUint256, encodeFunctionData } from 'viem';
import { useActiveNetwork } from './useActiveNetwork';

export type ApprovalStrategy = 'exact' | 'optimized' | 'infinite';

export interface ApprovalStatus {
  isRequired: boolean;
  currentAllowance: bigint;
  requiredAmount: bigint;
  recommendedStrategy: ApprovalStrategy;
  gasEstimate: bigint;
  securityRisk: 'low' | 'medium' | 'high';
  message: string;
}

export interface ApprovalOption {
  strategy: ApprovalStrategy;
  amount: bigint;
  label: string;
  description: string;
  gasEstimate: bigint;
  securityRisk: 'low' | 'medium' | 'high';
  recommended: boolean;
}

interface UseEnhancedApprovalDetectionProps {
  tokenAddress: Address | undefined;
  spenderAddress: Address | undefined;
  requiredAmount: bigint;
  userAddress: Address | undefined;
}

export function useEnhancedApprovalDetection({
  tokenAddress,
  spenderAddress,
  requiredAmount,
  userAddress,
}: UseEnhancedApprovalDetectionProps) {
  const { getContractAddress } = useActiveNetwork();
  const { data: gasPrice } = useGasPrice();
  
  // State for approval management
  const [selectedStrategy, setSelectedStrategy] = useState<ApprovalStrategy>('optimized');
  const [lastApprovalHash, setLastApprovalHash] = useState<Address | undefined>();
  const [approvalInProgress, setApprovalInProgress] = useState(false);

  // Get current token allowance
  const { 
    data: currentAllowance, 
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance 
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && tokenAddress && spenderAddress),
      refetchInterval: 5000, // Check every 5 seconds
    },
  });

  // Get token symbol for display
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  // Get token decimals for calculations
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  // Approval transaction handling
  const {
    writeContract: executeApproval,
    data: approvalHash,
    error: approvalError,
    isPending: isApproving,
  } = useWriteContract();

  // Wait for approval confirmation
  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalConfirmed,
    error: approvalConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastApprovalHash,
  });

  // Calculate approval amounts for different strategies
  const approvalAmounts = useMemo(() => {
    if (!requiredAmount || requiredAmount <= 0n) {
      return {
        exact: 0n,
        optimized: 0n,
        infinite: maxUint256,
      };
    }

    // Exact: Just what's needed
    const exact = requiredAmount;
    
    // Optimized: 150% of required amount to allow for some future transactions
    const optimized = (requiredAmount * 150n) / 100n;
    
    // Infinite: Maximum possible allowance
    const infinite = maxUint256;

    return { exact, optimized, infinite };
  }, [requiredAmount]);

  // Estimate gas for different approval strategies
  const { data: exactGasEstimate } = useEstimateGas({
    to: tokenAddress,
    data: tokenAddress && spenderAddress ? 
      encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, approvalAmounts.exact],
      }) : undefined,
    query: {
      enabled: Boolean(tokenAddress && spenderAddress && approvalAmounts.exact > 0n),
    },
  });

  const { data: optimizedGasEstimate } = useEstimateGas({
    to: tokenAddress,
    data: tokenAddress && spenderAddress ?
      encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, approvalAmounts.optimized],
      }) : undefined,
    query: {
      enabled: Boolean(tokenAddress && spenderAddress && approvalAmounts.optimized > 0n),
    },
  });

  const { data: infiniteGasEstimate } = useEstimateGas({
    to: tokenAddress,
    data: tokenAddress && spenderAddress ?
      encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, approvalAmounts.infinite],
      }) : undefined,
    query: {
      enabled: Boolean(tokenAddress && spenderAddress),
    },
  });

  // Generate approval options with gas estimates
  const approvalOptions = useMemo((): ApprovalOption[] => {
    const options: ApprovalOption[] = [];

    if (!tokenDecimals || !tokenSymbol) return options;

    const decimals = Number(tokenDecimals);

    // Exact approval
    options.push({
      strategy: 'exact',
      amount: approvalAmounts.exact,
      label: 'Exact Amount',
      description: `Approve exactly ${formatUnits(approvalAmounts.exact, decimals)} ${tokenSymbol}`,
      gasEstimate: exactGasEstimate || 50000n,
      securityRisk: 'low',
      recommended: false,
    });

    // Optimized approval
    options.push({
      strategy: 'optimized',
      amount: approvalAmounts.optimized,
      label: 'Optimized',
      description: `Approve ${formatUnits(approvalAmounts.optimized, decimals)} ${tokenSymbol} (150% of needed)`,
      gasEstimate: optimizedGasEstimate || 50000n,
      securityRisk: 'low',
      recommended: true,
    });

    // Infinite approval
    options.push({
      strategy: 'infinite',
      amount: approvalAmounts.infinite,
      label: 'Unlimited',
      description: `Approve unlimited ${tokenSymbol} (no future approvals needed)`,
      gasEstimate: infiniteGasEstimate || 50000n,
      securityRisk: 'high',
      recommended: false,
    });

    return options;
  }, [
    approvalAmounts,
    tokenDecimals,
    tokenSymbol,
    exactGasEstimate,
    optimizedGasEstimate,
    infiniteGasEstimate,
  ]);

  // Determine approval status and recommendations
  const approvalStatus = useMemo((): ApprovalStatus => {
    if (!currentAllowance || !requiredAmount || !tokenDecimals) {
      return {
        isRequired: false,
        currentAllowance: 0n,
        requiredAmount: 0n,
        recommendedStrategy: 'optimized',
        gasEstimate: 50000n,
        securityRisk: 'low',
        message: 'Loading approval status...',
      };
    }

    const decimals = Number(tokenDecimals);
    const isRequired = currentAllowance < requiredAmount;
    const gasEstimate = optimizedGasEstimate || 50000n;

    if (!isRequired) {
      return {
        isRequired: false,
        currentAllowance,
        requiredAmount,
        recommendedStrategy: 'optimized',
        gasEstimate,
        securityRisk: 'low',
        message: `You have sufficient ${tokenSymbol} approval`,
      };
    }

    // Determine recommended strategy based on amount and gas costs
    let recommendedStrategy: ApprovalStrategy = 'optimized';
    let securityRisk: 'low' | 'medium' | 'high' = 'low';

    // If the required amount is very large, suggest exact approval
    if (requiredAmount > parseUnits('10000', decimals)) {
      recommendedStrategy = 'exact';
      securityRisk = 'low';
    }

    // If gas prices are high, suggest infinite to save future gas
    if (gasPrice && gasPrice > parseUnits('50', 'gwei')) {
      recommendedStrategy = 'infinite';
      securityRisk = 'high';
    }

    return {
      isRequired: true,
      currentAllowance,
      requiredAmount,
      recommendedStrategy,
      gasEstimate,
      securityRisk,
      message: `Approval needed for ${formatUnits(requiredAmount, decimals)} ${tokenSymbol}`,
    };
  }, [currentAllowance, requiredAmount, tokenDecimals, tokenSymbol, optimizedGasEstimate, gasPrice]);

  // Execute approval with selected strategy
  const executeApprovalWithStrategy = async (strategy: ApprovalStrategy = selectedStrategy) => {
    if (!tokenAddress || !spenderAddress || !userAddress) {
      throw new Error('Missing required addresses for approval');
    }

    const amount = approvalAmounts[strategy];
    setApprovalInProgress(true);

    try {
      console.log('🔐 EXECUTING ENHANCED APPROVAL:', {
        strategy,
        tokenAddress,
        spenderAddress,
        amount: amount.toString(),
        userAddress,
      });

      await executeApproval({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount],
      });

      return true;
    } catch (error) {
      console.error('❌ ENHANCED APPROVAL FAILED:', error);
      setApprovalInProgress(false);
      throw error;
    }
  };

  // Reset approval to zero (revoke approval)
  const revokeApproval = async () => {
    if (!tokenAddress || !spenderAddress || !userAddress) {
      throw new Error('Missing required addresses for revocation');
    }

    setApprovalInProgress(true);

    try {
      await executeApproval({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, 0n],
      });

      return true;
    } catch (error) {
      console.error('❌ APPROVAL REVOCATION FAILED:', error);
      setApprovalInProgress(false);
      throw error;
    }
  };

  // Check if approval is sufficient for a specific amount
  const isApprovalSufficient = (amount: bigint): boolean => {
    if (!currentAllowance) return false;
    return currentAllowance >= amount;
  };

  // Get approval progress for UI
  const getApprovalProgress = () => {
    if (!currentAllowance || !requiredAmount) return 0;
    if (currentAllowance >= requiredAmount) return 100;
    return Number((currentAllowance * 100n) / requiredAmount);
  };

  // Handle approval hash changes
  useEffect(() => {
    if (approvalHash && approvalHash !== lastApprovalHash) {
      setLastApprovalHash(approvalHash);
    }
  }, [approvalHash, lastApprovalHash]);

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed) {
      setApprovalInProgress(false);
      // Refresh allowance after confirmation
      setTimeout(() => {
        refetchAllowance();
      }, 1000);
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError || approvalConfirmError) {
      setApprovalInProgress(false);
    }
  }, [approvalError, approvalConfirmError]);

  // Calculate cost comparison
  const costComparison = useMemo(() => {
    if (!gasPrice) return null;

    const costs = approvalOptions.map(option => ({
      strategy: option.strategy,
      gasCost: option.gasEstimate * gasPrice,
      label: option.label,
    }));

    return costs.sort((a, b) => Number(a.gasCost - b.gasCost));
  }, [approvalOptions, gasPrice]);

  return {
    // Status and detection
    approvalStatus,
    approvalOptions,
    isApprovalRequired: approvalStatus.isRequired,
    isApprovalSufficient,
    getApprovalProgress,
    
    // Strategy selection
    selectedStrategy,
    setSelectedStrategy,
    
    // Execution
    executeApprovalWithStrategy,
    revokeApproval,
    
    // State tracking
    isApproving: isApproving || approvalInProgress,
    isConfirming: isConfirmingApproval,
    isConfirmed: isApprovalConfirmed,
    
    // Data
    currentAllowance: currentAllowance || 0n,
    requiredAmount,
    tokenSymbol,
    tokenDecimals: tokenDecimals ? Number(tokenDecimals) : undefined,
    approvalHash: lastApprovalHash,
    
    // Utilities
    costComparison,
    error: approvalError || approvalConfirmError,
    refetchAllowance,
  };
} 