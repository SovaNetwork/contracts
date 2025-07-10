'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import { useActiveNetwork } from './useActiveNetwork';
import { getContractAddresses } from '@/contracts/abis';
import { TokenWhitelistABI } from '@/contracts/abis';
import { useAccount } from 'wagmi';
import React from 'react'; // Added missing import for React

export interface WhitelistOwnership {
  currentOwner: Address | null;
  isCurrentUserOwner: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Transfer ownership functions
  transferOwnership: (newOwner: Address) => Promise<void>;
  isTransferring: boolean;
  transferHash: string | null;
  transferSuccess: boolean;
}

export function useWhitelistOwnership(): WhitelistOwnership {
  const { address } = useAccount();
  const { activeChainId } = useActiveNetwork();
  const contractAddresses = getContractAddresses(activeChainId);
  const tokenWhitelistAddress = contractAddresses.tokenWhitelist;

  // Read current owner
  const { 
    data: currentOwner, 
    isLoading, 
    error: readError,
    refetch: refetchOwner 
  } = useReadContract({
    address: tokenWhitelistAddress,
    abi: TokenWhitelistABI,
    functionName: 'owner',
  });

  // Transfer ownership transaction
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if current user is owner
  const isCurrentUserOwner = address && currentOwner ? 
    address.toLowerCase() === (currentOwner as Address).toLowerCase() : false;

  // Transfer ownership function
  const transferOwnership = async (newOwner: Address) => {
    try {
      await writeContract({
        address: tokenWhitelistAddress,
        abi: TokenWhitelistABI,
        functionName: 'transferOwnership',
        args: [newOwner],
      });
    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      throw err;
    }
  };

  // Refresh owner after successful transfer
  React.useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetchOwner();
      }, 2000);
    }
  }, [isSuccess, refetchOwner]);

  return {
    currentOwner: currentOwner as Address | null,
    isCurrentUserOwner,
    isLoading,
    error: readError || writeError,
    
    transferOwnership,
    isTransferring: isPending || isConfirming,
    transferHash: hash || null,
    transferSuccess: isSuccess,
  };
}

// Hook to check ownership across all networks
export function useMultiNetworkOwnership() {
  const { activeChainId } = useActiveNetwork();
  const networks = [84532, 11155420]; // Base Sepolia, Optimism Sepolia
  
  const ownershipData = networks.map(chainId => {
    const contractAddresses = getContractAddresses(chainId);
    const { data: owner } = useReadContract({
      address: contractAddresses.tokenWhitelist,
      abi: TokenWhitelistABI,
      functionName: 'owner',
    });
    
    return {
      chainId,
      networkName: chainId === 84532 ? 'Base Sepolia' : 'Optimism Sepolia',
      owner: owner as Address | null,
      contractAddress: contractAddresses.tokenWhitelist,
    };
  });

  return ownershipData;
} 