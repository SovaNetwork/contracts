'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { getChainConfig, getLayerZeroEid } from '@/contracts/addresses';
import { SovaBTCOFTABI } from '@/contracts/abis';

// Types for LayerZero OFT
export type SendParam = {
  dstEid: number;
  to: `0x${string}`;
  amountLD: bigint;
  minAmountLD: bigint;
  extraOptions: `0x${string}`;
  composeMsg: `0x${string}`;
};

export type MessagingFee = {
  nativeFee: bigint;
  lzTokenFee: bigint;
};

export type BridgeTransactionParams = {
  sourceChainId: number;
  destinationChainId: number;
  amount: bigint;
  recipient: `0x${string}`;
  extraOptions?: `0x${string}`;
};

export function useBridgeTransaction() {
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<MessagingFee | null>(null);
  const [bridgeHash, setBridgeHash] = useState<`0x${string}` | null>(null);

  const publicClient = usePublicClient();
  
  const {
    writeContract: writeBridge,
    data: writeData,
    error: writeError,
    isPending: isBridging
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Quote fees for cross-chain transfer using REAL LayerZero quoteSend
  const quoteFee = useCallback(async (params: BridgeTransactionParams): Promise<MessagingFee> => {
    const sourceChainConfig = getChainConfig(params.sourceChainId);
    const sovaBTCOFTAddress = sourceChainConfig?.contracts.sovaBTC;
    
    if (!sovaBTCOFTAddress) {
      throw new Error('SovaBTC OFT contract address not found for source network');
    }

    const destinationEid = getLayerZeroEid(params.destinationChainId);
    if (!destinationEid) {
      throw new Error(`LayerZero EID not found for chain ${params.destinationChainId}`);
    }

    setIsQuoting(true);
    setBridgeError(null);

    try {
      // Convert address to bytes32 for LayerZero
      const recipientBytes32 = `0x${params.recipient.slice(2).padStart(64, '0')}` as `0x${string}`;

      const sendParam: SendParam = {
        dstEid: destinationEid,
        to: recipientBytes32,
        amountLD: params.amount,
        minAmountLD: params.amount, // No slippage for exact transfers
        extraOptions: params.extraOptions || '0x',
        composeMsg: '0x',
      };

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Use real LayerZero quoteSend function
      const fee = await publicClient.readContract({
        address: sovaBTCOFTAddress,
        abi: SovaBTCOFTABI,
        functionName: 'quoteSend',
        args: [sendParam, false], // false = pay in native token
      }) as MessagingFee;

      if (!fee) {
        throw new Error('Failed to get fee quote from LayerZero');
      }

      setCurrentQuote(fee);
      return fee;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to quote bridge fees';
      setBridgeError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsQuoting(false);
    }
  }, [publicClient]);

  // Execute cross-chain bridge transaction
  const executeBridge = useCallback(async (params: BridgeTransactionParams) => {
    const sourceChainConfig = getChainConfig(params.sourceChainId);
    const sovaBTCOFTAddress = sourceChainConfig?.contracts.sovaBTC;
    
    if (!sovaBTCOFTAddress) {
      throw new Error('SovaBTC OFT contract address not found for source network');
    }

    setBridgeError(null);
    setBridgeHash(null);

    try {
      // Get REAL fee quote first
      const messagingFee = await quoteFee(params);
      
      const destinationEid = getLayerZeroEid(params.destinationChainId);
      if (!destinationEid) {
        throw new Error(`LayerZero EID not found for chain ${params.destinationChainId}`);
      }

      // Convert address to bytes32
      const recipientBytes32 = `0x${params.recipient.slice(2).padStart(64, '0')}` as `0x${string}`;

      const sendParam: SendParam = {
        dstEid: destinationEid,
        to: recipientBytes32,
        amountLD: params.amount,
        minAmountLD: params.amount,
        extraOptions: params.extraOptions || '0x',
        composeMsg: '0x',
      };

      // Execute the bridge transaction
      writeBridge({
        address: sovaBTCOFTAddress,
        abi: SovaBTCOFTABI,
        functionName: 'send',
        args: [sendParam, messagingFee, params.recipient],
        value: messagingFee.nativeFee,
      });

      setBridgeHash(writeData || null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bridge transaction failed';
      setBridgeError(errorMessage);
      throw error;
    }
  }, [quoteFee, writeBridge, writeData]);

  return {
    // Transaction states
    isBridging,
    isConfirming,
    isConfirmed,
    bridgeHash: writeData,
    bridgeError: bridgeError || (writeError?.message),
    
    // Fee quoting
    isQuoting,
    currentQuote,
    quoteFee,
    
    // Bridge execution
    executeBridge,
    
    // Reset function
    resetBridge: () => {
      setBridgeError(null);
      setBridgeHash(null);
      setCurrentQuote(null);
    }
  };
} 