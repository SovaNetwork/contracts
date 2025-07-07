import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { SovaBTCWrapperABI } from '@/contracts/abis';
import { useActiveNetwork } from './useActiveNetwork';
import { type Address, parseUnits, formatUnits, erc20Abi } from 'viem';
import { useState, useMemo, useEffect } from 'react';

interface UseTokenWrappingProps {
  userAddress: Address | undefined;
}

export function useTokenWrapping({ userAddress }: UseTokenWrappingProps) {
  const [lastApprovalHash, setLastApprovalHash] = useState<Address | undefined>();
  const [lastWrapHash, setLastWrapHash] = useState<Address | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'wrapping'>('idle');

  // Get network-aware contract addresses
  const { getContractAddress } = useActiveNetwork();
  const wrapperAddress = getContractAddress('wrapper');
  const sovaBTCAddress = getContractAddress('sovaBTC');

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
    address: wrapperAddress,
    abi: SovaBTCWrapperABI,
    functionName: 'minDepositSatoshi',
    query: {
      enabled: Boolean(wrapperAddress),
    },
  });

  // Check current allowance for a token
  const useTokenAllowance = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: userAddress && tokenAddress && wrapperAddress ? [userAddress, wrapperAddress] : undefined,
      query: {
        enabled: Boolean(userAddress && tokenAddress && wrapperAddress),
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
      address: wrapperAddress,
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

  // Execute approval for a token
  const executeApproval = async (tokenAddress: Address, amount: bigint) => {
    try {
      if (!wrapperAddress) {
        throw new Error('Wrapper contract address not found for current network');
      }

      setCurrentStep('approving');
      
      console.log('🔑 EXECUTING APPROVAL:', {
        tokenAddress,
        spenderAddress: wrapperAddress,
        amount: amount.toString(),
      });
      
      await approve({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [wrapperAddress, amount],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('❌ APPROVAL FAILED:', error);
      throw error;
    }
  };

  // Execute wrap with automatic approval if needed (FIXED DECIMAL HANDLING)
  const executeWrapWithApproval = async (
    tokenAddress: Address, 
    tokenAmount: bigint, 
    tokenDecimals: number,
    currentAllowance: bigint
  ) => {
    try {
      if (!wrapperAddress || !sovaBTCAddress) {
        throw new Error('Contract addresses not found for current network');
      }

      const satoshiAmount = convertToSatoshis(tokenAmount, tokenDecimals);
      
      console.log('🚀 STARTING WRAP WITH APPROVAL (NETWORK-AWARE):', {
        network: 'Current Network',
        wrapperAddress,
        sovaBTCAddress,
        tokenAddress,
        tokenAmount: tokenAmount.toString(),
        satoshiAmount: satoshiAmount.toString(),
        currentAllowance: currentAllowance.toString(),
      });
      
      // Check if approval is needed
      if (currentAllowance < tokenAmount) {
        console.log('🔑 APPROVAL NEEDED');
        await executeApproval(tokenAddress, tokenAmount);
        // Don't proceed to wrap here - wait for user to click wrap again after approval
        return;
      }
      
      // Proceed with wrap
      setCurrentStep('wrapping');
      
      console.log('📡 EXECUTING CONTRACT CALL (FIXED):', {
        contractAddress: wrapperAddress,
        function: 'deposit',
        tokenAddress,
        tokenAmount: tokenAmount.toString(),
        expectedSatoshis: satoshiAmount.toString(),
      });
      
      await wrapToken({
        address: wrapperAddress,
        abi: SovaBTCWrapperABI,
        functionName: 'deposit',
        args: [tokenAddress, tokenAmount],
      });
    } catch (error) {
      setCurrentStep('idle');
      console.error('❌ WRAP WITH APPROVAL FAILED:', error);
      throw error;
    }
  };

  // Execute wrap with forced approval (for debugging)
  const executeWrapWithForceApproval = async (
    tokenAddress: Address, 
    tokenAmount: bigint, 
    tokenDecimals: number,
    currentAllowance: bigint
  ) => {
    try {
      if (!wrapperAddress || !userAddress) {
        throw new Error('Required addresses not found for current network');
      }

      console.log('🚨 FORCE APPROVAL MODE (NETWORK-AWARE):', {
        wrapperAddress,
        step1: 'Checking current allowance',
        step2: 'Forcing new approval',
        step3: 'Executing wrap'
      });

      // Step 1: Check current allowance via direct call
      if (publicClient) {
        const currentActualAllowance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress!, wrapperAddress],
        });
        
        console.log('📊 FINAL ALLOWANCE VERIFICATION:', {
          userAddress,
          tokenAddress,
          spenderAddress: wrapperAddress,
          requestedTokenAmount: tokenAmount.toString(),
          actualAllowance: currentActualAllowance.toString(),
          isAllowanceSufficient: currentActualAllowance >= tokenAmount,
          difference: (currentActualAllowance - tokenAmount).toString(),
        });
        
        if (currentActualAllowance < tokenAmount) {
          console.error('❌ ALLOWANCE INSUFFICIENT AT FINAL CHECK!');
          console.error('This indicates a race condition or stale data issue.');
          console.error('Attempting emergency approval...');
          
          // Emergency approval
          await executeApproval(tokenAddress, tokenAmount * 2n); // Approve 2x the amount
          return; // Exit and let the approval flow handle the wrap
        }
      } else {
        console.warn('⚠️ Public client not available, skipping final allowance check');
      }
      
      await executeWrapWithApproval(tokenAddress, tokenAmount, tokenDecimals, currentAllowance);
    } catch (error) {
      setCurrentStep('idle');
      console.error('❌ WRAP WITH FORCE APPROVAL FAILED:', error);
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

  const overallStatus = getOverallStatus();
  const combinedError = approvalError || wrapError || approvalConfirmError || wrapConfirmError;

  return {
    // Main functions
    executeApproval,
    executeWrapWithApproval, // Main function to use (UPDATED SIGNATURE)
    executeWrapWithForceApproval, // Emergency function for troubleshooting (UPDATED SIGNATURE)
    validateWrap,
    estimateOutput,
    convertToSatoshis,
    
    // State
    overallStatus,
    isApproving,
    isWrapping,
    isApprovalConfirmed,
    isWrapConfirmed,
    error: combinedError,
    
    // Hooks
    useTokenAllowance,
    usePreviewDeposit,
    minimumDeposit: minimumDepositSatoshi,
    
    // Raw data for debugging
    approvalHash: lastApprovalHash,
    wrapHash: lastWrapHash,
  };
} 