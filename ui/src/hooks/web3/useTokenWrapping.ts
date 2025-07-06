import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { SovaBTCWrapperABI } from '@/contracts/abis';
import { ADDRESSES } from '@/contracts/addresses';
import { type Address, parseUnits, formatUnits, erc20Abi } from 'viem';
import { useState, useMemo, useEffect } from 'react';

interface UseTokenWrappingProps {
  userAddress: Address | undefined;
}

export function useTokenWrapping({ userAddress }: UseTokenWrappingProps) {
  const [lastApprovalHash, setLastApprovalHash] = useState<Address | undefined>();
  const [lastWrapHash, setLastWrapHash] = useState<Address | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'wrapping'>('idle');

  // Get public client for manual contract calls
  const publicClient = usePublicClient();

  // Write contract for approval
  const {
    writeContract: approve,
    data: approvalHash,
    error: approvalError,
    isPending: isApproving,
  } = useWriteContract();

  // Write contract for wrapping
  const {
    writeContract: wrapToken,
    data: wrapHash,
    error: wrapError,
    isPending: isWrapping,
  } = useWriteContract();

  // Wait for approval confirmation
  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalConfirmed,
    error: approvalConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastApprovalHash,
  });

  // Wait for wrap confirmation
  const {
    isLoading: isConfirmingWrap,
    isSuccess: isWrapConfirmed,
    error: wrapConfirmError,
  } = useWaitForTransactionReceipt({
    hash: lastWrapHash,
  });

  // Get minimum deposit amount (in satoshis)
  const {
    data: minimumDepositSatoshi,
    isLoading: isLoadingMinDeposit,
  } = useReadContract({
    address: ADDRESSES.WRAPPER,
    abi: SovaBTCWrapperABI,
    functionName: 'minDepositSatoshi',
    query: {
      enabled: true,
    },
  });

  // Check current allowance for a token
  const useTokenAllowance = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: userAddress && tokenAddress ? [userAddress, ADDRESSES.WRAPPER] : undefined,
      query: {
        enabled: Boolean(userAddress && tokenAddress),
        refetchInterval: 5000, // Refetch every 5 seconds
      },
    });
  };

  // Get token decimals
  const useTokenDecimals = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
      args: [],
      query: {
        enabled: Boolean(tokenAddress),
      },
    });
  };

  // Use contract's previewDeposit function for accurate estimation
  const usePreviewDeposit = (tokenAddress: Address | undefined, tokenAmount: bigint) => {
    return useReadContract({
      address: ADDRESSES.WRAPPER,
      abi: SovaBTCWrapperABI,
      functionName: 'previewDeposit',
      args: tokenAddress && tokenAmount > 0n ? [tokenAddress, tokenAmount] : undefined,
      query: {
        enabled: Boolean(tokenAddress && tokenAmount > 0n),
      },
    });
  };

  // 🎯 KEY FIX: Convert token amounts to satoshis for contract
  const convertToSatoshis = (tokenAmount: bigint, tokenDecimals: number): bigint => {
    console.log('🔄 CONVERTING TO SATOSHIS:', {
      tokenAmount: tokenAmount.toString(),
      tokenDecimals,
      step: 'converting for contract'
    });

    let satoshiAmount: bigint;
    
    if (tokenDecimals === 8) {
      // For 8-decimal tokens (WBTC, LBTC), 1:1 conversion
      satoshiAmount = tokenAmount;
    } else if (tokenDecimals < 8) {
      // For tokens with fewer decimals, scale up
      satoshiAmount = tokenAmount * (10n ** BigInt(8 - tokenDecimals));
    } else {
      // For tokens with more decimals, scale down
      const divisor = 10n ** BigInt(tokenDecimals - 8);
      satoshiAmount = tokenAmount / divisor;
    }

    console.log('✅ SATOSHI CONVERSION RESULT:', {
      tokenAmount: tokenAmount.toString(),
      tokenDecimals,
      satoshiAmount: satoshiAmount.toString(),
      conversion: `${tokenAmount.toString()} (${tokenDecimals} decimals) → ${satoshiAmount.toString()} satoshis`
    });

    return satoshiAmount;
  };

  const executeApproval = async (tokenAddress: Address, amount: bigint) => {
    try {
      setCurrentStep('approving');
      console.log('🔐 EXECUTING APPROVAL:', {
        tokenAddress,
        tokenAmount: amount.toString(),
        note: 'Approving token amount (NOT satoshis)'
      });
      
      await approve({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [ADDRESSES.WRAPPER, amount],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('Approval failed:', error);
      throw error;
    }
  };

  const executeWrap = async (tokenAddress: Address, tokenAmount: bigint, tokenDecimals: number) => {
    try {
      setCurrentStep('wrapping');
      
      // 🎯 KEY FIX: Convert token amount to satoshis for contract
      const satoshiAmount = convertToSatoshis(tokenAmount, tokenDecimals);
      
      console.log('📡 EXECUTING CONTRACT CALL (FIXED):', {
        contractAddress: ADDRESSES.WRAPPER,
        function: 'deposit',
        tokenAddress,
        originalTokenAmount: tokenAmount.toString(),
        convertedSatoshiAmount: satoshiAmount.toString(),
        tokenDecimals,
        aboutToCall: `deposit(${tokenAddress}, ${satoshiAmount.toString()}) // SATOSHIS`
      });
      
      await wrapToken({
        address: ADDRESSES.WRAPPER,
        abi: SovaBTCWrapperABI,
        functionName: 'deposit',
        args: [tokenAddress, satoshiAmount], // 🎯 SEND SATOSHIS TO CONTRACT
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('❌ CONTRACT CALL FAILED:', error);
      throw error;
    }
  };

  // Combined function to handle approval + wrapping (UPDATED FOR SATOSHIS)
  const executeWrapWithApproval = async (
    tokenAddress: Address, 
    tokenAmount: bigint,
    tokenDecimals: number,
    currentAllowance: bigint = 0n,
    forceApproval: boolean = false
  ) => {
    try {
      // Check if approval is needed OR if forced (approval is for TOKEN amount, not satoshis)
      if (currentAllowance < tokenAmount || forceApproval) {
        if (forceApproval) {
          console.log('🔄 FORCING FRESH APPROVAL (bypassing allowance check)...', {
            tokenAddress,
            tokenAmount: tokenAmount.toString(),
            currentAllowance: currentAllowance.toString(),
            reason: 'Force approval requested'
          });
        } else {
          console.log('Insufficient allowance, requesting approval...', {
            tokenAddress,
            tokenAmount: tokenAmount.toString(),
            currentAllowance: currentAllowance.toString(),
          });
        }
        
        // Approve 2x the TOKEN amount to avoid future issues
        const approvalAmount = tokenAmount * 2n;
        await executeApproval(tokenAddress, approvalAmount);
        // The wrap will be triggered automatically when approval confirms
      } else {
        console.log('Sufficient allowance, proceeding to wrap...', {
          tokenAddress,
          tokenAmount: tokenAmount.toString(),
          currentAllowance: currentAllowance.toString(),
        });
        
        // CRITICAL: Double-check allowance right before wrap transaction
        console.log('🔍 FINAL ALLOWANCE CHECK BEFORE WRAP...');
        try {
          // Manual allowance check using the same contract call
          if (!publicClient) {
            console.warn('⚠️ Public client not available, skipping final allowance check');
          } else {
            const finalAllowanceCheck = await publicClient.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [userAddress!, ADDRESSES.WRAPPER],
            });
            
            console.log('📊 FINAL ALLOWANCE VERIFICATION:', {
              userAddress,
              tokenAddress,
              spenderAddress: ADDRESSES.WRAPPER,
              requestedTokenAmount: tokenAmount.toString(),
              actualAllowance: finalAllowanceCheck.toString(),
              isAllowanceSufficient: finalAllowanceCheck >= tokenAmount,
              difference: (finalAllowanceCheck - tokenAmount).toString(),
            });
            
            if (finalAllowanceCheck < tokenAmount) {
              console.error('❌ ALLOWANCE INSUFFICIENT AT FINAL CHECK!');
              console.error('This indicates a race condition or stale data issue.');
              console.error('Attempting emergency approval...');
              
              // Emergency approval
              await executeApproval(tokenAddress, tokenAmount * 2n); // Approve 2x the amount
              return; // Exit and let the approval flow handle the wrap
            }
          }
          
        } catch (allowanceCheckError) {
          console.error('❌ FAILED TO CHECK FINAL ALLOWANCE:', allowanceCheckError);
          // Proceed anyway but log the issue
        }
        
        await executeWrap(tokenAddress, tokenAmount, tokenDecimals);
      }
    } catch (error) {
      setCurrentStep('idle');
      throw error;
    }
  };

  // Track approval hash changes
  useEffect(() => {
    if (approvalHash && approvalHash !== lastApprovalHash) {
      setLastApprovalHash(approvalHash);
    }
  }, [approvalHash, lastApprovalHash]);

  // Track wrap hash changes
  useEffect(() => {
    if (wrapHash && wrapHash !== lastWrapHash) {
      setLastWrapHash(wrapHash);
    }
  }, [wrapHash, lastWrapHash]);

  // Auto-proceed to wrap after approval confirms
  useEffect(() => {
    if (isApprovalConfirmed && currentStep === 'approving') {
      setCurrentStep('idle'); // Reset step so next wrap can proceed
    }
  }, [isApprovalConfirmed, currentStep]);

  // Reset step when wrap confirms
  useEffect(() => {
    if (isWrapConfirmed) {
      setCurrentStep('idle');
    }
  }, [isWrapConfirmed]);

  // Updated estimate output using contract's preview function
  const estimateOutput = (inputAmount: bigint, inputDecimals: number): bigint => {
    console.log('💰 ESTIMATING OUTPUT (UPDATED):', {
      inputAmount: inputAmount.toString(),
      inputDecimals,
      step: 'calculating sovaBTC output using satoshi conversion'
    });
    
    // Convert to satoshis first, then estimate 1:1 sovaBTC
    const satoshiAmount = convertToSatoshis(inputAmount, inputDecimals);
    
    console.log('✅ OUTPUT ESTIMATION RESULT (UPDATED):', {
      inputAmount: inputAmount.toString(),
      inputDecimals,
      satoshiAmount: satoshiAmount.toString(),
      outputSovaBTC: satoshiAmount.toString(),
      conversion: `${inputAmount.toString()} (${inputDecimals} decimals) → ${satoshiAmount.toString()} satoshis → ${satoshiAmount.toString()} sovaBTC`
    });
    
    return satoshiAmount; // sovaBTC output = satoshis (8 decimals)
  };

  // Validate wrap parameters (UPDATED FOR SATOSHIS)
  const validateWrap = useMemo(() => {
    return (tokenAddress: Address, tokenAmount: bigint, tokenDecimals: number) => {
      if (!userAddress) {
        return { isValid: false, error: 'Wallet not connected' };
      }
      
      if (tokenAmount <= 0n) {
        return { isValid: false, error: 'Amount must be greater than 0' };
      }
      
      // Convert to satoshis for minimum check
      const satoshiAmount = convertToSatoshis(tokenAmount, tokenDecimals);
      
      if (minimumDepositSatoshi && typeof minimumDepositSatoshi === 'bigint' && satoshiAmount < minimumDepositSatoshi) {
        return { 
          isValid: false, 
          error: `Amount below minimum deposit of ${formatUnits(minimumDepositSatoshi, 8)} BTC` 
        };
      }
      
      return { isValid: true, error: null };
    };
  }, [userAddress, minimumDepositSatoshi]);

  // Get overall status
  const getOverallStatus = () => {
    if (currentStep === 'approving' || isApproving || isConfirmingApproval) return 'approving';
    if (currentStep === 'wrapping' || isWrapping || isConfirmingWrap) return 'wrapping';
    if (isWrapConfirmed) return 'confirmed';
    if (approvalError || wrapError || approvalConfirmError || wrapConfirmError) return 'error';
    return 'idle';
  };

  return {
    // Actions
    executeWrap,
    executeApproval,
    executeWrapWithApproval, // Main function to use (UPDATED SIGNATURE)
    validateWrap,
    estimateOutput,
    useTokenAllowance, // Hook to check allowance
    useTokenDecimals, // Hook to get token decimals
    usePreviewDeposit, // Hook to preview deposit using contract
    convertToSatoshis, // Utility function
    
    // State
    minimumDeposit: minimumDepositSatoshi as bigint | undefined,
    isLoadingMinDeposit,
    currentStep,
    
    // Transaction status
    overallStatus: getOverallStatus(),
    isApproving: currentStep === 'approving' || isApproving || isConfirmingApproval,
    isWrapping: currentStep === 'wrapping' || isWrapping || isConfirmingWrap,
    isApprovalConfirmed,
    isWrapConfirmed,
    
    // Errors
    error: approvalError || wrapError || approvalConfirmError || wrapConfirmError,
    
    // Transaction hashes
    approvalHash: lastApprovalHash,
    wrapHash: lastWrapHash,
    
    // Emergency function for troubleshooting (UPDATED SIGNATURE)
    executeWrapWithForceApproval: (tokenAddress: Address, tokenAmount: bigint, tokenDecimals: number, currentAllowance: bigint = 0n) => 
      executeWrapWithApproval(tokenAddress, tokenAmount, tokenDecimals, currentAllowance, true),
  };
} 